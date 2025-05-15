// models/userModel.js (Updated)
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    'username': {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    'email': {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    'password': {
        type: String,
        required: true
    },
    // Social authentication fields
    'googleId': {
        type: String,
        sparse: true  // Allow multiple null values (for users not using Google)
    },
    'facebookId': {
        type: String,
        sparse: true  // Allow multiple null values (for users not using Facebook)
    },
    // Timestamps
    'createdAt': {
        type: Date,
        default: Date.now
    },
    'updatedAt': {
        type: Date,
        default: Date.now
    }
});

// Update the timestamps on save
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Hash password before saving
userSchema.pre('save', function(next) {
    var user = this;
    
    // Only hash the password if it's modified (or new)
    if (!user.isModified('password')) return next();
    
    bcrypt.hash(user.password, 10, function(err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});

// Method to authenticate user
userSchema.statics.authenticate = function(username, password, callback) {
    User.findOne({ username: username })
    .exec(function(err, user) {
        if (err) {
            return callback(err);
        } else if (!user) {
            var err = new Error("User not found.");
            err.status = 401;
            return callback(err);
        } 
        bcrypt.compare(password, user.password, function(err, result) {
            if (result === true) {
                return callback(null, user);
            } else {
                return callback();
            }
        });
    });
};

var User = mongoose.model('user', userSchema);
module.exports = User;