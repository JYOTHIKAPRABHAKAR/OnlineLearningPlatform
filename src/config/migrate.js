const fs = require('fs');
const path = require('path');
const database = require('./database');

async function migrate() {
    try {
        await database.connect();
        
        // Read the schema file
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split the schema into individual statements
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        console.log('Starting database migration...');
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                try {
                    await database.run(statement);
                    console.log(`Executed statement ${i + 1}/${statements.length}`);
                } catch (error) {
                    console.error(`Error executing statement ${i + 1}:`, error.message);
                }
            }
        }
        
        console.log('Database migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await database.close();
    }
}

migrate(); 