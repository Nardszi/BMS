"use client";

import { useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";
import { toast } from "@/components/ui/toast";

const TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
const WARNING_MS = 19 * 60 * 1000; // warn at 19 minutes (1 min before logout)
const CHECK_INTERVAL = 30 * 1000; // check every 30 seconds

export function useSessionTimeout() {
  const lastActivity = useRef(Date.now());
  const warned = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    lastActivity.current = Date.now();
    warned.current = false;
  }, []);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;

      if (elapsed >= TIMEOUT_MS) {
        toast({
          title: "Logged out",
          description: "You were logged out due to inactivity.",
          variant: "error",
        });
        signOut({ callbackUrl: "/login?timeout=1" });
      } else if (elapsed >= WARNING_MS && !warned.current) {
        warned.current = true;
        toast({
          title: "Session expiring",
          description: "You will be logged out in 1 minute due to inactivity.",
          variant: "error",

        });
      }
    }, CHECK_INTERVAL);

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);
}
