// controllers/quizController.js
const axios = require('axios');
const QuestionModel = require('../models/questionModel.js');
const QuizAttemptModel = require('../models/quizAttemptModel.js');

/**
 * quizController.js
 *
 * @description :: Server-side logic for managing quizzes.
 */
module.exports = {

    /**
     * Fetch and store questions from Open Trivia API
     */
    fetchQuestions: async function (req, res) {
        try {
            const response = await axios.get('https://opentdb.com/api.php', {
                params: {
                    amount: 50, // fetch 50 questions at a time
                    encode: 'base64' // to avoid issues with special characters
                }
            });

            if (response.data.response_code !== 0) {
                return res.status(500).json({
                    message: 'Error fetching questions from Open Trivia API',
                    code: response.data.response_code
                });
            }

            const questions = response.data.results.map(q => {
                return {
                    question: Buffer.from(q.question, 'base64').toString(),
                    category: Buffer.from(q.category, 'base64').toString(),
                    difficulty: Buffer.from(q.difficulty, 'base64').toString(),
                    correct_answer: Buffer.from(q.correct_answer, 'base64').toString(),
                    incorrect_answers: q.incorrect_answers.map(a => Buffer.from(a, 'base64').toString()),
                    type: Buffer.from(q.type, 'base64').toString()
                };
            });

            // Save all questions to database
            await QuestionModel.insertMany(questions);

            return res.status(200).json({
                message: `Successfully fetched and stored ${questions.length} questions`,
                count: questions.length
            });
        } catch (err) {
            return res.status(500).json({
                message: 'Error when fetching questions',
                error: err.message
            });
        }
    },

    /**
     * Start a new quiz
     */
    startQuiz: async function (req, res) {
        try {
            // Check if user is authenticated
            if (!req.session.userId) {
                return res.status(401).json({
                    message: 'You must be logged in to start a quiz'
                });
            }

            // Randomly select 10 questions
            const questions = await QuestionModel.aggregate([
                { $sample: { size: 10 } }
            ]);

            if (questions.length < 10) {
                return res.status(500).json({
                    message: 'Not enough questions in the database. Please run /quiz/fetch-questions first.'
                });
            }

            // Create a new quiz attempt
            const quizAttempt = new QuizAttemptModel({
                user: req.session.userId,
                questions: questions.map(q => q._id),
                startedAt: new Date(),
                status: 'in-progress'
            });

            await quizAttempt.save();

            // Store the current quiz attempt ID in the session
            req.session.currentQuizId = quizAttempt._id;
            
            // Store the timestamp when the first question is displayed
            req.session.questionStartTime = new Date();

            // Return only the first question without the correct answer
            const firstQuestion = questions[0];
            const questionData = {
                _id: firstQuestion._id,
                question: firstQuestion.question,
                category: firstQuestion.category,
                difficulty: firstQuestion.difficulty,
                type: firstQuestion.type,
                options: shuffleArray([
                    ...firstQuestion.incorrect_answers, 
                    firstQuestion.correct_answer
                ])
            };

            return res.status(200).json({
                message: 'Quiz started successfully',
                quizId: quizAttempt._id,
                questionNumber: 1,
                totalQuestions: 10,
                question: questionData
            });
        } catch (err) {
            return res.status(500).json({
                message: 'Error when starting quiz',
                error: err.message
            });
        }
    },

    /**
     * Submit an answer and get the next question
     */
    submitAnswer: async function (req, res) {
        try {
            // Check if user is authenticated
            if (!req.session.userId) {
                return res.status(401).json({
                    message: 'You must be logged in to submit an answer'
                });
            }

            // Check if there's an active quiz
            if (!req.session.currentQuizId) {
                return res.status(400).json({
                    message: 'No active quiz found'
                });
            }

            const quizAttempt = await QuizAttemptModel.findById(req.session.currentQuizId);

            if (!quizAttempt) {
                return res.status(404).json({
                    message: 'Quiz attempt not found'
                });
            }

            if (quizAttempt.status !== 'in-progress') {
                return res.status(400).json({
                    message: 'This quiz has already been completed'
                });
            }

            // Get the current question
            const currentQuestionIndex = quizAttempt.currentQuestion;
            const currentQuestionId = quizAttempt.questions[currentQuestionIndex];
            const currentQuestion = await QuestionModel.findById(currentQuestionId);

            if (!currentQuestion) {
                return res.status(404).json({
                    message: 'Question not found'
                });
            }

            // Calculate time spent on the question
            const endTime = new Date();
            const startTime = new Date(req.session.questionStartTime);
            const timeSpent = (endTime - startTime) / 1000; // Convert to seconds

            // Calculate grade (correctness)
            const userAnswer = req.body.answer;
            const grade = userAnswer === currentQuestion.correct_answer ? 1 : 0;

            // Calculate score using the provided formula
            // score = n * e^(-k*t), where n=100*grade; k=0.2; t=time and e=2.71828
            const n = 100 * grade;
            const k = 0.2;
            const t = timeSpent;
            const e = 2.71828;
            const score = n * Math.pow(e, -k * t);

            // Save the answer
            quizAttempt.answers.push({
                questionId: currentQuestionId,
                userAnswer: userAnswer,
                startTime: startTime,
                endTime: endTime,
                timeSpent: timeSpent,
                grade: grade,
                score: score
            });

            // Update the total score
            quizAttempt.totalScore += score;

            // Move to the next question
            quizAttempt.currentQuestion += 1;

            // Check if the quiz is completed
            if (quizAttempt.currentQuestion >= quizAttempt.questions.length) {
                quizAttempt.status = 'completed';
                quizAttempt.completedAt = new Date();
                await quizAttempt.save();

                return res.status(200).json({
                    message: 'Quiz completed',
                    result: {
                        totalScore: quizAttempt.totalScore.toFixed(2),
                        totalQuestions: quizAttempt.questions.length,
                        correctAnswers: quizAttempt.answers.filter(a => a.grade === 1).length,
                        timeSpent: quizAttempt.answers.reduce((total, ans) => total + ans.timeSpent, 0).toFixed(2) + ' seconds'
                    }
                });
            } else {
                // Save the quiz attempt
                await quizAttempt.save();

                // Get the next question
                const nextQuestionId = quizAttempt.questions[quizAttempt.currentQuestion];
                const nextQuestion = await QuestionModel.findById(nextQuestionId);

                // Store the timestamp for the next question
                req.session.questionStartTime = new Date();

                // Return the next question without the correct answer
                const questionData = {
                    _id: nextQuestion._id,
                    question: nextQuestion.question,
                    category: nextQuestion.category,
                    difficulty: nextQuestion.difficulty,
                    type: nextQuestion.type,
                    options: shuffleArray([
                        ...nextQuestion.incorrect_answers, 
                        nextQuestion.correct_answer
                    ])
                };

                return res.status(200).json({
                    message: 'Answer submitted successfully',
                    wasCorrect: grade === 1,
                    questionScore: score.toFixed(2),
                    nextQuestion: {
                        questionNumber: quizAttempt.currentQuestion + 1,
                        totalQuestions: quizAttempt.questions.length,
                        question: questionData
                    }
                });
            }
        } catch (err) {
            return res.status(500).json({
                message: 'Error when submitting answer',
                error: err.message
            });
        }
    },

    /**
     * Get the leaderboard (top scores)
     */
    getLeaderboard: async function (req, res) {
        try {
            // Get completed quizzes with user info
            const topScores = await QuizAttemptModel.find({ status: 'completed' })
                .sort({ totalScore: -1 })
                .limit(10)
                .populate('user', 'username')
                .lean();

            return res.status(200).json({
                message: 'Leaderboard retrieved successfully',
                leaderboard: topScores.map(entry => ({
                    username: entry.user.username,
                    score: entry.totalScore.toFixed(2),
                    correctAnswers: entry.answers.filter(a => a.grade === 1).length,
                    completedAt: entry.completedAt
                }))
            });
        } catch (err) {
            return res.status(500).json({
                message: 'Error retrieving leaderboard',
                error: err.message
            });
        }
    },

    /**
     * Get user's quiz history
     */
    getUserHistory: async function (req, res) {
        try {
            // Check if user is authenticated
            if (!req.session.userId) {
                return res.status(401).json({
                    message: 'You must be logged in to view your history'
                });
            }

            const history = await QuizAttemptModel.find({ 
                user: req.session.userId,
                status: 'completed'
            }).sort({ completedAt: -1 }).lean();

            return res.status(200).json({
                message: 'User quiz history retrieved successfully',
                history: history.map(quiz => ({
                    quizId: quiz._id,
                    score: quiz.totalScore.toFixed(2),
                    correctAnswers: quiz.answers.filter(a => a.grade === 1).length,
                    totalQuestions: quiz.questions.length,
                    completedAt: quiz.completedAt
                }))
            });
        } catch (err) {
            return res.status(500).json({
                message: 'Error retrieving user history',
                error: err.message
            });
        }
    }
};

// Helper function to shuffle array (for randomizing answer options)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}