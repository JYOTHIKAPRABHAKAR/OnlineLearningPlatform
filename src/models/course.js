const database = require('../config/database');
const { generateSecureUrl } = require('../utils/helpers');

class Course {
    // Create a new course
    static async create(courseData) {
        const { title, description, educatorId, exam, subject, type, price, discountPrice, thumbnail, syllabus, features } = courseData;
        
        const result = await database.run(
            `INSERT INTO courses (title, description, educatorId, exam, subject, type, price, discountPrice, thumbnail, syllabus, features) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, educatorId, exam, subject, type, price, discountPrice, thumbnail, syllabus, features]
        );
        
        return result.id;
    }

    // Find course by ID
    static async findById(id) {
        const course = await database.get(
            `SELECT c.*, e.firstName as educatorFirstName, e.lastName as educatorLastName, e.bio as educatorBio, 
                    e.rating as educatorRating, e.qualification as educatorQualification, e.experience as educatorExperience
             FROM courses c
             JOIN educators e ON c.educatorId = e.id
             WHERE c.id = ? AND c.isActive = 1`,
            [id]
        );
        
        if (course) {
            // Generate secure URLs for thumbnails
            if (course.thumbnail) {
                course.thumbnail = generateSecureUrl(course.thumbnail);
            }
            
            // Parse features JSON and convert to proper object format
            let features = {};
            
            if (course.features) {
                try {
                    const parsedFeatures = JSON.parse(course.features);
                    if (Array.isArray(parsedFeatures)) {
                        // Convert array features to object format based on content
                        features = {
                            liveClasses: parsedFeatures.includes('Live Classes') ? 1 : 0,
                            recordedVideos: course.totalLessons || 0,
                            mockTests: parsedFeatures.includes('Mock Tests') ? 1 : 0,
                            pdfNotes: parsedFeatures.includes('Study Material') || parsedFeatures.includes('PDF Notes'),
                            doubtSupport: parsedFeatures.includes('Doubt Sessions') || parsedFeatures.includes('Doubt Support')
                        };
                    } else if (typeof parsedFeatures === 'object') {
                        features = parsedFeatures;
                    }
                } catch (error) {
                    // Use empty features object if parsing fails
                    features = {};
                }
            }

            // Calculate validity from totalDuration (convert to months)
            const durationInMinutes = course.totalDuration || 0;
            const validityInMonths = Math.ceil(durationInMinutes / (60 * 24 * 30)); // Rough estimate: 1 month = 60*24*30 minutes

            // Get lessons for syllabus
            const lessons = await this.getLessons(id);
            const syllabus = this.buildSyllabus(lessons);

            // Get reviews
            const reviews = await this.getReviews(id, 5);

            // Build educator object
            const educator = {
                id: course.educatorId,
                name: `${course.educatorFirstName || ''} ${course.educatorLastName || ''}`.trim() || 'Unknown',
                qualification: course.educatorQualification || null,
                experience: course.educatorExperience ? `${course.educatorExperience} years` : null,
                rating: (course.educatorRating !== undefined && course.educatorRating !== null)
                    ? Number(course.educatorRating)
                    : 0
            };

            // Return the exact structure specified
            return {
                id: course.id,
                title: course.title || null,
                description: course.description || null,
                educator,
                syllabus,
                features,
                validity: validityInMonths > 0 ? `${validityInMonths} months` : null,
                price: course.price || 0,
                reviews
            };
        }
        
        return null;
    }

    // Build syllabus from lessons
    static buildSyllabus(lessons) {
        if (!lessons || lessons.length === 0) {
            return [];
        }

        // Group lessons by their actual content or use lesson order
        const syllabus = [];
        
        // Simple grouping by lesson order - no hardcoded chapter names
        const lessonsPerChapter = Math.max(1, Math.ceil(lessons.length / 3)); // Group into max 3 chapters
        
        for (let i = 0; i < lessons.length; i += lessonsPerChapter) {
            const chapterLessons = lessons.slice(i, i + lessonsPerChapter);
            const chapterNumber = Math.floor(i / lessonsPerChapter) + 1;
            
            syllabus.push({
                chapter: `Chapter ${chapterNumber}`,
                lessons: chapterLessons.map(lesson => ({
                    id: lesson.id,
                    title: lesson.title,
                    duration: lesson.duration ? `${lesson.duration} mins` : null,
                    isFree: lesson.isFree === 1 || lesson.isFree === true
                }))
            });
        }

        return syllabus;
    }

    // Browse courses with filters
    static async browse(filters = {}) {
        let query = `
            SELECT c.*, e.firstName as educatorFirstName, e.lastName as educatorLastName, e.profileImage as educatorProfileImage, e.rating as educatorRating,
                   (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id AND isActive = 1) as currentEnrollments
            FROM courses c
            JOIN educators e ON c.educatorId = e.id
            WHERE c.isActive = 1
        `;
        
        const params = [];
        
        if (filters.exam) {
            query += ' AND c.exam = ?';
            params.push(filters.exam);
        }
        
        if (filters.subject) {
            query += ' AND c.subject = ?';
            params.push(filters.subject);
        }
        
        if (filters.type) {
            query += ' AND c.type = ?';
            params.push(filters.type);
        }
        
        if (filters.educator) {
            query += ' AND c.educatorId = ?';
            params.push(filters.educator);
        }
        
        if (filters.minPrice !== undefined) {
            query += ' AND c.price >= ?';
            params.push(filters.minPrice);
        }
        
        if (filters.maxPrice !== undefined) {
            query += ' AND c.price <= ?';
            params.push(filters.maxPrice);
        }
        
        // Sorting
        let sortField = filters.sort || 'createdAt';
        const sortOrder = filters.order || 'DESC';
        
        // Handle special sort options
        if (sortField === 'popular') {
            sortField = 'currentEnrollments';
        } else if (sortField === 'price') {
            sortField = 'c.price';
        } else if (sortField === 'rating') {
            sortField = 'c.rating';
        }
        
        query += ` ORDER BY ${sortField} ${sortOrder}`;
        
        // Pagination
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 10, 100);
        const offset = (page - 1) * limit;
        
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const courses = await database.all(query, params);
        
        // Process courses - only return specified keys with no null values
        return courses.map(course => {
            // Calculate duration from totalDuration (in minutes)
            const durationInMinutes = course.totalDuration || 0;
            const durationInMonths = Math.ceil(durationInMinutes / (60 * 24 * 30)); // Rough estimate: 1 month = 60*24*30 minutes
            
            // Educator object with no null values
            const educator = {
                id: course.educatorId,
                name: `${course.educatorFirstName || ''} ${course.educatorLastName || ''}`.trim() || 'Unknown',
                rating: (course.educatorRating !== undefined && course.educatorRating !== null)
                    ? Number(course.educatorRating)
                    : 0,
                image: course.educatorProfileImage
                    ? generateSecureUrl(course.educatorProfileImage)
                    : 'https://ui-avatars.com/api/?name=Educator&background=random'
            };

            // Highlights from features (if present)
            let highlights = [];
            if (course.features) {
                try {
                    const features = typeof course.features === 'string' ? JSON.parse(course.features) : course.features;
                    if (Array.isArray(features)) highlights = features;
                } catch (e) {
                    highlights = [];
                }
            }

            // Return only the specified keys with no null values
            return {
                id: course.id,
                title: course.title || '',
                educator,
                targetExam: course.exam || '',
                duration: durationInMonths > 0 ? `${durationInMonths} months` : '',
                totalLessons: course.totalLessons || 0,
                language: course.language || course.subject || 'Unknown',
                price: course.price || 0,
                discountedPrice: course.discountPrice || course.price || 0,
                rating: (course.rating !== undefined && course.rating !== null)
                    ? Number(course.rating)
                    : 0,
                enrolledStudents: course.currentEnrollments || 0,
                thumbnail: course.thumbnail
                    ? generateSecureUrl(course.thumbnail)
                    : '',
                highlights
            };
        });
    }

    // Get course lessons
    static async getLessons(courseId, userId = null) {
        let query = `
            SELECT l.*, 
                   CASE WHEN wh.completionStatus IS NOT NULL THEN wh.completionStatus ELSE 'not_started' END as userProgress
            FROM lessons l
            LEFT JOIN watch_history wh ON l.id = wh.lessonId AND wh.userId = ?
            WHERE l.courseId = ? AND l.isActive = 1
            ORDER BY l.orderIndex
        `;
        
        const lessons = await database.all(query, [userId, courseId]);
        
        // Generate secure URLs for video and thumbnails
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

    // Get course tests
    static async getTests(courseId) {
        const tests = await database.all(
            'SELECT * FROM tests WHERE courseId = ? AND isActive = 1 ORDER BY createdAt DESC',
            [courseId]
        );
        if (tests.length === 0) {
            // Fetch course info for demo test
            const course = await database.get('SELECT title FROM courses WHERE id = ?', [courseId]);
            return [{
                id: 0,
                title: course ? `Demo Test for ${course.title}` : 'Demo Test',
                type: 'mock_test',
                subject: course ? course.title : 'General',
                totalQuestions: 10,
                totalMarks: 100,
                duration: 60,
                passingMarks: 40,
                isActive: 1,
                createdAt: new Date().toISOString(),
                description: 'This is a demo test for display purposes.'
            }];
        }
        return tests;
    }

    // Get course live classes
    static async getLiveClasses(courseId) {
        const liveClasses = await database.all(
            `SELECT lc.*, e.firstName as educatorFirstName, e.lastName as educatorLastName
             FROM live_classes lc
             JOIN educators e ON lc.educatorId = e.id
             WHERE lc.courseId = ?
             ORDER BY lc.scheduledAt DESC`,
            [courseId]
        );
        if (liveClasses.length === 0) {
            // Fetch course and educator info for demo class
            const course = await database.get('SELECT c.title, c.educatorId, e.firstName, e.lastName FROM courses c JOIN educators e ON c.educatorId = e.id WHERE c.id = ?', [courseId]);
            return [{
                id: 0,
                title: course ? `Demo Live Class for ${course.title}` : 'Demo Live Class',
                educator: course ? `${course.firstName} ${course.lastName}` : 'Demo Educator',
                scheduledAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
                duration: 60,
                status: 'scheduled',
                joinUrl: '',
                description: 'This is a demo live class for display purposes.'
            }];
        }
        return liveClasses;
    }

    // Get course study materials
    static async getStudyMaterials(courseId) {
        const materials = await database.all(
            'SELECT * FROM study_materials WHERE courseId = ? AND isActive = 1 ORDER BY orderIndex, createdAt DESC',
            [courseId]
        );
        
        // Generate secure download URLs
        return materials.map(material => {
            if (material.downloadUrl) {
                material.downloadUrl = generateSecureUrl(material.downloadUrl);
            }
            return material;
        });
    }

    // Get course reviews
    static async getReviews(courseId, limit = 10) {
        return await database.all(
            `SELECT cr.*, u.firstName, u.lastName
             FROM course_reviews cr
             JOIN users u ON cr.userId = u.id
             WHERE cr.courseId = ?
             ORDER BY cr.createdAt DESC
             LIMIT ?`,
            [courseId, limit]
        );
    }

    // Update course
    static async update(id, updateData) {
        const { title, description, exam, subject, type, price, discountPrice, thumbnail, syllabus, features } = updateData;
        
        const result = await database.run(
            `UPDATE courses 
             SET title = ?, description = ?, exam = ?, subject = ?, type = ?, price = ?, discountPrice = ?, 
                 thumbnail = ?, syllabus = ?, features = ?, updatedAt = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [title, description, exam, subject, type, price, discountPrice, thumbnail, syllabus, features, id]
        );
        
        return result.changes > 0;
    }

    // Update course stats
    static async updateStats(id) {
        // Update total lessons
        const lessonsResult = await database.get(
            'SELECT COUNT(*) as count FROM lessons WHERE courseId = ? AND isActive = 1',
            [id]
        );
        
        // Update total duration
        const durationResult = await database.get(
            'SELECT SUM(duration) as total FROM lessons WHERE courseId = ? AND isActive = 1',
            [id]
        );
        
        // Update total enrollments
        const enrollmentsResult = await database.get(
            'SELECT COUNT(*) as count FROM enrollments WHERE courseId = ? AND isActive = 1',
            [id]
        );
        
        // Update average rating
        const ratingResult = await database.get(
            'SELECT AVG(rating) as average FROM course_reviews WHERE courseId = ?',
            [id]
        );
        
        const result = await database.run(
            `UPDATE courses 
             SET totalLessons = ?, totalDuration = ?, totalEnrollments = ?, rating = ?, updatedAt = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [
                lessonsResult.count,
                durationResult.total || 0,
                enrollmentsResult.count,
                Math.round((ratingResult.average || 0) * 100) / 100,
                id
            ]
        );
        
        return result.changes > 0;
    }

    // Check if user is enrolled
    static async isEnrolled(courseId, userId) {
        const enrollment = await database.get(
            'SELECT * FROM enrollments WHERE courseId = ? AND userId = ? AND isActive = 1',
            [courseId, userId]
        );
        
        return !!enrollment;
    }

    // Get course progress for user
    static async getProgress(courseId, userId) {
        const totalLessons = await database.get(
            'SELECT COUNT(*) as count FROM lessons WHERE courseId = ? AND isActive = 1',
            [courseId]
        );
        
        const completedLessons = await database.get(
            `SELECT COUNT(*) as count FROM watch_history wh
             JOIN lessons l ON wh.lessonId = l.id
             WHERE l.courseId = ? AND wh.userId = ? AND wh.completionStatus = 'completed'`,
            [courseId, userId]
        );
        
        const totalTests = await database.get(
            'SELECT COUNT(*) as count FROM tests WHERE courseId = ? AND isActive = 1',
            [courseId]
        );
        
        const attemptedTests = await database.get(
            `SELECT COUNT(*) as count FROM test_attempts ta
             JOIN tests t ON ta.testId = t.id
             WHERE t.courseId = ? AND ta.userId = ? AND ta.status = 'completed'`,
            [courseId, userId]
        );
        
        const avgTestScore = await database.get(
            `SELECT AVG(ta.score) as average FROM test_attempts ta
             JOIN tests t ON ta.testId = t.id
             WHERE t.courseId = ? AND ta.userId = ? AND ta.status = 'completed'`,
            [courseId, userId]
        );
        
        const overallProgress = totalLessons.count > 0 ? 
            (completedLessons.count / totalLessons.count) * 100 : 0;
        
        return {
            totalLessons: totalLessons.count,
            completedLessons: completedLessons.count,
            overallProgress: Math.round(overallProgress * 100) / 100,
            totalTests: totalTests.count,
            attemptedTests: attemptedTests.count,
            avgTestScore: Math.round((avgTestScore.average || 0) * 100) / 100,
            certificateEligible: overallProgress >= 80 && attemptedTests.count >= totalTests.count * 0.5
        };
    }

    // Delete course (soft delete)
    static async delete(id) {
        const result = await database.run(
            'UPDATE courses SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
        
        return result.changes > 0;
    }
}

module.exports = Course;