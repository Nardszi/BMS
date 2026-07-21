"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Plus, Search, Pencil, Trash2, CheckCircle2, XCircle, Eye, Users, Clock, ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PUROK_OPTIONS } from "@/lib/constants";

const residentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  birthDate: z.string().min(1, "Birth date is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  civilStatus: z.enum(["SINGLE", "MARRIED", "WIDOWED", "SEPARATED", "DIVORCED"]),
  address: z.string().min(1, "Address is required"),
  purok: z.string().min(1, "Purok is required"),
  occupation: z.string().optional(),
  contactNumber: z.string().min(1, "Contact number is required"),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  isRegisteredVoter: z.boolean().optional(),
});

type ResidentForm = z.infer<typeof residentSchema>;

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  birthDate: string;
  gender: string;
  civilStatus: string;
  occupation: string | null;
  contactNumber: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  isRegisteredVoter: boolean;
  status: string;
  createdAt: string;
  household: { id: string; householdNumber: string; purok: string; address: string };
}

export default function ResidentsPage() {
  const { data: session } = useSession();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [purokFilter, setPurokFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("lastName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [detailResident, setDetailResident] = useState<Resident | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  function exportToCSV() {
    const headers = ["First Name", "Last Name", "Middle Name", "Gender", "Civil Status", "Purok", "Address", "Contact Number", "Status"];
    const rows = residents.map((r) => [
      r.firstName,
      r.lastName,
      r.middleName || "",
      r.gender,
      r.civilStatus,
      r.household.purok,
      r.household.address,
      r.contactNumber || "",
      r.status,
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `residents-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const role = session?.user?.role ?? "";
  const canEdit = ["ADMIN", "SECRETARY", "STAFF"].includes(role);
  const canDelete = ["ADMIN", "SECRETARY"].includes(role);
  const canApprove = ["ADMIN", "SECRETARY", "KAGAWAD"].includes(role);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ResidentForm>({
    resolver: zodResolver(residentSchema),
  });

  const fetchResidents = async () => {
    const params = new URLSearchParams({ page: String(page), limit: "15", sortBy, sortOrder });
    if (search) params.set("search", search);
    if (purokFilter) params.set("purok", purokFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/residents?${params}`);
    const data = await res.json();
    setResidents(data.residents || []);
    setTotalPages(data.totalPages || 1);
    setPendingCount(data.pendingCount || 0);
    setApprovedCount(data.approvedCount || 0);
    setRejectedCount(data.rejectedCount || 0);
  };

  useEffect(() => { fetchResidents(); }, [page, search, purokFilter, statusFilter, sortBy, sortOrder]);

  async function onSubmit(data: ResidentForm) {
    try {
      if (editing) {
        const res = await fetch(`/api/residents/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            birthDate: data.birthDate,
            gender: data.gender,
            civilStatus: data.civilStatus,
            address: data.address,
            purok: data.purok,
            occupation: data.occupation,
            contactNumber: data.contactNumber,
            emergencyContact: data.emergencyContact,
            emergencyPhone: data.emergencyPhone,
            isRegisteredVoter: data.isRegisteredVoter || false,
          }),
        });
        if (res.ok) {
          toast({ title: "Resident Updated", variant: "success" });
          setOpen(false);
          setEditing(null);
          reset();
          fetchResidents();
        } else {
          const err = await res.json();
          toast({ title: "Error", description: err.error, variant: "error" });
        }
      } else {
        const res = await fetch("/api/residents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            birthDate: data.birthDate,
            gender: data.gender,
            civilStatus: data.civilStatus,
            address: data.address,
            purok: data.purok,
            occupation: data.occupation,
            contactNumber: data.contactNumber,
            emergencyContact: data.emergencyContact,
            emergencyPhone: data.emergencyPhone,
            isRegisteredVoter: data.isRegisteredVoter || false,
          }),
        });
        if (res.ok) {
          toast({ title: "Resident Added", variant: "success" });
          setOpen(false);
          reset();
          fetchResidents();
        } else {
          const err = await res.json();
          toast({ title: "Error", description: err.error, variant: "error" });
        }
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
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
          variant: "success",
        });
        setShowDetail(false);
        setDetailResident(null);
        fetchResidents();
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this resident?")) return;
    const res = await fetch(`/api/residents/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Resident Deleted", variant: "success" });
      fetchResidents();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to delete resident", variant: "error" });
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected resident(s)? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/residents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        toast({ title: `${selectedIds.length} resident(s) deleted`, variant: "success" });
        setSelectedIds([]);
        fetchResidents();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to delete residents", variant: "error" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    }
  }

  function printAll() {
    const headers = ["Name", "Purok", "Contact", "Status", "Voter"];
    const rows = residents.map((r) => [
      `${r.lastName}, ${r.firstName} ${r.middleName || ""}`,
      `Purok ${r.household.purok}`,
      r.contactNumber || "-",
      r.status,
      r.isRegisteredVoter ? "Yes" : "No",
    ]);
    const html = `
      <html><head><title>Residents List</title>
      <style>
        @page { size: landscape; margin: 15mm; }
        body { font-family: Arial, sans-serif; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        p { font-size: 12px; color: #666; margin: 0 0 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; }
        tr:nth-child(even) { background: #fafafa; }
      </style>
      </head><body>
      <h1>Barangay Residents List</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table>
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
      <script>window.onload = function() { window.print(); }</script>
      </body></html>`;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  function openEdit(resident: Resident) {
    setEditing(resident);
    setValue("firstName", resident.firstName);
    setValue("lastName", resident.lastName);
    setValue("middleName", resident.middleName || "");
    setValue("birthDate", resident.birthDate.split("T")[0]);
    setValue("gender", resident.gender as "MALE" | "FEMALE");
    setValue("civilStatus", resident.civilStatus as "SINGLE" | "MARRIED" | "WIDOWED" | "SEPARATED" | "DIVORCED");
    setValue("address", resident.household.address);
    setValue("purok", resident.household.purok);
    setValue("occupation", resident.occupation || "");
    setValue("contactNumber", resident.contactNumber || "");
    setValue("emergencyContact", resident.emergencyContact || "");
    setValue("emergencyPhone", resident.emergencyPhone || "");
    setValue("isRegisteredVoter", resident.isRegisteredVoter);
    setOpen(true);
  }

  function openNew() {
    setEditing(null);
    reset();
    setOpen(true);
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Residents" subtitle="Manage barangay resident records and registrations">
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="bg-blue-900 hover:bg-blue-800">
                <Plus className="mr-2 h-4 w-4" /> Add Resident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Resident" : "Add New Resident"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input {...register("firstName")} placeholder="Juan" />
                    {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input {...register("lastName")} placeholder="dela Cruz" />
                    {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input {...register("middleName")} placeholder="Optional" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Birth Date *</Label>
                    <Input type="date" {...register("birthDate")} />
                    {errors.birthDate && <p className="text-sm text-red-500">{errors.birthDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Select onValueChange={(v) => setValue("gender", v as "MALE" | "FEMALE")} defaultValue={editing?.gender}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Civil Status *</Label>
                    <Select onValueChange={(v) => setValue("civilStatus", v as "SINGLE" | "MARRIED" | "WIDOWED" | "SEPARATED" | "DIVORCED")} defaultValue={editing?.civilStatus}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Single</SelectItem>
                        <SelectItem value="MARRIED">Married</SelectItem>
                        <SelectItem value="WIDOWED">Widowed</SelectItem>
                        <SelectItem value="SEPARATED">Separated</SelectItem>
                        <SelectItem value="DIVORCED">Divorced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Number *</Label>
                    <Input {...register("contactNumber")} placeholder="09XXXXXXXXX" />
                    {errors.contactNumber && <p className="text-sm text-red-500">{errors.contactNumber.message}</p>}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="mb-3 text-sm font-medium text-gray-700">Address Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Address *</Label>
                      <Input {...register("address")} placeholder="123 Rizal Street" />
                      {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Purok *</Label>
                      <Select onValueChange={(v) => setValue("purok", v)} defaultValue={editing?.household?.purok}>
                        <SelectTrigger><SelectValue placeholder="Select purok" /></SelectTrigger>
                        <SelectContent>
                          {PUROK_OPTIONS.map((p) => (
                            <SelectItem key={p} value={String(p)}>{isNaN(Number(p)) ? p : `Purok ${p}`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.purok && <p className="text-sm text-red-500">{errors.purok.message}</p>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Emergency Contact Name</Label>
                    <Input {...register("emergencyContact")} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Contact Number</Label>
                    <Input {...register("emergencyPhone")} placeholder="Optional" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Occupation</Label>
                  <Input {...register("occupation")} placeholder="Optional" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="voter" {...register("isRegisteredVoter")} className="rounded" />
                  <Label htmlFor="voter">Registered Voter</Label>
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">
                  {editing ? "Update" : "Add"} Resident
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Status Tabs */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === "" ? "default" : "outline"}
          size="sm"
          onClick={() => { setStatusFilter(""); setPage(1); }}
          className={statusFilter === "" ? "bg-blue-900 hover:bg-blue-800" : ""}
        >
          <Users className="mr-2 h-4 w-4" /> All
        </Button>
        <Button
          variant={statusFilter === "PENDING" ? "default" : "outline"}
          size="sm"
          onClick={() => { setStatusFilter("PENDING"); setPage(1); }}
          className={statusFilter === "PENDING" ? "bg-amber-600 hover:bg-amber-700" : ""}
        >
          <Clock className="mr-2 h-4 w-4" /> Pending
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
              {pendingCount}
            </span>
          )}
        </Button>
        <Button
          variant={statusFilter === "APPROVED" ? "default" : "outline"}
          size="sm"
          onClick={() => { setStatusFilter("APPROVED"); setPage(1); }}
          className={statusFilter === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" /> Approved
          {approvedCount > 0 && (
            <span className="ml-2 rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
              {approvedCount}
            </span>
          )}
        </Button>
        <Button
          variant={statusFilter === "REJECTED" ? "default" : "outline"}
          size="sm"
          onClick={() => { setStatusFilter("REJECTED"); setPage(1); }}
          className={statusFilter === "REJECTED" ? "bg-red-600 hover:bg-red-700" : ""}
        >
          <XCircle className="mr-2 h-4 w-4" /> Rejected
          {rejectedCount > 0 && (
            <span className="ml-2 rounded-full bg-red-200 px-2 py-0.5 text-xs font-bold text-red-800">
              {rejectedCount}
            </span>
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-4 border-b p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search residents..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={purokFilter} onValueChange={(v) => { setPurokFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Puroks" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Puroks</SelectItem>
                {PUROK_OPTIONS.map((p) => (
                  <SelectItem key={p} value={String(p)}>{isNaN(Number(p)) ? p : `Purok ${p}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastName">Name</SelectItem>
                  <SelectItem value="purok">Purok</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="date">Date Added</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-2"
                aria-label={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
              >
                {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
              {residents.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={printAll}>
                    <Download className="mr-2 h-4 w-4" /> Print All
                  </Button>
                </>
              )}
              {selectedIds.length > 0 && canDelete && (
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedIds.length})
                </Button>
              )}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={residents.length > 0 && selectedIds.length === residents.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(residents.map((r) => r.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Purok</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Voter</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState icon={Users} title="No residents found" />
                  </TableCell>
                </TableRow>
              ) : (
                residents.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedIds.includes(r.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => [...prev, r.id]);
                          } else {
                            setSelectedIds((prev) => prev.filter((id) => id !== r.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {r.lastName}, {r.firstName} {r.middleName || ""}
                    </TableCell>
                    <TableCell>Purok {r.household.purok}</TableCell>
                    <TableCell>{r.contactNumber || "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.isRegisteredVoter ? "success" : "secondary"}>
                        {r.isRegisteredVoter ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setDetailResident(r); setShowDetail(true); }} aria-label="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} aria-label="Delete">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resident Details</DialogTitle>
          </DialogHeader>
          {detailResident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {detailResident.lastName}, {detailResident.firstName} {detailResident.middleName || ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Birth Date</p>
                  <p className="text-sm text-gray-900">
                    {new Date(detailResident.birthDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Gender</p>
                  <p className="text-sm text-gray-900">{detailResident.gender}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Civil Status</p>
                  <p className="text-sm text-gray-900">{detailResident.civilStatus}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">
                    {detailResident.household.address}, Purok {detailResident.household.purok}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Contact</p>
                  <p className="text-sm text-gray-900">{detailResident.contactNumber || "-"}</p>
                </div>
                {detailResident.occupation && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Occupation</p>
                    <p className="text-sm text-gray-900">{detailResident.occupation}</p>
                  </div>
                )}
                {detailResident.emergencyContact && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Emergency Contact</p>
                    <p className="text-sm text-gray-900">{detailResident.emergencyContact}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500">Status</p>
                  <StatusBadge status={detailResident.status} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Registered Voter</p>
                  <Badge className={detailResident.isRegisteredVoter ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}>
                    {detailResident.isRegisteredVoter ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>

              {canApprove && detailResident.status === "PENDING" && (
                <div className="flex gap-3 border-t border-gray-100 pt-4">
                  <Button
                    onClick={() => handleStatusUpdate(detailResident.id, "APPROVED")}
                    disabled={actionLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate(detailResident.id, "REJECTED")}
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
