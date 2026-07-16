"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold text-gray-900">Barangay Management System</h1>
          <p className="text-xs text-gray-500">Barangay IX - Daan Banwa, City of Victorias</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

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
