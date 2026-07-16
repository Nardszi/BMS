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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-700 p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-white/5" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header with seal */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 relative h-24 w-24 rounded-full bg-white/10 p-3 backdrop-blur-sm">
            <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain p-1" />
          </div>
          <h1 className="text-2xl font-bold text-white">Barangay IX - Daan Banwa</h1>
          <p className="mt-1 text-sm text-blue-200">City of Victorias, Negros Occidental</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900">Barangay Management System</h2>
              <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
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
                  className="h-11"
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
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-11"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="h-11 w-full bg-blue-900 text-white hover:bg-blue-800"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 border-t pt-4">
              <p className="text-center text-xs text-gray-500">
                For demo, use: <span className="font-medium">admin@barangay.gov</span> / <span className="font-medium">admin123</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-blue-200/70">
          Barangay Management System v1.0
        </p>
      </div>
    </div>
  );
}
