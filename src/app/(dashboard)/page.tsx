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
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-emerald-100 text-emerald-800",
    RELEASED: "bg-blue-100 text-blue-800",
    DENIED: "bg-red-100 text-red-800",
    OPEN: "bg-red-100 text-red-800",
    RESOLVED: "bg-emerald-100 text-emerald-800",
    ESCALATED: "bg-amber-100 text-amber-800",
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
        <Card className="relative overflow-hidden border-0 shadow-md transition-shadow hover:shadow-lg">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Residents</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalResidents}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400/70">Registered inhabitants</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md transition-shadow hover:shadow-lg">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Certificates</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingCertificates}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400/70">Awaiting approval</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md transition-shadow hover:shadow-lg">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-red-600" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Blotter Cases</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.openBlotterCases}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400/70">Active investigations</p>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md transition-shadow hover:shadow-lg">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Permits</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.activePermits}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400/70">Operating businesses</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <Building2 className="h-6 w-6 text-emerald-600" />
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
        <Card className="lg:col-span-1 border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="dark:text-gray-100">Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/residents" className="group flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-blue-200 hover:bg-blue-50 dark:hover:border-blue-800 dark:hover:bg-blue-950">
              <div className="rounded-lg bg-blue-100 p-2 transition-colors group-hover:bg-blue-200">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Manage Residents</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">View and update records</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-500 dark:text-gray-400/70 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
            </Link>
            <Link href="/certificates" className="group flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-amber-200 hover:bg-amber-50 dark:hover:border-amber-800 dark:hover:bg-amber-950">
              <div className="rounded-lg bg-amber-100 p-2 transition-colors group-hover:bg-amber-200">
                <FileCheck className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Certificates</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Issue and track requests</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-500 dark:text-gray-400/70 transition-transform group-hover:translate-x-1 group-hover:text-amber-600" />
            </Link>
            <Link href="/blotter" className="group flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-red-200 hover:bg-red-50 dark:hover:border-red-800 dark:hover:bg-red-950">
              <div className="rounded-lg bg-red-100 p-2 transition-colors group-hover:bg-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Blotter Reports</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">File and manage cases</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-500 dark:text-gray-400/70 transition-transform group-hover:translate-x-1 group-hover:text-red-600" />
            </Link>
            <Link href="/reports" className="group flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-emerald-200 hover:bg-emerald-50 dark:hover:border-emerald-800 dark:hover:bg-emerald-950">
              <div className="rounded-lg bg-emerald-100 p-2 transition-colors group-hover:bg-emerald-200">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Reports</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">View analytics and stats</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-500 dark:text-gray-400/70 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Certificates */}
        <Card className="lg:col-span-1 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="dark:text-gray-100">Recent Requests</span>
            </CardTitle>
            <Link href="/certificates" className="text-xs font-medium text-blue-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentCertificates && stats.recentCertificates.length > 0 ? (
              <div className="space-y-3">
                {stats.recentCertificates.slice(0, 5).map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cert.resident.lastName}, {cert.resident.firstName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{typeLabels[cert.type] || cert.type}</p>
                    </div>
                    <Badge className={`ml-2 flex-shrink-0 ${statusColors[cert.status] || ""}`}>
                      {cert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <FileText className="mx-auto mb-2 h-8 w-8 text-gray-500 dark:text-gray-400/50" />
                No recent requests
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="lg:col-span-1 border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="dark:text-gray-100">Announcements</span>
            </CardTitle>
            <Link href="/announcements" className="text-xs font-medium text-blue-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {stats.announcements && stats.announcements.length > 0 ? (
              <div className="space-y-3">
                {stats.announcements.slice(0, 4).map((ann) => (
                  <div key={ann.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{ann.title}</h4>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{ann.content}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400/70">
                      <span>{ann.postedBy?.name}</span>
                      <span>&middot;</span>
                      <span>{new Date(ann.createdAt).toLocaleDateString("en-PH")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <Megaphone className="mx-auto mb-2 h-8 w-8 text-gray-500 dark:text-gray-400/50" />
                No announcements
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Footer */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-200 dark:bg-blue-800 p-3">
              <UserCheck className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stats.totalResidents}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Registered Residents</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-emerald-200 dark:bg-emerald-800 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">{stats.activePermits}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Active Business Permits</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-amber-200 dark:bg-amber-800 p-3">
              <Clock className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">{stats.pendingCertificates}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Pending Certificates</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purok Breakdown */}
      {stats.purokCounts && stats.purokCounts.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="dark:text-gray-100">Residents per Purok</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.purokCounts.map((item) => {
                const maxCount = Math.max(...stats.purokCounts.map((p) => p.count), 1);
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={item.purok} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100/80">
                        Purok {item.purok}
                      </span>
                      <span className="text-lg font-bold text-blue-900 dark:text-blue-300">{item.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
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
