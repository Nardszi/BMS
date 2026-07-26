"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Check, X, Eye, Download, Printer, RotateCcw, ArrowUpDown, Search, Trash2 } from "lucide-react";
import { CertificatePDF } from "@/components/certificate-pdf";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const certSchema = z.object({
  residentId: z.string().min(1, "Resident is required"),
  type: z.enum(["CLEARANCE", "RESIDENCY", "INDIGENCY", "BUSINESS_PERMIT"]),
  purpose: z.string().min(1, "Purpose is required").max(500),
});

type CertForm = z.infer<typeof certSchema>;

interface Certificate {
  id: string;
  type: string;
  purpose: string;
  status: string;
  requestDate: string;
  releaseDate: string | null;
  resident: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    birthDate: string;
    gender: string;
    civilStatus: string;
    household: { address: string; purok: string };
  };
  issuedBy: { name: string } | null;
}

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
}

export default function CertificatesPage() {
  const { data: session } = useSession();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [open, setOpen] = useState(false);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "type" | "status">("newest");
  const [search, setSearch] = useState("");
  const role = session?.user?.role ?? "";
  const canManage = ["ADMIN", "SECRETARY"].includes(role);

  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CertForm>({
    resolver: zodResolver(certSchema),
    mode: "onChange",
  });

  const fetchCertificates = async () => {
    const res = await fetch("/api/certificates");
    const data = await res.json();
    setCertificates(data || []);
    setLoading(false);
  };

  const fetchResidents = async () => {
    const res = await fetch("/api/residents?limit=10000");
    const data = await res.json();
    setResidents(data.residents || []);
  };

  useEffect(() => { fetchCertificates(); fetchResidents(); }, []);

  async function onSubmit(data: CertForm) {
    setSubmitting(true);
    const res = await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);
    if (res.ok) {
      toast({ title: "Certificate Request Created", variant: "success" });
      setOpen(false);
      reset();
      fetchCertificates();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to create request", variant: "error" });
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/certificates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast({ title: `Certificate ${status.toLowerCase()}`, variant: "success" });
      fetchCertificates();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to update status", variant: "error" });
    }
  }

  async function deleteCertificate(id: string) {
    if (!window.confirm("Are you sure you want to delete this certificate request? This action cannot be undone.")) return;
    const res = await fetch(`/api/certificates/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Certificate Deleted", variant: "success" });
      fetchCertificates();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to delete", variant: "error" });
    }
  }

  function buildCertHTML(cert: Certificate) {
    const r = cert.resident;
    const fullName = `${r.lastName}, ${r.firstName}${r.middleName ? ` ${r.middleName}` : ""}`;
    const birthDate = new Date(r.birthDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
    const typeLabel: Record<string, string> = { CLEARANCE: "BARANGAY CLEARANCE", RESIDENCY: "CERTIFICATE OF RESIDENCY", INDIGENCY: "CERTIFICATE OF INDIGENCY", BUSINESS_PERMIT: "BUSINESS PERMIT CERTIFICATE" };
    const baseUrl = window.location.origin;
    const seal = `${baseUrl}/barangay-seal.png`;

    let body = "";
    if (cert.type === "CLEARANCE") {
      body = `<p>TO WHOM IT MAY CONCERN:</p><p style="text-align:justify;text-indent:48px">This is to certify that <strong>${fullName}</strong>, of legal age, Filipino, and a resident of <strong>${r.household.address}, Purok ${r.household.purok}</strong>, this barangay, is a person of good moral character and has no pending case or criminal record in this barangay as of this date.</p><p style="text-align:justify;text-indent:48px">This certification is being issued at the request of the interested party for <strong>${cert.purpose}</strong>.</p>`;
    } else if (cert.type === "RESIDENCY") {
      body = `<p>TO WHOM IT MAY CONCERN:</p><p style="text-align:justify;text-indent:48px">This is to certify that <strong>${fullName}</strong>, ${birthDate}, ${r.gender.toLowerCase()}, ${r.civilStatus.toLowerCase()}, Filipino, is a bonafide resident of <strong>${r.household.address}, Purok ${r.household.purok}</strong>, Barangay IX - Daan Banwa, City of Victorias, Negros Occidental.</p><p style="text-align:justify;text-indent:48px">This certification is issued upon request of the interested party for <strong>${cert.purpose}</strong>.</p>`;
    } else if (cert.type === "INDIGENCY") {
      body = `<p>TO WHOM IT MAY CONCERN:</p><p style="text-align:justify;text-indent:48px">This is to certify that <strong>${fullName}</strong>, of legal age, Filipino, and a resident of <strong>${r.household.address}, Purok ${r.household.purok}</strong>, this barangay, belongs to an indigent family and is considered a beneficiary of the barangay's social welfare programs.</p><p style="text-align:justify;text-indent:48px">This certification is being issued at the request of the interested party for <strong>${cert.purpose}</strong>.</p>`;
    } else {
      body = `<p>TO WHOM IT MAY CONCERN:</p><p style="text-align:justify;text-indent:48px">This is to certify that <strong>${fullName}</strong> has been granted permission to operate a business establishment within the jurisdiction of Barangay IX - Daan Banwa, City of Victorias, Negros Occidental, subject to the terms and conditions provided under existing barangay ordinances.</p><p style="text-align:justify;text-indent:48px">This certificate is issued for <strong>${cert.purpose}</strong>.</p>`;
    }

    return `<div style="position:relative;overflow:hidden;background:#fff;width:8.5in;min-height:11in;padding:1in 1.2in;font-family:'Times New Roman',Times,serif;color:#1a1a1a;box-sizing:border-box">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.04;pointer-events:none;z-index:0"><img src="${seal}" style="width:350px;height:350px;object-fit:contain" /></div>
      <div style="position:relative;z-index:1">
        <div style="text-align:center;margin-bottom:40px">
          <div style="display:flex;justify-content:center;margin-bottom:12px"><img src="${seal}" style="width:90px;height:90px;object-fit:contain" /></div>
          <p style="font-size:14px;text-transform:uppercase;letter-spacing:1.5px;margin:0">Republic of the Philippines</p>
          <p style="font-size:14px;text-transform:uppercase;letter-spacing:1.5px;margin:0">City of Victorias</p>
          <p style="font-size:14px;text-transform:uppercase;letter-spacing:1.5px;margin:0">Negros Occidental</p>
          <p style="font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-top:12px">Office of the Barangay IX - Daan Banwa</p>
        </div>
        <h2 style="text-align:center;font-size:20px;font-weight:700;text-transform:uppercase;text-decoration:underline;margin-bottom:40px">${typeLabel[cert.type] || cert.type}</h2>
        <div style="font-size:15px;line-height:2;margin-bottom:60px">${body}</div>
        <div style="display:flex;justify-content:space-between;font-size:15px;margin-bottom:60px">
          <div style="text-align:center"><p style="font-weight:600">Prepared by:</p><div style="margin-top:60px;border-top:1px solid #94a3b8;padding-top:4px;min-width:180px"><p style="font-weight:600">Secretary</p></div></div>
          <div style="text-align:center"><p style="font-weight:600">Approved by:</p><div style="margin-top:60px;border-top:1px solid #94a3b8;padding-top:4px;min-width:180px"><p style="font-weight:600">Barangay Captain</p></div></div>
        </div>
        <div style="text-align:center;font-size:13px;color:#6b7280">
          <p>Date of Request: ${new Date(cert.requestDate).toLocaleDateString("en-PH")}</p>
          ${cert.releaseDate ? `<p>Date Issued: ${new Date(cert.releaseDate).toLocaleDateString("en-PH")}</p>` : ""}
        </div>
      </div>
    </div>`;
  }

  async function downloadCertPDF(cert: Certificate) {
    const html = buildCertHTML(cert);
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    tmp.style.position = "fixed";
    tmp.style.left = "-9999px";
    tmp.style.top = "0";
    document.body.appendChild(tmp);
    const el = tmp.firstElementChild as HTMLElement;
    await new Promise(r => setTimeout(r, 200));
    const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: "#ffffff", logging: false });
    document.body.removeChild(tmp);
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const imgW = pdfW;
    const imgH = (canvas.height / canvas.width) * imgW;
    pdf.addImage(imgData, "JPEG", 0, 0, imgW, Math.min(imgH, pdfH));
    const name = `${cert.resident.lastName}_${cert.type}`;
    pdf.save(`Certificate-${name}.pdf`);
  }

  function printCert() {
    const cert = previewCert;
    if (!cert) return;
    const html = buildCertHTML(cert);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Barangay Certificate</title>
<style>
@page { size: letter; margin: 0; }
@media print { html, body { margin: 0 !important; padding: 0 !important; } }
body { margin: 0; padding: 0; font-family: "Times New Roman", Times, serif; }
</style>
</head><body>${html}</body></html>`);
    printWindow.document.close();
    const images = printWindow.document.querySelectorAll("img");
    let loaded = 0;
    const total = images.length;
    const checkDone = () => { loaded++; if (loaded >= total) { printWindow.focus(); printWindow.print(); } };
    if (total === 0) { printWindow.focus(); printWindow.print(); return; }
    images.forEach(img => { if (img.complete) { checkDone(); } else { img.onload = checkDone; img.onerror = checkDone; } });
  }

  const statusColors: Record<string, string> = {
    PENDING: "warning",
    APPROVED: "success",
    RELEASED: "default",
    DENIED: "destructive",
  };

  const typeLabels: Record<string, string> = {
    CLEARANCE: "Barangay Clearance",
    RESIDENCY: "Certificate of Residency",
    INDIGENCY: "Certificate of Indigency",
    BUSINESS_PERMIT: "Business Permit",
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading certificates...</p></div>;
  }

  const filteredCertificates = certificates.filter((cert) => {
    const q = search.toLowerCase();
    const fullName = `${cert.resident.firstName} ${cert.resident.lastName}`.toLowerCase();
    const typeLabel = (typeLabels[cert.type] || cert.type).toLowerCase();
    const purpose = cert.purpose.toLowerCase();
    return fullName.includes(q) || typeLabel.includes(q) || purpose.includes(q) || cert.status.toLowerCase().includes(q);
  });

  const sortedCertificates = [...filteredCertificates].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
      case "oldest":
        return new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime();
      case "type":
        return a.type.localeCompare(b.type);
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Certificates" subtitle="Manage certificate requests">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-900 hover:bg-blue-800">
              <Plus className="mr-2 h-4 w-4" /> New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Certificate Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Resident</Label>
                <Select onValueChange={(v) => setValue("residentId", v, { shouldValidate: true })}>
                  <SelectTrigger className={errors.residentId ? "border-red-500 ring-red-500/30" : ""}><SelectValue placeholder="Select resident" /></SelectTrigger>
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
              <div className="space-y-2">
                <Label>Certificate Type</Label>
                <Select onValueChange={(v) => setValue("type", v as "CLEARANCE" | "RESIDENCY" | "INDIGENCY" | "BUSINESS_PERMIT", { shouldValidate: true })}>
                  <SelectTrigger className={errors.type ? "border-red-500 ring-red-500/30" : ""}><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLEARANCE">Barangay Clearance</SelectItem>
                    <SelectItem value="RESIDENCY">Certificate of Residency</SelectItem>
                    <SelectItem value="INDIGENCY">Certificate of Indigency</SelectItem>
                    <SelectItem value="BUSINESS_PERMIT">Business Permit</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Textarea {...register("purpose")} placeholder="Purpose of the certificate..." />
                {errors.purpose && <p className="text-sm text-red-500">{errors.purpose.message}</p>}
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-blue-900 hover:bg-blue-800">
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
        <Input
          placeholder="Search by resident name, type, or purpose..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-4 border-b p-4">
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground/70" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="type">By Type</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCertificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState icon={FileText} title="No certificate requests" />
                  </TableCell>
                </TableRow>
              ) : (
                sortedCertificates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.resident.lastName}, {c.resident.firstName}
                    </TableCell>
                    <TableCell>{typeLabels[c.type] || c.type}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{c.purpose}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>{new Date(c.requestDate).toLocaleDateString("en-PH")}</TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        {c.status === "PENDING" && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => updateStatus(c.id, "APPROVED")} aria-label="Approve">
                              <Check className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => updateStatus(c.id, "DENIED")} aria-label="Deny">
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        {c.status === "APPROVED" && (
                          <Button variant="ghost" size="sm" onClick={() => updateStatus(c.id, "RELEASED")} aria-label="Release">
                            <FileText className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        {c.status === "DENIED" && (
                          <Button variant="ghost" size="sm" onClick={() => updateStatus(c.id, "PENDING")} title="Revert to Pending" aria-label="Revert to pending">
                            <RotateCcw className="h-4 w-4 text-amber-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setPreviewCert(c)} aria-label="View certificate">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteCertificate(c.id)} aria-label="Delete certificate">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {previewCert && (
        <Dialog open={!!previewCert} onOpenChange={() => setPreviewCert(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Certificate Preview</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center overflow-hidden rounded border bg-muted/50" style={{ height: "700px" }}>
              <div style={{ width: "8.5in", transform: "scale(0.55)", transformOrigin: "top center" }}>
                <CertificatePDF certificate={previewCert} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => downloadCertPDF(previewCert)}>
                <Download className="mr-2 h-4 w-4" /> Save as PDF
              </Button>
              <Button variant="outline" size="sm" onClick={printCert}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
