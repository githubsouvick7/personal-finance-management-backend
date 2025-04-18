const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("./user.models");
const router = express.Router();

const SECRET_KEY = "your_secret_key";
const baseUrl = "http://localhost:3000";

router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"],
}));

router.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${baseUrl}/login`,
    session: false,
  }),
  async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: "User authentication failed" });
      }

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
  return res.status(200).json({
    message: "Logged out. Please remove token from client.",
  });
});

router.get("/user", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("authToken", authHeader)

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "login successfully", user: user });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
