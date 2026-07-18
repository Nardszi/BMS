"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error";
  onClose: () => void;
}

function Toast({ title, description, variant = "default", onClose }: ToastProps) {
  const variants: Record<string, string> = {
    default: "bg-gray-900 text-white",
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
  };

  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={cn(
      "rounded-lg p-4 shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300",
      variants[variant]
    )}>
      {title && <div className="font-semibold">{title}</div>}
      {description && <div className="mt-1 text-sm opacity-90">{description}</div>}
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
      setToasts((prev) => [...prev, { ...toast, onClose: () => setToasts((p) => p.filter((t) => t.id !== toast.id)) }]);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 max-h-screen overflow-hidden pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} />
        </div>
      ))}
    </div>
  );
}
