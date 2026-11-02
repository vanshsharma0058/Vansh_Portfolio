"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef, type KeyboardEvent } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useSequentialTour } from "@/components/GuidedTour";

gsap.registerPlugin(useGSAP);

const stages = [
  { number: "01", title: "Understand the need", label: "LISTEN", detail: "Start by getting clear on the problem: who is it for, what gets in their way, and what would make the experience useful?", signal: "A clearer problem" },
  { number: "02", title: "Shape the experience", label: "FRAME", detail: "Think through the flow before the implementation. Give the interface a clear structure and make the important actions easy to find.", signal: "A considered flow" },
  { number: "03", title: "Connect the system", label: "ENGINEER", detail: "Bring the parts together: interface, application logic, APIs, data, and the services that make a feature work end to end.", signal: "A working feature" },
  { number: "04", title: "Refine and improve", label: "ITERATE", detail: "Check the details, handle edge cases, and keep improving the result as the problem and product become clearer.", signal: "A stronger release" },
];

export function EngineeringApproach() {
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const visual = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const tour = useSequentialTour({ id: "engineering-approach", itemCount: stages.length });
  const stage = stages[tour.activeIndex];

  useGSAP(() => {
    if (!tour.canAnimate || !tour.isSectionActive) return;
    const targets = [visual.current, copy.current].filter((item): item is HTMLDivElement => Boolean(item));
    gsap.fromTo(targets, { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: tour.transitionDuration / 1000, stagger: .08, ease: "power2.out", clearProps: "transform" });
  }, { dependencies: [tour.activeIndex, tour.canAnimate, tour.isSectionActive], revertOnUpdate: true });

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, direction: number) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? stages.length - 1 : (tour.activeIndex + direction + stages.length) % stages.length;
    tour.select(next);
    tabs.current[next]?.focus();
  }

  return <section className="approach section-shell" id="approach" aria-labelledby="approach-heading" ref={tour.sectionRef}>
    <div className="approach-heading" data-reveal><div className="section-kicker"><span>04</span><span>HOW I APPROACH ENGINEERING</span></div><div className="approach-heading-row"><h2 id="approach-heading">A thought-through<br />way to make things.</h2><p>A personal working mindset, not a formal framework. Select a step or let the guided tour walk through it.</p></div></div>
    <div className="approach-explorer" data-reveal>
      <div className="approach-tabs" role="tablist" aria-label="Engineering approach">
        {stages.map((item, index) => <button ref={(element) => { tabs.current[index] = element; }} className={`approach-tab ${tour.activeIndex === index ? "is-active" : ""}`} key={item.number} id={`approach-tab-${index}`} type="button" role="tab" aria-selected={tour.activeIndex === index} aria-controls="approach-panel" tabIndex={tour.activeIndex === index ? 0 : -1} onClick={() => tour.select(index)} onKeyDown={(event) => moveTab(event, event.key === "ArrowRight" ? 1 : -1)}>
          <span>{item.number}</span><span>{item.title}</span><i aria-hidden="true">↗</i>
        </button>)}
      </div>
      <div className="approach-panel" id="approach-panel" role="tabpanel" aria-labelledby={`approach-tab-${tour.activeIndex}`} tabIndex={0}>
        <div className="approach-visual" ref={visual} aria-hidden="true"><div className={`system-diagram diagram-${tour.activeIndex + 1}`}><span className="diagram-path path-a" /><span className="diagram-path path-b" /><span className="diagram-path path-c" /><i className="diagram-node node-a">{stage.number}</i><i className="diagram-node node-b">API</i><i className="diagram-node node-c">UI</i><i className="diagram-node node-d">DATA</i><i className="diagram-halo" /></div><span className="diagram-caption">{stage.label} <b>/</b> {stage.signal}</span></div>
        <div className="approach-copy" ref={copy}>
          <span className="mono-label">STEP {stage.number} <i>/</i> {stage.label}</span><h3>{stage.title}</h3><p>{stage.detail}</p><span className="approach-outcome">{stage.signal}</span>
        </div>
      </div>
      <div className="guided-tour-controls"><span className="tour-readout">STEP {stage.number} <i>/</i> {stages.length} {tour.isComplete ? "· COMPLETE" : tour.isPlaying ? "· AUTO TOUR" : "· PAUSED"}</span><div className="tour-progress" role="progressbar" aria-label="Progress through the engineering approach tour" aria-valuemin={0} aria-valuemax={100} aria-valuenow={tour.isComplete ? 100 : 0}><span ref={tour.progressRef} /></div><button type="button" className="tour-toggle" onClick={tour.isComplete ? tour.replay : tour.isPlaying ? tour.pause : tour.resume} disabled={!tour.canAnimate} aria-pressed={tour.isPlaying}>{tour.isComplete ? <RotateCcw size={13} /> : tour.isPlaying ? <Pause size={13} /> : <Play size={13} />}{tour.isComplete ? "Replay" : tour.isPlaying ? "Pause tour" : "Resume tour"}</button></div>
    </div>
  </section>;
}
