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
import {
  ArrowLeft, CheckCircle2, ChevronRight, ChevronLeft, User, MapPin,
  Phone, Briefcase, Loader2, Printer, Download, AlertTriangle,
} from "lucide-react";
import { PUROK_OPTIONS, BARANGAY_CITY, BARANGAY_PROVINCE } from "@/lib/constants";

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

const inputClass = "w-full rounded-xl px-4 py-3 text-[16px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-300 border border-gray-200 focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400";
const inputBg = "bg-white hover:bg-gray-50 focus:bg-white";

const AUTO_SAVE_KEY = "bms-register-draft";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [mounted, setMounted] = useState(false);
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
      setValue("address", `${purokLabel}, ${BARANGAY_CITY}, ${BARANGAY_PROVINCE}`, { shouldValidate: true });
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

  function getAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  async function onSubmit(data: RegisterForm) {
    if (data.birthDate && getAge(data.birthDate) < 10) {
      toast({ title: "Age Requirement", description: "You must be at least 10 years old to register.", variant: "error" });
      return;
    }
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
      <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-amber-200/40 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-orange-200/30 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
          <Image src="/barangay-seal.png" alt="" width={400} height={400} className="object-contain" />
        </div>

        <div className={`relative z-10 w-full max-w-sm transition-all duration-700 ${mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
          <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-300/40">
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">Registration Successful!</h2>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500 text-center">
              Your information has been submitted for review.
            </p>
            {refNumber && (
              <div className="mt-4 sm:mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4 text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-amber-600 mb-1">Reference Number</p>
                <p className="text-base sm:text-lg font-mono font-bold text-amber-700 break-all">{refNumber}</p>
              </div>
            )}
            <div className="mt-5 sm:mt-6 space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <Button variant="outline" onClick={printReference} className="h-11 rounded-xl border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-sm">
                  <Printer className="mr-1.5 h-4 w-4" /> <span className="hidden xs:inline">Print</span><span className="xs:hidden">Print</span>
                </Button>
                <Button variant="outline" onClick={() => {
                  const text = `Barangay IX Registration\nReference: ${refNumber}\nDate: ${new Date().toLocaleString()}`;
                  navigator.clipboard.writeText(text);
                  toast({ title: "Copied!", variant: "success" });
                }} className="h-11 rounded-xl border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-sm">
                  <Download className="mr-1.5 h-4 w-4" /> Copy
                </Button>
              </div>
              <Link href="/login" className="block">
                <Button className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-400/30">
                  Go to Login
                </Button>
              </Link>
              <Button variant="ghost" className="h-11 w-full rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100" onClick={() => { setSuccess(false); setCurrentStep(1); setRefNumber(""); }}>
                Register Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full bg-amber-200/30 blur-[100px] sm:blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full bg-orange-200/20 blur-[80px] sm:blur-[100px] animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-gray-200/60 bg-white/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5 sm:py-3">
            <Link href="/login" className="rounded-lg p-1.5 sm:p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors -ml-1.5 sm:-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-lg sm:rounded-xl bg-white border border-gray-200 p-0.5 sm:p-1 shadow-sm">
              <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain p-0.5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate">Barangay IX</h1>
              <p className="text-[10px] text-gray-500">Resident Registration</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4 sm:pt-6">
          {/* Step Progress */}
          <div className="mb-5 sm:mb-8">
            <div className="flex items-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all duration-500 ${
                        currentStep > step.id
                          ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-300/40"
                          : currentStep === step.id
                          ? "bg-white border-2 border-amber-400 text-amber-600 shadow-lg shadow-amber-200/40"
                          : "bg-gray-100 border border-gray-200 text-gray-400"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <step.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </div>
                    <p className={`mt-1.5 text-[10px] sm:text-[11px] font-medium ${currentStep >= step.id ? "text-gray-700" : "text-gray-400"}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`mx-1 sm:mx-2 h-0.5 flex-1 rounded-full transition-colors duration-500 ${
                      currentStep > step.id ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className={`rounded-2xl sm:rounded-3xl border border-gray-200 bg-white/90 p-4 sm:p-6 md:p-8 shadow-xl sm:shadow-2xl backdrop-blur-xl transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Personal */}
              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Personal Information</h3>
                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-[13px] text-gray-500">Tell us about yourself</p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-[13px] font-medium text-gray-600">First Name *</Label>
                      <Input {...register("firstName")} placeholder="Juan" className={inputClass} />
                      {errors.firstName && <p className="text-[11px] text-red-500">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-[13px] font-medium text-gray-600">Last Name *</Label>
                      <Input {...register("lastName")} placeholder="dela Cruz" className={inputClass} />
                      {errors.lastName && <p className="text-[11px] text-red-500">{errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-[13px] font-medium text-gray-600">Middle Name</Label>
                    <Input {...register("middleName")} placeholder="Optional" className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-[13px] font-medium text-gray-600">Birth Date *</Label>
                    <Input type="date" {...register("birthDate")} max={new Date().toISOString().split("T")[0]} className={inputClass} />
                    {errors.birthDate && <p className="text-[11px] text-red-500">{errors.birthDate.message}</p>}
                    {formData.birthDate && getAge(formData.birthDate) < 10 && (
                      <p className="text-[11px] text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" /> You must be at least 10 years old
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-[13px] font-medium text-gray-600">Gender *</Label>
                      <Select onValueChange={(v) => setValue("gender", v)}>
                        <SelectTrigger className={inputClass}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="border-gray-200 bg-white text-gray-900 shadow-lg">
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-[11px] text-red-500">{errors.gender.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-[13px] font-medium text-gray-600">Civil Status *</Label>
                      <Select onValueChange={(v) => setValue("civilStatus", v)}>
                        <SelectTrigger className={inputClass}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="border-gray-200 bg-white text-gray-900 shadow-lg">
                          <SelectItem value="SINGLE">Single</SelectItem>
                          <SelectItem value="MARRIED">Married</SelectItem>
                          <SelectItem value="WIDOWED">Widowed</SelectItem>
                          <SelectItem value="SEPARATED">Separated</SelectItem>
                          <SelectItem value="DIVORCED">Divorced</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.civilStatus && <p className="text-[11px] text-red-500">{errors.civilStatus.message}</p>}
                    </div>
                  </div>
                  {duplicateWarning && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700">{duplicateWarning}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Address */}
              {currentStep === 2 && (
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Address Information</h3>
                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-[13px] text-gray-500">Where do you live?</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-[13px] font-medium text-gray-600">Purok / Zone *</Label>
                    <Select onValueChange={(v) => setValue("purok", v)}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select purok" />
                      </SelectTrigger>
                      <SelectContent className="border-gray-200 bg-white text-gray-900 shadow-lg">
                        {PUROK_OPTIONS.map((p) => (
                          <SelectItem key={p} value={String(p)}>{isNaN(Number(p)) ? p : `Purok ${p}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.purok && <p className="text-[11px] text-red-500">{errors.purok.message}</p>}
                  </div>
                  {formData.purok ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1">Your Address</p>
                      <p className="text-sm sm:text-[14px] text-gray-700">
                        {formData.address || `${isNaN(Number(formData.purok)) ? formData.purok : `Purok ${formData.purok}`}, Victorias City, Negros Occidental`}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                      <p className="text-xs sm:text-[13px] text-gray-400">Select your purok to see your address</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Contact */}
              {currentStep === 3 && (
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Contact Information</h3>
                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-[13px] text-gray-500">How can we reach you?</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-[13px] font-medium text-gray-600">Contact Number *</Label>
                    <Input {...register("contactNumber")} placeholder="09XXXXXXXXX" type="tel" inputMode="numeric" maxLength={11} className={inputClass} />
                    {errors.contactNumber && <p className="text-[11px] text-red-500">{errors.contactNumber.message}</p>}
                    <p className="text-[11px] text-gray-400">Format: 09XXXXXXXXX or +639XXXXXXXXX</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                    <p className="text-xs sm:text-[13px] text-gray-500">Used for barangay notifications and emergency contact.</p>
                  </div>
                </div>
              )}

              {/* Step 4: Additional */}
              {currentStep === 4 && (
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Additional Information</h3>
                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-[13px] text-gray-500">Optional details</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-[13px] font-medium text-gray-600">Occupation</Label>
                    <Input {...register("occupation")} placeholder="e.g., Teacher, Engineer, Student" className={inputClass} />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer py-2 -ml-1">
                    <input type="checkbox" id="voter" {...register("isRegisteredVoter")} className="h-5 w-5 rounded-md border border-gray-300 bg-white text-amber-500 focus:ring-0 focus:ring-offset-0" />
                    <div>
                      <span className="text-sm text-gray-700">Registered Voter</span>
                      <span className="text-xs text-gray-400 ml-1.5">— in this barangay</span>
                    </div>
                  </label>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-[13px] font-medium text-gray-600">Emergency Contact Name</Label>
                      <Input {...register("emergencyContact")} placeholder="Contact person" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-[13px] font-medium text-gray-600">Emergency Contact Number</Label>
                      <Input {...register("emergencyPhone")} placeholder="09XXXXXXXXX" type="tel" inputMode="numeric" maxLength={11} className={inputClass} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                    <p className="text-xs sm:text-[13px] text-gray-500">By submitting, your information will be recorded in the barangay database.</p>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-[11px] sm:text-[12px] text-gray-400">Step {currentStep} of {steps.length}</p>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200/60 bg-white/90 backdrop-blur-xl safe-area-bottom">
          <div className="mx-auto flex max-w-lg gap-3 p-3 sm:p-4">
            {currentStep > 1 && (
              <Button type="button" variant="ghost" onClick={prevStep} className="h-12 flex-1 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            )}
            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep} className="h-12 flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] shadow-lg shadow-amber-400/30 transition-all">
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" onClick={handleSubmit(onSubmit)} className="h-12 flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] shadow-lg shadow-amber-400/30 transition-all" disabled={loading}>
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
