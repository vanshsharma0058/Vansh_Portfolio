"use client";

import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type MechanicalSphereProps = { motionEnabled: boolean; onReady: () => void; onUnavailable: () => void };
type SceneModel = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  objectRoot: THREE.Group;
  panels: THREE.Group[];
  hinges: THREE.Group[];
  core: THREE.Group;
  rings: THREE.Mesh[];
  coreLight: THREE.PointLight;
  halo: THREE.Line;
  fadeMaterials: THREE.Material[];
  applyProgress: (progress: number) => void;
  render: () => void;
  resize: () => void;
  dispose: () => void;
};

const TAU = Math.PI * 2;
const RADIUS = 1.4;
const INNER_RADIUS = 1.315;
const OPEN_END = .6;
const HOLD_END = .78;

function makeSphericalPanel(phiLength: number, thetaStart: number, thetaLength: number, phiSegments: number, thetaSegments: number) {
  const positions: number[] = [];
  const indices: number[] = [];
  const row = phiSegments + 1;
  const surfaceVertices = row * (thetaSegments + 1);
  const point = (radius: number, theta: number, phi: number) => new THREE.Vector3(
    radius * Math.sin(theta) * Math.cos(phi),
    radius * Math.cos(theta),
    radius * Math.sin(theta) * Math.sin(phi),
  );

  for (const radius of [RADIUS, INNER_RADIUS]) {
    for (let y = 0; y <= thetaSegments; y++) {
      const theta = thetaStart + thetaLength * y / thetaSegments;
      for (let x = 0; x <= phiSegments; x++) {
        const phi = -phiLength / 2 + phiLength * x / phiSegments;
        const vertex = point(radius, theta, phi);
        positions.push(vertex.x, vertex.y, vertex.z);
      }
    }
  }

  for (let y = 0; y < thetaSegments; y++) {
    for (let x = 0; x < phiSegments; x++) {
      const a = y * row + x;
      const b = a + row;
      const c = b + 1;
      const d = a + 1;
      indices.push(a, b, d, b, c, d);
      const inner = surfaceVertices;
      indices.push(inner + a, inner + d, inner + b, inner + b, inner + d, inner + c);
    }
  }

  const connectEdge = (outerStart: number, outerEnd: number) => {
    const innerStart = surfaceVertices + outerStart;
    const innerEnd = surfaceVertices + outerEnd;
    indices.push(outerStart, innerStart, outerEnd, outerEnd, innerStart, innerEnd);
  };
  for (let y = 0; y < thetaSegments; y++) {
    connectEdge(y * row, (y + 1) * row);
    connectEdge(y * row + phiSegments, (y + 1) * row + phiSegments);
  }
  for (let x = 0; x < phiSegments; x++) {
    connectEdge(x, x + 1);
    connectEdge(thetaSegments * row + x, thetaSegments * row + x + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createRim(phi: number, thetaStart: number, thetaLength: number, color: number, radius: number) {
  const points: THREE.Vector3[] = [];
  const segments = 32;
  for (let index = 0; index <= segments; index++) {
    const theta = thetaStart + thetaLength * index / segments;
    points.push(new THREE.Vector3(radius * Math.sin(theta) * Math.cos(phi), radius * Math.cos(theta), radius * Math.sin(theta) * Math.sin(phi)));
  }
  const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, .008, 5, false);
  const material = new THREE.MeshStandardMaterial({ color, metalness: .72, roughness: .32, emissive: 0x7b3516, emissiveIntensity: .11, transparent: true });
  return new THREE.Mesh(geometry, material);
}

function createStudioEnvironment() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const backdrop = context.createLinearGradient(0, 0, 0, canvas.height);
  backdrop.addColorStop(0, "#8b7561");
  backdrop.addColorStop(.18, "#37302a");
  backdrop.addColorStop(.55, "#151311");
  backdrop.addColorStop(.82, "#34251b");
  backdrop.addColorStop(1, "#090909");
  context.fillStyle = backdrop;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const softbox = (x: number, y: number, width: number, height: number, color: string) => {
    context.save();
    context.shadowColor = color;
    context.shadowBlur = 34;
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
    context.restore();
  };
  softbox(58, 32, 34, 118, "rgba(255,231,202,.84)");
  softbox(209, 20, 10, 94, "rgba(255,128,63,.75)");
  softbox(360, 43, 48, 86, "rgba(225,215,201,.64)");
  softbox(454, 74, 12, 102, "rgba(255,115,48,.58)");

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

export default function MechanicalSphere({ motionEnabled, onReady, onUnavailable }: MechanicalSphereProps) {
  const host = useRef<HTMLDivElement>(null);
  const model = useRef<SceneModel | null>(null);
  const [sceneRevision, setSceneRevision] = useState(0);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let sceneModel: SceneModel | null = null;
    let resizeObserver: ResizeObserver | null = null;
    try {
      const mobile = window.matchMedia("(max-width: 700px)").matches;
      const scene = new THREE.Scene();
      const environment = createStudioEnvironment();
      if (environment) scene.environment = environment;
      const camera = new THREE.PerspectiveCamera(34, 1, .1, 30);
      camera.position.set(0, 0, 7.1);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !mobile, powerPreference: "low-power", stencil: false, depth: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.55));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.setAttribute("aria-hidden", "true");
      container.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xb7b0a8, 0x100b08, 1.25));
      const key = new THREE.DirectionalLight(0xffd3b1, 3.2);
      key.position.set(-3.4, 4.2, 5);
      scene.add(key);
      const edge = new THREE.DirectionalLight(0xf06b2b, 2.5);
      edge.position.set(3.3, -2, -3);
      scene.add(edge);

      const objectRoot = new THREE.Group();
      scene.add(objectRoot);
      const assembly = new THREE.Group();
      objectRoot.add(assembly);
      const panels: THREE.Group[] = [];
      const hinges: THREE.Group[] = [];
      const segmentAngle = TAU / 6;
      // Leave only a hairline mechanical seam between the six spherical gores.
      const gap = .008;
      const thetaStart = 0;
      const thetaLength = Math.PI;
      const shellMaterial = new THREE.MeshPhysicalMaterial({ color: 0x4a433b, emissive: 0x100a06, emissiveIntensity: .12, metalness: .62, roughness: .31, clearcoat: .68, clearcoatRoughness: .2, envMapIntensity: 1.3, side: THREE.DoubleSide, transparent: true });
      const accents = [0x945332, 0x694631, 0xa15c35, 0x694631, 0x945332, 0x79513a];
      for (let index = 0; index < 6; index++) {
        const panel = new THREE.Group();
        panel.rotation.y = index * segmentAngle;
        const hinge = new THREE.Group();
        // Every petal pivots from its own equatorial point. The parent rotates
        // around the sphere, keeping the six hinge axes rotationally symmetric.
        hinge.position.set(INNER_RADIUS * .58, 0, 0);
        const mountedGeometry = new THREE.Group();
        mountedGeometry.position.copy(hinge.position).negate();
        const panelMaterial = shellMaterial.clone();
        panelMaterial.color.setHex(0x4a433b);
        panelMaterial.color.offsetHSL(0, index % 2 ? .018 : -.018, index % 3 === 1 ? -.028 : .018);
        mountedGeometry.add(new THREE.Mesh(makeSphericalPanel(segmentAngle - gap, thetaStart, thetaLength, mobile ? 14 : 22, mobile ? 22 : 36), panelMaterial));
        mountedGeometry.add(createRim(-(segmentAngle - gap) / 2, thetaStart, thetaLength, accents[index], RADIUS + .004));
        mountedGeometry.add(createRim((segmentAngle - gap) / 2, thetaStart, thetaLength, accents[index], RADIUS + .004));
        hinge.add(mountedGeometry);
        panel.add(hinge);
        panels.push(panel);
        hinges.push(hinge);
        assembly.add(panel);
      }
      shellMaterial.dispose();

      const core = new THREE.Group();
      const coreMaterial = new THREE.MeshPhysicalMaterial({ color: 0xff8a45, emissive: 0xf05b1d, emissiveIntensity: .42, roughness: .2, metalness: .12, envMapIntensity: .35, clearcoat: 1, clearcoatRoughness: .16, transparent: true });
      const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(.43, mobile ? 32 : 56, mobile ? 24 : 40), coreMaterial);
      core.add(coreMesh);
      const coreDetailMaterial = new THREE.MeshBasicMaterial({ color: 0xffb17b, transparent: true, opacity: .13, depthWrite: false });
      const coreOrbitA = new THREE.Mesh(new THREE.TorusGeometry(.465, .0035, 4, mobile ? 48 : 80), coreDetailMaterial);
      const coreOrbitB = new THREE.Mesh(new THREE.TorusGeometry(.474, .0025, 4, mobile ? 48 : 80), coreDetailMaterial.clone());
      coreOrbitA.rotation.set(.42, .15, .58);
      coreOrbitB.rotation.set(-.28, .7, -.22);
      core.add(coreOrbitA, coreOrbitB);
      const coreLight = new THREE.PointLight(0xf97431, .35, 3.1, 1.8);
      core.add(coreLight);
      objectRoot.add(core);

      const rings = [
        new THREE.Mesh(new THREE.TorusGeometry(1.77, .008, 5, 128), new THREE.MeshBasicMaterial({ color: 0xff9b5f, transparent: true, opacity: .12, depthWrite: false })),
        new THREE.Mesh(new THREE.TorusGeometry(1.95, .006, 5, 128), new THREE.MeshBasicMaterial({ color: 0xe1c9b8, transparent: true, opacity: .12, depthWrite: false })),
      ];
      rings[0].rotation.set(.89, .18, -.18);
      rings[1].rotation.set(.33, .95, .26);
      objectRoot.add(...rings);

      // Fine dashed guide orbit echoes the storyboard's dotted mechanical halo.
      const haloGeometry = new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 181 }, (_, index) => {
          const angle = index / 180 * TAU;
          return new THREE.Vector3(Math.cos(angle) * 2.03, Math.sin(angle) * 2.03, -.08);
        }),
      );
      const haloMaterial = new THREE.LineDashedMaterial({ color: 0xff8a4e, dashSize: .018, gapSize: .067, transparent: true, opacity: .25, depthWrite: false });
      const halo = new THREE.Line(haloGeometry, haloMaterial);
      halo.computeLineDistances();
      objectRoot.add(halo);

      const render = () => renderer.render(scene, camera);
      const resize = () => {
        const width = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.z = width < 500 ? 7.6 : 7.45;
        camera.updateProjectionMatrix();
        render();
      };
      const dispose = () => {
        const geometries = new Set<THREE.BufferGeometry>();
        const materials = new Set<THREE.Material>();
        scene.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) geometries.add(mesh.geometry);
          if (Array.isArray(mesh.material)) mesh.material.forEach((material) => materials.add(material));
          else if (mesh.material) materials.add(mesh.material);
        });
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
        renderer.dispose();
        environment?.dispose();
        renderer.domElement.remove();
      };
      const fadeMaterials: THREE.Material[] = [];
      const orbitObjects = new Set<THREE.Object3D>([...rings, halo]);
      objectRoot.traverse((object) => {
        if (orbitObjects.has(object)) return;
        const mesh = object as THREE.Mesh;
        if (Array.isArray(mesh.material)) fadeMaterials.push(...mesh.material);
        else if (mesh.material) fadeMaterials.push(mesh.material);
      });
      const applyProgress = (progress: number) => {
        const p = THREE.MathUtils.clamp(progress, 0, 1);
        const open = THREE.MathUtils.clamp(p / OPEN_END, 0, 1);
        const fade = THREE.MathUtils.clamp((p - HOLD_END) / (1 - HOLD_END), 0, 1);
        panels.forEach((panel, index) => {
          const angle = index * TAU / 6;
          const spread = 1.02 * open;
          // During the iris sequence the six spherical gores turn toward the
          // viewer and fan into a radial flower, keeping each shell distinct.
          panel.position.set(Math.cos(angle) * spread, Math.sin(angle) * spread, (index % 2 ? .08 : -.08) * open);
          panel.rotation.y = angle * (1 - open);
          panel.rotation.z = angle * open;
          hinges[index].rotation.x = .18 * open;
        });
        assembly.scale.setScalar(1 - open * .53);
        core.scale.setScalar(.84 + open * .16);
        coreLight.intensity = (.35 + open * 1.55) * (1 - fade);
        rings.forEach((ring, index) => {
          (ring.material as THREE.MeshBasicMaterial).opacity = (.04 + open * .27) * (1 - fade);
          ring.scale.setScalar(.78 + open * (index === 0 ? .38 : .24));
        });
        (halo.material as THREE.LineDashedMaterial).opacity = (.17 + open * .14) * (1 - fade);
        halo.scale.setScalar(.97 + open * .05);
        objectRoot.scale.setScalar(1 - fade * .075);
        objectRoot.position.y = (mobile ? .12 : .65 + open * .2) - .14 * fade;
        fadeMaterials.forEach((material) => {
          const transparent = material as THREE.Material & { opacity?: number };
          if (transparent.opacity !== undefined) transparent.opacity = 1 - fade;
          if (material instanceof THREE.MeshPhysicalMaterial) material.depthWrite = fade === 0;
        });
        render();
      };
      sceneModel = { renderer, scene, camera, objectRoot, panels, hinges, core, rings, coreLight, halo, fadeMaterials, applyProgress, render, resize, dispose };
      model.current = sceneModel;
      applyProgress(0);
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();
      setSceneRevision((revision) => revision + 1);
      onReady();
    } catch {
      onUnavailable();
    }

    return () => {
      resizeObserver?.disconnect();
      sceneModel?.dispose();
      model.current = null;
    };
  }, [onReady, onUnavailable]);

  useGSAP(() => {
    const current = model.current;
    if (!current) return;
    if (!motionEnabled) {
      current.applyProgress(0);
      return;
    }

    const media = gsap.matchMedia();
    const createTimeline = (desktop: boolean) => {
      const state = { progress: 0 };
      const renderScrollState = () => current.applyProgress(state.progress);

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: "#home",
          start: "top top",
          end: desktop ? () => `+=${Math.round(window.innerHeight * 1.45)}` : "bottom top",
          pin: desktop,
          pinSpacing: desktop,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
        onUpdate: renderScrollState,
      });
      timeline
        .to(state, { progress: OPEN_END, duration: OPEN_END, ease: "none" })
        .to(state, { progress: HOLD_END, duration: HOLD_END - OPEN_END, ease: "none" })
        .to(state, { progress: 1, duration: 1 - HOLD_END, ease: "none" });
      timeline.scrollTrigger?.refresh();
      return () => {
        timeline.kill();
      };
    };

    media.add("(min-width: 900px)", () => createTimeline(true));
    media.add("(max-width: 899px)", () => createTimeline(false));
    return () => {
      media.revert();
      current.applyProgress(0);
    };
  }, { dependencies: [sceneRevision, motionEnabled], revertOnUpdate: true });

  return <div className="mechanical-sphere-canvas" ref={host} />;
}
