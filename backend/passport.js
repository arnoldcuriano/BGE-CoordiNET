const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

// Allowed email domains
const allowedDomains = ['bgecorp.com', 'beglobalecommercecorp.com'];

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const domain = email.split('@')[1];

        // Check domain
        if (!allowedDomains.includes(domain)) {
          return done(null, false, { message: 'Invalid email domain' });
        }

        // Check if user exists
        let user = await User.findOne({ 
          $or: [{ googleId: profile.id }, { email }] 
        });

        if (!user) {
          // Create new user (only superadmin can register via Google)
          if (email !== process.env.SUPERADMIN_EMAIL) {
            return done(null, false, { 
              message: 'Google login restricted. Please register normally.' 
            });
          }

          user = new User({
            googleId: profile.id,
            email,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            displayName: profile.displayName,
            profilePicture: profile.photos?.[0]?.value,
            role: 'superadmin',
            isApproved: true
          });
          await user.save();
        } else {
          // Update existing user
          if (!user.googleId) user.googleId = profile.id;
          if (!user.profilePicture) user.profilePicture = profile.photos?.[0]?.value;
          await user.save();
        }

        // Check if approved
        if (!user.isApproved) {
          return done(null, false, { message: 'Your account is awaiting approval.' });
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Local Strategy for normal login
passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      if (!user.isApproved) {
        return done(null, false, { message: 'Your account is awaiting approval.' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password comparison result for', email, ':', isMatch);
      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Local strategy error:', error);
      return done(error);
    }
  })
);

// Serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});