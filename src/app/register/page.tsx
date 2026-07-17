"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, User, MapPin, Phone, Briefcase, Loader2 } from "lucide-react";

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
  isRegisteredVoter: z.boolean().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

const steps = [
  { id: 1, title: "Personal", icon: User },
  { id: 2, title: "Address", icon: MapPin },
  { id: 3, title: "Contact", icon: Phone },
  { id: 4, title: "Other", icon: Briefcase },
];

const inputClass = "w-full rounded-xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 outline-none transition-all duration-300 border-0 focus:ring-2 focus:ring-amber-400/40";
const inputBg = "bg-white/[0.07] hover:bg-white/[0.1] focus:bg-white/[0.12]";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  const formData = watch();

  async function onSubmit(data: RegisterForm) {
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const d = await res.json();
        setRefNumber(d.referenceNumber || "");
        setSuccess(true);
      } else {
        const err = await res.json();
        toast({ title: "Registration Failed", description: err.error || "Please try again", variant: "error" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    } finally { setLoading(false); }
  }

  async function nextStep() {
    let fields: (keyof RegisterForm)[] = [];
    if (currentStep === 1) fields = ["firstName", "lastName", "birthDate", "gender", "civilStatus"];
    else if (currentStep === 2) fields = ["address", "purok"];
    else if (currentStep === 3) fields = ["contactNumber"];
    const isValid = await trigger(fields);
    if (isValid) setCurrentStep((p) => Math.min(p + 1, 4));
  }

  function prevStep() { setCurrentStep((p) => Math.max(p - 1, 1)); }

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0a0e1a] flex items-center justify-center p-4">
        {/* Animated Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/20 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-orange-600/15 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-amber-600/10 blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className={`relative z-10 w-full max-w-md transition-all duration-700 ${mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-8 sm:p-10 shadow-2xl backdrop-blur-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/20 border border-amber-400/20">
              <CheckCircle2 className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Registration Successful!</h2>
            <p className="mt-3 text-sm text-white/50 text-center">
              Your information has been submitted. Our staff will review and verify your records.
            </p>
            {refNumber && (
              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.05] p-4 text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1">Reference Number</p>
                <p className="text-lg font-mono font-bold text-amber-400">{refNumber}</p>
              </div>
            )}
            <div className="mt-6 space-y-3">
              <Link href="/login">
                <Button className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/20">
                  Go to Login
                </Button>
              </Link>
              <Button variant="ghost" className="h-12 w-full rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5" onClick={() => { setSuccess(false); setCurrentStep(1); setRefNumber(""); }}>
                Register Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Animated Blob Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-[700px] h-[700px] rounded-full bg-amber-500/15 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-orange-600/10 blur-[100px] animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/3 left-1/2 w-[500px] h-[500px] rounded-full bg-amber-600/8 blur-[90px] animate-pulse" style={{ animationDelay: "3s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-white/5 bg-[#0a0e1a]/40 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/login" className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="relative h-9 w-9 flex-shrink-0 rounded-xl bg-white/[0.05] border border-white/10 p-1">
                <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain p-0.5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Barangay IX</h1>
                <p className="text-[10px] text-white/30">Resident Registration</p>
              </div>
            </div>
            <Link href="/login" className="text-xs font-medium text-amber-400/80 hover:text-amber-300 transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl flex-1 px-4 pb-32 pt-6">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 ${
                        currentStep > step.id
                          ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                          : currentStep === step.id
                          ? "bg-white/[0.08] border border-amber-400/30 text-amber-400 shadow-lg shadow-amber-500/10"
                          : "bg-white/[0.03] border border-white/5 text-white/20"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                    </div>
                    <p className={`mt-2 text-[11px] font-medium ${currentStep >= step.id ? "text-white/70" : "text-white/15"}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`mx-2 h-px flex-1 transition-colors duration-500 ${
                      currentStep > step.id ? "bg-gradient-to-r from-amber-500/50 to-orange-500/30" : "bg-white/5"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Liquid Glass Card */}
          <div className={`rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-8 shadow-2xl backdrop-blur-2xl transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white">Personal Information</h3>
                    <p className="mt-1 text-[13px] text-white/35">Tell us about yourself</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-white/50">First Name *</Label>
                      <Input {...register("firstName")} placeholder="Juan" className={`${inputClass} ${inputBg}`} />
                      {errors.firstName && <p className="text-[11px] text-red-400/80">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-white/50">Last Name *</Label>
                      <Input {...register("lastName")} placeholder="dela Cruz" className={`${inputClass} ${inputBg}`} />
                      {errors.lastName && <p className="text-[11px] text-red-400/80">{errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-white/50">Middle Name</Label>
                    <Input {...register("middleName")} placeholder="Optional" className={`${inputClass} ${inputBg}`} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-white/50">Birth Date *</Label>
                    <Input type="date" {...register("birthDate")} className={`${inputClass} ${inputBg}`} />
                    {errors.birthDate && <p className="text-[11px] text-red-400/80">{errors.birthDate.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-white/50">Gender *</Label>
                      <Select onValueChange={(v) => setValue("gender", v)}>
                        <SelectTrigger className={`${inputClass} ${inputBg} border-0 focus:ring-2 focus:ring-amber-400/40`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#141a2e] text-white backdrop-blur-xl">
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-[11px] text-red-400/80">{errors.gender.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-white/50">Civil Status *</Label>
                      <Select onValueChange={(v) => setValue("civilStatus", v)}>
                        <SelectTrigger className={`${inputClass} ${inputBg} border-0 focus:ring-2 focus:ring-amber-400/40`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#141a2e] text-white backdrop-blur-xl">
                          <SelectItem value="SINGLE">Single</SelectItem>
                          <SelectItem value="MARRIED">Married</SelectItem>
                          <SelectItem value="WIDOWED">Widowed</SelectItem>
                          <SelectItem value="SEPARATED">Separated</SelectItem>
                          <SelectItem value="DIVORCED">Divorced</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.civilStatus && <p className="text-[11px] text-red-400/80">{errors.civilStatus.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Address */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white">Address Information</h3>
                    <p className="mt-1 text-[13px] text-white/35">Where do you live?</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-white/50">Full Address *</Label>
                    <Input {...register("address")} placeholder="e.g., 123 Rizal Street" className={`${inputClass} ${inputBg}`} />
                    {errors.address && <p className="text-[11px] text-red-400/80">{errors.address.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-white/50">Purok / Zone *</Label>
                    <Select onValueChange={(v) => setValue("purok", v)}>
                      <SelectTrigger className={`${inputClass} ${inputBg} border-0 focus:ring-2 focus:ring-amber-400/40`}>
                        <SelectValue placeholder="Select purok" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#141a2e] text-white backdrop-blur-xl">
                        {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                          <SelectItem key={p} value={String(p)}>Purok {p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.purok && <p className="text-[11px] text-red-400/80">{errors.purok.message}</p>}
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/20 mb-1">Preview Address</p>
                    <p className="text-[14px] text-white/60">
                      {formData.address || "123 Rizal Street"}, {formData.purok ? `Purok ${formData.purok}` : "Purok ___"}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Contact */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white">Contact Information</h3>
                    <p className="mt-1 text-[13px] text-white/35">How can we reach you?</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-white/50">Contact Number *</Label>
                    <Input {...register("contactNumber")} placeholder="09XXXXXXXXX" type="tel" inputMode="numeric" className={`${inputClass} ${inputBg}`} />
                    {errors.contactNumber && <p className="text-[11px] text-red-400/80">{errors.contactNumber.message}</p>}
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                    <p className="text-[13px] text-white/30">Used for barangay notifications and emergency contact.</p>
                  </div>
                </div>
              )}

              {/* Step 4: Additional */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white">Additional Information</h3>
                    <p className="mt-1 text-[13px] text-white/35">Optional details</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-white/50">Occupation</Label>
                    <Input {...register("occupation")} placeholder="e.g., Teacher, Engineer, Student" className={`${inputClass} ${inputBg}`} />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer py-2">
                    <input type="checkbox" id="voter" {...register("isRegisteredVoter")} className="h-[18px] w-[18px] rounded-md border border-white/20 bg-white/[0.05] text-amber-500 focus:ring-0 focus:ring-offset-0" />
                    <div>
                      <span className="text-[14px] text-white/70">Registered Voter</span>
                      <span className="text-[12px] text-white/25 ml-2">— in this barangay</span>
                    </div>
                  </label>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-white/50">Emergency Contact Name</Label>
                      <Input {...register("emergencyContact")} placeholder="Contact person" className={`${inputClass} ${inputBg}`} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-white/50">Emergency Contact Number</Label>
                      <Input {...register("emergencyPhone")} placeholder="09XXXXXXXXX" type="tel" inputMode="numeric" className={`${inputClass} ${inputBg}`} />
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                    <p className="text-[13px] text-white/25">By submitting, your information will be recorded in the barangay database.</p>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-[12px] text-white/15">{currentStep} of {steps.length}</p>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-[#0a0e1a]/60 backdrop-blur-xl safe-area-bottom">
          <div className="mx-auto flex max-w-4xl gap-3 p-4">
            {currentStep > 1 && (
              <Button type="button" variant="ghost" onClick={prevStep} className="h-12 flex-1 rounded-xl text-[14px] font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            )}
            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep} className="h-12 flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[14px] font-semibold text-white hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] shadow-lg shadow-amber-500/20 transition-all">
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" onClick={handleSubmit(onSubmit)} className="h-12 flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-[14px] font-semibold text-white hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] shadow-lg shadow-amber-500/20 transition-all" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</div>
                ) : (
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Submit</div>
                )}
              </Button>
            )}
          </div>
        </div>

        <style jsx global>{`.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }`}</style>
      </div>
    </div>
  );
}
