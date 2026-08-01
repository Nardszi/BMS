"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SHORTCUTS: Record<string, { path: string; description: string }> = {
  "/": { path: "/", description: "Go to Dashboard" },
  "/residents": { path: "/residents", description: "Go to Residents" },
  "/certificates": { path: "/certificates", description: "Go to Certificates" },
  "/blotter": { path: "/blotter", description: "Go to Blotter Reports" },
  "/permits": { path: "/permits", description: "Go to Business Permits" },
  "/announcements": { path: "/announcements", description: "Go to Announcements" },
  "/barangay-ids": { path: "/barangay-ids", description: "Go to Barangay IDs" },
  "/officials": { path: "/officials", description: "Go to Officials" },
  "/reports": { path: "/reports", description: "Go to Reports" },
  "/users": { path: "/users", description: "Go to User Management" },
  "/audit": { path: "/audit", description: "Go to Audit Trail" },
  "/map": { path: "/map", description: "Go to GIS Map" },
  "/profile": { path: "/profile", description: "Go to Profile" },
};

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in inputs, textareas, or contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Ctrl/Cmd + K opens command palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const event = new CustomEvent("open-command-palette");
        window.dispatchEvent(event);
        return;
      }

      // Ctrl/Cmd + Alt + <key> for quick navigation
      if ((e.ctrlKey || e.metaKey) && e.altKey) {
        const key = e.key.toLowerCase();
        const mapping: Record<string, string> = {
          d: "/",
          r: "/residents",
          c: "/certificates",
          b: "/blotter",
          p: "/permits",
          a: "/announcements",
        };
        if (mapping[key]) {
          e.preventDefault();
          router.push(mapping[key]);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
}

export { SHORTCUTS };
