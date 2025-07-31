const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/User");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

// Google Strategy (unchanged, assuming it's not the issue)

// Local Strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });

        if (!user) {
          console.log("Local login: User not found for email:", email);
          return done(null, false, { message: "Invalid email or password" });
        }

        if (!user.isApproved) {
          console.log("Local login: User not approved:", email);
          return done(null, false, {
            message: "Your account is awaiting approval.",
          });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Local login: Password match for", email, ":", isMatch);
        if (!isMatch) {
          return done(null, false, { message: "Invalid email or password" });
        }

        console.log("Local login successful for:", email);
        return done(null, user);
      } catch (error) {
        console.error("Local strategy error:", error);
        return done(error);
      }
    }
  )
);

// Serialization
passport.serializeUser((user, done) => {
  console.log("Serializing user ID:", user.id);
  done(null, user.id);
});

// Deserialization
passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user ID:", id);
    const user = await User.findById(id);
    if (!user) {
      console.log("Deserialize: User not found for ID:", id);
      return done(null, false);
    }
    console.log("Deserialize successful for user:", user.email);
    done(null, user);
  } catch (error) {
    console.error("Deserialize error:", error);
    done(error, null);
  }
});
