const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModels");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let result = await User.findById(decoded.id).select("-password");

      if (result) {
        // Get user from the token
        req.user = await User.findById(decoded.id).select("-password");
      } else {
        res.status(401).send("The logged in user no longer exists");
        throw new Error();
      }

      next();
    } catch (error) {
      // console.log(error);
      res.status(401).send("Not authorized, JWT expired");
      return;
    }
  }

  if (!token) {
    res.status(401).send("Not authorized, no token");
    return;
  }
});

module.exports = { protect };
