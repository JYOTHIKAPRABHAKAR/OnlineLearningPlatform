const database = require('./src/config/database');
const { hashPassword } = require('./src/utils/helpers');

async function createTestUser() {
    try {
        console.log('🔧 Connecting to database...');
        await database.connect();
        
        console.log('🔧 Creating test user...');
        
        // Hash the password
        const hashedPassword = await hashPassword('password123');
        
        // Check if user already exists
        const existingUser = await database.get(
            'SELECT * FROM users WHERE email = ?',
            ['test.user@example.com']
        );
        
        if (existingUser) {
            console.log('✅ Test user already exists');
            return;
        }
        
        // Create test user
        const result = await database.run(
            `INSERT INTO users (email, password, firstName, lastName, targetExam, preferredLanguage, phone) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                'test.user@example.com',
                hashedPassword,
                'Test',
                'User',
                'JEE Main',
                'English',
                '+91-9876543210'
            ]
        );
        
        console.log('✅ Test user created successfully with ID:', result.lastID);
        console.log('📧 Email: test.user@example.com');
        console.log('🔑 Password: password123');
        
    } catch (error) {
        console.error('❌ Error creating test user:', error);
    } finally {
        await database.close();
        process.exit(0);
    }
}

createTestUser(); 