
// config/passport.js
const passport = require('passport');
const UserModel = require('../models/userModel');

// Use environment variables for secret keys
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:5000';

// Only configure Google OAuth if credentials are provided
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  
  passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${CALLBACK_URL}/auth/google/callback`,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await UserModel.findOne({ 'googleId': profile.id });
        
        if (!user) {
          // Create new user if doesn't exist
          user = new UserModel({
            googleId: profile.id,
            username: profile.displayName || `user_${profile.id}`,
            email: profile.emails && profile.emails[0] ? profile.emails[0].value : '',
            password: Math.random().toString(36).slice(-12) // Generate random password
          });
          await user.save();
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
} else {
  console.log('Google OAuth credentials not provided. Google authentication will not be available.');
}

// Only configure Facebook OAuth if credentials are provided
if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
  const FacebookStrategy = require('passport-facebook').Strategy;
  
  passport.use(new FacebookStrategy({
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: `${CALLBACK_URL}/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'email'],
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await UserModel.findOne({ 'facebookId': profile.id });
        
        if (!user) {
          // Create new user if doesn't exist
          user = new UserModel({
            facebookId: profile.id,
            username: profile.displayName || `user_${profile.id}`,
            email: profile.emails && profile.emails[0] ? profile.emails[0].value : '',
            password: Math.random().toString(36).slice(-12) // Generate random password
          });
          await user.save();
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
} else {
  console.log('Facebook OAuth credentials not provided. Facebook authentication will not be available.');
}

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;