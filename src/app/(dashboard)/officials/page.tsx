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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Plus, Trash2, Pencil, Search, Printer, Shield } from "lucide-react";
import { BARANGAY_ADDRESS } from "@/lib/constants";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { escapeHtml } from "@/lib/sanitize";
import { PageHeader } from "@/components/page-header";

const POSITIONS = [
  { value: "Barangay Captain", rank: 1 },
  { value: "Kagawad", rank: 2 },
  { value: "Barangay Secretary", rank: 3 },
  { value: "Barangay Treasurer", rank: 4 },
  { value: "SK Chairperson", rank: 5 },
  { value: "SK Kagawad", rank: 6 },
  { value: "Barangay Tanod", rank: 7 },
  { value: "Health Worker", rank: 8 },
  { value: "Lupong Tagapamayapa", rank: 9 },
  { value: "SK Secretary", rank: 10 },
  { value: "SK Treasurer", rank: 11 },
];

const officialSchema = z.object({
  userId: z.string().min(1, "User is required"),
  position: z.string().min(1, "Position is required").max(100),
  termStart: z.string().min(1, "Term start is required"),
  termEnd: z.string().min(1, "Term end is required"),
});

type OfficialForm = z.infer<typeof officialSchema>;

interface Official {
  id: string;
  position: string;
  termStart: string;
  termEnd: string;
  user: { id: string; name: string; email: string; role: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getTermStatus(termStart: string, termEnd: string) {
  const now = new Date();
  const start = new Date(termStart);
  const end = new Date(termEnd);
  if (now < start) return { label: "Upcoming", color: "bg-blue-100 text-blue-700" };
  if (now > end) return { label: "Expired", color: "bg-red-100 text-red-700" };
  return { label: "Active", color: "bg-emerald-100 text-emerald-700" };
}

function getPositionRank(position: string) {
  const found = POSITIONS.find((p) => p.value === position);
  return found ? found.rank : 99;
}

const AVATAR_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-amber-600", "bg-purple-600",
  "bg-rose-600", "bg-cyan-600", "bg-indigo-600", "bg-pink-600",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function OfficialsPage() {
  const { data: session } = useSession();
  const [officials, setOfficials] = useState<Official[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Official | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const role = session?.user?.role ?? "";

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<OfficialForm>({
    resolver: zodResolver(officialSchema),
  });

  const watchPosition = watch("position");

  const fetchOfficials = async () => {
    const res = await fetch("/api/officials");
    const data = await res.json();
    setOfficials(data || []);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data || []);
    }
  };

  useEffect(() => { fetchOfficials(); fetchUsers(); }, []);

  async function onSubmit(data: OfficialForm) {
    setSubmitting(true);
    const url = editing ? `/api/officials/${editing.id}` : "/api/officials";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast({ title: editing ? "Official Updated" : "Official Assigned", variant: "success" });
      setOpen(false);
      setEditing(null);
      reset();
      fetchOfficials();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to save official", variant: "error" });
    }
    setSubmitting(false);
  }

  async function removeOfficial(id: string) {
    const res = await fetch(`/api/officials/${id}`, { method: "DELETE" });
    setDeleteTarget(null);
    if (res.ok) {
      toast({ title: "Official Removed", variant: "success" });
      fetchOfficials();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to remove official", variant: "error" });
    }
  }

  function openEdit(o: Official) {
    setEditing(o);
    setValue("userId", o.user.id);
    setValue("position", o.position);
    setValue("termStart", o.termStart.split("T")[0]);
    setValue("termEnd", o.termEnd.split("T")[0]);
    setOpen(true);
  }

  const filtered = officials
    .filter((o) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return o.user.name.toLowerCase().includes(q) || o.position.toLowerCase().includes(q);
    })
    .sort((a, b) => getPositionRank(a.position) - getPositionRank(b.position));

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const sealUrl = `${baseUrl}/barangay-seal.png`;
    const w = window.open("", "_blank", "width=816,height=1056");
    if (!w) return;
    w.document.open();
    w.document.write(`<!DOCTYPE html><html><head><title>Barangay Officials</title>
    <style>
      @page{size:letter;margin:0}*{margin:0;padding:0;box-sizing:border-box}
      body{font-family:"Times New Roman",serif;color:#1a1a1a;width:8.5in;height:11in;padding:0.6in 0.8in;position:relative}
      .wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:5in;height:5in;opacity:0.06;pointer-events:none}
      .wm img{width:100%;height:100%;object-fit:contain}
      .content{position:relative;z-index:1}
      h1{text-align:center;font-size:16pt;letter-spacing:3px;text-transform:uppercase;border-bottom:2px solid #1a1a1a;padding-bottom:6px;margin-bottom:4px}
      .subtitle{text-align:center;font-size:10pt;color:#555;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:9.5pt}
      th{background:#f0f0f0;border:1px solid #999;padding:5px 8px;text-align:left;font-weight:bold}
      td{border:1px solid #ccc;padding:4px 8px}
      tr:nth-child(even) td{background:#fafafa}
      .pos{font-weight:bold;color:#1a3a6b}
      .seal{position:absolute;bottom:0.6in;right:0.8in;width:1.1in;height:1.1in;opacity:0.8}
      .seal img{width:100%;height:100%;object-fit:contain}
    </style></head><body>
    <div class="wm"><img src="${sealUrl}" alt=""></div>
    <div class="content">
      <h1>Barangay Officials</h1>
      <div class="subtitle">${BARANGAY_ADDRESS}</div>
      <table>
        <thead><tr><th>#</th><th>Name</th><th>Position</th><th>Term Start</th><th>Term End</th><th>Status</th></tr></thead>
        <tbody>
          ${filtered.map((o, i) => {
            const ts = getTermStatus(o.termStart, o.termEnd);
            return `<tr><td>${i + 1}</td><td>${escapeHtml(o.user.name)}</td><td class="pos">${escapeHtml(o.position)}</td><td>${new Date(o.termStart).toLocaleDateString("en-PH")}</td><td>${new Date(o.termEnd).toLocaleDateString("en-PH")}</td><td>${escapeHtml(ts.label)}</td></tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
    <div class="seal"><img src="${sealUrl}" alt=""></div>
    </body></html>`);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading officials...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Barangay Officials" subtitle="Manage current officials and their terms">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print List
          </Button>
          {role === "ADMIN" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => { setEditing(null); reset(); }}>
                  <Plus className="mr-2 h-4 w-4" /> {editing ? "Edit" : "Assign"} Official
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Official" : "Assign New Official"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {!editing && (
                    <div className="space-y-2">
                      <Label>User</Label>
                      <Select onValueChange={(v) => setValue("userId", v, { shouldValidate: true })}>
                        <SelectTrigger className={errors.userId ? "border-red-500 ring-red-500/30" : ""}><SelectValue placeholder="Select user" /></SelectTrigger>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.userId && <p className="text-sm text-red-500">{errors.userId.message}</p>}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select value={watchPosition} onValueChange={(v) => setValue("position", v, { shouldValidate: true })}>
                      <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.position && <p className="text-sm text-red-500">{errors.position.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Term Start</Label>
                      <Input type="date" {...register("termStart")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Term End</Label>
                      <Input type="date" {...register("termEnd")} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
                    {submitting ? "Saving..." : editing ? "Update" : "Assign"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </PageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
        <Input placeholder="Search by name or position..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 max-w-sm" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((o) => {
          const ts = getTermStatus(o.termStart, o.termEnd);
          return (
            <Card key={o.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(o.user.name)}`}>
                    {getInitials(o.user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground truncate">{o.user.name}</h3>
                      {role === "ADMIN" && (
                        <div className="flex gap-1">
                           <Button variant="ghost" size="sm" onClick={() => openEdit(o)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(o.id)} aria-label="Remove"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800">
                        <Shield className="h-3 w-3" /> {o.position}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ts.color}`}>{ts.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Term: {new Date(o.termStart).toLocaleDateString("en-PH")} — {new Date(o.termEnd).toLocaleDateString("en-PH")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">No officials found.</CardContent></Card>
        )}
      </div>

      <div className="hidden"><div ref={printRef}></div></div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Remove Official"
        description="Are you sure you want to remove this official? This action cannot be undone."
        confirmLabel="Remove"
        onConfirm={() => { if (deleteTarget) removeOfficial(deleteTarget); }}
      />
    </div>
  );
}
