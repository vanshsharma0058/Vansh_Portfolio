"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

const ParticlePortrait = dynamic(() => import("@/components/ParticlePortrait"), {
  ssr: false,
  loading: () => <div className="portrait-loading" aria-hidden="true" />,
});

const PORTRAIT_SRC = "/images/vansh-3d-portrait.png";
const MOBILE_BACKGROUND_THRESHOLD = 12;

function MobilePortrait() {
  const sourceRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const processPortrait = useCallback(() => {
    const image = sourceRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!image || !canvas || !context || !image.naturalWidth || !image.naturalHeight) return;

    const width = image.naturalWidth;
    const height = image.naturalHeight;
    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const frame = context.getImageData(0, 0, width, height);
    const pixels = frame.data;
    const visited = new Uint8Array(width * height);
    const queue = new Uint32Array(width * height);
    let head = 0;
    let tail = 0;

    const enqueueIfBackdrop = (index: number) => {
      if (visited[index]) return;
      const pixel = index * 4;
      const brightness = Math.max(pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]);
      if (brightness > MOBILE_BACKGROUND_THRESHOLD) return;
      visited[index] = 1;
      queue[tail++] = index;
    };

    for (let x = 0; x < width; x++) {
      enqueueIfBackdrop(x);
      enqueueIfBackdrop((height - 1) * width + x);
    }
    for (let y = 1; y < height - 1; y++) {
      enqueueIfBackdrop(y * width);
      enqueueIfBackdrop(y * width + width - 1);
    }

    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      if (x > 0) enqueueIfBackdrop(index - 1);
      if (x + 1 < width) enqueueIfBackdrop(index + 1);
      if (y > 0) enqueueIfBackdrop(index - width);
      if (y + 1 < height) enqueueIfBackdrop(index + width);
    }

    // The supplied photo has a black matte rather than transparent corners.
    // Make only the edge-connected near-black matte transparent, feathering
    // its edge while preserving enclosed dark hair, facial shadows, and clothes.
    for (let index = 0; index < visited.length; index++) {
      const pixel = index * 4;
      if (!visited[index]) {
        continue;
      }
      const brightness = Math.max(pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]);
      const matteAlpha = Math.max(0, Math.min(1, (brightness - 1) / (MOBILE_BACKGROUND_THRESHOLD - 1)));
      pixels[pixel + 3] = Math.round(pixels[pixel + 3] * matteAlpha);
    }

    context.putImageData(frame, 0, 0);
    setReady(true);
  }, []);

  useEffect(() => {
    if (sourceRef.current?.complete) processPortrait();
  }, [processPortrait]);

  return (
    <div className="mobile-portrait-frame">
      <img
        ref={sourceRef}
        className="mobile-portrait-source"
        src={PORTRAIT_SRC}
        alt=""
        draggable={false}
        decoding="async"
        fetchPriority="high"
        onLoad={processPortrait}
      />
      <canvas
        ref={canvasRef}
        className={`mobile-hero-portrait${ready ? " is-ready" : ""}`}
        aria-hidden="true"
      />
    </div>
  );
}

export function HeroSculpture() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const breakpoint = window.matchMedia("(max-width: 700px)");
    const update = () => setIsMobile(breakpoint.matches);
    update();
    breakpoint.addEventListener("change", update);
    return () => breakpoint.removeEventListener("change", update);
  }, []);

  return (
    <div className="hero-sculpture" aria-hidden="true">
      {isMobile === null ? (
        <div className="portrait-loading" />
      ) : isMobile ? (
        <MobilePortrait />
      ) : (
        <ParticlePortrait />
      )}
    </div>
  );
}
