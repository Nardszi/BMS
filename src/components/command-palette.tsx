"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, LayoutDashboard, Users, FileText, AlertTriangle, Building2, Megaphone, CreditCard, Shield, BarChart3, History, MapPin, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  hint?: string;
}

const COMMANDS: CommandItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, hint: "Ctrl+Alt+D" },
  { label: "Residents", path: "/residents", icon: Users, hint: "Ctrl+Alt+R" },
  { label: "Certificates", path: "/certificates", icon: FileText, hint: "Ctrl+Alt+C" },
  { label: "Blotter Reports", path: "/blotter", icon: AlertTriangle, hint: "Ctrl+Alt+B" },
  { label: "Business Permits", path: "/permits", icon: Building2, hint: "Ctrl+Alt+P" },
  { label: "Announcements", path: "/announcements", icon: Megaphone, hint: "Ctrl+Alt+A" },
  { label: "Barangay IDs", path: "/barangay-ids", icon: CreditCard },
  { label: "Officials", path: "/officials", icon: Shield },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Audit Trail", path: "/audit", icon: History },
  { label: "GIS Map", path: "/map", icon: MapPin },
  { label: "Profile", path: "/profile", icon: User },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-command-palette", handler);
    return () => window.removeEventListener("open-command-palette", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[activeIndex];
        if (item) {
          navigate(item.path);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, query, activeIndex]);

  const filtered = COMMANDS.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.path.toLowerCase().includes(query.toLowerCase())
  );

  function navigate(path: string) {
    setOpen(false);
    if (path === pathname) return;
    router.push(path);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[20vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border bg-white shadow-2xl dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search pages or type a command..."
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="shrink-0 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results found</p>
          ) : (
            filtered.map((item, index) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  index === activeIndex
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0 opacity-70" />
                <span className="flex-1">{item.label}</span>
                {item.hint && (
                  <span className={cn(
                    "text-[10px]",
                    index === activeIndex ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {item.hint}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
