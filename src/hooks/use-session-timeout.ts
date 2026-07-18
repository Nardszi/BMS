"use client";

import { useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL = 60 * 1000; // check every minute

export function useSessionTimeout() {
  const lastActivity = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;
      if (elapsed >= TIMEOUT_MS) {
        signOut({ callbackUrl: "/login?timeout=1" });
      }
    }, CHECK_INTERVAL);

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);
}
