"use client";

import { useMotionPreference } from "@/components/MotionPreference";

export function MotionControl() {
  const { enabled, reducedMotion, toggle } = useMotionPreference();
  const active = enabled && !reducedMotion;
  return <button className="motion-control" type="button" onClick={toggle} aria-pressed={active} aria-label={reducedMotion ? "Motion is disabled by the reduced motion system setting" : `Turn motion ${enabled ? "off" : "on"}`} disabled={reducedMotion}>
    <span className={`motion-indicator ${active ? "is-on" : ""}`} aria-hidden="true" />
    <span>MOTION</span><strong>{reducedMotion ? "REDUCED" : enabled ? "ON" : "OFF"}</strong>
  </button>;
}
