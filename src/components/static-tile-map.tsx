"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { MapPin, ZoomIn, ZoomOut, Maximize2, Satellite, Map, Trash2, Check, X, Bookmark, BookmarkPlus, Ruler, Search, Printer, Flame } from "lucide-react";

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

interface MapPolygon {
  id: string;
  label: string;
  points: [number, number][];
  color: string;
  fillColor?: string;
}

interface MapBookmark {
  name: string;
  zoom: number;
  offset: { x: number; y: number };
  style: TileStyle;
}

interface StaticTileMapProps {
  center: [number, number];
  zoom?: number;
  height?: number;
  markers?: MapMarker[];
  polygons?: MapPolygon[];
  heatmapPoints?: Array<{ lat: number; lng: number; intensity: number }>;
  onMapClick?: (lat: number, lng: number) => void;
  onPolygonComplete?: (id: string, points: [number, number][]) => void;
  drawingPolygon?: string | null;
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

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function StaticTileMap({
  center,
  zoom: initialZoom = 16,
  height = 450,
  markers = [],
  polygons = [],
  heatmapPoints = [],
  onMapClick,
  onPolygonComplete,
  drawingPolygon = null,
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
  const [opacity, setOpacity] = useState(100);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Pan
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

  // Placing
  const [previewMarker, setPreviewMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // Measurement
  const [measuring, setMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<Array<{ lat: number; lng: number }>>([]);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<MapBookmark[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bms-map-bookmarks");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Heatmap
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Polygon drawing
  const [drawPoints, setDrawPoints] = useState<Array<{ lat: number; lng: number }>>([]);

  const tileSize = 256;
  const gridCols = Math.ceil(containerWidth / tileSize) + 2;
  const gridRows = Math.ceil(height / tileSize) + 2;

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setContainerWidth(Math.floor(e.contentRect.width));
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const centerPixel = useMemo(() => latLngToPixel(center[0], center[1], zoom, tileSize), [center, zoom, tileSize]);
  const originX = centerPixel.x - (gridCols * tileSize) / 2 - offset.x;
  const originY = centerPixel.y - (gridRows * tileSize) / 2 - offset.y;

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
        result.push({ url, px: tileX * tileSize - originX, py: tileY * tileSize - originY, key: `${style}-${zoom}-${tileX}-${tileY}` });
      }
    }
    return result;
  }, [originX, originY, zoom, gridCols, gridRows, tileSize, style]);

  const markerPositions = useMemo(() => {
    return markers.map((m) => {
      const px = latLngToPixel(m.lat, m.lng, zoom, tileSize);
      return { ...m, screenX: px.x - originX, screenY: px.y - originY };
    });
  }, [markers, zoom, tileSize, originX, originY]);

  // Polygon screen positions
  const polygonPaths = useMemo(() => {
    return polygons.map((poly) => {
      const points = poly.points.map(([lat, lng]) => {
        const px = latLngToPixel(lat, lng, zoom, tileSize);
        return { x: px.x - originX, y: px.y - originY };
      });
      const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
      return { ...poly, pathD, points };
    });
  }, [polygons, zoom, tileSize, originX, originY]);

  // Measurement line
  const measureLine = useMemo(() => {
    if (measurePoints.length < 2) return null;
    const pts = measurePoints.map((p) => {
      const px = latLngToPixel(p.lat, p.lng, zoom, tileSize);
      return { x: px.x - originX, y: px.y - originY };
    });
    let totalDist = 0;
    for (let i = 1; i < measurePoints.length; i++) {
      totalDist += haversineDistance(measurePoints[i - 1].lat, measurePoints[i - 1].lng, measurePoints[i].lat, measurePoints[i].lng);
    }
    return { pts, totalDist };
  }, [measurePoints, zoom, tileSize, originX, originY]);

  const previewPos = useMemo(() => {
    if (!previewMarker) return null;
    const px = latLngToPixel(previewMarker.lat, previewMarker.lng, zoom, tileSize);
    return { screenX: px.x - originX, screenY: px.y - originY };
  }, [previewMarker, zoom, tileSize, originX, originY]);

  // Heatmap screen positions
  const heatmapPositions = useMemo(() => {
    return heatmapPoints.map((h) => {
      const px = latLngToPixel(h.lat, h.lng, zoom, tileSize);
      return { x: px.x - originX, y: px.y - originY, intensity: h.intensity };
    });
  }, [heatmapPoints, zoom, tileSize, originX, originY]);

  // Print handler
  const handlePrint = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const canvas = document.createElement("canvas");
    canvas.width = containerWidth * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Draw a placeholder
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Barangay IX (Daan Banwa) — GIS Map", canvas.width / 2, 60);
    ctx.font = "20px sans-serif";
    ctx.fillText(`${markers.length} puroks • ${center[0].toFixed(4)}°N, ${center[1].toFixed(4)}°E • Zoom ${zoom}`, canvas.width / 2, 100);
    // Draw marker list
    ctx.textAlign = "left";
    ctx.font = "16px sans-serif";
    markers.forEach((m, i) => {
      const y = 160 + i * 30;
      ctx.fillStyle = m.color || "#ef4444";
      ctx.beginPath();
      ctx.arc(40, y - 5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.fillText(`${m.label} — Pop: ${m.population ?? "N/A"} | HH: ${m.households ?? "N/A"} | Biz: ${m.businessCount ?? "N/A"} | Cases: ${m.blotterCount ?? "N/A"}`, 60, y);
    });
    const dataUrl = canvas.toDataURL("image/png");
    printWindow.document.write(`<html><head><title>Barangay IX Map</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0f172a"><img src="${dataUrl}" style="max-width:100%"/></body></html>`);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
  }, [containerWidth, height, markers, center, zoom]);

  // Marker size based on zoom
  const markerSize = useMemo(() => {
    if (zoom >= 18) return "h-9 w-9";
    if (zoom >= 17) return "h-8 w-8";
    if (zoom >= 16) return "h-7 w-7";
    if (zoom >= 15) return "h-6 w-6";
    return "h-5 w-5";
  }, [zoom]);

  const labelSize = useMemo(() => {
    if (zoom >= 18) return "text-xs";
    if (zoom >= 16) return "text-[10px]";
    return "text-[9px]";
  }, [zoom]);

  // --- Drag ---
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (placing || measuring) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset, placing, measuring]);

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

  const onContainerClick = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const pixelX = originX + clickX;
    const pixelY = originY + clickY;
    const ll = pixelToLatLng(pixelX, pixelY, zoom, tileSize);

    // Polygon drawing mode
    if (drawingPolygon) {
      setDrawPoints((prev) => [...prev, ll]);
      return;
    }

    if (measuring) {
      setMeasurePoints((prev) => [...prev, ll]);
      return;
    }
    if (!onMapClick) return;
    setPreviewMarker(ll);
  }, [onMapClick, originX, originY, zoom, tileSize, measuring, drawingPolygon]);

  const confirmPlacement = useCallback(() => {
    if (!previewMarker || !onMapClick) return;
    onMapClick(previewMarker.lat, previewMarker.lng);
    setPreviewMarker(null);
  }, [previewMarker, onMapClick]);

  const cancelPlacement = useCallback(() => setPreviewMarker(null), []);

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

  const saveBookmark = () => {
    const name = prompt("Bookmark name:");
    if (!name) return;
    const bm: MapBookmark = { name, zoom, offset, style };
    const updated = [...bookmarks, bm];
    setBookmarks(updated);
    localStorage.setItem("bms-map-bookmarks", JSON.stringify(updated));
  };

  const loadBookmark = (bm: MapBookmark) => {
    setZoom(bm.zoom);
    setOffset(bm.offset);
    setStyle(bm.style);
    localStorage.setItem("bms-map-offset", JSON.stringify(bm.offset));
    localStorage.setItem("bms-map-style", bm.style);
    setShowBookmarks(false);
  };

  const deleteBookmark = (idx: number) => {
    const updated = bookmarks.filter((_, i) => i !== idx);
    setBookmarks(updated);
    localStorage.setItem("bms-map-bookmarks", JSON.stringify(updated));
  };

  // Search markers
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return markers.filter((m) => m.label.toLowerCase().includes(q));
  }, [searchQuery, markers]);

  const flyToMarker = (m: MapMarker) => {
    const px = latLngToPixel(m.lat, m.lng, zoom, tileSize);
    const centerX = containerWidth / 2;
    const centerY = height / 2;
    setOffset({ x: px.x - centerPixel.x, y: px.y - centerPixel.y });
    setSelectedMarker(m);
    setSearchQuery("");
    setShowSearch(false);
  };

  const formatDistance = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;

  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-black ${className} ${placing ? "cursor-crosshair" : measuring ? "cursor-cell" : "cursor-grab active:cursor-grabbing"}`}>
      <div className="relative select-none" style={{ width: "100%", height, overflow: "hidden", touchAction: "none" }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onClick={onContainerClick}>

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
              <button onClick={() => { setLoadError(false); setIsLoaded(false); }} className="text-xs text-blue-400 hover:text-blue-300 underline">Retry</button>
            </div>
          </div>
        )}

        <div className="relative" style={{ width: gridCols * tileSize, height: gridRows * tileSize }}>
          {/* Tiles with opacity */}
          {tiles.map((tile) => (
            <img key={tile.key} src={tile.url} alt="" loading="eager"
              onLoad={() => setIsLoaded(true)} onError={() => setLoadError(true)}
              className="absolute" style={{ left: tile.px, top: tile.py, width: tileSize, height: tileSize, opacity: opacity / 100 }}
              draggable={false} />
          ))}

          {/* SVG overlay for polygons + measurement */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]" style={{ width: gridCols * tileSize, height: gridRows * tileSize }}>
            {/* Polygons */}
            {isLoaded && polygonPaths.map((poly) => (
              <g key={poly.id}>
                <path d={poly.pathD} fill={poly.fillColor || poly.color} fillOpacity={0.2} stroke={poly.color} strokeWidth={2} strokeOpacity={0.7} />
                {poly.points.length > 0 && (() => {
                  const cx = poly.points.reduce((s, p) => s + p.x, 0) / poly.points.length;
                  const cy = poly.points.reduce((s, p) => s + p.y, 0) / poly.points.length;
                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                      className="pointer-events-none" fill="white" fontSize={11} fontWeight="bold"
                      stroke="black" strokeWidth={3} paintOrder="stroke">
                      {poly.label}
                    </text>
                  );
                })()}
              </g>
            ))}

            {/* Polygon being drawn */}
            {isLoaded && drawingPolygon && drawPoints.length > 0 && (() => {
              const pts = drawPoints.map((p) => {
                const px = latLngToPixel(p.lat, p.lng, zoom, tileSize);
                return { x: px.x - originX, y: px.y - originY };
              });
              const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
              return (
                <g>
                  <path d={pathD} fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" strokeWidth={2} strokeDasharray="6 3" />
                  {pts.map((p, i) => (
                    <circle key={`dp-${i}`} cx={p.x} cy={p.y} r={5} fill="#a855f7" stroke="white" strokeWidth={2} />
                  ))}
                </g>
              );
            })()}

            {/* Heatmap overlay */}
            {isLoaded && showHeatmap && heatmapPositions.map((h, i) => {
              const radius = 30 + h.intensity * 40;
              const opacity = 0.15 + h.intensity * 0.35;
              return (
                <circle key={`heat-${i}`} cx={h.x} cy={h.y} r={radius}
                  fill={`rgba(255, ${Math.round(150 - h.intensity * 150)}, 0, ${opacity})`}
                  stroke="none" className="pointer-events-none" />
              );
            })}

            {/* Measurement line */}
            {isLoaded && measureLine && (
              <g>
                <polyline points={measureLine.pts.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none" stroke="#facc15" strokeWidth={3} strokeDasharray="8 4" strokeOpacity={0.9} />
                {measureLine.pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={5} fill="#facc15" stroke="white" strokeWidth={2} />
                ))}
                {measureLine.pts.length >= 2 && (
                  <text x={measureLine.pts[0].x} y={measureLine.pts[0].y - 15}
                    fill="#facc15" fontSize={13} fontWeight="bold" stroke="black" strokeWidth={3} paintOrder="stroke">
                    {formatDistance(measureLine.totalDist)}
                  </text>
                )}
              </g>
            )}
          </svg>

          {/* Markers */}
          {isLoaded && markerPositions.map((m) => (
            <div key={m.id}
              className={`absolute z-10 ${placing ? "" : "cursor-pointer"}`}
              style={{ left: m.screenX, top: m.screenY, transform: "translate(-50%, -100%)" }}
              onClick={(e) => { e.stopPropagation(); if (!placing && !measuring) setSelectedMarker(selectedMarker?.id === m.id ? null : m); }}>
              <MapPin className={`${markerSize} drop-shadow-lg transition-transform hover:scale-125`}
                style={{ color: m.color || "#ef4444" }} fill={m.color || "#ef4444"} strokeWidth={0} />
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 pointer-events-none z-30`}>
                <div className={`bg-black/80 backdrop-blur-sm text-white ${labelSize} px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap font-bold border border-white/20`}>
                  {m.label}
                </div>
              </div>
            </div>
          ))}

          {/* Info popup */}
          {isLoaded && selectedMarker && (() => {
            const px = latLngToPixel(selectedMarker.lat, selectedMarker.lng, zoom, tileSize);
            const sx = px.x - originX;
            const sy = px.y - originY;
            return (
              <div className="absolute z-40 pointer-events-auto" style={{ left: sx, top: sy, transform: "translate(-50%, calc(-100% - 50px))" }}
                onClick={(e) => e.stopPropagation()}>
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-64 relative">
                  <button onClick={() => setSelectedMarker(null)}
                    className="absolute top-2 right-2 h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700">
                    <X className="h-3 w-3 text-gray-500" />
                  </button>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedMarker.color }} />
                    <h4 className="font-black text-sm text-gray-900 dark:text-white">{selectedMarker.label}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedMarker.population != null && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <span className="font-bold text-gray-900 dark:text-white">{selectedMarker.population.toLocaleString()}</span> pop
                      </div>
                    )}
                    {selectedMarker.households != null && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <span className="font-bold text-gray-900 dark:text-white">{selectedMarker.households.toLocaleString()}</span> HH
                      </div>
                    )}
                    {selectedMarker.voters != null && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <span className="font-bold text-gray-900 dark:text-white">{selectedMarker.voters.toLocaleString()}</span> voters
                      </div>
                    )}
                    {selectedMarker.males != null && selectedMarker.females != null && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <span className="font-bold text-gray-900 dark:text-white">{selectedMarker.males}/{selectedMarker.females}</span> M/F
                      </div>
                    )}
                    {selectedMarker.businessCount != null && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <span className="font-bold text-gray-900 dark:text-white">{selectedMarker.businessCount}</span> biz
                      </div>
                    )}
                    {selectedMarker.blotterCount != null && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <span className="font-bold text-gray-900 dark:text-white">{selectedMarker.blotterCount}</span> cases
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 font-mono">
                    {selectedMarker.lat.toFixed(5)}°N, {selectedMarker.lng.toFixed(5)}°E
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-700 rotate-45" />
                </div>
              </div>
            );
          })()}

          {/* Preview marker */}
          {isLoaded && previewPos && (
            <div className="absolute z-20 pointer-events-none" style={{ left: previewPos.screenX, top: previewPos.screenY, transform: "translate(-50%, -100%)" }}>
              <MapPin className="h-9 w-9 text-green-400 drop-shadow-2xl animate-bounce" fill="#22c55e" strokeWidth={0} />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1">
                <div className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap font-bold">
                  {previewMarker?.lat.toFixed(5)}, {previewMarker?.lng.toFixed(5)}
                </div>
              </div>
            </div>
          )}

          {/* Center crosshair */}
          {isLoaded && !placing && !measuring && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-5">
              <div className="w-5 h-5 border-2 border-white/50 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Placing toolbar */}
      {placing && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          <div className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
            <span className="animate-pulse">🎯</span> Click to drop a pin
          </div>
          {previewMarker && (
            <>
              <button onClick={confirmPlacement} className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-lg flex items-center justify-center transition-colors"><Check className="h-4 w-4" /></button>
              <button onClick={cancelPlacement} className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg flex items-center justify-center transition-colors"><Trash2 className="h-4 w-4" /></button>
            </>
          )}
        </div>
      )}

      {/* Measurement banner */}
      {measuring && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-yellow-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
            📏 Click points to measure — {measurePoints.length} point{measurePoints.length !== 1 ? "s" : ""}
            {measureLine && <span className="ml-2 bg-yellow-700 px-2 py-0.5 rounded">{formatDistance(measureLine.totalDist)}</span>}
            <button onClick={() => { setMeasurePoints([]); setMeasuring(false); }} className="ml-1 hover:text-yellow-200"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}

      {/* Polygon drawing banner */}
      {drawingPolygon && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
            ✏️ Drawing: {drawingPolygon} — {drawPoints.length} points (double-click or press ✓ to finish)
            {drawPoints.length >= 3 && (
              <button onClick={() => {
                const coords: [number, number][] = drawPoints.map((p) => [p.lat, p.lng]);
                onPolygonComplete?.(drawingPolygon, coords);
                setDrawPoints([]);
              }} className="ml-1 bg-purple-700 hover:bg-purple-800 px-2 py-0.5 rounded"><Check className="h-3.5 w-3.5 inline" /></button>
            )}
            <button onClick={() => { setDrawPoints([]); onPolygonComplete?.(drawingPolygon, []); }} className="ml-1 hover:text-purple-200"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}

      {/* Search panel */}
      {showSearch && (
        <div className="absolute top-14 left-3 z-30 w-64">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search purok..." className="w-full py-2 px-2 text-sm bg-transparent text-gray-900 dark:text-white outline-none" />
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                {searchResults.map((m) => (
                  <button key={m.id} onClick={() => flyToMarker(m)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-gray-900 dark:text-white">{m.label}</span>
                  </button>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-gray-400">No results found</div>
            )}
          </div>
        </div>
      )}

      {/* Bookmarks panel */}
      {showBookmarks && (
        <div className="absolute top-14 right-3 z-30 w-56">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-900 dark:text-white">Bookmarks</span>
              <button onClick={() => setShowBookmarks(false)}><X className="h-3.5 w-3.5 text-gray-400" /></button>
            </div>
            {bookmarks.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">No saved bookmarks</div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {bookmarks.map((bm, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <button onClick={() => loadBookmark(bm)} className="text-sm text-gray-900 dark:text-white text-left truncate">{bm.name}</button>
                    <button onClick={() => deleteBookmark(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Left toolbar */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
        <button onClick={handleZoomIn} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
          <ZoomIn className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <button onClick={handleZoomOut} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
          <ZoomOut className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <button onClick={toggleStyle} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          title={style === "satellite" ? "Switch to Street" : "Switch to Satellite"}>
          {style === "satellite" ? <Map className="h-4 w-4 text-gray-700 dark:text-gray-300" /> : <Satellite className="h-4 w-4 text-gray-700 dark:text-gray-300" />}
        </button>
        <button onClick={handleReset} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
          <Maximize2 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <div className="h-px bg-gray-200 dark:bg-gray-700 my-0.5" />
        <button onClick={() => setShowSearch(!showSearch)} className={`h-8 w-8 rounded-lg shadow-md flex items-center justify-center transition-colors border ${showSearch ? "bg-blue-500 border-blue-400 text-white" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
          <Search className="h-4 w-4" />
        </button>
        <button onClick={() => { setMeasuring(!measuring); setMeasurePoints([]); }} className={`h-8 w-8 rounded-lg shadow-md flex items-center justify-center transition-colors border ${measuring ? "bg-yellow-500 border-yellow-400 text-white" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
          <Ruler className="h-4 w-4" />
        </button>
        <button onClick={() => setShowBookmarks(!showBookmarks)} className={`h-8 w-8 rounded-lg shadow-md flex items-center justify-center transition-colors border ${showBookmarks ? "bg-purple-500 border-purple-400 text-white" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
          <Bookmark className="h-4 w-4" />
        </button>
        <button onClick={saveBookmark} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700" title="Save current view">
          <BookmarkPlus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
        <div className="h-px bg-gray-200 dark:bg-gray-700 my-0.5" />
        <button onClick={() => setShowHeatmap(!showHeatmap)} className={`h-8 w-8 rounded-lg shadow-md flex items-center justify-center transition-colors border ${showHeatmap ? "bg-orange-500 border-orange-400 text-white" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`} title="Toggle heatmap">
          <Flame className="h-4 w-4" />
        </button>
        <button onClick={handlePrint} className="h-8 w-8 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700" title="Print map">
          <Printer className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Opacity slider */}
      <div className="absolute top-3 left-3 z-20 flex flex-col items-center">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1.5 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <span className="text-[9px] text-gray-500 dark:text-gray-400 block text-center mb-1">Opacity</span>
          <input type="range" min={20} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-16 h-1 accent-blue-500" />
          <span className="text-[9px] text-gray-600 dark:text-gray-300 block text-center mt-0.5">{opacity}%</span>
        </div>
      </div>

      {/* Coordinates */}
      <div className="absolute bottom-1 left-1 z-20">
        <div className="bg-black/70 backdrop-blur-sm text-white/80 text-[10px] font-mono px-1.5 py-0.5 rounded">
          {center[0].toFixed(4)}°N, {center[1].toFixed(4)}°E • {style === "satellite" ? "🛰️" : "🗺️"} Z{zoom}
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-1 right-1 z-20">
        <span className="text-[9px] bg-black/60 backdrop-blur-sm text-white/60 px-1 py-0.5 rounded">
          {style === "satellite" ? "© Esri" : "© CARTO © OSM"}
        </span>
      </div>
    </div>
  );
}
