const mongoose = require("mongoose");
const { boolean } = require("zod");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true,
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  googleId: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  email_verified: {
    type: Boolean
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },
  profilePicture: {
    type: String,
    default: "1735840424967-profile.png",
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  createdAt: { type: Number, default: Date.now },
  updatedAt: Number,
});

module.exports = mongoose.model("User-qrmanagement", userSchema);
