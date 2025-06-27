const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEnrollmentAPI() {
    console.log('🧪 Testing Course Enrollment API...\n');

    try {
        // Step 1: Login to get a learner token
        console.log('1. Getting learner token...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'john.doe@example.com',
            password: 'password123',
            role: 'learner'
        });

        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const learnerToken = loginResponse.data.data.token;
        console.log('✅ Login successful, token received\n');

        // Step 2: Test enrollment in course 1
        console.log('2. Testing enrollment in course 1...');
        const enrollmentResponse = await axios.post(`${BASE_URL}/api/courses/1/enroll`, {}, {
            headers: {
                'Authorization': `Bearer ${learnerToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Enrollment Response:', {
            status: enrollmentResponse.status,
            success: enrollmentResponse.data.success,
            message: enrollmentResponse.data.message,
            data: enrollmentResponse.data.data
        });

        // Step 3: Test duplicate enrollment (should return 409)
        console.log('\n3. Testing duplicate enrollment...');
        try {
            const duplicateResponse = await axios.post(`${BASE_URL}/api/courses/1/enroll`, {}, {
                headers: {
                    'Authorization': `Bearer ${learnerToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ Expected 409 but got:', duplicateResponse.status);
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('✅ Duplicate enrollment correctly rejected (409)');
            } else {
                console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
            }
        }

        // Step 4: Test enrollment in non-existent course
        console.log('\n4. Testing enrollment in non-existent course...');
        try {
            const notFoundResponse = await axios.post(`${BASE_URL}/api/courses/999/enroll`, {}, {
                headers: {
                    'Authorization': `Bearer ${learnerToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ Expected 404 but got:', notFoundResponse.status);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✅ Non-existent course correctly rejected (404)');
            } else {
                console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
            }
        }

        // Step 5: Test enrollment without token
        console.log('\n5. Testing enrollment without token...');
        try {
            const noTokenResponse = await axios.post(`${BASE_URL}/api/courses/1/enroll`, {}, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ Expected 401 but got:', noTokenResponse.status);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ No token correctly rejected (401)');
            } else {
                console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
            }
        }

        console.log('\n🎉 Enrollment API test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testEnrollmentAPI(); 