"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useMotionPreference } from "@/components/MotionPreference";

const MechanicalSphere = dynamic(() => import("@/components/MechanicalSphere"), { ssr: false });

export function HeroSculpture() {
  const [hasEntered, setHasEntered] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const { enabled, reducedMotion } = useMotionPreference();

  useEffect(() => {
    const host = document.querySelector<HTMLElement>(".hero-sculpture");
    if (!host) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setHasEntered(true); observer.disconnect(); }
    }, { rootMargin: "360px", threshold: .01 });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const onReady = useCallback(() => setSceneReady(true), []);
  const onUnavailable = useCallback(() => setSceneReady(false), []);

  return <div className={`hero-sculpture ${sceneReady ? "has-webgl" : ""}`} aria-hidden="true">
    <div className="sphere-fallback">
      <svg viewBox="0 0 720 520" focusable="false">
        <defs>
          <radialGradient id="sphere-fallback-shell" cx="68%" cy="72%" r="75%"><stop stopColor="#60331f" /><stop offset=".34" stopColor="#252321" /><stop offset=".82" stopColor="#0d0d0c" /><stop offset="1" stopColor="#050505" /></radialGradient>
          <radialGradient id="sphere-fallback-core"><stop stopColor="#f6813b" stopOpacity=".9" /><stop offset="1" stopColor="#a3421c" stopOpacity="0" /></radialGradient>
          <clipPath id="sphere-fallback-clip"><circle cx="360" cy="250" r="145" /></clipPath>
        </defs>
        <ellipse className="fallback-halo" cx="360" cy="260" rx="215" ry="170" />
        <circle cx="360" cy="250" r="145" fill="url(#sphere-fallback-shell)" />
        <g clipPath="url(#sphere-fallback-clip)" fill="none">
          <ellipse cx="360" cy="250" rx="55" ry="145" /><ellipse cx="360" cy="250" rx="112" ry="145" />
          <path d="M215 250h290M235 180c78 54 172 54 250 0M235 320c78-54 172-54 250 0" />
        </g>
        <circle className="fallback-core" cx="360" cy="250" r="52" fill="url(#sphere-fallback-core)" />
        <ellipse className="fallback-orbit" cx="360" cy="250" rx="255" ry="89" />
        <ellipse className="fallback-orbit fallback-orbit-two" cx="360" cy="250" rx="230" ry="120" />
      </svg>
    </div>
    {hasEntered && <MechanicalSphere motionEnabled={enabled && !reducedMotion} onReady={onReady} onUnavailable={onUnavailable} />}
  </div>;
}
