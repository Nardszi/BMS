"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, Lock, Mail, Shield, MapPin, Phone } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { register, handleSubmit, formState: { errors, touchedFields } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast({ title: "Login Failed", description: "Invalid email or password. Please try again.", variant: "error" });
      } else {
        toast({ title: "Welcome!", description: "Logged in successfully", variant: "success" });
        router.push("/");
        router.refresh();
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-900">
      {/* Full-Screen Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/login-bg.jpg"
          alt="Daan Banwa"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Branding (Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-xl bg-white/10 p-2 backdrop-blur-sm border border-white/20">
              <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain p-1" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Barangay IX</h1>
              <p className="text-sm text-white/60">Daan Banwa</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Welcome to
              <span className="block text-emerald-400">Daan Banwa</span>
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Your digital gateway to barangay services and community governance.
            </p>
          </div>

          <div className="flex items-center gap-6 text-white/50 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>City of Victorias, Negros Occidental</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>(034) 123-4567</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex w-full items-center justify-center p-4 sm:p-6 lg:w-1/2 lg:p-12">
          <div className={`w-full max-w-md transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            {/* Mobile Logo */}
            <div className="mb-6 text-center lg:hidden">
              <div className="mx-auto relative h-16 w-16 rounded-2xl bg-white/10 p-2 backdrop-blur-sm border border-white/20 shadow-xl">
                <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain p-1" />
              </div>
            </div>

            {/* Glass Card */}
            <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                <p className="mt-2 text-sm text-white/60">Sign in to your account to continue</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white/80">
                    Email address
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="username"
                      placeholder="you@example.com"
                      className={`h-12 rounded-xl border-white/20 bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-emerald-400 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/20 ${
                        touchedFields.email && errors.email ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""
                      }`}
                      {...register("email")}
                    />
                  </div>
                  {touchedFields.email && errors.email && (
                    <p className="text-xs text-red-400">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-white/80">
                      Password
                    </Label>
                    <button
                      type="button"
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                      onClick={() => toast({ title: "Password Reset", description: "Please contact your barangay administrator.", variant: "default" })}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className={`h-12 rounded-xl border-white/20 bg-white/10 pl-10 pr-12 text-sm text-white placeholder:text-white/40 focus:border-emerald-400 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/20 ${
                        touchedFields.password && errors.password ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""
                      }`}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {touchedFields.password && errors.password && (
                    <p className="text-xs text-red-400">{errors.password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 text-white/40">or</span>
                </div>
              </div>

              {/* Register Link */}
              <Link href="/register">
                <Button variant="outline" className="h-12 w-full rounded-xl border-white/20 bg-transparent text-sm font-medium text-white hover:bg-white/10 hover:border-white/30 transition-all">
                  <Shield className="mr-2 h-4 w-4 text-white/60" />
                  Register as New Resident
                </Button>
              </Link>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-white/40">
              &copy; 2026 Barangay IX - Daan Banwa. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
