-- Seed data for Online Learning Platform
-- This file populates the database with realistic test data

-- Clear existing data first (if any)
DELETE FROM lesson_notes;
DELETE FROM live_class_questions;
DELETE FROM educator_follows;
DELETE FROM educator_followers;
DELETE FROM reviews;
DELETE FROM course_reviews;
DELETE FROM material_downloads;
DELETE FROM study_materials;
DELETE FROM doubt_answers;
DELETE FROM doubt_sessions;
DELETE FROM doubts;
DELETE FROM subscriptions;
DELETE FROM subscription_plans;
DELETE FROM test_attempts;
DELETE FROM test_questions;
DELETE FROM tests;
DELETE FROM watch_history;
DELETE FROM enrollments;
DELETE FROM live_classes;
DELETE FROM lessons;
DELETE FROM courses;
DELETE FROM educators;
DELETE FROM users;

-- Reset auto-increment counters
DELETE FROM sqlite_sequence WHERE name IN ('users', 'educators', 'courses', 'lessons', 'live_classes', 'enrollments', 'watch_history', 'tests', 'test_questions', 'test_attempts', 'subscription_plans', 'subscriptions', 'doubts', 'doubt_sessions', 'doubt_answers', 'study_materials', 'material_downloads', 'reviews', 'course_reviews', 'educator_follows', 'educator_followers', 'live_class_questions', 'lesson_notes');

-- Insert sample users (learners)
INSERT INTO users (email, password, firstName, lastName, targetExam, preferredLanguage, phone) VALUES
('john.doe@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'John', 'Doe', 'JEE Main', 'English', '+91-9876543210'),
('jane.smith@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Jane', 'Smith', 'NEET', 'English', '+91-9876543211'),
('mike.johnson@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Mike', 'Johnson', 'CAT', 'English', '+91-9876543212'),
('sarah.wilson@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Sarah', 'Wilson', 'GATE', 'English', '+91-9876543213'),
('david.brown@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'David', 'Brown', 'UPSC', 'Hindi', '+91-9876543214'),
('emma.davis@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Emma', 'Davis', 'JEE Advanced', 'English', '+91-9876543215'),
('alex.garcia@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Alex', 'Garcia', 'SSC CGL', 'Hindi', '+91-9876543216'),
('lisa.martinez@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Lisa', 'Martinez', 'Banking', 'English', '+91-9876543217');

-- Insert sample educators
INSERT INTO educators (email, password, firstName, lastName, bio, subjects, experience, qualification, rating, totalStudents) VALUES
('prof.kumar@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Prof', 'Kumar', 'Expert in Mathematics with 15+ years of teaching experience', 'Mathematics,Physics', 15, 'Ph.D. Mathematics, IIT Delhi', 4.8, 2500),
('dr.sharma@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Dr', 'Sharma', 'Specialist in Biology and Chemistry for NEET preparation', 'Biology,Chemistry', 12, 'M.D. Biochemistry, AIIMS', 4.9, 1800),
('ms.patel@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Ms', 'Patel', 'English and Verbal Ability expert for CAT and other MBA exams', 'English,Verbal Ability', 8, 'M.A. English Literature, Delhi University', 4.7, 1200),
('mr.verma@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Mr', 'Verma', 'Computer Science and Programming expert for GATE and technical exams', 'Computer Science,Programming', 10, 'M.Tech Computer Science, IIT Bombay', 4.6, 900),
('dr.gupta@example.com', '$2a$10$rQZ8K9mN2pL1vX3yA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1f', 'Dr', 'Gupta', 'History and Geography specialist for UPSC Civil Services', 'History,Geography,Polity', 18, 'Ph.D. History, JNU', 4.9, 2100);

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, type, price, duration, features, isActive, description) VALUES
('Basic', 'basic', 999, 30, '["Access to all courses"]', 1, 'Basic monthly plan'),
('Premium', 'premium', 2499, 90, '["Access to all courses", "Live classes", "Materials"]', 1, 'Premium quarterly plan');

-- Insert sample courses
INSERT INTO courses (title, description, educatorId, exam, subject, type, price, discountPrice, thumbnail, syllabus, features, totalLessons, totalDuration, rating, totalEnrollments) VALUES
('Complete JEE Main Mathematics', 'Comprehensive course covering all topics for JEE Main Mathematics with practice questions and mock tests', 1, 'JEE Main', 'Mathematics', 'recorded', 2999.00, 2499.00, 'https://storage.example.com/thumbnails/jee-math.jpg', 'Algebra, Calculus, Trigonometry, Geometry, Statistics', '["HD Video Lectures", "Practice Questions", "Mock Tests", "Doubt Sessions", "Study Material"]', 45, 1800, 4.8, 1250),
('NEET Biology Complete Course', 'Complete Biology preparation for NEET with detailed explanations and practice questions', 2, 'NEET', 'Biology', 'hybrid', 3999.00, 3499.00, 'https://storage.example.com/thumbnails/neet-bio.jpg', 'Botany, Zoology, Human Physiology, Genetics', '["Live Classes", "Recorded Lectures", "Practice Tests", "Doubt Resolution", "Study Notes"]', 60, 2400, 4.9, 980),
('CAT Verbal Ability Masterclass', 'Master Verbal Ability for CAT with comprehensive vocabulary and grammar lessons', 3, 'CAT', 'English', 'live', 1999.00, 1799.00, 'https://storage.example.com/thumbnails/cat-verbal.jpg', 'Vocabulary, Grammar, Reading Comprehension, Verbal Reasoning', '["Live Interactive Sessions", "Practice Exercises", "Mock Tests", "Personal Feedback"]', 30, 1200, 4.7, 750),
('GATE Computer Science', 'Complete GATE CS preparation with programming and theory concepts', 4, 'GATE', 'Computer Science', 'recorded', 4999.00, 4499.00, 'https://storage.example.com/thumbnails/gate-cs.jpg', 'Data Structures, Algorithms, Operating Systems, Databases', '["Video Lectures", "Programming Assignments", "Previous Year Papers", "Mock Tests"]', 80, 3200, 4.6, 650),
('UPSC History & Geography', 'Comprehensive preparation for UPSC History and Geography papers', 5, 'UPSC', 'History', 'hybrid', 5999.00, 5499.00, 'https://storage.example.com/thumbnails/upsc-history.jpg', 'Ancient History, Medieval History, Modern History, World Geography', '["Live Classes", "Study Material", "Current Affairs", "Mock Tests"]', 100, 4000, 4.9, 850),
('JEE Advanced Physics', 'Advanced Physics concepts for JEE Advanced preparation', 1, 'JEE Advanced', 'Physics', 'recorded', 3499.00, 2999.00, 'https://storage.example.com/thumbnails/jee-adv-physics.jpg', 'Mechanics, Electromagnetism, Optics, Modern Physics', '["HD Lectures", "Problem Solving", "Mock Tests", "Doubt Sessions"]', 50, 2000, 4.8, 720),
('Banking Quantitative Aptitude', 'Complete Quantitative Aptitude for Banking exams', 1, 'Banking', 'Mathematics', 'live', 1499.00, 1299.00, 'https://storage.example.com/thumbnails/banking-qa.jpg', 'Number System, Algebra, Geometry, Data Interpretation', '["Live Classes", "Practice Questions", "Speed Techniques", "Mock Tests"]', 25, 1000, 4.5, 420);

-- Insert sample lessons for Course 1 (JEE Main Mathematics)
INSERT INTO lessons (courseId, title, description, videoUrl, thumbnail, duration, orderIndex, isFree) VALUES
(1, 'Introduction to Algebra', 'Basic concepts of algebra and algebraic expressions', 'https://storage.example.com/videos/jee-math/lesson1.mp4', 'https://storage.example.com/thumbnails/jee-math/lesson1.jpg', 45, 1, 1),
(1, 'Linear Equations', 'Solving linear equations and their applications', 'https://storage.example.com/videos/jee-math/lesson2.mp4', 'https://storage.example.com/thumbnails/jee-math/lesson2.jpg', 60, 2, 0),
(1, 'Quadratic Equations', 'Quadratic equations and their solutions', 'https://storage.example.com/videos/jee-math/lesson3.mp4', 'https://storage.example.com/thumbnails/jee-math/lesson3.jpg', 75, 3, 0),
(1, 'Trigonometry Basics', 'Introduction to trigonometric functions', 'https://storage.example.com/videos/jee-math/lesson4.mp4', 'https://storage.example.com/thumbnails/jee-math/lesson4.jpg', 50, 4, 0),
(1, 'Calculus Fundamentals', 'Basic concepts of differentiation and integration', 'https://storage.example.com/videos/jee-math/lesson5.mp4', 'https://storage.example.com/thumbnails/jee-math/lesson5.jpg', 90, 5, 0);

-- Insert sample lessons for Course 2 (NEET Biology)
INSERT INTO lessons (courseId, title, description, videoUrl, thumbnail, duration, orderIndex, isFree) VALUES
(2, 'Cell Biology Introduction', 'Introduction to cell structure and function', 'https://storage.example.com/videos/neet-bio/lesson1.mp4', 'https://storage.example.com/thumbnails/neet-bio/lesson1.jpg', 40, 1, 1),
(2, 'Plant Kingdom', 'Classification and characteristics of plants', 'https://storage.example.com/videos/neet-bio/lesson2.mp4', 'https://storage.example.com/thumbnails/neet-bio/lesson2.jpg', 55, 2, 0),
(2, 'Animal Kingdom', 'Classification and characteristics of animals', 'https://storage.example.com/videos/neet-bio/lesson3.mp4', 'https://storage.example.com/thumbnails/neet-bio/lesson3.jpg', 65, 3, 0),
(2, 'Human Physiology - Digestive System', 'Structure and function of digestive system', 'https://storage.example.com/videos/neet-bio/lesson4.mp4', 'https://storage.example.com/thumbnails/neet-bio/lesson4.jpg', 70, 4, 0),
(2, 'Genetics and Evolution', 'Basic principles of genetics and evolution', 'https://storage.example.com/videos/neet-bio/lesson5.mp4', 'https://storage.example.com/thumbnails/neet-bio/lesson5.jpg', 80, 5, 0);

-- Insert sample live classes
INSERT INTO live_classes (courseId, educatorId, title, description, scheduledAt, duration, maxStudents, joinUrl, status, isActive) VALUES
(2, 2, 'NEET Biology Doubt Session', 'Live doubt clearing session for NEET Biology students', '2024-01-15 18:00:00', 90, 100, 'https://meet.example.com/neet-bio-doubt-123', 'scheduled', 1),
(3, 3, 'CAT Verbal Ability Live Class', 'Live interactive session on Verbal Ability for CAT', '2024-01-16 19:00:00', 120, 50, 'https://meet.example.com/cat-verbal-456', 'scheduled', 1),
(5, 5, 'UPSC History Discussion', 'Discussion on important historical events for UPSC', '2024-01-17 20:00:00', 150, 75, 'https://meet.example.com/upsc-history-789', 'scheduled', 1),
(7, 1, 'Banking QA Live Practice', 'Live practice session for Banking Quantitative Aptitude', '2024-01-18 17:00:00', 90, 60, 'https://meet.example.com/banking-qa-012', 'scheduled', 1),
(1, 1, 'Future Math Live Class', 'Upcoming live class for JEE Math', '2099-01-01 10:00:00', 90, 100, 'https://meet.example.com/future-math', 'scheduled', 1);

-- Insert sample live class attendance
INSERT INTO live_class_attendance (liveClassId, userId, joinedAt, leftAt, duration) VALUES
(1, 2, '2024-01-15 18:00:00', '2024-01-15 19:30:00', 90),
(1, 4, '2024-01-15 18:05:00', '2024-01-15 19:25:00', 80),
(1, 7, '2024-01-15 18:10:00', '2024-01-15 19:20:00', 70),
(2, 1, '2024-01-16 19:00:00', '2024-01-16 21:00:00', 120),
(2, 3, '2024-01-16 19:02:00', '2024-01-16 20:45:00', 103),
(2, 5, '2024-01-16 19:05:00', '2024-01-16 20:30:00', 85),
(3, 3, '2024-01-17 20:00:00', '2024-01-17 22:30:00', 150),
(3, 5, '2024-01-17 20:03:00', '2024-01-17 22:15:00', 132),
(3, 8, '2024-01-17 20:07:00', '2024-01-17 22:00:00', 113),
(4, 5, '2024-01-18 17:00:00', '2024-01-18 18:30:00', 90),
(4, 8, '2024-01-18 17:02:00', '2024-01-18 18:25:00', 83),
((SELECT id FROM live_classes WHERE title = 'Future Math Live Class'), 1, '2099-01-01 10:00:00', NULL, NULL);

-- Insert sample enrollments
INSERT INTO enrollments (userId, courseId, progress, lastAccessedAt) VALUES
(1, 1, 0, '2024-01-10 15:30:00'),
(1, 2, 0, '2024-01-10 15:30:00'),
(1, 3, 0, '2024-01-10 15:30:00'),
(1, 4, 0, '2024-01-10 15:30:00'),
(1, 5, 0, '2024-01-10 15:30:00'),
(1, 6, 0, '2024-01-10 15:30:00'),
(1, 7, 0, '2024-01-10 15:30:00'),
(2, 2, 60.75, '2024-01-12 14:20:00'),
(2, 4, 30.00, '2024-01-13 10:15:00'),
(3, 1, 15.25, '2024-01-14 11:30:00'),
(3, 5, 75.80, '2024-01-15 09:45:00'),
(4, 2, 40.60, '2024-01-16 13:20:00'),
(4, 6, 20.40, '2024-01-17 16:10:00'),
(5, 3, 55.90, '2024-01-18 12:30:00'),
(5, 7, 35.70, '2024-01-19 14:45:00'),
(6, 1, 80.25, '2024-01-20 10:20:00'),
(6, 4, 65.30, '2024-01-21 15:15:00'),
(7, 2, 50.45, '2024-01-22 11:40:00'),
(7, 5, 25.60, '2024-01-23 17:25:00'),
(8, 3, 70.80, '2024-01-24 13:50:00'),
(8, 6, 45.90, '2024-01-25 09:35:00');

-- Insert sample watch history
INSERT INTO watch_history (userId, lessonId, watchedDuration, totalDuration, completionStatus, lastWatchedAt) VALUES
(1, 1, 2700, 2700, 'completed', '2024-01-10 15:30:00'),
(1, 2, 1800, 3600, 'in_progress', '2024-01-11 16:45:00'),
(1, 3, 0, 4500, 'not_started', '2024-01-12 14:20:00'),
(2, 6, 2400, 2400, 'completed', '2024-01-13 10:15:00'),
(2, 7, 3300, 3300, 'completed', '2024-01-14 11:30:00'),
(2, 8, 3900, 3900, 'completed', '2024-01-15 09:45:00'),
(3, 1, 1350, 2700, 'in_progress', '2024-01-16 13:20:00'),
(3, 2, 0, 3600, 'not_started', '2024-01-17 16:10:00'),
(4, 6, 2400, 2400, 'completed', '2024-01-18 12:30:00'),
(4, 7, 1650, 3300, 'in_progress', '2024-01-19 14:45:00'),
(5, 11, 0, 2400, 'not_started', '2024-01-20 10:20:00'),
(5, 12, 1200, 3300, 'in_progress', '2024-01-21 15:15:00'),
(6, 1, 2700, 2700, 'completed', '2024-01-22 11:40:00'),
(6, 2, 3600, 3600, 'completed', '2024-01-23 17:25:00'),
(6, 3, 4500, 4500, 'completed', '2024-01-24 13:50:00'),
(7, 6, 2400, 2400, 'completed', '2024-01-25 09:35:00'),
(7, 7, 1650, 3300, 'in_progress', '2024-01-26 14:20:00'),
(8, 11, 0, 2400, 'not_started', '2024-01-27 16:30:00'),
(8, 12, 3300, 3300, 'completed', '2024-01-28 10:45:00');

-- Insert sample tests
INSERT INTO tests (courseId, title, description, type, subject, totalQuestions, totalMarks, duration, passingMarks) VALUES
(1, 'JEE Main Mathematics Mock Test 1', 'Full length mock test for JEE Main Mathematics', 'mock_test', 'Mathematics', 25, 100, 180, 60),
(1, 'Algebra Quiz', 'Quick quiz on algebra concepts', 'quiz', 'Mathematics', 10, 40, 30, 20),
(2, 'NEET Biology Mock Test 1', 'Complete mock test for NEET Biology', 'mock_test', 'Biology', 90, 360, 200, 216),
(2, 'Cell Biology Quiz', 'Quiz on cell biology concepts', 'quiz', 'Biology', 15, 60, 45, 30),
(3, 'CAT Verbal Ability Test', 'Verbal ability test for CAT preparation', 'mock_test', 'English', 34, 102, 60, 51),
(4, 'GATE CS Programming Test', 'Programming and algorithm test for GATE CS', 'mock_test', 'Computer Science', 65, 100, 180, 50),
(5, 'UPSC History Test', 'History test for UPSC preparation', 'mock_test', 'History', 100, 200, 120, 100);

-- Insert sample test questions
INSERT INTO test_questions (testId, question, options, correctAnswer, marks, negativeMarks, explanation, orderIndex) VALUES
(1, 'What is the value of x in the equation 2x + 5 = 13?', '["3", "4", "5", "6"]', '4', 4, 1.00, '2x + 5 = 13 => 2x = 8 => x = 4', 1),
(1, 'Solve the quadratic equation x² - 5x + 6 = 0', '["x = 2, 3", "x = 1, 4", "x = 2, 4", "x = 1, 3"]', 'x = 2, 3', 4, 1.00, 'x² - 5x + 6 = (x-2)(x-3) = 0 => x = 2 or x = 3', 2),
(1, 'What is the derivative of x³?', '["x²", "2x²", "3x²", "4x²"]', '3x²', 4, 1.00, 'd/dx(x³) = 3x²', 3),
(2, 'What is the value of sin(30°)?', '["1/2", "√3/2", "1", "0"]', '1/2', 4, 1.00, 'sin(30°) = 1/2', 1),
(2, 'What is the value of cos(60°)?', '["1/2", "√3/2", "1", "0"]', '1/2', 4, 1.00, 'cos(60°) = 1/2', 2),
(3, 'Which of the following is a cell organelle?', '["Nucleus", "Cytoplasm", "Cell membrane", "All of the above"]', 'All of the above', 4, 1.00, 'All are cell organelles', 1),
(3, 'What is the powerhouse of the cell?', '["Nucleus", "Mitochondria", "Golgi apparatus", "Endoplasmic reticulum"]', 'Mitochondria', 4, 1.00, 'Mitochondria is called the powerhouse of the cell', 2),
(4, 'Which of the following is a plant cell organelle?', '["Chloroplast", "Centriole", "Lysosome", "All of the above"]', 'Chloroplast', 4, 1.00, 'Chloroplast is found only in plant cells', 1),
(5, 'Choose the correct synonym for "Eloquent"', '["Silent", "Articulate", "Confused", "Angry"]', 'Articulate', 3, 1.00, 'Eloquent means fluent or persuasive in speech', 1),
(5, 'What is the antonym of "Benevolent"?', '["Kind", "Generous", "Malevolent", "Charitable"]', 'Malevolent', 3, 1.00, 'Malevolent is the opposite of benevolent', 2);

-- Insert sample test attempts
INSERT INTO test_attempts (userId, testId, sessionId, startTime, endTime, timeSpent, score, rank, percentile, correctAnswers, incorrectAnswers, unattemptedQuestions, subjectAnalysis, answers, status) VALUES
(1, 1, 'session_001', '2024-01-10 10:00:00', '2024-01-10 13:00:00', 180, 85.00, 5, 92.50, 21, 3, 1, '{"Algebra": "90%", "Calculus": "80%", "Trigonometry": "85%"}', '{"1": "4", "2": "x = 2, 3", "3": "3x²"}', 'completed'),
(1, 2, 'session_002', '2024-01-11 14:00:00', '2024-01-11 14:25:00', 25, 35.00, 3, 88.00, 8, 1, 1, '{"Trigonometry": "85%"}', '{"1": "1/2", "2": "1/2"}', 'completed'),
(2, 3, 'session_003', '2024-01-12 09:00:00', '2024-01-12 12:20:00', 200, 320.00, 12, 78.50, 80, 8, 2, '{"Cell Biology": "85%", "Plant Kingdom": "90%", "Animal Kingdom": "75%"}', '{"1": "All of the above", "2": "Mitochondria"}', 'completed'),
(3, 1, 'session_004', '2024-01-13 15:00:00', '2024-01-13 17:30:00', 150, 65.00, 25, 65.00, 16, 7, 2, '{"Algebra": "70%", "Calculus": "60%", "Trigonometry": "65%"}', '{"1": "4", "2": "x = 2, 3", "3": "2x²"}', 'completed'),
(4, 5, 'session_005', '2024-01-14 11:00:00', '2024-01-14 12:00:00', 60, 75.00, 8, 82.00, 25, 7, 2, '{"Vocabulary": "80%", "Grammar": "70%", "Reading": "75%"}', '{"1": "Articulate", "2": "Malevolent"}', 'completed');

-- Insert sample subscriptions
INSERT INTO subscriptions (userId, planId, planName, planType, price, features, startDate, endDate, status, autoRenew) VALUES
(1, 2, 'Premium Plan', 'premium', 999.00, '["All Courses", "Live Classes", "Mock Tests", "Doubt Sessions", "Study Material"]', '2024-01-01 00:00:00', '2024-12-31 23:59:59', 'active', 1),
(2, 1, 'Basic Plan', 'basic', 499.00, '["Limited Courses", "Recorded Lectures", "Basic Tests"]', '2024-01-01 00:00:00', '2024-06-30 23:59:59', 'active', 0),
(3, 2, 'Premium Plan', 'premium', 999.00, '["All Courses", "Live Classes", "Mock Tests", "Doubt Sessions", "Study Material"]', '2024-01-01 00:00:00', '2024-12-31 23:59:59', 'active', 1),
(4, 3, 'Enterprise Plan', 'enterprise', 1999.00, '["All Features", "Personal Mentor", "Priority Support", "Custom Study Plan"]', '2024-01-01 00:00:00', '2024-12-31 23:59:59', 'active', 1),
(5, 1, 'Basic Plan', 'basic', 499.00, '["Limited Courses", "Recorded Lectures", "Basic Tests"]', '2024-01-01 00:00:00', '2024-06-30 23:59:59', 'expired', 0);

-- Insert sample doubts
INSERT INTO doubts (userId, courseId, lessonId, question, answer, answeredBy, answeredAt, attachments, isActive) VALUES
(1, 1, 2, 'I am having trouble understanding quadratic equations. Can you explain the concept with examples?', 'Quadratic equations are polynomial equations of degree 2. The general form is ax² + bx + c = 0. Here are some examples...', 1, '2024-01-10 16:00:00', '["https://storage.example.com/attachments/doubt1.jpg"]', 1),
(2, 2, 6, 'What is the difference between mitosis and meiosis?', NULL, NULL, NULL, '[]', 1),
(3, 3, 11, 'How to improve vocabulary for CAT exam?', 'To improve vocabulary for CAT, you should read newspapers daily, maintain a vocabulary notebook, and practice word lists...', 3, '2024-01-12 14:30:00', '["https://storage.example.com/attachments/doubt3.pdf"]', 1),
(4, 4, 16, 'Can you explain the concept of dynamic programming?', NULL, NULL, NULL, '[]', 1),
(5, 5, 21, 'What are the important events in Indian freedom struggle?', 'Important events in Indian freedom struggle include: 1857 Revolt, Formation of INC, Partition of Bengal, Non-Cooperation Movement...', 5, '2024-01-15 11:45:00', '["https://storage.example.com/attachments/doubt5.jpg"]', 1);

-- Insert sample doubt sessions
INSERT INTO doubt_sessions (userId, educatorId, courseId, lessonId, question, attachments, status) VALUES
(1, 1, 1, 2, 'I am having trouble understanding quadratic equations. Can you explain the concept with examples?', '["https://storage.example.com/attachments/doubt1.jpg"]', 'answered'),
(2, 2, 2, 6, 'What is the difference between mitosis and meiosis?', '[]', 'open'),
(3, 3, 3, 11, 'How to improve vocabulary for CAT exam?', '["https://storage.example.com/attachments/doubt3.pdf"]', 'answered'),
(4, 4, 4, 16, 'Can you explain the concept of dynamic programming?', '[]', 'open'),
(5, 5, 5, 21, 'What are the important events in Indian freedom struggle?', '["https://storage.example.com/attachments/doubt5.jpg"]', 'answered');

-- Insert sample doubt answers
INSERT INTO doubt_answers (doubtId, educatorId, answer, attachments, isAccepted) VALUES
(1, 1, 'Quadratic equations are polynomial equations of degree 2. The general form is ax² + bx + c = 0. Here are some examples...', '["https://storage.example.com/attachments/answer1.pdf"]', 1),
(3, 3, 'To improve vocabulary for CAT, you should read newspapers daily, maintain a vocabulary notebook, and practice word lists...', '["https://storage.example.com/attachments/answer3.pdf"]', 1),
(5, 5, 'Important events in Indian freedom struggle include: 1857 Revolt, Formation of INC, Partition of Bengal, Non-Cooperation Movement...', '["https://storage.example.com/attachments/answer5.pdf"]', 0);

-- Insert sample material downloads
INSERT INTO material_downloads (userId, materialId, downloadedAt) VALUES
(1, 1, '2024-01-10 15:35:00'),
(2, 3, '2024-01-12 14:25:00'),
(3, 1, '2024-01-14 11:30:00'),
(4, 6, '2024-01-16 13:20:00'),
(5, 7, '2024-01-18 12:30:00'),
(6, 1, '2024-01-20 10:20:00'),
(7, 3, '2024-01-22 11:40:00'),
(8, 5, '2024-01-24 13:50:00');

-- Insert sample reviews
INSERT INTO reviews (userId, courseId, rating, title, comment, isActive) VALUES
(1, 1, 5, 'Excellent course!', 'The explanations are very clear and the practice questions are helpful.', 1),
(2, 2, 4, 'Great course for NEET', 'The live classes are very interactive and helpful.', 1),
(3, 3, 4, 'Good for CAT preparation', 'Helped me improve my vocabulary significantly.', 1),
(4, 4, 5, 'Comprehensive GATE course', 'The programming examples are very useful and well explained.', 1),
(5, 5, 4, 'Well-structured UPSC course', 'The study material is comprehensive and well organized.', 1),
(6, 1, 5, 'Best mathematics course', 'Highly recommended for JEE Main preparation!', 1),
(7, 2, 4, 'Good biology course', 'The doubt sessions are very helpful and informative.', 1),
(8, 3, 3, 'Decent course', 'Could have more practice questions and exercises.', 1);

-- Insert sample course reviews
INSERT INTO course_reviews (userId, courseId, rating, review) VALUES
(1, 1, 5, 'Excellent course! The explanations are very clear and the practice questions are helpful.'),
(2, 2, 4, 'Great course for NEET preparation. The live classes are very interactive.'),
(3, 3, 4, 'Good course for CAT verbal ability. Helped me improve my vocabulary significantly.'),
(4, 4, 5, 'Comprehensive course for GATE CS. The programming examples are very useful.'),
(5, 5, 4, 'Well-structured course for UPSC preparation. The study material is comprehensive.'),
(6, 1, 5, 'Best mathematics course for JEE Main. Highly recommended!'),
(7, 2, 4, 'Good course with detailed explanations. The doubt sessions are very helpful.'),
(8, 3, 3, 'Decent course but could have more practice questions.');

-- Insert sample educator follows
INSERT INTO educator_follows (userId, educatorId) VALUES
(1, 1), (1, 2), (2, 2), (2, 3), (3, 1), (3, 4), (4, 5), (5, 1), (6, 2), (7, 3), (8, 4);

-- Insert sample educator followers (alias table)
INSERT INTO educator_followers (userId, educatorId) VALUES
(1, 1), (1, 2), (2, 2), (2, 3), (3, 1), (3, 4), (4, 5), (5, 1), (6, 2), (7, 3), (8, 4);

-- Add a doubt for user 1
INSERT INTO doubts (userId, courseId, lessonId, question, attachments, isActive, createdAt) VALUES
(1, 1, 1, 'Test doubt for lesson 1', '[]', 1, '2024-01-10 15:40:00');

-- Add a doubt answer for educator 1
INSERT INTO doubt_answers (doubtId, educatorId, answer, attachments, isAccepted) VALUES
(1, 1, 'This is a test answer.', '[]', 1);

-- Remove incorrect study_materials insert for course 1, lesson 1
DELETE FROM study_materials WHERE courseId=1 AND lessonId=1;

-- Insert correct study material for course 1, lesson 1, id=1
DELETE FROM study_materials WHERE id=1;
INSERT INTO study_materials (id, courseId, lessonId, title, description, type, downloadUrl, fileSize, downloadCount, isActive, orderIndex, createdAt) VALUES
(1, 1, 1, 'Sample Material', 'Sample PDF for lesson 1', 'pdf', 'https://storage.example.com/materials/sample-lesson1.pdf', 1024, 0, 1, 1, '2024-01-10 15:30:00');

-- Ensure a future live class for course 1 with id=1
DELETE FROM live_classes WHERE id=1;
INSERT INTO live_classes (id, courseId, educatorId, title, description, scheduledAt, duration, maxStudents, joinUrl, status, isActive) VALUES
(1, 1, 1, 'Future Math Live Class', 'Upcoming live class for JEE Math', '2099-01-01 10:00:00', 90, 100, 'https://meet.example.com/future-math', 'scheduled', 1);

-- Ensure test user is enrolled in course 1
DELETE FROM enrollments WHERE userId=1 AND courseId=1;
INSERT INTO enrollments (userId, courseId, progress, lastAccessedAt) VALUES (1, 1, 0, '2024-01-10 15:30:00');

-- Add description to subscription_plans
UPDATE subscription_plans SET description = 'Basic access' WHERE type = 'basic';
UPDATE subscription_plans SET description = 'Premium access' WHERE type = 'premium';
UPDATE subscription_plans SET description = 'Enterprise access' WHERE type = 'enterprise';

-- Remove any course_materials seed
DELETE FROM course_materials;

-- Insert sample study materials with lessonId and orderIndex
DELETE FROM study_materials;
INSERT INTO study_materials (courseId, lessonId, title, description, type, downloadUrl, fileSize, downloadCount, isActive, orderIndex, createdAt) VALUES
(1, 1, 'JEE Main Mathematics Formula Sheet', 'Complete formula sheet for JEE Main Mathematics', 'pdf', 'https://storage.example.com/materials/jee-math-formulas.pdf', 2048576, 450, 1, 1, '2024-01-10 15:30:00'),
(1, 1, 'Algebra Practice Questions', 'Practice questions for algebra section', 'pdf', 'https://storage.example.com/materials/algebra-practice.pdf', 1536000, 320, 1, 2, '2024-01-10 15:31:00'),
(2, 2, 'NEET Biology Notes', 'Comprehensive notes for NEET Biology', 'pdf', 'https://storage.example.com/materials/neet-bio-notes.pdf', 1048576, 200, 1, 1, '2024-01-11 10:00:00');

-- Insert subscription plans with description
DELETE FROM subscription_plans;
INSERT INTO subscription_plans (id, name, type, price, duration, features, isActive, description) VALUES
(1, 'Basic', 'basic', 999, 30, '["Access to all courses"]', 1, 'Basic monthly plan'),
(2, 'Premium', 'premium', 2499, 90, '["Access to all courses", "Live classes", "Materials"]', 1, 'Premium quarterly plan');

-- Insert doubts with answeredBy
DELETE FROM doubts;
INSERT INTO doubts (userId, courseId, lessonId, question, answer, answeredBy, answeredAt, attachments, createdAt) VALUES
(1, 1, 1, 'What is the quadratic formula?', 'The quadratic formula is x = (-b ± sqrt(b^2-4ac))/(2a)', 1, '2024-01-12 12:00:00', NULL, '2024-01-12 11:00:00');

-- Insert a sample live class question for testing
DELETE FROM live_class_questions;
INSERT INTO live_class_questions (liveClassId, userId, question, askedAt, answer, answeredAt, educatorId, isAnswered, createdAt)
VALUES (1, 1, 'What is the quadratic formula?', '2025-06-25T10:00:00Z', 'The quadratic formula is x = (-b ± sqrt(b^2-4ac))/(2a)', '2025-06-25T10:05:00Z', 1, 1, '2025-06-25T10:00:00Z');

-- Seed coupons
INSERT INTO coupons (code, discountType, discountValue, isActive, expiryDate) VALUES
('DISCOUNT10', 'percentage', 10, 1, '2026-12-31 23:59:59'),
('FLAT100', 'flat', 100, 1, '2026-12-31 23:59:59'); 