"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { MapPin, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface StaticTileMapProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
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

// Web Mercator: lat/lng → absolute pixel position at given zoom
function latLngToPixel(lat: number, lng: number, zoom: number, tileSize: number) {
  const n = tileSize * Math.pow(2, zoom);
  const x = (lng + 180) / 360 * n;
  const latRad = (lat * Math.PI) / 180;
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
  return { x, y };
}

export default function StaticTileMap({
  center,
  zoom: initialZoom = 16,
  height = 450,
  markers = [],
  className = "",
}: StaticTileMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [zoom, setZoom] = useState(initialZoom);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const tileSize = 256;

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(Math.floor(entry.contentRect.width));
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const gridCols = Math.ceil(containerWidth / tileSize) + 2;
  const gridRows = Math.ceil(height / tileSize) + 2;

  // Center pixel position
  const centerPixel = useMemo(
    () => latLngToPixel(center[0], center[1], zoom, tileSize),
    [center, zoom, tileSize]
  );

  // Top-left tile origin so centerPixel is in the middle of the viewport
  const originX = useMemo(
    () => centerPixel.x - (gridCols * tileSize) / 2,
    [centerPixel, gridCols, tileSize]
  );
  const originY = useMemo(
    () => centerPixel.y - (gridRows * tileSize) / 2,
    [centerPixel, gridRows, tileSize]
  );

  // Generate tile URLs
  const tiles = useMemo(() => {
    const startTileX = Math.floor(originX / tileSize);
    const startTileY = Math.floor(originY / tileSize);
    const result: Array<{ url: string; px: number; py: number; key: string }> = [];

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const tileX = startTileX + col;
        const tileY = startTileY + row;
        const url = `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tileX}/${tileY}@2x.png`;
        result.push({
          url,
          px: tileX * tileSize - originX,
          py: tileY * tileSize - originY,
          key: `${zoom}-${tileX}-${tileY}`,
        });
      }
    }
    return result;
  }, [originX, originY, zoom, gridCols, gridRows, tileSize]);

  // Marker pixel positions (relative to viewport)
  const markerPositions = useMemo(() => {
    return markers.map((m) => {
      const px = latLngToPixel(m.lat, m.lng, zoom, tileSize);
      return {
        ...m,
        screenX: px.x - originX,
        screenY: px.y - originY,
      };
    });
  }, [markers, zoom, tileSize, originX, originY]);

  const handleZoomIn = () => setZoom((z) => Math.min(19, z + 1));
  const handleZoomOut = () => setZoom((z) => Math.max(10, z - 1));
  const handleReset = () => setZoom(initialZoom);

  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 ${className}`}>
      <div className="relative" style={{ width: "100%", height, overflow: "hidden" }}>
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
              <button onClick={() => { setLoadError(false); setIsLoaded(false); }} className="text-xs text-blue-500 hover:text-blue-600 underline">
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
              loading="eager"
              onLoad={() => setIsLoaded(true)}
              onError={() => setLoadError(true)}
              className="absolute"
              style={{ left: tile.px, top: tile.py, width: tileSize, height: tileSize }}
              draggable={false}
            />
          ))}

          {/* Markers */}
          {isLoaded && markerPositions.map((m) => (
            <div
              key={m.id}
              className="absolute group z-10"
              style={{ left: m.screenX, top: m.screenY, transform: "translate(-50%, -100%)" }}
            >
              <MapPin
                className="h-7 w-7 drop-shadow-lg transition-transform group-hover:scale-125"
                style={{ color: m.color || "#ef4444" }}
                fill={m.color || "#ef4444"}
                strokeWidth={0}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap font-medium">
                  {m.label}
                </div>
              </div>
            </div>
          ))}

          {/* Center crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-5">
            <div className="w-4 h-4 border-2 border-red-500/60 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-red-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
        <button onClick={handleZoomIn} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
          <ZoomIn className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <button onClick={handleZoomOut} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
          <ZoomOut className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <button onClick={handleReset} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
          <Maximize2 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Coordinates */}
      <div className="absolute top-3 left-3 z-20">
        <div className="bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <span className="text-[11px] font-mono text-gray-600 dark:text-gray-300">
            {center[0].toFixed(4)}°N, {center[1].toFixed(4)}°E • Zoom {zoom}
          </span>
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-1 left-1 z-20">
        <span className="text-[10px] bg-white/80 dark:bg-gray-800/80 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
          © <a href="https://carto.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-200">CARTO</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-200">OpenStreetMap</a>
        </span>
      </div>
    </div>
  );
}
