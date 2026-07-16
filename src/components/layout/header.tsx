"use client";

import { useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Barangay IX - Daan Banwa</h1>
        <p className="text-xs text-gray-500">City of Victorias, Negros Occidental</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-700">{session?.user?.name}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
    </header>
  );
}
