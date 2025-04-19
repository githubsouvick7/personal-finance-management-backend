const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("./user.models");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { Resend } = require('resend');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const resend = new Resend('re_DEU5hXmP_8BecrPtQsAwE7itpYoTadniU');

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

router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    await user.save();
    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, {
      expiresIn: "12h",
    });
    const verificationUrl = `http://localhost:3000/verify?token=${token}`;

    resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your email address',
      html: `
        <h2>Email Verification</h2>
        <p>Click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="
            background-color: #6366f1;
            color: white;
            padding: 10px 16px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
        ">Verify Email</a>
        <p>If the button doesn't work, click this link:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
    });

    // res.status(200).json({
    //   message: "Please verify with the code sent to your email",
    //   registrationId: user._id,
    // });
    res.send(`
      <html>
        <body>
          <p>Login successful. You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
