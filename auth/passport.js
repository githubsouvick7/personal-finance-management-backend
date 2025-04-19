const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./user.models"); // Adjust path accordingly

passport.use(
  new GoogleStrategy(
    {
      clientID: "1067928052562-o8cv0fv652hi3tjsrspd1c0log9anvpg.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        const email = profile.emails[0].value.toLowerCase();
        user = await User.findOne({ email });

        if (user) {
          user.googleId = profile.id;
          user.fullName = user.fullName || profile.displayName;
          user.firstName = user.firstName || profile.name?.givenName;
          user.lastName = user.lastName || profile.name?.familyName;
          user.profilePicture = user.profilePicture || profile.photos[0].value;
          user.email_verified = true;
          await user.save();

          return done(null, user);
        }

        // No user with Google ID or email - create new user
        const newUser = await User.create({
          googleId: profile.id,
          email,
          fullName: profile.displayName,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          profilePicture: profile.photos[0].value,
          email_verified: profile.emails[0].verified
        });

        return done(null, newUser);
      } catch (err) {
        console.error("GoogleStrategy Error:", err);
        return done(err, null);
      }
    }
  )
);

// Serialize and deserialize
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

