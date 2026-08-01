"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { blotterSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

type BlotterForm = z.infer<typeof blotterSchema>;

interface BlotterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BlotterForm) => Promise<void>;
  submitting: boolean;
}

export const INCIDENT_TYPES = [
  "Physical Assault",
  "Verbal Altercation",
  "Theft / Robbery",
  "Property Dispute",
  "Family Dispute",
  "Land Boundary Dispute",
  "Noise Complaint",
  "Vandalism",
  "Cyber Crime",
  "Drug Related",
  "Traffic Incident",
  "Other",
];

export function BlotterFormDialog({ open, onOpenChange, onSubmit, submitting }: BlotterFormDialogProps) {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BlotterForm>({
    resolver: zodResolver(blotterSchema),
    mode: "onChange",
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
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
              <Select onValueChange={(v) => setValue("incidentType", v, { shouldValidate: true })}>
                <SelectTrigger className={errors.incidentType ? "border-red-500 ring-red-500/30" : ""}><SelectValue placeholder="Select type" /></SelectTrigger>
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
          <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90">
            {submitting ? "Filing Report..." : "File Report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
