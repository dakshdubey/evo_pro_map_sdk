const geojsonvt = require('geojson-vt');
const vtpbf = require('vt-pbf');
const pool = require('../config/database');
const { tileToBBox } = require('../utils/geo');

exports.generateTile = async (z, x, y) => {
    const zoom = parseInt(z);
    const tileX = parseInt(x);
    const tileY = parseInt(y);

    const { minX, minY, maxX, maxY } = tileToBBox(zoom, tileX, tileY);

    // Buffer for intersection (optional, but good for labels)
    const buffer = (maxX - minX) * 0.1;

    let connection;
    try {
        connection = await pool.getConnection();

        // Query Layers (simplify for now: nodes, ways, areas)
        // We fetch raw geometries. For "Production", we'd use map_tiles partition pruning.
        // Here we query geometry directly using Spatial Index.

        // MySQL 5.7/8.0 ST_Intersects works with SRID bounds.
        // Construct POLYGON for tile bounds.
        const bboxWKT = `POLYGON((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;

        const layers = {};

        // 1. Nodes
        const [nodes] = await connection.query(`
      SELECT node_id, type, properties, ST_AsGeoJSON(geom) as geojson 
      FROM map_nodes 
      WHERE ST_Intersects(geom_3857, ST_GeomFromText(?, 3857))
    `, [bboxWKT]);

        const nodeFeatures = nodes
            .filter(n => n.geojson) // Filter out null geometries
            .map(n => ({
                type: 'Feature',
                geometry: JSON.parse(n.geojson),
                properties: { ...n.properties, id: n.node_id, type: n.type }
            }));

        if (nodeFeatures.length > 0) layers.nodes = { type: 'FeatureCollection', features: nodeFeatures };

        // 2. Ways
        const [ways] = await connection.query(`
      SELECT way_id, type, properties, ST_AsGeoJSON(geom) as geojson 
      FROM map_ways 
      WHERE ST_Intersects(geom_3857, ST_GeomFromText(?, 3857))
    `, [bboxWKT]);

        const wayFeatures = ways
            .filter(w => w.geojson)
            .map(w => ({
                type: 'Feature',
                geometry: JSON.parse(w.geojson),
                properties: { ...w.properties, id: w.way_id, type: w.type }
            }));

        if (wayFeatures.length > 0) layers.ways = { type: 'FeatureCollection', features: wayFeatures };

        // 3. Areas
        const [areas] = await connection.query(`
      SELECT area_id, type, properties, ST_AsGeoJSON(geom) as geojson 
      FROM map_areas 
      WHERE ST_Intersects(geom_3857, ST_GeomFromText(?, 3857))
    `, [bboxWKT]);

        const areaFeatures = areas
            .filter(a => a.geojson)
            .map(a => ({
                type: 'Feature',
                geometry: JSON.parse(a.geojson),
                properties: { ...a.properties, id: a.area_id, type: a.type }
            }));

        if (areaFeatures.length > 0) layers.areas = { type: 'FeatureCollection', features: areaFeatures };

        // Connection release moved to finally block

        // Create a composite GeoJSON for geojson-vt
        // Actually geojson-vt takes a single FeatureCollection or an array?
        // geojson-vt slices ONE layer.
        // vt-pbf can take an object mapping layer names to geojson-vt tiles.

        // Optimization: Run geojson-vt on each layer individually, asking for THIS specific tile.
        const tileOptions = { maxZoom: zoom, indexMaxZoom: zoom, maxZoom: zoom, extent: 4096 };

        const vectorTiles = {};

        for (const [layerName, geojson] of Object.entries(layers)) {
            const tileIndex = geojsonvt(geojson, tileOptions);
            const tile = tileIndex.getTile(zoom, tileX, tileY);
            if (tile) {
                vectorTiles[layerName] = tile;
            }
        }

        // Generate PBF
        const pbf = vtpbf.fromGeojsonVt(vectorTiles);
        return Buffer.from(pbf);

    } catch (error) {
        console.error('Tile generation error:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};
