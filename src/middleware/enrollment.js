const database = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

// Check if user is enrolled in a course
const checkEnrollment = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const enrollment = await database.get(
            'SELECT * FROM enrollments WHERE userId = ? AND courseId = ? AND isActive = 1',
            [userId, courseId]
        );

        if (!enrollment) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You must be enrolled in this course to access this resource'
            });
        }

        req.enrollment = enrollment;
        next();
    } catch (error) {
        console.error('Enrollment check error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error checking enrollment status'
        });
    }
};

// Check if user is enrolled in a course (for lesson access)
const checkLessonEnrollment = async (req, res, next) => {
    try {
        const { id: lessonId } = req.params;
        const userId = req.user.id;

        // Get course ID from lesson
        const lesson = await database.get(
            'SELECT courseId FROM lessons WHERE id = ?',
            [lessonId]
        );

        if (!lesson) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // Check enrollment
        const enrollment = await database.get(
            'SELECT * FROM enrollments WHERE userId = ? AND courseId = ? AND isActive = 1',
            [userId, lesson.courseId]
        );

        if (!enrollment) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You must be enrolled in this course to access this lesson'
            });
        }

        req.enrollment = enrollment;
        req.courseId = lesson.courseId;
        next();
    } catch (error) {
        console.error('Lesson enrollment check error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error checking enrollment status'
        });
    }
};

// Check if user is enrolled in a course (for test access)
const checkTestEnrollment = async (req, res, next) => {
    try {
        const { id: testId } = req.params;
        const userId = req.user.id;

        // Get course ID from test
        const test = await database.get(
            'SELECT courseId FROM tests WHERE id = ?',
            [testId]
        );

        if (!test) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Test not found'
            });
        }

        // Check enrollment
        const enrollment = await database.get(
            'SELECT * FROM enrollments WHERE userId = ? AND courseId = ? AND isActive = 1',
            [userId, test.courseId]
        );

        if (!enrollment) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You must be enrolled in this course to access this test'
            });
        }

        req.enrollment = enrollment;
        req.courseId = test.courseId;
        next();
    } catch (error) {
        console.error('Test enrollment check error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error checking enrollment status'
        });
    }
};

// Check if user is enrolled in a course (for live class access)
const checkLiveClassEnrollment = async (req, res, next) => {
    try {
        const { id: liveClassId } = req.params;
        const userId = req.user.id;

        // Get course ID from live class
        const liveClass = await database.get(
            'SELECT courseId FROM live_classes WHERE id = ?',
            [liveClassId]
        );

        if (!liveClass) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Live class not found'
            });
        }

        // Check enrollment
        const enrollment = await database.get(
            'SELECT * FROM enrollments WHERE userId = ? AND courseId = ? AND isActive = 1',
            [userId, liveClass.courseId]
        );

        if (!enrollment) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You must be enrolled in this course to access this live class'
            });
        }

        req.enrollment = enrollment;
        req.courseId = liveClass.courseId;
        next();
    } catch (error) {
        console.error('Live class enrollment check error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error checking enrollment status'
        });
    }
};

module.exports = {
    checkEnrollment,
    checkLessonEnrollment,
    checkTestEnrollment,
    checkLiveClassEnrollment
}; 