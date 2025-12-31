-- 1. Create Tile for New Delhi (Zoom 14)
INSERT IGNORE INTO map_tiles (tile_id, zoom_level, x, y, bounds) 
VALUES (1, 14, 11824, 6952, ST_GeomFromText('POLYGON((77.1 28.5, 77.3 28.5, 77.3 28.7, 77.1 28.7, 77.1 28.5))', 4326));

-- 2. Insert India Gate
INSERT INTO map_nodes (tile_id, geom, geom_3857, type, properties) VALUES (
    1,
    ST_GeomFromText('POINT(77.2295 28.6129)', 4326),
    ST_GeomFromText('POINT(8597384.88 3326442.56)', 3857),
    'venue',
    '{"name": "India Gate", "amenity": "monument"}'
);

-- 3. Insert Rashtrapati Bhavan
INSERT INTO map_nodes (tile_id, geom, geom_3857, type, properties) VALUES (
    1,
    ST_GeomFromText('POINT(77.1994 28.6143)', 4326),
    ST_GeomFromText('POINT(8594034.07 3326618.33)', 3857),
    'venue',
    '{"name": "Rashtrapati Bhavan", "amenity": "government"}'
);

-- 4. Insert Connaught Place
INSERT INTO map_nodes (tile_id, geom, geom_3857, type, properties) VALUES (
    1,
    ST_GeomFromText('POINT(77.2167 28.6315)', 4326),
    ST_GeomFromText('POINT(8595960.01 3328777.92)', 3857),
    'food',
    '{"name": "Connaught Place", "amenity": "marketplace"}'
);

-- 5. Insert Kartavya Path (Rajpath)
INSERT INTO map_ways (tile_id, geom, geom_3857, type, properties, width_cm) VALUES (
    1,
    ST_GeomFromText('LINESTRING(77.1994 28.6143, 77.2295 28.6129)', 4326),
    ST_GeomFromText('LINESTRING(8594034.07 3326618.33, 8597384.88 3326442.56)', 3857),
    'road',
    '{"name": "Kartavya Path", "surface": "paved"}',
    4000
);

-- 6. Insert Lodhi Gardens Area
INSERT INTO map_areas (tile_id, geom, geom_3857, type, properties) VALUES (
    1,
    ST_GeomFromText('POLYGON((77.22 28.59, 77.23 28.59, 77.23 28.60, 77.22 28.60, 77.22 28.59))', 4326),
    ST_GeomFromText('POLYGON((8596327.35 3323568.12, 8597440.59 3323568.12, 8597440.59 3324823.57, 8596327.35 3324823.57, 8596327.35 3323568.12))', 3857),
    'green',
    '{"name": "Lodhi Gardens"}'
);
