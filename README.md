# Online Learning Platform - Backend API

A comprehensive backend API for an online learning platform similar to Unacademy, built with Node.js, Express.js, and SQLite. This platform supports course management, live classes, video lectures, tests, educator profiles, subscriptions, and detailed progress tracking.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - JWT-based authentication with role-based access (learner/educator)
- **Course Management** - Complete CRUD operations for courses with enrollment tracking
- **Video Learning** - Lesson management with progress tracking and watch history
- **Live Classes** - Scheduled live sessions with attendance tracking
- **Test Engine** - Comprehensive testing system with analytics and performance tracking
- **Educator Profiles** - Detailed educator management with ratings and reviews
- **Subscription System** - Tiered subscription plans with access control
- **Doubt Resolution** - Q&A system for student-teacher interaction
- **Study Materials** - Resource management with download tracking
- **Progress Analytics** - Detailed learning analytics and performance insights
- **Search & Discovery** - Global search across courses, educators, and lessons
- **Review System** - Course and educator rating system

### Advanced Features
- **Real-time Progress Tracking** - Video watch progress with timestamp tracking
- **Performance Analytics** - Detailed test analysis with subject-wise breakdown
- **Subscription Tiers** - Plus and Iconic plans with different access levels
- **Content Access Control** - Enrollment and subscription-based access verification
- **Error Handling** - Comprehensive error handling with appropriate HTTP status codes
- **Input Validation** - Robust validation for all API endpoints
- **Security Features** - Password hashing, rate limiting, and input sanitization

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (with Knex.js ORM)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd onlineLearningPlatform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy the environment example file
cp env.example .env

# Edit .env file with your configuration
```

### 4. Database Setup
```bash
# Run database migrations
npm run migrate

# Seed the database with sample data
npm run seed
```

### 5. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
onlineLearningPlatform/
├── src/
│   ├── config/
│   │   ├── database.js          # Database configuration and connection
│   │   ├── migrate.js           # Database migration script
│   │   └── seed.js              # Database seeding script
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── courseController.js  # Course management
│   │   ├── lessonController.js  # Lesson and video management
│   │   └── testController.js    # Test and quiz management
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── enrollment.js        # Enrollment verification
│   │   ├── subscription.js      # Subscription access control
│   │   ├── validation.js        # Input validation
│   │   └── errorHandler.js      # Error handling middleware
│   ├── models/
│   │   ├── user.js              # User model
│   │   ├── course.js            # Course model
│   │   ├── lesson.js            # Lesson model
│   │   └── educator.js          # Educator model
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication routes
│   │   ├── courseRoutes.js      # Course routes
│   │   ├── lessonRoutes.js      # Lesson routes
│   │   └── testRoutes.js        # Test routes
│   ├── utils/
│   │   ├── constants.js         # Application constants
│   │   └── helpers.js           # Utility functions
│   └── app.js                   # Main application file
├── database/
│   ├── schema.sql               # Database schema
│   ├── seeds.sql                # Sample data
│   └── online_learning.db       # SQLite database file
├── .env                         # Environment variables
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🗄 Database Design

### Core Entities

#### Users (Learners)
- Profile information (name, email, phone)
- Target exam (UPSC, NEET, JEE, etc.)
- Preferred language
- Learning preferences

#### Educators
- Professional profile and credentials
- Subject expertise (comma-separated)
- Years of experience and qualifications
- Rating and student count

#### Courses
- Course details and structure
- Target exam and subject
- Pricing and discount information
- Course type (live/recorded/hybrid)
- Features and syllabus

#### Lessons
- Individual video lessons
- Duration and order tracking
- Free/premium access control
- Video URLs and thumbnails

#### Live Classes
- Scheduled live sessions
- Capacity management
- Attendance tracking
- Recording availability

#### Enrollments & Progress
- User course enrollments
- Video watch progress
- Completion tracking
- Last accessed timestamps

#### Tests & Analytics
- Practice tests and mock exams
- Question banks with explanations
- Performance analytics
- Subject-wise analysis

#### Subscriptions
- Tiered subscription plans
- Payment tracking
- Access control
- Feature benefits

### Key Relationships
- **One-to-Many**: Educator → Courses, Course → Lessons
- **Many-to-Many**: Users ↔ Courses (via Enrollments)
- **One-to-Many**: Course → Tests, User → Test Attempts
- **One-to-Many**: User → Doubts, Educator → Doubt Answers

## 🔌 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### 1. Authentication Endpoints

#### Register Learner
```http
POST /api/auth/register
Content-Type: application/json

{
    "email": "learner@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe",
    "targetExam": "JEE Main",
    "preferredLanguage": "English",
    "phone": "+91-9876543210"
}
```

#### Register Educator
```http
POST /api/auth/educator/register
Content-Type: application/json

{
    "email": "educator@example.com",
    "password": "SecurePass123",
    "firstName": "Dr. Sarah",
    "lastName": "Kumar",
    "bio": "Experienced educator with 10+ years of teaching",
    "subjects": "Mathematics,Physics",
    "experience": 10,
    "qualification": "Ph.D. Mathematics, IIT Delhi"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "learner@example.com",
    "password": "SecurePass123"
}
```

### 2. Course Endpoints

#### Browse Courses
```http
GET /api/courses?exam=JEE Main&subject=Mathematics&type=recorded&page=1&limit=10
```

#### Get Course Details
```http
GET /api/courses/1
```

#### Enroll in Course
```http
POST /api/courses/1/enroll
Authorization: Bearer <token>
```

#### Get Course Progress
```http
GET /api/courses/1/progress
Authorization: Bearer <token>
```

### 3. Lesson Endpoints

#### Get Lesson Details
```http
GET /api/lessons/1
Authorization: Bearer <token>
```

#### Update Lesson Progress
```http
POST /api/lessons/1/progress
Authorization: Bearer <token>
Content-Type: application/json

{
    "watchedDuration": 1800,
    "totalDuration": 2700,
    "completionStatus": "in_progress"
}
```

#### Save Lesson Notes
```http
POST /api/lessons/1/notes
Authorization: Bearer <token>
Content-Type: application/json

{
    "note": "Important concept about algebra",
    "timestamp": 120
}
```

### 4. Test Endpoints

#### Get Available Tests
```http
GET /api/tests?courseId=1&type=mock_test
Authorization: Bearer <token>
```

#### Start Test
```http
POST /api/tests/1/start
Authorization: Bearer <token>
```

#### Submit Test Answers
```http
POST /api/tests/session_001/submit
Authorization: Bearer <token>
Content-Type: application/json

{
    "answers": [
        { "questionId": 1, "selectedOption": "4" },
        { "questionId": 2, "selectedOption": "wrong" }
    ],
    "timeSpent": 180
}
```

### 5. Live Class Endpoints

#### Get Live Class Schedule
```http
GET /api/live-classes/schedule?courseId=1
Authorization: Bearer <token>
```

#### Join Live Class
```http
POST /api/live-classes/1/join
Authorization: Bearer <token>
```

### 6. Doubt Resolution

#### Post a Doubt
```http
POST /api/doubts
Authorization: Bearer <token>
Content-Type: application/json

{
    "courseId": 1,
    "lessonId": 1,
    "question": "Why is acceleration constant in free fall?",
    "attachments": ["http://example.com/image.jpg"]
}
```

#### Answer a Doubt (Educator Only)
```http
POST /api/doubts/1/answer
Authorization: Bearer <educator_token>
Content-Type: application/json

{
    "answer": "Acceleration is constant in free fall because gravity is constant near the Earth's surface."
}
```

### 7. Subscription Management

#### Get Subscription Plans
```http
GET /api/subscriptions/plans
```

#### Purchase Subscription
```http
POST /api/subscriptions/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
    "planId": 1,
    "paymentMethod": "credit_card",
    "couponCode": "DISCOUNT10"
}
```

### 8. Search & Discovery

#### Global Search
```http
GET /api/search?q=physics
Authorization: Bearer <token>
```

#### Browse Educators
```http
GET /api/educators?subject=Physics&rating=4.5
Authorization: Bearer <token>
```

### 9. Reviews & Ratings

#### Post Course Review
```http
POST /api/reviews/courses/1/review
Authorization: Bearer <token>
Content-Type: application/json

{
    "rating": 5,
    "title": "Excellent course!",
    "comment": "The explanations are very clear and the practice questions are helpful."
}
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with configurable expiration
- Role-based access control (learner/educator)
- Password hashing using bcryptjs
- Token refresh mechanism

### Input Validation & Sanitization
- Comprehensive input validation using express-validator
- SQL injection prevention through parameterized queries
- XSS protection with Helmet middleware
- Rate limiting to prevent abuse

### Content Access Control
- Enrollment verification for course content
- Subscription-based access control
- Video URL security (signed URLs recommended for production)
- Download tracking for study materials

## 📊 Error Handling

The API implements comprehensive error handling with appropriate HTTP status codes:

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource not found)
- **409** - Conflict (already enrolled, duplicate resource)
- **422** - Unprocessable Entity (validation errors)
- **429** - Too Many Requests (rate limit exceeded)
- **500** - Internal Server Error

### Error Response Format
```json
{
    "success": false,
    "message": "Error description",
    "errors": [
        {
            "field": "email",
            "message": "Invalid email format"
        }
    ]
}
```

## 🧪 Testing

### Test Files Available
- `app.http` - Complete HTTP test suite for VS Code
- `test-*.js` - Various test scripts for different functionalities
- `comprehensive-test.js` - End-to-end API testing

### Running Tests
```bash
# Test all APIs using the HTTP file
# Open app.http in VS Code and use the REST Client extension

# Or run individual test scripts
node test-auth.js
node test-courses.js
node test-comprehensive.js
```

### Sample Test Data
The database is seeded with:
- 10 sample users (learners)
- 5 educators with profiles
- 15 courses across different exams
- 50+ lessons with video content
- 20+ test questions
- Sample enrollments and progress data

## 🚀 Deployment

### Environment Variables
Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_PATH=./database/online_learning.db

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure proper CORS origins
3. Use a production database (PostgreSQL/MySQL)
4. Set up proper logging and monitoring
5. Configure SSL/TLS certificates
6. Set up rate limiting and security headers

## 📈 Performance & Analytics

### Learning Analytics
- Video watch progress tracking
- Test performance analytics
- Subject-wise performance breakdown
- Learning streak tracking
- Course completion rates

### Performance Optimizations
- Database indexing on frequently queried fields
- Efficient query optimization
- Response caching for static content
- Pagination for large datasets

## 🔧 Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run migrate    # Run database migrations
npm run seed       # Seed database with sample data
```

### Code Style
- Consistent error handling patterns
- Input validation on all endpoints
- Proper HTTP status codes
- Comprehensive logging
- Security best practices

## 📝 Assumptions Made

1. **Content Delivery**: Video URLs are assumed to be external (YouTube, Vimeo, etc.)
2. **File Storage**: Study materials are stored externally with download URLs
3. **Payment Processing**: Payment gateway integration is not implemented (mock responses)
4. **Real-time Features**: Live class streaming uses external services
5. **Email Notifications**: Email service integration not implemented
6. **Mobile App**: API designed to work with mobile applications
7. **Scalability**: Database designed to handle thousands of concurrent users

## 🎯 Bonus Features Implemented

- **Comprehensive Progress Tracking**: Detailed video watch progress with timestamps
- **Advanced Test Analytics**: Subject-wise performance analysis with percentiles
- **Subscription Tiers**: Plus and Iconic plans with different access levels
- **Doubt Resolution System**: Complete Q&A system for student-teacher interaction
- **Study Material Management**: Resource tracking with download analytics
- **Global Search**: Cross-entity search functionality
- **Review System**: Course and educator rating system
- **Live Class Management**: Scheduling and attendance tracking
- **Performance Analytics**: Detailed learning insights and progress tracking


## 🎓Outcomes

This project demonstrates:
- **Database design** with proper relationships and constraints
- **Authentication & authorization** with JWT tokens
- **Input validation** and error handling
- **Security best practices** implementation
- **Performance optimization** techniques
- **Comprehensive testing** strategies
- **API documentation** and developer experience

---


