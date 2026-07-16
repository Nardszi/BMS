"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ShieldCheck, ShieldX, Clock, CreditCard } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface VerifyResult {
  idNumber: string;
  status: string;
  issueDate: string;
  expiryDate: string;
  resident: { name: string };
}

export default function VerifyPage() {
  const params = useParams();
  const idNumber = params.idNumber as string;
  const [data, setData] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/verify?idNumber=${idNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("ID not found"))
      .finally(() => setLoading(false));
  }, [idNumber]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    ACTIVE: { icon: ShieldCheck, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "VALID" },
    EXPIRED: { icon: Clock, color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "EXPIRED" },
    REVOKED: { icon: ShieldX, color: "text-red-700", bg: "bg-red-50 border-red-200", label: "REVOKED" },
    LOST: { icon: ShieldX, color: "text-gray-700", bg: "bg-gray-50 border-gray-200", label: "LOST" },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 relative h-16 w-16">
            <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain" />
          </div>
          <CardTitle className="text-lg text-blue-900">Barangay ID Verification</CardTitle>
          <p className="text-sm text-gray-500">Barangay IX - Daan Banwa</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <ShieldX className="mx-auto mb-3 h-12 w-12 text-red-400" />
              <p className="text-lg font-bold text-red-700">ID NOT FOUND</p>
              <p className="mt-1 text-sm text-red-600">
                No Barangay ID with number <span className="font-mono font-bold">{idNumber}</span> was found.
              </p>
            </div>
          ) : data && (
            <>
              <div className={`rounded-lg border p-6 text-center ${statusConfig[data.status]?.bg}`}>
                {(() => {
                  const Icon = statusConfig[data.status]?.icon || ShieldX;
                  return <Icon className={`mx-auto mb-2 h-12 w-12 ${statusConfig[data.status]?.color}`} />;
                })()}
                <p className={`text-2xl font-bold ${statusConfig[data.status]?.color}`}>
                  {statusConfig[data.status]?.label}
                </p>
              </div>

              <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">ID Number</span>
                  <span className="font-mono font-bold text-blue-700">{data.idNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Holder</span>
                  <span className="text-sm font-medium">{data.resident.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Date Issued</span>
                  <span className="text-sm">{formatDate(data.issueDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Valid Until</span>
                  <span className="text-sm">{formatDate(data.expiryDate)}</span>
                </div>
              </div>

              <p className="text-center text-xs text-gray-400">
                This is an official verification page of Barangay IX - Daan Banwa, City of Victorias.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
