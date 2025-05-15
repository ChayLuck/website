
// routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google OAuth Routes - Only enable if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication
      req.session.userId = req.user._id;
      // Redirect to frontend
      res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    }
  );
} else {
  // Provide a helpful error message if someone tries to use Google auth when not configured
  router.get('/google', (req, res) => {
    res.status(501).json({
      message: 'Google authentication is not configured. Please check your .env file.'
    });
  });
  router.get('/google/callback', (req, res) => {
    res.status(501).json({
      message: 'Google authentication is not configured. Please check your .env file.'
    });
  });
}

// Facebook OAuth Routes - Only enable if credentials are configured
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  router.get('/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
  );

  router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication
      req.session.userId = req.user._id;
      // Redirect to frontend
      res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    }
  );
} else {
  // Provide a helpful error message if someone tries to use Facebook auth when not configured
  router.get('/facebook', (req, res) => {
    res.status(501).json({
      message: 'Facebook authentication is not configured. Please check your .env file.'
    });
  });
  router.get('/facebook/callback', (req, res) => {
    res.status(501).json({
      message: 'Facebook authentication is not configured. Please check your .env file.'
    });
  });
}

module.exports = router;