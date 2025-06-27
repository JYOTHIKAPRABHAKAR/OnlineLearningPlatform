// User roles
const LEARNER_ROLE = 'learner';
const EDUCATOR_ROLE = 'educator';

// Course types
const COURSE_TYPES = {
    LIVE: 'live',
    RECORDED: 'recorded',
    HYBRID: 'hybrid'
};

// Test types
const TEST_TYPES = {
    QUIZ: 'quiz',
    MOCK_TEST: 'mock_test',
    ASSIGNMENT: 'assignment'
};

// Subscription types
const SUBSCRIPTION_TYPES = {
    BASIC: 'basic',
    PREMIUM: 'premium',
    ENTERPRISE: 'enterprise'
};

// Completion status
const COMPLETION_STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
};

// Live class status
const LIVE_CLASS_STATUS = {
    SCHEDULED: 'scheduled',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// Doubt status
const DOUBT_STATUS = {
    OPEN: 'open',
    ANSWERED: 'answered',
    CLOSED: 'closed'
};

// Test attempt status
const TEST_ATTEMPT_STATUS = {
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned'
};

// HTTP status codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500
};

// Pagination defaults
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

// Rate limiting
const RATE_LIMIT = {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
};

// File upload limits
const FILE_LIMITS = {
    MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
};

module.exports = {
    LEARNER_ROLE,
    EDUCATOR_ROLE,
    COURSE_TYPES,
    TEST_TYPES,
    SUBSCRIPTION_TYPES,
    COMPLETION_STATUS,
    LIVE_CLASS_STATUS,
    DOUBT_STATUS,
    TEST_ATTEMPT_STATUS,
    HTTP_STATUS,
    PAGINATION,
    RATE_LIMIT,
    FILE_LIMITS
}; 