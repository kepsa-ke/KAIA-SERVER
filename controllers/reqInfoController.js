const ReqInfo = require("../models/reqInfoModel");
const User = require("../models/userModels");
const asyncHandler = require("express-async-handler");

// create req
exports.createReq = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    res.status(400).send("No request body provided");
    return;
  }

  const { firstName, surName, email, phone, organizationName, message } =
    req.body;

  const requiredFields = [
    "firstName",
    "surName",
    "email",
    "phone",
    "organizationName",
    "message",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      res.status(400).send(`Missing required field: ${field}`);
      return;
    }
  }

  const reqInfo = await ReqInfo.create({
    firstName,
    surName,
    email,
    phone,
    organizationName,
    message,
  });

  if (reqInfo) {
    res.status(201).json(reqInfo);
    return;
  } else {
    res.status(500).send("something went wrong");
    return;
  }
});

// fetch all request
exports.getAllRequest = asyncHandler(async (req, res) => {
  const reqInfo = await ReqInfo.find().sort({ createdAt: -1 });
  if (reqInfo) {
    res.status(200).json(reqInfo);
  } else {
    res.status(500).send("Failed to fetch requests");
  }
});

// fetch specific request
exports.fetchSpecifiRequest = asyncHandler(async (req, res) => {
  const reqInfo = await ReqInfo.findOne({ _id: req.params.id });
  if (reqInfo) {
    res.status(200).json(reqInfo);
  } else {
    res.status(500).send("Failed to fetch request");
  }
});

//delete request
exports.permanentlyDeleteRequest = asyncHandler(async (req, res) => {
  const reqInfo = await ReqInfo.findById(req.params.id);

  if (!reqInfo) {
    res.status(500).send("Info not found");
  } else {
    await ReqInfo.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Request deleted successfully" });
  }
});

exports.toggleHandling = asyncHandler(async (req, res) => {
  const reqId = req.params.id;

  // Find request and validate existence
  const reqInfo = await ReqInfo.findById(reqId);
  if (!reqInfo) {
    res.status(400).send("request not found");
    return;
  }

  // Toggle approval status
  const updatedRequest = await ReqInfo.findByIdAndUpdate(
    reqId,
    { reqStatus: !reqInfo.reqStatus },
    { new: true }
  );

  if (!updatedRequest) {
    res.status(400).send("Failed to update request");
    return;
  }

  res.json(updatedRequest);
});
