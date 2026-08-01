"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { certificateSchema as certSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

type CertForm = z.infer<typeof certSchema>;

interface ResidentOption {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
}

interface CertificateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residents: ResidentOption[];
  onSubmit: (data: CertForm) => Promise<void>;
  submitting: boolean;
}

export function CertificateFormDialog({ open, onOpenChange, residents, onSubmit, submitting }: CertificateFormDialogProps) {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CertForm>({
    resolver: zodResolver(certSchema),
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
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Certificate Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Resident</Label>
            <Select onValueChange={(v) => setValue("residentId", v, { shouldValidate: true })}>
              <SelectTrigger className={errors.residentId ? "border-red-500 ring-red-500/30" : ""}><SelectValue placeholder="Select resident" /></SelectTrigger>
              <SelectContent>
                {residents.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.lastName}, {r.firstName} {r.middleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.residentId && <p className="text-sm text-red-500">{errors.residentId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Certificate Type</Label>
            <Select onValueChange={(v) => setValue("type", v as "CLEARANCE" | "RESIDENCY" | "INDIGENCY" | "BUSINESS_PERMIT", { shouldValidate: true })}>
              <SelectTrigger className={errors.type ? "border-red-500 ring-red-500/30" : ""}><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CLEARANCE">Barangay Clearance</SelectItem>
                <SelectItem value="RESIDENCY">Certificate of Residency</SelectItem>
                <SelectItem value="INDIGENCY">Certificate of Indigency</SelectItem>
                <SelectItem value="BUSINESS_PERMIT">Business Permit</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Purpose</Label>
            <Textarea {...register("purpose")} placeholder="Purpose of the certificate..." />
            {errors.purpose && <p className="text-sm text-red-500">{errors.purpose.message}</p>}
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90">
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
