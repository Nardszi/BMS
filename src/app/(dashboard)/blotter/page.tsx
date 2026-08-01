"use client";

import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { blotterSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { Eye, Download, Printer, Search as SearchIcon, Trash2, CheckCircle2 } from "lucide-react";
import { exportToCSV } from "@/lib/export-csv";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { BARANGAY_FULL_NAME, BARANGAY_CITY, BARANGAY_PROVINCE } from "@/lib/constants";
import { escapeHtml } from "@/lib/sanitize";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BlotterFormDialog } from "@/components/blotter-form-dialog";
import { TableSkeleton } from "@/components/skeletons";

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

export default function BlotterPage() {
  const { data: session } = useSession();
  const [blotters, setBlotters] = useState<Blotter[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detailBlotter, setDetailBlotter] = useState<Blotter | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);
  const [counts, setCounts] = useState({ totalCount: 0, openCount: 0, resolvedCount: 0, escalatedCount: 0 });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const role = session?.user?.role ?? "";
  const canCreate = ["ADMIN", "SECRETARY", "KAGAWAD"].includes(role);

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlotters = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/blotter?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load blotter reports");
      const data = await res.json();
      setBlotters(data.blotters || []);
      setCounts({ totalCount: data.totalCount || 0, openCount: data.openCount || 0, resolvedCount: data.resolvedCount || 0, escalatedCount: data.escalatedCount || 0 });
      setError(null);
    } catch {
      setError("Failed to load blotter reports. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, dateFrom, dateTo]);

  useEffect(() => { fetchBlotters(); }, [fetchBlotters]);

  async function onSubmit(data: BlotterForm) {
    setSubmitting(true);
    const res = await fetch("/api/blotter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);
    if (res.ok) {
      toast({ title: "Blotter Report Filed", variant: "success" });
      setOpen(false);
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

  async function deleteBlotter(id: string) {
    const res = await fetch(`/api/blotter/${id}`, { method: "DELETE" });
    setDeleteTarget(null);
    if (res.ok) {
      toast({ title: "Blotter Report Deleted", variant: "success" });
      fetchBlotters();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to delete", variant: "error" });
    }
  }

  async function handleBulkResolve() {
    setActionLoading(true);
    let success = 0;
    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/blotter/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "RESOLVED" }),
        });
        if (res.ok) success++;
      }
      if (success > 0) {
        toast({ title: `${success} blotter report(s) resolved`, variant: "success" });
        setSelectedIds([]);
        fetchBlotters();
      } else {
        toast({ title: "Error", description: "Failed to resolve selected reports", variant: "error" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkDelete() {
    try {
      const res = await fetch("/api/blotter", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setBulkDeleteTarget(false);
      if (res.ok) {
        toast({ title: `${selectedIds.length} blotter report(s) deleted`, variant: "success" });
        setSelectedIds([]);
        fetchBlotters();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to delete reports", variant: "error" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
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
          <tr><td style="padding:6px 0;font-weight:700;width:160px">Case Number:</td><td style="padding:6px 0">${escapeHtml(b.caseNumber)}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700">Date of Incident:</td><td style="padding:6px 0">${new Date(b.incidentDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700">Type of Incident:</td><td style="padding:6px 0">${escapeHtml(b.incidentType)}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700">Location:</td><td style="padding:6px 0">${escapeHtml(b.location || "N/A")}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700">Status:</td><td style="padding:6px 0">${escapeHtml(b.status)}</td></tr>
          <tr><td style="padding:6px 0;font-weight:700">Handled By:</td><td style="padding:6px 0">${escapeHtml(b.handledBy?.name || "N/A")}</td></tr>
        </table>
        <div style="margin-bottom:20px">
          <p style="font-weight:700;font-size:13px;margin-bottom:4px">Complainant:</p>
          <p style="font-size:13px;margin:0 0 12px">${escapeHtml(b.complainantName)}</p>
          <p style="font-weight:700;font-size:13px;margin-bottom:4px">Respondent:</p>
          <p style="font-size:13px;margin:0 0 12px">${escapeHtml(b.respondentName)}</p>
          ${b.witnesses ? `<p style="font-weight:700;font-size:13px;margin-bottom:4px">Witnesses:</p><p style="font-size:13px;margin:0 0 12px">${escapeHtml(b.witnesses)}</p>` : ""}
        </div>
        <div style="margin-bottom:20px">
          <p style="font-weight:700;font-size:13px;margin-bottom:4px">Narrative:</p>
          <p style="font-size:13px;line-height:1.6;text-align:justify;margin:0">${escapeHtml(b.narrative)}</p>
        </div>
        ${b.resolutionNotes ? `<div style="margin-bottom:20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;padding:12px"><p style="font-weight:700;font-size:13px;margin-bottom:4px">Resolution Notes:</p><p style="font-size:13px;line-height:1.6;margin:0">${escapeHtml(b.resolutionNotes)}</p></div>` : ""}
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

  function exportCSV() {
    exportToCSV(
      ["Case #", "Complainant", "Respondent", "Type", "Location", "Date", "Status"],
      blotters.map((b) => [
        b.caseNumber,
        b.complainantName,
        b.respondentName,
        b.incidentType,
        b.location || "",
        new Date(b.incidentDate).toLocaleDateString("en-PH"),
        b.status,
      ]),
      "blotter-reports"
    );
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        {canCreate && (
          <BlotterFormDialog open={open} onOpenChange={setOpen} onSubmit={onSubmit} submitting={submitting} />
        )}
        </div>
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
                : "bg-muted text-foreground/70 hover:bg-muted/80"
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
              statusFilter === tab.key ? "bg-blue-700 text-blue-100" : "bg-muted text-muted-foreground"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Date Range */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <Input
            placeholder="Search by case #, name, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-[160px]"
          />
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-[160px]"
          />
        </div>
        {(search || dateFrom || dateTo || statusFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setDateFrom("");
              setDateTo("");
              setStatusFilter("all");
            }}
          >
            Clear all
          </Button>
        )}
      </div>

      {selectedIds.length > 0 && canCreate && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
          <span className="text-sm text-foreground">
            <strong>{selectedIds.length}</strong> selected
          </span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
            Clear selection
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleBulkResolve} disabled={actionLoading}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Resolve Selected
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteTarget(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedIds.length})
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableSkeleton /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={() => { setLoading(true); setError(null); fetchBlotters(); }}>Retry</Button>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={blotters.length > 0 && selectedIds.length === blotters.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(blotters.map((b) => b.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </TableHead>
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
                  <TableCell colSpan={9}>
                    <EmptyState icon={Eye} title="No blotter reports" />
                  </TableCell>
                </TableRow>
              ) : (
                blotters.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedIds.includes(b.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => [...prev, b.id]);
                          } else {
                            setSelectedIds((prev) => prev.filter((id) => id !== b.id));
                          }
                        }}
                      />
                    </TableCell>
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
                        {canCreate && (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(b.id)} aria-label="Delete">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
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
          )}
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
                <div><span className="font-semibold text-muted-foreground">Complainant:</span><p>{detailBlotter.complainantName}</p></div>
                <div><span className="font-semibold text-muted-foreground">Respondent:</span><p>{detailBlotter.respondentName}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold text-muted-foreground">Date of Incident:</span><p>{new Date(detailBlotter.incidentDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p></div>
                <div><span className="font-semibold text-muted-foreground">Type:</span><p>{detailBlotter.incidentType}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold text-muted-foreground">Location:</span><p>{detailBlotter.location || "N/A"}</p></div>
                <div><span className="font-semibold text-muted-foreground">Status:</span><p><Badge variant={statusColors[detailBlotter.status]}>{detailBlotter.status}</Badge></p></div>
              </div>
              {detailBlotter.witnesses && (
                <div><span className="font-semibold text-muted-foreground">Witnesses:</span><p>{detailBlotter.witnesses}</p></div>
              )}
              <div>
                <span className="font-semibold text-muted-foreground">Narrative:</span>
                <p className="mt-1 leading-relaxed text-justify">{detailBlotter.narrative}</p>
              </div>
              {detailBlotter.resolutionNotes && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                  <span className="font-semibold text-emerald-800">Resolution Notes:</span>
                  <p className="mt-1 text-emerald-900">{detailBlotter.resolutionNotes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 border-t pt-3 text-xs text-muted-foreground">
                <div>Handled by: {detailBlotter.handledBy?.name || "N/A"}</div>
                <div>Date Filed: {new Date(detailBlotter.createdAt).toLocaleDateString("en-PH")}</div>
              </div>
              <div className="flex justify-end gap-2 border-t pt-3">
                <Button variant="outline" size="sm" onClick={() => printBlotter(detailBlotter)}>
                  <Printer className="mr-2 h-4 w-4" /> Print Report
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadBlotterPDF(detailBlotter)}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
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
            <p className="text-sm text-foreground/70">Provide resolution notes for this case.</p>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Blotter Report"
        description="Are you sure you want to delete this blotter report? This action cannot be undone."
        onConfirm={() => { if (deleteTarget) deleteBlotter(deleteTarget); }}
      />

      <ConfirmDialog
        open={bulkDeleteTarget}
        onOpenChange={setBulkDeleteTarget}
        title="Delete Selected Blotter Reports"
        description={`Are you sure you want to delete ${selectedIds.length} selected blotter report(s)? This action cannot be undone.`}
        confirmLabel="Delete All"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
