const axios = require('axios');

async function testAuth() {
    console.log('Testing Authentication...\n');
    
    // Test 1: Register a new user
    console.log('1. Testing User Registration...');
    try {
        const registerData = {
            email: 'newuser@example.com',
            password: 'TestPass123',
            firstName: 'New',
            lastName: 'User',
            targetExam: 'JEE Main',
            preferredLanguage: 'English',
            phone: '+91-9876543210'
        };
        
        const registerResponse = await axios.post('http://localhost:3000/api/auth/register', registerData);
        console.log('✅ Registration successful:', registerResponse.data.message);
        
        // Test 2: Login with the new user
        console.log('\n2. Testing Login with new user...');
        const loginData = {
            email: 'newuser@example.com',
            password: 'TestPass123'
        };
        
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', loginData);
        console.log('✅ Login successful:', loginResponse.data.message);
        console.log('Token:', loginResponse.data.data.token.substring(0, 20) + '...');
        
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test 3: Try to login with seeded user
    console.log('\n3. Testing Login with seeded user...');
    try {
        const seededLoginData = {
            email: 'john.doe@example.com',
            password: 'password123'
        };
        
        const seededLoginResponse = await axios.post('http://localhost:3000/api/auth/login', seededLoginData);
        console.log('✅ Seeded user login successful:', seededLoginResponse.data.message);
        
    } catch (error) {
        console.log('❌ Seeded user login failed:', error.response?.data || error.message);
    }
}

testAuth().catch(console.error); 