"use client";

import { useEffect, useState, useRef } from "react";
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
import { IDCardPDF } from "@/components/id-card-pdf";
import { downloadAsJPEG } from "@/lib/export-jpeg";
import { Plus, CreditCard, Printer, Search, Trash2, Eye, Ban, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

const idSchema = z.object({
  residentId: z.string().min(1, "Resident is required"),
  address: z.string().min(1, "Address is required"),
  contactNumber: z.string().optional(),
  photoUrl: z.string().optional(),
});

type IDForm = z.infer<typeof idSchema>;

interface BarangayIDData {
  id: string;
  idNumber: string;
  photoUrl: string | null;
  issueDate: string;
  expiryDate: string;
  status: string;
  address: string;
  contactNumber: string | null;
  resident: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    birthDate: string;
    gender: string;
    civilStatus: string;
    contactNumber: string | null;
    household: { address: string; purok: string };
  };
  issuedBy: { name: string } | null;
}

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  birthDate: string;
  gender: string;
  contactNumber: string | null;
  household: { address: string; purok: string };
}

export default function BarangayIDsPage() {
  const { data: session } = useSession();
  const [ids, setIds] = useState<BarangayIDData[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [open, setOpen] = useState(false);
  const [previewID, setPreviewID] = useState<BarangayIDData | null>(null);
  const [printID, setPrintID] = useState<BarangayIDData | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const role = (session?.user as any)?.role;
  const canManage = ["ADMIN", "SECRETARY"].includes(role);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<IDForm>({
    resolver: zodResolver(idSchema),
  });

  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  const fetchIDs = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/barangay-ids?${params}`);
    const data = await res.json();
    setIds(data || []);
  };

  const fetchResidents = async () => {
    const res = await fetch("/api/residents?limit=1000");
    const data = await res.json();
    setResidents(data.residents || []);
  };

  useEffect(() => { fetchIDs(); }, [search, statusFilter]);
  useEffect(() => { fetchResidents(); }, []);

  async function onSubmit(data: IDForm) {
    const res = await fetch("/api/barangay-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const newID = await res.json();
      toast({ title: "Barangay ID Generated", description: `ID Number: ${newID.idNumber}`, variant: "success" });
      setOpen(false);
      reset();
      setSelectedResident(null);
      fetchIDs();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to generate ID", variant: "error" });
    }
  }

  async function revokeID(id: string) {
    if (!confirm("Revoke this ID? The holder will no longer have a valid Barangay ID.")) return;
    const res = await fetch(`/api/barangay-ids/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REVOKED" }),
    });
    if (res.ok) {
      toast({ title: "ID Revoked", variant: "success" });
      fetchIDs();
    }
  }

  async function deleteID(id: string) {
    if (!confirm("Permanently delete this ID record?")) return;
    const res = await fetch(`/api/barangay-ids/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "ID Deleted", variant: "success" });
      fetchIDs();
    }
  }

  function handleResidentSelect(residentId: string) {
    const r = residents.find((res) => res.id === residentId);
    setSelectedResident(r || null);
    setValue("residentId", residentId);
    if (r) {
      setValue("address", `${r.household.address}, Purok ${r.household.purok}`);
      setValue("contactNumber", r.contactNumber || "");
    }
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-800",
    EXPIRED: "bg-amber-100 text-amber-800",
    REVOKED: "bg-red-100 text-red-800",
    LOST: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Barangay ID</h2>
          <p className="text-sm text-gray-500">Generate and manage official Barangay IDs</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-900 hover:bg-blue-800">
                <Plus className="mr-2 h-4 w-4" /> Generate ID
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Generate Barangay ID</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Resident</Label>
                  <Select onValueChange={handleResidentSelect}>
                    <SelectTrigger><SelectValue placeholder="Select resident" /></SelectTrigger>
                    <SelectContent>
                      {residents.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.lastName}, {r.firstName} {r.middleName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.residentId && <p className="text-sm text-red-500">{errors.residentId.message}</p>}
                </div>

                {selectedResident && (
                  <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">
                          {selectedResident.firstName[0]}{selectedResident.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {selectedResident.lastName}, {selectedResident.firstName} {selectedResident.middleName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedResident.gender} &middot; {formatDate(selectedResident.birthDate)} &middot; Purok {selectedResident.household.purok}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input {...register("address")} placeholder="Full address" />
                  {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input {...register("contactNumber")} placeholder="Optional" />
                </div>

                <p className="text-xs text-gray-500">
                  ID will be valid for 3 years. ID number will be auto-generated.
                </p>

                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">
                  <CreditCard className="mr-2 h-4 w-4" /> Generate ID
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-4 border-b p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by ID number or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="REVOKED">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Number</TableHead>
                <TableHead>Resident</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ids.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <CreditCard className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                    <p className="text-gray-500">No Barangay IDs generated yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                ids.map((id) => (
                  <TableRow key={id.id}>
                    <TableCell className="font-mono font-bold text-blue-700">{id.idNumber}</TableCell>
                    <TableCell className="font-medium">
                      {id.resident.lastName}, {id.resident.firstName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{id.address}</TableCell>
                    <TableCell className="text-sm">{formatDate(id.issueDate)}</TableCell>
                    <TableCell className="text-sm">{formatDate(id.expiryDate)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[id.status]}>{id.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setPreviewID(id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => downloadAsJPEG(`id-preview-${id.id}`, `BarangayID-${id.idNumber}`)} title="Save as JPEG">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPrintID(id)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      {canManage && id.status === "ACTIVE" && (
                        <Button variant="ghost" size="sm" onClick={() => revokeID(id.id)}>
                          <Ban className="h-4 w-4 text-amber-500" />
                        </Button>
                      )}
                      {role === "ADMIN" && (
                        <Button variant="ghost" size="sm" onClick={() => deleteID(id.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {previewID && (
        <Dialog open={!!previewID} onOpenChange={() => setPreviewID(null)}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>ID Preview — {previewID.idNumber}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center overflow-auto p-4">
              <div className="origin-center scale-[1.5]">
                <IDCardPDF data={previewID} captureId={`id-preview-${previewID.id}`} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewID(null)}>Close</Button>
              <Button variant="outline" onClick={() => downloadAsJPEG(`id-preview-${previewID.id}-front`, `BarangayID-${previewID.idNumber}-Front`)}>
                <Download className="mr-2 h-4 w-4" /> Save Front as JPEG
              </Button>
              <Button variant="outline" onClick={() => downloadAsJPEG(`id-preview-${previewID.id}-back`, `BarangayID-${previewID.idNumber}-Back`)}>
                <Download className="mr-2 h-4 w-4" /> Save Back as JPEG
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Print Dialog */}
      {printID && (
        <Dialog open={!!printID} onOpenChange={() => setPrintID(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Print ID — {printID.idNumber}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <IDCardPDF data={printID} showPrintLayout />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPrintID(null)}>Close</Button>
              <Button className="bg-blue-900 hover:bg-blue-800" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
