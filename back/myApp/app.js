
// app.js
require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const passport = require('./config/passport');

// Import routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/userRoutes');
const quizRouter = require('./routes/quizRoutes');
const authRouter = require('./routes/authRoutes');

// Create Express app
const app = express();

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1/quiz_app';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true // Important for cookies/sessions
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_to_a_secure_random_string',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: mongoURI,
    ttl: 14 * 24 * 60 * 60 // 14 days session expiration
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // only use secure cookies in production
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days in milliseconds
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/quiz', quizRouter);
app.use('/auth', authRouter);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Global error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Return error as JSON
  res.status(err.status || 500);
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.json({
      message: err.message,
      error: req.app.get('env') === 'development' ? err : {}
    });
  }
  
  // Render the error page for HTML requests
  res.render('error');
});

module.exports = app;