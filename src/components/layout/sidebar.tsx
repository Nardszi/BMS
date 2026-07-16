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
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const allNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "SECRETARY", "TREASURER", "KAGAWAD", "STAFF"] },
  { href: "/residents", label: "Residents", icon: Users, roles: ["ADMIN", "SECRETARY", "TREASURER", "STAFF"] },
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
  const userRole = (session?.user as any)?.role;

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-sidebar-border p-6">
        <div className="relative h-10 w-10 flex-shrink-0">
          <Image src="/barangay-seal.png" alt="Barangay Seal" fill className="object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight text-sidebar-foreground">Barangay IX</p>
          <p className="text-xs text-sidebar-foreground/70">Daan Banwa</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-3">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{session?.user?.name}</p>
          <p className="text-xs text-sidebar-foreground/70">{userRole}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-md bg-primary p-2 text-primary-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transition-transform md:translate-x-0 md:static md:z-auto",
          "bg-blue-900",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 rounded-md p-1 text-white/70 hover:text-white md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
