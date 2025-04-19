const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema(
    {
        verificationId: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
        },
        otpSecret: {
            type: String,
            required: true,
        },
        otpExpires: {
            type: Date,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 3600, // Documents will be automatically deleted after 1 hour
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("TempUser", tempUserSchema);