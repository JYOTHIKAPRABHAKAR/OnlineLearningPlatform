const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const fixPasswords = async () => {
    const dbPath = path.join(__dirname, 'database', 'online_learning.db');
    const db = new sqlite3.Database(dbPath);
    
    try {
        console.log('🔧 Fixing passwords in database...');
        
        // Hash the password
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Update user passwords
        db.run(
            'UPDATE users SET password = ? WHERE email LIKE "%@example.com"',
            [hashedPassword],
            function(err) {
                if (err) {
                    console.error('❌ Error updating user passwords:', err);
                } else {
                    console.log(`✅ Updated ${this.changes} user passwords`);
                }
            }
        );
        
        // Update educator passwords
        db.run(
            'UPDATE educators SET password = ? WHERE email LIKE "%@example.com"',
            [hashedPassword],
            function(err) {
                if (err) {
                    console.error('❌ Error updating educator passwords:', err);
                } else {
                    console.log(`✅ Updated ${this.changes} educator passwords`);
                }
            }
        );
        
        console.log('🔑 All passwords are now: password123');
        
        // Test the password
        db.get(
            'SELECT * FROM users WHERE email = ?',
            ['john.doe@example.com'],
            async function(err, row) {
                if (err) {
                    console.error('❌ Error testing password:', err);
                } else if (row) {
                    const isValid = await bcrypt.compare(password, row.password);
                    console.log(`✅ Password verification test: ${isValid ? 'PASSED' : 'FAILED'}`);
                }
                
                // Close database
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err);
                    } else {
                        console.log('✅ Database connection closed');
                    }
                });
            }
        );
        
    } catch (error) {
        console.error('❌ Error fixing passwords:', error);
        db.close();
    }
};

fixPasswords(); 