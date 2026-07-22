"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Users, Building2, MapPin, ShieldAlert, Home, Award, RefreshCw, Layers, FileCheck, CheckCircle } from "lucide-react";

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

interface GISData {
  puroks: PurokData[];
  permits: any[];
  blotters: any[];
  center: [number, number];
}

export default function BarangayOverviewPage() {
  const [data, setData] = useState<GISData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gis");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load Barangay IX overview data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const totalPopulation = data?.puroks.reduce((acc, p) => acc + p.population, 0) || 0;
  const totalHouseholds = data?.puroks.reduce((acc, p) => acc + p.households, 0) || 0;
  const totalVoters = data?.puroks.reduce((acc, p) => acc + p.voters, 0) || 0;
  const totalBusinesses = data?.permits.length || 0;
  const totalIncidents = data?.blotters.length || 0;
  const totalMales = data?.puroks.reduce((acc, p) => acc + p.males, 0) || 0;
  const totalFemales = data?.puroks.reduce((acc, p) => acc + p.females, 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barangay IX (Daan Banwa) Overview"
        subtitle="Comprehensive administrative, demographic, and spatial overview of Barangay IX, Victorias City, Negros Occidental"
      >
        <Button variant="outline" size="sm" onClick={fetchOverviewData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Overview
        </Button>
      </PageHeader>

      {/* Barangay Profile Banner Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl overflow-hidden">
        <CardContent className="p-8">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-semibold">
                <MapPin className="h-3.5 w-3.5" /> Victorias City, Negros Occidental • Region VI (NIR)
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">Barangay IX — Daan Banwa</h2>
              <p className="text-blue-100/80 text-sm leading-relaxed max-w-xl">
                Barangay IX (formerly known as Daan Banwa) has a total land area of 23.24 hectares and is politically subdivided into 10 active Puroks. This management overview aggregates resident demographics, commercial establishments, and community safety records.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs font-medium text-blue-200">
                <div className="flex items-center gap-1.5"><Home className="h-4 w-4 text-blue-400" /> Postal Code: 6119</div>
                <div className="flex items-center gap-1.5"><Layers className="h-4 w-4 text-blue-400" /> Total Land Area: 23.24 Hectares</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-400" /> Active Governance Status</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <div className="text-center p-3 rounded-lg bg-black/20">
                <p className="text-xs text-blue-200 font-medium">Puroks</p>
                <p className="text-2xl font-black text-white mt-1">10</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-black/20">
                <p className="text-xs text-blue-200 font-medium">Households</p>
                <p className="text-2xl font-black text-white mt-1">{totalHouseholds}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-black/20">
                <p className="text-xs text-blue-200 font-medium">Voters</p>
                <p className="text-2xl font-black text-white mt-1">{totalVoters}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-black/20">
                <p className="text-xs text-blue-200 font-medium">Businesses</p>
                <p className="text-2xl font-black text-white mt-1">{totalBusinesses}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Population</CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{totalPopulation}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span>Male: {totalMales}</span> • <span>Female: {totalFemales}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Households</CardTitle>
            <Home className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{totalHouseholds}</div>
            <p className="text-xs text-muted-foreground mt-1">Across 10 Puroks</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Permits</CardTitle>
            <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{totalBusinesses}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered commercial establishments</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Blotter Cases</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{totalIncidents}</div>
            <p className="text-xs text-muted-foreground mt-1">Recorded community incident reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Purok Breakdown Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Purok Demographics & Statistics</h3>
            <p className="text-xs text-muted-foreground">Detailed breakdown of residents, voters, and activity per purok in Barangay IX</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.puroks.map((p) => (
            <Card key={p.purok} className="border-0 shadow-md dark:bg-gray-900 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3 border-b dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black">
                      {p.purok}
                    </span>
                    <span>Purok {p.purok}</span>
                  </CardTitle>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                    {p.households} Households
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/30">
                    <span className="text-muted-foreground block">Population</span>
                    <span className="text-base font-black text-blue-900 dark:text-blue-100 mt-0.5 block">{p.population}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30">
                    <span className="text-muted-foreground block">Registered Voters</span>
                    <span className="text-base font-black text-indigo-900 dark:text-indigo-100 mt-0.5 block">{p.voters}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Gender Ratio:</span>
                    <span className="font-semibold text-foreground">👨 {p.males} Male / 👩 {p.females} Female</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Active Businesses:</span>
                    <span className="font-semibold text-sky-600 dark:text-sky-400">{p.businessCount} units</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Blotter Cases:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{p.blotterCount} cases</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
