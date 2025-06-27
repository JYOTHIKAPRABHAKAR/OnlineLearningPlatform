const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeEducator, authorizeLearner } = require('../middleware/auth');
const { validateId, validateCourse, validateDoubt } = require('../middleware/validation');

// TODO: Implement educator routes
// - Browse educators
// - Get educator profile
// - Follow educator

// Get educator profile
router.get('/profile', authenticateToken, authorizeEducator, async (req, res) => {
    try {
        const { id: educatorId } = req.user;
        const database = require('../config/database');

        const educator = await database.get(
            'SELECT id, email, firstName, lastName, bio, subjects, experience, qualification, createdAt FROM educators WHERE id = ?',
            [educatorId]
        );

        if (!educator) {
            return res.status(404).json({
                success: false,
                message: 'Educator not found'
            });
        }

        // Get educator's courses count
        const coursesCount = await database.get(
            'SELECT COUNT(*) as count FROM courses WHERE educatorId = ? AND isActive = 1',
            [educatorId]
        );

        // Get total students
        const studentsCount = await database.get(
            `SELECT COUNT(DISTINCT e.userId) as count 
             FROM enrollments e
             JOIN courses c ON e.courseId = c.id
             WHERE c.educatorId = ? AND e.isActive = 1`,
            [educatorId]
        );

        res.status(200).json({
            success: true,
            data: {
                ...educator,
                stats: {
                    coursesCount: coursesCount.count,
                    studentsCount: studentsCount.count
                }
            }
        });
    } catch (error) {
        console.error('Get educator profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching educator profile'
        });
    }
});

// Update educator profile
router.put('/profile', authenticateToken, authorizeEducator, async (req, res) => {
    try {
        const { id: educatorId } = req.user;
        const { firstName, lastName, bio, subjects, experience, qualification } = req.body;
        const database = require('../config/database');

        const result = await database.run(
            `UPDATE educators 
             SET firstName = ?, lastName = ?, bio = ?, subjects = ?, experience = ?, qualification = ?
             WHERE id = ?`,
            [firstName, lastName, bio, subjects, experience, qualification, educatorId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Educator not found'
            });
        }

        // Get updated profile
        const educator = await database.get(
            'SELECT id, email, firstName, lastName, bio, subjects, experience, qualification FROM educators WHERE id = ?',
            [educatorId]
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: educator
        });
    } catch (error) {
        console.error('Update educator profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating educator profile'
        });
    }
});

// Get educator's courses
router.get('/courses', authenticateToken, authorizeEducator, async (req, res) => {
    try {
        const { id: educatorId } = req.user;
        const { status, subject } = req.query;
        const database = require('../config/database');

        let query = `
            SELECT c.*, 
                   COUNT(DISTINCT e.userId) as enrolledStudents,
                   AVG(r.rating) as averageRating,
                   COUNT(r.id) as totalReviews
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.courseId AND e.isActive = 1
            LEFT JOIN reviews r ON c.id = r.courseId
            WHERE c.educatorId = ?
        `;
        const params = [educatorId];

        if (status) {
            query += ' AND c.status = ?';
            params.push(status);
        }

        if (subject) {
            query += ' AND c.subject = ?';
            params.push(subject);
        }

        query += ' GROUP BY c.id ORDER BY c.createdAt DESC';

        const courses = await database.all(query, params);

        res.status(200).json({
            success: true,
            data: courses
        });
    } catch (error) {
        console.error('Get educator courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching educator courses'
        });
    }
});

// Create a new course
router.post('/courses', authenticateToken, authorizeEducator, validateCourse, async (req, res) => {
    try {
        const { id: educatorId } = req.user;
        const { title, description, subject, level, price, duration, thumbnail, requirements, outcomes } = req.body;
        const database = require('../config/database');

        const result = await database.run(
            `INSERT INTO courses (educatorId, title, description, subject, level, price, duration, thumbnail, requirements, outcomes, status, isActive)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1)`,
            [educatorId, title, description, subject, level, price, duration, thumbnail, requirements, outcomes]
        );

        const courseId = result.lastID;

        // Get created course
        const course = await database.get(
            'SELECT * FROM courses WHERE id = ?',
            [courseId]
        );

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating course'
        });
    }
});

// Update course
router.put('/courses/:id', authenticateToken, authorizeEducator, validateId, validateCourse, async (req, res) => {
    try {
        const { id: courseId } = req.params;
        const { id: educatorId } = req.user;
        const { title, description, subject, level, price, duration, thumbnail, requirements, outcomes, status } = req.body;
        const database = require('../config/database');

        // Verify educator owns this course
        const existingCourse = await database.get(
            'SELECT * FROM courses WHERE id = ? AND educatorId = ?',
            [courseId, educatorId]
        );

        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const result = await database.run(
            `UPDATE courses 
             SET title = ?, description = ?, subject = ?, level = ?, price = ?, duration = ?, 
                 thumbnail = ?, requirements = ?, outcomes = ?, status = ?
             WHERE id = ? AND educatorId = ?`,
            [title, description, subject, level, price, duration, thumbnail, requirements, outcomes, status, courseId, educatorId]
        );

        // Get updated course
        const course = await database.get(
            'SELECT * FROM courses WHERE id = ?',
            [courseId]
        );

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating course'
        });
    }
});

// Get course analytics
router.get('/courses/:id/analytics', authenticateToken, authorizeEducator, validateId, async (req, res) => {
    try {
        const { id: courseId } = req.params;
        const { id: educatorId } = req.user;
        const database = require('../config/database');

        // Verify educator owns this course
        const course = await database.get(
            'SELECT * FROM courses WHERE id = ? AND educatorId = ?',
            [courseId, educatorId]
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Get enrollment stats
        const enrollmentStats = await database.get(
            `SELECT 
                COUNT(*) as totalEnrollments,
                COUNT(CASE WHEN createdAt >= datetime('now', '-30 days') THEN 1 END) as enrollmentsLast30Days,
                COUNT(CASE WHEN createdAt >= datetime('now', '-7 days') THEN 1 END) as enrollmentsLast7Days
             FROM enrollments 
             WHERE courseId = ? AND isActive = 1`,
            [courseId]
        );

        // Get completion stats
        const completionStats = await database.get(
            `SELECT 
                COUNT(*) as totalEnrollments,
                COUNT(CASE WHEN progress >= 100 THEN 1 END) as completedEnrollments
             FROM enrollments 
             WHERE courseId = ? AND isActive = 1`,
            [courseId]
        );

        // Get average rating
        const ratingStats = await database.get(
            'SELECT AVG(rating) as averageRating, COUNT(*) as totalReviews FROM reviews WHERE courseId = ?',
            [courseId]
        );

        // Get lesson completion stats
        const lessonStats = await database.all(
            `SELECT l.title, l.id,
                    COUNT(wp.userId) as totalAttempts,
                    COUNT(CASE WHEN wp.completionStatus = 'completed' THEN 1 END) as completedAttempts
             FROM lessons l
             LEFT JOIN watch_history wp ON l.id = wp.lessonId
             WHERE l.courseId = ?
             GROUP BY l.id`,
            [courseId]
        );

        res.status(200).json({
            success: true,
            data: {
                course: {
                    id: course.id,
                    title: course.title,
                    subject: course.subject
                },
                enrollmentStats,
                completionStats: {
                    ...completionStats,
                    completionRate: completionStats.totalEnrollments > 0 ? 
                        (completionStats.completedEnrollments / completionStats.totalEnrollments) * 100 : 0
                },
                ratingStats,
                lessonStats
            }
        });
    } catch (error) {
        console.error('Get course analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching course analytics'
        });
    }
});

// Get educator's live classes
router.get('/live-classes', authenticateToken, authorizeEducator, async (req, res) => {
    try {
        const { id: educatorId } = req.user;
        const { status, courseId } = req.query;
        const database = require('../config/database');

        let query = `
            SELECT lc.*, c.title as courseTitle,
                   COUNT(lca.userId) as attendanceCount
            FROM live_classes lc
            JOIN courses c ON lc.courseId = c.id
            LEFT JOIN live_class_attendance lca ON lc.id = lca.liveClassId
            WHERE lc.educatorId = ?
        `;
        const params = [educatorId];

        if (status) {
            if (status === 'upcoming') {
                query += ' AND lc.scheduledAt > datetime("now")';
            } else if (status === 'ongoing') {
                query += ' AND lc.scheduledAt <= datetime("now") AND datetime("now") <= datetime(lc.scheduledAt, "+" || lc.duration || " minutes")';
            } else if (status === 'completed') {
                query += ' AND datetime("now") > datetime(lc.scheduledAt, "+" || lc.duration || " minutes")';
            }
        }

        if (courseId) {
            query += ' AND lc.courseId = ?';
            params.push(courseId);
        }

        query += ' GROUP BY lc.id ORDER BY lc.scheduledAt DESC';

        const liveClasses = await database.all(query, params);

        res.status(200).json({
            success: true,
            data: liveClasses
        });
    } catch (error) {
        console.error('Get educator live classes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching live classes'
        });
    }
});

// Create live class
router.post('/live-classes', authenticateToken, authorizeEducator, async (req, res) => {
    try {
        const { id: educatorId } = req.user;
        const { courseId, title, description, scheduledAt, duration, maxParticipants } = req.body;
        const database = require('../config/database');

        // Verify educator owns this course
        const course = await database.get(
            'SELECT * FROM courses WHERE id = ? AND educatorId = ?',
            [courseId, educatorId]
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const result = await database.run(
            `INSERT INTO live_classes (educatorId, courseId, title, description, scheduledAt, duration, maxParticipants, isActive)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [educatorId, courseId, title, description, scheduledAt, duration, maxParticipants]
        );

        const liveClassId = result.lastID;

        // Get created live class
        const liveClass = await database.get(
            `SELECT lc.*, c.title as courseTitle
             FROM live_classes lc
             JOIN courses c ON lc.courseId = c.id
             WHERE lc.id = ?`,
            [liveClassId]
        );

        res.status(201).json({
            success: true,
            message: 'Live class created successfully',
            data: liveClass
        });
    } catch (error) {
        console.error('Create live class error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating live class'
        });
    }
});

// Browse all educators (requires educator authentication)
router.get('/', authenticateToken, authorizeEducator, async (req, res) => {
    try {
        const { subject, rating } = req.query;
        const database = require('../config/database');
        let query = 'SELECT * FROM educators WHERE isActive = 1';
        const params = [];
        if (subject) {
            query += ' AND subjects LIKE ?';
            params.push(`%${subject}%`);
        }
        if (rating) {
            query += ' AND rating >= ?';
            params.push(rating);
        }
        query += ' ORDER BY rating DESC';
        const educators = await database.all(query, params);
        // Map to required structure
        const mapped = educators.map(e => ({
            id: e.id,
            name: `${e.firstName} ${e.lastName}`.trim(),
            subjects: e.subjects ? e.subjects.split(',').map(s => s.trim()) : [],
            experience: e.experience || '',
            rating: e.rating || 0,
            totalStudents: e.totalStudents || 0,
            courses: e.totalCourses || 0,
            image: e.profileImage || '',
            isVerified: !!e.isVerified
        }));
        res.status(200).json({ success: true, educators: mapped });
    } catch (error) {
        console.error('Browse educators error:', error);
        res.status(500).json({ success: false, message: 'Error fetching educators' });
    }
});

// Public educator profile
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const database = require('../config/database');
        const educator = await database.get('SELECT * FROM educators WHERE id = ? AND isActive = 1', [id]);
        if (!educator) {
            return res.status(404).json({ success: false, message: 'Educator not found' });
        }
        // Get courses count and students
        const coursesCount = await database.get('SELECT COUNT(*) as count FROM courses WHERE educatorId = ? AND isActive = 1', [id]);
        const studentsCount = await database.get('SELECT COUNT(DISTINCT e.userId) as count FROM enrollments e JOIN courses c ON e.courseId = c.id WHERE c.educatorId = ? AND e.isActive = 1', [id]);
        res.status(200).json({ success: true, data: { ...educator, stats: { coursesCount: coursesCount.count, studentsCount: studentsCount.count } } });
    } catch (error) {
        console.error('Get educator public profile error:', error);
        res.status(500).json({ success: false, message: 'Error fetching educator profile' });
    }
});

// Follow educator (requires learner authentication)
router.post('/:id/follow', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { id: educatorId } = req.params;
        const { id: userId } = req.user;
        const database = require('../config/database');
        // Check if already following (in either table)
        const existing = await database.get('SELECT * FROM educator_follows WHERE userId = ? AND educatorId = ?', [userId, educatorId]);
        const existingAlias = await database.get('SELECT * FROM educator_followers WHERE userId = ? AND educatorId = ?', [userId, educatorId]);
        if (existing || existingAlias) {
            return res.status(400).json({ success: false, message: 'Already following this educator' });
        }
        // Insert into both tables for compatibility
        await database.run('INSERT INTO educator_follows (userId, educatorId, followedAt) VALUES (?, ?, ?)', [userId, educatorId, new Date().toISOString()]);
        await database.run('INSERT INTO educator_followers (userId, educatorId, followedAt) VALUES (?, ?, ?)', [userId, educatorId, new Date().toISOString()]);
        res.status(201).json({ success: true, message: 'Educator followed successfully' });
    } catch (error) {
        console.error('Follow educator error:', error);
        res.status(500).json({ success: false, message: 'Error following educator' });
    }
});

module.exports = router; 