# Postman Collection Setup Guide

## 📋 Overview

This guide will help you set up and use the Postman collection for testing the Online Learning Platform API.

## 🚀 Quick Setup

### 1. Import Collection and Environment

1. **Import the Collection:**
   - Open Postman
   - Click "Import" button
   - Select `Online_Learning_Platform_API.postman_collection.json`

2. **Import the Environment:**
   - Click "Import" button again
   - Select `Online_Learning_Platform_Environment.postman_environment.json`
   - Select the "Online Learning Platform - Local" environment from the dropdown

### 2. Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000`

## 🔐 Authentication Flow

### Step 1: Get Authentication Tokens

1. **Login as Learner:**
   - Run "Login Learner (Seeded)" request
   - This will automatically save the token to `{{learnerToken}}`

2. **Login as Educator:**
   - Run "Login Educator (Seeded)" request  
   - This will automatically save the token to `{{educatorToken}}`

### Step 2: Use Authenticated Endpoints

Once you have tokens, you can use any endpoint that requires authentication. The tokens are automatically included in the Authorization header.

## 📚 Collection Structure

### 🏥 Health Check
- **Health Check**: Verify server is running

### 🔐 Authentication
- **Register New Learner/Educator**: Create new accounts
- **Login (Seeded)**: Use pre-existing test accounts
- **Get Profile**: Test authenticated access

### 📚 Courses
- **Browse All Courses**: Get all available courses
- **Browse with Filters**: Filter by exam, subject, etc.
- **Get Course Details**: Get specific course information
- **Enroll in Course**: Enroll in a course (requires auth)

### 👨‍🏫 Educators
- **Browse All Educators**: Get all educators
- **Browse with Filters**: Filter by subject, rating
- **Get Educator Profile**: Get specific educator details
- **Follow Educator**: Follow an educator (requires auth)

### 📖 Lessons
- **Get Lesson Details**: Get lesson information (requires auth)
- **Update Progress**: Track learning progress (requires auth)
- **Save Notes**: Add notes to lessons (requires auth)

### 🧪 Tests
- **Get Available Tests**: Browse tests (requires auth)
- **Start Test**: Begin a test session (requires auth)
- **Submit Answers**: Submit test answers (requires auth)

### 📺 Live Classes
- **Get Schedule**: View live class schedule (requires auth)
- **Join Class**: Join a live class (requires auth)
- **Ask Questions**: Ask questions during class (requires auth)

### 📊 Progress & Analytics
- **Get Dashboard**: View learning dashboard (requires auth)
- **Get Course Progress**: Track course completion (requires auth)

### 💳 Subscriptions
- **Get Plans**: View subscription plans
- **Purchase**: Buy a subscription (requires auth)

### ❓ Doubts & Q&A
- **Post Doubt**: Ask a question (requires auth)
- **Get My Doubts**: View your questions (requires auth)
- **Answer Doubt**: Answer questions (requires educator auth)

### 📚 Study Materials
- **Get Materials**: Access course materials (requires auth)
- **Track Download**: Log material downloads (requires auth)

### 🔍 Search
- **Global Search**: Search across all content
- **Search with Filters**: Filter search results

### ⭐ Reviews
- **Get Reviews**: View course reviews
- **Add Review**: Review a course (requires auth)

### ⚠️ Error Handling Tests
- **Invalid Email**: Test validation errors
- **Missing Token**: Test authentication errors
- **Invalid Course ID**: Test not found errors
- **Unauthorized Access**: Test permission errors

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:3000` |
| `learnerToken` | JWT token for learner | Auto-populated after login |
| `educatorToken` | JWT token for educator | Auto-populated after login |
| `adminToken` | JWT token for admin | Manual setup if needed |

## 🧪 Testing Workflow

### 1. Health Check
```bash
GET {{baseUrl}}/
```

### 2. Authentication
```bash
# Login as learner
POST {{baseUrl}}/api/auth/login
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

### 3. Browse Content
```bash
# Get all courses
GET {{baseUrl}}/api/courses

# Get all educators
GET {{baseUrl}}/api/educators
```

### 4. Authenticated Actions
```bash
# Enroll in course
POST {{baseUrl}}/api/courses/1/enroll
Authorization: Bearer {{learnerToken}}

# Get lesson details
GET {{baseUrl}}/api/lessons/1
Authorization: Bearer {{learnerToken}}
```

## 🐛 Troubleshooting

### Common Issues

1. **Server Not Running**
   - Ensure `npm start` is running
   - Check if port 3000 is available

2. **Authentication Errors**
   - Run login requests first
   - Check if tokens are saved in environment
   - Verify token format: `Bearer <token>`

3. **404 Errors**
   - Check endpoint paths in collection
   - Verify server routes are loaded
   - Check server logs for errors

4. **Validation Errors**
   - Check request body format
   - Verify required fields are included
   - Check data types (strings, numbers, etc.)

### Debug Steps

1. **Check Server Logs**
   ```bash
   npm start
   # Look for error messages in console
   ```

2. **Verify Database**
   ```bash
   # Check if database is seeded
   npm run seed
   ```

3. **Test Individual Endpoints**
   - Use the health check first
   - Test authentication endpoints
   - Gradually test other endpoints

## 📊 Test Data

### Seeded Users

**Learners:**
- `john.doe@example.com` / `password123`
- `jane.smith@example.com` / `password123`

**Educators:**
- `prof.kumar@example.com` / `password123`
- `dr.sharma@example.com` / `password123`

### Seeded Content

- **Courses**: 3 courses (Mathematics, Physics, Chemistry)
- **Educators**: 2 educators with profiles
- **Lessons**: Multiple lessons per course
- **Tests**: Sample test with questions

## 🔄 API Status

Based on our testing, here's the current status:

### ✅ Working Endpoints
- Health check
- Authentication (login/register)
- Course browsing
- Educator browsing
- Lesson access (with auth)
- Test management (with auth)
- Live class schedule (with auth)

### ⚠️ Partially Working
- Progress tracking (some endpoints missing)
- Subscription management (database issues)
- Doubts system (database issues)
- Reviews system (database issues)
- Search functionality (route missing)

### 🔧 Needs Fixing
- Missing database tables
- Some route implementations
- Error handling improvements

## 📝 Notes

- All authentication tokens are automatically managed by Postman
- The collection includes both working and non-working endpoints for testing
- Error handling tests demonstrate proper API behavior
- Use the environment variables for easy switching between different setups

## 🆘 Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify the database is properly seeded
3. Ensure all dependencies are installed
4. Check the API_TEST_REPORT.md for detailed status information 