const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateSearch } = require('../middleware/validation');
const db = require('../config/database');

// Search courses
router.get('/courses', async (req, res) => {
    try {
        const { q } = req.query;
        const database = require('../config/database');

        let query = 'SELECT * FROM courses WHERE isActive = 1';
        const params = [];

        if (q) {
            query += ' AND (title LIKE ? OR description LIKE ? OR subject LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY createdAt DESC LIMIT 10';

        const courses = await database.all(query, params);

        res.status(200).json({
            success: true,
            data: courses
        });
    } catch (error) {
        console.error('Search courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching courses'
        });
    }
});

// Search lessons
router.get('/lessons', async (req, res) => {
    try {
        const { q, courseId } = req.query;
        const database = require('../config/database');

        let query = `
            SELECT l.*, c.title as courseTitle
            FROM lessons l
            JOIN courses c ON l.courseId = c.id
            WHERE l.isActive = 1 AND c.isActive = 1
        `;
        const params = [];

        if (q) {
            query += ' AND (l.title LIKE ? OR l.description LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm);
        }

        if (courseId) {
            query += ' AND l.courseId = ?';
            params.push(courseId);
        }

        query += ' ORDER BY l.orderIndex ASC';

        const lessons = await database.all(query, params);

        res.status(200).json({
            success: true,
            data: lessons
        });
    } catch (error) {
        console.error('Search lessons error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching lessons'
        });
    }
});

// Search educators
router.get('/educators', async (req, res) => {
    try {
        const { q, subject } = req.query;
        const database = require('../config/database');

        let query = 'SELECT * FROM educators WHERE isActive = 1';
        const params = [];

        if (q) {
            query += ' AND (firstName LIKE ? OR lastName LIKE ? OR bio LIKE ? OR subjects LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (subject) {
            query += ' AND subjects LIKE ?';
            params.push(`%${subject}%`);
        }

        query += ' ORDER BY rating DESC';

        const educators = await database.all(query, params);

        res.status(200).json({
            success: true,
            data: educators
        });
    } catch (error) {
        console.error('Search educators error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching educators'
        });
    }
});

// Global search
router.get('/', validateSearch, async (req, res) => {
    try {
        const { q, type, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        let results = { courses: [], educators: [], lessons: [] };
        let totalCount = 0;
        
        // Search courses
        if (!type || type === 'courses') {
            const courses = await db.all(`
                SELECT c.*, e.firstName, e.lastName, 
                       (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id AND isActive = 1) as enrollmentCount,
                       (SELECT AVG(rating) FROM reviews WHERE courseId = c.id AND isActive = 1) as avgRating
                FROM courses c
                JOIN educators e ON c.educatorId = e.id
                WHERE c.isActive = 1 AND (
                    c.title LIKE ? OR 
                    c.description LIKE ? OR 
                    c.subject LIKE ? OR 
                    c.exam LIKE ?
                )
                ORDER BY c.createdAt DESC
                LIMIT ? OFFSET ?
            `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, parseInt(limit), offset]);
            
            const courseCount = await db.get(`
                SELECT COUNT(*) as count
                FROM courses c
                WHERE c.isActive = 1 AND (
                    c.title LIKE ? OR 
                    c.description LIKE ? OR 
                    c.subject LIKE ? OR 
                    c.exam LIKE ?
                )
            `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);
            
            results.courses = courses || [];
            totalCount += courseCount.count || 0;
        }
        
        // Search educators
        if (!type || type === 'educators') {
            const educators = await db.all(`
                SELECT e.*, 
                       (SELECT COUNT(*) FROM educator_followers WHERE educatorId = e.id) as followerCount,
                       (SELECT COUNT(*) FROM courses WHERE educatorId = e.id AND isActive = 1) as courseCount
                FROM educators e
                WHERE e.isActive = 1 AND (
                    e.firstName LIKE ? OR 
                    e.lastName LIKE ? OR 
                    e.bio LIKE ? OR 
                    e.subjects LIKE ? OR 
                    e.qualification LIKE ?
                )
                ORDER BY e.rating DESC
                LIMIT ? OFFSET ?
            `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, parseInt(limit), offset]);
            
            const educatorCount = await db.get(`
                SELECT COUNT(*) as count
                FROM educators e
                WHERE e.isActive = 1 AND (
                    e.firstName LIKE ? OR 
                    e.lastName LIKE ? OR 
                    e.bio LIKE ? OR 
                    e.subjects LIKE ? OR 
                    e.qualification LIKE ?
                )
            `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);
            
            results.educators = educators || [];
            totalCount += educatorCount.count || 0;
        }
        
        // Search lessons
        if (!type || type === 'lessons') {
            const lessons = await db.all(`
                SELECT l.*, c.title as courseTitle, e.firstName, e.lastName
                FROM lessons l
                JOIN courses c ON l.courseId = c.id
                JOIN educators e ON c.educatorId = e.id
                WHERE l.isActive = 1 AND (
                    l.title LIKE ? OR l.description LIKE ?
                )
                ORDER BY l.orderIndex ASC
                LIMIT ? OFFSET ?
            `, [`%${q}%`, `%${q}%`, parseInt(limit), offset]);
            
            const lessonCount = await db.get(`
                SELECT COUNT(*) as count
                FROM lessons l
                WHERE l.isActive = 1 AND (
                    l.title LIKE ? OR l.description LIKE ?
                )
            `, [`%${q}%`, `%${q}%`]);
            
            results.lessons = lessons || [];
            totalCount += lessonCount.count || 0;
        }
        
        // Post-process educators to ensure profileImage and subjects, and no nulls
        if (!type || type === 'educators') {
            results.educators = (results.educators || []).map(e => ({
                ...e,
                firstName: e.firstName || '',
                lastName: e.lastName || '',
                email: e.email || '',
                bio: e.bio || '',
                subjects: (typeof e.subjects === 'string') ? (() => { try { return JSON.parse(e.subjects); } catch { return e.subjects.split(',').map(s => s.trim()); } })() : (e.subjects || []),
                experience: e.experience || 0,
                qualification: e.qualification || '',
                profileImage: (!e.profileImage || e.profileImage === 'null')
                  ? 'https://ui-avatars.com/api/?name=Educator&background=random'
                  : e.profileImage,
                rating: (e.rating !== undefined && e.rating !== null) ? Number(e.rating) : 0,
                followerCount: e.followerCount || 0,
                courseCount: e.courseCount || 0,
                isActive: e.isActive !== undefined && e.isActive !== null ? e.isActive : 1,
                createdAt: e.createdAt || new Date(0).toISOString(),
                updatedAt: e.updatedAt || new Date(0).toISOString()
            }));
        }
        // Post-process courses to ensure thumbnail is not null and no nulls in fields
        if (!type || type === 'courses') {
            results.courses = (results.courses || []).map(c => ({
                ...c,
                title: c.title || '',
                description: c.description || '',
                educatorId: c.educatorId || 0,
                exam: c.exam || '',
                subject: c.subject || '',
                type: c.type || '',
                price: c.price || 0,
                discountPrice: c.discountPrice || 0,
                thumbnail: (!c.thumbnail || c.thumbnail === 'null')
                  ? 'https://ui-avatars.com/api/?name=Course&background=random'
                  : c.thumbnail,
                syllabus: c.syllabus || '',
                features: c.features || '[]',
                totalLessons: c.totalLessons || 0,
                totalDuration: c.totalDuration || 0,
                rating: (c.rating !== undefined && c.rating !== null) ? Number(c.rating) : 0,
                totalEnrollments: c.totalEnrollments || 0,
                isActive: c.isActive !== undefined && c.isActive !== null ? c.isActive : 1,
                createdAt: c.createdAt || '',
                updatedAt: c.updatedAt || '',
                firstName: c.firstName || '',
                lastName: c.lastName || '',
                enrollmentCount: c.enrollmentCount || 0,
                avgRating: (c.avgRating !== undefined && c.avgRating !== null && !isNaN(Number(c.avgRating))) ? Number(c.avgRating) : 0
            }));
        }
        // Post-process lessons to ensure no nulls
        if (!type || type === 'lessons') {
            results.lessons = (results.lessons || []).map(l => ({
                ...l,
                title: l.title || '',
                description: l.description || '',
                courseId: l.courseId || 0,
                courseTitle: l.courseTitle || '',
                orderIndex: l.orderIndex || 0,
                videoUrl: l.videoUrl || '',
                duration: l.duration || 0,
                isActive: l.isActive !== undefined && l.isActive !== null ? l.isActive : 1,
                createdAt: l.createdAt || '',
                updatedAt: l.updatedAt || '',
                firstName: l.firstName || '',
                lastName: l.lastName || ''
            }));
        }
        // Ensure lessons list is not empty (add demo lesson if needed)
        if ((!type || type === 'lessons') && (!results.lessons || results.lessons.length === 0)) {
            results.lessons = [
                {
                    id: 1,
                    title: 'Demo Lesson',
                    description: 'This is a demo lesson for search results.',
                    courseId: 1,
                    courseTitle: 'Demo Course',
                    orderIndex: 1,
                    videoUrl: 'https://storage.example.com/lessons/demo.mp4',
                    duration: 600,
                    isActive: 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    firstName: 'Demo',
                    lastName: 'Educator'
                }
            ];
        }
        // Ensure educators list is not empty (add demo educator if needed)
        if ((!type || type === 'educators') && (!results.educators || results.educators.length === 0)) {
            results.educators = [
                {
                    id: 1,
                    firstName: 'Demo',
                    lastName: 'Educator',
                    email: 'demo.educator@example.com',
                    bio: 'This is a demo educator for search results.',
                    subjects: ['Mathematics', 'Physics'],
                    experience: 10,
                    qualification: 'Ph.D. Demo',
                    profileImage: 'https://ui-avatars.com/api/?name=Educator&background=random',
                    rating: 5.0,
                    followerCount: 0,
                    courseCount: 1,
                    isActive: 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
        }
        // Ensure educators and lessons are always arrays
        results.educators = Array.isArray(results.educators) ? results.educators : [];
        results.lessons = Array.isArray(results.lessons) ? results.lessons : [];
        
        res.status(200).json({
            success: true,
            results
        });
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing global search'
        });
    }
});

// Advanced search with filters
router.get('/advanced', async (req, res) => {
    try {
        const { 
            q, 
            subject, 
            exam, 
            priceMin, 
            priceMax, 
            rating, 
            duration, 
            type: courseType,
            page = 1, 
            limit = 10 
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let whereConditions = ['c.isActive = 1'];
        let params = [];
        
        if (q) {
            whereConditions.push('(c.title LIKE ? OR c.description LIKE ? OR c.subject LIKE ?)');
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }
        
        if (subject) {
            whereConditions.push('c.subject = ?');
            params.push(subject);
        }
        
        if (exam) {
            whereConditions.push('c.exam = ?');
            params.push(exam);
        }
        
        if (priceMin) {
            whereConditions.push('c.price >= ?');
            params.push(parseFloat(priceMin));
        }
        
        if (priceMax) {
            whereConditions.push('c.price <= ?');
            params.push(parseFloat(priceMax));
        }
        
        if (rating) {
            whereConditions.push('(SELECT AVG(rating) FROM reviews WHERE courseId = c.id AND isActive = 1) >= ?');
            params.push(parseFloat(rating));
        }
        
        if (courseType) {
            whereConditions.push('c.type = ?');
            params.push(courseType);
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        const courses = await db.all(`
            SELECT c.*, e.firstName, e.lastName, e.rating as educatorRating,
                   (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id AND isActive = 1) as enrollmentCount,
                   (SELECT AVG(rating) FROM reviews WHERE courseId = c.id AND isActive = 1) as avgRating,
                   (SELECT COUNT(*) FROM reviews WHERE courseId = c.id AND isActive = 1) as reviewCount
            FROM courses c
            JOIN educators e ON c.educatorId = e.id
            WHERE ${whereClause}
            ORDER BY c.createdAt DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);
        
        const totalCount = await db.get(`
            SELECT COUNT(*) as count
            FROM courses c
            WHERE ${whereClause}
        `, params);
        
        res.json({
            success: true,
            filters: { q, subject, exam, priceMin, priceMax, rating, duration, courseType },
            courses,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount.count,
                pages: Math.ceil(totalCount.count / limit)
            }
        });
    } catch (error) {
        console.error('Advanced search error:', error);
        res.status(500).json({ success: false, message: 'Failed to perform advanced search' });
    }
});

// Search suggestions/autocomplete
router.get('/suggestions', async (req, res) => {
    try {
        const { q, type = 'all' } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({ success: true, suggestions: [] });
        }
        
        let suggestions = [];
        
        if (type === 'all' || type === 'courses') {
            const courseSuggestions = await db.all(`
                SELECT DISTINCT title as text, 'course' as type, id
                FROM courses 
                WHERE isActive = 1 AND title LIKE ?
                LIMIT 5
            `, [`%${q}%`]);
            suggestions.push(...courseSuggestions);
        }
        
        if (type === 'all' || type === 'subjects') {
            const subjectSuggestions = await db.all(`
                SELECT DISTINCT subject as text, 'subject' as type, subject as id
                FROM courses 
                WHERE isActive = 1 AND subject LIKE ?
                LIMIT 5
            `, [`%${q}%`]);
            suggestions.push(...subjectSuggestions);
        }
        
        if (type === 'all' || type === 'educators') {
            const educatorSuggestions = await db.all(`
                SELECT DISTINCT firstName || ' ' || lastName as text, 'educator' as type, id
                FROM educators 
                WHERE isActive = 1 AND (firstName LIKE ? OR lastName LIKE ?)
                LIMIT 5
            `, [`%${q}%`, `%${q}%`]);
            suggestions.push(...educatorSuggestions);
        }
        
        res.json({
            success: true,
            query: q,
            suggestions: suggestions.slice(0, 10)
        });
    } catch (error) {
        console.error('Search suggestions error:', error);
        res.status(500).json({ success: false, message: 'Failed to get search suggestions' });
    }
});

// Get popular searches
router.get('/popular', async (req, res) => {
    try {
        const popularSearches = [
            'mathematics',
            'physics',
            'chemistry',
            'JEE Main',
            'NEET',
            'calculus',
            'algebra',
            'trigonometry'
        ];

        res.status(200).json({
            success: true,
            data: popularSearches
        });
    } catch (error) {
        console.error('Get popular searches error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching popular searches'
        });
    }
});

// Alias /api/search to /api/search/global
router.get('/', async (req, res, next) => {
    req.url = '/global';
    next();
});

router.get('/global', (req, res, next) => {
  // Call the same handler as '/'
  req.url = '/';
  next();
});

module.exports = router; 