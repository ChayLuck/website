// routes/userRoutes.js (Updated)
var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');

/**
 * Middleware to check if user is authenticated
 */
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({
            message: 'You must be logged in to access this resource'
        });
    }
}

/*
 * GET users listing
 */
router.get('/', userController.list);

/*
 * GET user profile
 */
router.get('/profile', requireAuth, userController.profile);

/*
 * GET specific user
 */
router.get('/:id', userController.show);

/*
 * POST register new user
 */
router.post('/register', userController.create);

/*
 * POST login
 */
router.post('/login', userController.login);

/*
 * POST logout
 */
router.post('/logout', userController.logout);

/*
 * GET check authentication status
 */
router.get('/auth/check', userController.checkAuth);

/*
 * PUT update user
 */
router.put('/:id', requireAuth, userController.update);

/*
 * DELETE user
 */
router.delete('/:id', requireAuth, userController.remove);

module.exports = router;