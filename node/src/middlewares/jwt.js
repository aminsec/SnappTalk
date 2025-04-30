const jwt = require('jsonwebtoken');

//A middleware to validate JWT token
async function validateJWT(req, resp, next){
  //Redirecting to /login if token is not found
  if(!req.cookies.token){
    resp.redirect("/login");
    return;
  }

  //Getting token from cookies
  const token = req.cookies.token;

  //Verifing token in try-catch. If token was not valid, it will go through an error and we handle it with catch
  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userInfo = userInfo; // Assigning user's info to req as an object
    next();
  } catch (error) {
    resp.redirect("/login");
  }
};

module.exports = validateJWT;