import React, { useEffect, useRef, useState } from 'react';
import EvoMap from '../../src/index.js';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Evo Map React Component Example
 * 
 * This example shows how to integrate Evo Map SDK in a React application
 */
function MapComponent() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [layers, setLayers] = useState({
        nodes: true,
        ways: true,
        areas: true
    });

    // Initialize map
    useEffect(() => {
        if (map.current) return; // Initialize only once

        map.current = new EvoMap({
            container: mapContainer.current,
            apiUrl: 'http://localhost:3000/api/v1/map',
            center: [77.2090, 28.6139], // New Delhi
            zoom: 14,
            style: {
                nodeColor: '#ef4444',
                nodeRadius: 8,
                wayColor: '#f59e0b',
                wayWidth: 3,
                areaColor: 'rgba(34, 197, 94, 0.3)',
                areaOutlineColor: '#22c55e'
            }
        });

        // Map load event
        map.current.on('load', () => {
            console.log('✅ Map loaded!');
            setMapLoaded(true);
        });

        // Map click event
        map.current.on('click', (e) => {
            console.log(`📍 Clicked at: ${e.lngLat.lng.toFixed(4)}, ${e.lngLat.lat.toFixed(4)}`);
        });

        // Cleanup on unmount
        return () => {
            map.current?.destroy();
        };
    }, []);

    // Toggle layer visibility
    const toggleLayer = (layerId) => {
        const newVisibility = !layers[layerId];
        setLayers(prev => ({ ...prev, [layerId]: newVisibility }));
        map.current?.setLayerVisibility(layerId, newVisibility);
    };

    // Fly to location
    const flyToLocation = (lng, lat, zoom = 16) => {
        map.current?.flyTo([lng, lat], zoom, { duration: 2000 });
    };

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            {/* Map Container */}
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

            {/* Controls Panel */}
            <div style={styles.controls}>
                <h3 style={styles.title}>Layer Controls</h3>

                <label style={styles.label}>
                    <input
                        type="checkbox"
                        checked={layers.nodes}
                        onChange={() => toggleLayer('nodes')}
                        style={styles.checkbox}
                    />
                    Show Nodes (Points)
                </label>

                <label style={styles.label}>
                    <input
                        type="checkbox"
                        checked={layers.ways}
                        onChange={() => toggleLayer('ways')}
                        style={styles.checkbox}
                    />
                    Show Ways (Roads)
                </label>

                <label style={styles.label}>
                    <input
                        type="checkbox"
                        checked={layers.areas}
                        onChange={() => toggleLayer('areas')}
                        style={styles.checkbox}
                    />
                    Show Areas (Regions)
                </label>

                <button
                    onClick={() => flyToLocation(77.2295, 28.6129)}
                    style={styles.button}
                >
                    Fly to India Gate
                </button>

                <button
                    onClick={() => flyToLocation(77.2167, 28.6315)}
                    style={styles.button}
                >
                    Fly to Connaught Place
                </button>
            </div>

            {/* Info Panel */}
            <div style={styles.info}>
                <strong>Evo Map SDK - React Example</strong><br />
                Status: {mapLoaded ? '✅ Loaded' : '⏳ Loading...'}
            </div>
        </div>
    );
}

// Inline styles
const styles = {
    controls: {
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        minWidth: '200px'
    },
    title: {
        margin: '0 0 15px 0',
        fontSize: '16px',
        color: '#333'
    },
    label: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#666',
        marginBottom: '10px'
    },
    checkbox: {
        marginRight: '8px'
    },
    button: {
        width: '100%',
        padding: '8px 16px',
        marginTop: '10px',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    info: {
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        fontSize: '12px',
        color: '#666'
    }
};

export default MapComponent;
