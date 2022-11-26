//Required Modules
const { faker } = require('@faker-js/faker');
const exceptions = require('../../models/exceptions/errors');

//Test database name
const dbName = 'bulletin_board_db_test';

//Models
const postItModel = require('../../models/postItModel');
const categoryModel = require('../../models/categoryModel');
const userModel = require('../../models/userModel');

//Global Fields
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

/**
 * Generates a category from the category Model.
 * @returns Returns the created category.
 */
async function generateCategory() {
    const user = await generateUser();
    const category = await categoryModel.createCategory(
        user.user_id,
        faker.word.noun(),
        faker.word.verb(),
        generateColor().code
    );
    return category;
}


/* Make sure the database is empty before each test.*/
beforeEach(async() => {
    await userModel.initialize(dbName, true);
    await categoryModel.initialize(dbName, true);
    await postItModel.initialize(dbName, true);
});


/**TEST CREATE */
test('Post-it was created successfully.', async() => {

    //generate user
    const user = await generateUser();

    //generate category
    const category = await generateCategory();

    //generate post-it
    const userId = user.user_id;
    const categoryId = category.category_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const pinned = 'F';
    const weekday = 'Monday';

    //add post-it to database
    const results = await postItModel.createPostIt(userId, categoryId, title, description, pinned, weekday);

    //verify that the results contain an array
    expect(Array.isArray(results)).toBe(true);
    expect(results[0].length).toBe(1);

    //verify that the category added was the same as the one that was returned
    expect(results[0][0].title).toBe(title);
    expect(results[0][0].description).toBe(description);
    expect(results[0][0].pinned).toBe(pinned);
    expect(results[0][0].weekday).toBe(weekday);

});

test('Post-it was not created with non-existant user.', async() => {
    //generate category
    const category = await generateCategory();

    //generate post-it
    const userId = ' ';
    const categoryId = category.category_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const pinned = 'F';
    const weekday = 'Monday';

    //add post-it to database
    const results = await postItModel.createPostIt(userId, categoryId, title, description, pinned, weekday);

    //check results
    expect(results).toBeInstanceOf(exceptions.postItException);
});

test('Post-it was not created with non-existant category.', async() => {

    //generate user
    const user = await generateUser();

    //generate post-it
    const userId = user.user_id;
    const categoryId = ' ';
    const title = faker.word.noun();
    const description = faker.word.verb();
    const pinned = 'F';
    const weekday = 'Monday';

    //add post-it to database
    const results = await postItModel.createPostIt(userId, categoryId, title, description, pinned, weekday);

    //check results
    expect(results).toBeInstanceOf(exceptions.postItException);
});

test('Post-it was not created with blank title.', async() => {
    //generate user
    const user = await generateUser();

    //generate category
    const category = await generateCategory();

    //generate post-it
    const userId = user.user_id;
    const categoryId = category.category_id;
    const title = ' ';
    const description = faker.word.verb();
    const pinned = 'F';
    const weekday = 'Monday';

    //add post-it to database
    const results = await postItModel.createPostIt(userId, categoryId, title, description, pinned, weekday);

    //check results
    expect(results).toBeInstanceOf(exceptions.postItException);
});

test('Post-it was not created with duplicate title.', async() => {
    //generate user
    const user = await generateUser();

    //generate category
    const category = await generateCategory();

    //generate post-it
    const userId = user.user_id;
    const categoryId = category.category_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const pinned = 'F';
    const weekday = 'Monday';

    //add post-it to database
    await postItModel.createPostIt(userId, categoryId, title, description, pinned, weekday);

    //generate duplicate parameters
    const secondDescription = faker.word.verb();

    //add duplicate category
    const duplicateResults = await postItModel.createPostIt(userId, categoryId, title, secondDescription, pinned, weekday);

    //check results
    expect(duplicateResults).toBeInstanceOf(exceptions.postItException);
});

/** TEST READ */
test('Post-it was found by title.', async() => {
    //generate user
    const user = await generateUser();

    //generate category
    const category = await generateCategory();

    //generate post-it
    const userId = user.user_id;
    const categoryId = category.category_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const pinned = 'F';
    const weekday = 'Monday';

    //add post-it to database
    await postItModel.createPostIt(userId, categoryId, title, description, pinned, weekday);

    //retrieve category
    const results = await postItModel.findByTitle(title);

    //verify that the results contain an array
    expect(Array.isArray(results)).toBe(true);
    expect(results[0].length).toBe(1);

    //verify that the category added was the same as the one that was returned
    expect(results[0][0].title).toBe(title);
    expect(results[0][0].description).toBe(description);
    expect(results[0][0].pinned).toBe(pinned);
    expect(results[0][0].weekday).toBe(weekday);

});

test('Post-it was not found by wrong title.', async() => {
    //generate user
    const user = await generateUser();

    //generate category
    const category = await generateCategory();

    //generate post-it
    const userId = user.user_id;
    const categoryId = category.category_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const pinned = 'F';
    const weekday = 'Monday';

    //add post-it to database
    await postItModel.createPostIt(userId, categoryId, title, description, pinned, weekday);

    //generate fake title
    const fakeTitle = 'pikachu';

    //retrieve title
    const results = await postItModel.findByTitle(fakeTitle);

    //check results
    expect(results).toBeInstanceOf(exceptions.postItException);
});

/** TEST UPDATE*/
test('Post-it was updated successfully.', async() => {
    //generate user
    const user = await generateUser();

    //generate category
    const category = await generateCategory();

    //generate post-it
    const userId = user.user_id;
    const categoryId = category.category_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const pinned = 'F';
    const weekday = 'Monday';

    //add post-it to database
    await postItModel.createPostIt(userId, categoryId, title, description, pinned, weekday);

    //generate new description
    const newDescription = 'water';

    //update post-it
    const results = await postItModel.updatePostIt(title, newDescription, weekday, category, pinned);

    //verify that the results contain an array
    expect(Array.isArray(results)).toBe(true);
    expect(results[0].length).toBe(1);

    //verify that the post-it added was the same as the one that was returned
    expect(results[0][0].title).toBe(title);
    expect(results[0][0].description).toBe(newDescription);
    expect(results[0][0].pinned).toBe(pinned);
    expect(results[0][0].weekday).toBe(weekday);
});

test('Post-it was not updated with blank description.', async() => {
    //generate user
    const user = await generateUser();

    //generate category
    const category = await generateCategory();

    //generate post-it
    const userId = user.user_id;
    const categoryId = category.category_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const pinned = 'F';
    const weekday = 'Monday';

    //add post-it to database
    await postItModel.createPostIt(userId, categoryId, title, description, pinned, weekday);

    //generate new description
    const newDescription = ' ';

    //update post-it
    const results = await postItModel.updatePostIt(title, newDescription, weekday, category, pinned);

    //check results
    expect(results).toBeInstanceOf(exceptions.postItException);
});

/**TEST DELETE */
test('Post-it was deleted successfully.', async() => {
    //generate user
    const user = await generateUser();

    //generate category
    const category = await generateCategory();

    //generate post-it
    const userId = user.user_id;
    const categoryId = category.category_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const pinned = 'F';
    const weekday = 'Monday';

    //add post-it to database
    await postItModel.createPostIt(userId, categoryId, title, description, pinned, weekday);

    //delete post-it
    const results = await postItModel.deletePostIt(title);

    //check results
    expect(results).toBe(true);
});

test('Post-it was not deleted successfully.', async() => {
    //generate user
    const user = await generateUser();

    //generate category
    const category = await generateCategory();

    //generate post-it
    const userId = user.user_id;
    const categoryId = category.category_id;
    const title = faker.word.noun();
    const description = faker.word.verb();
    const pinned = 'F';
    const weekday = 'Monday';

    //add post-it to database
    await postItModel.createPostIt(userId, categoryId, title, description, pinned, weekday);

    //generate fake title
    const fakeTitle = ' ';

    //delete post-it
    const results = await postItModel.deletePostIt(fakeTitle);

    //check results
    expect(results).toBeInstanceOf(exceptions.postItException);
});

/* Close the database connection */
afterEach(async() => {
    await postItModel.getConnection().close();
    await categoryModel.getConnection().close();
    await userModel.getConnection().close();
});