"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { announcementSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

type AnnouncementForm = z.infer<typeof announcementSchema>;

interface Announcement {
  id: string;
  title: string;
  content: string;
  expiresAt: string | null;
  priority: string;
  category: string;
}

const CATEGORIES = ["HEALTH", "SAFETY", "EVENT", "MEETING", "GENERAL", "OTHERS"];

interface AnnouncementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Announcement | null;
  onSubmit: (data: AnnouncementForm) => Promise<void>;
  submitting: boolean;
}

export function AnnouncementFormDialog({ open, onOpenChange, editing, onSubmit, submitting }: AnnouncementFormDialogProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
  });

  const watchPriority = watch("priority");
  const watchCategory = watch("category");

  useEffect(() => {
    if (editing && open) {
      setValue("title", editing.title);
      setValue("content", editing.content);
      if (editing.expiresAt) setValue("expiresAt", editing.expiresAt.split("T")[0]);
      setValue("priority", editing.priority as "URGENT" | "IMPORTANT" | "GENERAL");
      setValue("category", editing.category as "HEALTH" | "SAFETY" | "EVENT" | "MEETING" | "GENERAL" | "OTHERS");
    }
  }, [editing, open, setValue]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => onOpenChange(true)}>
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
              <Select value={watchPriority} onValueChange={(v) => setValue("priority", v as "URGENT" | "IMPORTANT" | "GENERAL", { shouldValidate: true })}>
                <SelectTrigger className={errors.priority ? "border-red-500 ring-red-500/30" : ""}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="IMPORTANT">Important</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={watchCategory} onValueChange={(v) => setValue("category", v as "HEALTH" | "SAFETY" | "EVENT" | "MEETING" | "GENERAL" | "OTHERS", { shouldValidate: true })}>
                <SelectTrigger className={errors.category ? "border-red-500 ring-red-500/30" : ""}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
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
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
            {submitting ? "Saving..." : editing ? "Update" : "Post"} Announcement
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
