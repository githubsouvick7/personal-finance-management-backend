const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./user.models");

// Local Strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, { message: "Incorrect email." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        const email = profile.emails[0].value;
        const profilePicture = profile.photos?.[0]?.value || null;

        if (!user) {
          user = await User.findOne({ email });

          if (user) {
            user.googleId = profile.id;
            user.profilePicture = profilePicture;
            await user.save();
          } else {
            const names = profile.displayName.split(" ");
            user = await new User({
              googleId: profile.id,
              email: email,
              firstName: names[0] || "",
              lastName: names.slice(1).join(" ") || "",
              name: profile.displayName,
              profilePicture: profilePicture,
              updatedAt: Date.now(),
            }).save();
          }
        }

        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  try {
    done(null, user._id);
  } catch (err) {
    done(err);
  }
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");

    // Get the profile separately to avoid errors if it doesn't exist
    const profile = await Profile.findOne({ "manager.userId": id });
    if (profile) {
      user._doc.profile = profile;
    }

    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
