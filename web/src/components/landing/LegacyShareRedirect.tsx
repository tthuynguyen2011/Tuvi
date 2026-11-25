"use client";

import { useEffect } from "react";

/**
 * The Tử Vi app used to live at "/", so shared chart links look like "/?d=1&m=1&y=1995…".
 * The site is a static export (no server redirects), so forward those links client-side.
 */
export default function LegacyShareRedirect({ to }: { to: string }) {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.has("y") && p.has("m") && p.has("d")) window.location.replace(`${to}${window.location.search}`);
  }, [to]);
  return null;
}
