import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ACCENT_COLORS: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-amber-600",
  red: "from-red-500 to-red-600",
  purple: "from-purple-500 to-purple-600",
  cyan: "from-cyan-500 to-cyan-600",
  indigo: "from-indigo-500 to-indigo-600",
};

const ICON_BG_COLORS: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
  cyan: "bg-cyan-100 text-cyan-600",
  indigo: "bg-indigo-100 text-indigo-600",
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`h-1 bg-gradient-to-r ${ACCENT_COLORS[color] || ACCENT_COLORS.blue}`} />
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${ICON_BG_COLORS[color] || ICON_BG_COLORS.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{title}</div>
          {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
