-- 1. SPATIAL HIERARCHY TABLES
-- World partition system (Google Mercator-like)
CREATE TABLE IF NOT EXISTS map_tiles (
  tile_id BIGINT PRIMARY KEY,
  zoom_level TINYINT NOT NULL, -- 0-22 (Google-style)
  x INTEGER NOT NULL,          -- Tile X coordinate
  y INTEGER NOT NULL,          -- Tile Y coordinate
  bounds POLYGON SRID 4326 NOT NULL,    -- Geographical bounds
  centroid POINT SRID 4326,
  node_count INT DEFAULT 0,
  way_count INT DEFAULT 0,
  area_count INT DEFAULT 0,
  INDEX idx_zoom_xy (zoom_level, x, y),
  SPATIAL INDEX idx_bounds (bounds)
) ENGINE=InnoDB ROW_FORMAT=COMPRESSED;

-- Zoom-level optimized data storage
CREATE TABLE IF NOT EXISTS map_nodes (
  node_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tile_id BIGINT NOT NULL,     -- Parent tile for quick retrieval
  global_id CHAR(32) UNIQUE,   -- UUID for external reference
  geom POINT SRID 4326 NOT NULL,
  geom_3857 POINT SRID 3857 NOT NULL,   -- Web Mercator for rendering
  type ENUM('venue','gate','restroom','food','exit','entrance','emergency','info','checkpoint') NOT NULL,
  properties JSON NOT NULL,    -- All metadata here
  layer_ids JSON,              -- Multiple layer membership
  importance TINYINT DEFAULT 50, -- 1-100 for LOD
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_tile_type (tile_id, type),
  INDEX idx_importance (importance),
  SPATIAL INDEX idx_geom (geom),
  SPATIAL INDEX idx_geom_3857 (geom_3857),
  FOREIGN KEY (tile_id) REFERENCES map_tiles(tile_id) ON DELETE CASCADE
) ENGINE=InnoDB ROW_FORMAT=COMPRESSED;

CREATE TABLE IF NOT EXISTS map_ways (
  way_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tile_id BIGINT NOT NULL,
  global_id CHAR(32) UNIQUE,
  geom LINESTRING SRID 4326 NOT NULL,
  geom_3857 LINESTRING SRID 3857 NOT NULL,
  type ENUM('road','path','corridor','aisle','stairs','escalator','elevator','queue','barrier') NOT NULL,
  properties JSON NOT NULL,
  layer_ids JSON,
  importance TINYINT DEFAULT 50,
  node_ids JSON,              -- Ordered nodes forming this way
  direction ENUM('both','forward','backward') DEFAULT 'both',
  width_cm SMALLINT,          -- Physical width in cm
  max_speed_kmph TINYINT,     -- For routing
  is_oneway BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  SPATIAL INDEX idx_geom (geom),
  SPATIAL INDEX idx_geom_3857 (geom_3857),
  INDEX idx_tile_type (tile_id, type),
  FOREIGN KEY (tile_id) REFERENCES map_tiles(tile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS map_areas (
  area_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tile_id BIGINT NOT NULL,
  global_id CHAR(32) UNIQUE,
  geom POLYGON SRID 4326 NOT NULL,
  geom_3857 POLYGON SRID 3857 NOT NULL,
  type ENUM('building','parking','lawn','stage','exhibition','foodcourt','seating','restricted','green') NOT NULL,
  properties JSON NOT NULL,
  layer_ids JSON,
  importance TINYINT DEFAULT 50,
  is_closed_polygon BOOLEAN DEFAULT TRUE,
  height_m DECIMAL(5,2),      -- Building height
  floor_number SMALLINT,      -- Multi-floor support
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  SPATIAL INDEX idx_geom (geom),
  INDEX idx_tile_type (tile_id, type),
  FOREIGN KEY (tile_id) REFERENCES map_tiles(tile_id) ON DELETE CASCADE
);

-- 2. LAYER MANAGEMENT SYSTEM
CREATE TABLE IF NOT EXISTS map_layers (
  layer_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category ENUM('base','overlay','interactive','analysis','temporary') DEFAULT 'overlay',
  z_index SMALLINT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  is_selectable BOOLEAN DEFAULT TRUE,
  is_editable BOOLEAN DEFAULT FALSE,
  min_zoom TINYINT DEFAULT 0,
  max_zoom TINYINT DEFAULT 22,
  filter_conditions JSON,     -- SQL-like filter conditions
  style_schema JSON NOT NULL, -- Vector tile style specification
  data_source ENUM('database','api','realtime') DEFAULT 'database',
  refresh_interval_seconds INT DEFAULT 300,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category_visible (category, is_visible)
);

-- Layer-element mapping (many-to-many)
CREATE TABLE IF NOT EXISTS layer_elements (
  layer_id INT NOT NULL,
  element_type ENUM('node','way','area') NOT NULL,
  element_id BIGINT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  added_by INT,
  properties_override JSON,   -- Layer-specific overrides
  PRIMARY KEY (layer_id, element_type, element_id),
  INDEX idx_element (element_type, element_id)
);

-- 3. STYLE & RENDERING SYSTEM
CREATE TABLE IF NOT EXISTS map_styles (
  style_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE,
  style_config JSON NOT NULL, -- Mapbox GL JSON compatible
  version VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zoom_level_configs (
  zoom_level TINYINT PRIMARY KEY,
  node_simplify_tolerance DECIMAL(5,3) DEFAULT 0.0,
  way_simplify_tolerance DECIMAL(5,3) DEFAULT 0.0001,
  area_simplify_tolerance DECIMAL(5,3) DEFAULT 0.0005,
  min_importance TINYINT DEFAULT 1,  -- Filter by importance at this zoom
  max_elements_per_tile INT DEFAULT 1000,
  label_density DECIMAL(3,2) DEFAULT 0.5
);

-- 4. ROUTING GRAPH (GOOGLE-STYLE)
CREATE TABLE IF NOT EXISTS routing_graph (
  edge_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  source_node_id BIGINT NOT NULL,
  target_node_id BIGINT NOT NULL,
  way_id BIGINT NOT NULL,
  cost_distance DECIMAL(10,2),    -- Meters
  cost_time DECIMAL(10,2),        -- Seconds
  cost_comfort DECIMAL(10,2),     -- 0-100 score
  restrictions JSON,              -- Time-based, event-based restrictions
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_source (source_node_id),
  INDEX idx_target (target_node_id),
  INDEX idx_way (way_id),
  FOREIGN KEY (source_node_id) REFERENCES map_nodes(node_id),
  FOREIGN KEY (target_node_id) REFERENCES map_nodes(node_id),
  FOREIGN KEY (way_id) REFERENCES map_ways(way_id)
);

CREATE TABLE IF NOT EXISTS routing_profiles (
  profile_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE,
  weights JSON NOT NULL,  -- {distance: 0.4, time: 0.3, comfort: 0.3}
  speed_multipliers JSON, -- Per way type
  access_rules JSON,      -- Which way types are allowed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. CACHING & PERMISSIONS
CREATE TABLE IF NOT EXISTS tile_cache (
  tile_key VARCHAR(50) PRIMARY KEY,  -- "z/x/y"
  tile_data MEDIUMBLOB NOT NULL,
  format ENUM('mvt', 'geojson', 'json') DEFAULT 'mvt',
  style_hash CHAR(32),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  access_count INT DEFAULT 1,
  expires_at TIMESTAMP,
  INDEX idx_expires (expires_at)
);

CREATE TABLE IF NOT EXISTS map_permissions (
  user_id INT NOT NULL,
  layer_id INT NOT NULL,
  permission_level ENUM('view','edit','admin','owner') DEFAULT 'view',
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by INT,
  expires_at TIMESTAMP NULL,
  PRIMARY KEY (user_id, layer_id)
);
