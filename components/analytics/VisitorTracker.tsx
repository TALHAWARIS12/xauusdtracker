"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Avoid double logging on initial mount or same path
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    // Do not log static asset requests or api routes
    if (!pathname || pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return;
    }

    try {
      const payload = JSON.stringify({
        path: pathname,
        referrer: typeof document !== "undefined" ? document.referrer : null,
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/visit", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/analytics/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => null);
      }
    } catch {}
  }, [pathname]);

  return null;
}
