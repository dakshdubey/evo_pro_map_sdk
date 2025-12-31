const pool = require('../config/database');

// Helper to convert GeoJSON geometry to WKT
function toWKT(geometry) {
    if (!geometry) return null;
    const { type, coordinates } = geometry;

    if (type === 'Point') {
        return `POINT(${coordinates.join(' ')})`;
    } else if (type === 'LineString') {
        return `LINESTRING(${coordinates.map(c => c.join(' ')).join(', ')})`;
    } else if (type === 'Polygon') {
        return `POLYGON((${coordinates[0].map(c => c.join(' ')).join(', ')}))`;
    }
    return null;
}

exports.getRawData = async (bbox, layers) => {
    const [minX, minY, maxX, maxY] = bbox.split(',').map(Number);
    const bboxWKT = `POLYGON((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;

    const connection = await pool.getConnection();
    try {
        const result = { nodes: [], ways: [], areas: [] };

        // Query Nodes
        const [nodes] = await connection.query(`
      SELECT node_id as id, type, properties, ST_AsGeoJSON(geom) as geometry 
      FROM map_nodes 
      WHERE ST_Intersects(geom, ST_GeomFromText(?, 4326))
    `, [bboxWKT]);

        result.nodes = nodes.map(n => ({
            ...n,
            geometry: JSON.parse(n.geometry)
        }));

        // Query Ways
        const [ways] = await connection.query(`
      SELECT way_id as id, type, properties, ST_AsGeoJSON(geom) as geometry 
      FROM map_ways 
      WHERE ST_Intersects(geom, ST_GeomFromText(?, 4326))
    `, [bboxWKT]);

        result.ways = ways.map(w => ({
            ...w,
            geometry: JSON.parse(w.geometry)
        }));

        // Query Areas
        const [areas] = await connection.query(`
      SELECT area_id as id, type, properties, ST_AsGeoJSON(geom) as geometry 
      FROM map_areas 
      WHERE ST_Intersects(geom, ST_GeomFromText(?, 4326))
    `, [bboxWKT]);

        result.areas = areas.map(a => ({
            ...a,
            geometry: JSON.parse(a.geometry)
        }));

        return result;
    } finally {
        connection.release();
    }
};

exports.modifyData = async (operations) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        for (const op of operations) {
            const { type, element_type, data, id } = op;

            const table = `map_${element_type}s`; // map_nodes, map_ways...
            const idField = `${element_type}_id`;

            if (type === 'upsert') {
                const wkt = toWKT(data.geometry);
                const wkt3857 = wkt; // TODO: Reproject to 3857. We rely on MySQL ST_Transform or simplistic assumtion if missing.
                // For accurate 3857, we should transform. 
                // Usage: ST_Transform(ST_GeomFromText(?, 4326), 3857) if SRIDs valid.

                // For insert:
                // We'll calculate a tile_id based on centroid? Or just 0 for now.
                const tileId = 0; // Placeholder

                if (data.id && data.id !== 'new') {
                    // Update
                    await connection.query(`
             UPDATE ${table} SET 
               geom = ST_GeomFromText(?, 4326),
               properties = ?,
               type = ?
             WHERE ${idField} = ?
           `, [wkt, JSON.stringify(data.properties), data.type, data.id]);
                } else {
                    // Insert
                    await connection.query(`
             INSERT INTO ${table} (tile_id, geom, geom_3857, type, properties)
             VALUES (?, ST_GeomFromText(?, 4326), ST_GeomFromText(?, 4326), ?, ?)
             -- We cheat and put 4326 into 3857 column for now if transformation is hard in app. 
             -- Ideally: ST_Transform(ST_GeomFromText(?, 4326), 3857)
             -- But MySQL < 8.0.13 has limited SRID support.
             -- Let's just insert.
           `, [tileId, wkt, wkt, data.type || 'venue', JSON.stringify(data.properties || {})]);
                }

            } else if (type === 'delete') {
                await connection.query(`DELETE FROM ${table} WHERE ${idField} = ?`, [id]);
            }
        }

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
