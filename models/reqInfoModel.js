const mongoose = require("mongoose");

const reqInfoSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    surName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    organizationName: {
      type: String,
      required: true,
    },
    //reached out ?
    reqStatus: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ReqInfo = mongoose.model("ReqInfo", reqInfoSchema);

module.exports = ReqInfo;
