"use client";

import { ReactNode } from "react";

interface ResponsiveTableProps {
  children: ReactNode;
  mobileCards: ReactNode;
}

export function ResponsiveTable({ children, mobileCards }: ResponsiveTableProps) {
  return (
    <>
      <div className="hidden md:block">{children}</div>
      <div className="md:hidden">{mobileCards}</div>
    </>
  );
}

interface CardRowProps {
  label: string;
  value: ReactNode;
  badge?: ReactNode;
}

export function CardRow({ label, value, badge }: CardRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground flex items-center gap-2">
        {value}
        {badge}
      </span>
    </div>
  );
}
