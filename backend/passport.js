const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

// Allowed email domains
const allowedDomains = ['bgecorp.com', 'beglobalecommercecorp.com'];

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
        console.log('Google OAuth Profile:', profile); // Log the profile
        
        // Extract email and domain
        const email = profile.emails[0].value;
        const domain = email.split('@')[1];

        // Check if the domain is allowed
        if (!allowedDomains.includes(domain)) {
          console.log('Invalid email domain:', email);
          return done(null, false, { message: 'Invalid email domain. Only @bgecorp.com and @beglobalecommercecorp.com are allowed.' });
        }

        // Check if this is the Super Admin
        const isSuperAdmin = email === process.env.EMAIL_USER;

        // Restrict Google OAuth login to Super Admin only
        if (!isSuperAdmin) {
          console.log('Google OAuth login restricted to Super Admin only.');
          return done(null, false, { message: 'Google OAuth login is restricted to Super Admin only. Please sign up via the registration form.' });
        }

        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

       // In the GoogleStrategy callback, ensure role is set:
        if (!user) {
          user = new User({
            googleId: profile.id,
            email: email,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            displayName: profile.displayName,
            profilePicture: profile.photos?.[0]?.value, // Add profile picture
            role: isSuperAdmin ? 'superadmin' : 'viewer', // Explicit role assignment
            isApproved: isSuperAdmin
          });
          await user.save();
        } else {
  // Update existing user if needed
  user.role = isSuperAdmin ? 'superadmin' : user.role;
  await user.save();
}
        

        done(null, user);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        done(error, null);
      }
    }
  )
);

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

console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);


module.exports = passport;