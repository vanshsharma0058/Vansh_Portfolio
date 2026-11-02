"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type MotionPreferenceValue = { enabled: boolean; reducedMotion: boolean; toggle: () => void };
const MotionPreferenceContext = createContext<MotionPreferenceValue>({ enabled: false, reducedMotion: false, toggle: () => undefined });

export function MotionPreferenceProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [userChoice, setUserChoice] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(preference.matches);
    const saved = window.localStorage.getItem("vansh-motion");
    if (saved) {
      setEnabled(saved === "on");
      setUserChoice(true);
    } else setEnabled(!preference.matches);
    setInitialized(true);
    const onPreferenceChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
      if (!window.localStorage.getItem("vansh-motion")) setEnabled(!event.matches);
    };
    preference.addEventListener("change", onPreferenceChange);
    return () => preference.removeEventListener("change", onPreferenceChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = initialized && enabled ? "on" : "off";
    if (initialized && userChoice) window.localStorage.setItem("vansh-motion", enabled ? "on" : "off");
  }, [enabled, initialized, userChoice]);

  const value = useMemo(() => ({
    enabled: initialized && enabled,
    reducedMotion,
    toggle: () => { setUserChoice(true); setEnabled((value) => !value); },
  }), [enabled, initialized, reducedMotion]);
  return <MotionPreferenceContext.Provider value={value}>{children}</MotionPreferenceContext.Provider>;
}

export function useMotionPreference() {
  return useContext(MotionPreferenceContext);
}
