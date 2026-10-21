"use client";

import { useEffect, useState } from "react";
import { formatUtcTimestamp } from "@/lib/market/format";

interface LiveUtcClockProps {
  className?: string;
  id?: string;
}

/**
 * Renders a `YYYY-MM-DD HH:mm:ss UTC` timestamp that ticks every second.
 * The first render (SSR + hydration) shows a stable placeholder so no mismatch occurs.
 */
export function LiveUtcClock({ className, id }: LiveUtcClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    // Align updates to the start of each wall-clock second for a crisp tick.
    let interval: ReturnType<typeof setInterval> | undefined;
    const align = setTimeout(() => {
      tick();
      interval = setInterval(tick, 1000);
    }, 1000 - (Date.now() % 1000));
    return () => {
      clearTimeout(align);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <time
      id={id}
      dateTime={now ? now.toISOString() : undefined}
      className={`tabular ${className ?? ""}`}
      suppressHydrationWarning
    >
      {now ? formatUtcTimestamp(now) : "----------  --:--:-- UTC"}
    </time>
  );
}
