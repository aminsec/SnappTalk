import request from "supertest";
import app from "../app";
import { getUsersCollection } from "../models/users.model";
import { expect } from "chai";
import { after } from "node:test";

//Creating a server instance for testing. This allows us to use the app instance in our tests
const server = request(app);

describe('Account tests', async () => {
    //Sample data for testing
    let sampleValidEmail = Date.now().toString() + "a" + "@example.com";
    let sampleValidPassword = "validPassword123_";
    let sampleInvalidEmail = "invalidEmailFormat";
    let sampleWeakPassword = "123_a";
    
    //Making a sample user info to test with it
    let requestBody = {
        email: sampleValidEmail, // Unique email
        password: sampleValidPassword
    };

    const response = await server 
        .post('/auth/')
        .send(JSON.stringify(requestBody))
        .set('Content-Type', 'application/json');
            
    //Parsing the response
    const sampleToken = response.headers['set-cookie'][0].split(';')[0].split('=')[1];
    const sampleUserInfo = JSON.parse(response.text);

    //Tests
    describe("GET /user/info", () => {
        it("should return user info", async () => {
            const response = await server 
                .get('/user/info')
                .set('Cookie', `token=${sampleToken}`);
            
            //Parsing the response
            const resp = JSON.parse(response.text);

            //Expectings
            expect(response.status).to.equal(200);
            expect(resp).to.have.property('state', 'success');
            expect(resp.userInfo).to.have.property('id');
        });
    });

    describe("PUT /user/info", () => {
        it("should update user info", async () => {
            const requestBody = {
                username: Date.now().toString() + "b", //unique username
                email: sampleValidEmail,
                bio: "This is a new bio."
            };

            const response = await server 
                .put('/user/info')
                .set('Cookie', `token=${sampleToken}`)
                .send(JSON.stringify(requestBody))
                .set('Content-Type', 'application/json');
            
            //Parsing the response
            const resp = JSON.parse(response.text);

            //Expectings
            expect(response.status).to.equal(200);
            expect(resp).to.have.property('state', 'success');
        });
    });
}); 