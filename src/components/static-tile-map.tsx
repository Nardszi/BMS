"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { MapPin, ZoomIn, ZoomOut, Maximize2, Satellite, Map, Trash2, Check, Users, Home, Vote, Building2, ShieldAlert, X } from "lucide-react";

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color?: string;
  population?: number;
  households?: number;
  voters?: number;
  males?: number;
  females?: number;
  businessCount?: number;
  blotterCount?: number;
}

interface StaticTileMapProps {
  center: [number, number];
  zoom?: number;
  height?: number;
  markers?: MapMarker[];
  onMapClick?: (lat: number, lng: number) => void;
  placing?: boolean;
  className?: string;
}

type TileStyle = "satellite" | "street";

const TILE_URLS: Record<TileStyle, string> = {
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  street: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
};

function latLngToPixel(lat: number, lng: number, zoom: number, tileSize: number) {
  const n = tileSize * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

function pixelToLatLng(px: number, py: number, zoom: number, tileSize: number) {
  const n = tileSize * Math.pow(2, zoom);
  const lng = (px / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * py) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

export default function StaticTileMap({
  center,
  zoom: initialZoom = 16,
  height = 450,
  markers = [],
  onMapClick,
  placing = false,
  className = "",
}: StaticTileMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [zoom, setZoom] = useState(initialZoom);
  const [style, setStyle] = useState<TileStyle>(() => {
    if (typeof window !== "undefined") {
      try {
        const s = localStorage.getItem("bms-map-style");
        if (s === "satellite" || s === "street") return s;
      } catch {}
    }
    return "satellite";
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Pan state
  const [offset, setOffset] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bms-map-offset");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return { x: 0, y: 0 };
  });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  // Placed marker preview
  const [previewMarker, setPreviewMarker] = useState<{ lat: number; lng: number } | null>(null);

  // Selected marker info popup
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const tileSize = 256;

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setContainerWidth(Math.floor(e.contentRect.width));
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const gridCols = Math.ceil(containerWidth / tileSize) + 2;
  const gridRows = Math.ceil(height / tileSize) + 2;

  // Center pixel
  const centerPixel = useMemo(() => latLngToPixel(center[0], center[1], zoom, tileSize), [center, zoom, tileSize]);

  // Origin with pan offset
  const originX = centerPixel.x - (gridCols * tileSize) / 2 - offset.x;
  const originY = centerPixel.y - (gridRows * tileSize) / 2 - offset.y;

  // Tiles
  const tiles = useMemo(() => {
    const startTileX = Math.floor(originX / tileSize);
    const startTileY = Math.floor(originY / tileSize);
    const result: Array<{ url: string; px: number; py: number; key: string }> = [];
    const tmpl = TILE_URLS[style];

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const tileX = startTileX + col;
        const tileY = startTileY + row;
        const url = tmpl.replace("{z}", String(zoom)).replace("{x}", String(tileX)).replace("{y}", String(tileY));
        result.push({
          url,
          px: tileX * tileSize - originX,
          py: tileY * tileSize - originY,
          key: `${style}-${zoom}-${tileX}-${tileY}`,
        });
      }
    }
    return result;
  }, [originX, originY, zoom, gridCols, gridRows, tileSize, style]);

  // Marker screen positions
  const markerPositions = useMemo(() => {
    return markers.map((m) => {
      const px = latLngToPixel(m.lat, m.lng, zoom, tileSize);
      return { ...m, screenX: px.x - originX, screenY: px.y - originY };
    });
  }, [markers, zoom, tileSize, originX, originY]);

  // Preview marker position
  const previewPos = useMemo(() => {
    if (!previewMarker) return null;
    const px = latLngToPixel(previewMarker.lat, previewMarker.lng, zoom, tileSize);
    return { screenX: px.x - originX, screenY: px.y - originY };
  }, [previewMarker, zoom, tileSize, originX, originY]);

  // --- Drag handlers ---
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (placing) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset, placing]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({ x: offsetStart.current.x + dx, y: offsetStart.current.y + dy });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
    localStorage.setItem("bms-map-offset", JSON.stringify(offset));
  }, [offset]);

  // --- Click handler (for placing markers) ---
  const onContainerClick = useCallback((e: React.MouseEvent) => {
    if (!onMapClick) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const pixelX = originX + clickX;
    const pixelY = originY + clickY;
    const ll = pixelToLatLng(pixelX, pixelY, zoom, tileSize);
    setPreviewMarker(ll);
  }, [onMapClick, originX, originY, zoom, tileSize]);

  const confirmPlacement = useCallback(() => {
    if (!previewMarker || !onMapClick) return;
    onMapClick(previewMarker.lat, previewMarker.lng);
    setPreviewMarker(null);
  }, [previewMarker, onMapClick]);

  const cancelPlacement = useCallback(() => {
    setPreviewMarker(null);
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(19, z + 1));
  const handleZoomOut = () => {
    setZoom((z) => Math.max(10, z - 1));
    setOffset({ x: 0, y: 0 });
    localStorage.setItem("bms-map-offset", JSON.stringify({ x: 0, y: 0 }));
  };
  const handleReset = () => {
    setZoom(initialZoom);
    setOffset({ x: 0, y: 0 });
    localStorage.setItem("bms-map-offset", JSON.stringify({ x: 0, y: 0 }));
  };
  const toggleStyle = () => {
    setStyle((s) => {
      const next = s === "satellite" ? "street" : "satellite";
      localStorage.setItem("bms-map-style", next);
      return next;
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-black ${className} ${placing ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
    >
      <div
        className="relative select-none"
        style={{ width: "100%", height, overflow: "hidden", touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onContainerClick}
      >
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading satellite tiles...</p>
            </div>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <MapPin className="h-10 w-10 text-gray-500" />
              <p className="text-sm text-gray-400">Unable to load map tiles</p>
              <button onClick={() => { setLoadError(false); setIsLoaded(false); }} className="text-xs text-blue-400 hover:text-blue-300 underline">
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

          {/* Existing markers */}
          {isLoaded && markerPositions.map((m) => (
            <div
              key={m.id}
              className={`absolute z-10 ${placing ? "" : "cursor-pointer"}`}
              style={{ left: m.screenX, top: m.screenY, transform: "translate(-50%, -100%)" }}
              onClick={(e) => {
                e.stopPropagation();
                if (!placing) setSelectedMarker(selectedMarker?.id === m.id ? null : m);
              }}
            >
              <MapPin className="h-7 w-7 drop-shadow-lg transition-transform hover:scale-125" style={{ color: m.color || "#ef4444" }} fill={m.color || "#ef4444"} strokeWidth={0} />
              {/* Always-visible label */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 pointer-events-none z-30">
                <div className="bg-black/80 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap font-bold border border-white/20">
                  {m.label}
                </div>
              </div>
            </div>
          ))}

          {/* Info popup for selected marker */}
          {isLoaded && selectedMarker && (() => {
            const px = latLngToPixel(selectedMarker.lat, selectedMarker.lng, zoom, tileSize);
            const sx = px.x - originX;
            const sy = px.y - originY;
            return (
              <div
                className="absolute z-40 pointer-events-auto"
                style={{ left: sx, top: sy, transform: "translate(-50%, calc(-100% - 40px))" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-64 relative">
                  <button
                    onClick={() => setSelectedMarker(null)}
                    className="absolute top-2 right-2 h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </button>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedMarker.color }} />
                    <h4 className="font-black text-sm text-gray-900 dark:text-white">{selectedMarker.label}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedMarker.population != null && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        <span>Pop:</span>
                        <span className="font-bold text-gray-900 dark:text-white ml-auto">{selectedMarker.population.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedMarker.households != null && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Home className="h-3.5 w-3.5 text-indigo-500" />
                        <span>HH:</span>
                        <span className="font-bold text-gray-900 dark:text-white ml-auto">{selectedMarker.households.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedMarker.voters != null && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Vote className="h-3.5 w-3.5 text-green-500" />
                        <span>Voters:</span>
                        <span className="font-bold text-gray-900 dark:text-white ml-auto">{selectedMarker.voters.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedMarker.males != null && selectedMarker.females != null && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <span>♂♀</span>
                        <span>M/F:</span>
                        <span className="font-bold text-gray-900 dark:text-white ml-auto">{selectedMarker.males}/{selectedMarker.females}</span>
                      </div>
                    )}
                    {selectedMarker.businessCount != null && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Building2 className="h-3.5 w-3.5 text-sky-500" />
                        <span>Biz:</span>
                        <span className="font-bold text-gray-900 dark:text-white ml-auto">{selectedMarker.businessCount}</span>
                      </div>
                    )}
                    {selectedMarker.blotterCount != null && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                        <span>Cases:</span>
                        <span className="font-bold text-gray-900 dark:text-white ml-auto">{selectedMarker.blotterCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 font-mono">
                    {selectedMarker.lat.toFixed(5)}°N, {selectedMarker.lng.toFixed(5)}°E
                  </div>
                  {/* Arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-700 rotate-45" />
                </div>
              </div>
            );
          })()}

          {/* Preview marker (placing mode) */}
          {isLoaded && previewPos && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{ left: previewPos.screenX, top: previewPos.screenY, transform: "translate(-50%, -100%)" }}
            >
              <MapPin className="h-9 w-9 text-green-400 drop-shadow-2xl animate-bounce" fill="#22c55e" strokeWidth={0} />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1">
                <div className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap font-bold">
                  {previewMarker?.lat.toFixed(5)}, {previewMarker?.lng.toFixed(5)}
                </div>
              </div>
            </div>
          )}

          {/* Center crosshair */}
          {isLoaded && !placing && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-5">
              <div className="w-5 h-5 border-2 border-white/50 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Placing mode toolbar */}
      {placing && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          <div className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
            <span className="animate-pulse">🎯</span> Click anywhere to drop a pin
          </div>
          {previewMarker && (
            <>
              <button onClick={confirmPlacement} className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-lg flex items-center justify-center transition-colors">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={cancelPlacement} className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg flex items-center justify-center transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
        <button onClick={handleZoomIn} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
          <ZoomIn className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <button onClick={handleZoomOut} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
          <ZoomOut className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <button onClick={toggleStyle} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700" title={style === "satellite" ? "Switch to Street" : "Switch to Satellite"}>
          {style === "satellite" ? <Map className="h-4 w-4 text-gray-700 dark:text-gray-300" /> : <Satellite className="h-4 w-4 text-gray-700 dark:text-gray-300" />}
        </button>
        <button onClick={handleReset} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
          <Maximize2 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Coordinates + zoom */}
      <div className="absolute top-3 left-3 z-20">
        <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg shadow-md border border-white/10">
          <span className="text-[11px] font-mono">
            {center[0].toFixed(4)}°N, {center[1].toFixed(4)}°E • {style === "satellite" ? "🛰️" : "🗺️"} Zoom {zoom}
          </span>
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-1 left-1 z-20">
        <span className="text-[10px] bg-black/60 backdrop-blur-sm text-white/70 px-1.5 py-0.5 rounded">
          {style === "satellite" ? "© Esri" : "© CARTO © OpenStreetMap"}
        </span>
      </div>
    </div>
  );
}
