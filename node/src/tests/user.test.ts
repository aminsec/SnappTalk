import request from "supertest";
import app from "../app";
import { getUsersCollection } from "../models/users.model";
import { expect } from "chai";
import { after } from "node:test";

//Creating a server instance for testing. This allows us to use the app instance in our tests
const server = request(app);

describe('Account tests', async () => {
    //Preparing sample data for testing
    let sampleValidEmail = Date.now().toString() + "a" + "@example.com";
    let sampleValidPassword = "validPassword123_";
    let sampleInvalidEmail = "invalidEmailFormat";
    let sampleWeakPassword = "123_a";
    let sampleTakenEmail = Date.now().toString() + "ThisIsTakenEmail" + "@example.com";
    let sampleTakenUsername = "";
    
    //Main user's info to use in tests
    let requestBody = {
        email: sampleValidEmail, // Unique email
        password: sampleValidPassword
    };

    //Thirdanry user's info
    let secondUserRequestBody = {
        email: sampleTakenEmail,
        password: sampleValidPassword
    };

    //Creating main user
    const firstResponse = await server
    .post('/auth/')
    .send(requestBody)
    .set('Content-Type', 'application/json');

    //Creating thirdanry user
    const secondResponse = await server
    .post('/auth/')
    .send(secondUserRequestBody)
    .set('Content-Type', 'application/json');

    //Parsing the response to take token
    let sampleToken = firstResponse.headers['set-cookie'][0].split(';')[0].split('=')[1];
    let sampleSecondToken = secondResponse.headers['set-cookie'][0].split(';')[0].split('=')[1];

    const thirdanryUserInfo = await server.get('/user/info').set("cookie", `token=${sampleSecondToken}`); // Getting thirdanry user info
    sampleTakenUsername = thirdanryUserInfo.body.userInfo.username; // Assigning as taken username

    //Tests
    describe("GET /user/info", () => {
        it("should return user info", async () => {
            const response = await server 
                .get('/user/info')
                .set('Cookie', `token=${sampleToken}`);
            
            //Parsing the response
            const resp = response.body;

            //Expectings
            expect(response.status).to.equal(200);
            expect(resp).to.have.property('state', 'success');
            expect(resp.userInfo).to.have.property('id');
        });
    });

    describe("PUT /user/info/password", () => {
        //Happy path 
        it("should update user password", async () => {
            const requestBody = {
                old_password: sampleValidPassword,
                new_password: sampleValidPassword + "New"
            };

            const response = await server 
                .put('/user/info/password')
                .set('Cookie', `token=${sampleToken}`)
                .send(requestBody)
                .set('Content-Type', 'application/json');

            //Parsing the response
            const resp = response.body;

            //Updating password with new one for other test
            sampleValidPassword = requestBody.new_password;

            //Expectings
            expect(response.status).to.equal(200);
            expect(resp).to.have.property('state', 'success');
        });

        it("should not update password with incorrect old password", async () => {
            const requestBody = {
                old_password: Date.now().toString(), //as incorrect password
                new_password: sampleValidEmail + "New"
            };

            const response = await server 
                .put('/user/info/password')
                .set('Cookie', `token=${sampleToken}`)
                .send(requestBody)
                .set('Content-Type', 'application/json');
            
            //Parsing the response
            const resp = response.body;

            //Expectings
            expect(response.status).to.equal(400);
            expect(resp).to.have.property('type', 'input_error');
        });

        it("should not update password with new weak password", async () => {
            const requestBody = {
                old_password: sampleValidPassword,
                new_password: sampleWeakPassword
            };

            const response = await server 
                .put('/user/info/password')
                .set('Cookie', `token=${sampleToken}`)
                .send(requestBody)
                .set('Content-Type', 'application/json');
            
            //Parsing the response
            const resp = response.body;

            //Expectings
            expect(response.status).to.equal(400);
            expect(resp).to.have.property('type', 'input_error');
        });

        it("should not accept password with more than 24 character", async () => {
            const requestBody = {
                old_password: sampleValidPassword,
                new_password: "loooooooooooooooooooooooooooooongPassword"
            };

            const response = await server 
                .put('/user/info/password')
                .set('Cookie', `token=${sampleToken}`)
                .send(requestBody)
                .set('Content-Type', 'application/json');
            
            //Parsing the response
            const resp = response.body;

            //Expectings
            expect(response.status).to.equal(400);
            expect(resp).to.have.property('type', 'input_error');            
        });

        it("should not accept password with less than 6 character", async () => {
            const requestBody = {
                old_password: sampleValidPassword,
                new_password: "123" //as short pass
            };

            const response = await server 
                .put('/user/info/password')
                .set('Cookie', `token=${sampleToken}`)
                .send(requestBody)
                .set('Content-Type', 'application/json');
            
            //Parsing the response
            const resp = response.body;

            //Expectings
            expect(response.status).to.equal(400);
            expect(resp).to.have.property('type', 'input_error');            
        });

        it("should not accept empty password", async () => {
            const requestBody = {
                old_password: "",
                new_password: "" //as short pass
            };

            const response = await server 
                .put('/user/info/password')
                .set('Cookie', `token=${sampleToken}`)
                .send(requestBody)
                .set('Content-Type', 'application/json');
            
            //Parsing the response
            const resp = response.body;

            //Expectings
            expect(response.status).to.equal(400);
            expect(resp).to.have.property('type', 'input_error');  
        });
    });

    describe("PUT /user/info", () => {
        it("should update user info with correct and acceptable information", async () => {
            const requestBody = {
                username: Date.now().toString() + "b", //unique username
                email: sampleValidEmail,
                bio: "This is a new bio."
            };

            const response = await server 
                .put('/user/info')
                .set('Cookie', `token=${sampleToken}`)
                .send(requestBody)
                .set('Content-Type', 'application/json');
            
            //Parsing the response
            const resp = response.body;

            //Saving new token for other tests
            const newToken = response.headers['set-cookie'][0].split(';')[0].split('=')[1];
            sampleToken = newToken;

            //Expectings
            expect(response.status).to.equal(200);
            expect(resp).to.have.property('state', 'success');
        });

        it("should not update username to a taken username", async () => {
            const requestBody = {
                username: sampleTakenUsername, //taken username
                email: sampleValidEmail,
                bio: "This is a new bio."
            };

            const response = await server 
                .put('/user/info')
                .set('Cookie', `token=${sampleToken}`)
                .send(requestBody)
                .set('Content-Type', 'application/json');
            
            //Parsing the response
            const resp = response.body;

            //Expectings
            expect(response.status).to.equal(400);
            expect(resp).to.have.property('state', 'failed');
            expect(resp).to.have.property('message', 'This username already exists');
        });

        it("should not update email to a taken email", async () => {
            const requestBody = {
                username: Date.now().toString(), //A valid username
                email: sampleTakenEmail,
                bio: "This is a new bio."
            };

            const response = await server 
                .put('/user/info')
                .set('Cookie', `token=${sampleToken}`)
                .send(requestBody)
                .set('Content-Type', 'application/json');

            //Parsing the response
            const resp = response.body;

            //Expectings
            expect(response.status).to.equal(400);
            expect(resp).to.have.property('state', 'failed');
            expect(resp).to.have.property('message', 'This email already exists');
        });

        it("should not update email to an invalid email", async () => {
            const requestBody = {
                username: Date.now().toString(), //A valid username
                email: sampleInvalidEmail,
                bio: "This is a new bio."
            };

            const response = await server 
                .put('/user/info')
                .set('Cookie', `token=${sampleToken}`)
                .send(requestBody)
                .set('Content-Type', 'application/json');

            //Parsing the response
            const resp = response.body;

            expect(response.status).to.equal(400);
            expect(resp).to.have.property('state', 'failed');
            expect(resp).to.have.property('message', 'Invalid email address.');
        });
    });

    describe("POST /user/info/profile", () => {
        it("should update user profile", async () => {
            const requestBody = {
                content: "iVBORw0KGgoQ5IlyODP+z3L8b8vNkQzFsIRNJVMcEiOdM6ThHlRCn8cVN+TrCUN4XYJa8gVjEWT8iHC1Kuj6eL8qPi5HnihVmc0Ch5PvhKEA5YIADQgQS2NDAFZAFBe19DH/wn7wkCHCAGGYAP7BXM0IhEWY8QHmNBIfgTIj7IGx7nL+vlgwLIfx1m5Ud7kC7rLZCNyAZPIM4FYSAH/pfIRgmHoyWAx5AR/CM6BzYuzDcHNmn/v+eH2O8MEzLhCiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDxleGlmOlVzZXJDb21tZW50PlNjcmVlbnNob3Q8L2V4aWY6VXNlckNvbW1lbnQ+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj4yODgwPC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxZRGltZW5zaW9uPjE4MDA8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj4xNDQvMTwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+MTQ0LzE8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgqLxgFpAAAAHElEQVQYGWPk5uP/z4AHMOGRA0uNKoCEEOXhAADYLwE/Q181RAAAAABJRU5ErkJgggo="
            };

            const response = await server 
                .post('/user/info/profile')
                .set('Cookie', `token=${sampleToken}`)
                .send(requestBody)
                .set('Content-Type', 'application/json');

            //Parsing the response
            const resp = response.body

            //Saving new token for other tests
            const newToken = response.headers['set-cookie'][0].split(';')[0].split('=')[1];
            sampleToken = newToken;

            //Expectings
            expect(response.status).to.equal(200);
            expect(resp).to.have.property('state', 'success');
        });
    });

    after(async () => {
        //Cleaning up the database after tests
        const usersCollection = await getUsersCollection();
        const deleteResult = await usersCollection.deleteMany({
            email: {
                $in: [sampleValidEmail, sampleTakenEmail]
            }
        });

        //Expectings
        expect(deleteResult.acknowledged).to.equal(true);
    });
}); 