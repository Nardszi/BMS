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

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors, touchedFields } } = useForm<RegisterForm>({
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
        const data = await res.json();
        setRefNumber(data.referenceNumber || "");
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

  async function nextStep() {
    let fieldsToValidate: (keyof RegisterForm)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["firstName", "lastName", "birthDate", "gender", "civilStatus"];
        break;
      case 2:
        fieldsToValidate = ["address", "purok"];
        break;
      case 3:
        fieldsToValidate = ["contactNumber"];
        break;
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  }

  function prevStep() {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0c1929] flex items-center justify-center p-4">
        <div className="absolute inset-0">
          <Image src="/login-bg.jpg" alt="Daan Banwa" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-[#0c1929]/85" />
        </div>
        <div className={`relative z-10 w-full max-w-sm transition-all duration-700 ${mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 border border-green-400/30">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Registration Submitted</h2>
            <p className="mt-2 text-sm text-white/50">
              Your information has been received and is pending review by barangay staff.
            </p>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Reference Number</p>
              <p className="text-lg font-mono font-bold text-amber-400">{refNumber}</p>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">What happens next?</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="text-xs text-white/60">Barangay staff will review your records</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="text-xs text-white/60">Verification typically takes <span className="font-medium text-white/80">1-3 business days</span></p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="text-xs text-white/60">You will be contacted once approved</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl border-white/10 bg-white/5 text-sm text-white hover:bg-white/10"
                onClick={() => { setSuccess(false); setCurrentStep(1); setRefNumber(""); }}
              >
                Register Another Resident
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0c1929]">
      {/* Full-Screen Background Image */}
      <div className="absolute inset-0">
        <Image src="/login-bg.jpg" alt="Daan Banwa" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1929]/90 via-[#0c1929]/70 to-[#0c1929]/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-20 border-b border-amber-400/10 bg-[#0c1929]/50 backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login" className="rounded-lg p-2 text-amber-200/60 hover:bg-white/10 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="relative h-9 w-9 flex-shrink-0 rounded-lg bg-white/10 p-1 border border-amber-400/20 sm:h-10 sm:w-10">
                <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain p-0.5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white sm:text-lg">Barangay IX</h1>
                <p className="text-[10px] text-amber-200/50 sm:text-xs">Resident Registration</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl flex-1 px-4 pb-32 pt-4 sm:pb-8 sm:pt-8">
          {/* Progress Steps */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-12 sm:w-12 ${
                        currentStep > step.id
                          ? "border-amber-500 bg-amber-500 text-white"
                          : currentStep === step.id
                          ? "border-amber-400 bg-amber-400/20 text-amber-400 scale-110 shadow-lg shadow-amber-500/20"
                          : "border-white/20 bg-white/5 text-white/40"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <p className={`mt-1.5 text-[10px] font-medium sm:text-xs ${
                      currentStep >= step.id ? "text-amber-400" : "text-white/40"
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`mx-1 h-0.5 flex-1 transition-colors sm:mx-2 ${
                      currentStep > step.id ? "bg-amber-500" : "bg-white/10"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className={`rounded-3xl border border-amber-400/20 bg-gradient-to-br from-white/15 to-amber-500/5 p-5 shadow-2xl backdrop-blur-xl transition-all duration-500 sm:p-8 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white sm:text-2xl">Personal Information</h3>
                    <p className="mt-1.5 text-sm text-amber-100/50">Tell us about yourself</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-white/80">First Name *</Label>
                      <Input
                        {...register("firstName")}
                        placeholder="Juan"
                        className="h-14 rounded-2xl border-2 border-white/10 bg-white/5 text-base text-white placeholder:text-white/30 focus:border-amber-400 focus:bg-white/10 focus:ring-0 focus:transition-colors"
                      />
                      {errors.firstName && (
                        <p className="text-xs text-red-400 mt-1">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-white/80">Last Name *</Label>
                      <Input
                        {...register("lastName")}
                        placeholder="dela Cruz"
                        className="h-14 rounded-2xl border-2 border-white/10 bg-white/5 text-base text-white placeholder:text-white/30 focus:border-amber-400 focus:bg-white/10 focus:ring-0 focus:transition-colors"
                      />
                      {errors.lastName && (
                        <p className="text-xs text-red-400 mt-1">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Middle Name</Label>
                    <Input
                      {...register("middleName")}
                      placeholder="Optional"
                      className="h-14 rounded-2xl border-2 border-white/10 bg-white/5 text-base text-white placeholder:text-white/30 focus:border-amber-400 focus:bg-white/10 focus:ring-0 focus:transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Birth Date *</Label>
                    <Input
                      type="date"
                      {...register("birthDate")}
                      className="h-14 rounded-2xl border-2 border-white/10 bg-white/5 text-base text-white placeholder:text-white/30 focus:border-amber-400 focus:bg-white/10 focus:ring-0 focus:transition-colors"
                    />
                    {errors.birthDate && (
                      <p className="text-xs text-red-400 mt-1">{errors.birthDate.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-white/80">Gender *</Label>
                      <Select onValueChange={(v) => setValue("gender", v)}>
                        <SelectTrigger className="h-14 rounded-2xl border-2 border-white/10 bg-white/5 text-base text-white focus:border-amber-400 focus:ring-0">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="border-amber-400/20 bg-[#1a2d42] text-white">
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && (
                        <p className="text-xs text-red-400 mt-1">{errors.gender.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-white/80">Civil Status *</Label>
                      <Select onValueChange={(v) => setValue("civilStatus", v)}>
                        <SelectTrigger className="h-14 rounded-2xl border-2 border-white/10 bg-white/5 text-base text-white focus:border-amber-400 focus:ring-0">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="border-amber-400/20 bg-[#1a2d42] text-white">
                          <SelectItem value="SINGLE">Single</SelectItem>
                          <SelectItem value="MARRIED">Married</SelectItem>
                          <SelectItem value="WIDOWED">Widowed</SelectItem>
                          <SelectItem value="SEPARATED">Separated</SelectItem>
                          <SelectItem value="DIVORCED">Divorced</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.civilStatus && (
                        <p className="text-xs text-red-400 mt-1">{errors.civilStatus.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Address */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white sm:text-2xl">Address Information</h3>
                    <p className="mt-1.5 text-sm text-amber-100/50">Where do you live?</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Full Address *</Label>
                    <Input
                      {...register("address")}
                      placeholder="e.g., 123 Rizal Street"
                      className="h-14 rounded-2xl border-2 border-white/10 bg-white/5 text-base text-white placeholder:text-white/30 focus:border-amber-400 focus:bg-white/10 focus:ring-0 focus:transition-colors"
                    />
                    {errors.address && (
                      <p className="text-xs text-red-400 mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Purok / Zone *</Label>
                    <Select onValueChange={(v) => setValue("purok", v)}>
                      <SelectTrigger className="h-14 rounded-2xl border-2 border-white/10 bg-white/5 text-base text-white focus:border-amber-400 focus:ring-0">
                        <SelectValue placeholder="Select purok" />
                      </SelectTrigger>
                      <SelectContent className="border-amber-400/20 bg-[#1a2d42] text-white">
                        {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                          <SelectItem key={p} value={String(p)}>Purok {p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.purok && (
                      <p className="text-xs text-red-400 mt-1">{errors.purok.message}</p>
                    )}
                  </div>

                  <div className="rounded-2xl bg-amber-400/10 p-4 border border-amber-400/20">
                    <p className="text-xs font-semibold text-amber-400 mb-1">YOUR ADDRESS</p>
                    <p className="text-base text-white">
                      {formData.address || "123 Rizal Street"}, {formData.purok ? `Purok ${formData.purok}` : "Purok ___"}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Contact */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white sm:text-2xl">Contact Information</h3>
                    <p className="mt-1.5 text-sm text-amber-100/50">How can we reach you?</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Contact Number *</Label>
                    <Input
                      {...register("contactNumber")}
                      placeholder="09XXXXXXXXX"
                      type="tel"
                      inputMode="numeric"
                      className="h-14 rounded-2xl border-2 border-white/10 bg-white/5 text-base text-white placeholder:text-white/30 focus:border-amber-400 focus:bg-white/10 focus:ring-0 focus:transition-colors"
                    />
                    {errors.contactNumber && (
                      <p className="text-xs text-red-400 mt-1">{errors.contactNumber.message}</p>
                    )}
                  </div>

                  <div className="rounded-2xl bg-amber-400/10 p-4 border border-amber-400/20">
                    <p className="text-sm text-amber-200/70">
                      This number will be used for barangay notifications and emergency contact purposes.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Additional */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-white sm:text-2xl">Additional Information</h3>
                    <p className="mt-1.5 text-sm text-amber-100/50">Optional details (you can skip this)</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Occupation</Label>
                    <Input
                      {...register("occupation")}
                      placeholder="e.g., Teacher, Engineer, Student"
                      className="h-14 rounded-2xl border-2 border-white/10 bg-white/5 text-base text-white placeholder:text-white/30 focus:border-amber-400 focus:bg-white/10 focus:ring-0 focus:transition-colors"
                    />
                  </div>

                  {/* Registered Voter Checkbox */}
                  <div className="flex items-center gap-4 rounded-2xl border-2 border-white/10 bg-white/5 p-5">
                    <input
                      type="checkbox"
                      id="voter"
                      {...register("isRegisteredVoter")}
                      className="h-6 w-6 rounded-lg border-2 border-white/20 bg-white/10 text-amber-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <div>
                      <Label htmlFor="voter" className="text-base font-semibold text-white cursor-pointer">Registered Voter</Label>
                      <p className="text-sm text-amber-100/50 mt-0.5">Check if you are a registered voter in this barangay</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-white/80">Emergency Contact Name</Label>
                      <Input
                        {...register("emergencyContact")}
                        placeholder="Contact person"
                        className="h-14 rounded-2xl border-2 border-white/10 bg-white/5 text-base text-white placeholder:text-white/30 focus:border-amber-400 focus:bg-white/10 focus:ring-0 focus:transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-white/80">Emergency Contact Number</Label>
                      <Input
                        {...register("emergencyPhone")}
                        placeholder="09XXXXXXXXX"
                        type="tel"
                        inputMode="numeric"
                        className="h-14 rounded-2xl border-2 border-white/10 bg-white/5 text-base text-white placeholder:text-white/30 focus:border-amber-400 focus:bg-white/10 focus:ring-0 focus:transition-colors"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-amber-400/10 p-4 border border-amber-400/20">
                    <p className="text-sm text-amber-200/70">
                      By submitting, you agree to have your information recorded in the Barangay IX resident database.
                    </p>
                  </div>
                </div>
              )}
            </form>

            {/* Step Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-amber-200/40">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Navigation - Sticky on Mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-amber-400/10 bg-[#0c1929]/80 backdrop-blur-md safe-area-bottom">
          <div className="mx-auto flex max-w-4xl gap-3 p-4 sm:p-6">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="h-14 flex-1 rounded-2xl border-2 border-white/10 bg-white/5 text-base font-semibold text-white hover:bg-white/10 sm:h-16"
              >
                <ChevronLeft className="mr-1 h-5 w-5" />
                Back
              </Button>
            )}
            
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-base font-semibold text-white hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] sm:h-16"
              >
                Continue
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={handleSubmit(onSubmit)}
                className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-base font-semibold text-white hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] sm:h-16"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Submit
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Safe area padding for mobile */}
        <style jsx global>{`
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
        `}</style>
      </div>
    </div>
  );
}
