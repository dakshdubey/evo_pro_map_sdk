const pool = require('../config/database');

const check = async () => {
    try {
        const [nodes] = await pool.query('SELECT COUNT(*) as count FROM map_nodes');
        const [ways] = await pool.query('SELECT COUNT(*) as count FROM map_ways');
        const [areas] = await pool.query('SELECT COUNT(*) as count FROM map_areas');

        console.log('--- Database Content ---');
        console.log(`Nodes: ${nodes[0].count}`);
        console.log(`Ways:  ${ways[0].count}`);
        console.log(`Areas: ${areas[0].count}`);
        console.log('------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
};

check();
