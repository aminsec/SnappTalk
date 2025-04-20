async function handleAuth(req, resp) {
    const { email, username, password } = req.body;
    console.log(email, username, password);
};

module.exports = {
    handleAuth,
}