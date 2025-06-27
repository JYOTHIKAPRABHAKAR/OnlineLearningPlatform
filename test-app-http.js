const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
let learnerToken = '';
let educatorToken = '';

// Test results storage
const testResults = {
    passed: [],
    failed: [],
    skipped: []
};

// Helper function to log results
const logResult = (testName, success, response = null, error = null) => {
    const result = {
        name: testName,
        success,
        status: response?.status,
        data: response?.data,
        error: error?.message || error
    };
    
    if (success) {
        testResults.passed.push(result);
        console.log(`✅ ${testName} - PASSED (${response?.status})`);
    } else {
        testResults.failed.push(result);
        console.log(`❌ ${testName} - FAILED: ${error?.message || error}`);
    }
};

// Helper function to check if response has valid data
const hasValidData = (data) => {
    if (!data) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === 'object') {
        // Check if object has meaningful properties
        const keys = Object.keys(data);
        return keys.length > 0 && keys.some(key => data[key] !== null && data[key] !== undefined);
    }
    return data !== null && data !== undefined;
};

// Test functions
const testHealthCheck = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/`);
        const success = response.status === 200 && response.data.success;
        logResult('Health Check', success, response);
        return success;
    } catch (error) {
        logResult('Health Check', false, null, error);
        return false;
    }
};

const testLearnerLogin = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'john.doe@example.com',
            password: 'password123'
        });
        
        const success = response.status === 200 && response.data.data?.token;
        if (success) {
            learnerToken = response.data.data.token;
        }
        logResult('Learner Login', success, response);
        return success;
    } catch (error) {
        logResult('Learner Login', false, null, error);
        return false;
    }
};

const testEducatorLogin = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'prof.kumar@example.com',
            password: 'password123'
        });
        
        const success = response.status === 200 && response.data.data?.token;
        if (success) {
            educatorToken = response.data.data.token;
        }
        logResult('Educator Login', success, response);
        return success;
    } catch (error) {
        logResult('Educator Login', false, null, error);
        return false;
    }
};

const testGetProfile = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Get Profile', reason: 'No learner token' });
        console.log('⏭️  Get Profile - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Profile', success, response);
        return success;
    } catch (error) {
        logResult('Get Profile', false, null, error);
        return false;
    }
};

const testBrowseCourses = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/courses`);
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Browse Courses', success, response);
        return success;
    } catch (error) {
        logResult('Browse Courses', false, null, error);
        return false;
    }
};

const testBrowseCoursesWithFilters = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/courses?exam=JEE&subject=Mathematics&sort=popular`);
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Browse Courses with Filters', success, response);
        return success;
    } catch (error) {
        logResult('Browse Courses with Filters', false, null, error);
        return false;
    }
};

const testGetCourseDetails = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/courses/1`);
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Course Details', success, response);
        return success;
    } catch (error) {
        logResult('Get Course Details', false, null, error);
        return false;
    }
};

const testEnrollInCourse = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Enroll in Course', reason: 'No learner token' });
        console.log('⏭️  Enroll in Course - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/courses/1/enroll`, {}, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Enroll in Course', success, response);
        return success;
    } catch (error) {
        logResult('Enroll in Course', false, null, error);
        return false;
    }
};

const testBrowseEducators = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/educators`);
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Browse Educators', success, response);
        return success;
    } catch (error) {
        logResult('Browse Educators', false, null, error);
        return false;
    }
};

const testBrowseEducatorsWithFilters = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/educators?subject=Physics&rating=4.5`);
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Browse Educators with Filters', success, response);
        return success;
    } catch (error) {
        logResult('Browse Educators with Filters', false, null, error);
        return false;
    }
};

const testGetEducatorProfile = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/educators/1`);
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Educator Profile', success, response);
        return success;
    } catch (error) {
        logResult('Get Educator Profile', false, null, error);
        return false;
    }
};

const testFollowEducator = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Follow Educator', reason: 'No learner token' });
        console.log('⏭️  Follow Educator - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/educators/1/follow`, {}, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Follow Educator', success, response);
        return success;
    } catch (error) {
        logResult('Follow Educator', false, null, error);
        return false;
    }
};

const testGetLessonDetails = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Get Lesson Details', reason: 'No learner token' });
        console.log('⏭️  Get Lesson Details - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/lessons/1`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Lesson Details', success, response);
        return success;
    } catch (error) {
        logResult('Get Lesson Details', false, null, error);
        return false;
    }
};

const testUpdateLessonProgress = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Update Lesson Progress', reason: 'No learner token' });
        console.log('⏭️  Update Lesson Progress - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/lessons/1/progress`, {
            watchedDuration: 1350,
            totalDuration: 2700,
            completed: false
        }, {
            headers: { 
                Authorization: `Bearer ${learnerToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Update Lesson Progress', success, response);
        return success;
    } catch (error) {
        logResult('Update Lesson Progress', false, null, error);
        return false;
    }
};

const testSaveLessonNotes = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Save Lesson Notes', reason: 'No learner token' });
        console.log('⏭️  Save Lesson Notes - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/lessons/1/notes`, {
            timestamp: 845,
            note: "Important formula: F = ma"
        }, {
            headers: { 
                Authorization: `Bearer ${learnerToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Save Lesson Notes', success, response);
        return success;
    } catch (error) {
        logResult('Save Lesson Notes', false, null, error);
        return false;
    }
};

const testGetTests = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Get Tests', reason: 'No learner token' });
        console.log('⏭️  Get Tests - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/tests`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Tests', success, response);
        return success;
    } catch (error) {
        logResult('Get Tests', false, null, error);
        return false;
    }
};

const testGetTestsWithFilters = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Get Tests with Filters', reason: 'No learner token' });
        console.log('⏭️  Get Tests with Filters - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/tests?courseId=1&type=mock`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Tests with Filters', success, response);
        return success;
    } catch (error) {
        logResult('Get Tests with Filters', false, null, error);
        return false;
    }
};

const testStartTest = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Start Test', reason: 'No learner token' });
        console.log('⏭️  Start Test - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/tests/1/start`, {}, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Start Test', success, response);
        return success;
    } catch (error) {
        logResult('Start Test', false, null, error);
        return false;
    }
};

const testSubmitTestAnswers = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Submit Test Answers', reason: 'No learner token' });
        console.log('⏭️  Submit Test Answers - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/tests/session_001/submit`, {
            answers: [
                { questionId: 1, selectedOption: 2 }
            ],
            timeSpent: 9500
        }, {
            headers: { 
                Authorization: `Bearer ${learnerToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Submit Test Answers', success, response);
        return success;
    } catch (error) {
        logResult('Submit Test Answers', false, null, error);
        return false;
    }
};

const testGetLiveClassSchedule = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Get Live Class Schedule', reason: 'No learner token' });
        console.log('⏭️  Get Live Class Schedule - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/live-classes/schedule`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Live Class Schedule', success, response);
        return success;
    } catch (error) {
        logResult('Get Live Class Schedule', false, null, error);
        return false;
    }
};

const testGetLiveClassScheduleWithFilters = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Get Live Class Schedule with Filters', reason: 'No learner token' });
        console.log('⏭️  Get Live Class Schedule with Filters - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/live-classes/schedule?courseId=2&upcoming=true`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Live Class Schedule with Filters', success, response);
        return success;
    } catch (error) {
        logResult('Get Live Class Schedule with Filters', false, null, error);
        return false;
    }
};

const testJoinLiveClass = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Join Live Class', reason: 'No learner token' });
        console.log('⏭️  Join Live Class - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/live-classes/1/join`, {}, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Join Live Class', success, response);
        return success;
    } catch (error) {
        logResult('Join Live Class', false, null, error);
        return false;
    }
};

const testAskLiveClassQuestion = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Ask Live Class Question', reason: 'No learner token' });
        console.log('⏭️  Ask Live Class Question - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/live-classes/1/questions`, {
            question: "Can you explain this formula again?",
            timestamp: 1520
        }, {
            headers: { 
                Authorization: `Bearer ${learnerToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Ask Live Class Question', success, response);
        return success;
    } catch (error) {
        logResult('Ask Live Class Question', false, null, error);
        return false;
    }
};

const testGetProgressDashboard = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Get Progress Dashboard', reason: 'No learner token' });
        console.log('⏭️  Get Progress Dashboard - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/progress/dashboard`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Progress Dashboard', success, response);
        return success;
    } catch (error) {
        logResult('Get Progress Dashboard', false, null, error);
        return false;
    }
};

const testGetCourseProgress = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Get Course Progress', reason: 'No learner token' });
        console.log('⏭️  Get Course Progress - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/progress/course/1`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Course Progress', success, response);
        return success;
    } catch (error) {
        logResult('Get Course Progress', false, null, error);
        return false;
    }
};

const testGetSubscriptionPlans = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/subscriptions/plans`);
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Subscription Plans', success, response);
        return success;
    } catch (error) {
        logResult('Get Subscription Plans', false, null, error);
        return false;
    }
};

const testPurchaseSubscription = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Purchase Subscription', reason: 'No learner token' });
        console.log('⏭️  Purchase Subscription - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/subscriptions/purchase`, {
            planId: 1,
            paymentMethod: "card"
        }, {
            headers: { 
                Authorization: `Bearer ${learnerToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Purchase Subscription', success, response);
        return success;
    } catch (error) {
        logResult('Purchase Subscription', false, null, error);
        return false;
    }
};

const testPostDoubt = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Post Doubt', reason: 'No learner token' });
        console.log('⏭️  Post Doubt - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/doubts`, {
            courseId: 1,
            lessonId: 1,
            question: "Why is acceleration constant in free fall?",
            attachments: ["image_url"]
        }, {
            headers: { 
                Authorization: `Bearer ${learnerToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Post Doubt', success, response);
        return success;
    } catch (error) {
        logResult('Post Doubt', false, null, error);
        return false;
    }
};

const testGetMyDoubts = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Get My Doubts', reason: 'No learner token' });
        console.log('⏭️  Get My Doubts - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/doubts/my`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get My Doubts', success, response);
        return success;
    } catch (error) {
        logResult('Get My Doubts', false, null, error);
        return false;
    }
};

const testAnswerDoubt = async () => {
    if (!educatorToken) {
        testResults.skipped.push({ name: 'Answer Doubt', reason: 'No educator token' });
        console.log('⏭️  Answer Doubt - SKIPPED (No educator token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/doubts/1/answer`, {
            answer: "Acceleration is constant because gravity provides a constant force."
        }, {
            headers: { 
                Authorization: `Bearer ${educatorToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Answer Doubt', success, response);
        return success;
    } catch (error) {
        logResult('Answer Doubt', false, null, error);
        return false;
    }
};

const testGetCourseMaterials = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Get Course Materials', reason: 'No learner token' });
        console.log('⏭️  Get Course Materials - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/materials/course/1`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Course Materials', success, response);
        return success;
    } catch (error) {
        logResult('Get Course Materials', false, null, error);
        return false;
    }
};

const testTrackMaterialDownload = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Track Material Download', reason: 'No learner token' });
        console.log('⏭️  Track Material Download - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/materials/1/download`, {}, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Track Material Download', success, response);
        return success;
    } catch (error) {
        logResult('Track Material Download', false, null, error);
        return false;
    }
};

const testGlobalSearch = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/search?q=physics`);
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Global Search', success, response);
        return success;
    } catch (error) {
        logResult('Global Search', false, null, error);
        return false;
    }
};

const testSearchWithTypeFilter = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/search?q=physics&type=course`);
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Search with Type Filter', success, response);
        return success;
    } catch (error) {
        logResult('Search with Type Filter', false, null, error);
        return false;
    }
};

const testGetCourseReviews = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/reviews/course/1`);
        const success = response.status === 200 && hasValidData(response.data.data);
        logResult('Get Course Reviews', success, response);
        return success;
    } catch (error) {
        logResult('Get Course Reviews', false, null, error);
        return false;
    }
};

const testReviewCourse = async () => {
    if (!learnerToken) {
        testResults.skipped.push({ name: 'Review Course', reason: 'No learner token' });
        console.log('⏭️  Review Course - SKIPPED (No token)');
        return false;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/reviews/course`, {
            rating: 4,
            title: "Great Course",
            comment: "Excellent course with detailed explanations"
        }, {
            headers: { 
                Authorization: `Bearer ${learnerToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const success = response.status === 200 || response.status === 201;
        logResult('Review Course', success, response);
        return success;
    } catch (error) {
        logResult('Review Course', false, null, error);
        return false;
    }
};

// Error testing functions
const testInvalidEmailRegistration = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, {
            email: "invalid-email",
            password: "TestPass123",
            firstName: "Test",
            lastName: "User"
        });
        
        // This should fail with 400
        logResult('Invalid Email Registration', false, response, 'Expected 400 but got success');
        return false;
    } catch (error) {
        const success = error.response?.status === 400;
        logResult('Invalid Email Registration', success, error.response, error);
        return success;
    }
};

const testMissingTokenAccess = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/auth/profile`);
        
        // This should fail with 401
        logResult('Missing Token Access', false, response, 'Expected 401 but got success');
        return false;
    } catch (error) {
        const success = error.response?.status === 401;
        logResult('Missing Token Access', success, error.response, error);
        return success;
    }
};

const testInvalidCourseId = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/courses/999999`);
        
        // This should fail with 404
        logResult('Invalid Course ID', false, response, 'Expected 404 but got success');
        return false;
    } catch (error) {
        const success = error.response?.status === 404;
        logResult('Invalid Course ID', success, error.response, error);
        return success;
    }
};

const testUnauthorizedAccess = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/api/courses/1/enroll`);
        
        // This should fail with 401
        logResult('Unauthorized Access', false, response, 'Expected 401 but got success');
        return false;
    } catch (error) {
        const success = error.response?.status === 401;
        logResult('Unauthorized Access', success, error.response, error);
        return success;
    }
};

// Main test runner
const runAllTests = async () => {
    console.log('🚀 Starting comprehensive API tests...\n');
    
    // Health check first
    await testHealthCheck();
    
    // Authentication tests
    console.log('\n🔐 Testing Authentication...');
    await testLearnerLogin();
    await testEducatorLogin();
    await testGetProfile();
    
    // Course tests
    console.log('\n📚 Testing Courses...');
    await testBrowseCourses();
    await testBrowseCoursesWithFilters();
    await testGetCourseDetails();
    await testEnrollInCourse();
    
    // Educator tests
    console.log('\n👨‍🏫 Testing Educators...');
    await testBrowseEducators();
    await testBrowseEducatorsWithFilters();
    await testGetEducatorProfile();
    await testFollowEducator();
    
    // Lesson tests
    console.log('\n📖 Testing Lessons...');
    await testGetLessonDetails();
    await testUpdateLessonProgress();
    await testSaveLessonNotes();
    
    // Test tests
    console.log('\n🧪 Testing Tests...');
    await testGetTests();
    await testGetTestsWithFilters();
    await testStartTest();
    await testSubmitTestAnswers();
    
    // Live class tests
    console.log('\n📺 Testing Live Classes...');
    await testGetLiveClassSchedule();
    await testGetLiveClassScheduleWithFilters();
    await testJoinLiveClass();
    await testAskLiveClassQuestion();
    
    // Progress tests
    console.log('\n📊 Testing Progress...');
    await testGetProgressDashboard();
    await testGetCourseProgress();
    
    // Subscription tests
    console.log('\n💳 Testing Subscriptions...');
    await testGetSubscriptionPlans();
    await testPurchaseSubscription();
    
    // Doubts tests
    console.log('\n❓ Testing Doubts...');
    await testPostDoubt();
    await testGetMyDoubts();
    await testAnswerDoubt();
    
    // Materials tests
    console.log('\n📚 Testing Materials...');
    await testGetCourseMaterials();
    await testTrackMaterialDownload();
    
    // Search tests
    console.log('\n🔍 Testing Search...');
    await testGlobalSearch();
    await testSearchWithTypeFilter();
    
    // Reviews tests
    console.log('\n⭐ Testing Reviews...');
    await testGetCourseReviews();
    await testReviewCourse();
    
    // Error testing
    console.log('\n⚠️  Testing Error Handling...');
    await testInvalidEmailRegistration();
    await testMissingTokenAccess();
    await testInvalidCourseId();
    await testUnauthorizedAccess();
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⏭️  Skipped: ${testResults.skipped.length}`);
    
    if (testResults.failed.length > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.failed.forEach(test => {
            console.log(`  - ${test.name}: ${test.error}`);
        });
    }
    
    if (testResults.skipped.length > 0) {
        console.log('\n⏭️  Skipped Tests:');
        testResults.skipped.forEach(test => {
            console.log(`  - ${test.name}: ${test.reason}`);
        });
    }
    
    return testResults;
};

// Run tests
runAllTests().catch(console.error); 