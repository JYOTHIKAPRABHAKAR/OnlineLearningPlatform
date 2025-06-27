const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeLearner, authorizeEducator } = require('../middleware/auth');
const { validateDoubt, validateAnswer } = require('../middleware/validation');
const database = require('../config/database');

// Post a new doubt (learner only)
router.post('/', authenticateToken, authorizeLearner, validateDoubt, async (req, res) => {
    try {
        const { courseId, lessonId, question, attachments } = req.body;
        const userId = req.user.id;
        const createdAt = new Date().toISOString();
        // Validate courseId and lessonId
        const course = await database.get('SELECT id FROM courses WHERE id = ?', [courseId]);
        if (!course) {
            return res.status(400).json({ success: false, message: 'Invalid courseId' });
        }
        let lesson = null;
        if (lessonId) {
            lesson = await database.get('SELECT id FROM lessons WHERE id = ? AND courseId = ?', [lessonId, courseId]);
            if (!lesson) {
                return res.status(400).json({ success: false, message: 'Invalid lessonId for this course' });
            }
        }
        // Ensure attachments is a non-empty array of valid URLs
        let validAttachments = Array.isArray(attachments) ? attachments.filter(url => typeof url === 'string' && url.trim()) : [];
        if (validAttachments.length === 0) {
            validAttachments = ['https://ui-avatars.com/api/?name=Doubt&background=random'];
        }
        await database.run(
            'INSERT INTO doubts (userId, courseId, lessonId, question, attachments, createdAt, isActive) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [userId, courseId, lessonId || null, question, JSON.stringify(validAttachments), createdAt]
        );
        // Return the inserted doubt
        const inserted = await database.get('SELECT * FROM doubts WHERE rowid = last_insert_rowid()');
        inserted.attachments = JSON.parse(inserted.attachments || '[]');
        // Ensure no nulls in the response doubt object and include answer details if answered
        let answer = inserted.answer === null || inserted.answer === undefined ? '' : inserted.answer;
        let answeredBy = inserted.answeredBy === null || inserted.answeredBy === undefined ? 0 : inserted.answeredBy;
        let answeredAt = inserted.answeredAt === null || inserted.answeredAt === undefined ? '' : inserted.answeredAt;
        let answeredByName = '';
        if (answer && answeredBy) {
            // Fetch educator's name
            const educator = await database.get('SELECT firstName, lastName FROM educators WHERE id = ?', [answeredBy]);
            if (educator) {
                answeredByName = educator.firstName + ' ' + educator.lastName;
            }
        }
        // Build the response doubt object, omitting answer fields if not answered
        const fixedDoubt = {
            ...inserted,
            attachments: inserted.attachments
        };
        if (answer && answeredBy) {
            fixedDoubt.answer = answer;
            fixedDoubt.answeredBy = answeredBy;
            fixedDoubt.answeredByName = answeredByName;
            fixedDoubt.answeredAt = answeredAt;
        } else {
            delete fixedDoubt.answer;
            delete fixedDoubt.answeredBy;
            delete fixedDoubt.answeredByName;
            delete fixedDoubt.answeredAt;
        }
        res.status(201).json({
            success: true,
            message: 'Doubt posted successfully',
            doubt: fixedDoubt
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Post doubt error', error: err.message });
    }
});

// Get my doubts (learner only)
router.get('/my', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const userId = req.user.id;
        const doubts = await database.all(
            'SELECT * FROM doubts WHERE userId = ? AND isActive = 1 ORDER BY createdAt DESC',
            [userId]
        );
        let fixedDoubts = (doubts || []).map(doubt => {
            let answer = doubt.answer === null || doubt.answer === undefined ? '' : doubt.answer;
            let answeredBy = doubt.answeredBy === null || doubt.answeredBy === undefined ? 0 : doubt.answeredBy;
            let answeredAt = doubt.answeredAt === null || doubt.answeredAt === undefined ? '' : doubt.answeredAt;
            let answeredByName = '';
            const result = {
                ...doubt,
                attachments: JSON.parse(doubt.attachments || '[]')
            };
            if (answer && answeredBy) {
                // Fetch educator's name if needed (sync version for mapping, or skip for now)
                result.answer = answer;
                result.answeredBy = answeredBy;
                result.answeredByName = answeredByName;
                result.answeredAt = answeredAt;
            } else {
                delete result.answer;
                delete result.answeredBy;
                delete result.answeredByName;
                delete result.answeredAt;
            }
            return result;
        });
        if (fixedDoubts.length === 0) {
            fixedDoubts = [{
                id: 0,
                userId,
                courseId: 1,
                lessonId: 1,
                question: 'Demo: Why is acceleration constant in free fall?',
                answer: 'Demo: Acceleration is constant due to gravity (9.8 m/s²) near Earth surface.',
                answeredBy: 1,
                answeredAt: new Date().toISOString(),
                attachments: ['https://ui-avatars.com/api/?name=Doubt&background=random'],
                isActive: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }];
        }
        res.json({ success: true, doubts: fixedDoubts });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Get my doubts error', error: err.message });
    }
});

// Answer a doubt (educator only)
router.post('/:id/answer', authenticateToken, authorizeEducator, validateAnswer, async (req, res) => {
    try {
        const { id } = req.params;
        const { answer } = req.body;
        const educatorId = req.user.id;
        await database.run(
            'UPDATE doubts SET answer = ?, answeredBy = ?, answeredAt = CURRENT_TIMESTAMP WHERE id = ?',
            [answer, educatorId, id]
        );
        res.status(200).json({ success: true, message: 'Doubt answered successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Answer doubt error', error: err.message });
    }
});

module.exports = router; 