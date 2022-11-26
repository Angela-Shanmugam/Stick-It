//Required Modules
const { faker } = require('@faker-js/faker');
const model = require('../../models/userModel');
const exceptions = require('../../models/exceptions/errors');

//Test database name
const dbName = 'bulletin_board_db_test';

/* Make sure the database is empty before each test.*/
beforeEach(async() => {
    await model.initialize(dbName, true);
});

/**TEST CREATE */
test('User was created successfully.', async() => {

    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //add user to the database
    const results = await model.createUser(username, email, password, icon);

    //verify that the user added was the same as the one that was returned
    expect(results.username).toBe(username);
    expect(results.email).toBe(email);
    expect(results.password).toBe(password);
});

test('User was not created with blank username.', async() => {

    //generate new user
    const username = ' ';
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //add user to the database
    const results = await model.createUser(username, email, password, icon);

    //check results
    expect(results).toBeInstanceOf(exceptions.userException);
});

test('User was not created with blank email.', async() => {

    //generate new user
    const email = ' ';
    const username = faker.internet.userName();
    const password = faker.internet.password();
    const icon = ' ';

    //add user to the database
    const results = await model.createUser(username, email, password, icon);

    //check results
    expect(results).toBeInstanceOf(exceptions.userException);

});

test('User was not created with blank password.', async() => {

    //generate new user
    const password = ' ';
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const icon = ' ';

    //add user to the database
    const results = await model.createUser(username, email, password, icon);

    //check results
    expect(results).toBeInstanceOf(exceptions.userException);

});

test('User was not created with duplicate username.', async() => {

    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    const secondEmail = faker.internet.email();
    const secondPassword = faker.internet.password();

    //add user to the database
    await model.createUser(username, email, password, icon);

    //add duplicate user to the database
    const duplicateResults = await model.createUser(username, secondEmail, secondPassword, icon);

    //check results
    expect(duplicateResults).toBeInstanceOf(exceptions.userException);
});


test('User was not created with duplicate email.', async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //generate another user
    const secondUsername = faker.internet.userName();
    const secondPassword = faker.internet.password();

    //add user to the database
    await model.createUser(username, email, password, icon);

    //add duplicate user to the database
    const duplicateResults = await model.createUser(secondUsername, email, secondPassword, icon);

    //check results
    expect(duplicateResults).toBeInstanceOf(exceptions.userException);
});

/** TEST READ */
test('User was found by email.', async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //add user to the database
    await model.createUser(username, email, password, icon);

    //retrieve user
    const results = await model.findByEmail(email);

    //verify that the user added was the same as the one that was returned
    expect(results.username).toBe(username);
    expect(results.email).toBe(email);
    expect(results.password).toBe(password);
});

test('User was not found by wrong email.', async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';
    //add user to the database
    await model.createUser(username, email, password, icon);

    //create fake email
    const fakeEmail = 'fake@example.com';

    //retrieve user
    const results = await model.findByEmail(fakeEmail);

    //check results
    expect(results).toBeInstanceOf(exceptions.userException);
});

test('User was found by username.', async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //add user to the database
    await model.createUser(username, email, password, icon);

    //retrieve user
    const results = await model.findByUsername(username);

    //verify that the user added was the same as the one that was returned
    expect(results.username).toBe(username);
    expect(results.email).toBe(email);
    expect(results.password).toBe(password);
});

/** TEST UPDATE*/
test('User was updated successfully.', async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //add user to the database
    await model.createUser(username, email, password, icon);

    //generate new username and password
    const newUsername = faker.internet.userName();
    const newPassword = faker.internet.password();
    const newIcon = 'https://upload.wikimedia.org/wikipedia/commons/4/40/Jungkook_x_Samsung_Galaxy_August_2021.png';
    //retrieve user
    const results = await model.updateUser(email, newUsername, newPassword, icon);

    //verify that the user added was the same as the one that was returned
    expect(results.username).toBe(newUsername);
    expect(results.email).toBe(email);
    expect(results.password).toBe(newPassword);

});

test('User was not updated, user does not exist.', async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';

    //generate new username and password
    const newUsername = faker.internet.userName();
    const newPassword = faker.internet.password();

    //generate fake email
    const fakeEmail = faker.internet.email();

    //add user to the database
    await model.createUser(username, email, password, icon);

    //retrieve user
    const results = await model.updateUser(fakeEmail, newUsername, newPassword, icon);

    //check results
    expect(results).toBeInstanceOf(exceptions.userException);
});

/**TEST DELETE */

test('User was deleted successfully.', async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';
    //add user to the database
    await model.createUser(username, email, password, icon);

    //retrieve user
    const results = await model.deleteUser(email);

    //check results
    expect(results).toBe(true);
});

test('User was not deleted successfully.', async() => {
    //generate new user
    const username = faker.internet.userName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const icon = ' ';
    //add user to the database
    await model.createUser(username, email, password, icon);

    //create fake email
    const fakeEmail = ' '

    //retrieve user
    const results = await model.deleteUser(fakeEmail);

    //check results
    expect(results).toBeInstanceOf(exceptions.userException);
});

/* Close the database connection */
afterEach(async() => {
    await model.getConnection().close();
});