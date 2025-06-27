const database = require('../config/database');
const { hashPassword, comparePassword, generateToken } = require('../utils/helpers');

const DEFAULT_EDUCATOR_IMAGE = 'https://ui-avatars.com/api/?name=Educator&background=random';

class Educator {
    // Create a new educator
    static async create(educatorData) {
        const { email, password, firstName, lastName, bio, subjects, experience, qualification } = educatorData;
        
        const hashedPassword = await hashPassword(password);
        
        const result = await database.run(
            `INSERT INTO educators (email, password, firstName, lastName, bio, subjects, experience, qualification) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [email, hashedPassword, firstName, lastName, bio, subjects, experience, qualification]
        );
        
        return result.id;
    }

    // Find educator by ID
    static async findById(id) {
        const educator = await database.get(
            'SELECT id, email, firstName, lastName, bio, subjects, experience, qualification, profileImage, rating, totalStudents, isActive, createdAt FROM educators WHERE id = ?',
            [id]
        );
        if (educator && (!educator.profileImage || educator.profileImage === 'null')) {
            educator.profileImage = DEFAULT_EDUCATOR_IMAGE;
        }
        if (educator && typeof educator.subjects === 'string') {
            try {
                educator.subjects = JSON.parse(educator.subjects);
            } catch {
                // leave as is if parsing fails
            }
        }
        return educator;
    }

    // Find educator by email
    static async findByEmail(email) {
        const educator = await database.get(
            'SELECT * FROM educators WHERE email = ?',
            [email]
        );
        if (educator && (!educator.profileImage || educator.profileImage === 'null')) {
            educator.profileImage = DEFAULT_EDUCATOR_IMAGE;
        }
        if (educator && typeof educator.subjects === 'string') {
            try {
                educator.subjects = JSON.parse(educator.subjects);
            } catch {
                // leave as is if parsing fails
            }
        }
        return educator;
    }

    // Update educator profile
    static async update(id, updateData) {
        const { firstName, lastName, bio, subjects, experience, qualification, profileImage } = updateData;
        
        const result = await database.run(
            `UPDATE educators 
             SET firstName = ?, lastName = ?, bio = ?, subjects = ?, experience = ?, qualification = ?, profileImage = ?, updatedAt = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [firstName, lastName, bio, subjects, experience, qualification, profileImage, id]
        );
        
        return result.changes > 0;
    }

    // Update password
    static async updatePassword(id, newPassword) {
        const hashedPassword = await hashPassword(newPassword);
        
        const result = await database.run(
            'UPDATE educators SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, id]
        );
        
        return result.changes > 0;
    }

    // Authenticate educator
    static async authenticate(email, password) {
        const educator = await this.findByEmail(email);
        
        if (!educator || !educator.isActive) {
            return null;
        }
        
        const isValidPassword = await comparePassword(password, educator.password);
        
        if (!isValidPassword) {
            return null;
        }
        
        // Generate token
        const token = generateToken({
            id: educator.id,
            email: educator.email,
            role: 'educator'
        });
        
        // Ensure subjects is array
        let parsedSubjects = educator.subjects;
        if (typeof parsedSubjects === 'string') {
            try {
                parsedSubjects = JSON.parse(parsedSubjects);
            } catch {}
        }
        
        return {
            educator: {
                id: educator.id,
                email: educator.email,
                firstName: educator.firstName,
                lastName: educator.lastName,
                bio: educator.bio,
                subjects: parsedSubjects,
                experience: educator.experience,
                qualification: educator.qualification,
                rating: educator.rating,
                totalStudents: educator.totalStudents
            },
            token
        };
    }

    // Get educator courses
    static async getCourses(educatorId) {
        return await database.all(
            `SELECT c.*, 
                    (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id AND isActive = 1) as currentEnrollments
             FROM courses c
             WHERE c.educatorId = ? AND c.isActive = 1
             ORDER BY c.createdAt DESC`,
            [educatorId]
        );
    }

    // Get educator live classes
    static async getLiveClasses(educatorId) {
        return await database.all(
            `SELECT lc.*, c.title as courseTitle
             FROM live_classes lc
             JOIN courses c ON lc.courseId = c.id
             WHERE lc.educatorId = ?
             ORDER BY lc.scheduledAt DESC`,
            [educatorId]
        );
    }

    // Get educator dashboard
    static async getDashboard(educatorId) {
        const courses = await this.getCourses(educatorId);
        const liveClasses = await this.getLiveClasses(educatorId);
        
        // Calculate total students
        const totalStudents = courses.reduce((total, course) => total + course.currentEnrollments, 0);
        
        // Calculate total revenue (simplified)
        const totalRevenue = courses.reduce((total, course) => {
            return total + (course.price * course.currentEnrollments);
        }, 0);
        
        // Get recent enrollments
        const recentEnrollments = await database.all(
            `SELECT e.*, u.firstName as userFirstName, u.lastName as userLastName, c.title as courseTitle
             FROM enrollments e
             JOIN users u ON e.userId = u.id
             JOIN courses c ON e.courseId = c.id
             WHERE c.educatorId = ?
             ORDER BY e.enrolledAt DESC
             LIMIT 10`,
            [educatorId]
        );
        
        // Get pending doubts
        const pendingDoubts = await database.all(
            `SELECT ds.*, u.firstName as userFirstName, u.lastName as userLastName, c.title as courseTitle
             FROM doubt_sessions ds
             JOIN users u ON ds.userId = u.id
             LEFT JOIN courses c ON ds.courseId = c.id
             WHERE ds.educatorId = ? AND ds.status = 'open'
             ORDER BY ds.createdAt DESC
             LIMIT 10`,
            [educatorId]
        );
        
        return {
            totalCourses: courses.length,
            totalStudents,
            totalRevenue: Math.round(totalRevenue),
            averageRating: courses.length > 0 ? 
                courses.reduce((total, course) => total + course.rating, 0) / courses.length : 0,
            upcomingLiveClasses: liveClasses.filter(lc => lc.status === 'scheduled').slice(0, 5),
            recentEnrollments,
            pendingDoubts
        };
    }

    // Browse educators with filters
    static async browse(filters = {}) {
        let query = `
            SELECT e.*, 
                   (SELECT COUNT(*) FROM courses WHERE educatorId = e.id AND isActive = 1) as totalCourses,
                   (SELECT COUNT(*) FROM enrollments en 
                    JOIN courses c ON en.courseId = c.id 
                    WHERE c.educatorId = e.id AND en.isActive = 1) as totalStudents
            FROM educators e
            WHERE e.isActive = 1
        `;
        
        const params = [];
        
        if (filters.subject) {
            query += ' AND e.subjects LIKE ?';
            params.push(`%${filters.subject}%`);
        }
        
        if (filters.exam) {
            query += ' AND e.subjects LIKE ?';
            params.push(`%${filters.exam}%`);
        }
        
        if (filters.rating) {
            query += ' AND e.rating >= ?';
            params.push(filters.rating);
        }
        
        query += ' ORDER BY e.rating DESC, e.totalStudents DESC';
        
        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);
        }
        
        return await database.all(query, params);
    }

    // Update educator rating
    static async updateRating(educatorId) {
        const courses = await this.getCourses(educatorId);
        
        if (courses.length === 0) return false;
        
        const averageRating = courses.reduce((total, course) => total + course.rating, 0) / courses.length;
        
        const result = await database.run(
            'UPDATE educators SET rating = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [Math.round(averageRating * 100) / 100, educatorId]
        );
        
        return result.changes > 0;
    }

    // Delete educator (soft delete)
    static async delete(id) {
        const result = await database.run(
            'UPDATE educators SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
        
        return result.changes > 0;
    }
}

module.exports = Educator; 