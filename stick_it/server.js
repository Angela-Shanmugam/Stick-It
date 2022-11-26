'use strict';

//Variables for the server
var http = require('http');
var port = 1339
const app = require('./app.js');
const userModel = require('./models/userModel');
const categoryModel = require('./models/categoryModel');
const postItModel = require('./models/postItModel');
const colorModel = require('./models/colorModel');

let dbName = process.argv[2];
if (!dbName) {
    dbName = 'bulletin_board';
}

var reset = false;

userModel.initialize('bulletin_board', reset);
categoryModel.initialize('bulletin_board', reset);
postItModel.initialize('bulletin_board', reset);
colorModel.initialize('bulletin_board', reset);


//Run the server
app.listen(port)