const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
require("./auth/passport")

const authRoutes = require("./auth/routes");// make sure this includes GoogleStrategy + serialize/deserialize if session-based

const app = express();

const MONGO_URI = "mongodb://localhost:27017/fimon"; // --> MONGO_URI
const JWT_SECRET = "your_super_secret_jwt_key";       // --> JWT_SECRET
const SESSION_EXPIRATION = 24 * 60 * 60 * 1000;       // --> SESSION_EXPIRATION
const CLIENT_URL = "http://localhost:3000";           // --> CLIENT_URL
const PORT = 5000;                                    // --> PORT

app.use(helmet());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: [CLIENT_URL],
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(passport.initialize());

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to fimon.app");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const shutdown = () => {
  mongoose.connection.close(() => {
    console.log("🛑 MongoDB connection closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
