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
import { ArrowLeft, CheckCircle2, UserPlus, ChevronRight, ChevronLeft, User, MapPin, Phone, Briefcase } from "lucide-react";

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
  { id: 1, title: "Personal Info", icon: User, description: "Basic information" },
  { id: 2, title: "Address", icon: MapPin, description: "Location details" },
  { id: 3, title: "Contact", icon: Phone, description: "Contact information" },
  { id: 4, title: "Additional", icon: Briefcase, description: "Optional details" },
];

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
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
          <div className="rounded-2xl border border-gray-100 bg-white p-10 shadow-xl">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 animate-bounce">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Registration Successful!</h2>
            <p className="mt-4 text-gray-500">
              Your information has been submitted to Barangay IX - Daan Banwa. Our staff will review and verify your records. You may visit the barangay hall to complete the process.
            </p>
            <div className="mt-8 space-y-3">
              <Link href="/login">
                <Button className="w-full h-12 rounded-xl bg-blue-900 text-base font-medium hover:bg-blue-800 transition-all hover:shadow-lg">
                  Go to Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => { setSuccess(false); setCurrentStep(1); }}>
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
      {/* Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="relative h-10 w-10 flex-shrink-0">
              <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Barangay IX - Daan Banwa</h1>
              <p className="text-xs text-gray-500">Resident Registration</p>
            </div>
          </div>
          <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            Sign In
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      currentStep > step.id
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : currentStep === step.id
                        ? "border-blue-500 bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/30"
                        : "border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <p className={`mt-2 text-xs font-medium transition-colors ${
                    currentStep >= step.id ? "text-blue-600" : "text-gray-400"
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-2 h-0.5 w-16 transition-colors sm:w-24 ${
                    currentStep > step.id ? "bg-emerald-500" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition-all duration-500 sm:p-8 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                  <p className="mt-1 text-sm text-gray-500">Tell us about yourself</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">First Name *</Label>
                    <Input
                      {...register("firstName")}
                      placeholder="Juan"
                      className="h-12 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20"
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Last Name *</Label>
                    <Input
                      {...register("lastName")}
                      placeholder="dela Cruz"
                      className="h-12 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Middle Name</Label>
                  <Input
                    {...register("middleName")}
                    placeholder="Optional"
                    className="h-12 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Birth Date *</Label>
                    <Input
                      type="date"
                      {...register("birthDate")}
                      className="h-12 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20"
                    />
                    {errors.birthDate && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                        {errors.birthDate.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Gender *</Label>
                    <Select onValueChange={(v) => setValue("gender", v)}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                        {errors.gender.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Civil Status *</Label>
                    <Select onValueChange={(v) => setValue("civilStatus", v)}>
                      <SelectTrigger className="h-12 rounded-xl">
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
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                        {errors.civilStatus.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Address Information</h3>
                  <p className="mt-1 text-sm text-gray-500">Where do you live?</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Full Address *</Label>
                  <Input
                    {...register("address")}
                    placeholder="e.g., 123 Rizal Street"
                    className="h-12 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20"
                  />
                  {errors.address && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Purok / Zone *</Label>
                  <Select onValueChange={(v) => setValue("purok", v)}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select purok" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                        <SelectItem key={p} value={String(p)}>Purok {p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.purok && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                      {errors.purok.message}
                    </p>
                  )}
                </div>

                {/* Preview Card */}
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 p-4 border border-blue-100">
                  <p className="text-xs font-medium text-blue-600 mb-2">YOUR ADDRESS</p>
                  <p className="text-gray-900">
                    {formData.address || "123 Rizal Street"}, {formData.purok ? `Purok ${formData.purok}` : "Purok ___"}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Contact */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
                  <p className="mt-1 text-sm text-gray-500">How can we reach you?</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Contact Number *</Label>
                  <Input
                    {...register("contactNumber")}
                    placeholder="09XXXXXXXXX"
                    className="h-12 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20"
                  />
                  {errors.contactNumber && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
                      {errors.contactNumber.message}
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-amber-50 p-4 border border-amber-100">
                  <p className="text-sm text-amber-700">
                    <strong>Note:</strong> This number will be used for barangay notifications and emergency contact purposes.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Additional */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Additional Information</h3>
                  <p className="mt-1 text-sm text-gray-500">Optional details (you can skip this)</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Occupation</Label>
                  <Input
                    {...register("occupation")}
                    placeholder="e.g., Teacher, Engineer, Student"
                    className="h-12 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Emergency Contact Name</Label>
                    <Input
                      {...register("emergencyContact")}
                      placeholder="Contact person"
                      className="h-12 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Emergency Contact Number</Label>
                    <Input
                      {...register("emergencyPhone")}
                      placeholder="09XXXXXXXXX"
                      className="h-12 rounded-xl transition-all focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                  <p className="text-sm text-blue-700">
                    By submitting this form, you agree to have your information recorded in the Barangay IX resident database for governance and service delivery purposes.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex gap-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="h-12 flex-1 rounded-xl"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="h-12 flex-1 rounded-xl bg-blue-900 hover:bg-blue-800 transition-all hover:shadow-lg"
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="h-12 flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Submit Registration
                    </div>
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* Step Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Barangay IX - Daan Banwa, City of Victorias, Negros Occidental
        </p>
      </div>
    </div>
  );
}
