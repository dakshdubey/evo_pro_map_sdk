/**
 * Evo Map SDK
 * Easy-to-use map integration for JavaScript projects
 */

import maplibregl from 'maplibre-gl';

class EvoMap {
    /**
     * Initialize Evo Map
     * @param {Object} options - Configuration options
     * @param {string|HTMLElement} options.container - Container element ID or DOM element
     * @param {string} options.apiUrl - Base URL for Evo Map API (e.g., 'http://localhost:3000/api/v1/map')
     * @param {Array<number>} options.center - Initial map center [longitude, latitude]
     * @param {number} options.zoom - Initial zoom level
     * @param {Object} options.style - Custom map style options
     * @param {boolean} options.showBasemap - Show base map tiles (default: true)
     * @param {string} options.basemapUrl - Custom basemap tile URL
     * @param {Object} options.layers - Layer visibility configuration
     */
    constructor(options = {}) {
        this.options = {
            container: options.container || 'map',
            apiUrl: options.apiUrl || 'http://localhost:3000/api/v1/map',
            center: options.center || [77.2090, 28.6139],
            zoom: options.zoom || 14,
            showBasemap: options.showBasemap !== false,
            basemapUrl: options.basemapUrl || 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
            layers: {
                nodes: options.layers?.nodes !== false,
                ways: options.layers?.ways !== false,
                areas: options.layers?.areas !== false,
                ...options.layers
            },
            style: options.style || {}
        };

        this.map = null;
        this.eventHandlers = {};
        this._init();
    }

    /**
     * Initialize the map
     * @private
     */
    _init() {
        const sources = {
            'evo-tiles': {
                type: 'vector',
                tiles: [`${this.options.apiUrl}/tiles/{z}/{x}/{y}.mvt`],
                minzoom: 0,
                maxzoom: 22
            }
        };

        const layers = [
            {
                id: 'background',
                type: 'background',
                paint: { 'background-color': this.options.style.backgroundColor || '#f8f9fa' }
            }
        ];

        // Add basemap if enabled
        if (this.options.showBasemap) {
            sources['basemap'] = {
                type: 'raster',
                tiles: [this.options.basemapUrl],
                tileSize: 256,
                attribution: ''
            };

            layers.push({
                id: 'basemap-tiles',
                type: 'raster',
                source: 'basemap',
                minzoom: 0,
                maxzoom: 19
            });
        }

        // Add custom data layers
        if (this.options.layers.areas) {
            layers.push({
                id: 'evo-areas',
                type: 'fill',
                source: 'evo-tiles',
                'source-layer': 'areas',
                paint: {
                    'fill-color': this.options.style.areaColor || 'rgba(34, 197, 94, 0.3)',
                    'fill-outline-color': this.options.style.areaOutlineColor || '#22c55e'
                }
            });
        }

        if (this.options.layers.ways) {
            layers.push({
                id: 'evo-ways',
                type: 'line',
                source: 'evo-tiles',
                'source-layer': 'ways',
                paint: {
                    'line-color': this.options.style.wayColor || '#f59e0b',
                    'line-width': this.options.style.wayWidth || 3
                }
            });
        }

        if (this.options.layers.nodes) {
            layers.push({
                id: 'evo-nodes',
                type: 'circle',
                source: 'evo-tiles',
                'source-layer': 'nodes',
                paint: {
                    'circle-radius': this.options.style.nodeRadius || 8,
                    'circle-color': this.options.style.nodeColor || '#ef4444',
                    'circle-stroke-width': this.options.style.nodeStrokeWidth || 2,
                    'circle-stroke-color': this.options.style.nodeStrokeColor || '#ffffff'
                }
            });
        }

        // Initialize MapLibre GL map
        this.map = new maplibregl.Map({
            container: this.options.container,
            style: {
                version: 8,
                sources,
                layers
            },
            center: this.options.center,
            zoom: this.options.zoom
        });

        // Setup event listeners
        this.map.on('load', () => {
            if (this.eventHandlers.load) {
                this.eventHandlers.load(this.map);
            }
        });
    }

    /**
     * Show or hide a layer
     * @param {string} layerId - Layer ID ('nodes', 'ways', 'areas')
     * @param {boolean} visible - Visibility state
     */
    setLayerVisibility(layerId, visible) {
        const mapLayerId = `evo-${layerId}`;
        if (this.map.getLayer(mapLayerId)) {
            this.map.setLayoutProperty(
                mapLayerId,
                'visibility',
                visible ? 'visible' : 'none'
            );
        }
    }

    /**
     * Toggle layer visibility
     * @param {string} layerId - Layer ID ('nodes', 'ways', 'areas')
     */
    toggleLayer(layerId) {
        const mapLayerId = `evo-${layerId}`;
        if (this.map.getLayer(mapLayerId)) {
            const visibility = this.map.getLayoutProperty(mapLayerId, 'visibility');
            this.setLayerVisibility(layerId, visibility === 'none');
        }
    }

    /**
     * Add event listener
     * @param {string} event - Event name ('load', 'click', 'mousemove', etc.)
     * @param {Function} handler - Event handler function
     */
    on(event, handler) {
        if (event === 'load') {
            this.eventHandlers.load = handler;
            if (this.map.loaded()) {
                handler(this.map);
            }
        } else {
            this.map.on(event, handler);
        }
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     */
    off(event, handler) {
        if (event === 'load') {
            delete this.eventHandlers.load;
        } else {
            this.map.off(event, handler);
        }
    }

    /**
     * Fly to a location
     * @param {Array<number>} center - [longitude, latitude]
     * @param {number} zoom - Zoom level
     * @param {Object} options - Animation options
     */
    flyTo(center, zoom, options = {}) {
        this.map.flyTo({
            center,
            zoom,
            ...options
        });
    }

    /**
     * Get map bounds
     * @returns {Object} Map bounds
     */
    getBounds() {
        return this.map.getBounds();
    }

    /**
     * Fetch raw data from API
     * @param {string} bbox - Bounding box (minX,minY,maxX,maxY)
     * @param {Array<string>} layers - Layer types to fetch
     * @returns {Promise<Object>} Raw data
     */
    async fetchData(bbox, layers = ['nodes', 'ways', 'areas']) {
        const url = `${this.options.apiUrl}/data/raw?bbox=${bbox}&layers=${layers.join(',')}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Get the underlying MapLibre GL map instance
     * @returns {maplibregl.Map} MapLibre GL map instance
     */
    getMap() {
        return this.map;
    }

    /**
     * Destroy the map and clean up resources
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.eventHandlers = {};
    }
}

export default EvoMap;
