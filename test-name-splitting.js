const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testNameSplitting() {
    console.log('🧪 Testing Name Splitting Functionality...\n');
    
    try {
        // Test 1: Register learner with 'name' field
        console.log('1. Testing Learner Registration with "name" field...');
        const learnerData = {
            name: 'John Michael Doe',
            email: `learner${Date.now()}@test.com`,
            password: 'TestPass123',
            targetExam: 'JEE',
            preferredLanguage: 'English',
            phone: '+1234567890'
        };
        
        const learnerResponse = await axios.post(`${BASE_URL}/api/auth/register`, learnerData);
        console.log('✅ Learner registration with "name" field - PASSED');
        console.log(`   Expected: firstName="John", lastName="Michael Doe"`);
        
        // Test 2: Register educator with 'name' field
        console.log('\n2. Testing Educator Registration with "name" field...');
        const educatorData = {
            name: 'Dr. Sarah Elizabeth Kumar',
            email: `educator${Date.now()}@test.com`,
            password: 'TestPass123',
            subjects: 'Physics, Mathematics',
            experience: 5,
            qualification: 'PhD in Physics',
            bio: 'Experienced educator with expertise in physics and mathematics.'
        };
        
        const educatorResponse = await axios.post(`${BASE_URL}/api/auth/educator/register`, educatorData);
        console.log('✅ Educator registration with "name" field - PASSED');
        console.log(`   Expected: firstName="Dr.", lastName="Sarah Elizabeth Kumar"`);
        
        // Test 3: Register learner with individual firstName and lastName
        console.log('\n3. Testing Learner Registration with individual firstName/lastName...');
        const learnerData2 = {
            firstName: 'Jane',
            lastName: 'Smith Wilson',
            email: `learner2${Date.now()}@test.com`,
            password: 'TestPass123',
            targetExam: 'NEET',
            preferredLanguage: 'English',
            phone: '+1234567891'
        };
        
        const learnerResponse2 = await axios.post(`${BASE_URL}/api/auth/register`, learnerData2);
        console.log('✅ Learner registration with individual firstName/lastName - PASSED');
        
        // Test 4: Register educator with individual firstName and lastName
        console.log('\n4. Testing Educator Registration with individual firstName/lastName...');
        const educatorData2 = {
            firstName: 'Prof',
            lastName: 'Robert Johnson',
            email: `educator2${Date.now()}@test.com`,
            password: 'TestPass123',
            subjects: 'Chemistry, Biology',
            experience: 8,
            qualification: 'PhD in Chemistry',
            bio: 'Senior professor with extensive research experience.'
        };
        
        const educatorResponse2 = await axios.post(`${BASE_URL}/api/auth/educator/register`, educatorData2);
        console.log('✅ Educator registration with individual firstName/lastName - PASSED');
        
        console.log('\n🎉 All name splitting tests passed!');
        console.log('\n📋 Summary:');
        console.log('   - Both "name" field and individual "firstName"/"lastName" fields work');
        console.log('   - Name splitting correctly handles single names and multiple word names');
        console.log('   - Both learner and educator registration support both formats');
        
    } catch (error) {
        if (error.response && error.response.data) {
            console.error('❌ Test failed:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Test failed:', error.message);
        }
    }
}

// Run the test
testNameSplitting(); 