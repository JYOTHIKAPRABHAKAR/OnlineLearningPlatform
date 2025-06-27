-- Fix schema for problematic tables
-- Drop existing tables
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS doubts;
DROP TABLE IF EXISTS doubt_sessions;
DROP TABLE IF EXISTS doubt_answers;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS educator_followers;

-- Recreate subscriptions table with correct schema
CREATE TABLE subscriptions (
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

-- Recreate doubts table
CREATE TABLE doubts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    courseId INTEGER,
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

-- Recreate doubt_sessions table
CREATE TABLE doubt_sessions (
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

-- Recreate doubt_answers table
CREATE TABLE doubt_answers (
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

-- Recreate reviews table
CREATE TABLE reviews (
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

-- Recreate educator_followers table
CREATE TABLE educator_followers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    educatorId INTEGER NOT NULL,
    followedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, educatorId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (educatorId) REFERENCES educators(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(userId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(planId);
CREATE INDEX IF NOT EXISTS idx_doubts_user ON doubts(userId);
CREATE INDEX IF NOT EXISTS idx_doubts_course ON doubts(courseId);
CREATE INDEX IF NOT EXISTS idx_doubt_sessions_user ON doubt_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_doubt_sessions_course ON doubt_sessions(courseId);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(courseId);
CREATE INDEX IF NOT EXISTS idx_educator_followers_user ON educator_followers(userId); 