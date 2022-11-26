//Required Modules
const mysql = require('mysql2/promise');
const logger = require('../logger');
const exceptions = require('./exceptions/errors');
const err = require('./exceptions/errors');
//Models
const user = require('./userModel');

//Global Fields
var connection;
var exception;


/**
 * Establishes the connection to the database and creates the category table
 * if it doesn't exist already.
 * @param {string} dbName Name of the database to connect to.
 * @throws User.databaseException if there are any issues.
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

            //drop the table if it exists
            var dropQuery = `DROP TABLE IF EXISTS post_it;`;
            await connection.execute(dropQuery);
            logger.info(`Table post_it dropped`);

            dropQuery = `DROP TABLE IF EXISTS category;`;
            await connection.execute(dropQuery);
            logger.info(`Table category dropped`);

            dropQuery = `DROP TABLE IF EXISTS user;`;
            await connection.execute(dropQuery)
            logger.info(`Table user dropped`);
        }

        //create a new table
        const sqlQuery = `CREATE TABLE IF NOT EXISTS category (category_id int AUTO_INCREMENT, user_id int, title VARCHAR(50), description VARCHAR(50), color_code VARCHAR(50), PRIMARY KEY(category_id),CONSTRAINT FK_user FOREIGN KEY(user_id) REFERENCES user(user_id));`;

        //execute command
        await connection.execute(sqlQuery);
        logger.info(`Table category created/exists`);
    } catch (error) {

        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
    }

}

/**
 * Insert a new row into the database using the input parameters.
 * @param {number} userId The ID of the user.
 * @param {string} title Title of the category.
 * @param {string} description Description of the category.
 * @param {string} colorCode Color associated with the category.
 * @returns Returns object containing the category's information.
 * @throws User.databaseException, categoryException
 */
async function createCategory(userId, title, description, colorCode) {

    //validate input parameters
    if (!validateTitle(title) || !validateDescription(description)) {
        logger.info(`Unable to add category, information is invalid`);
        exception = new exceptions.categoryException(`Unable to add category, information is invalid`);
        return exception;
    }

    //check if the category already exists in the database
    //create select query for title
    const selectTitleQuery = `SELECT * FROM category WHERE title='${title}';`;

    try {
        //execute select query for title
        const duplicateTitle = await connection.execute(selectTitleQuery);

        //check if the returned queries are not empty
        if (duplicateTitle[0].length != 0) {
            logger.info(`Unable to add category, category already exists`);
            exception = new exceptions.categoryException(`Unable to add category, category already exists`);
            throw exception;
        }

        const retrievedUser = await user.findById(userId);

        if (retrievedUser[0].length === 0 || retrievedUser === null || retrievedUser === undefined) {
            logger.info(`Only users can create categories`);
            exception = new exceptions.categoryException(`Only users can create categories`);
            return exception;
        }

        //create add query
        const addQuery = `INSERT INTO category (title, description, color_code, user_id) VALUES ('${title}','${description}','${colorCode}', ${userId});`;

        //execute add query
        await connection.execute(addQuery);
        logger.info(`Category added successfully`);

        //execute select query
        const retrievedCategory = await connection.execute(selectTitleQuery);

        //verify if the category was added to the database
        if (retrievedCategory[0][0] === null || retrievedCategory[0][0] === undefined) {
            logger.info(`Category was not added to database`);
            exception = new exceptions.categoryException(`Category was not added to database`);
            return exception;
        } else {
            return retrievedCategory;
        }

    } catch (error) {
        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
    }
}

/**
 * Retrieve the categoryId based on the assigned color. 
 * @param {*} colorCode The color code for the category.
 * @returns Returns the retrieved categoryId from the database.
 */
async function getCategoryIdByAssignedColor(colorCode) {

    try {
        const sqlQuery = `SELECT category_id FROM category WHERE color_code = '${colorCode}';`;
        const sqlReturn = await connection.execute(sqlQuery);
        if (sqlReturn[0] == undefined || sqlReturn[0]) {
            logger.info("Category with that color does not exist");
        }

        return sqlReturn[0];
    } catch (error) {
        logger.error(error.message);
        return new err.databaseException("Error accessing database");
    }

}



/**
 * Select a row from the database based on the title.
 * @param {string} title Title of the category.
 * @returns Returns the retrieved category from the database if found, otherwise returns null.
 * @throws User.databaseException, categoryException
 */
async function findByTitle(title) {

    //validate title input
    if (!validateTitle(title)) {
        logger.info(`Title is not valid`);
        exception = new err.categoryException(`Title is not valid`);
        return exception;
    }

    //create select query using title
    const selectQuery = `SELECT * FROM category WHERE title='${title}';`;

    try {
        //execute select query
        const retrievedCategory = await connection.execute(selectQuery);

        //check if the category exists in database
        if (retrievedCategory[0] == undefined || retrievedCategory[0].length == 0) {
            logger.info(`Category does not exist in database`);
            exception = new err.categoryException(`Category does not exist in database`);
            return exception;
        } else {
            logger.info(`Category found in database`);
            return retrievedCategory;
        }

    } catch (error) {

        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
    }
}



/**
 * Retrieve all categories retrieved from the database using the userId.
 * @param {*} id The id of the user logged in.
 * @returns Returns an array of all categories from the database.
 */
async function getAllCategoriesByUserId(id) {
    //check if id is a string
    if (typeof parseInt(id) === 'string') {
        logger.info(`Invalid Id`);
        exception = new categoryException(`Category does not exist in database`);

        return [];
    }
    //create select query using id
    const selectQuery = `SELECT * FROM category WHERE user_id=${id};`;

    try {
        //execute select query
        const retrievedCategory = await connection.execute(selectQuery);

        //check if the category exists in database
        if (retrievedCategory[0] == undefined || retrievedCategory[0].length == 0) {
            logger.info(`Category does not exist in database`);
            return [];
        } else {
            logger.info(`Category found in database`);
            return retrievedCategory[0];
        }
    } catch (error) {

        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
    }
}


/**
 * Select a row from the database based on the category's id.
 * @param {number} id Id of the category.
 * @returns Returns the retrieved category from the database if found, otherwise returns null.
 * @throws User.databaseException, categoryException
 */
async function findById(id) {

    //check if id is a string
    if (typeof parseInt(id) === 'string') {
        logger.info(`Invalid Id`);
        exception = new exceptions.categoryException(`Category does not exist in database`);
        return exception;
    }
    //create select query using id
    const selectQuery = `SELECT * FROM category WHERE category_id=${id};`;

    try {
        //execute select query
        const retrievedCategory = await connection.execute(selectQuery);

        //check if the category exists in database
        if (retrievedCategory[0] == undefined || retrievedCategory[0].length == 0) {
            logger.info(`Category does not exist in database`);
            exception = new exceptions.categoryException(`Category does not exist in database`);
            return exception;
        } else {
            logger.info(`Category found in database`);
            return retrievedCategory;
        }
    } catch (error) {

        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
    }
}

/**
 * Retrieves all categories from the database.
 * @returns All the categories retrieved from the database.
 * @throws User.databaseException, categoryException
 */
async function findAll() {

    //create select query
    const selectQuery = `SELECT * FROM category;`;

    try {
        //execute select query
        const categoryBank = await connection.execute(selectQuery);

        //check if there are any categories retrieved from the database
        if (categoryBank[0].length > 0) {
            logger.info(`Categories found in database`);
            return categoryBank;
        } else {
            logger.info(`Categories not found in database`);
            exception = new exceptions.categoryException(`Categories not found in database`);
            return exception;
        }
    } catch (error) {

        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
    }
}

/**
 * Retrieves all categories from the database.
 * @returns All the categories retrieved from the database.
 * @throws User.databaseException, categoryException
 */
async function findAllByUserId(userId) {

    //create select query
    const selectQuery = `SELECT * FROM category WHERE user_id =${userId}`;

    try {
        //execute select query
        const categoryBank = await connection.execute(selectQuery);

        //check if there are any categories retrieved from the database
        if (categoryBank[0].length > 0) {
            logger.info(`Categories found in database`);
            return categoryBank[0];
        } else {
            logger.info(`Categories not found in database`);
            exception = new exceptions.categoryException(`Categories not found in database`);
            return exception;
        }
    } catch (error) {

        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
    }
}

/**
 * Update the row in the database matching a given title parameter with the given the new description.
 * @param {string} title Title of the category to update.
 * @param {string} newDescription New description of the category to update.
 * @returns Returns updated category object if successful, otherwise return null.
 * @throws User.databaseException, categoryException
 */
async function updateCategory(title, newDescription) {

    //validate new description
    if (!validateDescription(newDescription)) {
        logger.info(`Category update failed, new information is invalid`);
        exception = new exceptions.categoryException(`Category update failed, new information is invalid`);
        return exception;
    }

    //create select query
    const selectQuery = `SELECT * FROM category WHERE title='${title}';`;

    try {
        //execute select query
        const retrievedCategory = await connection.execute(selectQuery);

        //find the index of the category to update
        const indexOfCategory = retrievedCategory[0].find((description => description != newDescription));

        //check if the category exists in the database
        if (indexOfCategory === undefined) {
            logger.info(`Category update failed, unable to find category`);
            exception = new exceptions.categoryException(`Category update failed, unable to find category`);
            return exception;
        } else {
            //create update query
            const updateQuery = `UPDATE category SET description='${newDescription}' WHERE title='${title}';`;

            //execute update query
            await connection.execute(updateQuery);

            //log success to console
            logger.info(`Description was updated successfully`);

            //execute select query for updated category
            const updatedCategory = await connection.execute(selectQuery);

            //return the retrieved updated category
            return updatedCategory;
        }
    } catch (error) {

        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
    }
}

/**
 *  Update the row in the database matching a given categoryId parameter with the given the new description, title and color code.
 * @param {*} id The id of the category to update.
 * @param {*} title The new title of the category to update.
 * @param {*} newDescription The new description of the category to update.
 * @param {*} colorCode The new color code of the category to update.
 * @returns 
 */
async function updateCategoryById(id, title, newDescription, colorCode) {

    //validate new description
    if (!validateDescription(newDescription)) {
        logger.info(`Category update failed, new information is invalid`);
        exception = new err.categoryException(`Category update failed, new information is invalid`);
        return exception;
    }

    //create select query
    const selectQuery = `UPDATE category SET title = '${title}', description = '${newDescription}', color_code = '${colorCode}' WHERE category_id = '${id}';`;

    try {
        //execute select query
        const exec = await connection.execute(selectQuery);


    } catch (error) {

        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
    }
}


/**
 * Delete the corresponding row from the database matching the given title.
 * @param {string} title Title of the category to delete.
 * @returns Return true if the category was removed successfully, otherwise return false.
 * @throws User.DatabaseException, categoryException
 */
async function deleteCategory(title) {

    //validate title input
    if (!validateTitle(title)) {
        logger.info(`Category delete failed,information is invalid.`);
        exception = new exceptions.categoryException(`Category delete failed,information is invalid.`);
        return exception;
    }

    //create delete query
    const deleteQuery = `DELETE FROM category WHERE title= '${title}';`;

    try {
        //execute delete query
        await connection.execute(deleteQuery);

        //create select query
        const selectQuery = `SELECT * FROM category WHERE title='${title}';`;

        //execute select query
        var row = await connection.execute(selectQuery);

        //check if the category exists in the database
        if (row[0].length === 0) {
            logger.info(`Category deleted successfully`);
            return true;
        } else {
            logger.info(`Category was NOT deleted successfully`);
            return false;
        }
    } catch (error) {

        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
    }
}

/**
 * Delete the corresponding row from the database matching the given id.
 * @param {number} id Id of the category to delete.
 * @returns Return true if the category was removed successfully, otherwise return false.
 * @throws User.DatabaseException, categoryException
 */
async function deleteCategoryById(id) {

    //validate title input
    //Change to id later
    if (!validateTitle(id)) {
        logger.info(`Category delete failed,information is invalid.`);
        exception = new exceptions.categoryException(`Category delete failed,information is invalid.`);
        return exception;
    }

    //create delete query
    const deleteQuery = `DELETE FROM category WHERE category_id= '${id}';`;

    try {
        //execute delete query
        await connection.execute(deleteQuery);

        //create select query
        const selectQuery = `SELECT * FROM category WHERE category_id='${id}';`;

        //execute select query
        var row = await connection.execute(selectQuery);

        //check if the category exists in the database
        if (row[0].length === 0) {
            logger.info(`Category deleted successfully`);
            return true;
        } else {
            logger.info(`Category was NOT deleted successfully`);
            return false;
        }
    } catch (error) {

        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
    }
}



/**
 * Checks if the given input value is a non empty string.
 * @param {string} description Description of the category.
 * @returns Returns true if the value is a non empty string, otherwise return false.
 */
function validateDescription(description) {
    if (typeof description === 'string') {
        if (description === ' ') {
            return false;
        } else {
            return true;
        }
    }
}

/**
 * Checks if the given input value is a non empty string.
 * @param {string} title Title of the category.
 * @returns Returns true if the value is a non empty string, otherwise return false.
 */
function validateTitle(title) {
    if (typeof title === 'string') {
        if (title === ' ') {
            return false;
        } else {
            return true;
        }
    }
}


/**
 * Retrieves all categories from the database.
 * @returns All the categories retrieved from the database.
 * @throws User.databaseException, categoryException
 */
 async function getColorByAssignedCategory(userId, categoryId) {

    //create select query
    const selectQuery = `SELECT * FROM category WHERE category_id='${categoryId}' AND user_id='${userId}';`;

    try {
        //execute select query
        const categoryBank = await connection.execute(selectQuery);

        //check if there are any categories retrieved from the database
        if (categoryBank[0].length > 0) {
            logger.info(`color found in database`);
            return categoryBank[0][0].color_code;
        } else {
            logger.info(`Categories not found in database`);
            exception = new err.categoryException(`Categories not found in database`);
            return exception;
        }
    } catch (error) {

        logger.error(error.message);
        exception = new exceptions.databaseException();
        return exception;
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
    createCategory,
    findByTitle,
    findById,
    findAll,
    updateCategory,
    deleteCategory,
    getConnection,
    deleteCategoryById,
    getCategoryIdByAssignedColor,
    getAllCategoriesByUserId,
    updateCategoryById,
    findAllByUserId,
    getColorByAssignedCategory

}