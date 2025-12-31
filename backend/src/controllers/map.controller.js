const pool = require('../config/database');

const dataService = require('../services/data.service');

exports.getRawData = async (req, res) => {
    try {
        const { bbox, zoom, layers } = req.query;
        if (!bbox) return res.status(400).json({ error: 'BBox required' });

        const data = await dataService.getRawData(bbox, layers);
        res.json({
            request: { bbox, zoom, layers },
            data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.modifyData = async (req, res) => {
    try {
        const { operations } = req.body;
        await dataService.modifyData(operations);
        res.json({ status: 'success', operations_processed: operations?.length || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const tileService = require('../services/tile.service');

exports.getTile = async (req, res) => {
    try {
        const { z, x, y } = req.params;
        const pbf = await tileService.generateTile(z, x, y);

        res.set('Content-Type', 'application/x-protobuf');
        res.set('Content-Encoding', 'gzip'); // vt-pbf doesn't gzip by default? Check docs. Usually not gzipped unless we zip it. Browser expects gzip if header is set.
        // vtpbf returns raw buffer. We should NOT set 'Content-Encoding: gzip' unless we zip it.
        // But MVT usually served as 'application/vnd.mapbox-vector-tile'.
        res.set('Content-Type', 'application/vnd.mapbox-vector-tile');
        res.send(pbf);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const routingService = require('../services/routing.service');

exports.getRoute = async (req, res) => {
    try {
        const { origin, destination, profile } = req.body;
        // Expected format: origin: { lat, lon }, destination: { lat, lon }
        if (!origin || !destination) {
            return res.status(400).json({ error: 'Origin and destination required' });
        }

        const route = await routingService.findRoute(origin, destination, profile);
        res.json(route);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
