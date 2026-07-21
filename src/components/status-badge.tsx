const STATUS_CONFIG: Record<string, { className: string }> = {
  ACTIVE: { className: "bg-emerald-100 text-emerald-800" },
  APPROVED: { className: "bg-emerald-100 text-emerald-800" },
  RESOLVED: { className: "bg-emerald-100 text-emerald-800" },
  RELEASED: { className: "bg-emerald-100 text-emerald-800" },
  PENDING: { className: "bg-amber-100 text-amber-800" },
  OPEN: { className: "bg-amber-100 text-amber-800" },
  EXPIRED: { className: "bg-red-100 text-red-800" },
  DENIED: { className: "bg-red-100 text-red-800" },
  REJECTED: { className: "bg-red-100 text-red-800" },
  REVOKED: { className: "bg-red-100 text-red-800" },
  ESCALATED: { className: "bg-orange-100 text-orange-800" },
  LOST: { className: "bg-muted text-foreground/80" },
  UPCOMING: { className: "bg-blue-100 text-blue-800" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { className: "bg-muted text-foreground/80" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className} ${className}`}>
      {status}
    </span>
  );
}
