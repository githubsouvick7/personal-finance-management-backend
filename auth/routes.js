const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("./user.models");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { Resend } = require('resend');
const speakeasy = require("speakeasy");
const TempUser = require("./tempuser.models")

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const resend = new Resend('re_DEU5hXmP_8BecrPtQsAwE7itpYoTadniU');

const SECRET_KEY = "your_secret_key";
const baseUrl = "http://localhost:3000";

const generateOTP = () => {
  const secret = speakeasy.generateSecret({ length: 20 });
  const otp = speakeasy.totp({
    secret: secret.base32,
    encoding: "base32",
    digits: 5,
    step: 300, // 5 minutes
  });
  return { otp, secret: secret.base32 };
};

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

const sendOTPEmail = async (email, otp) => {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'One Time Password (OTP) for your account verification',
      html: `
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; margin: 40px auto; border: 1px solid #eaeaea; border-radius: 6px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin-bottom: 10px; color: #333333;">Hi</strong>,</h2>
              <p style="margin: 10px 0 20px; font-size: 15px; color: #444444;">
                Welcome! Please use the verification code below to complete your account setup.
              </p>
              <h1 style="text-align: center; font-size: 36px; letter-spacing: 6px; margin: 30px 0; color: #000000;">
                ${otp}
              </h1>
              <p style="font-size: 14px; color: #555555; font-weight: bold; margin-top: 30px; text-align: center">
                Please take a moment to review the details of this request:
              </p>
              <p style="margin-top: 25px; font-size: 14px; color: #444; text-align: center">
                Do not share your OTP with anyone under any circumstances.
              </p>
              <p style="margin-top: 25px; font-size: 14px; color: #444; text-align: center">
                This OTP will expire in 5 minutes.
              </p>
              <p style="margin-top: 40px; font-size: 14px; color: #333333;">
                <strong style="color: #6a1b9a;">Team Fimon</strong>
              </p>
            </td>
          </tr>
        </table>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
};

router.post("/authentication", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, {
        expiresIn: "1d",
      });

      return res.status(200).json({
        message: "Login successful",
        token,
        user
      });
    }

    const { otp, secret } = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    const tempUser = new TempUser({
      email: email.toLowerCase(),
      otpSecret: secret,
      otpExpires,
      verificationId: require('crypto').randomBytes(16).toString('hex')
    });

    await tempUser.save();
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send verification code" });
    }
    return res.status(201).json({
      message: "Please verify your email with the code we sent",
      verificationId: tempUser.verificationId,
      isNewUser: true
    });

  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { verificationId, otp } = req.body;

    if (!verificationId || !otp) {
      return res.status(400).json({ message: "Verification ID and OTP are required" });
    }

    const tempUser = await TempUser.findOne({ verificationId });

    if (!tempUser) {
      return res.status(404).json({
        message: "Verification session not found or expired. Please try again."
      });
    }

    if (tempUser.otpExpires < new Date()) {
      await TempUser.findByIdAndDelete(tempUser._id);
      return res.status(400).json({
        message: "Verification code expired. Please start over."
      });
    }

    const isValid = speakeasy.totp.verify({
      secret: tempUser.otpSecret,
      encoding: "base32",
      token: otp,
      digits: 5,
      step: 300,
      window: 1
    });

    if (!isValid) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    const user = new User({
      email: tempUser.email,
      isVerified: true
    });

    await user.save();
    await TempUser.findByIdAndDelete(tempUser._id);

    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      message: "Account verification successful",
      token,
      user
    });

  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

router.post("/resend-otp", async (req, res) => {
  try {
    const { verificationId } = req.body;

    if (!verificationId) {
      return res.status(400).json({ message: "Verification ID is required" });
    }

    const tempUser = await TempUser.findOne({ verificationId });

    if (!tempUser) {
      return res.status(404).json({
        message: "Verification session not found or expired. Please start over."
      });
    }

    const { otp, secret } = generateOTP();
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    tempUser.otpSecret = secret;
    tempUser.otpExpires = otpExpires;
    await tempUser.save();

    const emailSent = await sendOTPEmail(tempUser.email, otp, tempUser.name);

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send verification code" });
    }

    return res.status(200).json({
      message: "New verification code sent to your email",
      verificationId: tempUser.verificationId
    });

  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

module.exports = router;