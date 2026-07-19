"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, User, MapPin,
  Phone, Briefcase, Loader2, Camera, X, Printer, Download, AlertTriangle,
} from "lucide-react";

const phoneRegex = /^(09|\+639)\d{9}$/;

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  middleName: z.string().max(50).optional(),
  birthDate: z.string().min(1, "Birth date is required"),
  gender: z.string().min(1, "Gender is required"),
  civilStatus: z.string().min(1, "Civil status is required"),
  address: z.string().min(1, "Address is required"),
  purok: z.string().min(1, "Purok is required"),
  contactNumber: z.string().min(1, "Contact number is required").regex(phoneRegex, "Must be a valid Philippine number (09XXXXXXXXX)"),
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

const PUROK_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "Toreno", "Aji"];

const AUTO_SAVE_KEY = "bms-register-draft";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const { register, handleSubmit, setValue, watch, trigger, reset, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: (() => {
      try {
        const saved = localStorage.getItem(AUTO_SAVE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
      return {};
    })(),
  });

  const formData = watch();

  useEffect(() => {
    const subscription = watch((data) => {
      try {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data));
      } catch {}
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (formData.purok) {
      const purokLabel = isNaN(Number(formData.purok)) ? formData.purok : `Purok ${formData.purok}`;
      setValue("address", `${purokLabel}, Victorias City, Negros Occidental`, { shouldValidate: true });
    }
  }, [formData.purok, setValue]);

  useEffect(() => {
    const checkDuplicate = async () => {
      if (!formData.firstName || !formData.lastName || !formData.birthDate) {
        setDuplicateWarning(null);
        return;
      }
      try {
        const params = new URLSearchParams({
          firstName: formData.firstName,
          lastName: formData.lastName,
          birthDate: formData.birthDate,
        });
        const res = await fetch(`/api/residents/check-duplicate?${params}`);
        const data = await res.json();
        if (data.exists) {
          setDuplicateWarning(
            `A resident named ${data.resident.firstName} ${data.resident.lastName} already exists (status: ${data.resident.status}).`
          );
        } else {
          setDuplicateWarning(null);
        }
      } catch {}
    };
    const timer = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timer);
  }, [formData.firstName, formData.lastName, formData.birthDate]);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Photo too large", description: "Maximum size is 5MB", variant: "error" });
      return;
    }
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photo) return null;
    const fd = new FormData();
    fd.append("photo", photo);
    const res = await fetch("/api/upload/photo", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  };

  function getAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  async function onSubmit(data: RegisterForm) {
    if (data.birthDate && getAge(data.birthDate) < 15) {
      toast({ title: "Age Requirement", description: "You must be at least 15 years old to register.", variant: "error" });
      return;
    }
    setLoading(true);
    try {
      const photoUrl = await uploadPhoto();
      const payload = { ...data, photoUrl };
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const d = await res.json();
        setRefNumber(d.referenceNumber || "");
        setSuccess(true);
        localStorage.removeItem(AUTO_SAVE_KEY);
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
    else if (currentStep === 2) fields = ["purok"];
    else if (currentStep === 3) fields = ["contactNumber"];
    const isValid = await trigger(fields);
    if (isValid) setCurrentStep((p) => Math.min(p + 1, 4));
  }

  function prevStep() { setCurrentStep((p) => Math.max(p - 1, 1)); }

  function printReference() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Registration Reference</title>
      <style>body{font-family:sans-serif;text-align:center;padding:60px 20px;}
      h1{font-size:24px;margin-bottom:8px;} p{color:#666;font-size:14px;}
      .ref{font-size:28px;font-weight:bold;color:#d97706;margin:20px 0;letter-spacing:2px;}
      .seal{font-size:48px;margin-bottom:16px;}</style></head>
      <body><div class="seal">Barangay IX</div>
      <h1>Resident Registration</h1><p>Barangay IX - Daan Banwa, City of Victorias</p>
      <div class="ref">${refNumber}</div>
      <p>Please save this reference number for your records.</p>
      <p style="margin-top:40px;color:#999;font-size:12px;">Printed: ${new Date().toLocaleString()}</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0a0e1a] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/20 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-orange-600/15 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-amber-600/10 blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Image src="/barangay-seal.png" alt="" width={500} height={500} className="object-contain" />
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
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={printReference} className="h-11 rounded-xl border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white text-sm">
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button variant="outline" onClick={() => {
                  const text = `Barangay IX Registration\nReference: ${refNumber}\nDate: ${new Date().toLocaleString()}`;
                  navigator.clipboard.writeText(text);
                  toast({ title: "Copied", variant: "success" });
                }} className="h-11 rounded-xl border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white text-sm">
                  <Download className="mr-2 h-4 w-4" /> Copy
                </Button>
              </div>
              <Link href="/login">
                <Button className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/20">
                  Go to Login
                </Button>
              </Link>
              <Button variant="ghost" className="h-12 w-full rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5" onClick={() => { setSuccess(false); setCurrentStep(1); setRefNumber(""); setPhoto(null); setPhotoPreview(null); }}>
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
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-[700px] h-[700px] rounded-full bg-amber-500/15 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-orange-600/10 blur-[100px] animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/3 left-1/2 w-[500px] h-[500px] rounded-full bg-amber-600/8 blur-[90px] animate-pulse" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
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

          <div className={`rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-8 shadow-2xl backdrop-blur-2xl transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white">Personal Information</h3>
                    <p className="mt-1 text-[13px] text-white/35">Tell us about yourself</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="relative group">
                      <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-white/15 bg-white/[0.03] transition-all hover:border-amber-400/40 hover:bg-white/[0.06]">
                        {photoPreview ? (
                          <>
                            <img src={photoPreview} alt="Preview" className="h-full w-full rounded-full object-cover" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPhoto(null); setPhotoPreview(null); }}
                              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Camera className="h-6 w-6 text-white/30" />
                            <span className="mt-1 text-[10px] text-white/25">Photo</span>
                          </>
                        )}
                      </label>
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </div>
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
                    <Input type="date" {...register("birthDate")} max={new Date().toISOString().split("T")[0]} className={`${inputClass} ${inputBg}`} />
                    {errors.birthDate && <p className="text-[11px] text-red-400/80">{errors.birthDate.message}</p>}
                    {formData.birthDate && getAge(formData.birthDate) < 15 && (
                      <p className="text-[11px] text-amber-400/80 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> You must be at least 15 years old to register
                      </p>
                    )}
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
                  {duplicateWarning && (
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-[12px] text-amber-300/80">{duplicateWarning}</p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white">Address Information</h3>
                    <p className="mt-1 text-[13px] text-white/35">Where do you live?</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-white/50">Purok / Zone *</Label>
                    <Select onValueChange={(v) => setValue("purok", v)}>
                      <SelectTrigger className={`${inputClass} ${inputBg} border-0 focus:ring-2 focus:ring-amber-400/40`}>
                        <SelectValue placeholder="Select purok" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#141a2e] text-white backdrop-blur-xl">
                        {PUROK_OPTIONS.map((p) => (
                          <SelectItem key={p} value={String(p)}>{isNaN(Number(p)) ? p : `Purok ${p}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.purok && <p className="text-[11px] text-red-400/80">{errors.purok.message}</p>}
                  </div>
                  {formData.purok ? (
                    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-white/20 mb-1">Your Address</p>
                      <p className="text-[14px] text-white/60">
                        {formData.address || `${isNaN(Number(formData.purok)) ? formData.purok : `Purok ${formData.purok}`}, Victorias City, Negros Occidental`}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                      <p className="text-[13px] text-white/25">Select your purok to see your address</p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white">Contact Information</h3>
                    <p className="mt-1 text-[13px] text-white/35">How can we reach you?</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-white/50">Contact Number *</Label>
                    <Input {...register("contactNumber")} placeholder="09XXXXXXXXX" type="tel" inputMode="numeric" maxLength={11} className={`${inputClass} ${inputBg}`} />
                    {errors.contactNumber && <p className="text-[11px] text-red-400/80">{errors.contactNumber.message}</p>}
                    <p className="text-[11px] text-white/20">Format: 09XXXXXXXXX or +639XXXXXXXXX</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                    <p className="text-[13px] text-white/30">Used for barangay notifications and emergency contact.</p>
                  </div>
                </div>
              )}

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
                      <Input {...register("emergencyPhone")} placeholder="09XXXXXXXXX" type="tel" inputMode="numeric" maxLength={11} className={`${inputClass} ${inputBg}`} />
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
