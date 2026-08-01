"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { officialSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

type OfficialForm = z.infer<typeof officialSchema>;

export const POSITIONS = [
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

interface Official {
  id: string;
  position: string;
  termStart: string;
  termEnd: string;
  user: { id: string; name: string; role: string };
}

interface UserOption {
  id: string;
  name: string;
  role: string;
}

interface OfficialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Official | null;
  users: UserOption[];
  onSubmit: (data: OfficialForm) => Promise<void>;
  submitting: boolean;
}

export function OfficialFormDialog({ open, onOpenChange, editing, users, onSubmit, submitting }: OfficialFormDialogProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<OfficialForm>({
    resolver: zodResolver(officialSchema),
  });

  const watchPosition = watch("position");

  useEffect(() => {
    if (editing && open) {
      setValue("userId", editing.user.id);
      setValue("position", editing.position);
      setValue("termStart", editing.termStart.split("T")[0]);
      setValue("termEnd", editing.termEnd.split("T")[0]);
    }
  }, [editing, open, setValue]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => onOpenChange(true)}>
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
  );
}
