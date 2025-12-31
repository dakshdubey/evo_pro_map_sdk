import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import Toolbar from './components/Toolbar';
import LayerPanel from './components/LayerPanel';
import { DrawingManager } from './utils/DrawingManager';
import { getTileUrl, buildSearchUrl } from './config/urls';

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const drawingManager = useRef(null);
  const locationWatchId = useRef(null);
  const locationMarker = useRef(null);

  const [activeTool, setActiveTool] = useState('select');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [mapTheme, setMapTheme] = useState('light');
  const [globeEnabled, setGlobeEnabled] = useState(true);
  const [layers, setLayers] = useState([
    { id: 'nodes', name: 'Venues & Points', visible: true },
    { id: 'ways', name: 'Roads & Paths', visible: true },
    { id: 'areas', name: 'Buildings & Areas', visible: true }
  ]);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'basemap': {
            type: 'raster',
            tiles: [getTileUrl('light')],
            tileSize: 256,
            attribution: ''
          },
          'eventofu': {
            type: 'vector',
            tiles: ['http://localhost:3000/api/v1/map/tiles/{z}/{x}/{y}.mvt'],
            minzoom: 0,
            maxzoom: 22
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#f8f9fa' }
          },
          {
            id: 'basemap-tiles',
            type: 'raster',
            source: 'basemap',
            minzoom: 0,
            maxzoom: 19
          },
          {
            id: 'evo-areas',
            type: 'fill',
            source: 'eventofu',
            'source-layer': 'areas',
            paint: {
              'fill-color': 'rgba(34, 197, 94, 0.3)',
              'fill-outline-color': '#22c55e'
            }
          },
          {
            id: 'evo-ways',
            type: 'line',
            source: 'eventofu',
            'source-layer': 'ways',
            paint: {
              'line-color': '#f59e0b',
              'line-width': 3
            }
          },
          {
            id: 'evo-nodes',
            type: 'circle',
            source: 'eventofu',
            'source-layer': 'nodes',
            paint: {
              'circle-radius': 8,
              'circle-color': '#ef4444',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          }
        ]
      },
      center: [77.2090, 28.6139],
      zoom: 14,
      projection: 'globe' // 3D Earth shape
    });

    // Enable globe atmosphere
    map.current.on('style.load', () => {
      map.current.setFog({
        'range': [0.8, 8],
        'color': '#ffffff',
        'horizon-blend': 0.5,
        'high-color': '#245bde',
        'space-color': '#000000',
        'star-intensity': 0.15
      });
    });

    // Initialize drawing manager
    map.current.on('load', () => {
      drawingManager.current = new DrawingManager(map.current);
    });

    map.current.on('click', (e) => {
      if (activeTool === 'select') {
        console.log('Map clicked:', e.lngLat);
      }
    });

  }, []);

  // Handle layer visibility
  useEffect(() => {
    if (!map.current) return;
    layers.forEach(layer => {
      if (map.current.getLayer(`evo-${layer.id}`)) {
        map.current.setLayoutProperty(
          `evo-${layer.id}`,
          'visibility',
          layer.visible ? 'visible' : 'none'
        );
      }
    });
  }, [layers]);

  // Handle theme changes
  useEffect(() => {
    if (!map.current) return;

    if (map.current.getSource('basemap')) {
      map.current.getSource('basemap').tiles = [getTileUrl(mapTheme)];
      map.current.style.sourceCaches['basemap'].clearTiles();
      map.current.style.sourceCaches['basemap'].update(map.current.transform);
      map.current.triggerRepaint();
    }
  }, [mapTheme]);

  // Handle tool changes
  const handleToolChange = (toolId) => {
    setActiveTool(toolId);

    if (!map.current || !drawingManager.current) return;

    // Reset cursor
    map.current.getCanvas().style.cursor = toolId === 'select' ? 'grab' : 'crosshair';

    switch (toolId) {
      case 'globe':
        const newProjection = globeEnabled ? 'mercator' : 'globe';
        map.current.setProjection(newProjection);
        setGlobeEnabled(!globeEnabled);
        setActiveTool('select');
        break;

      case 'draw_point':
        drawingManager.current.startDrawPoint((point) => {
          console.log('Point created:', point);
          setActiveTool('select');
        });
        break;

      case 'draw_line':
        drawingManager.current.startDrawLine((line) => {
          console.log('Line created:', line);
          alert(`Path created! Length: ${(line.properties.length / 1000).toFixed(2)} km`);
          setActiveTool('select');
        });
        break;

      case 'draw_poly':
        drawingManager.current.startDrawPolygon((polygon) => {
          console.log('Polygon created:', polygon);
          const area = polygon.properties.area;
          const areaKm = (area / 1000000).toFixed(2);
          alert(`Area created! Size: ${areaKm} km²`);
          setActiveTool('select');
        });
        break;

      case 'measure':
        drawingManager.current.startMeasure(({ distance, points }) => {
          const formatted = distance > 1000
            ? `${(distance / 1000).toFixed(2)} km`
            : `${distance.toFixed(0)} m`;
          console.log(`Measured distance: ${formatted}`);
        });
        break;

      case 'search':
        const query = prompt('Enter location to search:');
        if (query) {
          searchLocation(query);
        }
        setActiveTool('select');
        break;

      case 'export':
        exportData();
        setActiveTool('select');
        break;

      case 'screenshot':
        takeScreenshot();
        setActiveTool('select');
        break;

      case 'fullscreen':
        toggleFullscreen();
        setActiveTool('select');
        break;

      case 'clear':
        if (confirm('Clear all drawings?')) {
          drawingManager.current.clearAll();
        }
        setActiveTool('select');
        break;

      default:
        break;
    }
  };

  // Location tracking
  const toggleLocationTracking = () => {
    if (locationEnabled) {
      // Stop tracking
      if (locationWatchId.current) {
        navigator.geolocation.clearWatch(locationWatchId.current);
        locationWatchId.current = null;
      }
      if (locationMarker.current) {
        locationMarker.current.remove();
        locationMarker.current = null;
      }
      setLocationEnabled(false);
    } else {
      // Start tracking
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
      }

      locationWatchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Update or create marker
          if (!locationMarker.current) {
            const el = document.createElement('div');
            el.className = 'location-marker';
            el.innerHTML = '📍';
            el.style.fontSize = '24px';

            locationMarker.current = new maplibregl.Marker({ element: el })
              .setLngLat([longitude, latitude])
              .addTo(map.current);

            // Fly to user location
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 16,
              duration: 2000
            });
          } else {
            locationMarker.current.setLngLat([longitude, latitude]);
          }

          console.log(`Location: ${latitude}, ${longitude} (±${accuracy}m)`);
        },
        (error) => {
          console.error('Location error:', error);
          alert('Unable to get your location. Please enable location services.');
          setLocationEnabled(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );

      setLocationEnabled(true);
    }
  };

  // Search location (simple geocoding placeholder)
  const searchLocation = async (query) => {
    try {
      const response = await fetch(buildSearchUrl(query));
      const results = await response.json();

      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        map.current.flyTo({
          center: [parseFloat(lon), parseFloat(lat)],
          zoom: 14,
          duration: 2000
        });
        alert(`Found: ${display_name}`);
      } else {
        alert('Location not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed');
    }
  };

  // Export data
  const exportData = () => {
    if (!drawingManager.current) return;

    const geojson = drawingManager.current.exportGeoJSON();
    const dataStr = JSON.stringify(geojson, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `evo-map-export-${Date.now()}.geojson`;
    link.click();

    URL.revokeObjectURL(url);
    alert('Data exported successfully!');
  };

  // Take screenshot
  const takeScreenshot = () => {
    const canvas = map.current.getCanvas();
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evo-map-screenshot-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      alert('Screenshot saved!');
    });
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainer.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleLayer = (id) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  return (
    <div className="App">
      <Toolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onLocationToggle={toggleLocationTracking}
        locationEnabled={locationEnabled}
        mapTheme={mapTheme}
        onThemeChange={setMapTheme}
      />
      <LayerPanel layers={layers} onLayerToggle={toggleLayer} />
      <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />

      {/* Evo Map Branding */}
      <div className="evo-branding">
        <span className="evo-logo">🗺️</span>
        <span className="evo-text">Evo Map</span>
      </div>
    </div>
  );
}

export default App;

