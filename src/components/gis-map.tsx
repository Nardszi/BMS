"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, ShieldAlert, Home, MapPin, ExternalLink, ArrowUpRight, Compass, Navigation } from "lucide-react";

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

export default function GISMap({
  puroks,
  activeLayer,
  selectedPurok,
  onSelectPurok,
}: GISMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const maxPop = Math.max(...puroks.map((p) => p.population), 1);

  return (
    <div className="space-y-6">
      {/* High-Performance Visual Map Banner (Zero Iframe Error Risk) */}
      <Card className="border-0 shadow-xl overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-semibold">
                <Compass className="h-3.5 w-3.5 animate-spin-slow" /> Geographic Coordinates: 10.9042° N, 123.0611° E
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">Barangay IX (Daan Banwa) Live Map</h2>
              <p className="text-blue-100/80 text-sm max-w-xl leading-relaxed">
                Covering 23.24 hectares bounded by Malijao River and Western Nautical Highway. Landmarks include Daan Banwa Elementary School and San Roque Parish Church.
              </p>
              <div className="flex flex-wrap gap-3 pt-2 text-xs text-blue-200">
                <span className="bg-white/10 px-2.5 py-1 rounded-md">Postal Code: 6119</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-md">Victorias City, Negros Occidental</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <a
                href="https://www.openstreetmap.org/#map=16/10.9042/123.0611"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-4 text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors">
                  <Navigation className="h-4 w-4" /> Open OpenStreetMap <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </button>
              </a>
              <a
                href="https://www.google.com/maps/search/Barangay+IX+Daan+Banwa+Victorias+City+Negros+Occidental+Philippines"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 text-sm rounded-xl border border-white/20 flex items-center justify-center gap-2 transition-colors">
                  <MapPin className="h-4 w-4 text-amber-400" /> Open Google Maps <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

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

        {/* Visual Barangay Layout Grid */}
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

                {/* Status indicator bar */}
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

        {/* Map Footer Legend & Instructions */}
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
