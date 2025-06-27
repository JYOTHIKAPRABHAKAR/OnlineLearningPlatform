const Course = require('../models/course');
const database = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

class CourseController {
    // Browse courses with filters
    static async browseCourses(req, res) {
        try {
            const filters = {
                exam: req.query.exam,
                subject: req.query.subject,
                type: req.query.type,
                educator: req.query.educator,
                minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
                maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
                sort: req.query.sort || 'createdAt',
                order: req.query.order || 'DESC',
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 10, 100)
            };

            const courses = await Course.browse(filters);

            // Get total count for pagination
            let countQuery = `
                SELECT COUNT(*) as total FROM courses c
                JOIN educators e ON c.educatorId = e.id
                WHERE c.isActive = 1
            `;
            const countParams = [];

            if (filters.exam) {
                countQuery += ' AND c.exam = ?';
                countParams.push(filters.exam);
            }
            if (filters.subject) {
                countQuery += ' AND c.subject = ?';
                countParams.push(filters.subject);
            }
            if (filters.type) {
                countQuery += ' AND c.type = ?';
                countParams.push(filters.type);
            }
            if (filters.educator) {
                countQuery += ' AND c.educatorId = ?';
                countParams.push(filters.educator);
            }
            if (filters.minPrice !== undefined) {
                countQuery += ' AND c.price >= ?';
                countParams.push(filters.minPrice);
            }
            if (filters.maxPrice !== undefined) {
                countQuery += ' AND c.price <= ?';
                countParams.push(filters.maxPrice);
            }

            const totalResult = await database.get(countQuery, countParams);
            const total = totalResult.total;

            res.status(HTTP_STATUS.OK).json({
                success: true,
                courses
            });
        } catch (error) {
            console.error('Browse courses error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error fetching courses'
            });
        }
    }

    // Get course details
    static async getCourseDetails(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            const course = await Course.findById(id);
            if (!course) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            res.status(HTTP_STATUS.OK).json({
                success: true,
                course
            });
        } catch (error) {
            console.error('Get course details error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error fetching course details'
            });
        }
    }

    // Enroll in a course
    static async enrollInCourse(req, res) {
        try {
            const { id: courseId } = req.params;
            const { id: userId } = req.user;

            // Check if course exists
            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Check if already enrolled
            const isEnrolled = await Course.isEnrolled(courseId, userId);
            if (isEnrolled) {
                return res.status(HTTP_STATUS.CONFLICT).json({
                    success: false,
                    message: 'You are already enrolled in this course'
                });
            }

            // Create enrollment
            const result = await database.run(
                'INSERT INTO enrollments (userId, courseId) VALUES (?, ?)',
                [userId, courseId]
            );

            // Update course enrollment count
            await database.run(
                'UPDATE courses SET totalEnrollments = totalEnrollments + 1 WHERE id = ?',
                [courseId]
            );

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Successfully enrolled in course',
                data: {
                    enrollmentId: result.id,
                    courseId,
                    enrolledAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Enroll in course error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error enrolling in course'
            });
        }
    }

    // Get course progress (requires enrollment)
    static async getCourseProgress(req, res) {
        try {
            const { id: courseId } = req.params;
            const { id: userId } = req.user;

            // Check if enrolled
            const isEnrolled = await Course.isEnrolled(courseId, userId);
            if (!isEnrolled) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'You must be enrolled in this course to view progress'
                });
            }

            const progress = await Course.getProgress(courseId, userId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: progress
            });
        } catch (error) {
            console.error('Get course progress error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error fetching course progress'
            });
        }
    }

    // Get course lessons (requires enrollment)
    static async getCourseLessons(req, res) {
        try {
            const { id: courseId } = req.params;
            const { id: userId } = req.user;

            // Check if enrolled
            const isEnrolled = await Course.isEnrolled(courseId, userId);
            if (!isEnrolled) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'You must be enrolled in this course to view lessons'
                });
            }

            const lessons = await Course.getLessons(courseId, userId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: lessons
            });
        } catch (error) {
            console.error('Get course lessons error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error fetching course lessons'
            });
        }
    }

    // Get course tests (requires enrollment)
    static async getCourseTests(req, res) {
        try {
            const { id: courseId } = req.params;
            const { id: userId } = req.user;

            // Check if enrolled
            const isEnrolled = await Course.isEnrolled(courseId, userId);
            if (!isEnrolled) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'You must be enrolled in this course to view tests'
                });
            }

            const tests = await Course.getTests(courseId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: tests
            });
        } catch (error) {
            console.error('Get course tests error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error fetching course tests'
            });
        }
    }

    // Get course study materials (requires enrollment)
    static async getCourseMaterials(req, res) {
        try {
            const { id: courseId } = req.params;
            const { id: userId } = req.user;

            // Check if enrolled
            const isEnrolled = await Course.isEnrolled(courseId, userId);
            if (!isEnrolled) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'You must be enrolled in this course to view materials'
                });
            }

            const materials = await Course.getStudyMaterials(courseId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: materials
            });
        } catch (error) {
            console.error('Get course materials error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error fetching course materials'
            });
        }
    }

    // Get course reviews
    static async getCourseReviews(req, res) {
        try {
            const { id: courseId } = req.params;
            const limit = parseInt(req.query.limit) || 10;

            const reviews = await Course.getReviews(courseId, limit);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: reviews
            });
        } catch (error) {
            console.error('Get course reviews error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error fetching course reviews'
            });
        }
    }
}

module.exports = CourseController; 