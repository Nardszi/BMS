"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Building2,
  Megaphone,
  BarChart3,
  Shield,
  CreditCard,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bell,
  Settings,
  History,
  User,
  MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
  badge?: number;
  group: string;
}

const allNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "SECRETARY", "TREASURER", "KAGAWAD", "STAFF"], group: "Overview" },
  { href: "/map", label: "GIS Heatmaps", icon: MapPin, roles: ["ADMIN", "SECRETARY", "TREASURER", "KAGAWAD", "STAFF"], group: "Overview" },
  { href: "/residents", label: "Residents", icon: Users, roles: ["ADMIN", "SECRETARY", "TREASURER", "KAGAWAD", "STAFF"], group: "Records" },
  { href: "/barangay-ids", label: "Barangay IDs", icon: CreditCard, roles: ["ADMIN", "SECRETARY"], group: "Records" },
  { href: "/certificates", label: "Certificates", icon: FileText, roles: ["ADMIN", "SECRETARY", "STAFF"], group: "Services" },
  { href: "/blotter", label: "Blotter Reports", icon: AlertTriangle, roles: ["ADMIN", "SECRETARY", "KAGAWAD"], group: "Services" },
  { href: "/permits", label: "Business Permits", icon: Building2, roles: ["ADMIN", "TREASURER"], group: "Services" },
  { href: "/officials", label: "Officials", icon: Shield, roles: ["ADMIN"], group: "Administration" },
  { href: "/users", label: "User Management", icon: Users, roles: ["ADMIN"], group: "Administration" },
  { href: "/announcements", label: "Announcements", icon: Megaphone, roles: ["ADMIN", "SECRETARY"], group: "Administration" },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN"], group: "Administration" },
  { href: "/audit", label: "Audit Trail", icon: History, roles: ["ADMIN", "SECRETARY"], group: "Administration" },
];

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  SECRETARY: "bg-blue-100 text-blue-700",
  TREASURER: "bg-emerald-100 text-emerald-700",
  KAGAWAD: "bg-amber-100 text-amber-700",
  STAFF: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const userRole = session?.user?.role ?? "";

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const groupOrder = ["Overview", "Records", "Services", "Administration"];

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className={cn(
        "relative flex items-center border-b border-white/10 px-4 py-5 transition-all",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <div className="relative h-10 w-10 flex-shrink-0 rounded-xl bg-white p-1 shadow-lg">
          <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-wide">Barangay IX</p>
            <p className="text-xs text-slate-400">Daan Banwa, Victorias City</p>
          </div>
        )}
        {/* Active indicator dot */}
        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {groupOrder.map((group) => {
          const items = groupedItems[group];
          if (!items) return null;

          return (
            <div key={group} className="mb-4">
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {group}
                </p>
              )}
              {collapsed && <div className="mx-auto mb-2 h-px w-6 bg-slate-700" />}
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <div key={item.href} className="relative">
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-white/10 text-white shadow-lg shadow-black/10"
                            : "text-slate-400 hover:bg-white/5 hover:text-white",
                          collapsed && "justify-center px-2"
                        )}
                        onMouseEnter={() => setHoveredItem(item.href)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-400 shadow-lg shadow-blue-400/50" />
                        )}

                        <item.icon className={cn(
                          "h-5 w-5 flex-shrink-0 transition-all duration-200",
                          isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300",
                          !collapsed && isActive && "scale-110"
                        )} />

                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {item.badge && item.badge > 0 && (
                              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-red-500/30">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}

                        {/* Tooltip for collapsed state */}
                        {collapsed && hoveredItem === item.href && (
                          <div className="absolute left-full ml-3 z-50 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl whitespace-nowrap">
                            {item.label}
                            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className={cn(
        "border-t border-white/10 transition-all",
        collapsed ? "p-3" : "p-4"
      )}>
        <div className={cn(
          "flex items-center rounded-xl bg-white/5 p-3 transition-all",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="relative flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-800 bg-emerald-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{session?.user?.name}</p>
              <span className={cn(
                "mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                roleColors[userRole] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
              )}>
                {userRole}
              </span>
            </div>
          )}
        </div>

        <Link
          href="/profile"
          className={cn(
            "mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            "text-slate-400 hover:bg-white/5 hover:text-white",
            collapsed && "justify-center px-2"
          )}
        >
          <User className="h-4 w-4" />
          {!collapsed && <span>Profile</span>}
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            "text-slate-400 hover:bg-red-500/10 hover:text-red-400",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-white dark:bg-gray-900 p-2.5 text-gray-600 dark:text-gray-300 shadow-lg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-white/60 hover:text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden flex-shrink-0 transition-all duration-300 ease-out md:block",
        collapsed ? "w-[76px]" : "w-72"
      )}>
        <div className="relative h-full">
          {sidebarContent}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-7 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-md transition-all duration-200 hover:text-slate-600 hover:shadow-lg"
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
        </div>
      </aside>
    </>
  );
}
