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
import { downloadAsPDF } from "@/lib/export-pdf";
import { Plus, CreditCard, Printer, Search, Trash2, Eye, Ban, FileDown, Copy, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";

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
    emergencyContact: string | null;
    emergencyPhone: string | null;
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
  const [downloadID, setDownloadID] = useState<BarangayIDData | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const role = session?.user?.role ?? "";
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
    setLoading(false);
  };

  const fetchResidents = async () => {
    const res = await fetch("/api/residents?limit=10000");
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
    const res = await fetch(`/api/barangay-ids/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REVOKED" }),
    });
    setRevokeTarget(null);
    if (res.ok) {
      toast({ title: "ID Revoked", variant: "success" });
      fetchIDs();
    }
  }

  async function deleteID(id: string) {
    const res = await fetch(`/api/barangay-ids/${id}`, { method: "DELETE" });
    setDeleteTarget(null);
    if (res.ok) {
      toast({ title: "ID Deleted", variant: "success" });
      fetchIDs();
    }
  }

  async function copyIDNumber(idNumber: string, id: string) {
    try {
      await navigator.clipboard.writeText(idNumber);
      setCopiedId(id);
      toast({ title: "Copied!", description: `ID number ${idNumber} copied to clipboard`, variant: "success" });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy to clipboard", variant: "error" });
    }
  }

  function handleResidentSelect(residentId: string) {
    const r = residents.find((res) => res.id === residentId);
    setSelectedResident(r || null);
    setValue("residentId", residentId, { shouldValidate: true });
    if (r) {
      setValue("address", `${r.household.address}, Purok ${r.household.purok}`);
      setValue("contactNumber", r.contactNumber || "");
    }
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-800",
    EXPIRED: "bg-amber-100 text-amber-800",
    REVOKED: "bg-red-100 text-red-800",
    LOST: "bg-muted text-foreground/80",
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading barangay IDs...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Barangay ID" subtitle="Generate and manage official Barangay IDs">
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
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
                          <p className="font-semibold text-foreground">
                            {selectedResident.lastName}, {selectedResident.firstName} {selectedResident.middleName}
                          </p>
                          <p className="text-sm text-foreground/70">
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

                <p className="text-xs text-muted-foreground">
                  ID will be valid for 3 years. ID number will be auto-generated.
                </p>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  <CreditCard className="mr-2 h-4 w-4" /> Generate ID
                </Button>
              </form>
          </DialogContent>
        </Dialog>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-4 border-b p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/70" />
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
                  <TableCell colSpan={7}>
                    <EmptyState icon={CreditCard} title="No Barangay IDs generated yet" />
                  </TableCell>
                </TableRow>
              ) : (
                ids.map((id) => (
                  <TableRow key={id.id}>
                    <TableCell className="font-mono font-bold text-blue-700">
                      <div className="flex items-center gap-2">
                        {id.idNumber}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyIDNumber(id.idNumber, id.id)}
                          aria-label="Copy ID number"
                        >
                          {copiedId === id.id ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground/70 hover:text-foreground/70" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {id.resident.lastName}, {id.resident.firstName}
                    </TableCell>
                    <TableCell className="text-sm text-foreground/70">{id.address}</TableCell>
                    <TableCell className="text-sm">{formatDate(id.issueDate)}</TableCell>
                    <TableCell className="text-sm">{formatDate(id.expiryDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={id.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setPreviewID(id)} aria-label="Preview ID">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setDownloadID(id); setTimeout(() => downloadAsPDF(`dl-${id.id}`, id.resident.lastName), 100); }} title="Save as PDF" aria-label="Download PDF">
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPrintID(id)} aria-label="Print">
                        <Printer className="h-4 w-4" />
                      </Button>
                      {canManage && id.status === "ACTIVE" && (
                        <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(id.id)} aria-label="Revoke">
                          <Ban className="h-4 w-4 text-amber-500" />
                        </Button>
                      )}
                      {role === "ADMIN" && (
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(id.id)} aria-label="Delete">
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
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>ID Preview — {previewID.idNumber}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center p-4">
              <IDCardPDF data={previewID} captureId={`id-preview-${previewID.id}`} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewID(null)}>Close</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => downloadAsPDF(`id-preview-${previewID.id}`, previewID.resident.lastName)}>
                <FileDown className="mr-2 h-4 w-4" /> Save as PDF
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
              <Button className="bg-primary hover:bg-primary/90" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Hidden capture element for table PDF download */}
      {downloadID && (
        <div style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1, pointerEvents: "none" }}>
          <IDCardPDF data={downloadID} captureId={`dl-${downloadID.id}`} />
        </div>
      )}

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}
        title="Revoke Barangay ID"
        description="Are you sure you want to revoke this ID? The holder will no longer have a valid Barangay ID."
        confirmLabel="Revoke"
        onConfirm={() => { if (revokeTarget) revokeID(revokeTarget); }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Barangay ID"
        description="Are you sure you want to permanently delete this ID record? This action cannot be undone."
        onConfirm={() => { if (deleteTarget) deleteID(deleteTarget); }}
      />
    </div>
  );
}
