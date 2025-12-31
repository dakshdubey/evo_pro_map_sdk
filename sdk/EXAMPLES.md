# Evo Map SDK - Integration Examples

##  Installation

First, install the SDK and its peer dependency:

```bash
npm install evo-map-sdk maplibre-gl
```

##  Vanilla JavaScript

### Simple HTML Page

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
    import EvoMap from 'evo-map-sdk';
    
    const map = new EvoMap({
      container: 'map',
      apiUrl: 'http://localhost:3000/api/v1/map',
      center: [77.2090, 28.6139],
      zoom: 14
    });

    map.on('click', (e) => {
      console.log('Clicked:', e.lngLat);
    });
  </script>
</body>
</html>
```

##  React

### Functional Component with Hooks

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
      apiUrl: 'http://localhost:3000/api/v1/map'
    });

    return () => map.current?.destroy();
  }, []);

  return <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />;
}
```

### With Layer Controls

```jsx
import { useEffect, useRef, useState } from 'react';
import EvoMap from 'evo-map-sdk';

function MapWithControls() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [layers, setLayers] = useState({
    nodes: true,
    ways: true,
    areas: true
  });

  useEffect(() => {
    if (map.current) return;
    map.current = new EvoMap({
      container: mapContainer.current,
      apiUrl: 'http://localhost:3000/api/v1/map'
    });
    return () => map.current?.destroy();
  }, []);

  const toggleLayer = (layerId) => {
    const newState = !layers[layerId];
    setLayers(prev => ({ ...prev, [layerId]: newState }));
    map.current?.setLayerVisibility(layerId, newState);
  };

  return (
    <div>
      <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <button onClick={() => toggleLayer('nodes')}>
          {layers.nodes ? 'Hide' : 'Show'} Nodes
        </button>
      </div>
    </div>
  );
}
```

##  Vue 3

### Composition API

```vue
<template>
  <div ref="mapContainer" style="width: 100%; height: 100vh"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import EvoMap from 'evo-map-sdk';
import 'maplibre-gl/dist/maplibre-gl.css';

const mapContainer = ref(null);
let map = null;

onMounted(() => {
  map = new EvoMap({
    container: mapContainer.value,
    apiUrl: 'http://localhost:3000/api/v1/map',
    center: [77.2090, 28.6139],
    zoom: 14
  });

  map.on('load', () => {
    console.log('Map loaded!');
  });
});

onBeforeUnmount(() => {
  map?.destroy();
});
</script>
```

### Options API

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
      apiUrl: 'http://localhost:3000/api/v1/map'
    });
  },
  beforeUnmount() {
    this.map?.destroy();
  }
}
</script>
```

##  Angular

### Component

```typescript
import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import EvoMap from 'evo-map-sdk';
import 'maplibre-gl/dist/maplibre-gl.css';

@Component({
  selector: 'app-map',
  template: '<div #mapContainer style="width: 100%; height: 100vh"></div>'
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  private map?: EvoMap;

  ngOnInit() {
    this.map = new EvoMap({
      container: this.mapContainer.nativeElement,
      apiUrl: 'http://localhost:3000/api/v1/map',
      center: [77.2090, 28.6139],
      zoom: 14
    });
  }

  ngOnDestroy() {
    this.map?.destroy();
  }
}
```

##  Custom Styling

```javascript
const map = new EvoMap({
  container: 'map',
  apiUrl: 'http://localhost:3000/api/v1/map',
  style: {
    // Background
    backgroundColor: '#1a1a1a',
    
    // Nodes (Points)
    nodeColor: '#8b5cf6',
    nodeRadius: 10,
    nodeStrokeColor: '#ffffff',
    nodeStrokeWidth: 2,
    
    // Ways (Roads)
    wayColor: '#06b6d4',
    wayWidth: 4,
    
    // Areas (Regions)
    areaColor: 'rgba(251, 146, 60, 0.2)',
    areaOutlineColor: '#fb923c'
  }
});
```

##  Advanced Usage

### Fetching Data

```javascript
const map = new EvoMap({
  container: 'map',
  apiUrl: 'http://localhost:3000/api/v1/map'
});

map.on('load', async () => {
  const bounds = map.getBounds();
  const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
  
  const data = await map.fetchData(bbox, ['nodes', 'ways']);
  console.log('Fetched data:', data);
});
```

### Event Handling

```javascript
const map = new EvoMap({
  container: 'map',
  apiUrl: 'http://localhost:3000/api/v1/map'
});

// Map loaded
map.on('load', () => {
  console.log('Map is ready!');
});

// Click events
map.on('click', (e) => {
  console.log(`Clicked at: ${e.lngLat.lng}, ${e.lngLat.lat}`);
});

// Mouse move
map.on('mousemove', (e) => {
  console.log('Mouse position:', e.lngLat);
});

// Zoom events
const mapInstance = map.getMap();
mapInstance.on('zoomend', () => {
  console.log('Zoom level:', mapInstance.getZoom());
});
```

### Using MapLibre GL Directly

```javascript
const evoMap = new EvoMap({
  container: 'map',
  apiUrl: 'http://localhost:3000/api/v1/map'
});

// Get the underlying MapLibre GL instance
const maplibreMap = evoMap.getMap();

// Add navigation controls
maplibreMap.addControl(new maplibregl.NavigationControl());

// Add geolocate control
maplibreMap.addControl(new maplibregl.GeolocateControl());

// Add custom markers
new maplibregl.Marker()
  .setLngLat([77.2090, 28.6139])
  .addTo(maplibreMap);
```

## 🌍 Different Basemaps

### Satellite View

```javascript
const map = new EvoMap({
  container: 'map',
  apiUrl: 'http://localhost:3000/api/v1/map',
  basemapUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
});
```

### Dark Mode

```javascript
const map = new EvoMap({
  container: 'map',
  apiUrl: 'http://localhost:3000/api/v1/map',
  basemapUrl: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
});
```

### No Basemap

```javascript
const map = new EvoMap({
  container: 'map',
  apiUrl: 'http://localhost:3000/api/v1/map',
  showBasemap: false
});
```
