"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Returns `false` during SSR and the hydration pass, `true` afterwards.
 * Used to defer rendering of live, time- or random-dependent market values
 * so server HTML and client HTML never mismatch.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
