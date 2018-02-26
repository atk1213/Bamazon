var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table2");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "bamazon_db"
});

function start() {
    inquirer
        .prompt({
            name: "initialize",
            type: "confirm",
            message: "Would you like to purchase something today?",
            default: true
        })
        .then(function (answer) {
            if (answer.initialize) {
                startBamazon();
            }
            else {
                console.log("Okay, we'll see you again next time!");
            }
        });
};

connection.connect(function (error) {
    if (error) {
        console.log(error);
    }
    console.log(`Connect as id${connection.threadId}`);
    console.log("Welcome to Bamazon!")
    start();
});

function makeTable(results) {
    var table = new Table({
        head: ["Item ID", "Product Name", "Department", "Price", "In Stock"],
        colWidths: [12, 50, 30, 10, 10]
    });
    for (var j = 0; j < results.length; j++) {
        table.push([results[j].item_id, results[j].product_name, results[j].department_name, results[j].price, results[j].stock_quantity]);
    }
    console.log(table.toString());
};

function startBamazon() {
    console.log("")
    connection.query("SELECT * FROM products", function (error, results) {
        if (error) throw error;
        makeTable(results);
        inquirer
            .prompt([
                {
                    name: "item",
                    type: "input",
                    message: "Input the Item ID you like to purchase:",
                    validate: function (value) {
                        if (isNaN(value) === false) {
                            return true
                        } 
                        else {
                            console.log("Please choose an Item ID from the list above.");
                            return false;
                        }
                    }
                },
                // had difficulty validating against improper input of item id codes. try to come back to this later 

                {
                    name: "quantity",
                    type: "input",
                    message: "How many would you like to buy?",
                    validate: function (value) {
                        if (isNaN(value) === false && parseInt(value) > 0) {
                            return true
                        }
                        else {
                            console.log("That is not a valid number.");
                            return false;
                        }
                    }
                }
            ])
            .then(function (answer) {
                var chosenItem;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].item_id === parseInt(answer.item)) {
                        chosenItem = results[i];
                    }
                };
                var orderQuantity = parseInt(answer.quantity);
                var currentStock = parseInt(chosenItem.stock_quantity);
                if (currentStock < orderQuantity) {
                    console.log("Something went wrong! We do not have enough in stock to fulfill your order.");
                    console.log("Please check your order and try again.");
                    start();
                }
                if (currentStock > orderQuantity) {
                    var updatedStock = currentStock - orderQuantity;
                    connection.query(
                        "UPDATE products SET ? WHERE ?",
                        [{
                            stock_quantity: updatedStock
                        },
                        {
                            item_id: chosenItem.item_id
                        }
                        ],
                        function (error) {
                            if (error) throw error;
                            var totalCost = chosenItem.price * answer.quantity
                            console.log("Your total is $" + totalCost);
                            inquirer
                                .prompt({
                                    name: "initialize",
                                    type: "confirm",
                                    message: "Would you like to start again?",
                                    default: true
                                })
                                .then(function (answer) {
                                    if (answer.initialize) {
                                        start();
                                    }
                                    else {
                                        console.log("Okay, we'll see you again next time!");
                                    }
                                });
                        }
                    );
                }
            });
    });
}
