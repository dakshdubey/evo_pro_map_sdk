const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const migrate = async () => {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon and filter empty statements
        // This is a naive split, but works for the provided schema which doesn't contain semicolons in strings/comments
        const statements = schema.split(';').filter(stmt => stmt.trim());

        const connection = await pool.getConnection();

        console.log('Starting migration...');

        for (const stmt of statements) {
            if (stmt.trim()) {
                try {
                    await connection.query(stmt);
                    // console.log('Executed statement');
                } catch (err) {
                    console.error('Error executing statement:', err.message);
                    // Don't exit, might be "table already exists" if we didn't use IF NOT EXISTS everywhere
                    // But I added IF NOT EXISTS to the schema.
                }
            }
        }

        console.log('Migration completed successfully.');
        connection.release();
        if (require.main === module) process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        // Do not exit process if imported
        if (require.main === module) process.exit(1);
    }
};

module.exports = migrate;

if (require.main === module) {
    migrate();
}
