# Evo Map SDK

Easy-to-use map integration for JavaScript projects. Built on MapLibre GL.

##  Quick Start

### Installation

```bash
npm install evo-map-sdk maplibre-gl
```

### Basic Usage

```javascript
import EvoMap from 'evo-map-sdk';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new EvoMap({
  container: 'map',
  apiUrl: 'http://localhost:3000/api/v1/map',
  center: [77.2090, 28.6139], // New Delhi
  zoom: 14
});
```

### HTML

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://unpkg.com/maplibre-gl@3/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    #map { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  
  <script type="module">
    import EvoMap from './sdk/src/index.js';
    
    const map = new EvoMap({
      container: 'map',
      apiUrl: 'http://localhost:3000/api/v1/map'
    });
  </script>
</body>
</html>
```

##  API Reference

### Constructor Options

```javascript
new EvoMap({
  // Required
  container: 'map',              // Element ID or DOM element
  apiUrl: 'http://your-api-url', // Your Evo Map API URL
  
  // Optional
  center: [lng, lat],            // Initial center (default: [77.2090, 28.6139])
  zoom: 14,                      // Initial zoom (default: 14)
  showBasemap: true,             // Show base map tiles (default: true)
  basemapUrl: 'https://...',     // Custom basemap URL
  
  // Layer visibility
  layers: {
    nodes: true,                 // Show nodes layer
    ways: true,                  // Show ways layer
    areas: true                  // Show areas layer
  },
  
  // Custom styling
  style: {
    backgroundColor: '#f8f9fa',
    nodeColor: '#ef4444',
    nodeRadius: 8,
    nodeStrokeColor: '#ffffff',
    nodeStrokeWidth: 2,
    wayColor: '#f59e0b',
    wayWidth: 3,
    areaColor: 'rgba(34, 197, 94, 0.3)',
    areaOutlineColor: '#22c55e'
  }
})
```

### Methods

#### `setLayerVisibility(layerId, visible)`
Show or hide a layer.

```javascript
map.setLayerVisibility('nodes', false); // Hide nodes
map.setLayerVisibility('ways', true);   // Show ways
```

#### `toggleLayer(layerId)`
Toggle layer visibility.

```javascript
map.toggleLayer('areas'); // Toggle areas layer
```

#### `on(event, handler)`
Add event listener.

```javascript
map.on('load', (mapInstance) => {
  console.log('Map loaded!');
});

map.on('click', (e) => {
  console.log('Clicked at:', e.lngLat);
});
```

#### `flyTo(center, zoom, options)`
Animate to a location.

```javascript
map.flyTo([77.2295, 28.6129], 16, { duration: 2000 });
```

#### `fetchData(bbox, layers)`
Fetch raw data from API.

```javascript
const data = await map.fetchData('77.1,28.5,77.3,28.7', ['nodes', 'ways']);
console.log(data);
```

#### `getMap()`
Get the underlying MapLibre GL instance.

```javascript
const maplibreInstance = map.getMap();
maplibreInstance.addControl(new maplibregl.NavigationControl());
```

#### `destroy()`
Clean up and remove the map.

```javascript
map.destroy();
```

##  Examples

### React Integration

```jsx
import { useEffect, useRef } from 'react';
import EvoMap from 'evo-map-sdk';
import 'maplibre-gl/dist/maplibre-gl.css';

function MapComponent() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new EvoMap({
      container: mapContainer.current,
      apiUrl: 'http://localhost:3000/api/v1/map',
      center: [77.2090, 28.6139],
      zoom: 14
    });

    return () => {
      map.current?.destroy();
    };
  }, []);

  return <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />;
}
```

### Vue Integration

```vue
<template>
  <div ref="mapContainer" style="width: 100%; height: 100vh"></div>
</template>

<script>
import EvoMap from 'evo-map-sdk';
import 'maplibre-gl/dist/maplibre-gl.css';

export default {
  mounted() {
    this.map = new EvoMap({
      container: this.$refs.mapContainer,
      apiUrl: 'http://localhost:3000/api/v1/map',
      center: [77.2090, 28.6139],
      zoom: 14
    });
  },
  beforeUnmount() {
    this.map?.destroy();
  }
}
</script>
```

### Custom Styling

```javascript
const map = new EvoMap({
  container: 'map',
  apiUrl: 'http://localhost:3000/api/v1/map',
  style: {
    nodeColor: '#8b5cf6',      // Purple nodes
    nodeRadius: 10,
    wayColor: '#06b6d4',       // Cyan ways
    wayWidth: 4,
    areaColor: 'rgba(251, 146, 60, 0.2)', // Orange areas
    areaOutlineColor: '#fb923c'
  }
});
```

### Event Handling

```javascript
const map = new EvoMap({
  container: 'map',
  apiUrl: 'http://localhost:3000/api/v1/map'
});

map.on('load', () => {
  console.log('Map is ready!');
});

map.on('click', (e) => {
  console.log(`Clicked at: ${e.lngLat.lng}, ${e.lngLat.lat}`);
});

map.on('mousemove', (e) => {
  console.log('Mouse position:', e.lngLat);
});
```

##  Configuration

### Using Custom Basemap

```javascript
const map = new EvoMap({
  container: 'map',
  apiUrl: 'http://localhost:3000/api/v1/map',
  basemapUrl: 'https://your-custom-tiles/{z}/{x}/{y}.png'
});
```

### No Basemap (Only Custom Data)

```javascript
const map = new EvoMap({
  container: 'map',
  apiUrl: 'http://localhost:3000/api/v1/map',
  showBasemap: false
});
```

##  What's Included

- **EvoMap Class**: Main SDK class with full API
- **MapLibre GL Integration**: Built on industry-standard mapping library
- **Layer Management**: Easy show/hide controls for nodes, ways, and areas
- **Event System**: Full event handling support
- **Custom Styling**: Comprehensive styling options
- **TypeScript Support**: Type definitions included (coming soon)

##  Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

##  License

MIT

##  Contributing

Contributions are welcome! Please open an issue or submit a pull request.

##  Support

For issues and questions, please open an issue on GitHub.
