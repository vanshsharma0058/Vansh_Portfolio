"use client";

import dynamic from "next/dynamic";

const ParticlePortrait = dynamic(() => import("@/components/ParticlePortrait"), {
  ssr: false,
  loading: () => <div className="portrait-loading" aria-hidden="true" />,
});

export function HeroSculpture() {
  return <div className="hero-sculpture" aria-hidden="true"><ParticlePortrait /></div>;
}
