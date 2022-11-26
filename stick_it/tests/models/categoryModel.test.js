//Required Modules
const { faker } = require('@faker-js/faker');
const exceptions = require('../../models/exceptions/errors');
const model = require('../../models/categoryModel');

//Test database name
const dbName = 'bulletin_board_db_test';

//Models
const userModel = require('../../models/userModel');

//Global fields
var user;
const colors = [
    { color: "Red", code: "FF4763" },
    { color: "Yellow", code: "FFFA99" },
    { color: "Green", code: "A9E69F" },
    { color: "Blue", code: "9AC1B5" },
    { color: "Purple", code: "C5A6C9" },
    { color: "Lavender", code: "D2D2DB" },
    { color: "Pink", code: "FF5C74" },
    { color: "White", code: "FFFFFF" },
];

/**Generates a different color for the category */
const generateColor = () => {
    const index = Math.floor((Math.random() * colors.length));
    return colors.slice(index)[0];
}

/* Make sure the database is empty before each test.*/
beforeEach(async() => {
    await userModel.initialize(dbName, true);
    await model.initialize(dbName, true);

});

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


/**TEST CREATE */
test('Category was created successfully.', async() => {

    //generate category
    const user = await generateUser();
    const userId = user.user_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const colorCode = generateColor().code;

    //add category to database
    const results = await model.createCategory(userId, title, description, colorCode);

    //verify that the results contain an array
    expect(Array.isArray(results)).toBe(true);
    expect(results[0].length).toBe(1);

    //verify that the category added was the same as the one that was returned
    expect(results[0][0].title).toBe(title);
    expect(results[0][0].description).toBe(description);
    expect(results[0][0].color_code).toBe(colorCode);
});

test('Category was not created with non-existant user.', async() => {
    //generate category
    const userId = ' ';
    const title = faker.word.noun();
    const description = faker.word.verb();
    const colorCode = generateColor().code;

    //add category to database
    const results = await model.createCategory(userId, title, description, colorCode);

    //check results
    expect(results).toBeInstanceOf(exceptions.categoryException);
});

test('Category was not created with blank title.', async() => {
    //generate category
    const user = await generateUser();
    const userId = user.user_id;
    const title = ' ';
    const description = faker.word.verb();
    const colorCode = generateColor().code;

    //add category to database
    const results = await model.createCategory(userId, title, description, colorCode);

    //check results
    expect(results).toBeInstanceOf(exceptions.categoryException);
});

test('Category was not created with duplicate title.', async() => {
    //generate category
    const user = await generateUser();
    const userId = user.user_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const colorCode = generateColor().code;

    //generate duplicate parameters
    const secondDescription = faker.word.verb();
    const secondColorCode = generateColor().code;

    //add category to database
    await model.createCategory(userId, title, description, colorCode);

    //add duplicate category
    const duplicateResults = await model.createCategory(userId, title, secondDescription, secondColorCode);

    //check results
    expect(duplicateResults).toBeInstanceOf(exceptions.categoryException);
});

/** TEST READ */
test('Category was found by title.', async() => {
    //generate category
    const user = await generateUser();
    const userId = user.user_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const colorCode = generateColor().code;

    //add category to database
    await model.createCategory(userId, title, description, colorCode);

    //retrieve category
    const results = await model.findByTitle(title);

    //verify that the results contain an array
    expect(Array.isArray(results)).toBe(true);
    expect(results[0].length).toBe(1);

    //verify that the category added was the same as the one that was returned
    expect(results[0][0].title).toBe(title);
    expect(results[0][0].description).toBe(description);
    expect(results[0][0].color_code).toBe(colorCode);

});

test('Category was not found by wrong title.', async() => {
    //generate category
    const user = await generateUser();
    const userId = user.user_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const colorCode = generateColor().code;

    //generate fake title
    const fakeTitle = ' ';

    //add category to database
    await model.createCategory(userId, title, description, colorCode);

    //retrieve title
    const results = await model.findByTitle(fakeTitle);

    //check results
    expect(results).toBeInstanceOf(exceptions.categoryException);
});

/** TEST UPDATE*/
test('Category was updated successfully.', async() => {
    //generate category
    const user = await generateUser();
    const userId = user.user_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const colorCode = generateColor().code;

    //add category to database
    await model.createCategory(userId, title, description, colorCode);

    //generate new description
    const newDescription = 'water';

    //update category
    const results = await model.updateCategory(title, newDescription);

    //verify that the results contain an array
    expect(Array.isArray(results)).toBe(true);
    expect(results[0].length).toBe(1);

    //verify that the category added was the same as the one that was returned
    expect(results[0][0].title).toBe(title);
    expect(results[0][0].description).toBe(newDescription);
    expect(results[0][0].color_code).toBe(colorCode);
});

test('Category was not updated, category does not exist.', async() => {
    //generate category
    const user = await generateUser();
    const userId = user.user_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const colorCode = generateColor().code;

    //add category to database
    await model.createCategory(userId, title, description, colorCode);

    //generate description and fake title
    const newDescription = faker.word.adjective();
    const fakeTitle = 'fakeTitle';

    //update category
    const results = await model.updateCategory(fakeTitle, newDescription);

    //check results
    expect(results).toBeInstanceOf(exceptions.categoryException);
});

test('Category was not updated with blank description.', async() => {
    //generate category
    const user = await generateUser();
    const userId = user.user_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const colorCode = generateColor().code;

    //add category to database
    await model.createCategory(userId, title, description, colorCode);

    //generate new description
    const newDescription = ' ';

    //update category
    const results = await model.updateCategory(title, newDescription);

    //check results
    expect(results).toBeInstanceOf(exceptions.categoryException);
});

/**TEST DELETE */
test('Category was deleted successfully.', async() => {
    //generate category
    const user = await generateUser();
    const userId = user.user_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const colorCode = generateColor().code;

    //add category to database
    await model.createCategory(userId, title, description, colorCode);

    //delete category
    const results = await model.deleteCategory(title);

    //check results
    expect(results).toBe(true);
});

test('Category was not deleted successfully.', async() => {
    //generate category
    const user = await generateUser();
    const userId = user.user_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const colorCode = generateColor().code;

    //add category to database
    await model.createCategory(userId, title, description, colorCode);

    //generate fake title
    const fakeTitle = ' ';

    //delete category
    const results = await model.deleteCategory(fakeTitle);

    //check results
    expect(results).toBeInstanceOf(exceptions.categoryException);
});

/* Close the database connection */
afterEach(async() => {
    await model.getConnection().close();
    await userModel.getConnection().close();
});