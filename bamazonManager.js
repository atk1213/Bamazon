var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table2");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "Time2learn1213",
    database: "bamazon_db"
});

connection.connect(function (error) {
    if (error) {
        console.log(error);
    }
    console.log(`Connect as id${connection.threadId}`);
    console.log("Welcome Back")
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

function start() {
    inquirer
        .prompt({
            name: "options",
            type: "list",
            message: "Please select from the following options:",
            choices: [
                "View Products for Sale",
                "View Low Inventory",
                "Add to Inventory",
                "Add New Product",
            ]
        })
        .then(function (answer) {
            switch (answer.options) {
                case "View Products for Sale":
                    viewProducts();
                    break;
                case "View Low Inventory":
                    lowInventory();
                    break;
                case "Add to Inventory":
                    addStock();
                    break;
                case "Add New Product":
                    addNewItem();
                    break;
            }
        });
};

function viewProducts() {
    connection.query("SELECT * FROM products", function (error, results) {
        if (error) throw error;
        makeTable(results);
    });
};
function lowInventory() {
    connection.query("SELECT * FROM products WHERE stock_quantity < 5", function (error, results) {
        // check functionality after creating add inventory or add stock function
        if (error) throw error;
        if (results.length < 1) {
            console.log("Currently, there are at least 5 of each item in stock.")
        }
        else {
            makeTable(results);
        }
    });
};
function addStock() {
    connection.query("SELECT * FROM products", function (error, results) {
        if (error) throw error;
        makeTable(results);
        inquirer
            .prompt([
                {
                    name: "item",
                    type: "input",
                    message: "Input the Item ID you like to add inventory to:",
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
                {
                    name: "quantity",
                    type: "input",
                    message: "How many would you like to add?",
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
                var addQuantity = parseInt(answer.quantity);
                var currentStock = parseInt(chosenItem.stock_quantity);
                var updatedStock = currentStock + addQuantity;
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
                        console.log("You have updated the inventory of item '" + chosenItem.product_name + "' from " + currentStock + " to " + updatedStock);
                        inquirer
                            .prompt({
                                name: "initialize",
                                type: "confirm",
                                message: "Do you need to do anything else?",
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
            });
    });
};
function addNewItem() {
    inquirer
        .prompt([
            {
                name: "id",
                type: "input",
                message: "Please enter the Item ID of the product you would like to add to the inventory.",
                validate: function (value) {
                    if (isNaN(value) === false && parseInt(value) > 0) {
                        return true
                    }
                    else {
                        console.log("That is not a valid number.");
                        return false;
                    }
                }
            },
            {
                name: "name",
                type: "input",
                message: "Please enter the name of the product you would like to add.",
            },
            {
                name: "department",
                type: "input",
                message: "Please enter the department name of the product you are adding.",
            },
            {
                name: "price",
                type: "input",
                message: "Please enter the price of the product.",
                validate: function (value) {
                    if (isNaN(value) === false && parseFloat(value) > 0) {
                        return true
                    }
                    else {
                        console.log("That is not a valid number.");
                        return false;
                    }
                }
            },
            {
                name: "quantity",
                type: "input",
                message: "Please enter the amount you will be putting in inventory.",
                validate: function (value) {
                    if (isNaN(value) === false && parseInt(value) > 0) {
                        return true
                    }
                    else {
                        console.log("That is not a valid number.");
                        return false;
                    }
                }
            },
        ])
        .then(function (answer) {
            connection.query(
                "INSERT INTO products SET ?",
                {
                    item_id: answer.id,
                    product_name: answer.name,
                    department_name: answer.department,
                    price: answer.price,
                    stock_quantity: answer.quantity
                },
                function (err) {
                    if (err) throw err;
                    console.log("Product was added successfully!");
                    inquirer
                            .prompt({
                                name: "initialize",
                                type: "confirm",
                                message: "Do you need to do anything else?",
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
        })
}