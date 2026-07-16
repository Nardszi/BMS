"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  Search,
  CheckCircle2,
  XCircle,
  UserCheck,
  Clock,
  Users,
  AlertCircle,
} from "lucide-react";

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string;
  gender: string;
  civilStatus: string;
  occupation?: string;
  contactNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  status: string;
  createdAt: string;
  household: {
    id: string;
    address: string;
    purok: string;
  };
}

export default function PendingRegistrationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role;
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!["ADMIN", "SECRETARY", "KAGAWAD"].includes(userRole)) {
      router.push("/");
      return;
    }
    fetchResidents();
  }, [userRole, search, filterStatus, page]);

  async function fetchResidents() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: filterStatus,
        page: page.toString(),
        limit: "10",
      });
      const res = await fetch(`/api/residents?${params}`);
      const data = await res.json();
      setResidents(data.residents || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast({ title: "Error", description: "Failed to load registrations", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/residents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast({
          title: status === "APPROVED" ? "Resident Approved" : "Resident Rejected",
          description: `Registration has been ${status.toLowerCase()}.`,
          variant: "success",
        });
        setShowDetail(false);
        setSelectedResident(null);
        fetchResidents();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "error" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  const stats = {
    pending: residents.filter((r) => r.status === "PENDING").length,
  };

  if (!["ADMIN", "SECRETARY", "KAGAWAD"].includes(userRole)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Registrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and manage new resident registration requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {residents.filter((r) => r.status === "APPROVED").length}
              </p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {residents.filter((r) => r.status === "REJECTED").length}
              </p>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "PENDING" ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilterStatus("PENDING"); setPage(1); }}
            className={filterStatus === "PENDING" ? "bg-amber-600 hover:bg-amber-700" : ""}
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === "APPROVED" ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilterStatus("APPROVED"); setPage(1); }}
            className={filterStatus === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            Approved
          </Button>
          <Button
            variant={filterStatus === "REJECTED" ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilterStatus("REJECTED"); setPage(1); }}
            className={filterStatus === "REJECTED" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Rejected
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full pl-10 sm:w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Purok</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : residents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Users className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">No registrations found</p>
                  </td>
                </tr>
              ) : (
                residents.map((resident) => (
                  <tr key={resident.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {resident.lastName}, {resident.firstName} {resident.middleName || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      Purok {resident.household.purok}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {resident.contactNumber || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          resident.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : resident.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {resident.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(resident.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedResident(resident); setShowDetail(true); }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
          </DialogHeader>
          {selectedResident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedResident.lastName}, {selectedResident.firstName} {selectedResident.middleName || ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Birth Date</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedResident.birthDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Gender</p>
                  <p className="text-sm text-gray-900">{selectedResident.gender}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Civil Status</p>
                  <p className="text-sm text-gray-900">{selectedResident.civilStatus}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">
                    {selectedResident.household.address}, Purok {selectedResident.household.purok}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Contact</p>
                  <p className="text-sm text-gray-900">{selectedResident.contactNumber || "-"}</p>
                </div>
                {selectedResident.occupation && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Occupation</p>
                    <p className="text-sm text-gray-900">{selectedResident.occupation}</p>
                  </div>
                )}
                {selectedResident.emergencyContact && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Emergency Contact</p>
                    <p className="text-sm text-gray-900">{selectedResident.emergencyContact}</p>
                  </div>
                )}
              </div>

              {selectedResident.status === "PENDING" && (
                <div className="flex gap-3 border-t border-gray-100 pt-4">
                  <Button
                    onClick={() => handleStatusUpdate(selectedResident.id, "APPROVED")}
                    disabled={actionLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate(selectedResident.id, "REJECTED")}
                    disabled={actionLoading}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
