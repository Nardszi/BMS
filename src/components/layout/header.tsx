"use client";

import { useSession } from "next-auth/react";
import { Bell, Check, Trash2, FileText, AlertTriangle, Building2, Users, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { BARANGAY_FULL_NAME, BARANGAY_CITY } from "@/lib/constants";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, typeof Bell> = {
  certificate: FileText,
  blotter: AlertTriangle,
  permit: Building2,
  resident: Users,
  announcement: Megaphone,
  general: Bell,
};

const typeColors: Record<string, string> = {
  certificate: "bg-blue-100 text-blue-600",
  blotter: "bg-red-100 text-red-600",
  permit: "bg-emerald-100 text-emerald-600",
  resident: "bg-purple-100 text-purple-600",
  announcement: "bg-amber-100 text-amber-600",
  general: "bg-gray-100 text-gray-600",
};

export function Header() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read-all" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function deleteNotification(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const n = notifications.find((x) => x.id === id);
      return n && !n.read ? Math.max(0, prev - 1) : prev;
    });
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold text-gray-900">Barangay Management System</h1>
          <p className="text-xs text-gray-500">{BARANGAY_FULL_NAME}, {BARANGAY_CITY}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={() => setOpen(!open)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    <Bell className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = typeIcons[n.type] || Bell;
                    const colorClass = typeColors[n.type] || typeColors.general;
                    return (
                      <div
                        key={n.id}
                        className={`flex gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50 ${
                          !n.read ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!n.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                              {n.title}
                            </p>
                            <span className="shrink-0 text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.message}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            {!n.read && (
                              <button
                                onClick={() => markAsRead(n.id)}
                                className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800"
                              >
                                <Check className="h-3 w-3" /> Mark read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(n.id)}
                              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
            <Badge variant="outline" className="text-[10px]">
              {role}
            </Badge>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {session?.user?.name?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
