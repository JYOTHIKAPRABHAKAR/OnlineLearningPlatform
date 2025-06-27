const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeLearner } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
const db = require('../config/database');
const Course = require('../models/course');

// TODO: Implement progress routes
// - Get learning dashboard
// - Get course progress

// Get user's overall progress
router.get('/overview', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { id: userId } = req.user;

        // Get total enrollments
        const enrollments = await db.get(
            'SELECT COUNT(*) as totalEnrollments FROM enrollments WHERE userId = ? AND isActive = 1',
            [userId]
        );

        // Get completed courses
        const completedCourses = await db.get(
            'SELECT COUNT(*) as completedCourses FROM enrollments WHERE userId = ? AND isActive = 1 AND progress >= 100',
            [userId]
        );

        // Get total lessons completed
        const completedLessons = await db.get(
            `SELECT COUNT(*) as completedLessons 
             FROM watch_history 
             WHERE userId = ? AND completionStatus = 'completed'`,
            [userId]
        );

        // Get total time spent learning
        const totalTime = await db.get(
            `SELECT SUM(watchedDuration) as totalTimeSpent 
             FROM watch_history 
             WHERE userId = ?`,
            [userId]
        );

        // Get recent activity
        const recentActivity = await db.all(
            `SELECT wh.*, l.title as lessonTitle, c.title as courseTitle, c.id as courseId
             FROM watch_history wh
             JOIN lessons l ON wh.lessonId = l.id
             JOIN courses c ON l.courseId = c.id
             WHERE wh.userId = ?
             ORDER BY wh.updatedAt DESC
             LIMIT 10`,
            [userId]
        );

        // Get learning streak
        const learningStreak = await db.get(
            `SELECT COUNT(*) as streak
             FROM (
                 SELECT DISTINCT DATE(updatedAt) as studyDate
                 FROM watch_history
                 WHERE userId = ? AND updatedAt >= datetime('now', '-30 days')
                 ORDER BY studyDate DESC
             )`,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalEnrollments: enrollments.totalEnrollments,
                    completedCourses: completedCourses.completedCourses,
                    completedLessons: completedLessons.completedLessons,
                    totalTimeSpent: totalTime.totalTimeSpent || 0,
                    learningStreak: learningStreak.streak || 0,
                    completionRate: enrollments.totalEnrollments > 0 ? 
                        (completedCourses.completedCourses / enrollments.totalEnrollments) * 100 : 0
                },
                recentActivity
            }
        });
    } catch (error) {
        console.error('Get progress overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching progress overview'
        });
    }
});

// Get learning dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Get streak days (dummy logic for now)
        const streakDays = 15;
        // Get total watch time
        const totalWatchTimeRow = await db.get(
            'SELECT SUM(watchedDuration) as total FROM watch_history WHERE userId = ?',
            [userId]
        );
        const totalWatchTime = totalWatchTimeRow.total || 0;
        // Get courses enrolled
        const coursesEnrolledRow = await db.get(
            'SELECT COUNT(*) as count FROM enrollments WHERE userId = ? AND isActive = 1',
            [userId]
        );
        const coursesEnrolled = coursesEnrolledRow.count || 0;
        // Get courses completed (dummy logic: completed if all lessons watched)
        const coursesCompleted = 1;
        // Get upcoming classes (dummy logic)
        const upcomingClasses = 2;
        // Get pending tests (dummy logic)
        const pendingTests = 3;
        // Get weekly progress (dummy data)
        const weeklyProgress = {
            watchTime: [120, 95, 110, 130, 140, 90, 105],
            lessonsCompleted: [3, 2, 3, 4, 3, 2, 3]
        };
        res.json({
            success: true,
            dashboard: {
                streakDays,
                totalWatchTime,
                coursesEnrolled,
                coursesCompleted,
                upcomingClasses,
                pendingTests,
                weeklyProgress
            }
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to get dashboard' });
    }
});

// Get course progress
router.get('/course/:courseId', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { id: userId } = req.user;
        // Check if user is enrolled
        const enrollment = await db.get(
            'SELECT * FROM enrollments WHERE userId = ? AND courseId = ? AND isActive = 1',
            [userId, courseId]
        );
        if (!enrollment) {
            return res.status(403).json({ 
                success: false, 
                message: 'You must be enrolled in this course to view progress' 
            });
        }
        // Get course progress summary
        const progressSummary = await Course.getProgress(courseId, userId);
        // Get course details
        const course = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);
        // Get all lessons in course
        const lessons = await db.all('SELECT * FROM lessons WHERE courseId = ? ORDER BY orderIndex', [courseId]);
        // Group lessons by chapter (if chapter info exists)
        const chaptersMap = {};
        lessons.forEach(lesson => {
            const chapterName = lesson.chapter || 'General';
            if (!chaptersMap[chapterName]) {
                chaptersMap[chapterName] = { name: chapterName, completedLessons: 0, totalLessons: 0 };
            }
            chaptersMap[chapterName].totalLessons++;
        });
        // Get user's progress for each lesson
        const progressData = await Promise.all(lessons.map(async (lesson) => {
            const progress = await db.get(
                'SELECT * FROM watch_history WHERE userId = ? AND lessonId = ?',
                [userId, lesson.id]
            );
            if (progress && progress.completionStatus === 'completed') {
                const chapterName = lesson.chapter || 'General';
                chaptersMap[chapterName].completedLessons++;
            }
            return {
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                status: progress ? progress.completionStatus : 'not_started',
                completedAt: progress ? progress.completedAt : null,
                timeSpent: progress ? progress.watchedDuration : 0
            };
        }));
        // Format chapters array
        const chapters = Object.values(chaptersMap).map(ch => ({
            name: ch.name,
            progress: ch.totalLessons > 0 ? Math.round((ch.completedLessons / ch.totalLessons) * 100) : 0,
            completedLessons: ch.completedLessons,
            totalLessons: ch.totalLessons
        }));
        // Compose response
        res.status(200).json({
            success: true,
            progress: {
                courseId: Number(courseId),
                enrolledOn: enrollment.createdAt ? enrollment.createdAt.split('T')[0] : '',
                validity: enrollment.validTill ? enrollment.validTill.split('T')[0] : '',
                overallProgress: progressSummary && progressSummary.overallProgress != null ? Math.round(progressSummary.overallProgress) : 0,
                chapters,
                testsAttempted: progressSummary && progressSummary.attemptedTests != null ? progressSummary.attemptedTests : 0,
                avgTestScore: progressSummary && progressSummary.avgTestScore != null ? Math.round(progressSummary.avgTestScore) : 0,
                certificateEligible: !!(progressSummary && progressSummary.certificateEligible)
            }
        });
    } catch (error) {
        console.error('Get course progress error:', error);
        res.status(500).json({ success: false, message: 'Failed to get course progress' });
    }
});

// Get learning analytics
router.get('/analytics', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { period = '30' } = req.query; // days

        // Get daily learning activity for the specified period
        const dailyActivity = await db.all(
            `SELECT 
                DATE(updatedAt) as date,
                COUNT(*) as lessonsAccessed,
                COUNT(CASE WHEN completionStatus = 'completed' THEN 1 END) as lessonsCompleted,
                SUM(watchedDuration) as timeSpent
             FROM watch_history
             WHERE userId = ? AND updatedAt >= datetime('now', '-${period} days')
             GROUP BY DATE(updatedAt)
             ORDER BY date DESC`,
            [userId]
        );

        // Get subject-wise progress
        const subjectProgress = await db.all(
            `SELECT 
                c.subject,
                COUNT(DISTINCT l.id) as totalLessons,
                COUNT(CASE WHEN wh.completionStatus = 'completed' THEN 1 END) as completedLessons,
                AVG(e.progress) as courseProgress
             FROM courses c
             JOIN lessons l ON c.id = l.courseId
             LEFT JOIN watch_history wh ON l.id = wh.lessonId AND wh.userId = ?
             JOIN enrollments e ON c.id = e.courseId AND e.userId = ?
             WHERE e.isActive = 1
             GROUP BY c.subject`,
            [userId, userId]
        );

        // Get weekly learning goals achievement
        const weeklyGoals = await db.all(
            `SELECT 
                strftime('%Y-%W', updatedAt) as week,
                COUNT(*) as lessonsCompleted,
                SUM(watchedDuration) as timeSpent
             FROM watch_history
             WHERE userId = ? AND completionStatus = 'completed' 
                AND updatedAt >= datetime('now', '-12 weeks')
             GROUP BY strftime('%Y-%W', updatedAt)
             ORDER BY week DESC`,
            [userId]
        );

        // Get learning patterns (time of day)
        const timePatterns = await db.all(
            `SELECT 
                strftime('%H', updatedAt) as hour,
                COUNT(*) as activityCount
             FROM watch_history
             WHERE userId = ? AND updatedAt >= datetime('now', '-30 days')
             GROUP BY strftime('%H', updatedAt)
             ORDER BY hour`,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: {
                dailyActivity,
                subjectProgress,
                weeklyGoals,
                timePatterns
            }
        });
    } catch (error) {
        console.error('Get learning analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching learning analytics'
        });
    }
});

// Get achievement badges
router.get('/achievements', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { id: userId } = req.user;

        // Get user's achievements
        const achievements = await db.all(
            `SELECT 
                ua.achievementId,
                ua.earnedAt,
                a.name,
                a.description,
                a.icon,
                a.category
             FROM user_achievements ua
             JOIN achievements a ON ua.achievementId = a.id
             WHERE ua.userId = ?
             ORDER BY ua.earnedAt DESC`,
            [userId]
        );

        // Get available achievements
        const allAchievements = await db.all(
            'SELECT * FROM achievements ORDER BY category, name'
        );

        // Calculate progress towards unearned achievements
        const unearnedAchievements = allAchievements.filter(achievement => 
            !achievements.find(ua => ua.achievementId === achievement.id)
        );

        // Get progress towards specific achievements
        const achievementProgress = [];

        for (const achievement of unearnedAchievements) {
            let progress = 0;
            let current = 0;
            let target = achievement.target;

            switch (achievement.type) {
                case 'courses_completed':
                    const completedCourses = await db.get(
                        'SELECT COUNT(*) as count FROM enrollments WHERE userId = ? AND isActive = 1 AND progress >= 100',
                        [userId]
                    );
                    current = completedCourses.count;
                    break;

                case 'lessons_completed':
                    const completedLessons = await db.get(
                        'SELECT COUNT(*) as count FROM watch_history WHERE userId = ? AND completionStatus = "completed"',
                        [userId]
                    );
                    current = completedLessons.count;
                    break;

                case 'learning_streak':
                    const streak = await db.get(
                        `SELECT COUNT(*) as count
                         FROM (
                             SELECT DISTINCT DATE(updatedAt) as studyDate
                             FROM watch_history
                             WHERE userId = ? AND updatedAt >= datetime('now', '-30 days')
                             ORDER BY studyDate DESC
                         )`,
                        [userId]
                    );
                    current = streak.count;
                    break;

                case 'time_spent':
                    const timeSpent = await db.get(
                        'SELECT SUM(watchedDuration) as total FROM watch_history WHERE userId = ?',
                        [userId]
                    );
                    current = Math.floor((timeSpent.total || 0) / 60); // Convert to minutes
                    break;
            }

            progress = Math.min((current / target) * 100, 100);

            achievementProgress.push({
                ...achievement,
                progress: Math.round(progress),
                current,
                target
            });
        }

        res.status(200).json({
            success: true,
            data: {
                earned: achievements,
                progress: achievementProgress,
                totalEarned: achievements.length,
                totalAvailable: allAchievements.length
            }
        });
    } catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching achievements'
        });
    }
});

// Update learning goals
router.put('/goals', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { dailyGoal, weeklyGoal, monthlyGoal } = req.body;

        // Update or insert learning goals
        await db.run(
            `INSERT OR REPLACE INTO learning_goals (userId, dailyGoal, weeklyGoal, monthlyGoal, updatedAt)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, dailyGoal, weeklyGoal, monthlyGoal, new Date().toISOString()]
        );

        // Get updated goals
        const goals = await db.get(
            'SELECT * FROM learning_goals WHERE userId = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            message: 'Learning goals updated successfully',
            data: goals
        });
    } catch (error) {
        console.error('Update learning goals error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating learning goals'
        });
    }
});

// Get learning goals
router.get('/goals', authenticateToken, authorizeLearner, async (req, res) => {
    try {
        const { id: userId } = req.user;

        const goals = await db.get(
            'SELECT * FROM learning_goals WHERE userId = ?',
            [userId]
        );

        if (!goals) {
            return res.status(200).json({
                success: true,
                data: {
                    dailyGoal: 30, // Default 30 minutes
                    weeklyGoal: 5,  // Default 5 lessons
                    monthlyGoal: 2  // Default 2 courses
                }
            });
        }

        res.status(200).json({
            success: true,
            data: goals
        });
    } catch (error) {
        console.error('Get learning goals error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching learning goals'
        });
    }
});

// Alias /dashboard to /overview
router.get('/dashboard', (req, res, next) => {
    req.url = '/overview';
    next();
});

module.exports = router; 