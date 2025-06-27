const fs = require('fs');
const path = require('path');
const database = require('./database');

async function seed() {
    try {
        await database.connect();
        
        // Read the seeds file
        const seedsPath = path.join(__dirname, '../../database/seeds.sql');
        const seeds = fs.readFileSync(seedsPath, 'utf8');
        
        // Split the seeds into individual statements
        const statements = seeds.split(';').filter(stmt => stmt.trim());
        
        console.log('Starting database seeding...');
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                try {
                    await database.run(statement);
                    console.log(`Executed seed statement ${i + 1}/${statements.length}`);
                } catch (error) {
                    console.error(`Error executing seed statement ${i + 1}:`, error.message);
                }
            }
        }
        
        console.log('Database seeding completed successfully!');
        
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        await database.close();
    }
}

seed(); 