//Required Modules
const { response } = require('express');
const express = require('express');
const exceptions = require('../models/exceptions/errors');
const router = express.Router();

//Model
const userModel = require('../models/userModel');

//Global Fields
const routeRoot = '/';

/**
 * Renders the current page with the given error message.
 * @param {string} message The failure message for the CRUD operations.
 * @param {number} status The status code for the failed operation.
 * @param {*} response Tracks status of the controller.
 */
function showUserError(message, status, response) {

    const pageData = {
        displayUserNavBar: false,
        displayHomePage: true,
        displayLoggedInUser: false,
        displayLoggedOutMessage: false,
        alertMessage: message,
        userNavBarContent: [
            { title: 'Login', path: '/login' },
            { title: 'Sign Up', path: '/register' }
        ],
        navBarContent: [{ id: 'about-us', title: 'About us', path: '.' }]
    };

    response.status(status);
    response.render('homePage.hbs', pageData);
}

/**
 * Renders the current page with the given error message.
 * @param {string} message The failure message for the CRUD operations.
 * @param {number} status The status code for the failed operation.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks status of the controller.
 */
function showUserProfileError(message, status, request, response) {

    const pageData = {
        logoutTitle: 'Logout',
        logoutPath: '/logout',
        alertMessage: message,
        username: request.body.username,
        email: request.params.email,
        icon: request.body.icon
    };

    response.status(status);
    response.render('userProfilePage.hbs', { pageData: pageData });
}

/**
 * Renders the user's profile page.
 * @param {*} pageData Consists of the user's data.
 * @param {*} response Tracks the status of the controller.
 */
function showUserProfile(pageData, response) {
    response.status(200);
    response.render('userProfilePage.hbs', { pageData: pageData });
}

/**
 * Creates a new user via the model.
 * @param {*} response Tracks the status of the controller.
 */
async function newUser(request, response) {

    try {
        //create user
        const user = await userModel.createUser(request.body.username, request.body.email, request.body.password, ' ');

        return user;

    } catch (error) {
        return error;
    }
}

/**
 * Shows a specified user using their username.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks the status of the controller.
 */
async function showUser(request, response) {
    try {
        //retrieve user 
        const user = await userModel.findByUsername(request.params.username);

        //check if the search was successful
        if (user instanceof exceptions.userException) {
            showUserError('User NOT found!', 400, response);
        }

        const pageData = {
            logoutTitle: 'Logout',
            logoutPath: '/logout',
            username: user.username,
            email: user.email,
            icon: user.icon
        };

        //render user's profile page
        showUserProfile(pageData, response);

    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showUserError('Database error! Unable to find User', 500, response);
        } else if (error instanceof exceptions.userException) {
            showUserError('User NOT found!', 400, response);
        } else {
            showUserError('Unexpected error trying to find user.', 500, response);
        }
    }
}

/**
 * Update a user in the database.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks the status of the controller.
 */
async function updateUser(request, response) {
    try {

        //update user
        const user = await userModel.updateUser(request.params.email, request.body.username, request.body.password, request.body.icon);

        //check if the update was successful
        if (user instanceof exceptions.userException) {
            showUserProfileError('User NOT updated!', 400, request, response);
        }

        response.redirect(`/user/${user.username}`)

    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showUserError('Database error! Unable to update User', 500, response);
        } else if (error instanceof exceptions.userException) {
            showUserError('User NOT updated!', 400, response);
        } else {
            showUserError('Unexpected error trying to update user.', 500, response);
        }
    }
}

/**
 * Deletes a user from the database.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks the status of the controller.
 */
async function destroyUser(request, response) {
    try {
        //delete user
        const user = await userModel.deleteUser(request.params.email);

        //check if the delete was successful
        if (user instanceof exceptions.userException) {
            showUserProfileError('User NOT deleted!', 400, request, response);
        }

        //display logged out message
        const pageData = {
            displayUserNavBar: true,
            displayHomePage: true,
            displayLoggedInUser: false,
            displayLoggedOutMessage: true,
            userNavBarContent: [
                { title: 'Login', path: '/login' },
                { title: 'Sign Up', path: '/register' }
            ],
            navBarContent: [{ id: 'about-us', title: 'About us', path: '.' }]
        };

        response.render('homePage.hbs', pageData);

    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showUserError('Database error! Unable to delete User', 500, response);
        } else if (error instanceof exceptions.userException) {
            showUserError('User NOT deleted!', 400, response);
        } else {
            showUserError('Unexpected error trying to delete user.', 500, response);
        }
    }
}

//router HTTP methods
router.post('/user', newUser);
router.post('/user/delete/:email', destroyUser);
router.get('/user/:username', showUser);
router.post('/user/update/:email', updateUser);

module.exports = {
    router,
    routeRoot,
    newUser,
    showUser,
    updateUser,
    destroyUser,
    showUserError,
    showUserProfile,
    showUserProfileError
}