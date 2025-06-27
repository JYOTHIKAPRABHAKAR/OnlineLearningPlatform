const Lesson = require('../models/lesson');
const { HTTP_STATUS } = require('../utils/constants');

class LessonController {
    // Get lesson details with progress
    static async getLessonDetails(req, res) {
        try {
            const { id: lessonId } = req.params;
            const { id: userId } = req.user;
            const database = require('../config/database');
            // Get lesson
            const lesson = await database.get('SELECT * FROM lessons WHERE id = ?', [lessonId]);
            if (!lesson) {
                return res.status(404).json({ success: false, message: 'Lesson not found' });
            }
            // Check enrollment
            const enrollment = await database.get('SELECT * FROM enrollments WHERE userId = ? AND courseId = ?', [userId, lesson.courseId]);
            if (!enrollment) {
                return res.status(403).json({ success: false, message: 'You must be enrolled in this course to access lesson details' });
            }
            // Get materials
            const materials = await Lesson.getLessonResources(lessonId, lesson.courseId);
            res.status(200).json({ success: true, lesson, materials });
        } catch (err) {
            if (err.message && err.message.includes('course_materials')) {
                console.error('Legacy reference to course_materials detected. Please ensure all lesson resource queries use study_materials.');
            }
            console.error('Get lesson details error:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Update lesson progress
    static async updateLessonProgress(req, res) {
        try {
            const { id: lessonId } = req.params;
            const { id: userId } = req.user;
            const { watchedDuration, totalDuration, status, timeSpent } = req.body;

            // Validate status
            const validStatuses = ['not_started', 'in_progress', 'completed'];
            if (!validStatuses.includes(status)) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid status. Must be not_started, in_progress, or completed'
                });
            }

            // Update progress
            const result = await Lesson.updateProgress(lessonId, userId, {
                watchedDuration,
                totalDuration,
                completionStatus: status, // Map to the expected field name
                timeSpent
            });

            if (!result) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: 'Error updating lesson progress'
                });
            }

            // Get updated lesson with progress
            const lesson = await Lesson.findByIdWithProgress(lessonId, userId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Lesson progress updated successfully',
                data: {
                    lesson,
                    progress: {
                        watchedDuration,
                        totalDuration,
                        status,
                        timeSpent,
                        percentage: totalDuration > 0 ? Math.round((watchedDuration / totalDuration) * 100) : 0
                    }
                }
            });
        } catch (error) {
            console.error('Update lesson progress error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error updating lesson progress'
            });
        }
    }

    // Save lesson notes
    static async saveLessonNotes(req, res) {
        try {
            const { id: lessonId } = req.params;
            const { id: userId } = req.user;
            const { note, timestamp } = req.body;

            if (!note || !timestamp) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Note and timestamp are required'
                });
            }

            const noteId = await Lesson.saveNotes(lessonId, userId, { note, timestamp });

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Note saved successfully',
                data: {
                    noteId,
                    note,
                    timestamp
                }
            });
        } catch (error) {
            console.error('Save lesson notes error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error saving lesson notes'
            });
        }
    }

    // Get lesson notes
    static async getLessonNotes(req, res) {
        try {
            const { id: lessonId } = req.params;
            const { id: userId } = req.user;

            const notes = await Lesson.getNotes(lessonId, userId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: notes
            });
        } catch (error) {
            console.error('Get lesson notes error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error fetching lesson notes'
            });
        }
    }

    // Get free lessons for a course
    static async getFreeLessons(req, res) {
        try {
            const { courseId } = req.params;

            const lessons = await Lesson.getFreeLessons(courseId);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: lessons
            });
        } catch (error) {
            console.error('Get free lessons error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error fetching free lessons'
            });
        }
    }
}

module.exports = LessonController; 