"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useMotionPreference } from "@/components/MotionPreference";

gsap.registerPlugin(ScrollTrigger);

const PORTRAIT = "/images/vansh-3d-portrait.png";
const VERTEX_SHADER = /* glsl */ `
  attribute vec3 aTarget;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aSeed;
  attribute float aOpacity;
  uniform float uProgress;
  uniform float uDesktopMode;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vSeed;
  varying float vOpacity;
  void main() {
    // Hold the likeness together through the early scroll, then accelerate
    // breakup so facial detail survives until the middle of the transition.
    float t;
    float p;
    if (uDesktopMode > 0.5) {
      t = clamp((uProgress - 0.20) / 0.80, 0.0, 1.0);
      p = t * t * t;
    } else {
      float start = 0.14 + aSeed * 0.10;
      t = clamp((uProgress - start) / (1.0 - start), 0.0, 1.0);
      p = t * t * (2.0 - t);
    }
    vec3 pos = mix(position, aTarget, p);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uPixelRatio * (300.0 / -mv.z), 0.85, 2.25);
    vColor = aColor;
    vSeed = aSeed;
    vOpacity = aOpacity;
  }
`;
const FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vSeed;
  varying float vOpacity;
  void main() {
    float radius = length(gl_PointCoord - 0.5);
    float core = 1.0 - smoothstep(0.18, 0.49, radius);
    float grain = 0.97 + 0.03 * sin(vSeed * 31.0);
    if (core < 0.01) discard;
    gl_FragColor = vec4(vColor * grain, core * vOpacity * 0.92);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

type ParticleData = {
  positions: Float32Array;
  targets: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  seeds: Float32Array;
  opacities: Float32Array;
};
type ScrollApi = { setProgress: (value: number) => void };

function hash(value: number) {
  const x = Math.sin(value * 127.1 + 19.19) * 43758.5453;
  return x - Math.floor(x);
}

function toLinear(channel: number) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function samplePortrait(image: HTMLImageElement, maxPoints: number): ParticleData | null {
  // Use the PNG's native resolution to retain fine photographic information.
  const side = 1254;
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.clearRect(0, 0, side, side);
  context.drawImage(image, 0, 0, side, side);
  const pixels = context.getImageData(0, 0, side, side).data;

  // Uniform reservoir sampling includes all visible tones; brightness is never
  // used to decide whether a source pixel becomes a particle.
  const samples: number[] = [];
  let visited = 0;
  for (let y = 2; y < side - 2; y += 2) {
    for (let x = 2; x < side - 2; x += 2) {
      const index = (y * side + x) * 4;
      if (pixels[index + 3] === 0) continue;
      visited++;
      if (samples.length < maxPoints) samples.push(index);
      else {
        const slot = Math.floor(Math.random() * visited);
        if (slot < maxPoints) samples[slot] = index;
      }
    }
  }

  const count = samples.length;
  const positions = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const opacities = new Float32Array(count);

  for (let point = 0; point < count; point++) {
    const pixel = samples[point];
    const x = (pixel / 4) % side;
    const y = Math.floor(pixel / 4 / side);
    const sourceR = pixels[pixel] / 255;
    const sourceB = pixels[pixel + 2] / 255;
    const r = toLinear(pixels[pixel]);
    const g = toLinear(pixels[pixel + 1]);
    const b = toLinear(pixels[pixel + 2]);
    const luminance = .2126 * r + .7152 * g + .0722 * b;
    const sampleLuminance = (index: number) =>
      .2126 * toLinear(pixels[index]) +
      .7152 * toLinear(pixels[index + 1]) +
      .0722 * toLinear(pixels[index + 2]);
    const localMean = (
      sampleLuminance(pixel - 8) + sampleLuminance(pixel + 8) +
      sampleLuminance(pixel - side * 8) + sampleLuminance(pixel + side * 8)
    ) * .25;
    const localContrast = luminance - localMean;
    const key = point + 1;
    const jitterX = (hash(key * 13.3) - .5) * 1.7;
    const jitterY = (hash(key * 15.7) - .5) * 1.7;
    const px = ((x + jitterX) / (side - 1) - .5) * 6.45;
    const py = (.5 - (y + jitterY) / (side - 1)) * 6.45;
    const pz = (hash(key * 1.7) - .5) * .12;

    // Irregular angular spread and independent horizontal drift avoid mirrored
    // wings while retaining an outward, depth-rich cloud.
    const angle = Math.atan2(py, px) + (hash(key * 2.3) - .5) * 6.0;
    const radial = 1.15 + hash(key * 3.1) * 3.2;
    const driftX = (hash(key * 4.7) - .5) * 2.7;
    targets.set([
      px + Math.cos(angle) * radial + driftX,
      py + Math.sin(angle) * radial * .76 - .25 - hash(key * 5.3) * .8,
      pz + (hash(key * 6.1) - .38) * 3.4,
    ], point * 3);
    positions.set([px, py, pz], point * 3);

    // Preserve photographic dark-to-light range in linear space. Retain a
    // small amount of source RGB; warm source pixels in the hair get restrained
    // orange color instead of a synthetic outline on both sides.
    const tone = Math.min(.98, Math.max(.006, luminance * 1.65 - .012 + localContrast * 1.55));
    const sourceWarmth = Math.max(0, sourceR - sourceB * 1.2);
    const orange = y < side * .42 && sourceWarmth > .16 && hash(key * 7.9) > .62;
    const warmth = orange ? Math.min(.11, sourceWarmth * .24) : 0;
    colors.set([
      tone * .96 + r * .04 + warmth,
      tone * .96 + g * .04 - warmth * .38,
      tone * .96 + b * .04 - warmth * .62,
    ], point * 3);
    sizes[point] = .035 + tone * .014 + hash(key * 9.1) * .007;
    seeds[point] = hash(key * 11.7);
    // Preserve anti-aliased cutout edges without turning alpha into brightness.
    opacities[point] = pixels[pixel + 3] / 255;
  }

  return { positions, targets, colors, sizes, seeds, opacities };
}

function ParticlePoints({ data, onReady }: { data: ParticleData; onReady: (api: ScrollApi) => void }) {
  const invalidate = useThree((state) => state.invalidate);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    result.setAttribute("aTarget", new THREE.BufferAttribute(data.targets, 3));
    result.setAttribute("aColor", new THREE.BufferAttribute(data.colors, 3));
    result.setAttribute("aSize", new THREE.BufferAttribute(data.sizes, 1));
    result.setAttribute("aSeed", new THREE.BufferAttribute(data.seeds, 1));
    result.setAttribute("aOpacity", new THREE.BufferAttribute(data.opacities, 1));
    result.computeBoundingSphere();
    return result;
  }, [data]);

  useEffect(() => {
    const api = {
      setProgress(value: number) {
        if (!materialRef.current) return;
        materialRef.current.uniforms.uProgress.value = value;
        invalidate();
      },
    };
    onReady(api);
    return () => geometry.dispose();
  }, [geometry, invalidate, onReady]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uProgress: { value: 0 },
      uDesktopMode: { value: window.matchMedia("(min-width: 900px)").matches ? 1 : 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false,
  }), []);

  useEffect(() => () => material.dispose(), [material]);
  return <points geometry={geometry} frustumCulled={false}><primitive ref={materialRef} object={material} attach="material" /></points>;
}

export default function ParticlePortrait() {
  const { enabled, reducedMotion } = useMotionPreference();
  const scrollApi = useRef<ScrollApi | null>(null);
  const [data, setData] = useState<ParticleData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const image = new Image();
    image.onload = () => {
      if (!alive) return;
      const mobile = window.matchMedia("(max-width: 700px)").matches;
      const field = samplePortrait(image, mobile ? 18000 : 88000);
      if (field) setData(field);
    };
    image.src = PORTRAIT;
    return () => { alive = false; image.onload = null; };
  }, []);

  useEffect(() => {
    if (!scrollApi.current) return;
    scrollApi.current.setProgress(0);
    if (!enabled || reducedMotion) return;

    const media = gsap.matchMedia();
    media.add("(min-width: 900px)", () => {
      const hero = document.querySelector<HTMLElement>("#home");
      const copy = hero?.querySelector<HTMLElement>(".hero-copy");
      const sculpture = hero?.querySelector<HTMLElement>(".hero-sculpture");
      const sourceDetail = hero?.querySelector<HTMLElement>(".portrait-image-fallback");
      const annotations = hero?.querySelectorAll<HTMLElement>(".hero-annotation");
      const bottom = hero?.querySelector<HTMLElement>(".hero-bottom");
      const state = { progress: 0 };
      const setCopyY = copy ? gsap.quickSetter(copy, "y", "px") : null;
      const setCopyOpacity = copy ? gsap.quickSetter(copy, "autoAlpha") : null;
      const setSculptureY = sculpture ? gsap.quickSetter(sculpture, "y", "px") : null;
      const setSourceOpacity = sourceDetail ? gsap.quickSetter(sourceDetail, "opacity") : null;
      const setAnnotations = annotations ? gsap.quickSetter(annotations, "autoAlpha") : null;
      const setBottom = bottom ? gsap.quickSetter(bottom, "autoAlpha") : null;
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        onUpdate: () => {
          const progress = state.progress;
          scrollApi.current?.setProgress(progress);
          setCopyY?.(progress * window.innerHeight * .55);
          setCopyOpacity?.(1 - Math.max(0, (progress - .84) / .16));
          // Let the page continue naturally while the portrait recedes more
          // slowly than the copy, keeping the likeness in view through mid-scroll.
          setSculptureY?.(progress * window.innerHeight * .62);
          setSourceOpacity?.(.12 * (1 - Math.max(0, (progress - .62) / .38)));
          setAnnotations?.(1 - progress * .35);
          setBottom?.(1 - Math.max(0, (progress - .78) / .22) * .45);
        },
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * .72)}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      timeline.to(state, { progress: 1, duration: 1 }, 0);
      return () => timeline.kill();
    });
    ScrollTrigger.refresh();
    return () => media.revert();
  }, [data, enabled, reducedMotion, ready]);

  const onReady = useMemo(() => (api: ScrollApi) => {
    scrollApi.current = api;
    setReady(true);
  }, []);

  return <div className={`particle-portrait ${ready ? "is-ready" : ""}`}>
    <img className="portrait-image-fallback" src={PORTRAIT} alt="" draggable={false} />
    {data && <Canvas
      className="particle-portrait-canvas"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 11.2], fov: 35 }}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power", stencil: false, depth: false }}
      frameloop="demand"
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ParticlePoints data={data} onReady={onReady} />
    </Canvas>}
  </div>;
}
