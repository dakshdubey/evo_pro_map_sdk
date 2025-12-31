const pool = require('../config/database');

async function findNearestNode(lat, lon) {
    const [rows] = await pool.query(`
    SELECT node_id, ST_X(geom) as x, ST_Y(geom) as y,
           ST_Distance_Sphere(geom, ST_GeomFromText('POINT(${lon} ${lat})', 4326)) as dist
    FROM map_nodes
    ORDER BY dist ASC
    LIMIT 1
  `);
    return rows[0];
}

exports.findRoute = async (origin, destination, profile = 'car') => {
    const startNode = await findNearestNode(origin.lat, origin.lon);
    const endNode = await findNearestNode(destination.lat, destination.lon);

    if (!startNode || !endNode) {
        throw new Error('Start or end node not found');
    }

    // Optimize: Load graph for the bbox covering start/end + buffer
    // For MVP: Load all active edges
    const [edges] = await pool.query(`
    SELECT edge_id, source_node_id, target_node_id, cost_distance, cost_time 
    FROM routing_graph 
    WHERE is_active = 1
  `);

    // Build Adjacency List
    const graph = new Map();
    edges.forEach(edge => {
        if (!graph.has(edge.source_node_id)) graph.set(edge.source_node_id, []);
        graph.get(edge.source_node_id).push({
            node: edge.target_node_id,
            cost: edge.cost_distance // Use distance for now
        });
        // If bidirectional? The schema implies directed edges.
        // If 'direction' in map_ways is 'both', we should have inserted two edges.
    });

    // Dijkstra / A*
    const distances = new Map();
    const previous = new Map();
    const pq = new Set(); // Naive priority queue

    distances.set(startNode.node_id, 0);
    pq.add(startNode.node_id);

    let current = null;

    while (pq.size > 0) {
        // Get min distance node
        let minDist = Infinity;
        current = null;
        for (const node of pq) {
            const dist = distances.get(node);
            if (dist < minDist) {
                minDist = dist;
                current = node;
            }
        }

        if (!current) break;
        if (current === endNode.node_id) break;

        pq.delete(current);

        const neighbors = graph.get(current) || [];
        for (const neighbor of neighbors) {
            const alt = distances.get(current) + neighbor.cost;
            if (alt < (distances.get(neighbor.node) || Infinity)) {
                distances.set(neighbor.node, alt);
                previous.set(neighbor.node, current);
                pq.add(neighbor.node);
            }
        }
    }

    // Reconstruct path
    if (!previous.has(endNode.node_id) && startNode.node_id !== endNode.node_id) {
        return { error: 'No path found' }; // Or throw
    }

    const path = [];
    let curr = endNode.node_id;
    while (curr) {
        path.unshift(curr);
        curr = previous.get(curr);
        if (curr === startNode.node_id) {
            path.unshift(curr);
            break;
        }
    }

    // Retrieve geometry for the path
    // We need to join with map_ways via routing_graph
    // This is a simplification.

    // Return GeoJSON LineString of the route
    // For now return node coordinates
    const [pathNodes] = await pool.query(`
    SELECT node_id, ST_X(geom) as x, ST_Y(geom) as y
    FROM map_nodes
    WHERE node_id IN (?)
    ORDER BY FIELD(node_id, ?)
  `, [path, path]);

    const coordinates = pathNodes.map(n => [n.x, n.y]);

    return {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates
        },
        properties: {
            distance: distances.get(endNode.node_id),
            duration: 0 // TODO
        }
    };
};
