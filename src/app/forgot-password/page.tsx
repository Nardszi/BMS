"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      toast({ title: "If an account exists with that email, a reset link has been sent.", variant: "success" });
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {sent ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h1 className="text-xl font-bold text-gray-900">Check your email</h1>
              <p className="text-sm text-gray-600">
                If an account exists with <strong>{email}</strong>, we&apos;ve sent a password reset link.
              </p>
              <Link href="/login">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 text-center">
                <Mail className="mx-auto h-10 w-10 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Forgot Password?</h1>
                <p className="text-sm text-gray-600">Enter your email and we&apos;ll send you a reset link.</p>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@barangay.gov.ph"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Link href="/login" className="block text-center text-sm text-blue-600 hover:underline">
                <ArrowLeft className="mr-1 inline h-3 w-3" /> Back to Login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
