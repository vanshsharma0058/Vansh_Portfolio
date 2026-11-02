"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowUpRight, Github } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionPreference } from "@/components/MotionPreference";
import { projects } from "@/data/portfolio";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function ProjectVisual({ type, name }: { type: string; name: string }) {
  const captured = type === "prompt" || type === "dogstudio";
  const capture = type === "prompt" ? "prompt2site" : type;
  return <div className={`project-visual visual-${type}`}>
    {captured ? <><Image src={`/images/project-${capture}.png`} alt={`Genuine capture of the ${name} application`} fill sizes="(max-width: 900px) 100vw, 80vw" className={`project-capture capture-${type}`} /><span className="capture-label">GENUINE PROJECT CAPTURE <i>↗</i></span></> : <>
      <div className="visual-grain" />
      {type === "signature" && <div className="workflow-visual"><span className="workflow-step">01 <b>DOCUMENT</b></span><svg viewBox="0 0 540 210" role="presentation"><path d="M66 104 H474" /><circle cx="90" cy="104" r="43" /><circle cx="270" cy="104" r="43" /><circle cx="450" cy="104" r="43" /><path className="workflow-spark" d="M237 105 C248 94 252 119 262 104 S278 88 287 104" /></svg><span className="workflow-step workflow-step-middle">02 <b>SIGN</b></span><span className="workflow-step workflow-step-last">03 <b>DOWNLOAD</b></span><span className="visual-footnote">DOCUMENT FLOW / CONCEPTUAL VISUAL</span></div>}
      {type === "predictor" && <div className="chart-study"><span className="visual-label">MODEL / LINEAR REGRESSION</span><strong>Experience → estimate</strong><div className="chart-area"><div className="chart-grid" /><svg viewBox="0 0 440 170" role="presentation"><path d="M5 150 C 65 132, 90 127, 130 103 S 200 96, 236 74 S 315 68, 350 43 S 402 31, 435 8" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="236" cy="74" r="5" fill="currentColor" /></svg></div><div className="chart-axis"><span>0 years</span><span>Years of experience</span><span>10 years</span></div><span className="visual-footnote">CONCEPTUAL MODEL VISUAL · NOT A SCREENSHOT</span></div>}
    </>}
  </div>;
}

export function ProjectShowcase() {
  const [active, setActive] = useState(0);
  const { enabled, reducedMotion: reduced } = useMotionPreference();

  useEffect(() => {
    const chapters = Array.from(document.querySelectorAll<HTMLElement>(".project-chapter"));
    const section = document.querySelector<HTMLElement>(".project-list");
    const index = document.querySelector<HTMLElement>(".project-index");
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current) setActive(chapters.indexOf(current.target as HTMLElement));
    }, { rootMargin: "-24% 0px -48% 0px", threshold: [0, .2, .45, .7] });
    chapters.forEach((chapter) => observer.observe(chapter));
    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      if (!section || !index) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const progress = Math.max(0, Math.min(1, (window.scrollY - top) / Math.max(1, section.offsetHeight)));
      index.style.setProperty("--project-progress", String(progress));
    };
    const scheduleProgress = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };
    updateProgress();
    window.addEventListener("scroll", scheduleProgress, { passive: true });
    window.addEventListener("resize", scheduleProgress, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleProgress);
      window.removeEventListener("resize", scheduleProgress);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useGSAP(() => {
    if (!enabled || reduced) return;
    gsap.utils.toArray<HTMLElement>(".project-chapter").forEach((chapter) => {
      const media = chapter.querySelector<HTMLElement>(".project-visual");
      const text = chapter.querySelectorAll<HTMLElement>(".project-story-heading, .project-story, .project-footer");
      if (media) gsap.fromTo(media, { clipPath: "inset(8% 2% 8%)", y: 20 }, { clipPath: "inset(0% 0% 0%)", y: -8, ease: "none", scrollTrigger: { trigger: media, start: "top 88%", end: "center 42%", scrub: .45 } });
      gsap.fromTo(text, { autoAlpha: 0, y: 17 }, { autoAlpha: 1, y: 0, duration: .55, stagger: .12, ease: "power2.out", scrollTrigger: { trigger: chapter, start: "top 76%", once: true } });
    });
  }, { dependencies: [enabled, reduced], revertOnUpdate: true });

  return <div className="project-showcase-layout">
    <nav className="project-index" aria-label="Selected project chapters" style={{ "--project-progress": "0" } as CSSProperties}>
      <span className="project-index-label">PROJECT INDEX</span>
      {projects.map((project, index) => <a key={project.number} className={active === index ? "is-active" : ""} href={`#project-${project.number}`} aria-current={active === index ? "location" : undefined}><span>{project.number}</span><strong>{project.name}</strong><i aria-hidden="true" /></a>)}
    </nav>
    <div className="project-list">
      {projects.map((project) => <article className={`project-chapter project-${project.visual}`} key={project.number} id={`project-${project.number}`}>
        <header className="project-story-heading"><div className="project-meta"><span>{project.number} <i> / </i> {project.category}</span><span className="project-availability">PERSONAL PROJECT</span></div><h3>{project.name}</h3><p>{project.description}</p></header>
        <a className="project-visual-link" href={project.link ?? project.repo} target="_blank" rel="noreferrer" aria-label={`Explore ${project.name}${project.link ? " live experience" : " repository"}`}><ProjectVisual type={project.visual} name={project.name} /></a>
        <div className="project-story"><article><span>THE PURPOSE</span><p>{project.purpose}</p></article><article><span>MY CONTRIBUTION</span><p>{project.contribution}</p></article><article><span>ENGINEERING NOTES</span><p>{project.engineering}</p></article></div>
        <footer className="project-footer"><div className="project-stack"><span className="project-section-label">TECHNOLOGIES</span><ul className="tag-list">{project.stack.map((technology) => <li key={technology}>{technology}</li>)}</ul></div><div className="project-links">{project.link && <a href={project.link} target="_blank" rel="noreferrer">Live experience <ArrowUpRight size={15} /></a>}<a href={project.repo} target="_blank" rel="noreferrer">GitHub repository <Github size={15} /></a></div></footer>
      </article>)}
    </div>
  </div>;
}
