import request from "supertest";
import app from "../app";
import { getUsersCollection } from "../models/users.model";
import { expect } from "chai";
import { after } from "node:test";

//Creating a server instance for testing. This allows us to use the app instance in our tests
const server = request(app);

describe('Authentication Tests', () => {
    //Sample data for testing
    let sampleValidEmail = Date.now().toString() + "a" + "@example.com";
    let sampleValidPassword = "validPassword123_";
    let sampleInvalidEmail = "invalidEmailFormat";
    let sampleWeakPassword = "123_a";

    describe("POST /auth/", () => {
        it("should return 400 for invalid email format and weak password", async () => {
            let requestBody = {
                email: sampleInvalidEmail, // Unique email
                password: sampleWeakPassword
            };

            const response = await server 
                .post('/auth/')
                .send(JSON.stringify(requestBody))
                .set('Content-Type', 'application/json');
            
            //Parsing the response
            const resp = JSON.parse(response.text);

            //Expectings
            expect(response.status).to.equal(400);
            expect(resp).to.have.property('state', 'failed');
        });
        
        it("should create user with valid email and password", async () => {
            let requestBody = {
                email: sampleValidEmail, // Unique email
                password: sampleValidPassword
            };

            const response = await server 
                .post('/auth/')
                .send(JSON.stringify(requestBody))
                .set('Content-Type', 'application/json');
            
            //Parsing the response
            const resp = JSON.parse(response.text);

            //Expectings
            expect(response.status).to.equal(200);
            expect(response.headers['set-cookie'][0].startsWith("token=ey"));
            expect(resp).to.have.property('state', 'success');
        });

        after(async () => {
            //Cleaning up the database after tests
            const usersCollection = await getUsersCollection();
            const deleteResult = await usersCollection.deleteOne({ email: sampleValidEmail });

            //Expectings
            expect(deleteResult.acknowledged).to.equal(true);
        });
    });    
}); 