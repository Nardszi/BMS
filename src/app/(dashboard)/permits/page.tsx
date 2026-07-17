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
import { Plus, AlertTriangle, Eye, Search, FileText, RotateCcw, CheckCircle, XCircle, Clock } from "lucide-react";
import { PermitPDF } from "@/components/permit-pdf";

const permitSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  ownerResidentId: z.string().min(1, "Owner is required"),
  businessType: z.string().min(1, "Business type is required"),
  address: z.string().min(1, "Address is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

type PermitForm = z.infer<typeof permitSchema>;

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

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
}

const BUSINESS_TYPES = [
  "Sari-Sari Store",
  "Restaurant / Eatery",
  "Retail Shop",
  "Service / Repair",
  "Farm / Agriculture",
  "Manufacturing",
  "Transport",
  "Professional Practice",
  "Rental",
  "Online Selling",
  "Others",
];

type StatusTab = "ALL" | "ACTIVE" | "EXPIRING" | "EXPIRED";

export default function PermitsPage() {
  const { data: session } = useSession();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [open, setOpen] = useState(false);
  const [viewPermit, setViewPermit] = useState<Permit | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [stats, setStats] = useState({ total: 0, active: 0, expiring: 0, expired: 0 });
  const printRef = useRef<HTMLDivElement>(null);
  const role = (session?.user as any)?.role;
  const canManage = ["ADMIN", "TREASURER"].includes(role);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PermitForm>({
    resolver: zodResolver(permitSchema),
  });

  const issueDate = watch("issueDate");

  const fetchPermits = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeTab === "EXPIRING") params.set("expiringSoon", "true");
    else if (activeTab !== "ALL") params.set("status", activeTab);
    const res = await fetch(`/api/permits?${params.toString()}`);
    const data = await res.json();
    setPermits(data || []);
    const allRes = await fetch("/api/permits");
    const allData = await allRes.json();
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
  };

  const fetchResidents = async () => {
    const res = await fetch("/api/residents?limit=1000");
    const data = await res.json();
    setResidents(data.residents || []);
  };

  useEffect(() => { fetchPermits(); }, [activeTab, search]);
  useEffect(() => { fetchResidents(); }, []);

  useEffect(() => {
    const interval = setInterval(fetchPermits, 60000);
    return () => clearInterval(interval);
  }, [activeTab, search]);

  async function onSubmit(data: PermitForm) {
    const res = await fetch("/api/permits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const created = await res.json();
      toast({ title: `Permit Created — ${created.permitNumber}`, variant: "success" });
      setOpen(false);
      reset();
      fetchPermits();
    }
  }

  async function revokePermit(id: string) {
    const res = await fetch(`/api/permits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REVOKED" }),
    });
    if (res.ok) {
      toast({ title: "Permit Revoked", variant: "success" });
      fetchPermits();
    }
  }

  async function renewPermit(permit: Permit) {
    const issue = new Date().toISOString().split("T")[0];
    const expiry = new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];
    const res = await fetch("/api/permits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: permit.businessName,
        ownerResidentId: permit.owner ? residents.find((r) => r.lastName === permit.owner.lastName && r.firstName === permit.owner.firstName)?.id : "",
        businessType: permit.businessType,
        address: permit.address,
        issueDate: issue,
        expiryDate: expiry,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      toast({ title: `Permit Renewed — ${created.permitNumber}`, variant: "success" });
      fetchPermits();
    }
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const w = window.open("", "_blank", "width=816,height=1056");
    if (!w) return;
    w.document.write(`
      <html><head><title>Business Permit</title>
      <style>@page{size:letter;margin:0.5in}body{margin:0;padding:0;font-family:'Times New Roman',serif}</style>
      </head><body>${printContent.innerHTML}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  const tabs: { key: StatusTab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "ALL", label: "All", icon: <FileText className="h-4 w-4" />, color: "text-gray-600 bg-gray-100" },
    { key: "ACTIVE", label: "Active", icon: <CheckCircle className="h-4 w-4" />, color: "text-emerald-600 bg-emerald-50" },
    { key: "EXPIRING", label: "Expiring Soon", icon: <Clock className="h-4 w-4" />, color: "text-amber-600 bg-amber-50" },
    { key: "EXPIRED", label: "Expired", icon: <XCircle className="h-4 w-4" />, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Permits</h2>
          <p className="text-sm text-gray-500">Track and manage business permits</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-900 hover:bg-blue-800">
                <Plus className="mr-2 h-4 w-4" /> New Permit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>New Business Permit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input {...register("businessName")} placeholder="e.g., Juan's Sari-Sari Store" />
                  {errors.businessName && <p className="text-sm text-red-500">{errors.businessName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Owner</Label>
                  <Select onValueChange={(v) => setValue("ownerResidentId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                    <SelectContent>
                      {residents.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.lastName}, {r.firstName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.ownerResidentId && <p className="text-sm text-red-500">{errors.ownerResidentId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Business Type</Label>
                  <Select onValueChange={(v) => setValue("businessType", v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.businessType && <p className="text-sm text-red-500">{errors.businessType.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input {...register("address")} placeholder="Business address" />
                  {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input type="date" {...register("issueDate")} />
                    {errors.issueDate && <p className="text-sm text-red-500">{errors.issueDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input type="date" {...register("expiryDate")} min={issueDate || undefined} />
                    {errors.expiryDate && <p className="text-sm text-red-500">{errors.expiryDate.message}</p>}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">Create Permit</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === t.key
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search business, permit #, owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
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
                <TableRow><TableCell colSpan={canManage ? 8 : 7} className="text-center text-gray-500 py-8">No permits found</TableCell></TableRow>
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
                            <Button variant="ghost" size="sm" onClick={() => setViewPermit(p)} title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {p.status === "ACTIVE" && (
                              <Button variant="ghost" size="sm" onClick={() => revokePermit(p.id)} title="Revoke">
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                            {(p.status === "EXPIRED" || (p.status === "ACTIVE" && daysLeft <= 30)) && (
                              <Button variant="ghost" size="sm" onClick={() => renewPermit(p)} title="Renew">
                                <RotateCcw className="h-4 w-4 text-blue-500" />
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
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Permit Number</span>
                  <span className="font-mono font-bold text-lg">{viewPermit.permitNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge variant={viewPermit.status === "ACTIVE" ? "success" : viewPermit.status === "EXPIRED" ? "destructive" : "secondary"}>
                    {viewPermit.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Business Name</span>
                  <p className="font-medium">{viewPermit.businessName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Business Type</span>
                  <p className="font-medium">{viewPermit.businessType}</p>
                </div>
                <div>
                  <span className="text-gray-500">Owner</span>
                  <p className="font-medium">{viewPermit.owner.lastName}, {viewPermit.owner.firstName}{viewPermit.owner.middleName ? ` ${viewPermit.owner.middleName}` : ""}</p>
                </div>
                <div>
                  <span className="text-gray-500">Address</span>
                  <p className="font-medium">{viewPermit.address}</p>
                </div>
                <div>
                  <span className="text-gray-500">Issue Date</span>
                  <p className="font-medium">{new Date(viewPermit.issueDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <div>
                  <span className="text-gray-500">Expiry Date</span>
                  <p className="font-medium">{new Date(viewPermit.expiryDate).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handlePrint} className="flex-1 bg-blue-900 hover:bg-blue-800">
                  <FileText className="mr-2 h-4 w-4" /> Print Permit
                </Button>
                {(viewPermit.status === "EXPIRED" || (viewPermit.status === "ACTIVE" && getDaysUntilExpiry(viewPermit.expiryDate) <= 30)) && (
                  <Button onClick={() => { renewPermit(viewPermit); setViewPermit(null); }} variant="outline" className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" /> Renew Permit
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Hidden print content */}
      <div className="hidden">
        <div ref={printRef}>
          {viewPermit && <PermitPDF permit={viewPermit} />}
        </div>
      </div>
    </div>
  );
}
