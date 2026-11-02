"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useCallback, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useSequentialTour } from "@/components/GuidedTour";

type SkillGroup = { name: string; items: string[] };
type AtlasGroup = { title: string; intro: string };

const groupCopy: Record<string, AtlasGroup> = {
  Frontend: { title: "Frontend Engineering", intro: "Structure the browser experience through components, routes, application state, and responsive presentation." },
  Backend: { title: "Backend Engineering", intro: "Connect application behavior, REST endpoints, authentication, and role-aware access." },
  Databases: { title: "Databases & Architecture", intro: "Persist application state and shape how data is organized, queried, and connected." },
  "AI & machine learning": { title: "AI & Machine Learning", intro: "Bring model APIs and applied machine-learning techniques into useful product workflows." },
  "Creative development": { title: "Creative Development", intro: "Explore graphics, shaders, animation timelines, and interaction in the browser." },
  "Tools & delivery": { title: "Tools & Infrastructure", intro: "Support development, source control, testing, and deployment from local work to release." },
};

const technologyDetails: Record<string, string> = {
  "JavaScript ES6+": "Modern JavaScript syntax for application behavior and browser interactions.",
  TypeScript: "Typed contracts that make application data and component interfaces clearer.",
  React: "Reusable components for building interactive product interfaces.",
  "Redux Toolkit": "A structured way to manage shared application state in React projects.",
  "React Router": "Client-side navigation between views in a React application.",
  HTML5: "Semantic document structure and browser-native interface elements.",
  CSS3: "Styling, layout, responsive behavior, and motion for web interfaces.",
  "Tailwind CSS": "Utility classes for composing interface styles directly in markup.",
  "Responsive design": "Layouts and interactions adapted for different screen sizes.",
  "Node.js": "JavaScript runtime for application logic and server-side workflows.",
  Express: "A Node.js framework for organizing web servers and API routes.",
  "REST APIs": "HTTP endpoints that let application clients exchange structured data.",
  "JWT authentication": "Token-based authentication used to identify signed-in sessions.",
  "Role-based access": "Permissions shaped around a user's role in an application.",
  Middleware: "Reusable request-processing steps in a server workflow.",
  MVC: "A pattern for separating application data, views, and request handling.",
  "Error handling": "Consistent responses and recovery paths when a workflow fails.",
  MongoDB: "A document database for storing flexible application records.",
  Mongoose: "A schema and modeling layer for working with MongoDB in Node.js.",
  PostgreSQL: "A relational database for structured data and SQL queries.",
  MySQL: "A relational database used to persist and query application data.",
  SQL: "A language for reading and changing structured relational data.",
  "LLM API integration": "Connecting a product workflow to a large language model service.",
  "Prompt engineering": "Designing and refining instructions sent to language models.",
  "AI applications": "Product experiences that use model APIs as one part of a broader workflow.",
  Python: "A general-purpose language used here for application and machine-learning work.",
  Flask: "A lightweight Python framework for serving web application routes.",
  "scikit-learn": "Python tools for fitting and using machine-learning models.",
  "Linear regression": "A statistical method for estimating a numeric value from input data.",
  "Three.js": "A JavaScript library for rendering interactive 3D scenes in the browser.",
  "React Three Fiber": "A React renderer for composing Three.js scenes declaratively.",
  Drei: "Helpers and ready-made building blocks for React Three Fiber scenes.",
  GSAP: "A JavaScript animation library for sequenced interface and SVG motion.",
  ScrollTrigger: "A GSAP plugin that ties animation timelines to scroll position.",
  GLSL: "A shader language for GPU-based visual effects and material work.",
  "Interactive 3D": "Browser-based 3D experiences that respond to user input.",
  "Git & GitHub": "Version control and collaboration workflows for source code.",
  Postman: "A workspace for sending requests to APIs and checking their responses.",
  "VS Code": "A code editor used for implementation, debugging, and project work.",
  Firebase: "A hosted platform used in application development workflows.",
  Vercel: "A deployment platform for publishing web applications.",
  Render: "A cloud platform used to deploy web services and applications.",
  AWS: "Cloud services used to host and operate application infrastructure.",
  Docker: "A way to package applications and their runtime dependencies into containers.",
  Jest: "A JavaScript test runner for checking application behavior.",
};

const atlasTitles = ["Frontend Engineering", "Backend Engineering", "Databases & Architecture", "AI & Machine Learning", "Creative Development", "Tools & Infrastructure"];

export function TechnicalCapabilities({ groups }: { groups: SkillGroup[] }) {
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const [selectedTechnology, setSelectedTechnology] = useState(groups[0]?.items[0] ?? "");
  const stepCounts = useMemo(() => groups.map((group) => group.items.length), [groups]);
  const onTourStep = useCallback((groupIndex: number, technologyIndex: number) => {
    const technology = groups[groupIndex]?.items[technologyIndex];
    if (technology) setSelectedTechnology(technology);
  }, [groups]);
  const tour = useSequentialTour<HTMLDivElement>({ id: "engineering-atlas", itemCount: groups.length, duration: 9500, stepCounts, onStep: onTourStep });
  const root = tour.sectionRef;
  const active = tour.activeIndex;
  const selectedGroup = groups[active];
  const copy = groupCopy[selectedGroup.name];
  const title = atlasTitles[active] ?? selectedGroup.name;
  const selectedDetail = technologyDetails[selectedTechnology] ?? "A technology included in the documented skills and project information.";
  const points = selectedGroup.items.map((name, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / selectedGroup.items.length);
    return { name, x: 50 + Math.cos(angle) * 39, y: 50 + Math.sin(angle) * 37 };
  });

  const sequenceEnabled = tour.isPlaying;

  useGSAP(() => {
    const element = root.current;
    if (!element || !tour.canAnimate || !tour.isSectionActive) return;
    const paths = Array.from(element.querySelectorAll<SVGPathElement>(".atlas-path"));
    paths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, autoAlpha: .25 });
      gsap.to(path, { strokeDashoffset: 0, autoAlpha: 1, duration: .48, ease: "power2.out", delay: .04 });
    });
    const titleNode = element.querySelector<HTMLElement>(".atlas-title");
    if (titleNode) gsap.fromTo(titleNode, { y: 8, autoAlpha: .3 }, { y: 0, autoAlpha: 1, duration: .4, ease: "power2.out" });
  }, { scope: root, dependencies: [active, tour.canAnimate, tour.isSectionActive], revertOnUpdate: true });

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, direction: number) {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? groups.length - 1 : (active + direction + groups.length) % groups.length;
    tour.select(next);
    setSelectedTechnology(groups[next].items[0]);
    tabs.current[next]?.focus();
  }

  function selectGroup(index: number) {
    tour.select(index);
    setSelectedTechnology(groups[index].items[0]);
  }

  function selectTechnology(technology: string) {
    tour.pauseForInteraction();
    setSelectedTechnology(technology);
  }

  function pauseForInput() {
    tour.pauseForInteraction();
  }

  return <div className="engineering-atlas" ref={root}>
    <div className="atlas-selector" role="tablist" aria-label="Engineering disciplines" aria-orientation="vertical">
      {groups.map((group, index) => <button ref={(element) => { tabs.current[index] = element; }} type="button" role="tab" aria-selected={active === index} aria-controls="atlas-panel" tabIndex={active === index ? 0 : -1} id={`atlas-tab-${index}`} key={group.name} className={`atlas-discipline ${active === index ? "is-active" : ""}`} onFocus={pauseForInput} onClick={() => selectGroup(index)} onKeyDown={(event) => moveTab(event, event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1)}>
        <span className="atlas-discipline-number">{String(index + 1).padStart(2, "0")}</span><strong>{atlasTitles[index] ?? group.name}</strong><i aria-hidden="true">↗</i>
      </button>)}
    </div>
    <section className="atlas-panel" id="atlas-panel" role="tabpanel" aria-labelledby={`atlas-tab-${active}`} tabIndex={0}>
      <div className="atlas-panel-heading"><div><span className="mono-label">ENGINEERING ATLAS / {String(active + 1).padStart(2, "0")}</span><h3 className="atlas-title">{title}<span>.</span></h3><p>{copy.intro}</p></div><div className="atlas-playback"><span className="atlas-count">{String(selectedGroup.items.length).padStart(2, "0")} CONNECTED TECHNOLOGIES</span><div className="atlas-tour-actions"><div className="tour-progress" role="progressbar" aria-label="Progress through current Engineering Atlas category" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}><span ref={tour.progressRef} /></div><button className="atlas-playback-control" type="button" onClick={tour.isComplete ? tour.replay : tour.isPlaying ? tour.pause : tour.resume} disabled={!tour.canAnimate} aria-pressed={tour.isPlaying} aria-label={tour.isComplete ? "Replay skills tour" : tour.isPlaying ? "Pause automatic skills tour" : "Resume automatic skills tour"} title={!tour.canAnimate ? "Automatic cycling is disabled by the motion preference" : undefined}>{tour.isComplete ? <RotateCcw size={13} /> : tour.isPlaying ? <Pause size={13} /> : <Play size={13} />}{tour.isComplete ? "Replay" : tour.isPlaying ? "Pause tour" : "Resume tour"}</button></div></div></div>
      <div className="atlas-map" role="group" aria-label={`${title} connected technology map`}>
        <svg viewBox="0 0 760 500" preserveAspectRatio="none" aria-hidden="true">
          <circle className="atlas-orbit" cx="380" cy="250" r="184" /><circle className="atlas-orbit orbit-secondary" cx="380" cy="250" r="118" />
          {points.map((point) => {
            const x = point.x / 100 * 760;
            const y = point.y / 100 * 500;
            const bend = (y - 250) * .32;
            return <path key={point.name} className={`atlas-path ${selectedTechnology === point.name ? "is-selected" : ""}`} d={`M380 250 C ${380} ${250 + bend} ${x} ${250 + bend} ${x} ${y}`} />;
          })}
          <circle className="atlas-center-halo" cx="380" cy="250" r="58" /><circle className="atlas-center" cx="380" cy="250" r="38" />
        </svg>
        <div className="atlas-center-label"><span>CONNECTED</span><strong>{String(active + 1).padStart(2, "0")}</strong></div>
        {points.map((point, index) => <button key={point.name} type="button" className={`atlas-node ${selectedTechnology === point.name ? "is-selected" : ""}`} style={{ left: `${point.x}%`, top: `${point.y}%`, "--node-index": index } as CSSProperties} onPointerDown={pauseForInput} onFocus={pauseForInput} onClick={() => selectTechnology(point.name)} aria-pressed={selectedTechnology === point.name} aria-label={`${point.name}. ${technologyDetails[point.name] ?? "Technology in documented experience and projects."}`}>
          <i aria-hidden="true" /><span>{point.name}</span>
        </button>)}
      </div>
      <div className="atlas-mobile-nodes" role="group" aria-label={`${title} technologies`}>
        <span className="atlas-mobile-core">CONNECTED SYSTEM / {String(active + 1).padStart(2, "0")}</span>
        {points.map((point) => <button key={point.name} type="button" className={`atlas-mobile-node ${selectedTechnology === point.name ? "is-selected" : ""}`} onPointerDown={pauseForInput} onFocus={pauseForInput} onClick={() => selectTechnology(point.name)} aria-pressed={selectedTechnology === point.name}><i aria-hidden="true" />{point.name}<span>+</span></button>)}
      </div>
      <div className="atlas-detail" aria-live={sequenceEnabled ? "off" : "polite"}><span className="mono-label">NODE / {selectedTechnology.toUpperCase()}</span><p>{selectedDetail}</p></div>
      <span className="atlas-footnote">SELECT A NODE TO TRACE ITS PLACE IN THE SYSTEM</span>
    </section>
  </div>;
}
