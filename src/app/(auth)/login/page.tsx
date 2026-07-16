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
import { Eye, EyeOff, ArrowRight, Users, Shield, FileText, Building2, ChevronRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    { icon: Users, title: "Resident Registry", desc: "Complete digital records for all barangay residents" },
    { icon: FileText, title: "Certificate Services", desc: "Online request and processing of barangay certificates" },
    { icon: Shield, title: "ID Generation", desc: "Digital barangay identification card system" },
    { icon: Building2, title: "Business Permits", desc: "Streamlined business permit management" },
  ];

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Panel - Branding */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-700 lg:flex lg:flex-col lg:items-center lg:justify-center">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] animate-pulse rounded-full bg-white/5" style={{ animationDelay: "1s" }} />
          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/10" />
        </div>

        <div className="relative z-10 max-w-lg px-12 text-center">
          {/* Seal with glow */}
          <div className="mx-auto mb-8 relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-white/20 blur-xl" />
            <div className="relative h-32 w-32 rounded-full bg-white/10 p-4 backdrop-blur-sm border border-white/20">
              <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain p-2" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight">
            Barangay IX
            <span className="block text-emerald-300">Daan Banwa</span>
          </h1>
          <p className="mt-3 text-lg text-blue-200">
            City of Victorias, Negros Occidental
          </p>

          {/* Rotating features */}
          <div className="mt-10 h-28">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/10 transition-all duration-500">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20">
                  {(() => {
                    const Icon = features[activeFeature].icon;
                    return <Icon className="h-6 w-6 text-emerald-300" />;
                  })()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{features[activeFeature].title}</p>
                  <p className="text-xs text-blue-200">{features[activeFeature].desc}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-center gap-2">
              {features.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeFeature ? "w-8 bg-emerald-400" : "w-2 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="mt-8 text-sm text-blue-300/60">
            Powered by modern digital governance
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className={`w-full max-w-md transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-1 text-gray-500">Sign in to the Barangay Management System</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@barangay.gov"
                    className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                    {...register("email")}
                  />
                </div>
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
                    className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 pr-12 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                className="h-12 w-full rounded-xl bg-blue-900 text-base font-medium hover:bg-blue-800 transition-all hover:shadow-lg hover:shadow-blue-900/20 active:scale-[0.98]"
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
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/register"
                className="group inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                New resident? Register here
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            Barangay Management System v1.0 &middot; &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
