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
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const allNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "SECRETARY", "TREASURER", "KAGAWAD", "STAFF"] },
  { href: "/residents", label: "Residents", icon: Users, roles: ["ADMIN", "SECRETARY", "TREASURER", "STAFF"] },
  { href: "/barangay-ids", label: "Barangay IDs", icon: CreditCard, roles: ["ADMIN", "SECRETARY"] },
  { href: "/certificates", label: "Certificates", icon: FileText, roles: ["ADMIN", "SECRETARY", "STAFF"] },
  { href: "/blotter", label: "Blotter", icon: AlertTriangle, roles: ["ADMIN", "SECRETARY", "KAGAWAD"] },
  { href: "/permits", label: "Business Permits", icon: Building2, roles: ["ADMIN", "TREASURER"] },
  { href: "/officials", label: "Officials", icon: Shield, roles: ["ADMIN"] },
  { href: "/announcements", label: "Announcements", icon: Megaphone, roles: ["ADMIN", "SECRETARY"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const userRole = (session?.user as any)?.role;

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className={cn("flex items-center border-b border-gray-100 px-4 py-5", collapsed ? "justify-center" : "gap-3")}>
        <div className="relative h-10 w-10 flex-shrink-0">
          <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">Barangay IX</p>
            <p className="text-xs text-gray-500">Daan Banwa</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className={cn("border-t border-gray-100 p-4", collapsed && "px-2")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {session?.user?.name?.charAt(0) || "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{session?.user?.name}</p>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600",
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
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 text-gray-600 shadow-md md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 z-10 rounded-lg p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn("hidden flex-shrink-0 transition-all md:block", collapsed ? "w-[72px]" : "w-64")}>
        <div className="relative h-full">
          {sidebarContent}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-7 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-white text-gray-400 shadow-md transition-transform hover:text-gray-600"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </aside>
    </>
  );
}
