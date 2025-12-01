const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      max: 50,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    organizationName: {
      type: String,
      default: "",
    },

    password: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("Users", userSchema);

module.exports = User;
