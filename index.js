// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const session = require("express-session");
// const passport = require("passport");
// const cookieParser = require("cookie-parser");
// const helmet = require("helmet");
// require("dotenv").config();

const { default: mongoose } = require("mongoose");

// const authRoutes = require("./auth/routes");

// require("./auth/passport");
// const app = express();

// // Middleware
// app.use(helmet()); // Add security headers
// app.use(express.json());
// app.use(bodyParser.json());
// app.use(cookieParser());

// // Session configuration
// const SESSION_EXPIRATION =
//   parseInt(process.env.SESSION_EXPIRATION, 10) || 24 * 60 * 60 * 1000; // Default to 24 hours

// app.use(
//   session({
//     secret: process.env.JWT_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       maxAge: SESSION_EXPIRATION,
//       secure: process.env.NODE_ENV === "production", // Secure in production
//     },
//   })
// );

// app.use(passport.initialize());
// app.use(passport.session());

// //localhost:27017/
// mongoose
//   .connect("mongodb://localhost:27017", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     ssl: true,
//   })
//   .then(() => console.log("✅ Connected to MongoDB Atlas"))
//   .catch((err) => console.error("❌ Connection Error:", err));

// app.use(
//   cors({
//     origin: ["http://localhost:3000", "http://localhost:3001"],
//     methods: "GET,POST,PUT,DELETE",
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // Routes
// app.use("/auth", authRoutes);

// // Root endpoint
// app.get("/", (req, res) => {
//   res.send("Welcome to api.jobspring.org");
// });

// // Health check endpoint
// app.get("/health", (req, res) => {
//   res.json({ status: "OK", timestamp: new Date().toISOString() });
// });

// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ error: "Something went wrong!" });
// });

// // Graceful shutdown
// const shutdown = () => {
//   mongoose.connection.close(() => {
//     console.log("MongoDB connection closed.");
//     process.exit(0);
//   });
// };

// process.on("SIGINT", shutdown);
// process.on("SIGTERM", shutdown);

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

mongoose
  .connect(
    "mongodb+srv://hellosouvickk:GetHirred@cluster0.bi7zk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,
    }
  )
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ Connection Error:", err));
