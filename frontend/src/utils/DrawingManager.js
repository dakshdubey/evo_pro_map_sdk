/**
 * Drawing Manager Utility
 * Handles all drawing operations on the map
 */

export class DrawingManager {
    constructor(map) {
        this.map = map;
        this.drawings = [];
        this.currentDrawing = null;
        this.measurePoints = [];
    }

    /**
     * Start drawing a point
     */
    startDrawPoint(callback) {
        this.map.getCanvas().style.cursor = 'crosshair';

        const clickHandler = (e) => {
            const point = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [e.lngLat.lng, e.lngLat.lat]
                },
                properties: {
                    type: 'venue',
                    createdAt: new Date().toISOString()
                }
            };

            this.addPointToMap(point);
            this.drawings.push(point);

            if (callback) callback(point);

            this.map.off('click', clickHandler);
            this.map.getCanvas().style.cursor = '';
        };

        this.map.on('click', clickHandler);
    }

    /**
     * Start drawing a line
     */
    startDrawLine(callback) {
        const points = [];
        this.map.getCanvas().style.cursor = 'crosshair';

        const clickHandler = (e) => {
            points.push([e.lngLat.lng, e.lngLat.lat]);

            // Add temporary marker
            this.addTempMarker([e.lngLat.lng, e.lngLat.lat]);

            if (points.length > 1) {
                this.updateTempLine(points);
            }
        };

        const dblClickHandler = (e) => {
            e.preventDefault();

            if (points.length < 2) return;

            const line = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: points
                },
                properties: {
                    type: 'path',
                    length: this.calculateDistance(points),
                    createdAt: new Date().toISOString()
                }
            };

            this.addLineToMap(line);
            this.drawings.push(line);
            this.clearTempDrawings();

            if (callback) callback(line);

            this.map.off('click', clickHandler);
            this.map.off('dblclick', dblClickHandler);
            this.map.getCanvas().style.cursor = '';
        };

        this.map.on('click', clickHandler);
        this.map.on('dblclick', dblClickHandler);
    }

    /**
     * Start drawing a polygon
     */
    startDrawPolygon(callback) {
        const points = [];
        this.map.getCanvas().style.cursor = 'crosshair';

        const clickHandler = (e) => {
            points.push([e.lngLat.lng, e.lngLat.lat]);
            this.addTempMarker([e.lngLat.lng, e.lngLat.lat]);

            if (points.length > 2) {
                this.updateTempPolygon(points);
            }
        };

        const dblClickHandler = (e) => {
            e.preventDefault();

            if (points.length < 3) return;

            // Close the polygon
            points.push(points[0]);

            const polygon = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [points]
                },
                properties: {
                    type: 'area',
                    area: this.calculateArea(points),
                    createdAt: new Date().toISOString()
                }
            };

            this.addPolygonToMap(polygon);
            this.drawings.push(polygon);
            this.clearTempDrawings();

            if (callback) callback(polygon);

            this.map.off('click', clickHandler);
            this.map.off('dblclick', dblClickHandler);
            this.map.getCanvas().style.cursor = '';
        };

        this.map.on('click', clickHandler);
        this.map.on('dblclick', dblClickHandler);
    }

    /**
     * Start measure tool
     */
    startMeasure(callback) {
        this.measurePoints = [];
        this.map.getCanvas().style.cursor = 'crosshair';

        const clickHandler = (e) => {
            this.measurePoints.push([e.lngLat.lng, e.lngLat.lat]);
            this.addTempMarker([e.lngLat.lng, e.lngLat.lat]);

            if (this.measurePoints.length > 1) {
                const distance = this.calculateDistance(this.measurePoints);
                this.updateMeasureLine(this.measurePoints, distance);

                if (callback) callback({ distance, points: this.measurePoints });
            }
        };

        const dblClickHandler = (e) => {
            e.preventDefault();
            this.map.off('click', clickHandler);
            this.map.off('dblclick', dblClickHandler);
            this.map.getCanvas().style.cursor = '';
        };

        this.map.on('click', clickHandler);
        this.map.on('dblclick', dblClickHandler);
    }

    /**
     * Calculate distance between points (in meters)
     */
    calculateDistance(coordinates) {
        let total = 0;
        for (let i = 0; i < coordinates.length - 1; i++) {
            total += this.haversineDistance(coordinates[i], coordinates[i + 1]);
        }
        return total;
    }

    /**
     * Haversine formula for distance calculation
     */
    haversineDistance(coord1, coord2) {
        const R = 6371000; // Earth's radius in meters
        const lat1 = coord1[1] * Math.PI / 180;
        const lat2 = coord2[1] * Math.PI / 180;
        const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
        const deltaLng = (coord2[0] - coord1[0]) * Math.PI / 180;

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Calculate polygon area (in square meters)
     */
    calculateArea(coordinates) {
        let area = 0;
        const numPoints = coordinates.length - 1;

        for (let i = 0; i < numPoints; i++) {
            const j = (i + 1) % numPoints;
            area += coordinates[i][0] * coordinates[j][1];
            area -= coordinates[j][0] * coordinates[i][1];
        }

        area = Math.abs(area / 2);

        // Convert to square meters (approximate)
        const metersPerDegree = 111320;
        return area * metersPerDegree * metersPerDegree;
    }

    /**
     * Add point to map
     */
    addPointToMap(point) {
        if (!this.map.getSource('drawings')) {
            this.map.addSource('drawings', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            this.map.addLayer({
                id: 'drawing-points',
                type: 'circle',
                source: 'drawings',
                filter: ['==', ['geometry-type'], 'Point'],
                paint: {
                    'circle-radius': 8,
                    'circle-color': '#3b82f6',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
                }
            });
        }

        const source = this.map.getSource('drawings');
        const data = source._data;
        data.features.push(point);
        source.setData(data);
    }

    /**
     * Add line to map
     */
    addLineToMap(line) {
        if (!this.map.getLayer('drawing-lines')) {
            this.map.addLayer({
                id: 'drawing-lines',
                type: 'line',
                source: 'drawings',
                filter: ['==', ['geometry-type'], 'LineString'],
                paint: {
                    'line-color': '#10b981',
                    'line-width': 3
                }
            });
        }

        const source = this.map.getSource('drawings');
        const data = source._data;
        data.features.push(line);
        source.setData(data);
    }

    /**
     * Add polygon to map
     */
    addPolygonToMap(polygon) {
        if (!this.map.getLayer('drawing-polygons')) {
            this.map.addLayer({
                id: 'drawing-polygons',
                type: 'fill',
                source: 'drawings',
                filter: ['==', ['geometry-type'], 'Polygon'],
                paint: {
                    'fill-color': '#8b5cf6',
                    'fill-opacity': 0.3
                }
            });

            this.map.addLayer({
                id: 'drawing-polygon-outlines',
                type: 'line',
                source: 'drawings',
                filter: ['==', ['geometry-type'], 'Polygon'],
                paint: {
                    'line-color': '#8b5cf6',
                    'line-width': 2
                }
            });
        }

        const source = this.map.getSource('drawings');
        const data = source._data;
        data.features.push(polygon);
        source.setData(data);
    }

    /**
     * Add temporary marker
     */
    addTempMarker(coordinates) {
        if (!this.map.getSource('temp-markers')) {
            this.map.addSource('temp-markers', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            this.map.addLayer({
                id: 'temp-marker-layer',
                type: 'circle',
                source: 'temp-markers',
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#ef4444'
                }
            });
        }

        const source = this.map.getSource('temp-markers');
        const data = source._data;
        data.features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates }
        });
        source.setData(data);
    }

    /**
     * Update temporary line
     */
    updateTempLine(coordinates) {
        if (!this.map.getSource('temp-line')) {
            this.map.addSource('temp-line', {
                type: 'geojson',
                data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
            });

            this.map.addLayer({
                id: 'temp-line-layer',
                type: 'line',
                source: 'temp-line',
                paint: {
                    'line-color': '#10b981',
                    'line-width': 2,
                    'line-dasharray': [2, 2]
                }
            });
        }

        this.map.getSource('temp-line').setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates }
        });
    }

    /**
     * Update temporary polygon
     */
    updateTempPolygon(coordinates) {
        if (!this.map.getSource('temp-polygon')) {
            this.map.addSource('temp-polygon', {
                type: 'geojson',
                data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[]] } }
            });

            this.map.addLayer({
                id: 'temp-polygon-layer',
                type: 'fill',
                source: 'temp-polygon',
                paint: {
                    'fill-color': '#8b5cf6',
                    'fill-opacity': 0.2
                }
            });
        }

        const closedCoords = [...coordinates, coordinates[0]];
        this.map.getSource('temp-polygon').setData({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [closedCoords] }
        });
    }

    /**
     * Update measure line with distance label
     */
    updateMeasureLine(coordinates, distance) {
        this.updateTempLine(coordinates);

        // Format distance
        const formatted = distance > 1000
            ? `${(distance / 1000).toFixed(2)} km`
            : `${distance.toFixed(0)} m`;

        console.log(`Distance: ${formatted}`);
    }

    /**
     * Clear temporary drawings
     */
    clearTempDrawings() {
        if (this.map.getSource('temp-markers')) {
            this.map.getSource('temp-markers').setData({
                type: 'FeatureCollection',
                features: []
            });
        }
        if (this.map.getSource('temp-line')) {
            this.map.getSource('temp-line').setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [] }
            });
        }
        if (this.map.getSource('temp-polygon')) {
            this.map.getSource('temp-polygon').setData({
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [[]] }
            });
        }
    }

    /**
     * Clear all drawings
     */
    clearAll() {
        this.drawings = [];
        this.clearTempDrawings();

        if (this.map.getSource('drawings')) {
            this.map.getSource('drawings').setData({
                type: 'FeatureCollection',
                features: []
            });
        }
    }

    /**
     * Export drawings as GeoJSON
     */
    exportGeoJSON() {
        return {
            type: 'FeatureCollection',
            features: this.drawings
        };
    }
}
