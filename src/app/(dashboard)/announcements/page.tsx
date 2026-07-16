"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Plus, Megaphone, Trash2, Pencil } from "lucide-react";

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  expiresAt: z.string().optional(),
});

type AnnouncementForm = z.infer<typeof announcementSchema>;

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  expiresAt: string | null;
  postedBy: { name: string };
}

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const role = (session?.user as any)?.role;
  const canManage = ["ADMIN", "SECRETARY"].includes(role);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
  });

  const fetchAnnouncements = async () => {
    const res = await fetch("/api/announcements");
    const data = await res.json();
    setAnnouncements(data || []);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

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
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Announcement Deleted", variant: "success" });
      fetchAnnouncements();
    }
  }

  function openEdit(ann: Announcement) {
    setEditing(ann);
    setValue("title", ann.title);
    setValue("content", ann.content);
    if (ann.expiresAt) setValue("expiresAt", ann.expiresAt.split("T")[0]);
    setOpen(true);
  }

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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit" : "New"} Announcement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input {...register("title")} />
                  {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea {...register("content")} rows={5} />
                  {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
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

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No announcements posted yet.
            </CardContent>
          </Card>
        ) : (
          announcements.map((ann) => (
            <Card key={ann.id}>
              <CardHeader className="flex flex-row items-start gap-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <Megaphone className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ann.title}</CardTitle>
                    {canManage && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(ann)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(ann.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <span>Posted by {ann.postedBy.name}</span>
                    <span>&middot;</span>
                    <span>{new Date(ann.createdAt).toLocaleDateString("en-PH")}</span>
                    {ann.expiresAt && (
                      <>
                        <span>&middot;</span>
                        <Badge variant="outline">Expires {new Date(ann.expiresAt).toLocaleDateString("en-PH")}</Badge>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700">{ann.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
