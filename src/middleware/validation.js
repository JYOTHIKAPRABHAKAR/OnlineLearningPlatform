const { body, query, param, validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../utils/constants');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// User registration validation
const validateUserRegistration = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('firstName')
        .if((value, { req }) => !req.body.name)
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .if((value, { req }) => !req.body.name)
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('targetExam')
        .trim()
        .notEmpty()
        .withMessage('Target exam is required'),
    body('preferredLanguage')
        .trim()
        .notEmpty()
        .withMessage('Preferred language is required'),
    body('phone')
        .optional()
        .matches(/^[\+]?[1-9][\d\s\-\(\)]{7,15}$/)
        .withMessage('Please provide a valid phone number'),
    // Custom validation to ensure either name or firstName+lastName is provided
    (req, res, next) => {
        const { name, firstName, lastName } = req.body;
        if (!name && (!firstName || !lastName)) {
            return res.status(400).json({
                success: false,
                message: 'Either "name" or both "firstName" and "lastName" are required'
            });
        }
        next();
    },
    handleValidationErrors
];

// Educator registration validation
const validateEducatorRegistration = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('firstName')
        .if((value, { req }) => !req.body.name)
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .if((value, { req }) => !req.body.name)
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('subjects')
        .trim()
        .notEmpty()
        .withMessage('Subjects are required'),
    body('experience')
        .isInt({ min: 0, max: 50 })
        .withMessage('Experience must be a valid number between 0 and 50'),
    body('qualification')
        .trim()
        .notEmpty()
        .withMessage('Qualification is required'),
    // Custom validation to ensure either name or firstName+lastName is provided
    (req, res, next) => {
        const { name, firstName, lastName } = req.body;
        if (!name && (!firstName || !lastName)) {
            return res.status(400).json({
                success: false,
                message: 'Either "name" or both "firstName" and "lastName" are required'
            });
        }
        next();
    },
    handleValidationErrors
];

// Login validation
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// Course validation
const validateCourse = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters'),
    body('description')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    body('exam')
        .trim()
        .notEmpty()
        .withMessage('Exam is required'),
    body('subject')
        .trim()
        .notEmpty()
        .withMessage('Subject is required'),
    body('type')
        .isIn(['live', 'recorded', 'hybrid'])
        .withMessage('Type must be live, recorded, or hybrid'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('discountPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Discount price must be a positive number'),
    handleValidationErrors
];

// Course query validation
const validateCourseQuery = [
    query('exam')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Exam filter cannot be empty'),
    query('subject')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Subject filter cannot be empty'),
    query('type')
        .optional()
        .isIn(['live', 'recorded', 'hybrid'])
        .withMessage('Type must be live, recorded, or hybrid'),
    query('sort')
        .optional()
        .isIn(['title', 'price', 'rating', 'createdAt', 'popular'])
        .withMessage('Sort must be title, price, rating, createdAt, or popular'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

// ID parameter validation
const validateId = [
    (req, res, next) => {
        // Support dynamic param names: id, courseId, lessonId, materialId
        const idParam = req.params.id || req.params.courseId || req.params.lessonId || req.params.materialId;
        if (!idParam || isNaN(idParam) || parseInt(idParam) < 1) {
            return res.status(400).json({ success: false, message: 'ID must be a positive integer' });
        }
        next();
    }
];

// Test submission validation
const validateTestSubmission = [
    (req, res, next) => {
        let { answers } = req.body;
        if (Array.isArray(answers)) {
            // Convert array of {questionId, selectedOption/answer} to object
            const obj = {};
            for (const item of answers) {
                if (item && item.questionId !== undefined && item.selectedOption !== undefined) {
                    obj[item.questionId] = item.selectedOption;
                } else if (item && item.questionId !== undefined && item.answer !== undefined) {
                    obj[item.questionId] = item.answer;
                }
            }
            req.body.answers = obj;
            answers = obj;
        }
        if (typeof answers !== 'object' || answers === null || Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: [{ field: 'answers', message: 'Answers must be an object or array of objects', value: req.body.answers }]
            });
        }
        next();
    },
    body('timeSpent')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Time spent must be a non-negative integer'),
    handleValidationErrors
];

// Doubt validation
const validateDoubt = [
    body('question')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Question must be between 10 and 1000 characters'),
    body('courseId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Course ID must be a positive integer'),
    body('lessonId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Lesson ID must be a positive integer'),
    handleValidationErrors
];

// Answer validation
const validateAnswer = [
    body('answer')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Answer must be between 10 and 2000 characters'),
    handleValidationErrors
];

// Review validation
const validateReview = [
    body('rating')
        .isFloat({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('comment')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Comment must be between 10 and 500 characters'),
    handleValidationErrors
];

// Search validation
const validateSearch = [
    query('q')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Search query must be at least 2 characters long'),
    query('type')
        .optional()
        .isIn(['courses', 'course', 'educators', 'educator', 'lessons', 'lesson'])
        .withMessage('Type must be courses, educators, or lessons'),
    handleValidationErrors
];

// Live class question validation
const validateLiveClassQuestion = [
    body('question')
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Question must be between 5 and 500 characters'),
    handleValidationErrors
];

// Subscription validation
const validateSubscription = [
    body('planId')
        .isInt({ min: 1 })
        .withMessage('Plan ID must be a positive integer'),
    body('paymentMethod')
        .trim()
        .notEmpty()
        .withMessage('Payment method is required'),
    body('couponCode')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Coupon code cannot be empty'),
    handleValidationErrors
];

// Lesson progress validation
const validateLessonProgress = [
    body('status')
        .isIn(['not_started', 'in_progress', 'completed'])
        .withMessage('Status must be not_started, in_progress, or completed'),
    body('timeSpent')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Time spent must be a non-negative integer'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateUserRegistration,
    validateEducatorRegistration,
    validateLogin,
    validateCourse,
    validateCourseQuery,
    validateId,
    validateTestSubmission,
    validateDoubt,
    validateAnswer,
    validateReview,
    validateSearch,
    validateLiveClassQuestion,
    validateSubscription,
    validateLessonProgress
}; 