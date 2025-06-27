const database = require('../config/database');
const { hashPassword, comparePassword, generateToken } = require('../utils/helpers');

const DEFAULT_PROFILE_IMAGE = 'https://ui-avatars.com/api/?name=User&background=random';

class User {
    // Create a new user
    static async create(userData) {
        const { email, password, firstName, lastName, targetExam, preferredLanguage, phone } = userData;
        
        const hashedPassword = await hashPassword(password);
        
        const result = await database.run(
            `INSERT INTO users (email, password, firstName, lastName, targetExam, preferredLanguage, phone) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [email, hashedPassword, firstName, lastName, targetExam, preferredLanguage, phone]
        );
        
        return result.id;
    }

    // Find user by ID
    static async findById(id) {
        const user = await database.get(
            'SELECT id, email, firstName, lastName, targetExam, preferredLanguage, phone, profileImage, isActive, createdAt FROM users WHERE id = ?',
            [id]
        );
        if (user && (!user.profileImage || user.profileImage === 'null')) {
            user.profileImage = DEFAULT_PROFILE_IMAGE;
        }
        return user;
    }

    // Find user by email
    static async findByEmail(email) {
        const user = await database.get(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        if (user && (!user.profileImage || user.profileImage === 'null')) {
            user.profileImage = DEFAULT_PROFILE_IMAGE;
        }
        return user;
    }

    // Update user profile
    static async update(id, updateData) {
        const { firstName, lastName, targetExam, preferredLanguage, phone, profileImage } = updateData;
        
        const result = await database.run(
            `UPDATE users 
             SET firstName = ?, lastName = ?, targetExam = ?, preferredLanguage = ?, phone = ?, profileImage = ?, updatedAt = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [firstName, lastName, targetExam, preferredLanguage, phone, profileImage, id]
        );
        
        return result.changes > 0;
    }

    // Update password
    static async updatePassword(id, newPassword) {
        const hashedPassword = await hashPassword(newPassword);
        
        const result = await database.run(
            'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, id]
        );
        
        return result.changes > 0;
    }

    // Authenticate user
    static async authenticate(email, password) {
        const user = await this.findByEmail(email);
        
        if (!user || !user.isActive) {
            return null;
        }
        
        const isValidPassword = await comparePassword(password, user.password);
        
        if (!isValidPassword) {
            return null;
        }
        
        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: 'learner'
        });
        
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                targetExam: user.targetExam,
                preferredLanguage: user.preferredLanguage
            },
            token
        };
    }

    // Get user enrollments
    static async getEnrollments(userId) {
        return await database.all(
            `SELECT e.*, c.title as courseTitle, c.thumbnail, c.subject, c.exam, 
                    ed.firstName as educatorFirstName, ed.lastName as educatorLastName
             FROM enrollments e
             JOIN courses c ON e.courseId = c.id
             JOIN educators ed ON c.educatorId = ed.id
             WHERE e.userId = ? AND e.isActive = 1
             ORDER BY e.enrolledAt DESC`,
            [userId]
        );
    }

    // Get user progress
    static async getProgress(userId) {
        const enrollments = await this.getEnrollments(userId);
        
        const progress = await Promise.all(enrollments.map(async (enrollment) => {
            const lessons = await database.all(
                'SELECT COUNT(*) as total FROM lessons WHERE courseId = ? AND isActive = 1',
                [enrollment.courseId]
            );
            
            const completedLessons = await database.all(
                `SELECT COUNT(*) as completed FROM watch_history 
                 WHERE userId = ? AND lessonId IN (SELECT id FROM lessons WHERE courseId = ?) 
                 AND completionStatus = 'completed'`,
                [userId, enrollment.courseId]
            );
            
            const totalLessons = lessons[0].total;
            const completed = completedLessons[0].completed;
            const progressPercentage = totalLessons > 0 ? (completed / totalLessons) * 100 : 0;
            
            return {
                ...enrollment,
                totalLessons,
                completedLessons: completed,
                progressPercentage: Math.round(progressPercentage * 100) / 100
            };
        }));
        
        return progress;
    }

    // Get user watch history
    static async getWatchHistory(userId, limit = 10) {
        return await database.all(
            `SELECT wh.*, l.title as lessonTitle, l.thumbnail, c.title as courseTitle
             FROM watch_history wh
             JOIN lessons l ON wh.lessonId = l.id
             JOIN courses c ON l.courseId = c.id
             WHERE wh.userId = ?
             ORDER BY wh.lastWatchedAt DESC
             LIMIT ?`,
            [userId, limit]
        );
    }

    // Get user test attempts
    static async getTestAttempts(userId, limit = 10) {
        return await database.all(
            `SELECT ta.*, t.title as testTitle, t.type, c.title as courseTitle
             FROM test_attempts ta
             JOIN tests t ON ta.testId = t.id
             JOIN courses c ON t.courseId = c.id
             WHERE ta.userId = ?
             ORDER BY ta.createdAt DESC
             LIMIT ?`,
            [userId, limit]
        );
    }

    // Get user dashboard data
    static async getDashboard(userId) {
        const enrollments = await this.getEnrollments(userId);
        const watchHistory = await this.getWatchHistory(userId, 5);
        const testAttempts = await this.getTestAttempts(userId, 5);
        
        // Calculate total watch time
        const totalWatchTime = watchHistory.reduce((total, record) => total + record.watchedDuration, 0);
        
        // Calculate completed courses
        const completedCourses = enrollments.filter(enrollment => enrollment.progress >= 100).length;
        
        // Calculate streak (simplified - in real app would track daily activity)
        const streakDays = Math.floor(Math.random() * 30) + 1; // Placeholder
        
        // Get upcoming live classes
        const upcomingClasses = await database.all(
            `SELECT lc.*, c.title as courseTitle, ed.firstName as educatorFirstName, ed.lastName as educatorLastName
             FROM live_classes lc
             JOIN courses c ON lc.courseId = c.id
             JOIN educators ed ON lc.educatorId = ed.id
             JOIN enrollments e ON c.id = e.courseId
             WHERE e.userId = ? AND lc.scheduledAt > datetime('now') AND lc.status = 'scheduled'
             ORDER BY lc.scheduledAt ASC
             LIMIT 5`,
            [userId]
        );
        
        // Get pending tests
        const pendingTests = await database.all(
            `SELECT t.*, c.title as courseTitle
             FROM tests t
             JOIN courses c ON t.courseId = c.id
             JOIN enrollments e ON c.id = e.courseId
             WHERE e.userId = ? AND t.isActive = 1
             AND t.id NOT IN (
                 SELECT DISTINCT testId FROM test_attempts WHERE userId = ? AND status = 'completed'
             )
             ORDER BY t.createdAt DESC
             LIMIT 5`,
            [userId, userId]
        );
        
        return {
            totalEnrollments: enrollments.length,
            completedCourses,
            totalWatchTime: Math.round(totalWatchTime / 60), // Convert to minutes
            streakDays,
            upcomingClasses,
            pendingTests,
            recentActivity: {
                watchHistory: watchHistory.slice(0, 3),
                testAttempts: testAttempts.slice(0, 3)
            }
        };
    }

    // Delete user (soft delete)
    static async delete(id) {
        const result = await database.run(
            'UPDATE users SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
        
        return result.changes > 0;
    }
}

module.exports = User; 