const TechPartner = require("../models/technicalPartnersModel");
const User = require("../models/userModels");
const cloudinary = require("../config/cloudinary");
const asyncHandler = require("express-async-handler");

// create a partner
exports.createPartner = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    res.status(400).send("No request body provided");
    return;
  }

  const { organizationName, link, image } = req.body;

  const requiredFields = ["organizationName", "link", "image"];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      res.status(400).send(`Missing required field: ${field}`);
      return;
    }
  }

  const partner = await TechPartner.create({
    organizationName,
    link,
    image,
  });

  if (partner) {
    res.status(201).json(partner);
    return;
  } else {
    res.status(500).send("something went wrong");
    return;
  }
});

// fetch all partners
exports.getAllPartners = asyncHandler(async (req, res) => {
  const partners = await TechPartner.find().sort({ createdAt: -1 });
  if (partners) {
    res.status(200).json(partners);
  } else {
    res.status(500).send("Failed to fetch partners");
  }
});

//update partner
exports.updateSpecificPartner = asyncHandler(async (req, res) => {
  // Validate request body
  if (!req.body) {
    res.status(400).send("No request body provided");
    return;
  }
  const updatedPartner = await TechPartner.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    }
  );

  if (updatedPartner) {
    res.status(200).json(updatedPartner);
  } else {
    res.status(500).send("Error Updating Partner");
  }
});

//delete partner
exports.permanentlyDeletePartner = asyncHandler(async (req, res) => {
  // check if partner exists
  const partner = await TechPartner.findById(req.params.id);

  if (!partner) {
    res.status(500).send("partner not found");
  } else {
    await TechPartner.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Partner deleted successfully" });
  }
});
