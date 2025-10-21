const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModels");

exports.registerUser = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    res.status(400).send("No request body provided");
    return;
  }

  const { username, email, organizationName, phone, password } = req.body;

  const requiredFields = [
    "username",
    "email",
    "organizationName",
    "phone",
    "password",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      res.status(400).send(`Missing required field: ${field}`);
      return;
    }
  }

  const newUsername = username.trim();
  const newEmail = email.trim(); //remove white spaces
  const newPhone = phone.trim();

  // Check for existing records
  const existingUser = await User.findOne({
    $or: [{ username: newUsername }, { email: newEmail }, { phone: newPhone }],
  });

  if (existingUser) {
    if (existingUser.username === newUsername) {
      res.status(400).send("Username already exists");
      return;
    }
    if (existingUser.email === newEmail) {
      res.status(400).send(`Email: ${newEmail} already exists`);
      return;
    }
    if (existingUser.phone === newPhone) {
      res.status(400).send(`Phone: ${newPhone} already exists`);
      return;
    }
  }

  // hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    username: newUsername,
    email: newEmail,
    phone: newPhone,
    organizationName,
    password: hashedPassword,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      organizationName: user.organizationName,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).send("User not created");
    return;
  }
});

exports.loginUser = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    res.status(400).send("No request body provided");
    return;
  }

  const { email, password } = req.body;

  const requiredFields = ["email", "password"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      res.status(400).send(`Missing required field: ${field}`);
      return;
    }
  }

  const newEmail = email.trim();

  // check if user exists
  const user = await User.findOne({ email: newEmail });

  if (!user) {
    res.status(400).send(`user not found in DB`);
    return;
  }

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      organizationName: user.organizationName,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).send("Incorrect paswword");
    return;
  }
});

// fetch all users
exports.allUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ $natural: -1 });
  if (users) {
    res.status(200).send(users);
  } else {
    res.status(500).send("Not able to fetch users");
  }
});

// fetch based on ID
exports.fetchSpecificUserOnId = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id });
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(500).send("Not able to fetch user");
    return;
  }
});

exports.updateAccount = asyncHandler(async (req, res) => {
  const { password, ...otherUpdates } = req.body;
  const userId = req.params.id;

  // Find user and validate existence
  const user = await User.findById(userId);
  if (!user) {
    res.status(400).send("User not found");
    return;
  }

  // Prepare update object
  const updates = { ...otherUpdates };

  // Handle password update separately
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updates.password = hashedPassword;
  }

  // Perform single atomic update
  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    res.status(400).send("Failed to update user");
    return;
  }

  res.json(updatedUser);
});

exports.toggleAdminStatus = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Find user and validate existence
  const user = await User.findById(userId);
  if (!user) {
    res.status(400).send("User not found");
    return;
  }

  // Toggle the isAdmin status
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isAdmin: !user.isAdmin },
    { new: true }
  );

  if (!updatedUser) {
    res.status(400).send("Failed to update admin status");
    return;
  }

  res.json(updatedUser);
});

// delete all users permanently
exports.deleteAllUsers = asyncHandler(async (req, res, next) => {
  try {
    // Delete all users
    await User.deleteMany({});
    res.json({ message: "All users have been deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while deleting users." });
  }
});

exports.permanentlyDeleteUser = asyncHandler(async (req, res) => {
  // check if user exists
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(500).send("User not found in DB");
  } else {
    await User.findByIdAndDelete(req.params.id);
    res.status(201).json(user._id);
  }
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });
};
