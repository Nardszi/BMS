"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Trash2, CheckCircle2, XCircle, Info } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  variant?: "danger" | "warning" | "info" | "success";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  loading?: boolean;
}

const icons = {
  danger: Trash2,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const colors = {
  danger: "bg-red-600 hover:bg-red-700",
  warning: "bg-amber-600 hover:bg-amber-700",
  info: "bg-blue-900 hover:bg-blue-800",
  success: "bg-emerald-600 hover:bg-emerald-700",
};

export function ConfirmDialog({
  open, onOpenChange, title, description, variant = "danger",
  confirmText = "Confirm", cancelText = "Cancel", onConfirm, loading,
}: ConfirmDialogProps) {
  const Icon = icons[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${variant === "danger" ? "text-red-500" : variant === "warning" ? "text-amber-500" : variant === "success" ? "text-emerald-500" : "text-blue-500"}`} />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">{description}</p>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button size="sm" className={colors[variant]} onClick={onConfirm} disabled={loading}>
            {loading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
