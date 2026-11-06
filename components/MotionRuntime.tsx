"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";
import { useMotionPreference } from "@/components/MotionPreference";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function SmoothScroll() {
  const { enabled, reducedMotion } = useMotionPreference();

  useEffect(() => {
    if (reducedMotion || !enabled) return;

    const lenis = new Lenis({
      autoRaf: false,
      anchors: true,
      smoothWheel: true,
      syncTouch: false,
      lerp: .2,
      wheelMultiplier: 1,
    });
    const update = (time: number) => lenis.raf(time * 1000);
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.off("scroll", onScroll);
      lenis.destroy();
    };
  }, [enabled, reducedMotion]);

  return null;
}

export function ScrollReveals() {
  const { enabled, reducedMotion } = useMotionPreference();

  useGSAP(
    () => {
      if (!enabled || reducedMotion) return;
      const page = document.querySelector("main");
      if (!page) return;
      const intro = gsap.timeline({ defaults: { ease: "power3.out" }, id: "portfolio-intro" });
      const heroIndex = page.querySelector(".hero-index");
      const titleLines = page.querySelectorAll(".hero-title-line");
      const heroCopy = page.querySelectorAll(".hero-intro, .hero-actions");
      const system = page.querySelector(".hero-sculpture");
      // Keep the one-time entrance restrained and on separate transform
      // channels; ParticlePortrait owns scroll-linked y and opacity afterward.
      if (heroIndex) intro.fromTo(heroIndex, { scale: .97 }, { scale: 1, duration: 0.55, clearProps: "transform" }, 0);
      if (titleLines.length) intro.fromTo(titleLines, { y: 8 }, { y: 0, duration: 0.72, stagger: 0.1, clearProps: "transform" }, 0.06);
      if (heroCopy.length) intro.fromTo(heroCopy, { scale: .985 }, { scale: 1, duration: 0.55, stagger: 0.1, clearProps: "transform" }, 0.34);
      if (system) intro.fromTo(system, { scale: .96, autoAlpha: .65 }, { scale: 1, autoAlpha: 1, duration: .9, ease: "power2.out", clearProps: "transform,opacity,visibility" }, .1);
      gsap.utils.toArray<HTMLElement>("[data-reveal]", page).forEach((element) => {
        gsap.fromTo(
          element,
          { y: 24, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.75,
            ease: "power2.out",
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          },
        );
      });
    },
    { dependencies: [enabled, reducedMotion], revertOnUpdate: true },
  );

  return null;
}
