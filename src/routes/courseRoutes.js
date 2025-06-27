const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/courseController');
const { authenticateToken, authorizeLearner } = require('../middleware/auth');
const { checkEnrollment } = require('../middleware/enrollment');
const { validateCourseQuery, validateId } = require('../middleware/validation');

// Browse courses (public)
router.get('/', validateCourseQuery, CourseController.browseCourses);

// Get course details (public)
router.get('/:id', validateId, CourseController.getCourseDetails);

// Get course reviews (public)
router.get('/:id/reviews', validateId, CourseController.getCourseReviews);

// Enroll in course (requires authentication)
router.post('/:id/enroll', authenticateToken, authorizeLearner, validateId, CourseController.enrollInCourse);

// Get course progress (requires enrollment)
router.get('/:id/progress', authenticateToken, authorizeLearner, validateId, checkEnrollment, CourseController.getCourseProgress);

// Get course lessons (requires enrollment)
router.get('/:id/lessons', authenticateToken, authorizeLearner, validateId, checkEnrollment, CourseController.getCourseLessons);

// Get course tests (requires enrollment)
router.get('/:id/tests', authenticateToken, authorizeLearner, validateId, checkEnrollment, CourseController.getCourseTests);

// Get course study materials (requires enrollment)
router.get('/:id/materials', authenticateToken, authorizeLearner, validateId, checkEnrollment, CourseController.getCourseMaterials);

module.exports = router; 