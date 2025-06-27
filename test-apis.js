const http = require('http');
const axios = require('axios');
const assert = require('assert');

const baseUrl = 'http://localhost:3000';
const API = 'http://localhost:3000/api';

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        data: parsed,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: responseData,
                        success: res.statusCode >= 200 && res.statusCode < 300
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Utility to print test results
function printResult(name, passed, error) {
    if (passed) {
        console.log(`\x1b[32m✔\x1b[0m ${name}`);
    } else {
        console.error(`\x1b[31m✖\x1b[0m ${name}: ${error}`);
    }
}

// Utility to check JWT format
function isJWT(token) {
    return typeof token === 'string' && token.split('.').length === 3;
}

// Comprehensive API contract test script for online learning platform
async function runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive API Tests...\n');
    
    let learner = {}, educator = {}, course = {}, lesson = {}, test = {}, subscription = {}, liveClass = {}, material = {}, review = {}, testSession = {};
    let learnerToken, educatorToken, learnerId, educatorId, courseId, lessonId, testId, liveClassId, materialId, reviewId, testSessionId;
    let testResults = { passed: 0, failed: 0 };

    // 1. Register Learner
    try {
        const timestamp = Date.now();
        const res = await axios.post(`${API}/auth/register`, {
            name: 'Test User',
            email: `testuser_${timestamp}@example.com`,
            password: 'TestPass123',
            mobile: '+919999999999',
            targetExam: 'JEE',
            preferredLanguage: 'English'
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.userId);
        assert.ok(isJWT(res.data.token));
        learnerToken = res.data.token;
        learnerId = res.data.userId;
        printResult('POST /auth/register (learner)', true);
        testResults.passed++;
    } catch (e) {
        printResult('POST /auth/register (learner)', false, e.response?.data?.message || e.message);
        testResults.failed++;
        return; // Stop if registration fails
    }

    // 2. Register Educator
    try {
        const timestamp = Date.now();
        const res = await axios.post(`${API}/auth/educator/register`, {
            name: 'Test Educator',
            email: `testeducator_${timestamp}@example.com`,
            password: 'TestPass123',
            mobile: '+919888888888',
            subjects: ['Physics'],
            qualification: 'PhD in Physics',
            experience: 5,
            bio: 'Test educator bio'
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.userId);
        assert.ok(isJWT(res.data.token));
        educatorToken = res.data.token;
        educatorId = res.data.userId;
        printResult('POST /auth/educator/register', true);
        testResults.passed++;
    } catch (e) {
        printResult('POST /auth/educator/register', false, e.response?.data?.message || e.message);
        testResults.failed++;
    }

    // 3. Login Learner
    try {
        const res = await axios.post(`${API}/auth/login`, {
            email: 'john.doe@example.com',
            password: 'password123'
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(isJWT(res.data.token));
        learnerToken = res.data.token;
        printResult('POST /auth/login (learner)', true);
        testResults.passed++;
    } catch (e) {
        printResult('POST /auth/login (learner)', false, e.response?.data?.message || e.message);
        testResults.failed++;
    }

    // 4. Login Educator
    try {
        const res = await axios.post(`${API}/auth/login`, {
            email: 'jane.smith@example.com',
            password: 'password123'
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(isJWT(res.data.token));
        educatorToken = res.data.token;
        printResult('POST /auth/login (educator)', true);
        testResults.passed++;
    } catch (e) {
        printResult('POST /auth/login (educator)', false, e.response?.data?.message || e.message);
        testResults.failed++;
    }

    // 5. Browse Courses
    try {
        const res = await axios.get(`${API}/courses`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(Array.isArray(res.data.courses) || Array.isArray(res.data.data?.courses));
        printResult('GET /courses', true);
        testResults.passed++;
        if (res.data.courses?.length) courseId = res.data.courses[0].id;
        else if (res.data.data?.courses?.length) courseId = res.data.data.courses[0].id;
    } catch (e) {
        printResult('GET /courses', false, e.response?.data?.message || e.message);
        testResults.failed++;
    }

    // 6. Get Course Details
    if (courseId) {
        try {
            const res = await axios.get(`${API}/courses/${courseId}`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(res.data.course || res.data.data?.course);
            printResult('GET /courses/:id', true);
            testResults.passed++;
        } catch (e) {
            printResult('GET /courses/:id', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 7. Get Free Lessons
    if (courseId) {
        try {
            const res = await axios.get(`${API}/lessons/course/${courseId}/free`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(Array.isArray(res.data.lessons) || Array.isArray(res.data.data?.lessons));
            printResult('GET /lessons/course/:id/free', true);
            testResults.passed++;
            if (res.data.lessons?.length) lessonId = res.data.lessons[0].id;
            else if (res.data.data?.lessons?.length) lessonId = res.data.data.lessons[0].id;
        } catch (e) {
            printResult('GET /lessons/course/:id/free', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 8. Get Lesson Details (with auth)
    if (lessonId && learnerToken) {
        try {
            const res = await axios.get(`${API}/lessons/${lessonId}`, {
                headers: { Authorization: `Bearer ${learnerToken}` }
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(res.data.lesson || res.data.data?.lesson);
            printResult('GET /lessons/:id (authenticated)', true);
            testResults.passed++;
        } catch (e) {
            printResult('GET /lessons/:id (authenticated)', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 9. Get Tests for Course
    if (courseId) {
        try {
            const res = await axios.get(`${API}/tests/course/${courseId}`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(Array.isArray(res.data.tests) || Array.isArray(res.data.data?.tests));
            printResult('GET /tests/course/:id', true);
            testResults.passed++;
            if (res.data.tests?.length) testId = res.data.tests[0].id;
            else if (res.data.data?.tests?.length) testId = res.data.data.tests[0].id;
        } catch (e) {
            printResult('GET /tests/course/:id', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 10. Start Test Session
    if (testId && learnerToken) {
        try {
            const res = await axios.post(`${API}/tests/${testId}/start`, {}, {
                headers: { Authorization: `Bearer ${learnerToken}` }
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(res.data.sessionId);
            testSessionId = res.data.sessionId;
            printResult('POST /tests/:id/start', true);
            testResults.passed++;
        } catch (e) {
            printResult('POST /tests/:id/start', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 11. Submit Test Answers
    if (testSessionId && learnerToken) {
        try {
            const res = await axios.post(`${API}/tests/session/${testSessionId}/submit`, {
                answers: [
                    { questionId: 1, selectedOption: 'A' },
                    { questionId: 2, selectedOption: 'B' }
                ]
            }, {
                headers: { Authorization: `Bearer ${learnerToken}` }
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            printResult('POST /tests/session/:id/submit', true);
            testResults.passed++;
        } catch (e) {
            printResult('POST /tests/session/:id/submit', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 12. Get Subscription Plans
    try {
        const res = await axios.get(`${API}/subscriptions/plans`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(Array.isArray(res.data.plans) || Array.isArray(res.data.data?.plans));
        printResult('GET /subscriptions/plans', true);
        testResults.passed++;
    } catch (e) {
        printResult('GET /subscriptions/plans', false, e.response?.data?.message || e.message);
        testResults.failed++;
    }

    // 13. Subscribe to Plan
    if (learnerToken) {
        try {
            const res = await axios.post(`${API}/subscriptions/subscribe`, {
                planId: 1,
                paymentMethod: 'card',
                cardDetails: {
                    number: '4242424242424242',
                    expiryMonth: 12,
                    expiryYear: 2025,
                    cvv: '123'
                }
            }, {
                headers: { Authorization: `Bearer ${learnerToken}` }
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            printResult('POST /subscriptions/subscribe', true);
            testResults.passed++;
        } catch (e) {
            printResult('POST /subscriptions/subscribe', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 14. Get Live Class Schedule
    try {
        const res = await axios.get(`${API}/live-classes/schedule`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(Array.isArray(res.data.classes) || Array.isArray(res.data.data?.classes));
        printResult('GET /live-classes/schedule', true);
        testResults.passed++;
        if (res.data.classes?.length) liveClassId = res.data.classes[0].id;
        else if (res.data.data?.classes?.length) liveClassId = res.data.data.classes[0].id;
    } catch (e) {
        printResult('GET /live-classes/schedule', false, e.response?.data?.message || e.message);
        testResults.failed++;
    }

    // 15. Join Live Class
    if (liveClassId && learnerToken) {
        try {
            const res = await axios.post(`${API}/live-classes/${liveClassId}/join`, {}, {
                headers: { Authorization: `Bearer ${learnerToken}` }
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            printResult('POST /live-classes/:id/join', true);
            testResults.passed++;
        } catch (e) {
            printResult('POST /live-classes/:id/join', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 16. Get Educator Profile
    if (educatorId) {
        try {
            const res = await axios.get(`${API}/educators/${educatorId}`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(res.data.educator || res.data.data?.educator);
            printResult('GET /educators/:id', true);
            testResults.passed++;
        } catch (e) {
            printResult('GET /educators/:id', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 17. Get Course Materials
    if (courseId) {
        try {
            const res = await axios.get(`${API}/materials/course/${courseId}`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(Array.isArray(res.data.materials) || Array.isArray(res.data.data?.materials));
            printResult('GET /materials/course/:id', true);
            testResults.passed++;
            if (res.data.materials?.length) materialId = res.data.materials[0].id;
            else if (res.data.data?.materials?.length) materialId = res.data.data.materials[0].id;
        } catch (e) {
            printResult('GET /materials/course/:id', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 18. Download Material
    if (materialId && learnerToken) {
        try {
            const res = await axios.get(`${API}/materials/${materialId}/download`, {
                headers: { Authorization: `Bearer ${learnerToken}` }
            });
            assert.strictEqual(res.status, 200);
            printResult('GET /materials/:id/download', true);
            testResults.passed++;
        } catch (e) {
            printResult('GET /materials/:id/download', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 19. Get Course Reviews
    if (courseId) {
        try {
            const res = await axios.get(`${API}/reviews/course/${courseId}`);
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            assert.ok(Array.isArray(res.data.reviews) || Array.isArray(res.data.data?.reviews));
            printResult('GET /reviews/course/:id', true);
            testResults.passed++;
        } catch (e) {
            printResult('GET /reviews/course/:id', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 20. Add Course Review
    if (courseId && learnerToken) {
        try {
            const res = await axios.post(`${API}/reviews/course/${courseId}`, {
                rating: 5,
                comment: 'Excellent course! Very helpful content.'
            }, {
                headers: { Authorization: `Bearer ${learnerToken}` }
            });
            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.data.success, true);
            printResult('POST /reviews/course/:id', true);
            testResults.passed++;
        } catch (e) {
            printResult('POST /reviews/course/:id', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 21. Search Courses
    try {
        const res = await axios.get(`${API}/search/courses?q=mathematics`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(Array.isArray(res.data.courses) || Array.isArray(res.data.data?.courses));
        printResult('GET /search/courses', true);
        testResults.passed++;
    } catch (e) {
        printResult('GET /search/courses', false, e.response?.data?.message || e.message);
        testResults.failed++;
    }

    // 22. Search Lessons
    try {
        const res = await axios.get(`${API}/search/lessons?q=calculus`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(Array.isArray(res.data.lessons) || Array.isArray(res.data.data?.lessons));
        printResult('GET /search/lessons', true);
        testResults.passed++;
    } catch (e) {
        printResult('GET /search/lessons', false, e.response?.data?.message || e.message);
        testResults.failed++;
    }

    // 23. Search Educators
    try {
        const res = await axios.get(`${API}/search/educators?subject=mathematics`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(Array.isArray(res.data.educators) || Array.isArray(res.data.data?.educators));
        printResult('GET /search/educators', true);
        testResults.passed++;
    } catch (e) {
        printResult('GET /search/educators', false, e.response?.data?.message || e.message);
        testResults.failed++;
    }

    // 24. Global Search
    try {
        const res = await axios.get(`${API}/search/global?q=math`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        printResult('GET /search/global', true);
        testResults.passed++;
    } catch (e) {
        printResult('GET /search/global', false, e.response?.data?.message || e.message);
        testResults.failed++;
    }

    // 25. Get Search Suggestions
    try {
        const res = await axios.get(`${API}/search/suggestions?q=math`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(Array.isArray(res.data.suggestions) || Array.isArray(res.data.data?.suggestions));
        printResult('GET /search/suggestions', true);
        testResults.passed++;
    } catch (e) {
        printResult('GET /search/suggestions', false, e.response?.data?.message || e.message);
        testResults.failed++;
    }

    // 26. Get Popular Searches
    try {
        const res = await axios.get(`${API}/search/popular`);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(Array.isArray(res.data.popular) || Array.isArray(res.data.data?.popular));
        printResult('GET /search/popular', true);
        testResults.passed++;
    } catch (e) {
        printResult('GET /search/popular', false, e.response?.data?.message || e.message);
        testResults.failed++;
    }

    // 27. Get User Progress
    if (learnerToken) {
        try {
            const res = await axios.get(`${API}/progress/user`, {
                headers: { Authorization: `Bearer ${learnerToken}` }
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            printResult('GET /progress/user', true);
            testResults.passed++;
        } catch (e) {
            printResult('GET /progress/user', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 28. Get Course Progress
    if (courseId && learnerToken) {
        try {
            const res = await axios.get(`${API}/progress/course/${courseId}`, {
                headers: { Authorization: `Bearer ${learnerToken}` }
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            printResult('GET /progress/course/:id', true);
            testResults.passed++;
        } catch (e) {
            printResult('GET /progress/course/:id', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 29. Update Lesson Progress
    if (lessonId && learnerToken) {
        try {
            const res = await axios.post(`${API}/progress/lesson/${lessonId}`, {
                completed: true,
                timeSpent: 1800
            }, {
                headers: { Authorization: `Bearer ${learnerToken}` }
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.data.success, true);
            printResult('POST /progress/lesson/:id', true);
            testResults.passed++;
        } catch (e) {
            printResult('POST /progress/lesson/:id', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // 30. Submit Doubt
    if (courseId && learnerToken) {
        try {
            const res = await axios.post(`${API}/doubts/submit`, {
                courseId: courseId,
                subject: 'Mathematics',
                question: 'Can you explain the concept of derivatives?',
                priority: 'medium'
            }, {
                headers: { Authorization: `Bearer ${learnerToken}` }
            });
            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.data.success, true);
            printResult('POST /doubts/submit', true);
            testResults.passed++;
        } catch (e) {
            printResult('POST /doubts/submit', false, e.response?.data?.message || e.message);
            testResults.failed++;
        }
    }

    // Print comprehensive test summary
    console.log('\n📊 Comprehensive Test Results:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

    if (testResults.failed === 0) {
        console.log('\n🎉 All comprehensive tests passed!');
    } else if (testResults.passed > testResults.failed) {
        console.log('\n✅ Most comprehensive tests passed!');
    } else {
        console.log('\n⚠️  Several comprehensive tests failed.');
    }

    return testResults;
}

// Test all APIs (simpler version)
async function testAllAPIs() {
    console.log('🚀 Testing Online Learning Platform APIs...\n');

    const tests = [
        {
            name: 'Health Check',
            test: () => makeRequest('/')
        },
        {
            name: 'Browse Courses (Public)',
            test: () => makeRequest('/api/courses')
        },
        {
            name: 'Get Course Details (Public)',
            test: () => makeRequest('/api/courses/1')
        },
        {
            name: 'Get Free Lessons (Public)',
            test: () => makeRequest('/api/lessons/course/1/free')
        },
        {
            name: 'Search Courses',
            test: () => makeRequest('/api/search/courses?q=mathematics')
        },
        {
            name: 'Search Lessons',
            test: () => makeRequest('/api/search/lessons?q=calculus')
        },
        {
            name: 'Search Educators',
            test: () => makeRequest('/api/search/educators?subject=mathematics')
        },
        {
            name: 'Global Search',
            test: () => makeRequest('/api/search/global?q=math')
        },
        {
            name: 'Get Search Suggestions',
            test: () => makeRequest('/api/search/suggestions?q=math')
        },
        {
            name: 'Get Popular Searches',
            test: () => makeRequest('/api/search/popular')
        },
        {
            name: 'Get Course Reviews',
            test: () => makeRequest('/api/reviews/course/1')
        },
        {
            name: 'Get Subscription Plans',
            test: () => makeRequest('/api/subscriptions/plans')
        },
        {
            name: 'Get Live Class Schedule (Public)',
            test: () => makeRequest('/api/live-classes/schedule')
        },
        {
            name: 'Get Educator Profile (Public)',
            test: () => makeRequest('/api/educators/1')
        },
        {
            name: 'Get Course Materials (Public)',
            test: () => makeRequest('/api/materials/course/1')
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}`);
            const result = await test.test();
            
            if (result.success) {
                console.log(`✅ ${test.name} - PASSED (${result.status})`);
                passed++;
            } else {
                console.log(`❌ ${test.name} - FAILED (${result.status})`);
                if (result.data && result.data.message) {
                    console.log(`   Error: ${result.data.message}`);
                }
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${test.name} - ERROR`);
            console.log(`   Error: ${error.message}`);
            failed++;
        }
        console.log('');
    }

    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All APIs are working correctly!');
    } else {
        console.log('\n⚠️  Some APIs need attention.');
    }

    // Test authentication endpoints separately
    console.log('\n🔐 Testing Authentication Endpoints...\n');
    
    const authTests = [
        {
            name: 'Register Learner',
            test: () => makeRequest('/api/auth/register', 'POST', {
                email: 'testuser@example.com',
                password: 'TestPass123',
                firstName: 'Test',
                lastName: 'User',
                targetExam: 'JEE Main',
                preferredLanguage: 'English'
            })
        },
        {
            name: 'Login Learner (with seeded data)',
            test: () => makeRequest('/api/auth/login', 'POST', {
                email: 'john.doe@example.com',
                password: 'password123'
            })
        }
    ];

    for (const test of authTests) {
        try {
            console.log(`Testing: ${test.name}`);
            const result = await test.test();
            
            if (result.success) {
                console.log(`✅ ${test.name} - PASSED (${result.status})`);
                passed++;
            } else {
                console.log(`❌ ${test.name} - FAILED (${result.status})`);
                if (result.data && result.data.message) {
                    console.log(`   Error: ${result.data.message}`);
                }
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${test.name} - ERROR`);
            console.log(`   Error: ${error.message}`);
            failed++;
        }
        console.log('');
    }

    console.log('🎯 Final Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Overall Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All APIs are working perfectly!');
    } else if (passed > failed) {
        console.log('\n✅ Most APIs are working correctly!');
    } else {
        console.log('\n⚠️  Several APIs need attention.');
    }
}

// Main execution
async function main() {
    console.log('🎓 Online Learning Platform API Testing Suite\n');
    console.log('Choose test mode:');
    console.log('1. Quick API Check (basic endpoints)');
    console.log('2. Comprehensive Test (with authentication and full workflow)');
    console.log('3. Both tests\n');

    // Run both tests
    console.log('🔍 Running Quick API Check...\n');
    await testAllAPIs();
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    console.log('🔍 Running Comprehensive Test...\n');
    await runComprehensiveTests();
    
    console.log('\n🎯 Testing Complete!');
}

// Run the tests
main().catch(console.error); 