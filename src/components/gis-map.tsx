"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, ShieldAlert, Home, MapPin, ExternalLink, ArrowUpRight, Navigation, Target, X, Check, Settings, Copy } from "lucide-react";
import StaticTileMap from "@/components/static-tile-map";

interface PurokData {
  purok: string;
  center: [number, number];
  population: number;
  households: number;
  voters: number;
  males: number;
  females: number;
  businessCount: number;
  blotterCount: number;
}

interface PermitMarker {
  id: string;
  businessName: string;
  businessType: string;
  status: string;
  permitNumber: string;
  address: string;
  ownerName: string;
  purok: string;
  coordinates: [number, number];
}

interface BlotterMarker {
  id: string;
  caseNumber: string;
  incidentType: string;
  incidentDate: string;
  status: string;
  complainantName: string;
  respondentName: string;
  location: string;
  narrative: string;
  purok: string;
  coordinates: [number, number];
}

interface GISMapProps {
  puroks: PurokData[];
  permits: PermitMarker[];
  blotters: BlotterMarker[];
  center: [number, number];
  activeLayer: "population" | "blotters" | "permits" | "all";
  selectedPurok: string;
  onSelectPurok: (purok: string) => void;
}

const DEFAULT_COORDS: Record<string, [number, number]> = {
  "1": [10.903217341701733, 123.05972335556828],
  "2": [10.902595766605971, 123.06036708573185],
  "3": [10.903986407395275, 123.06132195214116],
  "4": [10.904692260459727, 123.06092498520695],
  "5": [10.905071524100972, 123.06042072991215],
  "6": [10.90436567193665, 123.05897233704411],
  "7": [10.90461851469554, 123.06273815850102],
  "8": [10.903312158127584, 123.06179402092778],
  "Toreno": [10.901795091687132, 123.06329605797612],
  "Aji": [10.904681725351677, 123.06444404343449],
};

export default function GISMap({
  puroks,
  activeLayer,
  selectedPurok,
  onSelectPurok,
}: GISMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [placingPurok, setPlacingPurok] = useState<string | null>(null);
  const [coords, setCoords] = useState<Record<string, [number, number]>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bms-purok-coords");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_COORDS;
  });
  const [showPlacement, setShowPlacement] = useState(false);
  const maxPop = Math.max(...puroks.map((p) => p.population), 1);

  const mapMarkers = useMemo(() => {
    return puroks
      .filter((p) => coords[p.purok])
      .map((p) => ({
        id: p.purok,
        lat: coords[p.purok][0],
        lng: coords[p.purok][1],
        label: isNaN(Number(p.purok)) ? p.purok : `Purok ${p.purok}`,
        color: p.population / maxPop > 0.7 ? "#ef4444" : p.population / maxPop > 0.4 ? "#f59e0b" : "#3b82f6",
        population: p.population,
        households: p.households,
        voters: p.voters,
        males: p.males,
        females: p.females,
        businessCount: p.businessCount,
        blotterCount: p.blotterCount,
      }));
  }, [puroks, maxPop, coords]);

  // Generate polygon boundaries around each purok center
  const mapPolygons = useMemo(() => {
    const offset = 0.0012;
    return puroks
      .filter((p) => coords[p.purok])
      .map((p) => {
        const [lat, lng] = coords[p.purok];
        const ratio = p.population / maxPop;
        const color = ratio > 0.7 ? "#ef4444" : ratio > 0.4 ? "#f59e0b" : "#3b82f6";
        const label = isNaN(Number(p.purok)) ? p.purok : `P${p.purok}`;
        return {
          id: p.purok,
          label,
          color,
          fillColor: color,
          points: [
            [lat + offset, lng - offset] as [number, number],
            [lat + offset, lng + offset] as [number, number],
            [lat - offset, lng + offset] as [number, number],
            [lat - offset, lng - offset] as [number, number],
          ],
        };
      });
  }, [puroks, maxPop, coords]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!placingPurok) return;
      const key = placingPurok;
      const pos: [number, number] = [lat, lng];
      setCoords((prev) => {
        const next = { ...prev, [key]: pos };
        localStorage.setItem("bms-purok-coords", JSON.stringify(next));
        return next;
      });
      setPlacingPurok(null);
    },
    [placingPurok]
  );

  const mapCenter = useMemo<[number, number]>(() => {
    const values = Object.values(coords);
    const avgLat = values.reduce((s, c) => s + c[0], 0) / values.length;
    const avgLng = values.reduce((s, c) => s + c[1], 0) / values.length;
    return [avgLat, avgLng];
  }, [coords]);

  return (
    <div className="space-y-6">
      {/* Map Card */}
      <Card className="border-0 shadow-xl overflow-hidden rounded-2xl">
        <CardContent className="p-0 relative">
          {/* Settings toggle */}
          <button
            onClick={() => setShowPlacement(!showPlacement)}
            className="absolute top-3 right-14 z-30 h-8 w-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
            title="Adjust purok positions"
          >
            <Settings className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Placing indicator */}
          {placingPurok && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
              <div className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
                <Target className="h-3.5 w-3.5 animate-pulse" />
                Placing: {isNaN(Number(placingPurok)) ? placingPurok : `Purok ${placingPurok}`} — click the map
                <button onClick={() => setPlacingPurok(null)} className="ml-1 hover:text-green-200">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          <StaticTileMap
            center={mapCenter}
            zoom={17}
            height={500}
            markers={mapMarkers}
            polygons={mapPolygons}
            onMapClick={placingPurok ? handleMapClick : undefined}
            placing={!!placingPurok}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Collapsible placement bar */}
      {showPlacement && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-4 border border-blue-800/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-400" />
              <h4 className="text-sm font-bold text-white">Place Purok Markers</h4>
              <span className="text-[10px] text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded-full">Click a purok, then click the map</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const saved = localStorage.getItem("bms-purok-coords");
                  if (saved) navigator.clipboard.writeText(saved);
                }}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-[10px]"
                title="Copy current coordinates"
              >
                <Copy className="h-3 w-3" /> Export
              </button>
              <button onClick={() => setShowPlacement(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {puroks.map((p) => {
              const isPlacing = placingPurok === p.purok;
              const hasCoord = !!coords[p.purok];
              return (
                <button
                  key={p.purok}
                  onClick={() => setPlacingPurok(isPlacing ? null : p.purok)}
                  className={`text-xs font-bold px-2 py-2 rounded-lg transition-all ${
                    isPlacing
                      ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-110"
                      : hasCoord
                      ? "bg-blue-800/80 text-blue-200 hover:bg-blue-700/80 border border-blue-600/30"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
                  }`}
                >
                  {isNaN(Number(p.purok)) ? p.purok : `P${p.purok}`}
                  {hasCoord && !isPlacing && <Check className="h-3 w-3 inline ml-0.5 text-green-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* External Map Links */}
      <div className="flex flex-wrap gap-3">
        <a
          href="https://www.openstreetmap.org/#map=16/10.9042/123.0611"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 text-sm rounded-xl shadow-lg transition-colors"
        >
          <Navigation className="h-4 w-4" /> OpenStreetMap <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <a
          href="https://www.google.com/maps/search/Barangay+IX+Daan+Banwa+Victorias+City+Negros+Occidental+Philippines"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-4 py-2.5 text-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <MapPin className="h-4 w-4 text-amber-500" /> Google Maps <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Interactive Vector Master Plan Zoning Grid */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 shadow-2xl p-6 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-black text-base tracking-wide">Barangay IX Zone Directory & Demographics</h3>
            </div>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Click any zone card below to inspect detailed household, resident, business, and incident reports.
            </p>
          </div>
          <span className="text-xs font-bold bg-blue-600/80 text-white px-3 py-1.5 rounded-lg">
            10 Active Zones (Puroks 1-8, Toreno, Aji)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 z-10">
          {puroks.map((p) => {
            const isSelected = selectedPurok === p.purok;
            const ratio = p.population / maxPop;
            const bgIntensity = ratio > 0.7 ? "bg-red-950/80 border-red-500/50" : ratio > 0.4 ? "bg-amber-950/80 border-amber-500/50" : "bg-blue-950/80 border-blue-500/50";

            return (
              <div
                key={p.purok}
                onClick={() => onSelectPurok(isSelected ? "all" : p.purok)}
                onMouseEnter={() => setHoveredZone(p.purok)}
                onMouseLeave={() => setHoveredZone(null)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all duration-300 relative overflow-hidden backdrop-blur-md flex flex-col justify-between ${
                  isSelected
                    ? "ring-2 ring-blue-400 bg-blue-900/90 shadow-lg shadow-blue-500/20 scale-105"
                    : bgIntensity
                } hover:border-blue-400 hover:scale-[1.02]`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-white bg-black/40 px-2 py-0.5 rounded-md">
                    {isNaN(Number(p.purok)) ? p.purok : `Purok ${p.purok}`}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-blue-300 opacity-70" />
                </div>

                <div className="space-y-1.5 my-2">
                  <div className="flex items-center justify-between text-xs text-blue-100">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3 text-blue-400" /> Pop:</span>
                    <span className="font-bold">{p.population}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-blue-100">
                    <span className="flex items-center gap-1"><Home className="h-3 w-3 text-indigo-400" /> HH:</span>
                    <span className="font-bold">{p.households}</span>
                  </div>
                  {(activeLayer === "permits" || activeLayer === "all") && (
                    <div className="flex items-center justify-between text-xs text-blue-100">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3 text-sky-400" /> Biz:</span>
                      <span className="font-bold text-sky-300">{p.businessCount}</span>
                    </div>
                  )}
                  {(activeLayer === "blotters" || activeLayer === "all") && (
                    <div className="flex items-center justify-between text-xs text-blue-100">
                      <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3 text-amber-400" /> Cases:</span>
                      <span className="font-bold text-amber-300">{p.blotterCount}</span>
                    </div>
                  )}
                </div>

                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full ${
                      ratio > 0.7 ? "bg-red-500" : ratio > 0.4 ? "bg-amber-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.max(15, ratio * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 z-10 bg-black/40 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-xs text-blue-200 mt-6">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> High Density</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Medium Density</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Normal Density</span>
          </div>
          <p className="text-[11px] text-blue-300/80 font-medium">Click any zone card above to inspect detailed demographics & records</p>
        </div>
      </div>
    </div>
  );
}
