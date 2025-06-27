const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test registration with proper data
const testLearnerRegistration = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, {
            email: 'test.learner@example.com',
            password: 'TestPass123',
            firstName: 'Test',
            lastName: 'Learner',
            targetExam: 'JEE Main',
            preferredLanguage: 'English',
            phone: '+91-9876543210'
        });
        
        console.log('✅ Learner Registration - PASSED');
        console.log('   Response:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ Learner Registration - FAILED');
        console.log('   Error:', error.response?.data || error.message);
        return null;
    }
};

const testEducatorRegistration = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/educator/register`, {
            email: 'test.educator@example.com',
            password: 'TestPass123',
            firstName: 'Test',
            lastName: 'Educator',
            bio: 'Experienced educator with 10+ years of teaching',
            subjects: 'Mathematics,Physics',
            experience: 10,
            qualification: 'Ph.D. Mathematics'
        });
        
        console.log('✅ Educator Registration - PASSED');
        console.log('   Response:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ Educator Registration - FAILED');
        console.log('   Error:', error.response?.data || error.message);
        return null;
    }
};

const testLogin = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'john.doe@example.com',
            password: 'password123'
        });
        
        console.log('✅ Login - PASSED');
        console.log('   Token:', response.data.data?.token?.substring(0, 20) + '...');
        return response.data;
    } catch (error) {
        console.log('❌ Login - FAILED');
        console.log('   Error:', error.response?.data || error.message);
        return null;
    }
};

const runTests = async () => {
    console.log('🔐 Testing Registration and Authentication...\n');
    
    console.log('1. Testing Learner Registration:');
    await testLearnerRegistration();
    console.log('');
    
    console.log('2. Testing Educator Registration:');
    await testEducatorRegistration();
    console.log('');
    
    console.log('3. Testing Login:');
    await testLogin();
    console.log('');
};

runTests().catch(console.error); 