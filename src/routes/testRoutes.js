const express = require('express');
const router = express.Router();
const TestController = require('../controllers/testController');
const { authenticateToken, authorizeLearner } = require('../middleware/auth');
const { checkTestEnrollment } = require('../middleware/enrollment');
const { validateId, validateTestSubmission } = require('../middleware/validation');

// Get available tests (requires authentication)
router.get('/', authenticateToken, authorizeLearner, TestController.getAvailableTests);

// Start a test (requires enrollment)
router.post('/:id/start', authenticateToken, authorizeLearner, validateId, checkTestEnrollment, TestController.startTest);

// Submit test answers
router.post('/:sessionId/submit', authenticateToken, authorizeLearner, validateTestSubmission, TestController.submitTest);

// Get test results
router.get('/:sessionId/results', authenticateToken, authorizeLearner, TestController.getTestResults);

// Get user's test history
router.get('/history', authenticateToken, authorizeLearner, TestController.getTestHistory);

module.exports = router; 