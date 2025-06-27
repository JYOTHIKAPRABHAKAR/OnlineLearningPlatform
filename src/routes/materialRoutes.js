const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeLearner } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');

// TODO: Implement material routes
// - Get course materials
// - Track material download

// Get course materials (requires enrollment)
router.get('/course/:courseId', authenticateToken, authorizeLearner, validateId, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { id: userId } = req.user;
        const database = require('../config/database');

        // Check if user is enrolled
        const enrollment = await database.get(
            'SELECT * FROM enrollments WHERE userId = ? AND courseId = ? AND isActive = 1',
            [userId, courseId]
        );

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled in this course to access materials'
            });
        }

        // Get course materials
        let materials = await database.all('SELECT * FROM study_materials WHERE courseId = ? AND isActive = 1 ORDER BY orderIndex, createdAt DESC', [courseId]);

        // Map to required structure
        const formatSize = (bytes) => {
            if (!bytes) return '';
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes === 0) return '0 Byte';
            const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
            return Math.round(bytes / Math.pow(1024, i) * 10) / 10 + ' ' + sizes[i];
        };
        const materialsMapped = await Promise.all(
            (materials || []).map(async (material) => {
                const downloadCount = await database.get(
                    'SELECT COUNT(*) as count FROM material_downloads WHERE materialId = ?',
                    [material.id]
                );
                return {
                    id: material.id,
                    title: material.title || '',
                    type: material.type || '',
                    chapter: material.chapter || '',
                    size: formatSize(material.fileSize),
                    downloadUrl: material.downloadUrl || '',
                    downloadCount: downloadCount.count || 0
                };
            })
        );

        res.status(200).json({
            success: true,
            materials: materialsMapped
        });
    } catch (error) {
        console.error('Get course materials error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching course materials'
        });
    }
});

// Get lesson materials (requires enrollment)
router.get('/lesson/:lessonId', authenticateToken, authorizeLearner, validateId, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { id: userId } = req.user;
        const database = require('../config/database');

        // Check if user is enrolled in the course containing this lesson
        const enrollment = await database.get(
            `SELECT e.* FROM enrollments e
             JOIN lessons l ON e.courseId = l.courseId
             WHERE e.userId = ? AND l.id = ? AND e.isActive = 1`,
            [userId, lessonId]
        );

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled in this course to access lesson materials'
            });
        }

        // Get lesson materials
        const materials = await database.all(
            `SELECT m.*, l.title as lessonTitle, c.title as courseTitle
             FROM study_materials m
             JOIN lessons l ON m.lessonId = l.id
             JOIN courses c ON l.courseId = c.id
             WHERE m.lessonId = ? AND m.isActive = 1
             ORDER BY m.orderIndex, m.createdAt DESC`,
            [lessonId]
        );

        // Get download counts for each material
        const materialsWithDownloads = await Promise.all(
            materials.map(async (material) => {
                const downloadCount = await database.get(
                    'SELECT COUNT(*) as count FROM material_downloads WHERE materialId = ?',
                    [material.id]
                );
                return {
                    ...material,
                    downloadCount: downloadCount.count
                };
            })
        );

        res.status(200).json({
            success: true,
            data: materialsWithDownloads
        });
    } catch (error) {
        console.error('Get lesson materials error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lesson materials'
        });
    }
});

// Track material download
router.post('/:materialId/download', authenticateToken, authorizeLearner, validateId, async (req, res) => {
    try {
        const { materialId } = req.params;
        const { id: userId } = req.user;
        const database = require('../config/database');

        // Get material details
        const material = await database.get(
            `SELECT m.*, c.id as courseId
             FROM study_materials m
             JOIN courses c ON m.courseId = c.id
             WHERE m.id = ? AND m.isActive = 1`,
            [materialId]
        );

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        // Check if user is enrolled in the course
        const enrollment = await database.get(
            'SELECT * FROM enrollments WHERE userId = ? AND courseId = ? AND isActive = 1',
            [userId, material.courseId]
        );

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled in this course to download materials'
            });
        }

        // Record download
        await database.run(
            'INSERT INTO material_downloads (userId, materialId, downloadedAt) VALUES (?, ?, CURRENT_TIMESTAMP)',
            [userId, materialId]
        );

        res.status(201).json({
            success: true,
            message: 'Material download recorded'
        });
    } catch (error) {
        console.error('Track material download error:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording material download'
        });
    }
});

module.exports = router;
