const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
let learnerToken = '';
let educatorToken = '';

// Helper function to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to log results
const logResult = (testName, success, response = null, error = null) => {
    if (success) {
        console.log(`✅ ${testName} - PASSED (${response?.status})`);
        if (response?.data?.data) {
            const data = response.data.data;
            if (Array.isArray(data)) {
                console.log(`   Data: Array with ${data.length} items`);
            } else if (typeof data === 'object') {
                const keys = Object.keys(data);
                console.log(`   Data: Object with keys: ${keys.join(', ')}`);
            }
        }
    } else {
        console.log(`❌ ${testName} - FAILED: ${error?.message || error}`);
    }
    return { name: testName, success, response, error };
};

// Test functions
const testHealthCheck = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/`);
        const success = response.status === 200 && response.data.success;
        return logResult('Health Check', success, response);
    } catch (error) {
        return logResult('Health Check', false, null, error);
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
            console.log(`   Token: ${learnerToken.substring(0, 20)}...`);
        }
        return logResult('Learner Login', success, response);
    } catch (error) {
        return logResult('Learner Login', false, null, error);
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
            console.log(`   Token: ${educatorToken.substring(0, 20)}...`);
        }
        return logResult('Educator Login', success, response);
    } catch (error) {
        return logResult('Educator Login', false, null, error);
    }
};

const testGetProfile = async () => {
    if (!learnerToken) {
        console.log('⏭️  Get Profile - SKIPPED (No token)');
        return { name: 'Get Profile', success: false, skipped: true };
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && response.data.data;
        return logResult('Get Profile', success, response);
    } catch (error) {
        return logResult('Get Profile', false, null, error);
    }
};

const testBrowseCourses = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/courses`);
        const success = response.status === 200 && response.data.data?.courses;
        return logResult('Browse Courses', success, response);
    } catch (error) {
        return logResult('Browse Courses', false, null, error);
    }
};

const testBrowseCoursesWithFilters = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/courses?exam=JEE&subject=Mathematics&sort=popular`);
        const success = response.status === 200 && response.data.data?.courses;
        return logResult('Browse Courses with Filters', success, response);
    } catch (error) {
        return logResult('Browse Courses with Filters', false, null, error);
    }
};

const testGetCourseDetails = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/courses/1`);
        const success = response.status === 200 && response.data.data;
        return logResult('Get Course Details', success, response);
    } catch (error) {
        return logResult('Get Course Details', false, null, error);
    }
};

const testBrowseEducators = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/educators`);
        const success = response.status === 200 && response.data.data;
        return logResult('Browse Educators', success, response);
    } catch (error) {
        return logResult('Browse Educators', false, null, error);
    }
};

const testBrowseEducatorsWithFilters = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/educators?subject=Physics&rating=4.5`);
        const success = response.status === 200 && response.data.data;
        return logResult('Browse Educators with Filters', success, response);
    } catch (error) {
        return logResult('Browse Educators with Filters', false, null, error);
    }
};

const testGetEducatorProfile = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/educators/1`);
        const success = response.status === 200 && response.data.data;
        return logResult('Get Educator Profile', success, response);
    } catch (error) {
        return logResult('Get Educator Profile', false, null, error);
    }
};

const testEnrollInCourse = async () => {
    if (!learnerToken) {
        console.log('⏭️  Enroll in Course - SKIPPED (No token)');
        return { name: 'Enroll in Course', success: false, skipped: true };
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/courses/1/enroll`, {}, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 || response.status === 201;
        return logResult('Enroll in Course', success, response);
    } catch (error) {
        return logResult('Enroll in Course', false, null, error);
    }
};

const testGetLessonDetails = async () => {
    if (!learnerToken) {
        console.log('⏭️  Get Lesson Details - SKIPPED (No token)');
        return { name: 'Get Lesson Details', success: false, skipped: true };
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/lessons/1`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && response.data.data;
        return logResult('Get Lesson Details', success, response);
    } catch (error) {
        return logResult('Get Lesson Details', false, null, error);
    }
};

const testUpdateLessonProgress = async () => {
    if (!learnerToken) {
        console.log('⏭️  Update Lesson Progress - SKIPPED (No token)');
        return { name: 'Update Lesson Progress', success: false, skipped: true };
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
        return logResult('Update Lesson Progress', success, response);
    } catch (error) {
        return logResult('Update Lesson Progress', false, null, error);
    }
};

const testSaveLessonNotes = async () => {
    if (!learnerToken) {
        console.log('⏭️  Save Lesson Notes - SKIPPED (No token)');
        return { name: 'Save Lesson Notes', success: false, skipped: true };
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
        return logResult('Save Lesson Notes', success, response);
    } catch (error) {
        return logResult('Save Lesson Notes', false, null, error);
    }
};

const testGetTests = async () => {
    if (!learnerToken) {
        console.log('⏭️  Get Tests - SKIPPED (No token)');
        return { name: 'Get Tests', success: false, skipped: true };
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/tests`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && response.data.data;
        return logResult('Get Tests', success, response);
    } catch (error) {
        return logResult('Get Tests', false, null, error);
    }
};

const testGetTestsWithFilters = async () => {
    if (!learnerToken) {
        console.log('⏭️  Get Tests with Filters - SKIPPED (No token)');
        return { name: 'Get Tests with Filters', success: false, skipped: true };
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/tests?courseId=1&type=mock`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && response.data.data;
        return logResult('Get Tests with Filters', success, response);
    } catch (error) {
        return logResult('Get Tests with Filters', false, null, error);
    }
};

const testStartTest = async () => {
    if (!learnerToken) {
        console.log('⏭️  Start Test - SKIPPED (No token)');
        return { name: 'Start Test', success: false, skipped: true };
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/tests/1/start`, {}, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 || response.status === 201;
        return logResult('Start Test', success, response);
    } catch (error) {
        return logResult('Start Test', false, null, error);
    }
};

const testGetLiveClassSchedule = async () => {
    if (!learnerToken) {
        console.log('⏭️  Get Live Class Schedule - SKIPPED (No token)');
        return { name: 'Get Live Class Schedule', success: false, skipped: true };
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/live-classes/schedule`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && response.data.data;
        return logResult('Get Live Class Schedule', success, response);
    } catch (error) {
        return logResult('Get Live Class Schedule', false, null, error);
    }
};

const testGetLiveClassScheduleWithFilters = async () => {
    if (!learnerToken) {
        console.log('⏭️  Get Live Class Schedule with Filters - SKIPPED (No token)');
        return { name: 'Get Live Class Schedule with Filters', success: false, skipped: true };
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/api/live-classes/schedule?courseId=2&upcoming=true`, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 && response.data.data;
        return logResult('Get Live Class Schedule with Filters', success, response);
    } catch (error) {
        return logResult('Get Live Class Schedule with Filters', false, null, error);
    }
};

const testJoinLiveClass = async () => {
    if (!learnerToken) {
        console.log('⏭️  Join Live Class - SKIPPED (No token)');
        return { name: 'Join Live Class', success: false, skipped: true };
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/api/live-classes/1/join`, {}, {
            headers: { Authorization: `Bearer ${learnerToken}` }
        });
        
        const success = response.status === 200 || response.status === 201;
        return logResult('Join Live Class', success, response);
    } catch (error) {
        return logResult('Join Live Class', false, null, error);
    }
};

const testAskLiveClassQuestion = async () => {
    if (!learnerToken) {
        console.log('⏭️  Ask Live Class Question - SKIPPED (No token)');
        return { name: 'Ask Live Class Question', success: false, skipped: true };
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
        return logResult('Ask Live Class Question', success, response);
    } catch (error) {
        return logResult('Ask Live Class Question', false, null, error);
    }
};

const testGetSubscriptionPlans = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/subscriptions/plans`);
        const success = response.status === 200 && response.data.data;
        return logResult('Get Subscription Plans', success, response);
    } catch (error) {
        return logResult('Get Subscription Plans', false, null, error);
    }
};

const testGetCourseReviews = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/reviews/course/1`);
        const success = response.status === 200 && response.data.data;
        return logResult('Get Course Reviews', success, response);
    } catch (error) {
        return logResult('Get Course Reviews', false, null, error);
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
        return logResult('Invalid Email Registration', false, response, 'Expected 400 but got success');
    } catch (error) {
        const success = error.response?.status === 400;
        return logResult('Invalid Email Registration', success, error.response, error);
    }
};

const testMissingTokenAccess = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/auth/profile`);
        
        // This should fail with 401
        return logResult('Missing Token Access', false, response, 'Expected 401 but got success');
    } catch (error) {
        const success = error.response?.status === 401;
        return logResult('Missing Token Access', success, error.response, error);
    }
};

const testInvalidCourseId = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/courses/999999`);
        
        // This should fail with 404
        return logResult('Invalid Course ID', false, response, 'Expected 404 but got success');
    } catch (error) {
        const success = error.response?.status === 404;
        return logResult('Invalid Course ID', success, error.response, error);
    }
};

const testUnauthorizedAccess = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/api/courses/1/enroll`);
        
        // This should fail with 401
        return logResult('Unauthorized Access', false, response, 'Expected 401 but got success');
    } catch (error) {
        const success = error.response?.status === 401;
        return logResult('Unauthorized Access', success, error.response, error);
    }
};

// Main test runner
const runWorkingEndpointTests = async () => {
    console.log('🚀 Testing working endpoints for Postman collection...\n');
    
    const results = [];
    
    // Health check first
    console.log('🏥 Testing Health Check...');
    results.push(await testHealthCheck());
    await delay(200);
    
    // Authentication tests
    console.log('\n🔐 Testing Authentication...');
    results.push(await testLearnerLogin());
    await delay(200);
    results.push(await testEducatorLogin());
    await delay(200);
    results.push(await testGetProfile());
    await delay(200);
    
    // Course tests
    console.log('\n📚 Testing Courses...');
    results.push(await testBrowseCourses());
    await delay(200);
    results.push(await testBrowseCoursesWithFilters());
    await delay(200);
    results.push(await testGetCourseDetails());
    await delay(200);
    results.push(await testEnrollInCourse());
    await delay(200);
    
    // Educator tests
    console.log('\n👨‍🏫 Testing Educators...');
    results.push(await testBrowseEducators());
    await delay(200);
    results.push(await testBrowseEducatorsWithFilters());
    await delay(200);
    results.push(await testGetEducatorProfile());
    await delay(200);
    
    // Lesson tests
    console.log('\n📖 Testing Lessons...');
    results.push(await testGetLessonDetails());
    await delay(200);
    results.push(await testUpdateLessonProgress());
    await delay(200);
    results.push(await testSaveLessonNotes());
    await delay(200);
    
    // Test tests
    console.log('\n🧪 Testing Tests...');
    results.push(await testGetTests());
    await delay(200);
    results.push(await testGetTestsWithFilters());
    await delay(200);
    results.push(await testStartTest());
    await delay(200);
    
    // Live class tests
    console.log('\n📺 Testing Live Classes...');
    results.push(await testGetLiveClassSchedule());
    await delay(200);
    results.push(await testGetLiveClassScheduleWithFilters());
    await delay(200);
    results.push(await testJoinLiveClass());
    await delay(200);
    results.push(await testAskLiveClassQuestion());
    await delay(200);
    
    // Subscription tests
    console.log('\n💳 Testing Subscriptions...');
    results.push(await testGetSubscriptionPlans());
    await delay(200);
    
    // Reviews tests
    console.log('\n⭐ Testing Reviews...');
    results.push(await testGetCourseReviews());
    await delay(200);
    
    // Error testing
    console.log('\n⚠️  Testing Error Handling...');
    results.push(await testInvalidEmailRegistration());
    await delay(200);
    results.push(await testMissingTokenAccess());
    await delay(200);
    results.push(await testInvalidCourseId());
    await delay(200);
    results.push(await testUnauthorizedAccess());
    await delay(200);
    
    // Summary
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;
    
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    
    console.log('\n✅ Working Endpoints for Postman Collection:');
    results.filter(r => r.success).forEach(test => {
        console.log(`  - ${test.name}`);
    });
    
    console.log('\n❌ Non-working Endpoints:');
    results.filter(r => !r.success && !r.skipped).forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
    });
    
    return results;
};

// Run tests
runWorkingEndpointTests().catch(console.error); 