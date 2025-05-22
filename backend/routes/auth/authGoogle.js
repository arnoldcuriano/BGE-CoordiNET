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
    failureFlash: true,
    session: false // Disable session storage to align with JWT usage
  }),
  (req, res) => {
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session after Google auth:', err);
        return res.redirect('http://localhost:3000/login');
      }
      // Redirect all users to /welcome; frontend will handle further redirection
      res.redirect('http://localhost:3000/welcome?loginSuccess=true');
    });
  }
);

module.exports = router;