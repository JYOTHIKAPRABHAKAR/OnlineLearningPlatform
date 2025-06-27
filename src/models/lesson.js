const database = require('../config/database');
const { generateSecureUrl } = require('../utils/helpers');

class Lesson {
    // Create a new lesson
    static async create(lessonData) {
        const { courseId, title, description, videoUrl, thumbnail, duration, orderIndex, isFree } = lessonData;
        
        const result = await database.run(
            `INSERT INTO lessons (courseId, title, description, videoUrl, thumbnail, duration, orderIndex, isFree) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [courseId, title, description, videoUrl, thumbnail, duration, orderIndex, isFree]
        );
        
        return result.id;
    }

    // Find lesson by ID
    static async findById(id) {
        const lesson = await database.get(
            `SELECT l.*, c.title as courseTitle, c.subject, c.exam
             FROM lessons l
             JOIN courses c ON l.courseId = c.id
             WHERE l.id = ? AND l.isActive = 1`,
            [id]
        );
        
        if (lesson) {
            if (lesson.videoUrl) {
                lesson.videoUrl = generateSecureUrl(lesson.videoUrl);
            }
            if (lesson.thumbnail) {
                lesson.thumbnail = generateSecureUrl(lesson.thumbnail);
            }
        }
        
        return lesson;
    }

    // Get lesson with user progress
    static async findByIdWithProgress(id, userId) {
        const lesson = await database.get(
            `SELECT l.*, c.title as courseTitle, c.subject, c.exam,
                    wh.watchedDuration, wh.totalDuration, wh.completionStatus, wh.lastWatchedAt
             FROM lessons l
             JOIN courses c ON l.courseId = c.id
             LEFT JOIN watch_history wh ON l.id = wh.lessonId AND wh.userId = ?
             WHERE l.id = ? AND l.isActive = 1`,
            [userId, id]
        );
        
        if (lesson) {
            if (lesson.videoUrl) {
                lesson.videoUrl = generateSecureUrl(lesson.videoUrl);
            }
            if (lesson.thumbnail) {
                lesson.thumbnail = generateSecureUrl(lesson.thumbnail);
            }
            
            // Set default values if no watch history
            if (!lesson.watchedDuration) {
                lesson.watchedDuration = 0;
                lesson.totalDuration = lesson.duration * 60; // Convert minutes to seconds
                lesson.completionStatus = 'not_started';
            }
        }
        
        return lesson;
    }

    // Get lessons by course
    static async findByCourse(courseId, userId = null) {
        let query = `
            SELECT l.*, 
                   CASE WHEN wh.completionStatus IS NOT NULL THEN wh.completionStatus ELSE 'not_started' END as userProgress,
                   wh.watchedDuration, wh.lastWatchedAt
            FROM lessons l
            LEFT JOIN watch_history wh ON l.id = wh.lessonId AND wh.userId = ?
            WHERE l.courseId = ? AND l.isActive = 1
            ORDER BY l.orderIndex
        `;
        
        const lessons = await database.all(query, [userId, courseId]);
        
        return lessons.map(lesson => {
            if (lesson.videoUrl) {
                lesson.videoUrl = generateSecureUrl(lesson.videoUrl);
            }
            if (lesson.thumbnail) {
                lesson.thumbnail = generateSecureUrl(lesson.thumbnail);
            }
            
            if (!lesson.watchedDuration) {
                lesson.watchedDuration = 0;
            }
            
            return lesson;
        });
    }

    // Update lesson progress
    static async updateProgress(lessonId, userId, progressData) {
        const { watchedDuration, totalDuration, completionStatus } = progressData;
        
        // Check if watch history exists
        const existing = await database.get(
            'SELECT * FROM watch_history WHERE lessonId = ? AND userId = ?',
            [lessonId, userId]
        );
        
        if (existing) {
            // Update existing record
            const result = await database.run(
                `UPDATE watch_history 
                 SET watchedDuration = ?, totalDuration = ?, completionStatus = ?, lastWatchedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP 
                 WHERE lessonId = ? AND userId = ?`,
                [watchedDuration, totalDuration, completionStatus, lessonId, userId]
            );
            
            return result.changes > 0;
        } else {
            // Create new record
            const result = await database.run(
                `INSERT INTO watch_history (userId, lessonId, watchedDuration, totalDuration, completionStatus) 
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, lessonId, watchedDuration, totalDuration, completionStatus]
            );
            
            return result.id;
        }
    }

    // Save lesson notes
    static async saveNotes(lessonId, userId, noteData) {
        const { note, timestamp } = noteData;
        
        const result = await database.run(
            'INSERT INTO lesson_notes (userId, lessonId, note, timestamp) VALUES (?, ?, ?, ?)',
            [userId, lessonId, note, timestamp]
        );
        
        return result.id;
    }

    // Get lesson notes
    static async getNotes(lessonId, userId) {
        return await database.all(
            'SELECT * FROM lesson_notes WHERE lessonId = ? AND userId = ? ORDER BY timestamp ASC',
            [lessonId, userId]
        );
    }

    // Get lesson resources/materials
    static async getLessonResources(lessonId, courseId) {
        // Try to fetch materials for this lesson
        let materials = await database.all(
            'SELECT * FROM study_materials WHERE lessonId = ? AND isActive = 1 ORDER BY orderIndex, createdAt DESC',
            [lessonId]
        );
        // If none, fallback to course-level materials
        if (!materials || materials.length === 0) {
            materials = await database.all(
                'SELECT * FROM study_materials WHERE courseId = ? AND isActive = 1 ORDER BY orderIndex, createdAt DESC',
                [courseId]
            );
        }
        return materials;
    }

    // Update lesson
    static async update(id, updateData) {
        const { title, description, videoUrl, thumbnail, duration, orderIndex, isFree } = updateData;
        
        const result = await database.run(
            `UPDATE lessons 
             SET title = ?, description = ?, videoUrl = ?, thumbnail = ?, duration = ?, orderIndex = ?, isFree = ?, updatedAt = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [title, description, videoUrl, thumbnail, duration, orderIndex, isFree, id]
        );
        
        return result.changes > 0;
    }

    // Delete lesson (soft delete)
    static async delete(id) {
        const result = await database.run(
            'UPDATE lessons SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
        
        return result.changes > 0;
    }

    // Get next lesson in course
    static async getNextLesson(lessonId, courseId) {
        const currentLesson = await this.findById(lessonId);
        
        if (!currentLesson) return null;
        
        return await database.get(
            'SELECT * FROM lessons WHERE courseId = ? AND orderIndex > ? AND isActive = 1 ORDER BY orderIndex ASC LIMIT 1',
            [courseId, currentLesson.orderIndex]
        );
    }

    // Get previous lesson in course
    static async getPreviousLesson(lessonId, courseId) {
        const currentLesson = await this.findById(lessonId);
        
        if (!currentLesson) return null;
        
        return await database.get(
            'SELECT * FROM lessons WHERE courseId = ? AND orderIndex < ? AND isActive = 1 ORDER BY orderIndex DESC LIMIT 1',
            [courseId, currentLesson.orderIndex]
        );
    }

    // Get free lessons for course
    static async getFreeLessons(courseId) {
        const lessons = await database.all(
            'SELECT * FROM lessons WHERE courseId = ? AND isFree = 1 AND isActive = 1 ORDER BY orderIndex',
            [courseId]
        );
        
        return lessons.map(lesson => {
            if (lesson.videoUrl) {
                lesson.videoUrl = generateSecureUrl(lesson.videoUrl);
            }
            if (lesson.thumbnail) {
                lesson.thumbnail = generateSecureUrl(lesson.thumbnail);
            }
            return lesson;
        });
    }
}

module.exports = Lesson; 