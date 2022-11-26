//Required Modules
const express = require('express');
const { render } = require('express/lib/response');
const router = express.Router();

//Models
const postItModel = require('../models/postItModel');
const categoryModel = require('../models/categoryModel');
const userModel = require('../models/userModel');
const { route } = require('express/lib/router');
const res = require('express/lib/response');


const LOGGIN_SIGNUP_NAV_BAR = [
    {  id: 'login', title: 'Login', path: '/login' },
    {  id: 'sign up', title: 'Sign Up', path: '/register' }
];

const HOME_VISITOR_NAV_BAR = [
    { id: 'about-us', title: 'About us', path: '/about' }
];

//Global fields
const routeRoot = '/';

/**
 * Renders the home page.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks the status of the controller.
 */
function showHome(request, response) {
    const pageData = {
        // displayUserNavBar: false,
        homePath: '/home',
        displayVisitorNavBar: true,
        // displayLoggedInUser: false,
        // displayLoggedOutMessage: false,
        signUpLogInNavBar: LOGGIN_SIGNUP_NAV_BAR,
        visitorNavBar: HOME_VISITOR_NAV_BAR,
    };
    response.render('homePage.hbs', pageData);
}

function showAboutUs(request, response){
    const pageData = {
        homePath: '/home',
        displayVisitorNavBar: true,
        // displayLoggedInUser: false,
        // displayLoggedOutMessage: false,
        signUpLogInNavBar: LOGGIN_SIGNUP_NAV_BAR,
    }
    response.render('aboutUsPage.hbs', pageData);
}

//router HTTP methods
router.get('/', showHome);
router.get('/home', showHome);
router.get('/about', showAboutUs)

module.exports = {
    router,
    routeRoot,
    LOGGIN_SIGNUP_NAV_BAR,
    HOME_VISITOR_NAV_BAR,
    showHome,
}