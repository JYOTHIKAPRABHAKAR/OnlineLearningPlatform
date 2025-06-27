const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let learnerToken = '';
let educatorToken = '';
let learnerEmail = `learner${Date.now()}@test.com`;
let educatorEmail = `educator${Date.now()}@test.com`;
const learnerPassword = 'TestPass123';
const educatorPassword = 'TestPass123';

// Test results tracking
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
            testResults.errors.push({ name, error: error.message || error });
        }
    }
}

// Utility function to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test API function with delay
async function testAPI(name, method, endpoint, data = null, headers = {}) {
    try {
        // Add delay to avoid rate limiting
        await delay(100);
        
        const url = `${BASE_URL}${endpoint}`;
        const config = {
            url,
            method,
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

async function runAllTests() {
    console.log('🚀 Starting Comprehensive API Testing...\n');
    
    // Test 1: Health Check
    console.log('📋 1. Health Check');
    await testAPI('Health Check', 'GET', '/');
    
    // Test 2: Authentication APIs
    console.log('\n📋 2. Authentication APIs');
    
    // Register a new learner
    const learnerData = {
        email: learnerEmail,
        password: learnerPassword,
        firstName: 'Test',
        lastName: 'Learner',
        targetExam: 'JEE',
        preferredLanguage: 'English',
        phone: '+1234567890'
    };
    await testAPI('Register Learner', 'POST', '/api/auth/register', learnerData);
    
    // Register a new educator
    const educatorData = {
        email: educatorEmail,
        password: educatorPassword,
        firstName: 'Test',
        lastName: 'Educator',
        subjects: 'Physics, Mathematics',
        experience: 5,
        qualification: 'PhD in Physics',
        bio: 'Experienced educator with expertise in physics and mathematics.'
    };
    await testAPI('Register Educator', 'POST', '/api/auth/educator/register', educatorData);
    
    // Login with the newly registered learner
    const loginData = {
        email: learnerEmail,
        password: learnerPassword
    };
    const loginResponse = await testAPI('Login Learner', 'POST', '/api/auth/login', loginData);
    if (loginResponse?.data?.token) {
        learnerToken = loginResponse.data.token;
    }
    
    // Login with the newly registered educator
    const educatorLoginData = {
        email: educatorEmail,
        password: educatorPassword
    };
    const educatorLoginResponse = await testAPI('Login Educator', 'POST', '/api/auth/login', educatorLoginData);
    if (educatorLoginResponse?.data?.token) {
        educatorToken = educatorLoginResponse.data.token;
    }
    
    // Test 3: Course APIs
    console.log('\n📋 3. Course APIs');
    
    // Browse courses
    await testAPI('Browse Courses', 'GET', '/api/courses');
    
    // Browse courses with filters
    await testAPI('Browse Courses with Filters', 'GET', '/api/courses?exam=JEE&subject=Mathematics&sort=popular');
    
    // Get course details
    await testAPI('Get Course Details', 'GET', '/api/courses/1');
    
    // Enroll in course (requires authentication)
    if (learnerToken) {
        await testAPI('Enroll in Course', 'POST', '/api/courses/1/enroll', {}, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Test 4: Lesson APIs
    console.log('\n📋 4. Lesson APIs');
    
    // Get lesson details (requires enrollment)
    if (learnerToken) {
        await testAPI('Get Lesson Details', 'GET', '/api/lessons/1', null, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Update lesson progress
    if (learnerToken) {
        const progressData = {
            watchedDuration: 1350,
            totalDuration: 2700,
            status: 'in_progress',
            timeSpent: 1350
        };
        await testAPI('Update Lesson Progress', 'POST', '/api/lessons/1/progress', progressData, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Save lesson notes
    if (learnerToken) {
        const noteData = {
            timestamp: 845,
            note: 'Important formula: F = ma'
        };
        await testAPI('Save Lesson Notes', 'POST', '/api/lessons/1/notes', noteData, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Test 5: Live Class APIs
    console.log('\n📋 5. Live Class APIs');
    
    // Get live class schedule
    await testAPI('Get Live Class Schedule', 'GET', '/api/live-classes/schedule');
    
    // Get live class schedule with filters
    await testAPI('Get Live Class Schedule with Filters', 'GET', '/api/live-classes/schedule?courseId=2&upcoming=true');
    
    // Join live class (requires authentication)
    if (learnerToken) {
        await testAPI('Join Live Class', 'POST', '/api/live-classes/1/join', {}, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Ask question during live class
    if (learnerToken) {
        const questionData = {
            question: 'Can you explain this formula again?',
            timestamp: 1520
        };
        await testAPI('Ask Live Class Question', 'POST', '/api/live-classes/1/questions', questionData, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Test 6: Test/Quiz APIs
    console.log('\n📋 6. Test/Quiz APIs');
    
    // Get available tests
    await testAPI('Get Available Tests', 'GET', '/api/tests');
    
    // Get tests with filters
    await testAPI('Get Tests with Filters', 'GET', '/api/tests?courseId=1&type=mock');
    
    // Start a test (requires authentication)
    if (learnerToken) {
        await testAPI('Start Test', 'POST', '/api/tests/1/start', {}, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Submit test answers (requires authentication)
    if (learnerToken) {
        const testAnswers = {
            answers: {
                1: 2,
                2: 1,
                3: 3
            },
            timeSpent: 9500
        };
        await testAPI('Submit Test Answers', 'POST', '/api/tests/session_001/submit', testAnswers, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Test 7: Educator APIs
    console.log('\n📋 7. Educator APIs');
    
    // Browse educators
    await testAPI('Browse Educators', 'GET', '/api/educators');
    
    // Browse educators with filters
    await testAPI('Browse Educators with Filters', 'GET', '/api/educators?subject=Physics&rating=4.5');
    
    // Get educator profile
    await testAPI('Get Educator Profile', 'GET', '/api/educators/1');
    
    // Follow educator (requires authentication)
    if (learnerToken) {
        await testAPI('Follow Educator', 'POST', '/api/educators/1/follow', {}, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Test 8: Progress & Analytics APIs
    console.log('\n📋 8. Progress & Analytics APIs');
    
    // Get learning dashboard (requires authentication)
    if (learnerToken) {
        await testAPI('Get Learning Dashboard', 'GET', '/api/progress/dashboard', null, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Get course progress (requires authentication)
    if (learnerToken) {
        await testAPI('Get Course Progress', 'GET', '/api/progress/course/1', null, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Test 9: Subscription APIs
    console.log('\n📋 9. Subscription APIs');
    
    // Get subscription plans
    await testAPI('Get Subscription Plans', 'GET', '/api/subscriptions/plans');
    
    // Purchase subscription (requires authentication)
    if (learnerToken) {
        const subscriptionData = {
            planId: 1,
            paymentMethod: 'card'
        };
        await testAPI('Purchase Subscription', 'POST', '/api/subscriptions/purchase', subscriptionData, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Test 10: Doubt/Q&A APIs
    console.log('\n📋 10. Doubt/Q&A APIs');
    
    // Post a doubt (requires authentication)
    if (learnerToken) {
        const doubtData = {
            courseId: 1,
            lessonId: 1,
            question: 'Why is acceleration constant in free fall?',
            attachments: ['image_url']
        };
        await testAPI('Post Doubt', 'POST', '/api/doubts', doubtData, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Get my doubts (requires authentication)
    if (learnerToken) {
        await testAPI('Get My Doubts', 'GET', '/api/doubts/my', null, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Answer a doubt (requires educator authentication)
    if (educatorToken) {
        const answerData = {
            answer: 'Acceleration is constant because gravity provides a constant force.'
        };
        await testAPI('Answer Doubt', 'POST', '/api/doubts/1/answer', answerData, {
            'Authorization': `Bearer ${educatorToken}`
        });
    }
    
    // Test 11: Study Material APIs
    console.log('\n📋 11. Study Material APIs');
    
    // Get course materials (requires enrollment)
    if (learnerToken) {
        await testAPI('Get Course Materials', 'GET', '/api/materials/course/1', null, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Track material download (requires authentication)
    if (learnerToken) {
        await testAPI('Track Material Download', 'POST', '/api/materials/1/download', {}, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Test 12: Search APIs
    console.log('\n📋 12. Search APIs');
    
    // Global search
    await testAPI('Global Search', 'GET', '/api/search?q=physics');
    
    // Search with type filter
    await testAPI('Search with Type Filter', 'GET', '/api/search?q=physics&type=course');
    
    // Test 13: Review APIs
    console.log('\n📋 13. Review APIs');
    
    // Get course reviews
    await testAPI('Get Course Reviews', 'GET', '/api/reviews/course/1');
    
    // Review a course (requires enrollment)
    if (learnerToken) {
        const reviewData = {
            courseId: 1,
            rating: 4,
            comment: 'Excellent course with detailed explanations'
        };
        await testAPI('Review Course', 'POST', '/api/reviews/course', reviewData, {
            'Authorization': `Bearer ${learnerToken}`
        });
    }
    
    // Test 14: Error Handling Tests
    console.log('\n📋 14. Error Handling Tests');
    
    // Test invalid email
    await testAPI('Invalid Email Registration', 'POST', '/api/auth/register', {
        email: 'invalid-email',
        password: 'TestPass123',
        firstName: 'Test',
        lastName: 'User'
    });
    
    // Test missing token
    await testAPI('Missing Token Access', 'GET', '/api/auth/profile');
    
    // Test invalid course ID
    await testAPI('Invalid Course ID', 'GET', '/api/courses/999999');
    
    // Test unauthorized access
    await testAPI('Unauthorized Access', 'POST', '/api/courses/1/enroll');
    
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
    
    console.log('\n🎉 API Testing Complete!');
}

// Run the tests
runAllTests().catch(console.error); 