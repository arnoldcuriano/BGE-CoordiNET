const express = require('express');
const router = express.Router();
const passport = require('passport');

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000/login',
    failureFlash: true 
  }),
  (req, res) => {
    console.log('Successful Google auth, user:', req.user);
    console.log('Session before redirect:', req.session);
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session after Google auth:', err);
        return res.redirect('http://localhost:3000/login');
      }
      console.log('Session saved successfully:', req.session);
      const redirectUrl = req.user.role === 'viewer' 
        ? 'http://localhost:3000/welcome?loginSuccess=true' 
        : 'http://localhost:3000/dashboard?loginSuccess=true';
      res.redirect(redirectUrl);
    });
  }
);

module.exports = router;