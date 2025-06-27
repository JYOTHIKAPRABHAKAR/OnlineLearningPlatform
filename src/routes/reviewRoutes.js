const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeLearner } = require('../middleware/auth');
const { validateReview } = require('../middleware/validation');
const database = require('../config/database');

// Get course reviews
router.get('/course/:courseId', async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const reviews = await database.all(
            `SELECT r.*, u.firstName, u.lastName, u.email
             FROM reviews r
             JOIN users u ON r.userId = u.id
             WHERE r.courseId = ? AND r.isActive = 1
             ORDER BY r.createdAt DESC`,
            [courseId]
        );
        // Ensure no review has a null title
        const reviewsFixed = (reviews || []).map(r => ({
            ...r,
            title: (r.title === null || r.title === undefined) ? '' : r.title
        }));
        res.json({ success: true, reviews: reviewsFixed });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Get course reviews error', error: err.message });
    }
});

// Post a course review (learner only, must be enrolled)
router.post('/course', authenticateToken, authorizeLearner, validateReview, async (req, res) => {
    try {
        const { courseId, rating, comment } = req.body;
        const userId = req.user.id;
        // Check enrollment
        const enrollment = await database.get('SELECT * FROM enrollments WHERE userId = ? AND courseId = ? AND isActive = 1', [userId, courseId]);
        if (!enrollment) {
            return res.status(403).json({ success: false, message: 'You must be enrolled in the course to review it.' });
        }
        // Check if already reviewed
        const existing = await database.get('SELECT * FROM reviews WHERE userId = ? AND courseId = ? AND isActive = 1', [userId, courseId]);
        if (existing) {
            return res.status(409).json({ success: false, message: 'You have already reviewed this course.' });
        }
        const createdAt = new Date().toISOString();
        const result = await database.run(
            'INSERT INTO reviews (userId, courseId, rating, comment, createdAt, isActive) VALUES (?, ?, ?, ?, ?, 1)',
            [userId, courseId, rating, comment, createdAt]
        );
        const review = {
            id: result.lastID,
            userId,
            courseId,
            rating,
            comment,
            createdAt
        };
        res.status(201).json({ success: true, message: 'Review submitted successfully', review });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Post review error', error: err.message });
    }
});

// Post a course review (new RESTful route: /courses/:id/review)
router.post('/courses/:id/review', authenticateToken, authorizeLearner, validateReview, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { rating, title, comment } = req.body;
        const userId = req.user.id;
        // Check enrollment
        const enrollment = await database.get('SELECT * FROM enrollments WHERE userId = ? AND courseId = ? AND isActive = 1', [userId, courseId]);
        if (!enrollment) {
            return res.status(403).json({ success: false, message: 'You must be enrolled in the course to review it.' });
        }
        // Check if already reviewed
        const existing = await database.get('SELECT * FROM reviews WHERE userId = ? AND courseId = ? AND isActive = 1', [userId, courseId]);
        if (existing) {
            return res.status(409).json({ success: false, message: 'You have already reviewed this course.' });
        }
        const createdAt = new Date().toISOString();
        const result = await database.run(
            'INSERT INTO reviews (userId, courseId, rating, title, comment, createdAt, isActive) VALUES (?, ?, ?, ?, ?, ?, 1)',
            [userId, courseId, rating, title || '', comment, createdAt]
        );
        const review = {
            id: result.lastID,
            userId,
            courseId: Number(courseId),
            rating,
            title: title || '',
            comment,
            createdAt
        };
        res.status(201).json({ success: true, message: 'Review submitted successfully', review });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Post review error', error: err.message });
    }
});

// Update review
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;
        const review = await database.get(
            'SELECT * FROM reviews WHERE id = ? AND userId = ? AND isActive = 1',
            [id, userId]
        );
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        await database.run(
            'UPDATE reviews SET rating = ?, comment = ?, updatedAt = ? WHERE id = ?',
            [rating, comment, new Date().toISOString(), id]
        );
        res.json({ success: true, message: 'Review updated successfully' });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ success: false, message: 'Failed to update review' });
    }
});

// Delete review
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const review = await database.get(
            'SELECT * FROM reviews WHERE id = ? AND userId = ? AND isActive = 1',
            [id, userId]
        );
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        await database.run('UPDATE reviews SET isActive = 0 WHERE id = ?', [id]);
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
});

module.exports = router; 