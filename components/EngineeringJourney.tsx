"use client";

import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionPreference } from "@/components/MotionPreference";
import { experience } from "@/data/portfolio";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function EngineeringJourney() {
  const [active, setActive] = useState(0);
  const { enabled, reducedMotion: reduced } = useMotionPreference();
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const list = listRef.current;
    if (!list) return;
    const items = gsap.utils.toArray<HTMLElement>(".experience-item", list);
    const updateProgress = (progress: number) => list.style.setProperty("--experience-progress", String(progress));
    ScrollTrigger.create({
      trigger: list,
      start: "top 78%",
      end: "bottom 78%",
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => updateProgress(self.progress),
      onRefresh: (self) => updateProgress(self.progress),
    });
    items.forEach((item, index) => ScrollTrigger.create({
      trigger: item,
      start: "top 56%",
      end: "bottom 56%",
      onEnter: () => setActive(index),
      onEnterBack: () => setActive(index),
    }));
    if (enabled && !reduced) items.forEach((item) => {
      const content = item.querySelectorAll<HTMLElement>(".experience-company, h3, .experience-description, .experience-details");
      gsap.fromTo(content, { y: 16, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: .55, stagger: .09, ease: "power2.out",
        scrollTrigger: { trigger: item, start: "top 76%", once: true },
      });
    });
  }, { scope: listRef, dependencies: [enabled, reduced], revertOnUpdate: true });

  return <div className="experience-list journey-list" ref={listRef}>
    <div className="experience-rail" aria-hidden="true"><span className="experience-progress" />{experience.map((job, index) => <i className={active === index ? "is-active" : ""} key={job.company} />)}</div>
    {experience.map((job, index) => <article className={`experience-item ${active === index ? "is-current" : ""}`} key={job.company}>
      <div className="experience-period"><span>{String(index + 1).padStart(2, "0")}</span><time>{job.period}</time></div>
      <div className="experience-body"><p className="experience-company">{job.company}<span> · REMOTE</span></p><h3>{job.role}</h3><p className="experience-description">{job.details}</p><details className="experience-details" open><summary>Responsibilities &amp; contributions <span aria-hidden="true">＋</span></summary><ul>{job.points.map((point) => <li key={point}>{point}</li>)}</ul>{job.note && <p className="editorial-note">{job.note}</p>}</details></div>
      <ArrowUpRight className="experience-arrow" size={20} aria-hidden="true" />
    </article>)}
  </div>;
}
