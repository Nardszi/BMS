"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { toast } from "@/components/ui/toast";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [logoutOpen, setLogoutOpen] = useState(false);
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
        "relative flex items-center border-b border-white/10 px-3.5 py-3.5 transition-all flex-shrink-0",
        collapsed ? "justify-center" : "gap-2.5"
      )}>
        <div className="relative h-8 w-8 flex-shrink-0 rounded-lg bg-white p-0.5 shadow-md">
          <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white tracking-wide truncate">Barangay IX</p>
            <p className="text-[10px] text-slate-400 truncate">Daan Banwa, Victorias City</p>
          </div>
        )}
        {/* Active indicator dot */}
        <div className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2.5 py-2.5 scrollbar-thin">
        {groupOrder.map((group) => {
          const items = groupedItems[group];
          if (!items) return null;

          return (
            <div key={group} className="mb-2">
              {!collapsed && (
                <p className="mb-1 px-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  {group}
                </p>
              )}
              {collapsed && <div className="mx-auto mb-1.5 h-px w-5 bg-slate-700" />}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <div key={item.href} className="relative">
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
                          isActive
                            ? "bg-white/10 text-white shadow-md shadow-black/10"
                            : "text-slate-400 hover:bg-white/5 hover:text-white",
                          collapsed && "justify-center px-2"
                        )}
                        onMouseEnter={() => setHoveredItem(item.href)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-blue-400 shadow-md shadow-blue-400/50" />
                        )}

                        <item.icon className={cn(
                          "h-4 w-4 flex-shrink-0 transition-all duration-200",
                          isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300",
                          !collapsed && isActive && "scale-105"
                        )} />

                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && item.badge > 0 && (
                              <span className="flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-md shadow-red-500/30">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}

                        {/* Tooltip for collapsed state */}
                        {collapsed && hoveredItem === item.href && (
                          <div className="absolute left-full ml-2.5 z-50 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-xl whitespace-nowrap">
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
        "border-t border-white/10 transition-all flex-shrink-0",
        collapsed ? "p-2" : "p-3"
      )}>
        <div className={cn(
          "flex items-center rounded-lg bg-white/5 p-2 transition-all",
          collapsed ? "justify-center" : "gap-2.5"
        )}>
          <div className="relative flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-md shadow-blue-500/30">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-800 bg-emerald-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{session?.user?.name}</p>
              <span className={cn(
                "mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                roleColors[userRole] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
              )}>
                {userRole}
              </span>
            </div>
          )}
        </div>

        <div className="mt-1.5 space-y-0.5">
          <Link
            href="/profile"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
              "text-slate-400 hover:bg-white/5 hover:text-white",
              collapsed && "justify-center px-2"
            )}
          >
            <User className="h-3.5 w-3.5" />
            {!collapsed && <span>Profile</span>}
          </Link>

          <button
            onClick={() => setLogoutOpen(true)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
              "text-slate-400 hover:bg-red-500/10 hover:text-red-400",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>Are you sure you want to sign out of your account?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                toast({ title: "Signed out", description: "You have been logged out successfully.", variant: "success" });
                signOut({ callbackUrl: "/login" });
              }}
            >
              Yes, Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        "hidden flex-shrink-0 transition-all duration-300 ease-out md:block h-screen sticky top-0",
        collapsed ? "w-[68px]" : "w-64"
      )}>
        <div className="relative h-full">
          {sidebarContent}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-md transition-all duration-200 hover:text-slate-600 hover:shadow-lg"
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
        </div>
      </aside>
    </>
  );
}
