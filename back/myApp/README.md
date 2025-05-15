Quiz Application Backend
This is the backend for a MERN stack quiz application that allows users to solve quizzes from the Open Trivia Database.
Features

User registration and authentication
Social media login (Google and Facebook)
Quiz system with randomly selected questions
Score calculation based on answer correctness and time
Leaderboard functionality
User quiz history

Prerequisites

Node.js (v14 or higher)
MongoDB
npm or yarn

Installation

Clone the repository
Install dependencies:
npm install

Create a .env file based on .env.example and fill in your environment variables:
cp .env.example .env

Set up MongoDB database (local or MongoDB Atlas)
For social authentication:

Create a Google OAuth app at https://console.developers.google.com
Create a Facebook app at https://developers.facebook.com



Running the Application
Development Mode
npm run dev
Production Mode
npm start
API Endpoints
Authentication

POST /users/register - Register a new user
POST /users/login - Log in a user
POST /users/logout - Log out a user
GET /auth/google - Google OAuth login
GET /auth/facebook - Facebook OAuth login

User Management

GET /users/profile - Get current user profile
PUT /users/:id - Update user information
DELETE /users/:id - Delete user account

Quiz

GET /quiz/fetch-questions - Fetch questions from Open Trivia API (admin function)
POST /quiz/start - Start a new quiz
POST /quiz/answer - Submit an answer and get the next question
GET /quiz/leaderboard - Get the leaderboard of top scores
GET /quiz/history - Get the quiz history for the current user

Security Measures
The application implements various security measures:

Score calculation on the backend to prevent cheating
Time measurement on the backend via session
Password hashing with bcrypt
Session management with MongoDB store
No sharing of correct answers with frontend

Technologies Used

Express.js
MongoDB with Mongoose
Passport.js for OAuth
bcrypt for password hashing
express-session for session management