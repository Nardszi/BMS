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
import { Plus, FileText, Check, X, Eye, Download, Printer } from "lucide-react";
import { CertificatePDF } from "@/components/certificate-pdf";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const certSchema = z.object({
  residentId: z.string().min(1, "Resident is required"),
  type: z.enum(["CLEARANCE", "RESIDENCY", "INDIGENCY", "BUSINESS_PERMIT"]),
  purpose: z.string().min(1, "Purpose is required"),
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
  const role = (session?.user as any)?.role;
  const canManage = ["ADMIN", "SECRETARY"].includes(role);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CertForm>({
    resolver: zodResolver(certSchema),
  });

  const fetchCertificates = async () => {
    const res = await fetch("/api/certificates");
    const data = await res.json();
    setCertificates(data || []);
  };

  const fetchResidents = async () => {
    const res = await fetch("/api/residents?limit=1000");
    const data = await res.json();
    setResidents(data.residents || []);
  };

  useEffect(() => { fetchCertificates(); fetchResidents(); }, []);

  async function onSubmit(data: CertForm) {
    const res = await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast({ title: "Certificate Request Created", variant: "success" });
      setOpen(false);
      reset();
      fetchCertificates();
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
    }
  }

  async function downloadCertPDF(cert: Certificate) {
    const el = document.getElementById("certificate-print");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: "#ffffff", logging: false });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "long" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgW = pdfW - margin * 2;
    const imgH = (canvas.height / canvas.width) * imgW;
    pdf.addImage(imgData, "JPEG", margin, margin, imgW, Math.min(imgH, pdfH - margin * 2));
    const name = `${cert.resident.lastName}_${cert.type}`;
    pdf.save(`Certificate-${name}.pdf`);
  }

  function printCert() {
    const content = document.getElementById("certificate-print");
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Print Certificate</title>
      <style>@page{margin:0.5in}body{margin:0;font-family:"Times New Roman",serif}</style>
      </head><body>${content.outerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Certificates</h2>
          <p className="text-sm text-gray-500">Manage certificate requests</p>
        </div>
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
                <Select onValueChange={(v) => setValue("residentId", v)}>
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
              <div className="space-y-2">
                <Label>Certificate Type</Label>
                <Select onValueChange={(v) => setValue("type", v as any)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
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
              <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">Submit Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
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
              {certificates.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500">No certificate requests</TableCell></TableRow>
              ) : (
                certificates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.resident.lastName}, {c.resident.firstName}
                    </TableCell>
                    <TableCell>{typeLabels[c.type] || c.type}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{c.purpose}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[c.status] as any}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(c.requestDate).toLocaleDateString("en-PH")}</TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        {c.status === "PENDING" && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => updateStatus(c.id, "APPROVED")}>
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => updateStatus(c.id, "DENIED")}>
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        {c.status === "APPROVED" && (
                          <Button variant="ghost" size="sm" onClick={() => updateStatus(c.id, "RELEASED")}>
                            <FileText className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setPreviewCert(c)}>
                          <Eye className="h-4 w-4" />
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Certificate Preview</DialogTitle>
            </DialogHeader>
            <CertificatePDF certificate={previewCert} />
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
