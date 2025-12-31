const pool = require('../config/database');

const reset = async () => {
    const connection = await pool.getConnection();
    try {
        console.log('Resetting database...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const tables = [
            'layer_elements', 'map_layers', 'map_permissions', 'tile_cache',
            'routing_graph', 'routing_profiles', 'zoom_level_configs', 'map_styles',
            'map_areas', 'map_ways', 'map_nodes', 'map_tiles'
        ];

        for (const table of tables) {
            await connection.query(`DROP TABLE IF EXISTS ${table}`);
            console.log(`Dropped ${table}`);
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Database reset complete.');
    } catch (error) {
        console.error('Reset failed:', error);
    } finally {
        connection.release();
        process.exit();
    }
};

reset();
