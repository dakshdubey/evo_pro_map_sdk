const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const runSql = async () => {
    const connection = await pool.getConnection();
    try {
        const sqlPath = path.join(__dirname, 'data.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        const statements = sql.split(';').filter(stmt => stmt.trim());

        console.log(`Running ${statements.length} SQL statements...`);

        for (const stmt of statements) {
            await connection.query(stmt);
        }
        console.log('Data inserted successfully.');
    } catch (error) {
        console.error('SQL Error:', error);
    } finally {
        connection.release();
        process.exit();
    }
};

runSql();
