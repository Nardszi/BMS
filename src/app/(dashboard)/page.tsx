"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, AlertTriangle, Building2, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalResidents: number;
  pendingCertificates: number;
  openBlotterCases: number;
  activePermits: number;
  expiringSoonPermits: number;
  announcements: Array<{ id: string; title: string; content: string; createdAt: string }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading...</p></div>;
  }

  const cards = [
    { title: "Total Residents", value: stats.totalResidents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Pending Certificates", value: stats.pendingCertificates, icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Open Blotter Cases", value: stats.openBlotterCases, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { title: "Active Permits", value: stats.activePermits, icon: Building2, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">Barangay IX - Daan Banwa, City of Victorias</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.expiringSoonPermits > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4">
            <Building2 className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Permit Renewal Reminder</p>
              <p className="text-sm text-amber-700">
                {stats.expiringSoonPermits} business permit(s) expiring within 30 days
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Recent Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.announcements.length === 0 ? (
            <p className="text-sm text-gray-500">No announcements posted yet.</p>
          ) : (
            <div className="space-y-4">
              {stats.announcements.map((ann) => (
                <div key={ann.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{ann.title}</h4>
                    <Badge variant="outline">
                      {new Date(ann.createdAt).toLocaleDateString("en-PH")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
