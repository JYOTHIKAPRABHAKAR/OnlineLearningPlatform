const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeLearner, authorizeEducator } = require('../middleware/auth');
const { checkLiveClassEnrollment } = require('../middleware/enrollment');
const { validateId } = require('../middleware/validation');

// Get live class schedule (requires authentication)
router.get('/schedule', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { courseId, date, upcoming } = req.query;

        let query = `
            SELECT lc.*, c.title as courseTitle, e.firstName, e.lastName, e.bio,
                   COALESCE((SELECT COUNT(*) FROM live_class_attendance WHERE liveClassId = lc.id), 0) as enrolled
            FROM live_classes lc
            JOIN courses c ON lc.courseId = c.id
            JOIN educators e ON lc.educatorId = e.id
            JOIN enrollments en ON c.id = en.courseId
            WHERE en.userId = ? AND lc.isActive = 1
        `;
        const params = [userId];

        if (courseId) {
            query += ' AND lc.courseId = ?';
            params.push(courseId);
        }
        if (date) {
            query += ' AND DATE(lc.scheduledAt) = ?';
            params.push(date);
        }
        if (upcoming === 'true') {
            query += ' AND lc.scheduledAt > datetime("now")';
        }
        query += ' ORDER BY lc.scheduledAt ASC';

        const database = require('../config/database');
        const liveClasses = await database.all(query, params);

        // Format response as required
        const formatted = liveClasses.map(lc => ({
            id: lc.id,
            title: lc.title,
            educator: `${lc.firstName || ''} ${lc.lastName || ''}`.trim(),
            scheduledAt: lc.scheduledAt,
            duration: lc.duration,
            courseId: lc.courseId,
            maxStudents: lc.maxStudents,
            enrolled: lc.enrolled || 0,
            status: lc.status,
            joinUrl: lc.joinUrl
        }));

        res.status(200).json({
            success: true,
            liveClasses: formatted
        });
    } catch (error) {
        console.error('Get live class schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching live class schedule'
        });
    }
});

// Join live class (requires enrollment)
router.post('/:id/join', authenticateToken, authorizeLearner, validateId, checkLiveClassEnrollment, async (req, res) => {
    try {
        const { id: liveClassId } = req.params;
        const { id: userId } = req.user;

        const database = require('../config/database');
        const { generateRandomString } = require('../utils/helpers');
        
        // Check if live class exists and is active
        const liveClass = await database.get(
            `SELECT lc.*, c.title as courseTitle, e.firstName, e.lastName
             FROM live_classes lc
             JOIN courses c ON lc.courseId = c.id
             JOIN educators e ON lc.educatorId = e.id
             WHERE lc.id = ?`,
            [liveClassId]
        );

        if (!liveClass) {
            return res.status(404).json({
                success: false,
                message: 'Live class not found'
            });
        }

        // Check if live class is currently active
        const now = new Date();
        const scheduledTime = new Date(liveClass.scheduledAt);
        const endTime = new Date(scheduledTime.getTime() + liveClass.duration * 60000);

        // Always allow joining in development mode
        const isDev = process.env.NODE_ENV !== 'production';
        if (!isDev) {
            if (now < scheduledTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Live class has not started yet'
                });
            }
            if (now > endTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Live class has ended'
                });
            }
        }

        // Record attendance
        await database.run(
            `INSERT OR REPLACE INTO live_class_attendance (userId, liveClassId, joinedAt)
             VALUES (?, ?, ?)`,
            [userId, liveClassId, now.toISOString()]
        );

        // Compose response as per spec
        res.status(200).json({
            success: true,
            liveClass: {
                joinUrl: liveClass.joinUrl || `https://live.example.com/class/${liveClassId}`,
                token: generateRandomString(32), // Dummy session token
                chatEnabled: true, // Assume enabled for now
                pollsEnabled: true // Assume enabled for now
            }
        });
    } catch (error) {
        console.error('Join live class error:', error);
        res.status(500).json({
            success: false,
            message: 'Error joining live class'
        });
    }
});

// Ask question during live class (requires enrollment)
router.post('/:id/questions', authenticateToken, authorizeLearner, validateId, checkLiveClassEnrollment, async (req, res) => {
    try {
        const { id: liveClassId } = req.params;
        const { id: userId } = req.user;
        const { question, timestamp } = req.body;

        const database = require('../config/database');

        // Check if user is currently attending the live class
        const attendance = await database.get(
            'SELECT * FROM live_class_attendance WHERE userId = ? AND liveClassId = ?',
            [userId, liveClassId]
        );

        if (!attendance) {
            return res.status(400).json({
                success: false,
                message: 'You must join the live class before asking questions'
            });
        }

        // Save question (timestamp is not in schema, so we ignore it for now)
        // TODO: Add timestamp INTEGER to live_class_questions table if needed
        const result = await database.run(
            `INSERT INTO live_class_questions (userId, liveClassId, question, askedAt)
             VALUES (?, ?, ?, ?)` ,
            [userId, liveClassId, question, new Date().toISOString()]
        );

        res.status(201).json({
            success: true,
            message: 'Question submitted successfully',
            data: {
                questionId: result.lastID,
                question,
                // timestamp: timestamp, // Uncomment if schema is updated
                askedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Ask question error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting question'
        });
    }
});

// Get live class questions (for educators)
router.get('/:id/questions', authenticateToken, authorizeEducator, validateId, async (req, res) => {
    try {
        const { id: liveClassId } = req.params;
        const { id: educatorId } = req.user;

        const database = require('../config/database');

        // Verify educator owns this live class
        const liveClass = await database.get(
            'SELECT * FROM live_classes WHERE id = ? AND educatorId = ?',
            [liveClassId, educatorId]
        );

        if (!liveClass) {
            return res.status(404).json({
                success: false,
                message: 'Live class not found'
            });
        }

        // Get questions
        const questions = await database.all(
            `SELECT lcq.*, u.firstName, u.lastName
             FROM live_class_questions lcq
             JOIN users u ON lcq.userId = u.id
             WHERE lcq.liveClassId = ?
             ORDER BY lcq.askedAt ASC`,
            [liveClassId]
        );

        res.status(200).json({
            success: true,
            data: questions
        });
    } catch (error) {
        console.error('Get live class questions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching live class questions'
        });
    }
});

// Answer question (for educators)
router.post('/:id/questions/:questionId/answer', authenticateToken, authorizeEducator, validateId, async (req, res) => {
    try {
        const { id: liveClassId, questionId } = req.params;
        const { id: educatorId } = req.user;
        const { answer } = req.body;

        const database = require('../config/database');

        // Verify educator owns this live class
        const liveClass = await database.get(
            'SELECT * FROM live_classes WHERE id = ? AND educatorId = ?',
            [liveClassId, educatorId]
        );

        if (!liveClass) {
            return res.status(404).json({
                success: false,
                message: 'Live class not found'
            });
        }

        // Update question with answer
        const result = await database.run(
            `UPDATE live_class_questions 
             SET answer = ?, answeredAt = ?, educatorId = ?
             WHERE id = ? AND liveClassId = ?`,
            [answer, new Date().toISOString(), educatorId, questionId, liveClassId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Question answered successfully',
            data: {
                questionId,
                answer,
                answeredAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Answer question error:', error);
        res.status(500).json({
            success: false,
            message: 'Error answering question'
        });
    }
});

module.exports = router; 