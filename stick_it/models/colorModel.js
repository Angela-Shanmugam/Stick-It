//Modules
const mysql = require("mysql2/promise");
const logger = require("../logger");
const category = require("./categoryModel");
const exceptions = require('./exceptions/errors');
const err = require('./exceptions/errors');
//Model
const categoryModel = require('./categoryModel');

var connection;
var exception;

//Store available colors
let availableColors = [];

//Objects containing color and their code. Should have 15 values (will add more later).
const colors = [
    { color: "Red", code: "FF4763" },
    { color: "Yellow", code: "FFFA99" },
    { color: "Green", code: "A9E69F" },
    { color: "Blue", code: "9AC1B5" },
    { color: "Purple", code: "C5A6C9" },
    { color: "Lavender", code: "D2D2DB"},
    { color: "Pink", code: "FF5C74" },
    { color: "White", code: "FFFFFF" },
];



/**
 * Establishes the connection to the database and creates the postIt table
 * if it doesn't exist already.
 * @param {string} dbName Name of the database to connect to.
 * @throws User.databaseException if there are any issues.
 */
async function initialize(dbname, reset) {
    try {
        connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            port: "10000",
            password: "pass",
            database: dbname,
        });

        if (reset) {
            let dropQuery = `DROP TABLE IF EXISTS post_it;`;
            await connection.execute(dropQuery);
            logger.info(`Table post_it dropped.`);

            // dropQuery = `DROP TABLE IF EXISTS color;`;
            // await connection.execute(dropQuery);
            // logger.info(`Table color dropped.`);

            dropQuery = `DROP TABLE IF EXISTS category;`;
            await connection.execute(dropQuery);
            logger.info(`Table category dropped.`);

            dropQuery = `DROP TABLE IF EXISTS user;`;
            await connection.execute(dropQuery);
            logger.info(`Table user dropped.`);
        }
        //Create color table and fill it with default values
        //await resetColorTable();
        await setColorTableToDefault(true);
    } catch (error) {
        logger.error(error.message);
        exception = new err.databaseException();
        return exception;
    }
}

/**
 * Resets the color table and insert the color name and color hex codes.
 * @param {*} reset Boolean flag to reset the table.
 */
async function setColorTableToDefault(reset) {
    //Reset Table
    try {
        if(reset){
            await resetColorTable();
        colors.forEach(async(color) => {
            const sqlQuery = `INSERT INTO color (color_name, color_code) VALUES ('${color.color}', '${color.code}');`;
            await connection.execute(sqlQuery);
            logger.info(`'${colors.color}' added to color table.`);
        });
    }
    } catch (error) {
        logger.error(error.message);
        throw new err.databaseException(
            "Error connecting to database. Check Database connection."
        );
    }
}

/**
 * Drops and recreates the the color table.
 */
async function resetColorTable() {
    try {
        const dropQuery = `DROP TABLE IF EXISTS color;`;
        await connection.execute(dropQuery);
        logger.info(`Table color dropped.`);

        const sqlQuery = `CREATE TABLE IF NOT EXISTS color (color_id int AUTO_INCREMENT, color_name VARCHAR(20), color_code VARCHAR(8), PRIMARY KEY(color_id));`;
        await connection.execute(sqlQuery);
    } catch (error) {
        logger.error(error.message);
        throw new err.databaseException(
            "Error resetting database. Check database connection."
        );
    }
}

/**
 * Gets all the colors available in the database.
 * @returns A list of colors from the color table.
 */
async function getAvailableColorNames() {
    const sqlQuery = `SELECT * from color;`;

    try {
        const allColors = await connection.execute(sqlQuery);

        if (allColors == undefined || allColors[0].length == 0) {
            logger.info("Colors do not exist in the database.");
            throw new err.colorException();
        } else {
            logger.info("Colors exist in database.");
            return allColors;
        }
    } catch (error) {
        logger.error(error.message);
        return new err.databaseException();
    }
}

/**
 * Gets all the name of the colors available in the database.
 * @returns A list of colors from the color table.
 */
async function getAllColorNames() {
    //Query
    const selectQuery = `SELECT * FROM color;`;
    try {
        const tableResults = await connection.execute(selectQuery);
        if (tableResults[0].length > 0) {
            logger.info(`Colors found in database`);
            return tableResults[0];
        } else {
            logger.info(`Colors not found in database`);
            throw new colorException("Default colors not present in databse.");
        }
    } catch (error) {
        logger.error(error.message);
        return new err.databaseException("Could not retrieve colors")
    }
}


module.exports = {
    initialize,
    getAvailableColorNames,
    getAllColorNames
};