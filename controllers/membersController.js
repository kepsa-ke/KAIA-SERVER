const Member = require("../models/membersModel");
const asyncHandler = require("express-async-handler");

// create a member
exports.createMember = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    res.status(400).send("No request body provided");
    return;
  }

  const { firstName, surName, role, email, phone, organizationName, website } =
    req.body;

  const requiredFields = [
    "firstName",
    "surName",
    "role",
    "email",
    "phone",
    "organizationName",
    "website",
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      res.status(400).send(`Missing required field: ${field}`);
      return;
    }
  }

  const member = await Member.create({
    firstName,
    surName,
    role,
    email,
    phone,
    organizationName,
    website,
  });

  if (member) {
    res.status(201).json(member);
    return;
  } else {
    res.status(500).send("something went wrong");
    return;
  }
});

// fetch all members
exports.getAllMembers = asyncHandler(async (req, res) => {
  // Find all members
  const members = await Member.find().sort({ createdAt: -1 });
  if (members) {
    res.status(200).json(members);
  } else {
    res.status(500).send("Failed to fetch members");
  }
});

//fetch only approved members
exports.fetchApprovedMembers = asyncHandler(async (req, res) => {
  let approved = true;
  const members = await Member.find({ approved }).sort({ $natural: -1 });
  if (members) {
    res.status(200).json(members);
    return;
  } else {
    throw new Error("Error Fetching Members");
  }
});

// see my organizations only
exports.getMyOrganzations = asyncHandler(async (req, res) => {
  // I need your email
  const email = req.user.email;
  if (!email) {
    res.status(400).send("Authorization Failed");
  }
  const members = await Member.find({ email }).sort({ createdAt: -1 });
  if (members) {
    res.status(200).json(members);
  } else {
    res.status(500).send("Failed to fetch your organizations");
  }
});

// fetch specific
exports.fetchSpecific = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ _id: req.params.id });
  if (member) {
    res.status(200).json(member);
  } else {
    res.status(500).send("Failed to fetch member");
  }
});

//update
exports.updateSpecific = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    res.status(400).send("No request body provided");
    return;
  }
  const updatedMember = await Member.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    }
  );

  if (updatedMember) {
    res.status(200).json(updatedMember);
  } else {
    res.status(500).send("Error Updating Member");
  }
});

//delete
exports.deleteOrganization = asyncHandler(async (req, res) => {
  // check if exists
  const member = await Member.findById(req.params.id);

  if (!member) {
    res.status(500).send("member not found");
  } else {
    await Member.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Member deleted successfully" });
  }
});

exports.toggleApproval = asyncHandler(async (req, res) => {
  const memberId = req.params.id;

  // Find member and validate existence
  const member = await Member.findById(memberId);
  if (!member) {
    res.status(400).send("member not found");
    return;
  }

  // Toggle approval status
  const updatedMember = await Member.findByIdAndUpdate(
    memberId,
    { approved: !member.approved },
    { new: true }
  );

  if (!updatedMember) {
    res.status(400).send("Failed to update approved status");
    return;
  }

  res.json(updatedMember);
});
