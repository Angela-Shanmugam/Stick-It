//Required Modules
const { response } = require('express');
const express = require('express');
const exceptions = require('../models/exceptions/errors');
const uuid = require('uuid');
const router = express.Router();
const { route } = require('express/lib/router');
const res = require('express/lib/response');

//Models
const postItModel = require('../models/postItModel');
const categoryModel = require('../models/categoryModel');
const userModel = require('../models/userModel');

//Controller
const userController = require('../controllers/userController');
const homeController = require('../controllers/homeController');

//Global Fields
const routeRoot = '/';
const sessions = {}
var userId;
var loggedInUsername;
const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PINNED_MARK = 'T';
const UNPINNED_MARK = 'F';

const LOGGED_IN_NAV_BAR = [
    { id: 'add-post-it', title: 'Add Post-it', path: '/postit' },
    // { id: 'find-post-it', title: 'Find Post-it', path: '/postit' },
    { id: 'read-all-post-it', title: 'Retrieve All Post-its', path: '/postits' },
    { id: 'read-completed-post-it', title: 'Completed Post-its', path: '/complete' },
    { id: 'show-all-categories', title: 'Show All Categories', path: '/categories' },
    { id: 'add-categories', title: 'Add Category', path: '/category' }
];

var LOGOUT_USER_NAV_BAR;
/**
 * Renders the home page with the given error message.
 * @param {string} message The failure message for the CRUD operations.
 * @param {number} status The status code for the failed operation.
 * @param {*} response Tracks status of the controller.
 */
function showAuthenticationError(message, status, response) {
    const pageData = {
        displayVisitorNavBar: false,
        displayLoggedInUser: true,
        loggedInOptionsNavBar: LOGGED_IN_NAV_BAR,
        logoutSettingsNavBar: LOGOUT_USER_NAV_BAR ,
        alertMessage: message,
    };

    response.status(status);
    response.render('homePage.hbs', pageData);
}

/**
 * Session object contains the username of the user and the time of expiry for the session.
 * The object additionally stored protected session information.
 */
class Session {
    constructor(username, expiresAt) {
            this.username = username
            this.expiresAt = expiresAt
        }
        //determines if sessions is expired
    isExpired() {
        this.expiresAt < (new Date())
    }
}

/**
 * Creates the session information using the provided username. 
 * @param {string} username The username of the user.
 * @returns The session ID for the given logged in user.
 */
function createSession(username) {
    //generate a random UUID for the sessionId
    const sessionId = uuid.v4()

    //expires after a long period of time
    const expiresAt = new Date(2147483647 * 1000).toUTCString();

    //create a session object containing information about the user and expiry time
    const thisSession = new Session(username, expiresAt);

    //add the session information to the sessions map, using sessionId as the key
    sessions[sessionId] = thisSession;
    return sessionId;
}

/**
 * Authenticates user through the current existing cookies.
 * @param {*} request Input parameters given by the user.
 * @returns The successfully validated sessionId and userSession, otherwise returns null.
 */
function authenticateUser(request) {

    //check if the request contains authenticated cookies
    if (!request.cookies) {
        return null;
    }

    //retrieving the session token from the requests cookies
    const sessionId = request.cookies['sessionId']

    //verify if it has been set
    if (!sessionId) {
        return null;
    }

    // get the session of the user from the session map
    const userSession = sessions[sessionId]
    if (!userSession) {
        return null;
    }

    //check if the sessions is expired
    if (userSession.isExpired()) {
        delete sessions[sessionId];
        return null;
    }

    //return successfully validated session
    return { sessionId, userSession };
}

/**
 * Validates user's credentials using the model and renders the logged in page if successful.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks status of the controller.
 */
async function login(request, response) {
    //user credentials
    const email = request.body.email;
    const password = request.body.password;

    try {
        //validate user via the model
        const user = await userModel.login(email, password);

        //check if the retrieval was successful
        if (user instanceof exceptions.authException || user instanceof exceptions.userException) {
            showAuthenticationError('Cannot log in: Invalid credentials.', 400, response);
        }

        //keep track of the username
        loggedInUsername = user.username;
        userId = user.user_id;
        LOGOUT_USER_NAV_BAR = [
            { id: 'log-out', title: 'Logout', path: '/logout' },
            { id: 'profile', title: `User Name Profile: ${getUsername()}`, path: `/user/${getUsername()}` }
        ];
        //create session
        const sessionId = createSession(loggedInUsername);

        //set cookie
        response.cookie("sessionId", sessionId);

        //generate data for the logged in page
        // var postIt = await buildDashboard(weekday[6], userId);
        var pinnedPostIt = await buildDashboard(getDayOfWeek(), userId, PINNED_MARK);
        var unpinnedPostIt = await buildDashboard(getDayOfWeek(), userId, UNPINNED_MARK);

        const pageData = {
            displayVisitorNavBar: false,
            displayLoggedInUser: true,
            loggedInOptionsNavBar: LOGGED_IN_NAV_BAR,
            logoutSettingsNavBar: LOGOUT_USER_NAV_BAR ,
            username:loggedInUsername,
            currentDayDisplayed: getDayOfWeek(),
            pinnedPostIt: pinnedPostIt,
            unpinnedPostIt: unpinnedPostIt,
            displaySunday: setDashboardToCurrentDay(weekday[0]),
            displayMonday: setDashboardToCurrentDay(weekday[1]),
            displayTuesday: setDashboardToCurrentDay(weekday[2]),
            displayWednesday: setDashboardToCurrentDay(weekday[3]),
            displayThursday: setDashboardToCurrentDay(weekday[4]),
            displayFriday: setDashboardToCurrentDay(weekday[5]),
            displaySaturday: setDashboardToCurrentDay(weekday[6]),
        };

        //render the logged in page
        response.status(200);
        response.render('loggedInPageSkeleton.hbs', pageData);

    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showAuthenticationError('Database error! Unable to login User', 500, response);
        } else if (error instanceof exceptions.userException) {
            showAuthenticationError('Unable to find User', 400, response);
        } else {
            showAuthenticationError('Unexpected error trying to login user.', 500, response);
        }
    }
}

/**
 * Verifies and removes existing session. Returns user to the home page.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks status of the controller.
 */
async function logout(request, response) {

    //check if the session exists
    const authenticatedSession = authenticateUser(request);
    if (!authenticatedSession) {
        showAuthenticationError('Unauthorized access!', 401, response);
        return;
    }
    //delete the session
    delete sessions[authenticatedSession.sessionId]

    //set cookie
    response.cookie("sessionId", "", { expires: new Date() }); // "erase" cookie by forcing it to expire.

    //display logged out message
    const pageData = {
        homePath: '/home',
        displayVisitorNavBar: true,
        signUpLogInNavBar: homeController.LOGGIN_SIGNUP_NAV_BAR,
        visitorNavBar: homeController.HOME_VISITOR_NAV_BAR,
        displayLoggedInUser: false,
        displayLoggedOutMessage: true,
    };

    response.render('homePage.hbs', pageData);
}

/**
 * Creates an account for the user. If successful, the login form is rendered. 
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks status of the controller.
 */
async function register(request, response) {
    try {
        //create user
        const user = await userController.newUser(request, response);

        //check if insertion was successful
        if (user instanceof exceptions.userException) {
            showAuthenticationError(`User NOT created: Verify that email contains an '@' and '.' as well as a password that is 8 or more characters.`, 400, response);
        } else {
            //redirect to the homepage
            response.redirect('/');
        }
    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showAuthenticationError('Database error! Unable to login User', 500, response);
        } else if (error instanceof exceptions.userException) {
            showAuthenticationError('Unable to find User', 400, response);
        } else {
            showAuthenticationError('Unexpected error trying to login user.', 500, response);
        }
    }
}

/**
 * Renders the user's dashboard to the browser.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks status of the controller.
 */
async function showDashBoard(request, response) {

    var pinnedPostIt;
    var unpinnedPostIt;

    if (!authenticateUser(request)) {
        showAuthenticationError(`Unauthorized access`, 401, response);
    }

    //retrieve user from database
    const user = await userModel.findByUsername(getUsername());
    const userId = user.user_id;

    switch (request.body.choice) {

        case 'sunday':
            //getting post it for the day
            pinnedPostIt = await buildDashboard(weekday[0], userId, PINNED_MARK);
            unpinnedPostIt = await buildDashboard(weekday[0], userId, UNPINNED_MARK);
            const sundayPageData = {
                homePath:'/home',
                displayVisitorNavBar: false,
                displayLoggedInUser: true,
                loggedInOptionsNavBar: LOGGED_IN_NAV_BAR,
                logoutSettingsNavBar: LOGOUT_USER_NAV_BAR,
                displaySunday: true,
                currentDayDisplayed: weekday[0],
                pinnedPostIt: pinnedPostIt,
                unpinnedPostIt: unpinnedPostIt,
                username:loggedInUsername,
            }
            response.render('loggedInPageSkeleton.hbs', sundayPageData);
            break;

        case 'monday':
            pinnedPostIt = await buildDashboard(weekday[1], userId, PINNED_MARK);
            unpinnedPostIt = await buildDashboard(weekday[1], userId, UNPINNED_MARK);
            const mondayPageData = {
                homePath:'/home',
                displayVisitorNavBar: false,
                displayLoggedInUser: true,
                loggedInOptionsNavBar: LOGGED_IN_NAV_BAR,
                logoutSettingsNavBar: LOGOUT_USER_NAV_BAR,
                displayMonday: true,
                currentDayDisplayed: weekday[1],
                pinnedPostIt: pinnedPostIt,
                unpinnedPostIt: unpinnedPostIt,
                username:loggedInUsername,
            }
            response.render('loggedInPageSkeleton.hbs', mondayPageData);
            break;

        case 'tuesday':
            pinnedPostIt = await buildDashboard(weekday[2], userId, PINNED_MARK);
            unpinnedPostIt = await buildDashboard(weekday[2], userId, UNPINNED_MARK);
            const tuesdayPageData = {
                homePath:'/home',
                displayVisitorNavBar: false,
                displayLoggedInUser: true,
                loggedInOptionsNavBar: LOGGED_IN_NAV_BAR,
                logoutSettingsNavBar: LOGOUT_USER_NAV_BAR,
                displayTuesday: true,
                currentDayDisplayed: weekday[2],
                pinnedPostIt: pinnedPostIt,
                unpinnedPostIt: unpinnedPostIt,
                username:loggedInUsername,
            }
            response.render('loggedInPageSkeleton.hbs', tuesdayPageData);
            break;

        case 'wednesday':
            pinnedPostIt = await buildDashboard(weekday[3], userId, PINNED_MARK);
            unpinnedPostIt = await buildDashboard(weekday[3], userId, UNPINNED_MARK);
            const wednesdayPageData = {
                homePath:'/home',
                displayVisitorNavBar: false,
                displayLoggedInUser: true,
                loggedInOptionsNavBar: LOGGED_IN_NAV_BAR,
                logoutSettingsNavBar: LOGOUT_USER_NAV_BAR,
                displayWednesday: true,
                currentDayDisplayed: weekday[3],
                pinnedPostIt: pinnedPostIt,
                unpinnedPostIt: unpinnedPostIt,
                username:loggedInUsername,
            }
            response.render('loggedInPageSkeleton.hbs', wednesdayPageData);
            break;

        case 'thursday':
            pinnedPostIt = await buildDashboard(weekday[4], userId, PINNED_MARK);
            unpinnedPostIt = await buildDashboard(weekday[4], userId, UNPINNED_MARK);
            const thursdayPageData = {
                homePath:'/home',
                displayVisitorNavBar: false,
                displayLoggedInUser: true,
                loggedInOptionsNavBar: LOGGED_IN_NAV_BAR,
                logoutSettingsNavBar: LOGOUT_USER_NAV_BAR,
                displayThursday: true,
                currentDayDisplayed: weekday[4],
                pinnedPostIt: pinnedPostIt,
                unpinnedPostIt: unpinnedPostIt,
                username:loggedInUsername,
            }
            response.render('loggedInPageSkeleton.hbs', thursdayPageData);
            break;

        case 'friday':
            pinnedPostIt = await buildDashboard(weekday[5], userId, PINNED_MARK);
            unpinnedPostIt = await buildDashboard(weekday[5], userId, UNPINNED_MARK);
            const fridayPageData = {
                homePath:'/home',
                displayVisitorNavBar: false,
                displayLoggedInUser: true,
                loggedInOptionsNavBar: LOGGED_IN_NAV_BAR,
                logoutSettingsNavBar: LOGOUT_USER_NAV_BAR,
                displayFriday: true,
                currentDayDisplayed: weekday[5],
                pinnedPostIt: pinnedPostIt,
                unpinnedPostIt: unpinnedPostIt,
                username:loggedInUsername,
            }
            response.render('loggedInPageSkeleton.hbs', fridayPageData);
            break;

        case 'saturday':
            pinnedPostIt = await buildDashboard(weekday[6], userId, PINNED_MARK);
            unpinnedPostIt = await buildDashboard(weekday[6], userId, UNPINNED_MARK);
            const saturdayPageData = {
                homePath:'/home',
                displayVisitorNavBar: false,
                displayLoggedInUser: true,
                loggedInOptionsNavBar: LOGGED_IN_NAV_BAR,
                logoutSettingsNavBar: LOGOUT_USER_NAV_BAR,
                displaySaturday: true,
                currentDayDisplayed: weekday[6],
                pinnedPostIt: pinnedPostIt,
                unpinnedPostIt: unpinnedPostIt,
                username: loggedInUsername,

            }
            response.render('loggedInPageSkeleton.hbs', saturdayPageData);
            break;

        default:
            var pinnedPostIt = await buildDashboard(getDayOfWeek(), userId, PINNED_MARK);
            var unpinnedPostIt = await buildDashboard(getDayOfWeek(), userId, UNPINNED_MARK);
            const pageData = {
                displayVisitorNavBar: false,
                displayLoggedInUser: true,
                loggedInOptionsNavBar: LOGGED_IN_NAV_BAR,
                logoutSettingsNavBar: LOGOUT_USER_NAV_BAR ,
                username:loggedInUsername,
                currentDayDisplayed: getDayOfWeek(),
                pinnedPostIt: pinnedPostIt,
                unpinnedPostIt: unpinnedPostIt,
                displaySunday: setDashboardToCurrentDay(weekday[0]),
                displayMonday: setDashboardToCurrentDay(weekday[1]),
                displayTuesday: setDashboardToCurrentDay(weekday[2]),
                displayWednesday: setDashboardToCurrentDay(weekday[3]),
                displayThursday: setDashboardToCurrentDay(weekday[4]),
                displayFriday: setDashboardToCurrentDay(weekday[5]),
                displaySaturday: setDashboardToCurrentDay(weekday[6]),
            };
            response.render('loggedInPageSkeleton.hbs', pageData);
    }
}

/**
 * Gets the day of the week.
 * @returns The current day of the week.
 */
function getDayOfWeek() {
    const dayInMaking = new Date();
    var day = weekday[dayInMaking.getDay()];
    return day;
}

/**
 * Sets the dashboard to the day of the week.
 * @param {*} day The current day of the week.
 * @returns Returns true if the day matches the current day, otherwise returns false.
 */
function setDashboardToCurrentDay(day) {
    if (day.toLowerCase() == getDayOfWeek().toLowerCase()) {
        return true;
    } else {
        return false;
    }
}

/**
 * Gets the post it for the specified day, user and pinned requirement.
 * @param {string} day Day of the week.
 * @param {int} userId User id for the user that is logged in.
 * @param {boolean} pinned Flag that determines if the post it is pinned or unpinned.
 * @returns All post it that correspond to the specified day, user and pinned requirement
 */
async function buildDashboard(day, userId, pinned) {

    //get the post it for the user by day 
    try {
        day = day.toLowerCase();
        const dailyPostIt = await postItModel.findByWeekdayAndUserId(day, userId, pinned);

        for(var i = 0; i < dailyPostIt.length; i++)
        { 
            const color = await categoryModel.getColorByAssignedCategory(dailyPostIt[i].user_id, dailyPostIt[i].category_id);
            dailyPostIt[i].color = color;
        }

        return dailyPostIt;

    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            console.log(error.message);
        } else if (error instanceof exceptions.userException) {
            console.log(error.message);
        } else if (error instanceof postItModel.postItException) {
            console.log(error.message);
        } else {
            console.log(error.message);
        }
    }
}

/**
 * Gets the user's username.
 * @returns Returns the user's username.
 */
function getUsername() {
    return loggedInUsername;
}
/**
 * Gets the log out navigation bar.
 * @returns Returns the log out navigation bar.
 */
function getLogOutNavBar() {
    return LOGOUT_USER_NAV_BAR;
}

//Router methods
router.post('/home', showDashBoard);
router.post('/login', login);
router.get('/logout', logout);
router.post('/register', register);

module.exports = {
    router,
    routeRoot,
    loggedInUsername,
    LOGGED_IN_NAV_BAR,
    getLogOutNavBar,
    login,
    logout,
    showDashBoard,
    authenticateUser,
    getUsername,
    showAuthenticationError
}