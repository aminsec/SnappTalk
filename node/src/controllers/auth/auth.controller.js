const { getUsersCollection } = require('../../models/users.model');

async function handleAuth(req, resp) {
    const { email, password } = req.body;
    const usersCollection = await getUsersCollection();
    const addResult = await usersCollection.insertOne({
        email,
        password
    });

    console.log(addResult);
};

module.exports = {
    handleAuth,
};