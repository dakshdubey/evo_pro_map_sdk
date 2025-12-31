const MAX_EXTENT = 20037508.342789244;

function tileToBBox(z, x, y) {
    const tileWidth = (MAX_EXTENT * 2) / Math.pow(2, z);
    const minX = -MAX_EXTENT + x * tileWidth;
    const minY = MAX_EXTENT - (y + 1) * tileWidth; // Mercator Y is reversed? No, Google tile Y goes down.
    // Google/OSM: Y grows downwards. Lat grows upwards.
    // Web Mercator Y grows upwards (North).
    // Tile Y 0 is at Top (North).
    // So minY in Web Mercator is top of the map - (y+1) tiles.

    // Actually standard conversion:
    // n = 2 ^ zoom
    // lon_deg = x / n * 360.0 - 180.0
    // lat_rad = arctan(sinh(pi * (1 - 2 * y / n)))
    // lat_deg = lat_rad * 180.0 / pi

    // But we need meters (EPSG:3857).
    // Origin (-20037508.34, 20037508.34) is Top Left?
    // 3857 X: Left to Right. Y: Bottom to Top.
    // Google Tile Y: Top to Bottom.

    // So:
    // minX = -MAX + (x/2^z) * 2*MAX
    // maxX = -MAX + ((x+1)/2^z) * 2*MAX

    // maxY = MAX - (y/2^z) * 2*MAX
    // minY = MAX - ((y+1)/2^z) * 2*MAX

    const maxX = -MAX_EXTENT + (x + 1) * tileWidth;
    const maxY = MAX_EXTENT - y * tileWidth;

    return { minX, minY, maxX, maxY };
}

module.exports = { tileToBBox };
