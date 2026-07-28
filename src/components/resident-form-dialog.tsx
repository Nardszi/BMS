"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { residentSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { PUROK_OPTIONS } from "@/lib/constants";

type ResidentForm = z.infer<typeof residentSchema>;

interface ResidentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: { id?: string; firstName?: string; lastName?: string; middleName?: string | null; birthDate?: string; gender?: string; civilStatus?: string; address?: string; occupation?: string | null; contactNumber?: string | null; emergencyContact?: string | null; emergencyPhone?: string | null; isRegisteredVoter?: boolean; household?: { address: string; purok: string } } | null;
  onSubmit: (data: ResidentForm) => Promise<void>;
  submitting: boolean;
  canEdit: boolean;
  onOpenNew: () => void;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
}

export function ResidentFormDialog({ open, onOpenChange, editing, onSubmit, submitting, canEdit, onOpenNew }: ResidentFormDialogProps) {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ResidentForm>({
    resolver: zodResolver(residentSchema),
  });

  useEffect(() => {
    if (editing && open) {
      setValue("firstName", editing.firstName || "");
      setValue("lastName", editing.lastName || "");
      setValue("middleName", editing.middleName || "");
      setValue("birthDate", editing.birthDate ? editing.birthDate.split("T")[0] : "");
      setValue("gender", editing.gender as "MALE" | "FEMALE");
      setValue("civilStatus", editing.civilStatus as "SINGLE" | "MARRIED" | "WIDOWED" | "SEPARATED" | "DIVORCED");
      setValue("address", editing.household?.address || editing.address || "");
      setValue("purok", editing.household?.purok || "");
      setValue("occupation", editing.occupation || "");
      setValue("contactNumber", editing.contactNumber || "");
      setValue("emergencyContact", editing.emergencyContact || "");
      setValue("emergencyPhone", editing.emergencyPhone || "");
      setValue("isRegisteredVoter", editing.isRegisteredVoter || false);
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
        <Button onClick={onOpenNew} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Resident
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Resident" : "Add New Resident"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input {...register("firstName")} placeholder="Juan" />
              {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input {...register("lastName")} placeholder="dela Cruz" />
              {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Middle Name</Label>
            <Input {...register("middleName")} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Birth Date *</Label>
              <Input type="date" {...register("birthDate")} />
              {errors.birthDate && <p className="text-sm text-red-500">{errors.birthDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select onValueChange={(v) => setValue("gender", v as "MALE" | "FEMALE", { shouldValidate: true })} defaultValue={editing?.gender}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Civil Status *</Label>
              <Select onValueChange={(v) => setValue("civilStatus", v as "SINGLE" | "MARRIED" | "WIDOWED" | "SEPARATED" | "DIVORCED", { shouldValidate: true })} defaultValue={editing?.civilStatus}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="MARRIED">Married</SelectItem>
                  <SelectItem value="WIDOWED">Widowed</SelectItem>
                  <SelectItem value="SEPARATED">Separated</SelectItem>
                  <SelectItem value="DIVORCED">Divorced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contact Number *</Label>
              <Input {...register("contactNumber")} placeholder="09XX-XXX-XXXX" onChange={(e) => { const formatted = formatPhone(e.target.value); setValue("contactNumber", formatted, { shouldValidate: true }); }} />
              {errors.contactNumber && <p className="text-sm text-red-500">{errors.contactNumber.message}</p>}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-3 text-sm font-medium text-foreground/80">Address Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Address *</Label>
                <Input {...register("address")} placeholder="123 Rizal Street" />
                {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Purok *</Label>
                <Select onValueChange={(v) => setValue("purok", v, { shouldValidate: true })} defaultValue={editing?.household?.purok}>
                  <SelectTrigger><SelectValue placeholder="Select purok" /></SelectTrigger>
                  <SelectContent>
                    {PUROK_OPTIONS.map((p) => (
                      <SelectItem key={p} value={String(p)}>{isNaN(Number(p)) ? p : `Purok ${p}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.purok && <p className="text-sm text-red-500">{errors.purok.message}</p>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Emergency Contact Name</Label>
              <Input {...register("emergencyContact")} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact Number</Label>
              <Input {...register("emergencyPhone")} placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Occupation</Label>
            <Input {...register("occupation")} placeholder="Optional" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="voter" {...register("isRegisteredVoter")} className="rounded" />
            <Label htmlFor="voter">Registered Voter</Label>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
            {submitting ? "Saving..." : editing ? "Update" : "Add"} Resident
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
