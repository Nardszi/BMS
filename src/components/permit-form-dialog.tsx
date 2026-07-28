"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { permitSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

type PermitForm = z.infer<typeof permitSchema>;

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

interface PermitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residents: Resident[];
  onSubmit: (data: PermitForm) => void;
  submitting: boolean;
}

export function PermitFormDialog({ open, onOpenChange, residents, onSubmit, submitting }: PermitFormDialogProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PermitForm>({
    resolver: zodResolver(permitSchema),
  });

  const issueDate = watch("issueDate");

  const handleOpenChange = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
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
            <Select onValueChange={(v) => setValue("ownerResidentId", v, { shouldValidate: true })}>
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
            <Select onValueChange={(v) => setValue("businessType", v, { shouldValidate: true })}>
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
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
            {submitting ? "Creating..." : "Create Permit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
