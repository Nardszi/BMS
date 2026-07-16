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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-4">
        <div className={`w-full max-w-md text-center transition-all duration-700 ${mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl sm:p-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 sm:h-24 sm:w-24">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 sm:h-12 sm:w-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Registration Successful!</h2>
            <p className="mt-3 text-sm text-gray-500 sm:mt-4 sm:text-base">
              Your information has been submitted. Our staff will review and verify your records.
            </p>
            <div className="mt-6 space-y-3 sm:mt-8">
              <Link href="/login">
                <Button className="h-12 w-full rounded-xl bg-blue-900 text-sm font-medium hover:bg-blue-800 sm:h-13 sm:text-base">
                  Go to Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="h-12 w-full rounded-xl text-sm sm:h-13" onClick={() => { setSuccess(false); setCurrentStep(1); }}>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="relative h-9 w-9 flex-shrink-0 sm:h-10 sm:w-10">
              <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 sm:text-lg">Barangay IX</h1>
              <p className="text-[10px] text-gray-500 sm:text-xs">Resident Registration</p>
            </div>
          </div>
          <Link href="/login" className="text-xs font-medium text-blue-600 hover:text-blue-800 sm:text-sm">
            Sign In
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-32 pt-4 sm:pb-8 sm:pt-8">
        {/* Progress Steps - Mobile Compact */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-12 sm:w-12 ${
                      currentStep > step.id
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : currentStep === step.id
                        ? "border-blue-500 bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/30"
                        : "border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                  <p className={`mt-1.5 text-[10px] font-medium sm:text-xs ${
                    currentStep >= step.id ? "text-blue-600" : "text-gray-400"
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-1 h-0.5 flex-1 transition-colors sm:mx-2 ${
                    currentStep > step.id ? "bg-emerald-500" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-xl transition-all duration-500 sm:p-8 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Personal Information</h3>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">Tell us about yourself</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs font-medium text-gray-700 sm:text-sm">First Name *</Label>
                    <Input
                      {...register("firstName")}
                      placeholder="Juan"
                      className="h-12 rounded-xl text-sm sm:text-base"
                    />
                    {errors.firstName && (
                      <p className="text-[11px] text-red-500">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs font-medium text-gray-700 sm:text-sm">Last Name *</Label>
                    <Input
                      {...register("lastName")}
                      placeholder="dela Cruz"
                      className="h-12 rounded-xl text-sm sm:text-base"
                    />
                    {errors.lastName && (
                      <p className="text-[11px] text-red-500">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs font-medium text-gray-700 sm:text-sm">Middle Name</Label>
                  <Input
                    {...register("middleName")}
                    placeholder="Optional"
                    className="h-12 rounded-xl text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs font-medium text-gray-700 sm:text-sm">Birth Date *</Label>
                    <Input
                      type="date"
                      {...register("birthDate")}
                      className="h-12 rounded-xl text-sm sm:text-base"
                    />
                    {errors.birthDate && (
                      <p className="text-[11px] text-red-500">{errors.birthDate.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="text-xs font-medium text-gray-700 sm:text-sm">Gender *</Label>
                      <Select onValueChange={(v) => setValue("gender", v)}>
                        <SelectTrigger className="h-12 rounded-xl text-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && (
                        <p className="text-[11px] text-red-500">{errors.gender.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="text-xs font-medium text-gray-700 sm:text-sm">Civil Status *</Label>
                      <Select onValueChange={(v) => setValue("civilStatus", v)}>
                        <SelectTrigger className="h-12 rounded-xl text-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE">Single</SelectItem>
                          <SelectItem value="MARRIED">Married</SelectItem>
                          <SelectItem value="WIDOWED">Widowed</SelectItem>
                          <SelectItem value="SEPARATED">Separated</SelectItem>
                          <SelectItem value="DIVORCED">Divorced</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.civilStatus && (
                        <p className="text-[11px] text-red-500">{errors.civilStatus.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {currentStep === 2 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Address Information</h3>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">Where do you live?</p>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs font-medium text-gray-700 sm:text-sm">Full Address *</Label>
                  <Input
                    {...register("address")}
                    placeholder="e.g., 123 Rizal Street"
                    className="h-12 rounded-xl text-sm sm:text-base"
                  />
                  {errors.address && (
                    <p className="text-[11px] text-red-500">{errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs font-medium text-gray-700 sm:text-sm">Purok / Zone *</Label>
                  <Select onValueChange={(v) => setValue("purok", v)}>
                    <SelectTrigger className="h-12 rounded-xl text-sm">
                      <SelectValue placeholder="Select purok" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                        <SelectItem key={p} value={String(p)}>Purok {p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.purok && (
                    <p className="text-[11px] text-red-500">{errors.purok.message}</p>
                  )}
                </div>

                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 p-3 border border-blue-100 sm:p-4">
                  <p className="text-[10px] font-medium text-blue-600 mb-1 sm:text-xs sm:mb-2">YOUR ADDRESS</p>
                  <p className="text-sm text-gray-900 sm:text-base">
                    {formData.address || "123 Rizal Street"}, {formData.purok ? `Purok ${formData.purok}` : "Purok ___"}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Contact */}
            {currentStep === 3 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Contact Information</h3>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">How can we reach you?</p>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs font-medium text-gray-700 sm:text-sm">Contact Number *</Label>
                  <Input
                    {...register("contactNumber")}
                    placeholder="09XXXXXXXXX"
                    type="tel"
                    inputMode="numeric"
                    className="h-12 rounded-xl text-sm sm:text-base"
                  />
                  {errors.contactNumber && (
                    <p className="text-[11px] text-red-500">{errors.contactNumber.message}</p>
                  )}
                </div>

                <div className="rounded-xl bg-amber-50 p-3 border border-amber-100 sm:p-4">
                  <p className="text-xs text-amber-700 sm:text-sm">
                    This number will be used for barangay notifications and emergency contact purposes.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Additional */}
            {currentStep === 4 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Additional Information</h3>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">Optional details (you can skip this)</p>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs font-medium text-gray-700 sm:text-sm">Occupation</Label>
                  <Input
                    {...register("occupation")}
                    placeholder="e.g., Teacher, Engineer, Student"
                    className="h-12 rounded-xl text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs font-medium text-gray-700 sm:text-sm">Emergency Contact Name</Label>
                    <Input
                      {...register("emergencyContact")}
                      placeholder="Contact person"
                      className="h-12 rounded-xl text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs font-medium text-gray-700 sm:text-sm">Emergency Contact Number</Label>
                    <Input
                      {...register("emergencyPhone")}
                      placeholder="09XXXXXXXXX"
                      type="tel"
                      inputMode="numeric"
                      className="h-12 rounded-xl text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50 p-3 border border-blue-100 sm:p-4">
                  <p className="text-xs text-blue-700 sm:text-sm">
                    By submitting, you agree to have your information recorded in the Barangay IX resident database.
                  </p>
                </div>
              </div>
            )}
          </form>

          {/* Step Info - Desktop only */}
          <div className="mt-4 text-center sm:mt-6">
            <p className="text-xs text-gray-500 sm:text-sm">
              Step {currentStep} of {steps.length}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Sticky on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/95 backdrop-blur-md safe-area-bottom">
        <div className="mx-auto flex max-w-4xl gap-3 p-4 sm:p-6">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="h-12 flex-1 rounded-xl border-gray-200 text-sm font-medium sm:h-14"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          )}
          
          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              className={`h-12 rounded-xl bg-blue-900 text-sm font-medium hover:bg-blue-800 active:scale-[0.98] sm:h-14 ${
                currentStep === 1 ? "flex-1" : "flex-1"
              }`}
            >
              Continue
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              className="h-12 flex-1 rounded-xl bg-emerald-600 text-sm font-medium hover:bg-emerald-700 active:scale-[0.98] sm:h-14"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
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
  );
}
