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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Plus, Megaphone, Trash2, Pencil, Search, Pin, ChevronDown, ChevronUp, Eye, Clock, AlertTriangle, Info, ImageIcon } from "lucide-react";

const PRIORITY_CONFIG = {
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
  IMPORTANT: { label: "Important", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle },
  GENERAL: { label: "General", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Info },
};

const CATEGORY_CONFIG: Record<string, string> = {
  HEALTH: "bg-emerald-50 text-emerald-700",
  SAFETY: "bg-red-50 text-red-700",
  EVENT: "bg-purple-50 text-purple-700",
  MEETING: "bg-indigo-50 text-indigo-700",
  GENERAL: "bg-gray-50 text-gray-700",
  OTHERS: "bg-slate-50 text-slate-700",
};

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  expiresAt: z.string().optional(),
  priority: z.string().min(1, "Priority is required"),
  category: z.string().min(1, "Category is required"),
});

type AnnouncementForm = z.infer<typeof announcementSchema>;

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  expiresAt: string | null;
  postedBy: { name: string };
  priority: string;
  category: string;
  pinned: boolean;
  imageUrl: string | null;
  viewCount: number;
}

function timeAgo(date: string): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-PH");
}

function getAnnouncementStatus(ann: Announcement) {
  if (ann.pinned) return { label: "Pinned", color: "bg-violet-100 text-violet-700" };
  if (ann.expiresAt && new Date(ann.expiresAt) < new Date()) return { label: "Expired", color: "bg-gray-100 text-gray-500" };
  return { label: "Active", color: "bg-emerald-100 text-emerald-700" };
}

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const role = (session?.user as any)?.role;
  const canManage = ["ADMIN", "SECRETARY"].includes(role);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { priority: "GENERAL", category: "GENERAL" },
  });

  const watchPriority = watch("priority");
  const watchCategory = watch("category");

  const fetchAnnouncements = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterPriority) params.set("priority", filterPriority);
    if (filterCategory) params.set("category", filterCategory);
    const res = await fetch(`/api/announcements?${params.toString()}`);
    const data = await res.json();
    setAnnouncements(data || []);
  };

  useEffect(() => { fetchAnnouncements(); }, [search, filterPriority, filterCategory]);

  async function onSubmit(data: AnnouncementForm) {
    const url = editing ? `/api/announcements/${editing.id}` : "/api/announcements";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast({ title: editing ? "Announcement Updated" : "Announcement Posted", variant: "success" });
      setOpen(false);
      setEditing(null);
      reset();
      fetchAnnouncements();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to save announcement", variant: "error" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Announcement Deleted", variant: "success" });
      fetchAnnouncements();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to delete announcement", variant: "error" });
    }
  }

  async function togglePin(ann: Announcement) {
    const res = await fetch(`/api/announcements/${ann.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !ann.pinned }),
    });
    if (res.ok) {
      toast({ title: ann.pinned ? "Unpinned" : "Pinned", variant: "success" });
      fetchAnnouncements();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error || "Failed to update pin status", variant: "error" });
    }
  }

  async function incrementView(ann: Announcement) {
    await fetch(`/api/announcements/${ann.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewCount: 1 }),
    });
  }

  function openEdit(ann: Announcement) {
    setEditing(ann);
    setValue("title", ann.title);
    setValue("content", ann.content);
    if (ann.expiresAt) setValue("expiresAt", ann.expiresAt.split("T")[0]);
    setValue("priority", ann.priority);
    setValue("category", ann.category);
    setOpen(true);
  }

  function toggleExpand(ann: Announcement) {
    if (expandedId === ann.id) {
      setExpandedId(null);
    } else {
      setExpandedId(ann.id);
      if (ann.viewCount === 0) incrementView(ann);
    }
  }

  const isLong = (content: string) => content.length > 200;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
          <p className="text-sm text-gray-500">Post and manage barangay announcements</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-900 hover:bg-blue-800" onClick={() => { setEditing(null); reset(); }}>
                <Plus className="mr-2 h-4 w-4" /> New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit" : "New"} Announcement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input {...register("title")} placeholder="Announcement title" />
                  {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea {...register("content")} rows={5} placeholder="Write your announcement..." />
                  {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={watchPriority} onValueChange={(v) => setValue("priority", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                        <SelectItem value="IMPORTANT">Important</SelectItem>
                        <SelectItem value="GENERAL">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={watchCategory} onValueChange={(v) => setValue("category", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(CATEGORY_CONFIG).map((c) => (
                          <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expires On (Optional)</Label>
                  <Input type="date" {...register("expiresAt")} />
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">
                  {editing ? "Update" : "Post"} Announcement
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search announcements..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="URGENT">Urgent</SelectItem>
            <SelectItem value="IMPORTANT">Important</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            {Object.keys(CATEGORY_CONFIG).map((c) => (
              <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-gray-500">No announcements found.</CardContent></Card>
        ) : (
          announcements.map((ann) => {
            const status = getAnnouncementStatus(ann);
            const pc = PRIORITY_CONFIG[ann.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.GENERAL;
            const cc = CATEGORY_CONFIG[ann.category] || CATEGORY_CONFIG.GENERAL;
            const expanded = expandedId === ann.id;
            const showExpand = isLong(ann.content);

            return (
              <Card key={ann.id} className={`transition-all ${ann.pinned ? "ring-2 ring-violet-200 bg-violet-50/30" : ""} hover:shadow-md`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${pc.color}`}>
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {ann.pinned && <Pin className="h-3.5 w-3.5 text-violet-500" />}
                            <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${pc.color}`}>{pc.label}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${cc}`}>{ann.category}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${status.color}`}>{status.label}</span>
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => togglePin(ann)} title={ann.pinned ? "Unpin" : "Pin"}>
                              <Pin className={`h-3.5 w-3.5 ${ann.pinned ? "text-violet-500" : "text-gray-400"}`} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(ann)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(ann.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {ann.imageUrl && (
                    <div className="mt-3 ml-11">
                      <img src={ann.imageUrl} alt="" className="rounded-lg max-h-48 object-cover" />
                    </div>
                  )}

                  <div className="mt-3 ml-11">
                    <p className={`text-sm text-gray-700 whitespace-pre-wrap ${!expanded && showExpand ? "line-clamp-3" : ""}`}>
                      {ann.content}
                    </p>
                    {showExpand && (
                      <button onClick={() => toggleExpand(ann)} className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-0.5">
                        {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Read more</>}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-3 ml-11 text-xs text-gray-500">
                    <span>Posted by <b>{ann.postedBy.name}</b></span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {timeAgo(ann.createdAt)}</span>
                    <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {ann.viewCount}</span>
                    {ann.expiresAt && (
                      <span className={new Date(ann.expiresAt) < new Date() ? "text-red-500 font-medium" : ""}>
                        Expires {new Date(ann.expiresAt).toLocaleDateString("en-PH")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
