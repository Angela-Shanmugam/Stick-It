//Required Modules
const express = require('express');
const router = express.Router();
const { route } = require('express/lib/router');
const exceptions = require('../models/exceptions/errors');
const cookieParser = require('cookie-parser');
const { get } = require('express/lib/response');
const logger = require('../logger');
var app = express();
app.use(cookieParser());

//Available colors will be stored in this array
let availableColorsForUser = [];

//Models
const categoryModel = require('../models/categoryModel');
const userModel = require('../models/userModel');
const colorModel = require('../models/colorModel');

//Controller
const authController = require('../controllers/authController');

//Constants
const MAX_CATEGORIES = 8;

//Global fields
const routeRoot = '/';

/**
 * Sets the available colors that the user can use for their categories.
 */
async function setAvailableColors() {
    //Reset the array
    availableColors = [];

    const colorsFromDb = await colorModel.getAllColorNames();
    const username = authController.getUsername();
    const user = await userModel.findByUsername(username);
    const userId = 1; //username.user_id;

    const categoriesFromDB = await categoryModel.getAllCategoriesByUserId(userId);

}



/**
 * Renders page with provided success message. 
 * @param {string} message The success message for the CRUD operations.
 * @param {*} response Tracks status of the controller.
 */
function showCategoryMessage(message, response) {
    response.render('categoryPage.hbs', { message: message, colors: colors });
}

/**
 * Renders the error page with the given error message.
 * @param {string} message The failure message for the CRUD operations.
 * @param {number} status The status code for the failed operation.
 * @param {*} response Tracks status of the controller.
 */
function showCategoryError(message, status, response) {
    response.render('errorPage.hbs', { message: message, status: status });
}
/**
 * Deletes category associated with the id of the delete button pressed and then redirects to page with all categories.
 * @param {*} request request Input parameters given by the user.
 * @param {*} response response Tracks status of the controller.
 */
async function deleteSelected(request, response) {
    let theReturn = request.params.category_id;
    await categoryModel.deleteCategoryById(theReturn);

    response.redirect('/categories');
  
}
/**
 * Renders the forms to operate a category.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks status of the controller.
 */
async function createAddCategoryForm(request, response) {
    // Getting the data to create the page from the model

    if (!authController.authenticateUser(request)) {
        authController.showAuthenticationError(`Unauthorized access`, 401, response);
    }

    //getting user
    const user = await userModel.findByUsername(authController.getUsername());
    const userId = user.user_id;

    // get all available colors in database
    const availableColors = await colorModel.getAvailableColorNames();

    // get all categories already used by user id
    const allCategoriesUsed = await categoryModel.getAllCategoriesByUserId(userId);

    //max check
    if(allCategoriesUsed.length >= MAX_CATEGORIES){
        console.log("error too many cat");
    }

    const colorArray = availableColors[0];

    availableColorsForUser;
    //ensure array isnt undefined
    if(colorArray != undefined){   
        //Add only colors that arent attatched to category
        availableColorsForUser = colorArray.filter(function(color){
            //By default return true unless its found in 
            let addToArray = true;
            //Loop through each category to compare color, if theres a match, set bool to false
            allCategoriesUsed.forEach(element => {
            if(element.color_code === color.color_code){
                addToArray = false;
            }
        });
        return addToArray;
        })
    }

    if(availableColorsForUser){
        const pageData = {
            displayVisitorNavBar: false,
            displayLoggedInUser: true,
            loggedInOptionsNavBar: authController.LOGGED_IN_NAV_BAR,
            logoutSettingsNavBar: authController.getLogOutNavBar(),
            username: authController.getUsername(),
            message: "Add Category",
            colors: availableColorsForUser
        }
        response.render('addCategory.hbs', pageData);
    }
    else{
        showCategoryError("Error retrieving colors", 500, response);
    }
}
router.get('/category', createAddCategoryForm);


/**
 * Gets the input from the add category form.
 * @param {*} request 
 * @param {*} response 
 */
async function getCategoryFormInput(request, response) {
    try {

        if (!authController.authenticateUser(request)) {
            authController.showAuthenticationError(`Unauthorized access`, 401, response);
        }
        const user = await userModel.findByUsername(authController.getUsername());
        const userId = user.user_id;


        await categoryModel.createCategory(userId, request.body.name, request.body.description, request.body.color);
        //set category in color table
        const newCategory = await categoryModel.getCategoryIdByAssignedColor(request.body.color);

        response.redirect('/categories');

    } catch (error) {

        console.log(error);

    }
}
router.post('/categoryform', getCategoryFormInput);


/**
 * Shows a specific category.
 * @param {*} request Data given to find category.
 * @param {*} response Contains the data to inform the user about the status of the category.
 */
async function showCategory(request, response) {
    try {
        //find category in database
        const category = await categoryModel.findByTitle(request.query.title);

        //check if the search was successful
        if (category instanceof exceptions.categoryException) {
            showCategoryError('Category NOT found!', 400, response);
        } else if (category) {
            showCategoryMessage(`Category: ${category[0][0].title} was found successfully!`, response);
        }

    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showCategoryError('Database error! Unable to find Category', 500, response);
        } else if (error instanceof exceptions.userException) {
            showCategoryError('Unexpected error with User.', 400, response);
        } else if (error instanceof exceptions.categoryException) {
            showCategoryError('Category NOT found!', 400, response);
        } else {
            showCategoryError('Unexpected error trying to find category.', 500, response);
        }
    }
}

/**
 * Shows all categories in the database.
 * @param {*} request Data given to show category.
 * @param {*} response Contains the data to inform the user about the status of the category.
 */
async function showAllCategories(request, response) {
    try {
        //response.render('showAllCategories');
        //retrieve the categories from the database
        //const category = await categoryModel.findAll();

        //Get categories belonging to the user that is logged in
        const username = authController.getUsername();
        const user = await userModel.findByUsername(username);
        const category = await categoryModel.getAllCategoriesByUserId(user.user_id);

        //check if the search was successful
        if (category instanceof exceptions.categoryException) {
            showCategoryError('Categories NOT found!', 400, response);
        } else if (category) {
            // allCategories('Categories found successfully!', category[0], response);
            const pageData = {
                displayVisitorNavBar: false,
                displayLoggedInUser: true,
                loggedInOptionsNavBar: authController.LOGGED_IN_NAV_BAR,
                logoutSettingsNavBar: authController.getLogOutNavBar(),
                username: authController.getUsername(),
                category: category

            };
            response.render('showAllCategories.hbs', pageData);
        }

    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showCategoryError('Database error! Unable to find Categories', 500, response);
        } else if (error instanceof exceptions.userException) {
            showCategoryError('Unexpected error with User.', 400, response);
        } else if (error instanceof exceptions.categoryException) {
            showCategoryError('Categories NOT found!', 400, response);
        } else {
            showCategoryError('Unexpected error trying to find categories.', 500, response);
        }
    }
}
router.get('/categories', showAllCategories);

/**
 * Edit a specific category in the database.
 * @param {*} request Data given to update category.
 * @param {*} response Contains the data to inform the user about the status of the category.
 */
async function updateCategory(request, response) {
    try {
        //update category in the model
        const category = await categoryModel.updateCategory(request.body.title, request.body.description);

        //check if the update was successful
        if (category instanceof exceptions.categoryException) {
            showCategoryError('Category NOT updated!', 400, response);
        } else if (category) {
            showCategoryMessage(`Category: ${category[0][0].title} was updated successfully!`, response);
        }
    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showCategoryError('Database error! Unable to update Category', 500, response);
        } else if (error instanceof exceptions.userException) {
            showCategoryError('Unexpected error with User.', 400, response);
        } else if (error instanceof exceptions.categoryException) {
            showCategoryError('Category NOT updated!', 400, response);
        } else {
            showCategoryError('Unexpected error trying to update category.', 500, response);
        }
    }
}

/**
 * Delete a specific category from the database.
 * @param {*} request Data given to delete category.
 * @param {*} response Contains the data to inform the user about the status of the category.
 */
async function destroyCategory(request, response) {
    try {
        //delete the category in the model
        const category = await categoryModel.deleteCategory(request.body.title);

        //check if the delete was successful
        if (category instanceof exceptions.categoryException) {
            showCategoryError('Category NOT deleted!', 400, response);
        } else if (category) {
            showCategoryMessage(`Category with title: ${request.body.title} was deleted successfully!`, response);
        }

    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showCategoryError('Database error! Unable to delete Category', 500, response);
        } else if (error instanceof exceptions.userException) {
            showCategoryError('Unexpected error with User.', 400, response);
        } else if (error instanceof exceptions.categoryException) {
            showCategoryError('Category NOT deleted!', 400, response);
        } else {
            showCategoryError('Unexpected error trying to delete category.', 500, response);
        }
    }
}

router.post('/category/delete/:category_id', deleteSelected);

//Gets id of category and then updates the properties of the category associated with that id
async function updateSelectedCategory(request, response) {

    if (!authController.authenticateUser(request)) {
        authController.showAuthenticationError(`Unauthorized access`, 401, response);
    }

    const user = await userModel.findByUsername(authController.getUsername());
    const userId = user.user_id;

    const categoryId = request.params.id;
    const theCategory = await categoryModel.findById(categoryId);

    // gets all the categories already used by the user
    const allCategories = await categoryModel.getAllCategoriesByUserId(userId);

    const availableColorsFromDb = await colorModel.getAvailableColorNames();
    const colorArray = availableColorsFromDb[0];

    let tempColors
    //ensure array isnt undefined
    if(colorArray != undefined){   
        //Add only colors that arent attatched to category
        tempColors = colorArray.filter(function(color){
            //By default return true unless its found in 
            let addToArray = true;
            //Loop through each category to compare color, if theres a match, set bool to false
        allCategories.forEach(element => {
            if(element.color_code === color.color_code){
                addToArray = false;
            }
        });
        return addToArray;
    })}

    availableColors = [];
    if (colorArray != undefined) {
        let tempColors = colorArray.filter(function(color) {
            allCategories.forEach(element => {
                if (element.color_code === color.color_code) {
                    return false;
                }
            });
            availableColors.push(color);
            return true;
        })
    }

    const pageData = {
        category: theCategory[0][0],
        colors: tempColors
    }
    response.render('updateCategory.hbs', pageData);


}

router.post('/category/update/:id', updateSelectedCategory);

async function updateInput(request, response) {

    const id = request.body.id;
    const title = request.body.name;
    const desc = request.body.description;
    const color = request.body.color;

    const temp = await categoryModel.updateCategoryById(id, title, desc, color);
    logger.info('Update successful');

    response.redirect('./categories');

}
router.post('/updated', updateInput);


module.exports = {
    router,
    routeRoot,
    createAddCategoryForm,
    showCategory,
    showAllCategories,
    updateCategory,
    destroyCategory,
    showCategoryMessage,
    showCategoryError,
    deleteSelected,
    setAvailableColors,
    updateSelectedCategory,
}