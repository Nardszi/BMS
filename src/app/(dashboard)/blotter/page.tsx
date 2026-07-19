"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { Plus, Eye, Download, Printer, Search as SearchIcon } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { BARANGAY_FULL_NAME, BARANGAY_CITY, BARANGAY_PROVINCE } from "@/lib/constants";

const blotterSchema = z.object({
  complainantName: z.string().min(1, "Complainant name is required"),
  respondentName: z.string().min(1, "Respondent name is required"),
  incidentDate: z.string().min(1, "Incident date is required"),
  incidentType: z.string().min(1, "Incident type is required"),
  location: z.string().optional(),
  witnesses: z.string().optional(),
  narrative: z.string().min(1, "Narrative is required"),
});

type BlotterForm = z.infer<typeof blotterSchema>;

interface Blotter {
  id: string;
  caseNumber: string;
  complainantName: string;
  respondentName: string;
  incidentDate: string;
  incidentType: string;
  location: string | null;
  witnesses: string | null;
  narrative: string;
  resolutionNotes: string | null;
  status: string;
  createdAt: string;
  handledBy: { name: string } | null;
}

const INCIDENT_TYPES = [
  "Physical Assault",
  "Verbal Altercation",
  "Theft",
  "Property Damage",
  "Domestic Dispute",
  "Noise Complaint",
  "Vandalism",
  "Harassment",
  "Trespassing",
  "Fraud/Scam",
  "Traffic Incident",
  "Other",
];

export default function BlotterPage() {
  const { data: session } = useSession();
  const [blotters, setBlotters] = useState<Blotter[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailBlotter, setDetailBlotter] = useState<Blotter | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);
  const [counts, setCounts] = useState({ totalCount: 0, openCount: 0, resolvedCount: 0, escalatedCount: 0 });
  const role = session?.user?.role ?? "";
  const canCreate = ["ADMIN", "SECRETARY", "KAGAWAD"].includes(role);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BlotterForm>({
    resolver: zodResolver(blotterSchema),
  });

  const fetchBlotters = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/blotter?${params.toString()}`);
    const data = await res.json();
    setBlotters(data.blotters || []);
    setCounts({ totalCount: data.totalCount || 0, openCount: data.openCount || 0, resolvedCount: data.resolvedCount || 0, escalatedCount: data.escalatedCount || 0 });
  }, [statusFilter, search]);

  useEffect(() => { fetchBlotters(); }, [fetchBlotters]);

  async function onSubmit(data: BlotterForm) {
    const res = await fetch("/api/blotter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast({ title: "Blotter Report Filed", variant: "success" });
      setOpen(false);
      reset();
      fetchBlotters();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to file report", variant: "error" });
    }
  }

  async function updateStatus(id: string, status: string, resolutionNotes?: string) {
    const body: any = { status };
    if (resolutionNotes) body.resolutionNotes = resolutionNotes;
    const res = await fetch(`/api/blotter/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast({ title: "Status Updated", variant: "success" });
      fetchBlotters();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to update status", variant: "error" });
    }
  }

  function buildBlotterHTML(b: Blotter) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const seal = `${baseUrl}/barangay-seal.png`;
    return `<div style="position:relative;overflow:hidden;background:#fff;width:8.5in;min-height:11in;padding:0.8in 1in;font-family:'Times New Roman',Times,serif;color:#1a1a1a;box-sizing:border-box">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.04;pointer-events:none;z-index:0"><img src="${seal}" style="width:300px;height:300px;object-fit:contain" /></div>
      <div style="position:relative;z-index:1">
        <div style="text-align:center;margin-bottom:24px">
          <img src="${seal}" style="width:70px;height:70px;object-fit:contain" />
          <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0">Republic of the Philippines</p>
          <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0">${BARANGAY_CITY}, ${BARANGAY_PROVINCE}</p>
          <p style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:8px 0 0">Office of the ${BARANGAY_FULL_NAME}</p>
        </div>
        <h2 style="text-align:center;font-size:18px;font-weight:700;text-transform:uppercase;text-decoration:underline;margin-bottom:20px">Blotter Report</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
          <tr><td style="padding:6px 0;font-weight:700;width:160px">Case Number:</td><td style="padding:6px 0">${b.caseNumber}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700">Date of Incident:</td><td style="padding:6px 0">${new Date(b.incidentDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700">Type of Incident:</td><td style="padding:6px 0">${b.incidentType}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700">Location:</td><td style="padding:6px 0">${b.location || "N/A"}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700">Status:</td><td style="padding:6px 0">${b.status}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700">Handled By:</td><td style="padding:6px 0">${b.handledBy?.name || "N/A"}</td></tr>
        </table>
        <div style="margin-bottom:20px">
          <p style="font-weight:700;font-size:13px;margin-bottom:4px">Complainant:</p>
          <p style="font-size:13px;margin:0 0 12px">${b.complainantName}</p>
          <p style="font-weight:700;font-size:13px;margin-bottom:4px">Respondent:</p>
          <p style="font-size:13px;margin:0 0 12px">${b.respondentName}</p>
          ${b.witnesses ? `<p style="font-weight:700;font-size:13px;margin-bottom:4px">Witnesses:</p><p style="font-size:13px;margin:0 0 12px">${b.witnesses}</p>` : ""}
        </div>
        <div style="margin-bottom:20px">
          <p style="font-weight:700;font-size:13px;margin-bottom:4px">Narrative:</p>
          <p style="font-size:13px;line-height:1.6;text-align:justify;margin:0">${b.narrative}</p>
        </div>
        ${b.resolutionNotes ? `<div style="margin-bottom:20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;padding:12px"><p style="font-weight:700;font-size:13px;margin-bottom:4px">Resolution Notes:</p><p style="font-size:13px;line-height:1.6;margin:0">${b.resolutionNotes}</p></div>` : ""}
        <div style="border-top:1px solid #ccc;padding-top:12px;margin-top:40px;display:flex;justify-content:space-between;font-size:12px;color:#666">
          <span>Date Filed: ${new Date(b.createdAt).toLocaleDateString("en-PH")}</span>
          <span>${BARANGAY_FULL_NAME}</span>
        </div>
      </div>
    </div>`;
  }

  async function downloadBlotterPDF(b: Blotter) {
    const html = buildBlotterHTML(b);
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
    pdf.save(`Blotter-${b.caseNumber}.pdf`);
  }

  function printBlotter(b: Blotter) {
    const html = buildBlotterHTML(b);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Blotter Report</title>
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

  function handleResolve(id: string) {
    setResolveTarget(id);
    setResolveNotes("");
  }

  function confirmResolve() {
    if (!resolveTarget) return;
    if (!resolveNotes.trim()) {
      toast({ title: "Resolution notes are required", variant: "error" });
      return;
    }
    updateStatus(resolveTarget, "RESOLVED", resolveNotes);
    setResolveTarget(null);
    setResolveNotes("");
  }

  const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
    OPEN: "destructive",
    RESOLVED: "success",
    ESCALATED: "warning",
  };

  const statusTabs = [
    { key: "all", label: "All", count: counts.totalCount },
    { key: "OPEN", label: "Open", count: counts.openCount },
    { key: "RESOLVED", label: "Resolved", count: counts.resolvedCount },
    { key: "ESCALATED", label: "Escalated", count: counts.escalatedCount },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Blotter Reports" subtitle="Incident reports and case management">
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-900 hover:bg-blue-800">
                <Plus className="mr-2 h-4 w-4" /> File Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl z-[90]">
              <DialogHeader>
                <DialogTitle>File Blotter Report</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Complainant Name</Label>
                    <Input {...register("complainantName")} placeholder="Full name" />
                    {errors.complainantName && <p className="text-sm text-red-500">{errors.complainantName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Respondent Name</Label>
                    <Input {...register("respondentName")} placeholder="Full name" />
                    {errors.respondentName && <p className="text-sm text-red-500">{errors.respondentName.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Incident Date</Label>
                    <Input type="date" {...register("incidentDate")} />
                    {errors.incidentDate && <p className="text-sm text-red-500">{errors.incidentDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Incident Type</Label>
                    <Select onValueChange={(v) => {
                      const field = register("incidentType");
                      field.onChange({ target: { value: v } });
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent className="z-[100]">
                        {INCIDENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.incidentType && <p className="text-sm text-red-500">{errors.incidentType.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location (Purok / Area)</Label>
                  <Input {...register("location")} placeholder="e.g., Purok 1, near Barangay Hall" />
                </div>
                <div className="space-y-2">
                  <Label>Witnesses (optional)</Label>
                  <Input {...register("witnesses")} placeholder="Names of witnesses, separated by commas" />
                </div>
                <div className="space-y-2">
                  <Label>Narrative</Label>
                  <Textarea {...register("narrative")} rows={5} placeholder="Describe the incident in detail..." />
                  {errors.narrative && <p className="text-sm text-red-500">{errors.narrative.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">File Report</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Status Tabs */}
      <div className="flex gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-blue-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
              statusFilter === tab.key ? "bg-blue-700 text-blue-100" : "bg-gray-200 text-gray-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by case #, name, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case #</TableHead>
                <TableHead>Complainant</TableHead>
                <TableHead>Respondent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Handled By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blotters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState icon={Eye} title="No blotter reports" />
                  </TableCell>
                </TableRow>
              ) : (
                blotters.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono font-medium">{b.caseNumber}</TableCell>
                    <TableCell>{b.complainantName}</TableCell>
                    <TableCell>{b.respondentName}</TableCell>
                    <TableCell>{b.incidentType}</TableCell>
                    <TableCell>{new Date(b.incidentDate).toLocaleDateString("en-PH")}</TableCell>
                    <TableCell>
                      <StatusBadge status={b.status} />
                    </TableCell>
                    <TableCell>{b.handledBy?.name || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setDetailBlotter(b)} aria-label="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => downloadBlotterPDF(b)} aria-label="Download PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => printBlotter(b)} aria-label="Print">
                          <Printer className="h-4 w-4" />
                        </Button>
                        {canCreate && b.status === "OPEN" && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleResolve(b.id)} className="text-emerald-600 hover:text-emerald-700">
                              Resolve
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => updateStatus(b.id, "ESCALATED")} className="text-yellow-600 hover:text-yellow-700">
                              Escalate
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      {detailBlotter && (
        <Dialog open={!!detailBlotter} onOpenChange={() => setDetailBlotter(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[90]">
            <DialogHeader>
              <DialogTitle className="font-mono">{detailBlotter.caseNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold text-gray-500">Complainant:</span><p>{detailBlotter.complainantName}</p></div>
                <div><span className="font-semibold text-gray-500">Respondent:</span><p>{detailBlotter.respondentName}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold text-gray-500">Date of Incident:</span><p>{new Date(detailBlotter.incidentDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p></div>
                <div><span className="font-semibold text-gray-500">Type:</span><p>{detailBlotter.incidentType}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold text-gray-500">Location:</span><p>{detailBlotter.location || "N/A"}</p></div>
                <div><span className="font-semibold text-gray-500">Status:</span><p><Badge variant={statusColors[detailBlotter.status]}>{detailBlotter.status}</Badge></p></div>
              </div>
              {detailBlotter.witnesses && (
                <div><span className="font-semibold text-gray-500">Witnesses:</span><p>{detailBlotter.witnesses}</p></div>
              )}
              <div>
                <span className="font-semibold text-gray-500">Narrative:</span>
                <p className="mt-1 leading-relaxed text-justify">{detailBlotter.narrative}</p>
              </div>
              {detailBlotter.resolutionNotes && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                  <span className="font-semibold text-emerald-800">Resolution Notes:</span>
                  <p className="mt-1 text-emerald-900">{detailBlotter.resolutionNotes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 border-t pt-3 text-xs text-gray-500">
                <div>Handled by: {detailBlotter.handledBy?.name || "N/A"}</div>
                <div>Date Filed: {new Date(detailBlotter.createdAt).toLocaleDateString("en-PH")}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Resolve Dialog */}
      <Dialog open={!!resolveTarget} onOpenChange={() => setResolveTarget(null)}>
        <DialogContent className="max-w-lg z-[90]">
          <DialogHeader>
            <DialogTitle>Resolve Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Provide resolution notes for this case.</p>
            <Textarea
              rows={4}
              placeholder="Describe how the case was resolved..."
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResolveTarget(null)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={confirmResolve}>Confirm Resolve</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
