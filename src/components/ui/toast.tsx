"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error";
  onClose: () => void;
}

function Toast({ title, description, variant = "default", onClose }: ToastProps) {
  const config: Record<string, { bg: string; icon: React.ReactNode }> = {
    default: { bg: "bg-gray-900 text-white", icon: <Info className="h-4 w-4" /> },
    success: { bg: "bg-emerald-600 text-white", icon: <CheckCircle2 className="h-4 w-4" /> },
    error: { bg: "bg-red-600 text-white", icon: <XCircle className="h-4 w-4" /> },
  };
  const { bg, icon } = config[variant];

  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 3600);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (exiting) {
      const timer = setTimeout(onClose, 300);
      return () => clearTimeout(timer);
    }
  }, [exiting, onClose]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg p-4 shadow-lg duration-300 pointer-events-auto",
        bg,
        exiting ? "animate-out fade-out slide-out-to-bottom-5" : "animate-in slide-in-from-bottom-5 fade-in"
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold text-sm">{title}</div>}
        {description && <div className="mt-0.5 text-sm opacity-90">{description}</div>}
      </div>
      <button
        onClick={() => setExiting(true)}
        className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

let listeners: Array<(toast: ToastProps) => void> = [];

export function toast(options: Omit<ToastProps, "id" | "onClose">) {
  const id = Math.random().toString(36).substr(2, 9);
  listeners.forEach((listener) => listener({ ...options, id, onClose: () => {} }));
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  React.useEffect(() => {
    const listener = (toast: ToastProps) => {
      setToasts((prev) => [...prev.slice(-4), { ...toast, onClose: () => setToasts((p) => p.filter((t) => t.id !== toast.id)) }]);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 max-h-screen overflow-hidden sm:max-w-sm w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} />
        </div>
      ))}
    </div>
  );
}
