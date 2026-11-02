"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

export function ScrollProgress() {
  const progressRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const progress = progressRef.current;
    if (!progress) return;

    const setProgress = gsap.quickSetter(progress, "scaleX");
    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 0,
      end: "max",
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        setProgress(self.progress);
        progress.setAttribute("aria-valuenow", String(Math.round(self.progress * 100)));
      },
    });
    setProgress(trigger.progress);
    progress.setAttribute("aria-valuenow", String(Math.round(trigger.progress * 100)));
    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      trigger.kill();
    };
  }, { scope: progressRef });

  return <div className="scroll-progress" role="progressbar" aria-label="Page scroll progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} ref={progressRef} />;
}
