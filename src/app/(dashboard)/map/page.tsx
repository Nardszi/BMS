"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building2, MapPin, Layers, RefreshCw, Flame, Printer, X, ShieldAlert, FileText, Download } from "lucide-react";
import { PUROK_OPTIONS } from "@/lib/constants";

const GISMap = dynamic(() => import("@/components/gis-map"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[620px] rounded-2xl border border-gray-200 dark:border-gray-800 bg-card p-8">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-3" />
      <p className="text-sm text-muted-foreground font-medium">Loading Barangay IX Interactive Map...</p>
    </div>
  ),
});

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

interface GISData {
  puroks: PurokData[];
  permits: PermitMarker[];
  blotters: BlotterMarker[];
  center: [number, number];
}

export default function MapPage() {
  const [data, setData] = useState<GISData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState<"population" | "blotters" | "permits" | "all">("all");
  const [selectedPurok, setSelectedPurok] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);

  const fetchGISData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gis");
      if (res.ok) {
        const gisData = await res.json();
        setData(gisData);
      }
    } catch (err) {
      console.error("Failed to load GIS data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGISData();
  }, []);

  const totalPopulation = data?.puroks.reduce((acc, p) => acc + p.population, 0) || 0;
  const totalBusinesses = data?.permits.length || 0;
  const totalIncidents = data?.blotters.length || 0;

  const currentPurokData =
    selectedPurok !== "all"
      ? data?.puroks.find((p) => p.purok === selectedPurok)
      : null;

  const zonePermits = data?.permits.filter((p) => p.purok === selectedPurok) || [];
  const zoneBlotters = data?.blotters.filter((b) => b.purok === selectedPurok) || [];

  const handleSelectPurok = (purok: string) => {
    setSelectedPurok(purok);
    if (purok !== "all") {
      setShowModal(true);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = "Zone,Population,Households,Voters,Males,Females,Businesses,BlotterCases\n";
    const rows = data.puroks.map(p => 
      `"Purok ${p.purok}",${p.population},${p.households},${p.voters},${p.males},${p.females},${p.businessCount},${p.blotterCount}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Barangay_IX_Zones_Demographics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barangay IX (Daan Banwa) Interactive GIS Map"
        subtitle="Precise spatial mapping based on official barangay layout (Elementary School, San Roque Church, Malijao River, Western Hwy)"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data || loading}>
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchGISData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Map
          </Button>
        </div>
      </PageHeader>

      {/* Layer Filters & Purok Selector */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeLayer === "all" ? "default" : "outline"}
            onClick={() => setActiveLayer("all")}
            className={activeLayer === "all" ? "bg-blue-900 hover:bg-blue-800 text-white" : ""}
          >
            <Layers className="mr-2 h-4 w-4" /> All Layers
          </Button>
          <Button
            size="sm"
            variant={activeLayer === "population" ? "default" : "outline"}
            onClick={() => setActiveLayer("population")}
            className={activeLayer === "population" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
          >
            <Users className="mr-2 h-4 w-4" /> Population Zones
          </Button>
          <Button
            size="sm"
            variant={activeLayer === "blotters" ? "default" : "outline"}
            onClick={() => setActiveLayer("blotters")}
            className={activeLayer === "blotters" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
          >
            <Flame className="mr-2 h-4 w-4" /> Incidents ({totalIncidents})
          </Button>
          <Button
            size="sm"
            variant={activeLayer === "permits" ? "default" : "outline"}
            onClick={() => setActiveLayer("permits")}
            className={activeLayer === "permits" ? "bg-sky-600 hover:bg-sky-700 text-white" : ""}
          >
            <Building2 className="mr-2 h-4 w-4" /> Establishments ({totalBusinesses})
          </Button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Filter Zone:</span>
          <Select
            value={selectedPurok}
            onValueChange={(val) => {
              setSelectedPurok(val);
              if (val !== "all") setShowModal(true);
            }}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones (Puroks 1-8, Toreno, Aji)</SelectItem>
              {PUROK_OPTIONS.map((p) => (
                <SelectItem key={p} value={String(p)}>
                  {isNaN(Number(p)) ? p : `Purok ${p}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Grid: GIS Map + Sidebar Stats */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {data ? (
            <GISMap
              puroks={data.puroks}
              permits={data.permits}
              blotters={data.blotters}
              center={data.center}
              activeLayer={activeLayer}
              selectedPurok={selectedPurok}
              onSelectPurok={handleSelectPurok}
            />
          ) : (
            <div className="h-[620px] rounded-2xl border flex items-center justify-center text-muted-foreground">
              Loading map tiles...
            </div>
          )}
        </div>

        {/* Side Info Cards */}
        <div className="space-y-4">
          <Card className="border-0 shadow-md dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>
                  {currentPurokData
                    ? `${isNaN(Number(currentPurokData.purok)) ? currentPurokData.purok : `Purok ${currentPurokData.purok}`} Stats`
                    : "Barangay IX Overview"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Population</span>
                <span className="text-lg font-black text-blue-900 dark:text-blue-100">
                  {currentPurokData ? currentPurokData.population : totalPopulation}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40">
                <span className="text-xs font-medium text-sky-700 dark:text-sky-300">Active Businesses</span>
                <span className="text-lg font-black text-sky-900 dark:text-sky-100">
                  {currentPurokData ? currentPurokData.businessCount : totalBusinesses}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40">
                <span className="text-xs font-medium text-red-700 dark:text-red-300">Blotter Incident Cases</span>
                <span className="text-lg font-black text-red-900 dark:text-red-100">
                  {currentPurokData ? currentPurokData.blotterCount : totalIncidents}
                </span>
              </div>

              {currentPurokData && (
                <div className="pt-2 border-t space-y-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                      onClick={() => setShowModal(true)}
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5" /> View Zone Report
                    </Button>
                  </div>
                  <div className="text-xs space-y-2 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Households:</span>
                      <span className="font-semibold text-foreground">{currentPurokData.households}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Registered Voters:</span>
                      <span className="font-semibold text-foreground">{currentPurokData.voters}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Male / Female:</span>
                      <span className="font-semibold text-foreground">
                        {currentPurokData.males} / {currentPurokData.females}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map Legend */}
          <Card className="border-0 shadow-md dark:bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Map Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="h-3.5 w-3.5 rounded-full bg-red-500 border border-white shadow-sm flex-shrink-0" />
                <span className="text-foreground font-medium">High Population Density</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-3.5 w-3.5 rounded-full bg-amber-500 border border-white shadow-sm flex-shrink-0" />
                <span className="text-foreground font-medium">Medium Population Density</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-3.5 w-3.5 rounded-full bg-blue-500 border border-white shadow-sm flex-shrink-0" />
                <span className="text-foreground font-medium">Normal Population Density</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-4 w-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold shadow-sm flex-shrink-0">
                  ⚠️
                </span>
                <span className="text-foreground font-medium">Blotter Incident Marker</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-4 w-4 rounded bg-sky-600 text-white flex items-center justify-center text-[9px] font-bold shadow-sm flex-shrink-0">
                  🏢
                </span>
                <span className="text-foreground font-medium">Commercial Establishment</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Zone Comparison Summary Table */}
      <Card className="border-0 shadow-md dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-base font-bold">Barangay IX Zone Comparison Matrix</CardTitle>
          <CardDescription className="text-xs">Comprehensive statistical comparison across all 10 administrative zones</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone / Purok</TableHead>
                <TableHead>Population</TableHead>
                <TableHead>Households</TableHead>
                <TableHead>Voters</TableHead>
                <TableHead>Male / Female</TableHead>
                <TableHead>Businesses</TableHead>
                <TableHead>Incidents</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.puroks.map((p) => (
                <TableRow key={p.purok} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleSelectPurok(p.purok)}>
                  <TableCell className="font-bold">
                    {isNaN(Number(p.purok)) ? p.purok : `Purok ${p.purok}`}
                  </TableCell>
                  <TableCell className="font-black text-blue-600 dark:text-blue-400">{p.population}</TableCell>
                  <TableCell>{p.households}</TableCell>
                  <TableCell>{p.voters}</TableCell>
                  <TableCell className="text-muted-foreground">{p.males} / {p.females}</TableCell>
                  <TableCell className="text-sky-600 dark:text-sky-400 font-semibold">{p.businessCount}</TableCell>
                  <TableCell className="text-amber-600 dark:text-amber-400 font-semibold">{p.blotterCount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleSelectPurok(p.purok); }}>
                      Inspect <FileText className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Zone Details Modal */}
      {showModal && currentPurokData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-muted/50 border-b">
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {isNaN(Number(currentPurokData.purok)) ? currentPurokData.purok : `Purok ${currentPurokData.purok}`} Detailed Report
                </h3>
                <p className="text-xs text-muted-foreground">Barangay IX (Daan Banwa), Victorias City</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Report
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-center">
                  <span className="text-xs text-muted-foreground block">Population</span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-300">{currentPurokData.population}</span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-center">
                  <span className="text-xs text-muted-foreground block">Households</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300">{currentPurokData.households}</span>
                </div>
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 text-center">
                  <span className="text-xs text-muted-foreground block">Businesses</span>
                  <span className="text-xl font-black text-sky-700 dark:text-sky-300">{zonePermits.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 text-center">
                  <span className="text-xs text-muted-foreground block">Incidents</span>
                  <span className="text-xl font-black text-red-700 dark:text-red-300">{zoneBlotters.length}</span>
                </div>
              </div>

              {/* Establishments in Zone */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-sky-600" /> Commercial Establishments ({zonePermits.length})
                </h4>
                {zonePermits.length > 0 ? (
                  <div className="space-y-2">
                    {zonePermits.map((p) => (
                      <div key={p.id} className="p-3 rounded-xl border bg-muted/30 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-foreground">{p.businessName}</p>
                          <p className="text-muted-foreground">{p.businessType} • Owner: {p.ownerName}</p>
                        </div>
                        <span className="px-2 py-1 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold">{p.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic p-3 rounded-xl bg-muted/20 border">No registered commercial establishments in this zone.</p>
                )}
              </div>

              {/* Blotter Incidents in Zone */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600" /> Blotter Incident Cases ({zoneBlotters.length})
                </h4>
                {zoneBlotters.length > 0 ? (
                  <div className="space-y-2">
                    {zoneBlotters.map((b) => (
                      <div key={b.id} className="p-3 rounded-xl border bg-muted/30 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-muted-foreground">{b.caseNumber}</span>
                          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">{b.status}</span>
                        </div>
                        <p className="font-bold text-foreground">{b.incidentType}</p>
                        <p className="text-muted-foreground">Complainant: {b.complainantName} • Location: {b.location}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic p-3 rounded-xl bg-muted/20 border">No recorded incident cases in this zone.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-muted/50 border-t flex justify-end">
              <Button size="sm" onClick={() => setShowModal(false)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
