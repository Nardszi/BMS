"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, UserPlus } from "lucide-react";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  birthDate: z.string().min(1, "Birth date is required"),
  gender: z.string().min(1, "Gender is required"),
  civilStatus: z.string().min(1, "Civil status is required"),
  address: z.string().min(1, "Address is required"),
  purok: z.string().min(1, "Purok is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  occupation: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterForm) {
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const err = await res.json();
        toast({ title: "Registration Failed", description: err.error || "Please try again", variant: "error" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-gray-100 bg-white p-10 shadow-xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Registration Successful!</h2>
            <p className="mt-3 text-gray-500">
              Your information has been submitted to Barangay IX - Daan Banwa. Our staff will review and verify your records. You may visit the barangay hall to complete the process.
            </p>
            <div className="mt-8 space-y-3">
              <Link href="/login">
                <Button className="w-full bg-blue-900 hover:bg-blue-800">Go to Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="w-full" onClick={() => setSuccess(false)}>
                  Register Another
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50">
      {/* Header */}
      <div className="border-b border-white/50 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <Link href="/login" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Barangay IX - Daan Banwa</h1>
            <p className="text-xs text-gray-500">Resident Registration Form</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-2xl p-4 py-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Register as Resident</h2>
              <p className="text-sm text-gray-500">Fill out the form below to join the barangay system</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Personal Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">First Name *</Label>
                    <Input {...register("firstName")} placeholder="Juan" className="h-11" />
                    {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Last Name *</Label>
                    <Input {...register("lastName")} placeholder="dela Cruz" className="h-11" />
                    {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Middle Name</Label>
                  <Input {...register("middleName")} placeholder="Optional" className="h-11" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Birth Date *</Label>
                    <Input type="date" {...register("birthDate")} className="h-11" />
                    {errors.birthDate && <p className="text-xs text-red-500">{errors.birthDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Gender *</Label>
                    <Select onValueChange={(v) => setValue("gender", v)}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Civil Status *</Label>
                    <Select onValueChange={(v) => setValue("civilStatus", v)}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Single</SelectItem>
                        <SelectItem value="MARRIED">Married</SelectItem>
                        <SelectItem value="WIDOWED">Widowed</SelectItem>
                        <SelectItem value="SEPARATED">Separated</SelectItem>
                        <SelectItem value="DIVORCED">Divorced</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.civilStatus && <p className="text-xs text-red-500">{errors.civilStatus.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Address & Contact */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Address & Contact</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Full Address *</Label>
                  <Input {...register("address")} placeholder="e.g., 123 Rizal Street" className="h-11" />
                  {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Purok / Zone *</Label>
                    <Select onValueChange={(v) => setValue("purok", v)}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select purok" /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                          <SelectItem key={p} value={String(p)}>Purok {p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.purok && <p className="text-xs text-red-500">{errors.purok.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Contact Number *</Label>
                    <Input {...register("contactNumber")} placeholder="09XXXXXXXXX" className="h-11" />
                    {errors.contactNumber && <p className="text-xs text-red-500">{errors.contactNumber.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Additional Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Occupation</Label>
                  <Input {...register("occupation")} placeholder="Optional" className="h-11" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Emergency Contact Name</Label>
                    <Input {...register("emergencyContact")} placeholder="Optional" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Emergency Contact Number</Label>
                    <Input {...register("emergencyPhone")} placeholder="Optional" className="h-11" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
              <p>By submitting this form, you agree to have your information recorded in the Barangay IX resident database for governance and service delivery purposes.</p>
            </div>

            <Button type="submit" className="h-12 w-full rounded-xl bg-blue-900 text-base font-medium hover:bg-blue-800" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </div>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Barangay IX - Daan Banwa, City of Victorias, Negros Occidental
        </p>
      </div>
    </div>
  );
}
