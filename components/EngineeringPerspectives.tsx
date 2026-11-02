"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef, type KeyboardEvent } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useSequentialTour } from "@/components/GuidedTour";

gsap.registerPlugin(useGSAP);

const perspectives = [
  { number: "01", title: "Build", label: "MAKE IT USEFUL", heading: "Give ideas a working shape.", detail: "I move from the problem to a clear interface, then connect it to the features that make a product useful end to end.", tags: ["React", "Responsive interfaces", "Product flows"], nodes: ["NEED", "INTERFACE", "FEATURE"] },
  { number: "02", title: "Engineer", label: "CONNECT THE SYSTEM", heading: "Make the parts work together.", detail: "I work across frontend and backend workflows, connecting REST APIs, application logic, authentication, and data.", tags: ["REST APIs", "Authentication", "Application data"], nodes: ["CLIENT", "API", "DATA"] },
  { number: "03", title: "Explore", label: "FOLLOW CURIOSITY", heading: "Make room for what's next.", detail: "I explore practical AI integrations and expressive browser experiences, learning by turning ideas into working experiments.", tags: ["LLM APIs", "Three.js", "Interactive web"], nodes: ["PROMPT", "MODEL", "EXPERIENCE"] },
];

export function EngineeringPerspectives() {
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const graphic = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const tour = useSequentialTour({ id: "engineering-perspectives", itemCount: perspectives.length });
  const current = perspectives[tour.activeIndex];

  useGSAP(() => {
    if (!tour.canAnimate || !tour.isSectionActive) return;
    const targets = [graphic.current, copy.current].filter((item): item is HTMLDivElement => Boolean(item));
    gsap.fromTo(targets, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: tour.transitionDuration / 1000, stagger: .08, ease: "power2.out", clearProps: "transform" });
    const paths = graphic.current?.querySelectorAll<SVGPathElement>(".perspective-path");
    paths?.forEach((path) => {
      const length = path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: .65, ease: "power2.out" });
    });
  }, { dependencies: [tour.activeIndex, tour.canAnimate, tour.isSectionActive], revertOnUpdate: true });

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, direction: number) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? perspectives.length - 1 : (tour.activeIndex + direction + perspectives.length) % perspectives.length;
    tour.select(next);
    tabs.current[next]?.focus();
  }

  return <section className="perspectives section-shell" id="perspectives" aria-labelledby="perspectives-title" ref={tour.sectionRef}>
    <div className="perspectives-heading" data-reveal>
      <div className="section-kicker"><span>02</span><span>THREE WAYS OF LOOKING AT THE WORK</span></div>
      <div className="perspectives-heading-row"><h2 id="perspectives-title">One practice.<br />Different perspectives.</h2><p>Choose a lens or let the guided tour show how I approach the work.</p></div>
    </div>
    <div className="perspective-tabs" role="tablist" aria-label="Engineering perspectives">
      {perspectives.map((item, index) => <button type="button" role="tab" key={item.number} id={`perspective-tab-${index}`} aria-selected={tour.activeIndex === index} aria-controls="perspective-panel" tabIndex={tour.activeIndex === index ? 0 : -1} className={`perspective-tab ${tour.activeIndex === index ? "is-active" : ""}`} onClick={() => tour.select(index)} onKeyDown={(event) => moveTab(event, event.key === "ArrowRight" ? 1 : -1)}><span>{item.number}</span><strong>{item.title}</strong><i aria-hidden="true">↗</i></button>)}
    </div>
    <div className="perspective-panel" id="perspective-panel" role="tabpanel" aria-labelledby={`perspective-tab-${tour.activeIndex}`} tabIndex={0} aria-live={tour.isPlaying ? "off" : "polite"}>
      <div className={`perspective-graphic perspective-graphic-${tour.activeIndex + 1}`} ref={graphic} aria-hidden="true">
        <svg viewBox="0 0 560 360"><path className="perspective-path path-top" d="M280 70 C280 145 128 150 128 252" /><path className="perspective-path path-mid" d="M128 252 H432" /><path className="perspective-path path-right" d="M280 70 C280 145 432 150 432 252" /><circle className="perspective-ring" cx="280" cy="180" r="112" /><circle className="perspective-ring ring-two" cx="280" cy="180" r="150" /></svg>
        <span className="perspective-node perspective-node-top">{current.nodes[0]}</span><span className="perspective-node perspective-node-left">{current.nodes[1]}</span><span className="perspective-node perspective-node-right">{current.nodes[2]}</span><span className="perspective-core">{current.number}</span>
        <span className="perspective-graphic-label">{current.label}</span>
      </div>
      <div className="perspective-copy" ref={copy}>
        <span className="mono-label">PERSPECTIVE / {current.number}</span><h3>{current.heading}</h3><p>{current.detail}</p><ul className="perspective-tags">{current.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
      </div>
    </div>
    <div className="guided-tour-controls"><span className="tour-readout">PERSPECTIVE {current.number} <i>/</i> {perspectives.length} {tour.isComplete ? "· COMPLETE" : tour.isPlaying ? "· AUTO TOUR" : "· PAUSED"}</span><div className="tour-progress" role="progressbar" aria-label="Progress through the perspectives tour" aria-valuemin={0} aria-valuemax={100} aria-valuenow={tour.isComplete ? 100 : 0}><span ref={tour.progressRef} /></div><button type="button" className="tour-toggle" onClick={tour.isComplete ? tour.replay : tour.isPlaying ? tour.pause : tour.resume} disabled={!tour.canAnimate} aria-pressed={tour.isPlaying}>{tour.isComplete ? <RotateCcw size={13} /> : tour.isPlaying ? <Pause size={13} /> : <Play size={13} />}{tour.isComplete ? "Replay" : tour.isPlaying ? "Pause tour" : "Resume tour"}</button></div>
  </section>;
}
