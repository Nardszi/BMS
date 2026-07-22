"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  FileText,
  AlertTriangle,
  Building2,
  Megaphone,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  FileCheck,
  Activity,
  BarChart3,
} from "lucide-react";
import { BARANGAY_ADDRESS } from "@/lib/constants";

interface DashboardStats {
  totalResidents: number;
  pendingCertificates: number;
  openBlotterCases: number;
  activePermits: number;
  expiringSoonPermits: number;
  totalHouseholds: number;
  totalOfficials: number;
  purokCounts: Array<{ purok: string; count: number }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
    postedBy: { name: string };
  }>;
  recentCertificates: Array<{
    id: string;
    type: string;
    status: string;
    requestDate: string;
    resident: { firstName: string; lastName: string };
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const role = session?.user?.role ?? "";

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50",
    APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50",
    RELEASED: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50",
    DENIED: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800/50",
    OPEN: "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800/50",
    RESOLVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50",
    ESCALATED: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50",
  };

  const typeLabels: Record<string, string> = {
    CLEARANCE: "Barangay Clearance",
    RESIDENCY: "Certificate of Residency",
    INDIGENCY: "Certificate of Indigency",
    BUSINESS_PERMIT: "Business Permit",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-gray-500 dark:text-gray-400">Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-900 via-blue-800 to-emerald-700 p-6 text-white shadow-lg">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-shrink-0 rounded-full bg-white/20 p-2 backdrop-blur-sm">
              <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain p-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {getGreeting()}, {session?.user?.name?.split(" ")[0]}
              </h1>
              <p className="text-blue-100">
                {BARANGAY_ADDRESS}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge className="bg-white/20 text-white hover:bg-white/30">{role}</Badge>
                <span className="text-xs text-blue-200">
                  {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/5" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-900">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Residents</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">{stats.totalResidents}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <TrendingUp className="h-3.5 w-3.5" /> Registered inhabitants
                </div>
              </div>
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/50 p-3.5 shadow-inner">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-900">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Certificates</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">{stats.pendingCertificates}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <Clock className="h-3.5 w-3.5" /> Awaiting approval
                </div>
              </div>
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/50 p-3.5 shadow-inner">
                <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-900">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-red-600" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Open Blotter Cases</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">{stats.openBlotterCases}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" /> Active investigations
                </div>
              </div>
              <div className="rounded-2xl bg-red-50 dark:bg-red-950/50 p-3.5 shadow-inner">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-900">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Permits</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">{stats.activePermits}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Operating businesses
                </div>
              </div>
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 p-3.5 shadow-inner">
                <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Permits Warning */}
      {stats.expiringSoonPermits > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 shadow-sm">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-xl bg-amber-100 p-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">Permit Renewal Reminder</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {stats.expiringSoonPermits} business permit(s) are expiring within 30 days.{" "}
                <Link href="/permits" className="font-medium underline">
                  View all permits
                </Link>
              </p>
            </div>
            <Link href="/permits">
              <Button variant="outline" size="sm" className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900">
                View <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1 border-0 shadow-md dark:bg-gray-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Link href="/residents" className="group flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3.5 transition-all hover:border-blue-300 hover:bg-blue-50/60 dark:hover:border-blue-700 dark:hover:bg-blue-950/40 shadow-sm hover:shadow">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/50 p-2.5 transition-colors group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Manage Residents</p>
                <p className="text-xs text-muted-foreground">View and update records</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </Link>
            <Link href="/certificates" className="group flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3.5 transition-all hover:border-amber-300 hover:bg-amber-50/60 dark:hover:border-amber-700 dark:hover:bg-amber-950/40 shadow-sm hover:shadow">
              <div className="rounded-lg bg-amber-100 dark:bg-amber-900/50 p-2.5 transition-colors group-hover:bg-amber-200 dark:group-hover:bg-amber-800/60">
                <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Certificates</p>
                <p className="text-xs text-muted-foreground">Issue and track requests</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
            </Link>
            <Link href="/blotter" className="group flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3.5 transition-all hover:border-red-300 hover:bg-red-50/60 dark:hover:border-red-700 dark:hover:bg-red-950/40 shadow-sm hover:shadow">
              <div className="rounded-lg bg-red-100 dark:bg-red-900/50 p-2.5 transition-colors group-hover:bg-red-200 dark:group-hover:bg-red-800/60">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Blotter Reports</p>
                <p className="text-xs text-muted-foreground">File and manage cases</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-red-600 dark:group-hover:text-red-400" />
            </Link>
            <Link href="/reports" className="group flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3.5 transition-all hover:border-emerald-300 hover:bg-emerald-50/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 shadow-sm hover:shadow">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/50 p-2.5 transition-colors group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/60">
                <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Reports</p>
                <p className="text-xs text-muted-foreground">View analytics and stats</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Certificates */}
        <Card className="lg:col-span-1 border-0 shadow-md dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Recent Requests</span>
            </CardTitle>
            <Link href="/certificates" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentCertificates && stats.recentCertificates.length > 0 ? (
              <div className="space-y-2.5">
                {stats.recentCertificates.slice(0, 5).map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 p-3 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {cert.resident.lastName}, {cert.resident.firstName}
                      </p>
                      <p className="text-xs text-muted-foreground">{typeLabels[cert.type] || cert.type}</p>
                    </div>
                    <Badge className={`ml-2 flex-shrink-0 text-[10px] font-semibold ${statusColors[cert.status] || ""}`}>
                      {cert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                No recent requests
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="lg:col-span-1 border-0 shadow-md dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Megaphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Announcements</span>
            </CardTitle>
            <Link href="/announcements" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {stats.announcements && stats.announcements.length > 0 ? (
              <div className="space-y-2.5">
                {stats.announcements.slice(0, 4).map((ann) => (
                  <div key={ann.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-foreground">{ann.title}</h4>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ann.content}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground/80">
                      <span>{ann.postedBy?.name}</span>
                      <span>&middot;</span>
                      <span>{new Date(ann.createdAt).toLocaleDateString("en-PH")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Megaphone className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                No announcements
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Footer */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/80 via-blue-50 to-blue-100/60 dark:from-blue-950/80 dark:via-blue-900/40 dark:to-slate-900 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4.5">
            <div className="rounded-2xl bg-blue-200/70 dark:bg-blue-900/60 p-3 shadow-inner">
              <UserCheck className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-blue-950 dark:text-blue-100">{stats.totalResidents}</p>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Registered Residents</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 via-emerald-50 to-emerald-100/60 dark:from-emerald-950/80 dark:via-emerald-900/40 dark:to-slate-900 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4.5">
            <div className="rounded-2xl bg-emerald-200/70 dark:bg-emerald-900/60 p-3 shadow-inner">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-emerald-950 dark:text-emerald-100">{stats.activePermits}</p>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Active Business Permits</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-amber-100 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 via-amber-50 to-amber-100/60 dark:from-amber-950/80 dark:via-amber-900/40 dark:to-slate-900 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4.5">
            <div className="rounded-2xl bg-amber-200/70 dark:bg-amber-900/60 p-3 shadow-inner">
              <Clock className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-amber-950 dark:text-amber-100">{stats.pendingCertificates}</p>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Pending Certificates</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purok Breakdown */}
      {stats.purokCounts && stats.purokCounts.length > 0 && (
        <Card className="border-0 shadow-md dark:bg-gray-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Residents per Purok</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.purokCounts.map((item) => {
                const maxCount = Math.max(...stats.purokCounts.map((p) => p.count), 1);
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={item.purok} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-card p-3.5 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">
                        Purok {item.purok}
                      </span>
                      <span className="text-lg font-black text-blue-600 dark:text-blue-400">{item.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
