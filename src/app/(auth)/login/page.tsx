"use client";

import { useState } from "react";
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
import { Eye, EyeOff, ArrowRight, Users, Shield, FileText, Building2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
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
        toast({ title: "Login Failed", description: "Invalid email or password", variant: "error" });
      } else {
        toast({ title: "Welcome!", description: "Logged in successfully", variant: "success" });
        router.push("/");
        router.refresh();
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-700 lg:flex lg:flex-col lg:items-center lg:justify-center">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-white/5" />
          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/10" />
          <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-blue-400/10" />
          {/* Dot grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }} />
        </div>

        <div className="relative z-10 max-w-lg px-12 text-center">
          {/* Seal */}
          <div className="mx-auto mb-8 relative h-32 w-32 rounded-full bg-white/10 p-4 backdrop-blur-sm">
            <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain p-2" />
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight">
            Barangay IX
            <span className="block text-emerald-300">Daan Banwa</span>
          </h1>
          <p className="mt-3 text-lg text-blue-200">
            City of Victorias, Negros Occidental
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <Users className="mx-auto mb-2 h-6 w-6 text-emerald-300" />
              <p className="text-sm font-medium text-white">Residents</p>
              <p className="text-xs text-blue-200">Registry & Records</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <FileText className="mx-auto mb-2 h-6 w-6 text-emerald-300" />
              <p className="text-sm font-medium text-white">Services</p>
              <p className="text-xs text-blue-200">Certificates & IDs</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <Shield className="mx-auto mb-2 h-6 w-6 text-emerald-300" />
              <p className="text-sm font-medium text-white">Governance</p>
              <p className="text-xs text-blue-200">Transparent & Fair</p>
            </div>
          </div>

          <p className="mt-10 text-sm text-blue-300/60">
            Powered by modern digital governance
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full flex-col items-center justify-center bg-gray-50 p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 relative h-20 w-20 rounded-full bg-white p-2 shadow-lg">
              <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain p-1" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Barangay IX</h1>
            <p className="text-sm text-gray-500">Daan Banwa, City of Victorias</p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-1 text-gray-500">Sign in to the Barangay Management System</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@barangay.gov"
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 focus:border-blue-500 focus:bg-white focus:ring-blue-500"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 pr-12 focus:border-blue-500 focus:bg-white focus:ring-blue-500"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-blue-900 text-base font-medium hover:bg-blue-800"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/register"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                New resident? Register here
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            Barangay Management System v1.0 &middot; © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
