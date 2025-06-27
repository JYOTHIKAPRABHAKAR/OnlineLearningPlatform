const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLessonAPI() {
    console.log('🧪 Testing Lesson Details API...\n');

    try {
        const testEmail = `testlearner${Date.now()}@example.com`;
        
        // Step 1: Register a test learner
        console.log('1. Registering test learner...');
        const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
            email: testEmail,
            password: 'TestPass123',
            firstName: 'Test',
            lastName: 'Learner',
            targetExam: 'JEE',
            preferredLanguage: 'English',
            phone: '+1234567890'
        });

        if (!registerResponse.data.success) {
            console.log('❌ Registration failed:', registerResponse.data.message);
            return;
        }
        console.log('✅ Registration successful\n');

        // Step 2: Login to get token
        console.log('2. Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testEmail,
            password: 'TestPass123',
            role: 'learner'
        });

        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.data.token;
        console.log('✅ Login successful, token received\n');

        // Step 3: Enroll in course 1
        console.log('3. Enrolling in course 1...');
        const enrollResponse = await axios.post(`${BASE_URL}/api/courses/1/enroll`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (enrollResponse.data.success) {
            console.log('✅ Enrollment successful\n');
        } else {
            console.log('⚠️ Enrollment response:', enrollResponse.data.message);
        }

        // Step 4: Test lesson details API
        console.log('4. Testing lesson details API...');
        const lessonResponse = await axios.get(`${BASE_URL}/api/lessons/1`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (lessonResponse.data.success) {
            console.log('✅ Lesson details API working!');
            console.log('📋 Response structure:');
            console.log(JSON.stringify(lessonResponse.data, null, 2));
        } else {
            console.log('❌ Lesson details API failed:', lessonResponse.data.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
    }
}

testLessonAPI(); 