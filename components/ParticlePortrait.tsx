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
  varying float vOpacity;
  void main() {
    // Hold the likeness through the early stages, then accelerate late so the
    // cloud opens quickly while the hero content exits on the same timeline.
    float t;
    float p;
    if (uDesktopMode > 0.5) {
      t = clamp((uProgress - 0.04) / 0.96, 0.0, 1.0);
      // Keep the likeness concentrated at the opening, then reach a full,
      // visible cloud well before the end-of-hero fade begins.
      // Let the portrait begin rebuilding before the returning title reaches
      // the viewport, avoiding a text-only re-entry over an empty field.
      p = smoothstep(0.08, 0.70, t);
    } else {
      float start = 0.14 + aSeed * 0.10;
      t = clamp((uProgress - start) / (1.0 - start), 0.0, 1.0);
      p = t * t * (2.0 - t);
    }
    vec3 pos = mix(position, aTarget, p);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uPixelRatio * (300.0 / -mv.z), 0.8, 1.8);
    vColor = aColor;
    // Let particles resolve at slightly different points so the cloud thins
    // organically instead of disappearing as one uniform opacity curtain.
    float desktopFade = 1.0;
    if (uDesktopMode > 0.5) {
      float fadeStart = 0.82 + aSeed * 0.08;
      float fadeEnd = 0.95 + aSeed * 0.04;
      desktopFade = 1.0 - smoothstep(fadeStart, fadeEnd, uProgress);
    }
    vOpacity = aOpacity * desktopFade;
  }
`;
const FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    float radius = length(gl_PointCoord - 0.5);
    float core = 1.0 - smoothstep(0.18, 0.49, radius);
    if (core < 0.01) discard;
    gl_FragColor = vec4(vColor, core * vOpacity * 0.92);
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

  // The current source is an opaque RGB image on black. Alpha therefore does
  // not identify its backdrop. Mark only near-black pixels connected to the
  // canvas edge; dark pixels enclosed by the portrait (hair, eyes, shirt and
  // blazer) remain valid source detail.
  const background = new Uint8Array(side * side);
  const queue = new Uint32Array(side * side);
  let queueStart = 0;
  let queueEnd = 0;
  const isNearBlack = (pixel: number) =>
    Math.max(pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]) <= 6;
  const enqueue = (x: number, y: number) => {
    const index = y * side + x;
    if (background[index]) return;
    if (!isNearBlack(index * 4)) return;
    background[index] = 1;
    queue[queueEnd++] = index;
  };
  for (let x = 0; x < side; x++) {
    enqueue(x, 0);
    enqueue(x, side - 1);
  }
  for (let y = 1; y < side - 1; y++) {
    enqueue(0, y);
    enqueue(side - 1, y);
  }
  while (queueStart < queueEnd) {
    const index = queue[queueStart++];
    const x = index % side;
    const y = Math.floor(index / side);
    if (x > 0) enqueue(x - 1, y);
    if (x < side - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < side - 1) enqueue(x, y + 1);
  }

  // Weight sampling toward edges and local detail, while retaining baseline
  // coverage in soft shadows, skin, and clothing. The inferred backdrop mask
  // removes only the edge-connected black field; source alpha remains intact.
  const maxCandidates = Math.ceil(side / 2) ** 2;
  const candidateIndices = new Uint32Array(maxCandidates);
  const cumulativeWeights = new Float32Array(maxCandidates);
  const samples: number[] = [];
  let candidateCount = 0;
  let totalWeight = 0;
  const pixelLuminance = (index: number) =>
    .2126 * toLinear(pixels[index]) +
    .7152 * toLinear(pixels[index + 1]) +
    .0722 * toLinear(pixels[index + 2]);

  for (let y = 2; y < side - 2; y += 2) {
    for (let x = 2; x < side - 2; x += 2) {
      const index = (y * side + x) * 4;
      const alpha = pixels[index + 3] / 255;
      if (alpha < 0.035 || background[index / 4]) continue;
      const luminance = pixelLuminance(index);
      const left = pixelLuminance(index - 8);
      const right = pixelLuminance(index + 8);
      const above = pixelLuminance(index - side * 8);
      const below = pixelLuminance(index + side * 8);
      const edgeStrength = Math.hypot(right - left, below - above) * .5;
      const localContrast = Math.abs(luminance - (left + right + above + below) * .25);
      // Keep broad photographic coverage dominant. Edge and contrast weights
      // help facial features without concentrating samples on skin texture.
      const weight = Math.min(1.36, .78 + edgeStrength * .72 + localContrast * .34 + luminance * .1) * (.3 + alpha * .7);
      candidateIndices[candidateCount] = index;
      totalWeight += weight;
      cumulativeWeights[candidateCount] = totalWeight;
      candidateCount++;
    }
  }

  const count = Math.min(maxPoints, candidateCount);
  if (count === 0) return null;
  const sampleInterval = totalWeight / count;
  let candidateCursor = 0;
  let nextSample = sampleInterval * .43;
  for (let point = 0; point < count; point++) {
    while (candidateCursor < candidateCount - 1 && cumulativeWeights[candidateCursor] < nextSample) {
      candidateCursor++;
    }
    samples.push(candidateIndices[candidateCursor]);
    nextSample += sampleInterval;
  }
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
    const localMean = (
      pixelLuminance(pixel - 8) + pixelLuminance(pixel + 8) +
      pixelLuminance(pixel - side * 8) + pixelLuminance(pixel + side * 8)
    ) * .25;
    const localContrast = luminance - localMean;
    const key = point + 1;
    // Break the 2px sampling lattice while staying within roughly one source
    // pixel so the photographic contours remain stable.
    const jitterX = (hash(key * 13.3) - .5) * 1.8;
    const jitterY = (hash(key * 15.7) - .5) * 1.8;
    // Keep the head top near its current position while drawing the shoulders
    // upward and inward so they sit behind the title, not the supporting copy.
    const portraitScale = 5.8;
    const px = ((x + jitterX) / (side - 1) - .5) * portraitScale;
    const py = (.5 - (y + jitterY) / (side - 1)) * portraitScale + .25;
    const pz = (hash(key * 1.7) - .5) * .12;

    // Irregular angular spread and independent horizontal drift avoid mirrored
    // wings while retaining an outward, depth-rich cloud.
    const angle = Math.atan2(py, px) + (hash(key * 2.3) - .5) * 6.0;
    const radial = 1.6 + hash(key * 3.1) * 4.2;
    const driftX = (hash(key * 4.7) - .5) * 3.5;
    const targetX = px + Math.cos(angle) * radial + driftX;
    const targetY = py + Math.sin(angle) * radial * .86 - .3 - hash(key * 5.3) * .9;
    // Softly contain the final cloud within the canvas frustum so particles
    // don't hit its rectangular clipping edge at maximum dispersion.
    targets.set([
      Math.tanh(targetX / 9) * 7.6,
      Math.tanh(targetY / 5.2) * 3.1,
      pz + (hash(key * 6.1) - .38) * 4.4,
    ], point * 3);
    positions.set([px, py, pz], point * 3);

    // The PNG is sRGB. Perceptual luminance avoids crushing the source face
    // into mid-grey while retaining its dark hair and clothing shadows.
    const detail = Math.max(0, Math.min(1, (luminance - .006) / .78 + localContrast * .34));
    // Shape luminance gently in linear space: preserve deep source shadows,
    // define midtone facial features, and avoid clipping bright skin highlights.
    const tone = .002 + Math.min(.98, Math.pow(detail, .9) * .98);
    const alpha = pixels[pixel + 3] / 255;
    const nearBackground = (x0: number, y0: number) => background[y0 * side + x0] === 1;
    // Feather just the silhouette edge by a pixel or two to avoid a cutout
    // fringe while leaving interior dark features crisp.
    let silhouetteFade = 1;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        if (nearBackground(x + ox, y + oy)) silhouetteFade = Math.min(silhouetteFade, .68);
      }
    }
    if (silhouetteFade === 1) {
      for (let oy = -2; oy <= 2; oy += 2) {
        for (let ox = -2; ox <= 2; ox += 2) {
          if (nearBackground(x + ox, y + oy)) silhouetteFade = Math.min(silhouetteFade, .86);
        }
      }
    }
    const sourceWarmth = Math.max(0, sourceR - sourceB * 1.15);
    const orange = y < side * .48 && sourceWarmth > .11 && hash(key * 7.9) > .62;
    const warmth = orange ? Math.min(.11, sourceWarmth * .24) : 0;
    const sourceColorTrust = .26;
    colors.set([
      tone * (1 - sourceColorTrust) + r * sourceColorTrust + warmth,
      tone * (1 - sourceColorTrust) + g * sourceColorTrust - warmth * .28,
      tone * (1 - sourceColorTrust) + b * sourceColorTrust - warmth * .48,
    ], point * 3);
    // Keep the stipple finer than the reference image's facial features so
    // neighbouring samples do not merge into a noisy, flat patch.
    sizes[point] = .021 + Math.pow(detail, .72) * .012 + hash(key * 9.1) * .002;
    seeds[point] = hash(key * 11.7);
    // Add a slight, seed-varied opacity falloff across the photo's cropped
    // lower edge. This dissolves the shoulder cutoff as individual points.
    const shoulderEdge = Math.min(1, Math.abs(x / (side - 1) - .5) * 2);
    const edgeStart = side * (.82 + shoulderEdge * .045 + hash(key * 12.9) * .025);
    const edgeEnd = side * (.94 + shoulderEdge * .025 + hash(key * 14.1) * .02);
    const edgeProgress = Math.max(0, Math.min(1, (y - edgeStart) / (edgeEnd - edgeStart)));
    const edgeFade = 1 - edgeProgress * edgeProgress * (3 - 2 * edgeProgress);
    opacities[point] = alpha * silhouetteFade * edgeFade;
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
      const field = samplePortrait(image, mobile ? 18000 : 132000);
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
      const top = hero?.querySelector<HTMLElement>(".hero-top");
      const annotations = hero?.querySelectorAll<HTMLElement>(".hero-annotation");
      const artLabels = hero?.querySelectorAll<HTMLElement>(".hero-art-label");
      const bottom = hero?.querySelector<HTMLElement>(".hero-bottom");
      const state = { progress: 0 };
      const title = hero?.querySelector<HTMLElement>(".hero-copy h1");
      const index = hero?.querySelector<HTMLElement>(".hero-index");
      const intro = hero?.querySelector<HTMLElement>(".hero-intro");
      const actions = hero?.querySelector<HTMLElement>(".hero-actions");
      const fade = (value: number, start: number, end: number) => {
        const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
        return 1 - t * t * (3 - 2 * t);
      };
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        onUpdate: () => {
          const progress = state.progress;
          scrollApi.current?.setProgress(progress);
          // Let normal document flow move the complete hero together. The
          // scrubbed progress controls the portrait and its staged exit only.
          if (progress <= 0.0001) {
            [index, title, intro, actions, top, bottom].forEach((element) => {
              if (element) element.style.opacity = "";
            });
            annotations?.forEach((element) => { element.style.opacity = ""; });
            artLabels?.forEach((element) => { element.style.opacity = ""; });
            if (copy) {
              copy.style.opacity = "";
              copy.style.visibility = "";
              copy.inert = false;
            }
            if (bottom) bottom.style.visibility = "";
            return;
          }
          if (copy) {
            // Child elements own their individual fades; avoid multiplying
            // them by a second opacity on their parent.
            const exited = progress >= .999;
            copy.style.visibility = exited ? "hidden" : "visible";
            copy.inert = exited;
          }
          if (index) index.style.opacity = String(fade(progress, .16, .38));
          // The title leaves as it reaches the top edge and returns only as
          // the portrait begins rebuilding on reverse scroll.
          if (title) title.style.opacity = String(fade(progress, .56, .72));
          if (intro) intro.style.opacity = String(fade(progress, .38, .62));
          if (actions) actions.style.opacity = String(fade(progress, .42, .66));
          if (top) top.style.opacity = String(fade(progress, .2, .4));
          annotations?.forEach((annotation) => { annotation.style.opacity = String(fade(progress, .16, .4)); });
          artLabels?.forEach((label) => { label.style.opacity = String(fade(progress, .22, .44)); });
          const bottomOpacity = fade(progress, .22, .46);
          if (bottom) {
            bottom.style.opacity = String(bottomOpacity);
            bottom.style.visibility = bottomOpacity <= .001 ? "hidden" : "visible";
          }
        },
        scrollTrigger: {
          trigger: hero,
          // Keep the hero and following sections in normal document flow.
          // Progress follows the hero's natural viewport exit, so the next
          // section cannot slide beneath a pinned portrait stage.
          start: "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      timeline.to(state, { progress: 1, duration: 1 }, 0);
      return () => {
        timeline.kill();
        // ScrollTrigger may be rebuilt after a breakpoint or motion preference
        // change. Restore direct style writes as well as GSAP transforms so the
        // hero cannot reopen half faded or retain a stale offset.
        [title, index, intro, actions].forEach((element) => {
          if (element) element.style.opacity = "";
        });
        annotations?.forEach((element) => { element.style.opacity = ""; });
        artLabels?.forEach((element) => { element.style.opacity = ""; });
        if (top) top.style.opacity = "";
        if (copy) {
          copy.style.opacity = "";
          copy.style.visibility = "";
          copy.inert = false;
        }
        if (bottom) {
          bottom.style.opacity = "";
          bottom.style.visibility = "";
        }
      };
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
