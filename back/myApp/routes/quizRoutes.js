// routes/quizRoutes.js
var express = require('express');
var router = express.Router();
var quizController = require('../controllers/quizController.js');

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

/**
 * Admin route - fetch questions from Open Trivia API
 */
router.get('/fetch-questions', requireAuth, quizController.fetchQuestions);

/**
 * Start a new quiz
 */
router.post('/start', requireAuth, quizController.startQuiz);

/**
 * Submit an answer and get the next question
 */
router.post('/answer', requireAuth, quizController.submitAnswer);

/**
 * Get leaderboard (top scores)
 */
router.get('/leaderboard', quizController.getLeaderboard);

/**
 * Get user's quiz history
 */
router.get('/history', requireAuth, quizController.getUserHistory);

module.exports = router;