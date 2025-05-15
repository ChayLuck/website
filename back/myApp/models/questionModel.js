// models/questionModel.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var questionSchema = new Schema({
    'question': {
        type: String,
        required: true
    },
    'category': String,
    'difficulty': {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    'correct_answer': {
        type: String,
        required: true
    },
    'incorrect_answers': {
        type: [String],
        required: true
    },
    'type': {
        type: String,
        enum: ['multiple', 'boolean'],
        default: 'multiple'
    }
});

var Question = mongoose.model('question', questionSchema);
module.exports = Question;

// models/quizAttemptModel.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var answerSchema = new Schema({
    questionId: {
        type: Schema.Types.ObjectId,
        ref: 'question',
        required: true
    },
    userAnswer: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    timeSpent: {
        type: Number, // time in milliseconds
        required: true
    },
    grade: {
        type: Number, // between 0 and 1
        required: true
    },
    score: {
        type: Number,
        required: true
    }
});

var quizAttemptSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    questions: [{
        type: Schema.Types.ObjectId,
        ref: 'question'
    }],
    answers: [answerSchema],
    startedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    },
    totalScore: {
        type: Number,
        default: 0
    },
    currentQuestion: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['in-progress', 'completed', 'abandoned'],
        default: 'in-progress'
    }
});

var QuizAttempt = mongoose.model('quizAttempt', quizAttemptSchema);
module.exports = QuizAttempt;