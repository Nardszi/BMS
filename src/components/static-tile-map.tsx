"use client";

import { useState, useMemo } from "react";
import { MapPin, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface StaticTileMapProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
  width?: number;
  height?: number;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    label: string;
    color?: string;
  }>;
  className?: string;
}

// Convert lat/lng to tile coordinates (slippy map tiles)
function latLngToTile(lat: number, lng: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

// Convert tile coordinates back to lat/lng (top-left corner)
function tileToLatLng(x: number, y: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

// Get pixel position for a marker within the tile grid
function getMarkerPixelPosition(
  markerLat: number,
  markerLng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  tileSize: number,
  gridWidth: number,
  gridHeight: number
) {
  const centerTile = latLngToTile(centerLat, centerLng, zoom);
  const markerTile = latLngToTile(markerLat, markerLng, zoom);

  // Fractional tile position relative to center
  const dx = (markerLng - centerLng) / (360 / Math.pow(2, zoom));
  const latRad = (markerLat * Math.PI) / 180;
  const dy = -(markerLat - centerLat) / (360 / Math.pow(2, zoom) * Math.cos(latRad) * (Math.PI / 180));

  const pixelX = gridWidth / 2 + dx * tileSize;
  const pixelY = gridHeight / 2 + dy * tileSize;

  return { x: pixelX, y: pixelY };
}

export default function StaticTileMap({
  center,
  zoom: initialZoom = 15,
  width = 800,
  height = 500,
  markers = [],
  className = "",
}: StaticTileMapProps) {
  const [zoom, setZoom] = useState(initialZoom);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const tileSize = 256;
  const gridCols = Math.ceil(width / tileSize) + 2;
  const gridRows = Math.ceil(height / tileSize) + 2;

  const centerTile = useMemo(() => latLngToTile(center[0], center[1], zoom), [center, zoom]);

  // Generate tile URLs in a grid
  const tiles = useMemo(() => {
    const result: Array<{ url: string; x: number; y: number; key: string }> = [];
    const startX = centerTile.x - Math.floor(gridCols / 2);
    const startY = centerTile.y - Math.floor(gridRows / 2);

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const tileX = startX + col;
        const tileY = startY + row;
        // CartoDB basemaps - more permissive CORS policy than OSM
        const url = `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tileX}/${tileY}@2x.png`;
        result.push({
          url,
          x: col * tileSize,
          y: row * tileSize,
          key: `${zoom}-${tileX}-${tileY}`,
        });
      }
    }
    return result;
  }, [centerTile, zoom, gridCols, gridRows, tileSize]);

  // Calculate marker positions
  const markerPositions = useMemo(() => {
    return markers.map((marker) => {
      const pos = getMarkerPixelPosition(
        marker.lat,
        marker.lng,
        center[0],
        center[1],
        zoom,
        tileSize,
        gridCols * tileSize,
        gridRows * tileSize
      );
      return { ...marker, pixelX: pos.x, pixelY: pos.y };
    });
  }, [markers, center, zoom, tileSize, gridCols, gridRows]);

  const handleZoomIn = () => setZoom((z) => Math.min(19, z + 1));
  const handleZoomOut = () => setZoom((z) => Math.max(10, z - 1));
  const handleReset = () => setZoom(initialZoom);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 ${className}`}>
      {/* Tile Grid */}
      <div
        className="relative"
        style={{ width, height, overflow: "hidden" }}
      >
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading map tiles...</p>
            </div>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <MapPin className="h-10 w-10 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Unable to load map tiles</p>
              <button
                onClick={() => { setLoadError(false); setIsLoaded(false); }}
                className="text-xs text-blue-500 hover:text-blue-600 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="relative" style={{ width: gridCols * tileSize, height: gridRows * tileSize }}>
          {tiles.map((tile) => (
              <img
                key={tile.key}
                src={tile.url}
                alt=""
                loading="lazy"
                crossOrigin="anonymous"
                onLoad={() => setIsLoaded(true)}
                onError={() => setLoadError(true)}
              className="absolute"
              style={{
                left: tile.x,
                top: tile.y,
                width: tileSize,
                height: tileSize,
              }}
              draggable={false}
            />
          ))}

          {/* Markers overlay */}
          {isLoaded && markerPositions.map((marker) => (
            <div
              key={marker.id}
              className="absolute group"
              style={{
                left: marker.pixelX,
                top: marker.pixelY,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div
                className="relative cursor-pointer"
                title={marker.label}
              >
                <MapPin
                  className="h-6 w-6 drop-shadow-lg"
                  style={{ color: marker.color || "#ef4444" }}
                  fill={marker.color || "#ef4444"}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    {marker.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
        <button
          onClick={handleZoomIn}
          className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
        >
          <ZoomIn className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={handleZoomOut}
          className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
        >
          <ZoomOut className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={handleReset}
          className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
        >
          <Maximize2 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-1 left-1 z-20">
        <span className="text-[10px] bg-white/80 dark:bg-gray-800/80 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
          © <a href="https://carto.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-200">CARTO</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-200">OpenStreetMap</a>
        </span>
      </div>

      {/* Coordinates display */}
      <div className="absolute top-3 left-3 z-20">
        <div className="bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <span className="text-[11px] font-mono text-gray-600 dark:text-gray-300">
            {center[0].toFixed(4)}°N, {center[1].toFixed(4)}°E
          </span>
        </div>
      </div>
    </div>
  );
}
