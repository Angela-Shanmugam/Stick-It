//Required Modules
const mysql = require('mysql2/promise');
const logger = require('../logger');
const exceptions = require('./exceptions/errors');
const err = require('./exceptions/errors');


//Global Fields
var connection;
var exception;

/**
 * Establishes the connection to the database and creates the user table
 * if it doesn't exist already.
 * @param {string} dbName Name of the database to connect to.
 * @param {boolean} reset Verifies if the database needs to be reset before initializing.
 * @throws databaseException if there is any issues.
 */
async function initialize(dbName, reset) {
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            port: '10000',
            password: 'pass',
            database: dbName
        });

        //verify if the database needs to be reset
        if (reset) {

            //drop the linked tables and user table
            var dropQuery = `DROP TABLE IF EXISTS post_it;`;
            const postItResults = await connection.execute(dropQuery);
            logger.info(`Table post_it dropped`);

            dropQuery = `DROP TABLE IF EXISTS color;`;
            const colorResults = await connection.execute(dropQuery);
            logger.info(`Table color dropped`);

            dropQuery = `DROP TABLE IF EXISTS category;`;
            const categoryResults = await connection.execute(dropQuery);
            logger.info(`Table category dropped`);

            dropQuery = `DROP TABLE IF EXISTS user;`;
            const userResults = await connection.execute(dropQuery)
            logger.info(`Table user dropped`);
        }

        //create a new table
        const sqlQuery = `CREATE TABLE IF NOT EXISTS user (user_id int AUTO_INCREMENT, username VARCHAR(30), email VARCHAR(50), password VARCHAR(50), icon VARCHAR(400), PRIMARY KEY(user_id))`;

        //execute command
        await connection.execute(sqlQuery);
        logger.info(`Table user created/exists`);

    } catch (error) {
        logger.error(error.message);
        exception = new exceptions.databaseException(error.message);
        return exception;
    }
}

/**
 * Validates user input and verifies if the user exists in the database.
 * @param {string} email Email of the user to be logged in.
 * @param {string} password Password of the user to be logged in. 
 * @returns Returns logged in user. 
 */
async function login(email, password) {
    //check if the email is valid
    if (!validateEmail(email)) {
        logger.error(`Invalid email: Email must contain '@' and '.'`);
        exception = new exceptions.authException(`Invalid email: Email must contain '@' and '.'`);
        return exception;
    }

    //check if the password is valid
    if (!validatePassword(password)) {
        logger.error(`Password must be at least 8 characters long.`);
        exception = new exceptions.authException(`Password must be at least 8 characters long.`);
        return exception;
    }

    //create select query
    const selectQuery = `SELECT * FROM user WHERE email = '${email}' AND password = '${password}';`;

    try {
        //execute command
        const results = await connection.execute(selectQuery);

        //log info
        logger.info('User logged in');

        //check if the user exists
        if (results[0]) {
            return results[0][0];
        } else {
            logger.error(`Invalid credentials: Unable to log in user.`);
            exception = new exceptions.userException(`Invalid credentials: Unable to log in user.`);
            return exception;
        }

    } catch (error) {
        logger.error(error);
        exception = new exceptions.databaseException(error.message);
        return exception;
    }
}

/**
 * Insert a new row into the database using the input parameters.
 * @param {string} username Username of the user.
 * @param {string} email Email of the user.
 * @param {string} password Password of the user.
 * @returns Returns object containing user's information.
 * @throws databaseException, userException
 */
async function createUser(username, email, password, icon) {

    //validate input parameters
    if (!validateUsername(username) || !validateEmail(email) || !validatePassword(password)) {
        logger.info(`Unable to add user, information is invalid`);
        exception = new exceptions.userException(`Unable to add user, information is invalid`);
        return exception;
    }

    icon = 'https://icon-library.com/images/default-user-icon/default-user-icon-8.jpg';

    //check if the user already exists in the database
    const duplicateUsername = await findByUsername(username);
    const duplicateEmail = await findByEmail(email);

    if (!(duplicateUsername instanceof exceptions.userException || duplicateUsername instanceof exceptions.databaseException) || !(duplicateEmail instanceof exceptions.userException || duplicateEmail instanceof exceptions.databaseException)) {
        logger.info(`Unable to add user, user already exists`);
        exception = new exceptions.userException(`Unable to add user, user already exists`);
        return exception;
    }

    //create select query
    const selectUsernameQuery = `SELECT * FROM user WHERE username='${username}';`;

    //create add query
    const addQuery = `INSERT INTO user (username, email, password, icon) VALUES ('${username}','${email}','${password}', '${icon}');`;

    try {
        //execute add query
        await connection.execute(addQuery)
        logger.info(`User added successfully`);

        //execute select query
        const retrievedUser = await connection.execute(selectUsernameQuery);

        //verify if the user was added to the database
        if (retrievedUser[0][0]) {
            return retrievedUser[0][0];
        } else {
            logger.info(`User was not added to database`);
            exception = new exceptions.userException(`User was not added to database`);
            return exception;
        }
    } catch (error) {
        logger.error(error.message);
        exception = new exceptions.databaseException(error.message);
        return exception;
    }
}

/**
 * Select a row from the database based on the email.
 * @param {string} email Email of the user.
 * @returns Returns the retrieved user from the database if found, otherwise returns null.
 * @throws databaseException, userException
 */
async function findByEmail(email) {

    //validate email input
    if (!validateEmail(email)) {
        logger.info(`Email is not valid.`);
        exception = new exceptions.userException(`Email is not valid.`);
        return exception;
    }

    //create select query using email
    const selectQuery = `SELECT * FROM user WHERE email='${email}';`;

    try {
        //execute select query
        const retrievedUser = await connection.execute(selectQuery);

        //check if the user exists in database
        if (retrievedUser[0][0]) {
            //return retrievedUser
            logger.info(`User found in database`);
            return retrievedUser[0][0];
        } else {
            logger.info(`User does not exist in database`);
            exception = new exceptions.userException(`User does not exist in database`);
            return exception;
        }
    } catch (error) {
        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
    }
}

/**
 * Select a row from the database based on the username.
 * @param {string} username Username of the user.
 * @returns Returns the retrieved user from the database if found, otherwise returns null.
 * @throws databaseException, userException
 */
async function findByUsername(username) {

    //validate username input
    if (!validateUsername(username)) {
        logger.info(`Username is not valid.`);
        exception = new exceptions.userException(`Username is not valid.`);
        return exception;
    }

    //create select query using username
    const selectQuery = `SELECT * FROM user WHERE username='${username}';`;

    try {
        //execute select query
        const retrievedUser = await connection.execute(selectQuery);

        //check if the user exists in database
        if (retrievedUser[0][0]) {
            //return retrievedUser
            logger.info(`User found in database`);
            return retrievedUser[0][0];
        } else {
            logger.info(`User does not exist in database`);
            exception = new exceptions.userException(`User does not exist in database`);
            return exception;
        }
    } catch (error) {
        logger.error(error.message);
        exception = new exceptions.databaseException(error.message);
        return exception;
    }
}

/**
 * Select a row from the database based on the user's id.
 * @param {number} id Id of the user.
 * @returns Returns the retrieved user from the database if found, otherwise returns null.
 * @throws databaseException, userException
 */
async function findById(id) {
    //check if id is a string
    if (typeof parseInt(id) === 'string') {
        logger.info(`Invalid Id`);
        exception = new exceptions.userException(`User does not exist in database.`);
        return exception;
    }

    //create select query using id
    const selectQuery = `SELECT * FROM user WHERE user_id= ${id};`;

    try {
        //execute select query
        const retrievedUser = await connection.execute(selectQuery);

        //check if the user exists in database
        if (retrievedUser[0]) {
            //return retrievedUser
            logger.info(`User found in database.`);
            return retrievedUser[0];

        } else {
            logger.info(`User does not exist in database.`);
            exception = new exceptions.userException(`User does not exist in database.`);
            return exception;
        }
    } catch (error) {
        logger.error(error.message);
        exception = new exceptions.databaseException(error.message);
        return exception;
    }
}

/**
 * Retrieves all users from the database.
 * @returns All the users retrieved from the database.
 * @throws databaseException, userException
 */
async function findAll() {
    //create select query
    const selectQuery = `SELECT * FROM user`;

    try {

        //execute select query
        const userBank = await connection.execute(selectQuery);

        //check if there are any users retrieved from the database
        if (userBank[0].length > 0) {
            logger.info(`Users found in database.`);
            return userBank;
        } else {
            logger.info(`Users not found in database.`);
            exception = new exceptions.userException(`Users not found in database.`);
            return exception;
        }
    } catch (error) {
        logger.error(error.message);
        exception = new exceptions.databaseException(error.message);
        return exception;
    }
}

/**
 * Update the row in the database matching a given email parameter with the given the new username and password.
 * @param {string} userEmail Email of the user to update.
 * @param {string} newUsername New username of the user to update.
 * @param {string} newPassword New password of the user to update.
 * @param {string} newIcon New icon of the user to update.
 * @returns Returns updated user object if successful, otherwise return null.
 * @throws databaseException, userException
 */
async function updateUser(userEmail, newUsername, newPassword, newIcon) {

    //create select query
    const selectQuery = `SELECT * FROM user WHERE email='${userEmail}';`;

    //check if there is a username to update
    if (newUsername != '') {
        if (validateUsername(newUsername)) {
            const updateUsernameQuery = `UPDATE user SET username='${newUsername}' WHERE email='${userEmail}';`;

            try {
                const results = await connection.execute(updateUsernameQuery);
                //for unit tests
                const temp = results;
                logger.info(`Username was updated successfully.`);

            } catch (error) {
                logger.error(error.message);
                exception = new exceptions.databaseException(error.message);
                return exception;
            }
        }
    }

    //check if there is a password to update
    if (newPassword != '') {
        if (validatePassword(newPassword)) {
            const updatePasswordQuery = `UPDATE user SET password='${newPassword}' WHERE email='${userEmail}';`;

            try {
                const results = await connection.execute(updatePasswordQuery);
                //for unit tests
                const temp = results;
                logger.info(`Password was updated successfully.`);

            } catch (error) {
                logger.error(error.message);
                exception = new exceptions.databaseException(error.message);
                return exception;
            }
        }
    }

    //check if there is an icon to update
    if (newIcon != '') {
        const updateIconQuery = `UPDATE user SET icon='${newIcon}' WHERE email='${userEmail}';`;

        try {
            const results = await connection.execute(updateIconQuery);
            //for unit tests
            const temp = results;
            logger.info(`Password was updated successfully.`);

        } catch (error) {
            logger.error(error.message);
            exception = new exceptions.databaseException(error.message);
            return exception;
        }
    }

    try {
        //execute select query for updated user
        const updatedUser = await connection.execute(selectQuery);

        //check if a user was retrieved
        if (!updatedUser[0][0]) {
            logger.error(`User was NOT updated.`);
            exception = new exceptions.userException(`User was NOT updated.`);
            return exception;
        }

        //return the retrieved updated user
        return updatedUser[0][0];

    } catch (error) {
        logger.error(error.message);
        exception = new exceptions.databaseException(error.message);
        return exception;
    }
}

/**
 * Delete the corresponding row from the database matching the given email.
 * @param {string} email Email of the user to delete.
 * @returns Return true if the user was removed successfully, otherwise return false.
 * @throws databaseException, userException
 */
async function deleteUser(email) {

    //validate email input
    if (!validateEmail(email)) {
        logger.info(`User delete failed,information is invalid.`);
        exception = new exceptions.userException(`User delete failed,information is invalid.`);
        return exception;
    }

    //create delete query
    const deleteQuery = `DELETE FROM user WHERE email= '${email}';`;

    //create select query
    const selectQuery = `SELECT * FROM user WHERE email= '${email}';`;

    try {

        //execute delete query
        await connection.execute(deleteQuery);

        //execute select query
        var row = await connection.execute(selectQuery);

        //check if the user exists in the database
        if (row[0].length === 0) {
            logger.info(`User deleted successfully`);
            return true;
        } else {
            logger.info(`User NOT deleted successfully`);
            return false;
        }
    } catch (error) {
        logger.error(error.message);
        exception = new exceptions.databaseException(error.message);
        return exception;
    }
}

/**
 * Checks if the given input value is a non empty string.
 * @param {string} password Password of the user.
 * @returns Returns true if the value is a non empty string, otherwise return false.
 */
function validatePassword(password) {
    if (typeof password === 'string') {
        if (password.length >= 8) {
            return true;
        } else {
            return false;
        }
    }
}

/**
 * Checks if the given input value is a non empty string.
 * @param {string} email Email of the user.
 * @returns Returns true if the value is a non empty string, otherwise return false.
 */
function validateEmail(email) {
    if (typeof email === 'string') {
        if (email.includes('@') && email.includes('.')) {
            return true;
        } else {
            return false;
        }
    }
}

/**
 * Checks if the given input value is a non empty string.
 * @param {string} username Username of the user.
 * @returns Returns true if the value is a non empty string, otherwise return false.
 */
function validateUsername(username) {
    if (typeof username === 'string') {
        if (username === ' ') {
            return false;
        } else {
            return true;
        }
    }
}

/**
 * Returns connection information.
 * @returns Returns connection information.
 */
function getConnection() {
    return connection;
}

module.exports = {
    initialize,
    login,
    createUser,
    findByEmail,
    findByUsername,
    findById,
    findAll,
    updateUser,
    deleteUser,
    getConnection
}