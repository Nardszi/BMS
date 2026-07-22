"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  permits,
  blotters,
  center,
  activeLayer,
  selectedPurok,
  onSelectPurok,
}: GISMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Layers dynamically based on props
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const maxPop = Math.max(...puroks.map((p) => p.population), 1);

    // 1. Population Heat Circles per Purok
    if (activeLayer === "population" || activeLayer === "all") {
      puroks.forEach((p) => {
        if (selectedPurok && selectedPurok !== "all" && p.purok !== selectedPurok) return;

        const ratio = p.population / maxPop;
        const radius = Math.max(120, ratio * 280);
        const color =
          ratio > 0.7 ? "#ef4444" : ratio > 0.4 ? "#f59e0b" : "#3b82f6";

        const circle = L.circle(p.center, {
          color: color,
          fillColor: color,
          fillOpacity: 0.35,
          radius: radius,
          weight: 2,
        });

        circle.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <h4 style="margin: 0 0 6px; color: #1e293b; font-size: 14px; font-weight: bold;">Purok ${p.purok} - Population</h4>
            <div style="font-size: 12px; color: #475569; line-height: 1.5;">
              <p style="margin: 2px 0;"><b>Total Residents:</b> ${p.population}</p>
              <p style="margin: 2px 0;"><b>Households:</b> ${p.households}</p>
              <p style="margin: 2px 0;"><b>Voters:</b> ${p.voters}</p>
              <p style="margin: 2px 0;"><b>Active Businesses:</b> ${p.businessCount}</p>
              <p style="margin: 2px 0;"><b>Blotter Cases:</b> ${p.blotterCount}</p>
            </div>
          </div>
        `);

        circle.on("click", () => {
          onSelectPurok(p.purok);
        });

        layerGroup.addLayer(circle);

        // Purok Center Marker Tag
        const textIcon = L.divIcon({
          className: "custom-purok-label",
          html: `<div style="background: rgba(15, 23, 42, 0.85); color: white; padding: 3px 8px; border-radius: 12px; font-weight: bold; font-size: 11px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3); text-align: center;">Purok ${p.purok} (${p.population})</div>`,
          iconSize: [80, 24],
          iconAnchor: [40, 12],
        });
        const labelMarker = L.marker(p.center, { icon: textIcon });
        layerGroup.addLayer(labelMarker);
      });
    }

    // 2. Blotter Hotspot Markers
    if (activeLayer === "blotters" || activeLayer === "all") {
      blotters.forEach((b) => {
        if (selectedPurok && selectedPurok !== "all" && b.purok !== selectedPurok) return;

        const isResolved = b.status === "RESOLVED";
        const isEscalated = b.status === "ESCALATED";

        const iconBg = isResolved ? "#10b981" : isEscalated ? "#f59e0b" : "#ef4444";

        const blotterIcon = L.divIcon({
          className: "custom-blotter-icon",
          html: `<div style="background-color: ${iconBg}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">⚠️</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker(b.coordinates, { icon: blotterIcon });

        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; max-width: 220px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: bold; font-family: monospace; color: #64748b;">${b.caseNumber}</span>
              <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${iconBg}; color: white;">${b.status}</span>
            </div>
            <h5 style="margin: 0 0 4px; font-size: 13px; font-weight: bold; color: #0f172a;">${b.incidentType}</h5>
            <p style="margin: 2px 0; font-size: 11px; color: #475569;"><b>Complainant:</b> ${b.complainantName}</p>
            <p style="margin: 2px 0; font-size: 11px; color: #475569;"><b>Location:</b> ${b.location}</p>
            <p style="margin: 4px 0 0; font-size: 10px; color: #64748b; line-clamp: 2;">${b.narrative}</p>
          </div>
        `);

        layerGroup.addLayer(marker);
      });
    }

    // 3. Commercial Establishments / Permits Markers
    if (activeLayer === "permits" || activeLayer === "all") {
      permits.forEach((p) => {
        if (selectedPurok && selectedPurok !== "all" && p.purok !== selectedPurok) return;

        const isActive = p.status === "ACTIVE";
        const iconBg = isActive ? "#0284c7" : "#94a3b8";

        const permitIcon = L.divIcon({
          className: "custom-permit-icon",
          html: `<div style="background-color: ${iconBg}; width: 22px; height: 22px; border-radius: 6px; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">🏢</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker(p.coordinates, { icon: permitIcon });

        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; max-width: 220px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: bold; font-family: monospace; color: #0284c7;">${p.permitNumber}</span>
              <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1;">${p.businessType}</span>
            </div>
            <h5 style="margin: 0 0 4px; font-size: 13px; font-weight: bold; color: #0f172a;">${p.businessName}</h5>
            <p style="margin: 2px 0; font-size: 11px; color: #475569;"><b>Owner:</b> ${p.ownerName}</p>
            <p style="margin: 2px 0; font-size: 11px; color: #475569;"><b>Address:</b> ${p.address}</p>
          </div>
        `);

        layerGroup.addLayer(marker);
      });
    }

    // Pan map to selected Purok if specific purok chosen
    if (selectedPurok && selectedPurok !== "all") {
      const targetPurok = puroks.find((p) => p.purok === selectedPurok);
      if (targetPurok) {
        map.flyTo(targetPurok.center, 16, { duration: 1 });
      }
    } else {
      map.flyTo(center, 15, { duration: 1 });
    }
  }, [puroks, permits, blotters, activeLayer, selectedPurok, center, onSelectPurok]);

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
