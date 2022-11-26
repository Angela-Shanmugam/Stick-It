//Required Modules
const app = require('../app');
const supertest = require('supertest');
const testRequest = supertest(app);
const { faker } = require('@faker-js/faker');

//Test database name
const dbName = 'bulletin_board_db_test';

//Models
const postItModel = require('../models/postItModel');
const categoryModel = require('../models/categoryModel');
const userModel = require('../models/userModel');

//Global Fields
var connection;

//CHANGE TO YOUR ARRAY
const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'white'];

/**Generates a different color for the category */
const generateColor = () => {
    const index = Math.floor((Math.random() * colors.length));
    return colors.slice(index)[0];
}

/**
 * Generates user from the user Model.
 * @returns Returns the created user.
 */
async function generateUser() {
    const icon = ' ';
    const user = await userModel.createUser(
        faker.internet.userName(),
        faker.internet.email(),
        faker.internet.password(),
        icon
    );
    return user;
}

//CHANGE TO FIT THE NEW CATEGORY, THIS IS USED FOR THE POST-IT
async function generateCategory() {
    const user = await generateUser();
    const category = await categoryModel.createCategory(
        user[0][0].user_id,
        faker.word.noun(),
        faker.word.verb(),
        generateColor()
    );
    return category;
}

/**Initialize database */
beforeEach(async() => {
    await postItModel.initialize(dbName, true);
    await categoryModel.initialize(dbName, true);
    await userModel.initialize(dbName, true);
});

/**TESTS FOR USER AND AUTH CONTROLLER */
/**TEST CREATE */
test("POST /Register User was created successfully", async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //send data through POST HTTP method
    const testResponse = await testRequest.post('/register').send({
        username: username,
        email: email,
        password: password,
        icon: icon
    });

    //verify response
    expect(testResponse.status).toBe(302);
});

test("POST /Register User was not created with blank username.", async() => {
    //generate new user
    const username = ' ';
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //send data through POST HTTP method
    const testResponse = await testRequest.post('/register').send({
        username: username,
        email: email,
        password: password,
        icon: icon
    });

    //verify status
    expect(testResponse.status).toBe(400);
});

test("POST /Register User was not created with duplicate username", async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //generate duplicate data
    const secondEmail = faker.internet.email();
    const secondPassword = faker.internet.password();

    //send data through POST HTTP method
    await testRequest.post('/register').send({
        username: username,
        email: email,
        password: password,
        icon: icon
    });

    //add duplicate user
    const duplicateResult = await testRequest.post('/register').send({
        username: username,
        email: secondEmail,
        password: secondPassword,
        icon: icon
    })

    //verify response
    expect(duplicateResult.status).toBe(400);
});

test("POST /User logged in successfully", async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //send data through POST HTTP method
    await testRequest.post(`/register`).send({
        username: username,
        email: email,
        password: password,
        icon: icon
    });

    //retrieve data through POST HTTP method
    const testResponse = await testRequest.post('/login').send({
        email: email,
        password: password
    });

    //verify response
    expect(testResponse.status).toBe(200);
});


test("POST /User not logged in successfully", async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //send data through POST HTTP method
    await testRequest.post(`/register`).send({
        username: username,
        email: email,
        password: password,
        icon: icon
    });

    const fakeEmail = 'pikachu';

    //retrieve data through POST HTTP method
    const testResponse = await testRequest.post('/login').send({
        email: fakeEmail,
        password: password
    });

    //verify response
    expect(testResponse.status).toBe(200);
});

/**TEST READ */
test("GET /User was found by username", async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //send data through POST HTTP method
    await testRequest.post(`/register`).send({
        username: username,
        email: email,
        password: password,
        icon: icon
    });

    //retrieve data through GET HTTP method
    const testResponse = await testRequest.get(`/user/${username}`).send({
        username: username,
    });

    //verify response
    expect(testResponse.status).toBe(200);
});

test("GET /User was not found by wrong username", async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //create fake username
    const fakeUsername = ' ';

    //send data through POST HTTP method
    await testRequest.post('/register').send({
        username: username,
        email: email,
        password: password,
        icon: icon
    });

    //retrieve data through GET HTTP method
    const testResponse = await testRequest.get(`/user/${fakeUsername}`).send({
        username: fakeUsername,
    });

    //verify response
    expect(testResponse.status).toBe(200);
    expect(testResponse.text).toContain('Invalid URL');
});

/**TEST UPDATE */
test("POST /User was updated successfully", async() => {

    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //send data through POST HTTP method
    await testRequest.post('/register').send({
        username: username,
        email: email,
        password: password,
        icon: icon
    });

    //generate new username and password
    const newUsername = faker.internet.userName();
    const newPassword = faker.internet.password();

    //send data through POST HTTP method
    const testResponse = await testRequest.post(`/user/update/${email}`).send({
        email: email,
        username: newUsername,
        password: newPassword,
        icon: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Jungkook_x_Samsung_Galaxy_August_2021.png'
    });

    //verify response
    expect(testResponse.status).toBe(302);
    expect(testResponse.text).toContain(`${newUsername}`)
});

test("POST /User was not updated, user does not exist", async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //send data through POST HTTP method
    await testRequest.post('/register').send({
        username: username,
        email: email,
        password: password,
        icon: icon
    });

    //generate new username and password
    const newUsername = faker.internet.userName();
    const newPassword = faker.internet.password();

    //generate fake email
    const fakeEmail = 'pikachu'

    //send data through POST HTTP method
    const testResponse = await testRequest.post(`/user/update/${fakeEmail}`).send({
        email: fakeEmail
    });

    //verify response
    expect(testResponse.status).toBe(302);
    expect(testResponse.text).toContain('undefined');
});

/**TEST DELETE */
test("POST /User was deleted successfully", async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //send data through POST HTTP method
    await testRequest.post('/register').send({
        username: username,
        email: email,
        password: password,
        icon: icon
    });

    //send data through POST HTTP method
    const testResponse = await testRequest.post(`/user/delete/${email}`).send({
        email: email
    });

    //verify response
    expect(testResponse.status).toBe(200);
});

test("POST /User was not deleted successfully", async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //send data through POST HTTP method
    await testRequest.post('/register').send({
        username: username,
        email: email,
        password: password,
        icon: icon
    });

    //create blank email
    const fakeEmail = 'pikachu'

    //send data through POST HTTP method
    const testResponse = await testRequest.post(`/user/delete/${fakeEmail}`).send({
        email: fakeEmail
    });

    //verify response
    expect(testResponse.status).toBe(400);
});


/**TESTS FOR CATEGORY CONTROLLER */
/**TEST CREATE */
test("POST /Category was created successfully", async() => {

    //generate user
    //const user = await generateUser();

    //generate category
    // const title = faker.word.noun();
    // const description = faker.word.verb();
    // const colorCode = generateColor();

    //send data through POST HTTP method
    // const testResponse = await testRequest.post('/category').send({
    //     userId: user[0][0].user_id,
    //     title: title,
    //     description: description,
    //     colorCode: colorCode
    // });

    // //verify response
    // expect(testResponse.status).toBe(200);
});

test("POST /Category was not created with non-existant user", async() => {

});

test("POST /Category was not created with blank title", async() => {

});

test("POST /Category was not created with duplicate title", async() => {

});

/**TEST READ */
test("GET /Category was found by title", async() => {

});

test("GET /Category was not found by wrong title", async() => {

});

test("GET /Categories were found", async() => {

});

/**TEST UPDATE */
test("POST /Category was updated successfully", async() => {

});

test("POST /Category was not updated, category does not exist", async() => {

});

test("POST /Category was not updated with blank description", async() => {

});

/**TEST DELETE */
test("POST /Category was deleted successfully", async() => {

});

test("POST /Category was not deleted successfully", async() => {

});

/**TESTING POST-IT CONTROLLER */
/**TEST CREATE */
test("POST /Post-it was created successfully", async() => {

    //CHANGE ACCORDINGLY

    // //generate user
    // const user = await generateUser();

    // //generate category
    // const category = await generateCategory();

    // //generate post-it
    // const title = faker.word.noun();
    // const description = faker.word.verb();
    // const pinned = 'F';

    // //send data through POST HTTP method
    // const testResponse = await testRequest.post('/post-it').send({
    //     userId: user[0].user_id,
    //     categoryId: category[0].category_id,
    //     title: title,
    //     description: description,
    //     pinned: pinned
    // });

    // //verify response
    // expect(testResponse.status).toBe(200);
});

test("POST /Post-it was not created with non-existant user", async() => {


});

test("POST /Post-it was not created with non-existant category", async() => {

});

test("POST /Post-it was not created with blank title", async() => {

});

test("POST /Post-it was not created with duplicate title", async() => {

});

/**TEST READ */

test("GET /Post-it was found by title", async() => {

});

test("GET /Post-it was not found by wrong title", async() => {

});

test("POST /Post-its were found", async() => {

});

/**TEST UPDATE */
test("POST /Post-it as updated successfully", async() => {

});

test("POST /Post-it was not updated, post-it does not exist", async() => {

});

test("POST /Post-it was not updated with blank description", async() => {

});

/**TEST DELETE */
test("POST /Post-it was deleted successfully", async() => {

});

test("POST /Post-it was not deleted successfully", async() => {

});

/**Close database connection*/
afterEach(async() => {
    connection = userModel.getConnection();
    if (connection) {
        await connection.close();
    }

    connection = categoryModel.getConnection();
    if (connection) {
        await connection.close();
    }

    connection = postItModel.getConnection();
    if (connection) {
        await connection.close();
    }
});