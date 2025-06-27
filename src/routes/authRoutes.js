const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { 
    validateUserRegistration, 
    validateEducatorRegistration, 
    validateLogin 
} = require('../middleware/validation');

// Middleware to sanitize name/firstName/lastName
function sanitizeNameFields(req, res, next) {
    if (req.body.name) {
        if (req.body.firstName === '') delete req.body.firstName;
        if (req.body.lastName === '') delete req.body.lastName;
    }
    next();
}

// Register a new learner
router.post('/register', sanitizeNameFields, validateUserRegistration, AuthController.registerLearner);

// Register a new educator
router.post('/educator/register', sanitizeNameFields, validateEducatorRegistration, AuthController.registerEducator);

// Login for both users and educators
router.post('/login', validateLogin, AuthController.login);

// Login for educators only
router.post('/educator/login', validateLogin, AuthController.loginEducator);

// Login for learners only
router.post('/learner/login', validateLogin, AuthController.loginLearner);

// Get current user profile (requires authentication)
router.get('/profile', authenticateToken, AuthController.getProfile);

// Update user profile (requires authentication)
router.put('/profile', authenticateToken, AuthController.updateProfile);

// Change password (requires authentication)
router.put('/change-password', authenticateToken, AuthController.changePassword);

module.exports = router; 