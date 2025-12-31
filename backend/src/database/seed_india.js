const pool = require('../config/database');

// Simple spherical mercator conversion
const toMercator = (lon, lat) => {
  const x = lon * 20037508.34 / 180;
  const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
  const yMeters = y * 20037508.34 / 180;
  return [x, yMeters];
};

const seed = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('Seeding India Map Data...');

    // 1. Create Tile for New Delhi (Zoom 14 approx)
    // Center: 77.2090, 28.6139 (Connaught Place/India Gate area)
    // Let's create a "root" tile or a specific partition if we were using real partitions.
    // For this simple schema, references need a tile_id.

    await connection.query(`
      INSERT IGNORE INTO map_tiles (tile_id, zoom_level, x, y, bounds)
      VALUES (1, 14, 11824, 6952, ST_GeomFromText('POLYGON((77.1 28.5, 77.3 28.5, 77.3 28.7, 77.1 28.7, 77.1 28.5))', 4326))
    `);

    // 2. Insert Nodes (India Gate, Rashtrapati Bhavan, CP)
    const nodes = [
      {
        name: 'India Gate',
        type: 'venue',
        lat: 28.6129,
        lon: 77.2295,
        props: { amenity: 'monument' }
      },
      {
        name: 'Rashtrapati Bhavan',
        type: 'venue',
        lat: 28.6143,
        lon: 77.1994,
        props: { amenity: 'government' }
      },
      {
        name: 'Connaught Place',
        type: 'food',
        lat: 28.6315,
        lon: 77.2167,
        props: { amenity: 'marketplace', cuisine: 'multi' }
      }
    ];

    for (const node of nodes) {
      const [mx, my] = toMercator(node.lon, node.lat);
      await connection.query(`
        INSERT INTO map_nodes (tile_id, geom, geom_3857, type, properties)
        VALUES (
          1, 
          ST_GeomFromText('POINT(${node.lon} ${node.lat})', 4326),
          ST_GeomFromText('POINT(${mx} ${my})', 3857),
          ?, 
          ?
        )
      `, [node.type, JSON.stringify({ name: node.name, ...node.props })]);
    }

    // 3. Insert Ways (Rajpath/Kartavya Path)
    const wayPoints = [[77.1994, 28.6143], [77.2295, 28.6129]];
    const wayMerc = wayPoints.map(p => toMercator(p[0], p[1]));
    const wayWKT = `LINESTRING(${wayPoints.map(p => p.join(' ')).join(', ')})`;
    const wayMercWKT = `LINESTRING(${wayMerc.map(p => p.join(' ')).join(', ')})`;

    await connection.query(`
      INSERT INTO map_ways (tile_id, geom, geom_3857, type, properties, width_cm)
      VALUES (
        1,
        ST_GeomFromText('${wayWKT}', 4326),
        ST_GeomFromText('${wayMercWKT}', 3857),
        'road',
        '{"name": "Kartavya Path", "surface": "paved"}',
        4000
      )
    `);

    // 4. Insert Areas (Lodhi Gardens approx)
    const areaPoints = [[77.22, 28.59], [77.23, 28.59], [77.23, 28.60], [77.22, 28.60], [77.22, 28.59]];
    const areaMerc = areaPoints.map(p => toMercator(p[0], p[1]));
    const areaWKT = `POLYGON((${areaPoints.map(p => p.join(' ')).join(', ')}))`;
    const areaMercWKT = `POLYGON((${areaMerc.map(p => p.join(' ')).join(', ')}))`;

    await connection.query(`
      INSERT INTO map_areas (tile_id, geom, geom_3857, type, properties)
      VALUES (
        1,
        ST_GeomFromText('${areaWKT}', 4326),
        ST_GeomFromText('${areaMercWKT}', 3857),
        'green',
        '{"name": "Lodhi Gardens"}'
      )
    `);

    console.log('Seeding Completed.');

  } catch (error) {
    console.error('Seeding Failed:', error);
  } finally {
    connection.release();
    process.exit();
  }
};

seed();
