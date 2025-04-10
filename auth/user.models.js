const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
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
  userType: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
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

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User-qrmanagement", userSchema);
