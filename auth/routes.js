const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./user.models");
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET;
const baseUrl = process.env.BASE_URL;

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${baseUrl}/login`,
  }),
  async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: "User authentication failed" });
      }

      // Generate JWT
      const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, {
        expiresIn: "12h",
      });

      res.redirect(`${baseUrl}/?token=${token}`);
    } catch (error) {
      console.error("Error in Google callback:", error);
      res.status(500).json({ message: "Server error during authentication" });
    }
  }
);

router.get("/logout", (req, res) => {
  try {
    if (req.isAuthenticated()) {
      req.logout((err) => {
        if (err) {
          console.error("Error logging out:", err);
          return res.status(500).json({ message: "Error logging out" });
        }
      });
    }

    if (req.headers.authorization) {
      return res.status(200).json({
        message: "Logged out successfully. Please remove token from storage.",
      });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
});

module.exports = router;
