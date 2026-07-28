"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "next-auth/react";
import { permitSchema } from "@/lib/validations";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { Eye, Search, FileText, RotateCcw, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { buildPermitHTML } from "@/components/permit-pdf";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { PermitFormDialog } from "@/components/permit-form-dialog";

type PermitForm = z.infer<typeof permitSchema>;

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
}

interface Permit {
  id: string;
  businessName: string;
  businessType: string;
  address: string;
  permitNumber: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  createdAt: string;
  owner: { firstName: string; lastName: string; middleName: string | null };
}

type StatusTab = "ALL" | "ACTIVE" | "EXPIRING" | "EXPIRED";

export default function PermitsPage() {
  const { data: session } = useSession();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [open, setOpen] = useState(false);
  const [viewPermit, setViewPermit] = useState<Permit | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [stats, setStats] = useState({ total: 0, active: 0, expiring: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const role = session?.user?.role ?? "";
  const canManage = ["ADMIN", "TREASURER"].includes(role);
  const canDelete = role === "ADMIN";

  const fetchPermits = async () => {
    try {
      const res = await fetch("/api/permits");
      if (!res.ok) throw new Error("Failed to load permits");
      const allData = await res.json();
    const all: Permit[] = allData || [];
    const now = Date.now();
    setStats({
      total: all.length,
      active: all.filter((p) => p.status === "ACTIVE").length,
      expiring: all.filter((p) => {
        if (p.status !== "ACTIVE") return false;
        const days = Math.ceil((new Date(p.expiryDate).getTime() - now) / 86400000);
        return days > 0 && days <= 30;
      }).length,
      expired: all.filter((p) => p.status === "EXPIRED" || (p.status === "ACTIVE" && new Date(p.expiryDate).getTime() < now)).length,
    });
    let filtered = all;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter((p) =>
        p.businessName.toLowerCase().includes(q) ||
        p.permitNumber.toLowerCase().includes(q) ||
        p.owner.lastName.toLowerCase().includes(q) ||
        p.owner.firstName.toLowerCase().includes(q)
      );
    }
    if (activeTab === "ACTIVE") filtered = filtered.filter((p) => p.status === "ACTIVE");
    else if (activeTab === "EXPIRED") filtered = filtered.filter((p) => p.status === "EXPIRED");
    else     if (activeTab === "EXPIRING") {
      filtered = filtered.filter((p) => {
        if (p.status !== "ACTIVE") return false;
        const days = Math.ceil((new Date(p.expiryDate).getTime() - now) / 86400000);
        return days > 0 && days <= 30;
      });
    }
    if (dateFrom) {
      filtered = filtered.filter((p) => new Date(p.issueDate) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter((p) => new Date(p.issueDate) <= new Date(dateTo));
    }
    setPermits(filtered);
    setError(null);
    } catch {
      setError("Failed to load permits. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      const res = await fetch("/api/residents?limit=10000");
      if (!res.ok) throw new Error("Failed to load residents");
      const data = await res.json();
      setResidents(data.residents || []);
    } catch {
      toast({ title: "Error", description: "Failed to load residents. Please try again.", variant: "error" });
    }
  };

  useEffect(() => { fetchPermits(); }, [activeTab, debouncedSearch, dateFrom, dateTo]);
  useEffect(() => { fetchResidents(); }, []);

  useEffect(() => {
    const interval = setInterval(fetchPermits, 60000);
    return () => clearInterval(interval);
  }, [activeTab, debouncedSearch, dateFrom, dateTo]);

  async function onSubmit(data: PermitForm) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/permits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created = await res.json();
        toast({ title: `Permit Created — ${created.permitNumber}`, variant: "success" });
        setOpen(false);
        fetchPermits();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to create permit", variant: "error" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function revokePermit(id: string) {
    try {
      const res = await fetch(`/api/permits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVOKED" }),
      });
      setRevokeTarget(null);
      if (res.ok) {
        toast({ title: "Permit Revoked", variant: "success" });
        fetchPermits();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to revoke permit", variant: "error" });
      }
    } catch {
      setRevokeTarget(null);
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    }
  }

  async function deletePermit(id: string) {
    try {
      const res = await fetch(`/api/permits/${id}`, { method: "DELETE" });
      setDeleteTarget(null);
      if (res.ok) {
        toast({ title: "Permit Deleted", variant: "success" });
        setViewPermit(null);
        fetchPermits();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to delete permit", variant: "error" });
      }
    } catch {
      setDeleteTarget(null);
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    }
  }

  async function renewPermit(permit: Permit) {
    const expiry = new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];
    const res = await fetch(`/api/permits/${permit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE", expiryDate: expiry }),
    });
    if (res.ok) {
      toast({ title: "Permit Renewed", variant: "success" });
      fetchPermits();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to renew permit", variant: "error" });
    }
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  };

  const handlePrint = () => {
    if (!viewPermit) return;
    const html = buildPermitHTML(viewPermit);
    const w = window.open("", "_blank", "width=816,height=1056");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.onload = () => {
      w.focus();
      w.print();
    };
  };

  const tabs: { key: StatusTab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "ALL", label: "All", icon: <FileText className="h-4 w-4" />, color: "text-foreground/70 bg-muted" },
    { key: "ACTIVE", label: "Active", icon: <CheckCircle className="h-4 w-4" />, color: "text-emerald-600 bg-emerald-50" },
    { key: "EXPIRING", label: "Expiring Soon", icon: <Clock className="h-4 w-4" />, color: "text-amber-600 bg-amber-50" },
    { key: "EXPIRED", label: "Expired", icon: <XCircle className="h-4 w-4" />, color: "text-red-600 bg-red-50" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading permits...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Business Permits" subtitle="Track and manage business permits">
        {canManage && (
          <PermitFormDialog
            open={open}
            onOpenChange={setOpen}
            residents={residents}
            onSubmit={onSubmit}
            submitting={submitting}
          />
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700"><FileText className="h-5 w-5" /></div>
            <div>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-xs text-blue-600">Total Permits</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700"><CheckCircle className="h-5 w-5" /></div>
            <div>
              <div className="text-2xl font-bold text-emerald-900">{stats.active}</div>
              <div className="text-xs text-emerald-600">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700"><Clock className="h-5 w-5" /></div>
            <div>
              <div className="text-2xl font-bold text-amber-900">{stats.expiring}</div>
              <div className="text-xs text-amber-600">Expiring Soon</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-100 bg-red-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-700"><XCircle className="h-5 w-5" /></div>
            <div>
              <div className="text-2xl font-bold text-red-900">{stats.expired}</div>
              <div className="text-xs text-red-600">Expired</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === t.key
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              placeholder="Search business, permit #, owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
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
            {(dateFrom || dateTo || search) && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); setSearch(""); }}>
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading permits...</p></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={() => { setLoading(true); setError(null); fetchPermits(); }}>Retry</Button>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permit #</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permits.length === 0 ? (
                <TableRow><TableCell colSpan={canManage ? 8 : 7} className="text-center text-muted-foreground py-8">No permits found</TableCell></TableRow>
              ) : (
                permits.map((p) => {
                  const daysLeft = getDaysUntilExpiry(p.expiryDate);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.permitNumber}</TableCell>
                      <TableCell className="font-medium">{p.businessName}</TableCell>
                      <TableCell>{p.owner.lastName}, {p.owner.firstName}</TableCell>
                      <TableCell>{p.businessType}</TableCell>
                      <TableCell className="text-sm">{new Date(p.issueDate).toLocaleDateString("en-PH")}</TableCell>
                      <TableCell>
                        <span className={`text-sm ${daysLeft <= 30 && daysLeft > 0 ? "text-amber-600 font-medium" : daysLeft <= 0 ? "text-red-600 font-medium" : ""}`}>
                          {new Date(p.expiryDate).toLocaleDateString("en-PH")}
                          {daysLeft <= 30 && daysLeft > 0 && <span className="ml-1 text-xs">({daysLeft}d)</span>}
                          {daysLeft <= 0 && <span className="ml-1 text-xs font-semibold">EXPIRED</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "ACTIVE" ? "success" : p.status === "EXPIRED" ? "destructive" : "secondary"}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setViewPermit(p)} title="View Details" aria-label="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {p.status === "ACTIVE" && (
                              <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(p.id)} title="Revoke" aria-label="Revoke">
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                            {(p.status === "EXPIRED" || (p.status === "ACTIVE" && daysLeft <= 30)) && (
                              <Button variant="ghost" size="sm" onClick={() => renewPermit(p)} title="Renew" aria-label="Renew">
                                <RotateCcw className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(p.id)} title="Delete" aria-label="Delete">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      {viewPermit && (
        <Dialog open={!!viewPermit} onOpenChange={() => setViewPermit(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Business Permit Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Permit Number</span>
                  <span className="font-mono font-bold text-lg">{viewPermit.permitNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={viewPermit.status === "ACTIVE" ? "success" : viewPermit.status === "EXPIRED" ? "destructive" : "secondary"}>
                    {viewPermit.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Business Name</span>
                  <p className="font-medium">{viewPermit.businessName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Business Type</span>
                  <p className="font-medium">{viewPermit.businessType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Owner</span>
                  <p className="font-medium">{viewPermit.owner.lastName}, {viewPermit.owner.firstName}{viewPermit.owner.middleName ? ` ${viewPermit.owner.middleName}` : ""}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Address</span>
                  <p className="font-medium">{viewPermit.address}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Issue Date</span>
                  <p className="font-medium">{new Date(viewPermit.issueDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expiry Date</span>
                  <p className="font-medium">{new Date(viewPermit.expiryDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handlePrint} className="flex-1 bg-primary hover:bg-primary/90">
                  <FileText className="mr-2 h-4 w-4" /> Print Permit
                </Button>
                {(viewPermit.status === "EXPIRED" || (viewPermit.status === "ACTIVE" && getDaysUntilExpiry(viewPermit.expiryDate) <= 30)) && (
                  <Button onClick={() => { renewPermit(viewPermit); setViewPermit(null); }} variant="outline" className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" /> Renew Permit
                  </Button>
                )}
                {canDelete && (
                  <Button onClick={() => setDeleteTarget(viewPermit.id)} variant="destructive" className="flex-1">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Permit
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}
        title="Revoke Permit"
        description="Are you sure you want to revoke this permit? This action cannot be undone."
        confirmLabel="Revoke"
        onConfirm={() => { if (revokeTarget) revokePermit(revokeTarget); }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Permit"
        description="Are you sure you want to delete this permit? This action cannot be undone."
        onConfirm={() => { if (deleteTarget) deletePermit(deleteTarget); }}
      />
    </div>
  );
}
