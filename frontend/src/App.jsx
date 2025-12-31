import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import Toolbar from './components/Toolbar';
import LayerPanel from './components/LayerPanel';

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [activeTool, setActiveTool] = useState('select');
  const [layers, setLayers] = useState([
    { id: 'nodes', name: 'Venues & Points', visible: true },
    { id: 'ways', name: 'Roads & Paths', visible: true },
    { id: 'areas', name: 'Buildings & Areas', visible: true }
  ]);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
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
            id: 'areas',
            type: 'fill',
            source: 'eventofu',
            'source-layer': 'areas',
            paint: {
              'fill-color': '#e2e8f0',
              'fill-outline-color': '#cbd5e1'
            }
          },
          {
            id: 'ways',
            type: 'line',
            source: 'eventofu',
            'source-layer': 'ways',
            paint: {
              'line-color': '#94a3b8',
              'line-width': 2
            }
          },
          {
            id: 'nodes',
            type: 'circle',
            source: 'eventofu',
            'source-layer': 'nodes',
            paint: {
              'circle-radius': 6,
              'circle-color': '#3b82f6',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          }
        ]
      },
      center: [77.2090, 28.6139],
      zoom: 14
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    map.current.on('click', (e) => {
      console.log('Map clicked:', e.lngLat);
    });

  }, []);

  useEffect(() => {
    if (!map.current) return;
    layers.forEach(layer => {
      if (map.current.getLayer(layer.id)) {
        map.current.setLayoutProperty(
          layer.id,
          'visibility',
          layer.visible ? 'visible' : 'none'
        );
      }
    });
  }, [layers]);

  const handleToolChange = (toolId) => {
    setActiveTool(toolId);
    if (map.current) {
      map.current.getCanvas().style.cursor = toolId === 'select' ? 'grab' : 'crosshair';
    }
  };

  const toggleLayer = (id) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  return (
    <div className="App">
      <Toolbar activeTool={activeTool} onToolChange={handleToolChange} />
      <LayerPanel layers={layers} onLayerToggle={toggleLayer} />
      <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />
    </div>
  );
}

export default App;
