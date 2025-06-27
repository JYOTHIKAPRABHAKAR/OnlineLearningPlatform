const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let learnerToken = null;
let educatorToken = null;

const testResults = {
    passed: 0,
    failed: 0,
    errors: []
};

function logTest(name, success, error = null) {
    if (success) {
        console.log(`✅ ${name} - PASSED`);
        testResults.passed++;
    } else {
        console.log(`❌ ${name} - FAILED`);
        testResults.failed++;
        if (error) {
            testResults.errors.push({ name, error });
        }
    }
}

// Utility function to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAPI(name, method, endpoint, data = null, headers = {}) {
    try {
        // Add delay to avoid rate limiting
        await delay(200);
        
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        
        if (response.status >= 200 && response.status < 300) {
            logTest(name, true);
            return response.data;
        } else {
            logTest(name, false, `HTTP ${response.status}: ${response.statusText}`);
            return null;
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        logTest(name, false, errorMessage);
        return null;
    }
}

async function runCoreTests() {
    console.log('🚀 Starting Core API Testing...\n');

    // Test 1: Health Check
    console.log('📋 1. Health Check');
    await testAPI('Health Check', 'GET', '/');

    // Test 2: Authentication
    console.log('\n📋 2. Authentication APIs');
    
    // Login with existing user
    const loginResponse = await testAPI('Login Learner', 'POST', '/api/auth/login', {
        email: 'john.doe@example.com',
        password: 'password123'
    });
    
    if (loginResponse?.data?.token) {
        learnerToken = loginResponse.data.token;
    }

    // Test 3: Core Course APIs
    console.log('\n📋 3. Core Course APIs');
    await testAPI('Browse Courses', 'GET', '/api/courses');
    await testAPI('Get Course Details', 'GET', '/api/courses/1');

    // Test 4: Core Lesson APIs (with auth)
    console.log('\n📋 4. Core Lesson APIs');
    if (learnerToken) {
        await testAPI('Get Lesson Details', 'GET', '/api/lessons/1', null, {
            'Authorization': `Bearer ${learnerToken}`
        });
        
        await testAPI('Update Lesson Progress', 'POST', '/api/lessons/1/progress', {
            watchedDuration: 1350,
            totalDuration: 2700,
            status: 'in_progress',
            timeSpent: 1350
        }, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }

    // Test 5: Core Educator APIs
    console.log('\n📋 5. Core Educator APIs');
    await testAPI('Browse Educators', 'GET', '/api/educators');
    await testAPI('Get Educator Profile', 'GET', '/api/educators/1');

    // Test 6: Core Subscription APIs
    console.log('\n📋 6. Core Subscription APIs');
    await testAPI('Get Subscription Plans', 'GET', '/api/subscriptions/plans');

    // Test 7: Core Doubt/Q&A APIs (with auth)
    console.log('\n📋 7. Core Doubt/Q&A APIs');
    if (learnerToken) {
        await testAPI('Post Doubt', 'POST', '/api/doubts', {
            courseId: 1,
            lessonId: 1,
            question: 'Why is acceleration constant in free fall?',
            attachments: ['image_url']
        }, {
            'Authorization': `Bearer ${learnerToken}`
        });
        
        await testAPI('Get My Doubts', 'GET', '/api/doubts/my', null, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }

    // Test 8: Core Review APIs
    console.log('\n📋 8. Core Review APIs');
    await testAPI('Get Course Reviews', 'GET', '/api/reviews/course/1');

    // Print final results
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
    
    if (testResults.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        testResults.errors.forEach(error => {
            console.log(`- ${error.name}: ${error.error}`);
        });
    }
    
    console.log('\n🎉 Core API Testing Complete!');
}

// Run the tests
runCoreTests().catch(console.error); 