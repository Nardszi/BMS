"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Users, Home, Vote, FileText, Activity, Scale, Baby, Briefcase, Heart, Printer, TrendingUp, Award, AlertTriangle, Shield } from "lucide-react";

const COLORS = ["#1a56db", "#0e7c61", "#f59e0b", "#dc2626", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
const GENDER_COLORS = ["#3b82f6", "#ec4899", "#a855f7"];
const AGE_COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6"];
const CIVIL_COLORS = ["#1a56db", "#0e7c61", "#f59e0b", "#dc2626", "#8b5cf6", "#ec4899"];

const typeLabels: Record<string, string> = {
  CLEARANCE: "Clearance", RESIDENCY: "Residency", INDIGENCY: "Indigency", BUSINESS_PERMIT: "Business Permit",
};
const civilLabels: Record<string, string> = {
  SINGLE: "Single", MARRIED: "Married", WIDOWED: "Widowed", SEPARATED: "Separated", DIVORCED: "Divorced",
};

interface ReportData {
  populationByPurok: Array<{ purok: string; count: number }>;
  purokDetails: Array<{ purok: string; population: number; households: number; avgSize: number }>;
  genderBreakdown: Array<{ gender: string; count: number }>;
  certificatesByType: Array<{ type: string; count: number }>;
  civilStatusBreakdown: Array<{ status: string; count: number }>;
  ageDistribution: Array<{ group: string; count: number }>;
  totalResidents: number;
  totalHouseholds: number;
  voterCount: number;
  voterPercentage: number;
  sexRatio: number;
  householdStats: { average: number; min: number; max: number };
  permitStats: { total: number; active: number; expired: number; revoked: number };
  blotterStats: { total: number; open: number; resolved: number; escalated: number };
  monthlyResidentTrend: Array<{ month: string; residents: number }>;
  monthlyCertTrend: Array<{ month: string; certificates: number }>;
  topPurok: { purok: string; population: number } | null;
  leastPurok: { purok: string; population: number } | null;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/reports?year=${year}`)
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, [year]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading reports...</p></div>;
  }

  if (error || !data) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Failed to load reports. Please try again later.</p></div>;
  }

  const handlePrint = () => {
    if (!data) return;
    const w = window.open("", "_blank", "width=816,height=1056");
    if (!w) return;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const sealUrl = `${baseUrl}/barangay-seal.png`;
    w.document.open();
    w.document.write(`<!DOCTYPE html><html><head><title>Barangay Report ${year}</title>
    <style>
      @page{size:letter;margin:0}*{margin:0;padding:0;box-sizing:border-box}
      body{font-family:"Times New Roman",serif;color:#1a1a1a;width:8.5in;padding:0.5in 0.7in;position:relative;font-size:10pt}
      .wm{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:5in;height:5in;opacity:0.05;pointer-events:none;z-index:0}
      .wm img{width:100%;height:100%;object-fit:contain}
      .content{position:relative;z-index:1}
      h1{text-align:center;font-size:16pt;letter-spacing:3px;text-transform:uppercase;border-bottom:2px solid #1a1a1a;padding-bottom:4px;margin-bottom:2px}
      .subtitle{text-align:center;font-size:9pt;color:#555;margin-bottom:12px}
      h2{font-size:11pt;color:#1a3a6b;border-bottom:1px solid #ccc;padding-bottom:2px;margin:12px 0 6px}
      .stats{display:flex;gap:12px;margin-bottom:12px}
      .stat{flex:1;text-align:center;padding:6px;border:1px solid #ddd;border-radius:4px}
      .stat .num{font-size:18pt;font-weight:bold;color:#1a3a6b}
      .stat .label{font-size:8pt;color:#666}
      table{width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:8px}
      th{background:#f0f0f0;border:1px solid #999;padding:3px 6px;text-align:left;font-weight:bold}
      td{border:1px solid #ccc;padding:3px 6px}
      .seal{position:fixed;bottom:0.4in;right:0.6in;width:1in;height:1in;opacity:0.7;z-index:0}
      .seal img{width:100%;height:100%;object-fit:contain}
    </style></head><body>
    <div class="wm"><img src="${sealUrl}" alt=""></div>
    <div class="content">
      <h1>Barangay Report ${year}</h1>
      <div class="subtitle">Barangay IX - Daan Banwa, City of Victorias, Negros Occidental</div>

      <div class="stats">
        <div class="stat"><div class="num">${data.totalResidents}</div><div class="label">Total Population</div></div>
        <div class="stat"><div class="num">${data.totalHouseholds}</div><div class="label">Households</div></div>
        <div class="stat"><div class="num">${data.voterCount}</div><div class="label">Voters (${data.voterPercentage}%)</div></div>
        <div class="stat"><div class="num">${data.householdStats.average}</div><div class="label">Avg. Household Size</div></div>
      </div>

      <h2>Population by Purok</h2>
      <table><thead><tr><th>Purok</th><th>Population</th><th>Households</th><th>Avg. Size</th></tr></thead><tbody>
      ${data.purokDetails.map((p) => `<tr><td>${p.purok}</td><td>${p.population}</td><td>${p.households}</td><td>${p.avgSize}</td></tr>`).join("")}
      </tbody></table>

      <h2>Demographics</h2>
      <table><thead><tr><th>Gender</th><th>Count</th><th>%</th></tr></thead><tbody>
      ${data.genderBreakdown.map((g) => {
        const pct = data.totalResidents > 0 ? Math.round((g.count / data.totalResidents) * 100) : 0;
        return `<tr><td>${g.gender === "MALE" ? "Male" : "Female"}</td><td>${g.count}</td><td>${pct}%</td></tr>`;
      }).join("")}
      </tbody></table>

      <table><thead><tr><th>Age Group</th><th>Count</th><th>%</th></tr></thead><tbody>
      ${data.ageDistribution.map((a) => {
        const pct = data.totalResidents > 0 ? Math.round((a.count / data.totalResidents) * 100) : 0;
        return `<tr><td>${a.group}</td><td>${a.count}</td><td>${pct}%</td></tr>`;
      }).join("")}
      </tbody></table>

      <table><thead><tr><th>Civil Status</th><th>Count</th></tr></thead><tbody>
      ${data.civilStatusBreakdown.map((c) => `<tr><td>${civilLabels[c.status] || c.status}</td><td>${c.count}</td></tr>`).join("")}
      </tbody></table>

      <h2>Permits & Blotter</h2>
      <table><thead><tr><th>Business Permits</th><th>Count</th></tr></thead><tbody>
      <tr><td>Active</td><td>${data.permitStats.active}</td></tr>
      <tr><td>Expired</td><td>${data.permitStats.expired}</td></tr>
      <tr><td>Revoked</td><td>${data.permitStats.revoked}</td></tr>
      <tr><td><b>Total</b></td><td><b>${data.permitStats.total}</b></td></tr>
      </tbody></table>

      <table><thead><tr><th>Blotter Reports</th><th>Count</th></tr></thead><tbody>
      <tr><td>Open</td><td>${data.blotterStats.open}</td></tr>
      <tr><td>Resolved</td><td>${data.blotterStats.resolved}</td></tr>
      <tr><td>Escalated</td><td>${data.blotterStats.escalated}</td></tr>
      <tr><td><b>Total</b></td><td><b>${data.blotterStats.total}</b></td></tr>
      </tbody></table>
    </div>
    <div class="seal"><img src="${sealUrl}" alt=""></div>
    </body></html>`);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };

  if (!data) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading reports...</p></div>;
  }

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500">Barangay statistics and data overview</p>
        </div>
        <div className="flex gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Report</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700"><Users className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold">{data.totalResidents}</div><div className="text-xs text-gray-500">Population</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700"><Home className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold">{data.totalHouseholds}</div><div className="text-xs text-gray-500">Households</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700"><Vote className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold">{data.voterCount}</div><div className="text-xs text-gray-500">Voters ({data.voterPercentage}%)</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700"><Scale className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold">{data.householdStats.average}</div><div className="text-xs text-gray-500">Avg. HH Size</div></div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-100 text-cyan-700"><Activity className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold">{data.sexRatio}</div><div className="text-xs text-gray-500">Sex Ratio (M/F)</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700"><FileText className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold">{data.permitStats.active}</div><div className="text-xs text-gray-500">Active Permits</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-700"><AlertTriangle className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold">{data.blotterStats.open}</div><div className="text-xs text-gray-500">Open Blotters</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 text-violet-700"><Award className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold text-sm">{data.topPurok?.purok || "-"}</div><div className="text-xs text-gray-500">Most Populated</div></div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Population by Purok</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.populationByPurok}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="purok" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#1a56db" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Gender Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.genderBreakdown.map((g) => ({ name: g.gender === "MALE" ? "Male" : "Female", count: g.count }))}
                  cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} dataKey="count"
                >
                  {data.genderBreakdown.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Age Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.ageDistribution}
                  cx="50%" cy="50%" outerRadius={90} label={({ group, percent }: any) => `${group.split(" ")[0]} ${(percent * 100).toFixed(0)}%`} dataKey="count" nameKey="group"
                >
                  {data.ageDistribution.map((_, i) => <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Civil Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.civilStatusBreakdown.map((c) => ({ name: civilLabels[c.status] || c.status, count: c.count }))}
                  cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} dataKey="count"
                >
                  {data.civilStatusBreakdown.map((_, i) => <Cell key={i} fill={CIVIL_COLORS[i % CIVIL_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Monthly Trends ({year})</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.monthlyResidentTrend.map((r, i) => ({ ...r, certificates: data.monthlyCertTrend[i]?.certificates || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="residents" stroke="#1a56db" strokeWidth={2} name="New Residents" />
              <Line type="monotone" dataKey="certificates" stroke="#0e7c61" strokeWidth={2} name="Certificates" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Purok Table + Permits/Blotters */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Purok Comparison</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">Purok</th>
                  <th className="text-right p-3 font-medium">Population</th>
                  <th className="text-right p-3 font-medium">Households</th>
                  <th className="text-right p-3 font-medium">Avg. Size</th>
                </tr>
              </thead>
              <tbody>
                {data.purokDetails.map((p) => (
                  <tr key={p.purok} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3 font-medium">{p.purok}</td>
                    <td className="p-3 text-right">{p.population}</td>
                    <td className="p-3 text-right">{p.households}</td>
                    <td className="p-3 text-right">{p.avgSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Business Permits</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-emerald-50 rounded-lg"><div className="text-xl font-bold text-emerald-700">{data.permitStats.active}</div><div className="text-xs text-gray-500">Active</div></div>
                <div className="text-center p-3 bg-red-50 rounded-lg"><div className="text-xl font-bold text-red-700">{data.permitStats.expired}</div><div className="text-xs text-gray-500">Expired</div></div>
                <div className="text-center p-3 bg-amber-50 rounded-lg"><div className="text-xl font-bold text-amber-700">{data.permitStats.revoked}</div><div className="text-xs text-gray-500">Revoked</div></div>
                <div className="text-center p-3 bg-blue-50 rounded-lg"><div className="text-xl font-bold text-blue-700">{data.permitStats.total}</div><div className="text-xs text-gray-500">Total</div></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Blotter Reports</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-amber-50 rounded-lg"><div className="text-xl font-bold text-amber-700">{data.blotterStats.open}</div><div className="text-xs text-gray-500">Open</div></div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg"><div className="text-xl font-bold text-emerald-700">{data.blotterStats.resolved}</div><div className="text-xs text-gray-500">Resolved</div></div>
                <div className="text-center p-3 bg-red-50 rounded-lg"><div className="text-xl font-bold text-red-700">{data.blotterStats.escalated}</div><div className="text-xs text-gray-500">Escalated</div></div>
                <div className="text-center p-3 bg-blue-50 rounded-lg"><div className="text-xl font-bold text-blue-700">{data.blotterStats.total}</div><div className="text-xs text-gray-500">Total</div></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden"><div ref={printRef}></div></div>
    </div>
  );
}
