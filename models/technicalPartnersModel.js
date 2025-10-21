const mongoose = require("mongoose");

const techPartnerSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const TechPartner = mongoose.model("TechPartner", techPartnerSchema);

module.exports = TechPartner;
