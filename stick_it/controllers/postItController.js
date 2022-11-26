const express = require('express');
const router = express.Router();
const routeRoot = '/';
const exceptions = require('../models/exceptions/errors');

//Models
const postItModel = require('../models/postItModel');
const categoryModel = require('../models/categoryModel');
const userModel = require('../models/userModel');
const { route } = require('express/lib/router');

//Controllers
const authController = require('../controllers/authController');
const res = require('express/lib/response');

const PINNED_MARK = 'T';
const UNPINNED_MARK = 'F';
const trackerPinnedPost = "trackerPinnedPost";
/**
 * Renders page with provided success message. 
 * @param {string} message The success message for the CRUD operations.
 * @param {*} response Tracks status of the controller.
 */
function showPostItMessage(message, response) {
    response.render('.hbs', { message: message });
}

/**
 * Renders the error page with the given error message.
 * @param {string} message The failure message for the CRUD operations.
 * @param {number} status The status code for the failed operation.
 * @param {*} response Tracks status of the controller.
 */
function showPostItError(message, status, response) {
    response.render('errorPage.hbs', { message: message, status: status });
}

/**
 * Renders the forms to operate a post-it.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks status of the controller.
 */
function showForms(request, response) {
    response.render('postItPage.hbs');
}


/**
 * Redirects to add post-it.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks status of the controller.
 */
 async function redirectAddPostIt(request, response) {

    if (!authController.authenticateUser(request)) {
        authController.showAuthenticationError(`Unauthorized access`, 401, response);
    }

    var pinnedFlag = (request.cookies.trackerPinnedPost >=2) ? true : false;


    const user = await userModel.findByUsername(authController.getUsername());
    const userId = user.user_id;
    const availableCategories = await categoryModel.findAllByUserId(userId);
    const pageData = {
        displayVisitorNavBar: false,
        displayLoggedInUser: true,
        loggedInOptionsNavBar: authController.LOGGED_IN_NAV_BAR,
        logoutSettingsNavBar: authController.getLogOutNavBar(),
        username: authController.getUsername(),
        category: availableCategories,
        automaticallyPinned: pinnedFlag
    };
    response.render('addPostIt.hbs', pageData);
}

router.get('/postit', redirectAddPostIt);

/**
 * Creates a new postIt via the postItModel.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks the status of the controller.
 */
async function newPostIt(request, response) {
    try {
            if (!authController.authenticateUser(request)) {
                authController.showAuthenticationError(`Unauthorized access`, 401, response);
            }
            //retrieve user from database
            const user = await userModel.findByUsername(authController.getUsername());
            const userId = user.user_id;

            const category = await categoryModel.findById(request.body.category);

            //checking if the post it is pinned
            const pinned = (request.body.pinned == "on") ? "T" : "F";

            //check if user exists
            if (user instanceof exceptions.userException) {
                showPostItError('Post-it NOT created! User does not exist', 400, response);
            }
            //check if category exists
            else if (category instanceof exceptions.categoryException) {
                showPostItError('Post-it NOT created! Category does not exist', 400, response);
            }
            else
            {
                //create post-it 
                const postIt = await postItModel.createPostIt(userId, request.body.category, request.body.title, request.body.description, pinned, request.body.weekday);
                //check if insertion was successful
                if (postIt instanceof exceptions.postItException)
                {
                    showPostItError('Post-it NOT created!', 400, response);
                }
                else if(postIt)
                {
                    // Pinned Post It Tracker
                    if(pinned == PINNED_MARK)
                    {
                        if(request.cookies.trackerPinnedPost == null)
                        {
                            response.cookie(trackerPinnedPost, 1);
                        }
                        else
                        { 
                            var value = request.cookies.trackerPinnedPost;
                            var numericalValue = parseInt(value);
                            numericalValue++;
                            response.cookie(trackerPinnedPost, numericalValue)
                        }
                    }
                    else
                    {
                        response.cookie(trackerPinnedPost, 0);
                    }

                    const postIts = await postItModel.findAllByUserId(userId);
                    for(var i = 0; i < postIts.length; i++){
                        const color = await categoryModel.getColorByAssignedCategory(postIts[i].user_id, postIts[i].category_id);
                        postIts[i].color = color;
                        if(postIts[i].pinned == 'T')
                        {
                            postIts[i].pinned = true;
                        }
                        else
                        {
                            postIts[i].pinned = false;
                        }
        
                    }

                    const pageData = {
                        displayVisitorNavBar: false,
                        displayLoggedInUser: true,
                        loggedInOptionsNavBar: authController.LOGGED_IN_NAV_BAR,
                        logoutSettingsNavBar: authController.getLogOutNavBar(),
                        username: authController.getUsername(),
                        postIt: postIts,
                        message: "SUCCESSFULLY ADDED POST IT"
                    }

                    response.render('showAllPostIts.hbs', pageData);
                }
            }
        } 
        catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showPostItError('Database error! Unable to add Post-it', 500, response);
        } else if (error instanceof exceptions.userException) {
            showPostItError('Unexpected error with User.', 400, response);
        } else if (error instanceof exceptions.categoryException) {
            showPostItError('Unexpected error with Category.', 400, response);
        } else if (error instanceof exceptions.postItException) {
            showPostItError('Post-it NOT created!', 400, response);
        } else {
            showPostItError('Unexpected error trying to add Post-it.', 500, response);
        }
    }
}

router.post('/postit', newPostIt);


/**
 * Shows a specified post-it using the title.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks the status of the controller.
 */
async function showPostIt(request, response) {
    try {
        //retrieve post-it from the database
        const postIt = await postItModel.findByTitle(request.body.title);

        //check if the post-it exists
        if (postIt instanceof postItModel.postItException) {
            showPostItError('Post-it NOT found!', 400, response);
        } else if (postIt) {
            showPostItMessage(`Post-it: ${postIt[0][0].title} found successfully!`, response);
        }

    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showPostItError('Database error! Unable to find Post-it', 500, response);
        } else if (error instanceof exceptions.userException) {
            showPostItError('Unexpected error with User.', 400, response);
        } else if (error instanceof exceptions.categoryException) {
            showPostItError('Unexpected error with Category.', 400, response);
        } else if (error instanceof exceptions.postItException) {
            showPostItError('Post-it NOT found!', 400, response);
        } else {
            showPostItError('Unexpected error trying to find Post-it.', 500, response);
        }
    }
}


/**
 * Shows all post-its in the database.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks the status of the controller.
 */
async function showAllPostIts(request, response) {
    try {

        if (!authController.authenticateUser(request)) {
            authController.showAuthenticationError(`Unauthorized access`, 401, response);
        }

        //retrieve user from database
        const user = await userModel.findByUsername(authController.getUsername());
        const userId = user.user_id;

        //retrieve all post-its
        const postIts = await postItModel.findAllByUserId(userId);



        //check if the post-its exist
        if (postIts instanceof exceptions.postItException) {
            showPostItError('Post-its NOT found!', 400, response);
        } else if (postIts) {

            for(var i = 0; i < postIts.length; i++){
                const color = await categoryModel.getColorByAssignedCategory(postIts[i].user_id, postIts[i].category_id);
                postIts[i].color = color;
                if(postIts[i].pinned == 'T')
                {
                    postIts[i].pinned = true;
                }
                else
                {
                    postIts[i].pinned = false;
                }

            }
            
            const pageData = {
                displayVisitorNavBar: false,
                displayLoggedInUser: true,
                loggedInOptionsNavBar: authController.LOGGED_IN_NAV_BAR,
                logoutSettingsNavBar: authController.getLogOutNavBar(),
                username: authController.getUsername(),
                postIt: postIts,
                message: "ALL POSTS IT"
            }

            response.render('showAllPostIts.hbs', pageData);

        }
    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showPostItError('Database error! Unable to find Post-its', 500, response);
        } else if (error instanceof exceptions.userException) {
            showPostItError('Unexpected error with User.', 400, response);
        } else if (error instanceof exceptions.categoryException) {
            showPostItError('Unexpected error with Category.', 400, response);
        } else if (error instanceof exceptions.postItException) {
            showPostItError('Post-its NOT found!', 400, response);
        } else {
            showPostItError('Unexpected error trying to find Post-its.', 500, response);
        }
    }
}
router.get('/postits', showAllPostIts);

/**
 * Updates a specific post-it.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks the status of the controller.
 */
 async function redirectUpdatePostIt(request, response) {
    try {

        if (!authController.authenticateUser(request)) {
            authController.showAuthenticationError(`Unauthorized access`, 401, response);
        }
    
        const user = await userModel.findByUsername(authController.getUsername());
        const userId = user.user_id;
        const availableCategories = await categoryModel.findAllByUserId(userId);

        const postIt = await postItModel.findById(request.params.post_it);
        const pageData = {
            message: "UPDATE POST IT",
            category: availableCategories,
            currentPostIt: postIt,
            originalPostItId: postIt[0].post_id
        };
        response.render('updatePostIt.hbs', pageData);

    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showPostItError('Database error! Unable to update Post-it', 500, response);
        } else if (error instanceof exceptions.userException) {
            showPostItError('Unexpected error with User.', 400, response);
        } else if (error instanceof exceptions.categoryException) {
            showPostItError('Unexpected error with Category.', 400, response);
        } else if (error instanceof exceptions.postItException) {
            showPostItError('Post-it NOT updated!', 400, response);
        } else {
            showPostItError('Unexpected error trying to update Post-it.', 500, response);
        }
    }
}
router.get('/update/:post_it', redirectUpdatePostIt);

/**
 * Updates a specific post-it.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks the status of the controller.
 */
async function updatePostIt(request, response) {
    try {
        //checking if the post it is pinned
        const pinned = (request.body.pinned == "on") ? "T" : "F";
        const originalPostIt = await postItModel.findById(request.body.post_id);
        const originalTitle = originalPostIt[0].title;
        //update post-it in the model
        const postIt = await postItModel.updatePostIt(originalTitle, request.body.description, request.body.weekday, request.body.category, pinned);
            
            if(postIt != null){
                const pageData = {
                    message: "SUCCESSFULLY UPDATED POST IT"
                }
    
                response.render('successAdded.hbs', pageData);
            }
        }
        catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showPostItError('Database error! Unable to update Post-it', 500, response);
        } else if (error instanceof exceptions.userException) {
            showPostItError('Unexpected error with User.', 400, response);
        } else if (error instanceof exceptions.categoryException) {
            showPostItError('Unexpected error with Category.', 400, response);
        } else if (error instanceof exceptions.postItException) {
            showPostItError('Post-it NOT updated!', 400, response);
        } else {
            showPostItError('Unexpected error trying to update Post-it.', 500, response);
        }
    }
}
router.post('/postit/update', updatePostIt);
/**
 * Delete a specified post-it from the database.
 * @param {*} request Input parameters given by the user.
 * @param {*} response Tracks the status of the controller.
 */
async function destroyPostIt(request, response) {

    try {
        if (!authController.authenticateUser(request)) {
            authController.showAuthenticationError(`Unauthorized access`, 401, response);
        }
    
        const user = await userModel.findByUsername(authController.getUsername());
        const userId = user.user_id;
        

        //delete post-it from the model
        const postIt = await postItModel.deletePostItById(request.params.post_it);
        //retrieve all post-its
        const postIts = await postItModel.findAllByUserId(userId);



        //check if the post-its exist
        if (postIts instanceof exceptions.postItException) {
            showPostItError('Post-its NOT found!', 400, response);
        } else if (postIts) {

            const pageData = {
                message: "SUCCESSFULLY DELETED POST IT"
            }

            response.render('successAdded.hbs', pageData);
        }

    } catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showPostItError('Database error! Unable to delete Post-it', 500, response);
        } else if (error instanceof exceptions.userException) {
            showPostItError('Unexpected error with User.', 400, response);
        } else if (error instanceof exceptions.categoryException) {
            showPostItError('Unexpected error with Category.', 400, response);
        } else if (error instanceof exceptions.postItException) {
            showPostItError('Post-it NOT deleted!', 400, response);
        } else {
            showPostItError('Unexpected error trying to delete Post-it.', 500, response);
        }
    }
}

router.post('/postit/delete/:post_it', destroyPostIt);

async function markPostItAsCompleted(request, response) {
    if (!authController.authenticateUser(request)) {
        authController.showAuthenticationError(`Unauthorized access`, 401, response);
    }

    const user = await userModel.findByUsername(authController.getUsername());
    const userId = user.user_id;

    try{
        //delete post-it from the model
        const postIt = await postItModel.setPostItAsCompleted(request.params.postit);

        //retrieve all post-its
        const postIts = await postItModel.findAllCompletedPostIt(userId);

        //check if the post-its exist
        if (postIts instanceof exceptions.postItException) {
            showPostItError('Post-its NOT found!', 400, response);
        } else if (postIts) {
            const pageData = {
                message: "GOOD JOB YOU COMPLETED A POST IT"
            }

            response.render('successAdded.hbs', pageData);
        }

    }
    catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showPostItError('Database error! Unable to mark Post-it as completed.', 500, response);
        } else if (error instanceof exceptions.userException) {
            showPostItError('Unexpected error with User.', 400, response);
        } else if (error instanceof exceptions.categoryException) {
            showPostItError('Unexpected error with Category.', 400, response);
        } else if (error instanceof exceptions.postItException) {
            showPostItError('Post-it was NOT marked as completed!', 400, response);
        } else {
            showPostItError('Unexpected error trying to mark Post-it as completed.', 500, response);
        }
    }

}

router.post('/postit/complete/:postit', markPostItAsCompleted);


async function showAllCompletedPostIts(request, response) {

    if (!authController.authenticateUser(request)) {
        authController.showAuthenticationError(`Unauthorized access`, 401, response);
    }

    try{ 
        //retrieve user from database
        const user = await userModel.findByUsername(authController.getUsername());
        const userId = user.user_id;

        //retrieve all post-its
        const postIts = await postItModel.findAllCompletedPostIt(userId);

        //check if the post-its exist
        if (postIts instanceof exceptions.postItException) {
            showPostItError('Post-its NOT found!', 400, response);
        } else if (postIts) {

            for(var i = 0; i < postIts.length; i++){
                const color = await categoryModel.getColorByAssignedCategory(postIts[i].user_id, postIts[i].category_id);
                postIts[i].color = color;
                if(postIts[i].pinned == 'T')
                {
                    postIts[i].pinned = true;
                }
                else
                {
                    postIts[i].pinned = false;
                }


            }

            const pageData = {
                displayVisitorNavBar: false,
                displayLoggedInUser: true,
                loggedInOptionsNavBar: authController.LOGGED_IN_NAV_BAR,
                logoutSettingsNavBar: authController.getLogOutNavBar(),
                username: authController.getUsername(),
                postIt: postIts,
                message: "ALL COMPLETED POST IT FOR USER"
            }

            response.render('showAllPostIts.hbs', pageData);
        }
    }
    catch (error) {
        if (error instanceof exceptions.databaseException) {
            //database error
            showPostItError('Database error! Unable to find Post-its', 500, response);
        } else if (error instanceof exceptions.userException) {
            showPostItError('Unexpected error with User.', 400, response);
        } else if (error instanceof exceptions.categoryException) {
            showPostItError('Unexpected error with Category.', 400, response);
        } else if (error instanceof exceptions.postItException) {
            showPostItError('Post-its NOT found!', 400, response);
        } else {
            showPostItError('Unexpected error trying to find Post-its.', 500, response);
        }
    }
}

router.get('/complete', showAllCompletedPostIts);

// router.get('/postitform', showForms);


module.exports = {
    router,
    routeRoot,
    newPostIt,
    showPostIt,
    showAllPostIts,
    showAllCompletedPostIts,
    updatePostIt,
    destroyPostIt,
    showPostItMessage,
    showPostItError,
    redirectUpdatePostIt,
    showForms,
    markPostItAsCompleted
}