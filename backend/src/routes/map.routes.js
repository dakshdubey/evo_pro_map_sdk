const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map.controller');

// Raw Data API
router.get('/data/raw', mapController.getRawData);

// modification API
router.post('/data/modify', mapController.modifyData);

// Vector Tile API
router.get('/tiles/:z/:x/:y.mvt', mapController.getTile);

// Routing API
router.post('/routing/route', mapController.getRoute);

module.exports = router;
