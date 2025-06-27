const express = require('express');
const router = express.Router();
const LessonController = require('../controllers/lessonController');
const { authenticateToken, authorizeLearner } = require('../middleware/auth');
const { checkLessonEnrollment } = require('../middleware/enrollment');
const { validateId } = require('../middleware/validation');

// Get lesson details (requires enrollment)
router.get('/:id', authenticateToken, authorizeLearner, validateId, checkLessonEnrollment, LessonController.getLessonDetails);

// Update lesson progress (requires enrollment)
router.post('/:id/progress', authenticateToken, authorizeLearner, validateId, checkLessonEnrollment, LessonController.updateLessonProgress);

// Save lesson notes (requires enrollment)
router.post('/:id/notes', authenticateToken, authorizeLearner, validateId, checkLessonEnrollment, LessonController.saveLessonNotes);

// Get lesson notes (requires enrollment)
router.get('/:id/notes', authenticateToken, authorizeLearner, validateId, checkLessonEnrollment, LessonController.getLessonNotes);

// Get free lessons for a course (public)
router.get('/course/:courseId/free', LessonController.getFreeLessons);

module.exports = router; 