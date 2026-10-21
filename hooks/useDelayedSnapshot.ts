"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns `value` unchanged when `live` is true. Otherwise returns a snapshot
 * that is refreshed once shortly after mount and then every `intervalMs`.
 * Used to deliver delayed figures to the free tier.
 */
export function useDelayedSnapshot<T>(value: T, live: boolean, intervalMs = 60_000): T {
  const latest = useRef(value);
  const [snapshot, setSnapshot] = useState(value);

  useEffect(() => {
    latest.current = value;
  }, [value]);

  useEffect(() => {
    if (live) return;
    const first = setTimeout(() => setSnapshot(latest.current), 2_500);
    const interval = setInterval(() => setSnapshot(latest.current), intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [live, intervalMs]);

  return live ? value : snapshot;
}
