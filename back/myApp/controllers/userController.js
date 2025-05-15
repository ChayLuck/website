// controllers/userController.js (updated)
var UserModel = require('../models/userModel.js');

/**
 * userController.js
 *
 * @description :: Server-side logic for managing users.
 */
module.exports = {

    /**
     * userController.list()
     */
    list: function (req, res) {
        UserModel.find(function (err, users) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user.',
                    error: err
                });
            }

            // Don't expose passwords
            const sanitizedUsers = users.map(user => {
                return {
                    _id: user._id,
                    username: user.username,
                    email: user.email
                };
            });

            return res.json(sanitizedUsers);
        });
    },

    /**
     * userController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        UserModel.findOne({_id: id}, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user.',
                    error: err
                });
            }

            if (!user) {
                return res.status(404).json({
                    message: 'No such user'
                });
            }

            // Don't expose password
            const sanitizedUser = {
                _id: user._id,
                username: user.username,
                email: user.email
            };

            return res.json(sanitizedUser);
        });
    },

    /**
     * userController.create() - Registration
     */
    create: function (req, res) {
        // Validate required fields
        if (!req.body.username || !req.body.email || !req.body.password) {
            return res.status(400).json({
                message: 'Username, email, and password are required'
            });
        }

        var user = new UserModel({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        });

        user.save(function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating user',
                    error: err
                });
            }

            // Don't return password
            const sanitizedUser = {
                _id: user._id,
                username: user.username,
                email: user.email
            };

            return res.status(201).json({
                message: 'Registration successful',
                user: sanitizedUser
            });
        });
    },

    /**
     * userController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        // Check if user is authorized to update this profile
        if (req.session.userId !== id) {
            return res.status(403).json({
                message: 'You are not authorized to update this profile'
            });
        }

        UserModel.findOne({_id: id}, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user',
                    error: err
                });
            }

            if (!user) {
                return res.status(404).json({
                    message: 'No such user'
                });
            }

            user.username = req.body.username ? req.body.username : user.username;
            user.email = req.body.email ? req.body.email : user.email;
            
            // Only update password if it's provided
            if (req.body.password) {
                user.password = req.body.password;
            }
            
            user.save(function (err, user) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating user.',
                        error: err
                    });
                }

                // Don't return password
                const sanitizedUser = {
                    _id: user._id,
                    username: user.username,
                    email: user.email
                };

                return res.json({
                    message: 'User updated successfully',
                    user: sanitizedUser
                });
            });
        });
    },

    /**
     * userController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        // Check if user is authorized to delete this profile
        if (req.session.userId !== id) {
            return res.status(403).json({
                message: 'You are not authorized to delete this profile'
            });
        }

        UserModel.findByIdAndRemove(id, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the user.',
                    error: err
                });
            }

            // Clear session after deletion
            req.session.destroy();

            return res.status(200).json({
                message: 'User deleted successfully'
            });
        });
    },

    /**
     * userController.login()
     */
    login: function(req, res, next) {
        // Validate required fields
        if (!req.body.username || !req.body.password) {
            return res.status(400).json({
                message: 'Username and password are required'
            });
        }

        UserModel.authenticate(req.body.username, req.body.password, function(err, user) {
            if (err || !user) {
                var error = new Error('Wrong username or password');
                error.status = 401;
                return res.status(401).json({
                    message: 'Wrong username or password'
                });
            }
            
            // Save user ID in session
            req.session.userId = user._id;
            
            // Return user info (without password)
            const sanitizedUser = {
                _id: user._id,
                username: user.username,
                email: user.email
            };

            return res.json({
                message: 'Login successful',
                user: sanitizedUser
            });
        });
    },

    /**
     * userController.logout()
     */
    logout: function(req, res) {
        if (req.session) {
            // Destroy the session
            req.session.destroy(function(err) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when logging out',
                        error: err
                    });
                }
                
                return res.json({
                    message: 'Logout successful'
                });
            });
        } else {
            return res.json({
                message: 'Not logged in'
            });
        }
    },

    /**
     * userController.profile()
     */
    profile: function(req, res) {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                message: 'You must be logged in to view your profile'
            });
        }

        UserModel.findById(req.session.userId, function(err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user profile',
                    error: err
                });
            }

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            // Don't expose password
            const sanitizedUser = {
                _id: user._id,
                username: user.username,
                email: user.email
            };

            return res.json({
                message: 'Profile retrieved successfully',
                user: sanitizedUser
            });
        });
    },

    /**
     * Check authentication status
     */
    checkAuth: function(req, res) {
        if (req.session && req.session.userId) {
            return res.json({
                authenticated: true,
                userId: req.session.userId
            });
        } else {
            return res.json({
                authenticated: false
            });
        }
    }
};