-- Online Learning Platform Database Schema
-- This schema supports comprehensive learning management with progress tracking, analytics, and content access control

-- Users table - Stores learner information
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    targetExam TEXT NOT NULL,
    preferredLanguage TEXT NOT NULL,
    phone TEXT,
    profileImage TEXT,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Educators table - Stores educator information
CREATE TABLE IF NOT EXISTS educators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    bio TEXT,
    subjects TEXT NOT NULL, -- Comma-separated subjects
    experience INTEGER NOT NULL, -- Years of experience
    qualification TEXT NOT NULL,
    profileImage TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00,
    totalStudents INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Courses table - Stores course information
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    educatorId INTEGER NOT NULL,
    exam TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('live', 'recorded', 'hybrid')),
    price DECIMAL(10,2) NOT NULL,
    discountPrice DECIMAL(10,2),
    thumbnail TEXT,
    syllabus TEXT,
    features TEXT, -- JSON string of features
    totalLessons INTEGER DEFAULT 0,
    totalDuration INTEGER DEFAULT 0, -- in minutes
    rating DECIMAL(3,2) DEFAULT 0.00,
    totalEnrollments INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (educatorId) REFERENCES educators(id) ON DELETE CASCADE
);

-- Lessons table - Stores individual lesson information
CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    videoUrl TEXT,
    thumbnail TEXT,
    duration INTEGER NOT NULL, -- in minutes
    orderIndex INTEGER NOT NULL,
    isFree BOOLEAN DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Live Classes table - Stores scheduled live class information
CREATE TABLE IF NOT EXISTS live_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER NOT NULL,
    educatorId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduledAt DATETIME NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    maxStudents INTEGER NOT NULL,
    joinUrl TEXT,
    recordingUrl TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (educatorId) REFERENCES educators(id) ON DELETE CASCADE
);

-- Live Class Attendance table - Tracks user attendance in live classes
CREATE TABLE IF NOT EXISTS live_class_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    liveClassId INTEGER NOT NULL,
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    leftAt DATETIME,
    duration INTEGER, -- in minutes
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, liveClassId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (liveClassId) REFERENCES live_classes(id) ON DELETE CASCADE
);

-- Enrollments table - Tracks user course enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    courseId INTEGER NOT NULL,
    enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress DECIMAL(5,2) DEFAULT 0.00, -- Percentage completion
    lastAccessedAt DATETIME,
    isActive BOOLEAN DEFAULT 1,
    UNIQUE(userId, courseId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Watch History table - Tracks video watching progress
CREATE TABLE IF NOT EXISTS watch_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    lessonId INTEGER NOT NULL,
    watchedDuration INTEGER DEFAULT 0, -- in seconds
    totalDuration INTEGER NOT NULL, -- in seconds
    completionStatus TEXT DEFAULT 'not_started' CHECK (completionStatus IN ('not_started', 'in_progress', 'completed')),
    lastWatchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, lessonId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Tests/Quizzes table - Stores test information
CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('quiz', 'mock_test', 'assignment')),
    subject TEXT NOT NULL,
    totalQuestions INTEGER NOT NULL,
    totalMarks INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    passingMarks INTEGER NOT NULL,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Test Questions table - Stores individual test questions
CREATE TABLE IF NOT EXISTS test_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    testId INTEGER NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON string of options
    correctAnswer TEXT NOT NULL,
    marks INTEGER NOT NULL DEFAULT 1,
    negativeMarks DECIMAL(3,2) DEFAULT 0.00,
    explanation TEXT,
    orderIndex INTEGER NOT NULL,
    subject TEXT,
    FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE
);

-- Test Attempts table - Tracks user test attempts
CREATE TABLE IF NOT EXISTS test_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    testId INTEGER NOT NULL,
    sessionId TEXT UNIQUE NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME,
    timeSpent INTEGER, -- in minutes
    score DECIMAL(5,2),
    rank INTEGER,
    percentile DECIMAL(5,2),
    correctAnswers INTEGER DEFAULT 0,
    incorrectAnswers INTEGER DEFAULT 0,
    unattemptedQuestions INTEGER DEFAULT 0,
    subjectAnalysis TEXT, -- JSON string of subject-wise analysis
    answers TEXT, -- JSON string of submitted answers
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE
);

-- Subscription Plans table - Stores available subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('basic', 'premium', 'enterprise')),
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL, -- in days
    features TEXT, -- JSON string of features
    description TEXT,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table - Tracks user subscription plans
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    planId INTEGER NOT NULL,
    planName TEXT NOT NULL,
    planType TEXT NOT NULL CHECK (planType IN ('basic', 'premium', 'enterprise')),
    price DECIMAL(10,2) NOT NULL,
    features TEXT, -- JSON string of features
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    autoRenew BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (planId) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

-- Doubts table - Stores Q&A between users and educators (alias for doubt_sessions)
CREATE TABLE IF NOT EXISTS doubts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    courseId INTEGER NOT NULL,
    lessonId INTEGER,
    question TEXT NOT NULL,
    answer TEXT,
    answeredBy INTEGER,
    answeredAt DATETIME,
    attachments TEXT, -- JSON string of attachment URLs
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE SET NULL,
    FOREIGN KEY (answeredBy) REFERENCES educators(id) ON DELETE SET NULL
);

-- Doubt Sessions table - Stores Q&A between users and educators
CREATE TABLE IF NOT EXISTS doubt_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    educatorId INTEGER,
    courseId INTEGER,
    lessonId INTEGER,
    question TEXT NOT NULL,
    attachments TEXT, -- JSON string of attachment URLs
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (educatorId) REFERENCES educators(id) ON DELETE SET NULL,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE SET NULL
);

-- Doubt Answers table - Stores answers to doubts
CREATE TABLE IF NOT EXISTS doubt_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doubtId INTEGER NOT NULL,
    educatorId INTEGER NOT NULL,
    answer TEXT NOT NULL,
    attachments TEXT, -- JSON string of attachment URLs
    isAccepted BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doubtId) REFERENCES doubt_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (educatorId) REFERENCES educators(id) ON DELETE CASCADE
);

-- Study Materials table - Stores downloadable study materials
CREATE TABLE IF NOT EXISTS study_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER NOT NULL,
    lessonId INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'document', 'video', 'audio', 'other')),
    downloadUrl TEXT NOT NULL,
    fileSize INTEGER, -- in bytes
    downloadCount INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    orderIndex INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Material Downloads table - Tracks material downloads
CREATE TABLE IF NOT EXISTS material_downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    materialId INTEGER NOT NULL,
    downloadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (materialId) REFERENCES study_materials(id) ON DELETE CASCADE
);

-- Reviews table - Stores user reviews for courses (alias for course_reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    courseId INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, courseId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Course Reviews table - Stores user reviews for courses
CREATE TABLE IF NOT EXISTS course_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    courseId INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, courseId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Educator Follows table - Tracks user follows for educators
CREATE TABLE IF NOT EXISTS educator_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    educatorId INTEGER NOT NULL,
    followedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, educatorId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (educatorId) REFERENCES educators(id) ON DELETE CASCADE
);

-- Educator Followers table - Alias for educator_follows
CREATE TABLE IF NOT EXISTS educator_followers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    educatorId INTEGER NOT NULL,
    followedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, educatorId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (educatorId) REFERENCES educators(id) ON DELETE CASCADE
);

-- Live Class Questions table - Stores questions during live classes
CREATE TABLE IF NOT EXISTS live_class_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    liveClassId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    question TEXT NOT NULL,
    askedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    answer TEXT,
    answeredAt DATETIME,
    educatorId INTEGER,
    isAnswered BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (liveClassId) REFERENCES live_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (educatorId) REFERENCES educators(id) ON DELETE SET NULL
);

-- Lesson Notes table - Stores user notes for lessons
CREATE TABLE IF NOT EXISTS lesson_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    lessonId INTEGER NOT NULL,
    note TEXT NOT NULL,
    timestamp INTEGER, -- Video timestamp in seconds
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    discountType TEXT NOT NULL, -- 'percentage' or 'flat'
    discountValue INTEGER NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1,
    expiryDate TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_educators_email ON educators(email);
CREATE INDEX IF NOT EXISTS idx_courses_educator ON courses(educatorId);
CREATE INDEX IF NOT EXISTS idx_courses_exam ON courses(exam);
CREATE INDEX IF NOT EXISTS idx_courses_subject ON courses(subject);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(courseId);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(userId);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(courseId);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(userId);
CREATE INDEX IF NOT EXISTS idx_watch_history_lesson ON watch_history(lessonId);
CREATE INDEX IF NOT EXISTS idx_tests_course ON tests(courseId);
CREATE INDEX IF NOT EXISTS idx_test_questions_test ON test_questions(testId);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON test_attempts(userId);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test ON test_attempts(testId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(userId);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(isActive);
CREATE INDEX IF NOT EXISTS idx_doubts_user ON doubts(userId);
CREATE INDEX IF NOT EXISTS idx_doubts_course ON doubts(courseId);
CREATE INDEX IF NOT EXISTS idx_doubt_sessions_user ON doubt_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_doubt_sessions_course ON doubt_sessions(courseId);
CREATE INDEX IF NOT EXISTS idx_study_materials_course ON study_materials(courseId);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(courseId);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON course_reviews(courseId);
CREATE INDEX IF NOT EXISTS idx_educator_follows_user ON educator_follows(userId);
CREATE INDEX IF NOT EXISTS idx_educator_followers_user ON educator_followers(userId);
CREATE INDEX IF NOT EXISTS idx_live_classes_course ON live_classes(courseId);
CREATE INDEX IF NOT EXISTS idx_live_classes_scheduled ON live_classes(scheduledAt);

-- Add isActive to live_classes
ALTER TABLE live_classes ADD COLUMN isActive BOOLEAN DEFAULT 1;
-- Add description to subscription_plans
ALTER TABLE subscription_plans ADD COLUMN description TEXT;
-- Add subject to test_questions (if not present)
ALTER TABLE test_questions ADD COLUMN subject TEXT;
-- Add answeredBy to doubts (if not present)
ALTER TABLE doubts ADD COLUMN answeredBy INTEGER REFERENCES educators(id);
-- Remove course_materials table if present (use study_materials instead)
DROP TABLE IF EXISTS course_materials;

-- Ensure doubts.answeredBy exists
ALTER TABLE doubts ADD COLUMN answeredBy INTEGER;
-- Add orderIndex to study_materials
ALTER TABLE study_materials ADD COLUMN orderIndex INTEGER;
-- Remove old table if present
DROP TABLE IF EXISTS live_class_questions_old; 