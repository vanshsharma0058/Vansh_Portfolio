"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { MotionControl } from "@/components/MotionControl";

const links = [
  ["About", "#about"],
  ["Perspectives", "#perspectives"],
  ["Work", "#work"],
  ["Approach", "#approach"],
  ["Experience", "#experience"],
  ["Atlas", "#skills"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const sections = links.map(([, href]) => document.querySelector<HTMLElement>(href)).filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: "-22% 0px -62% 0px", threshold: [0, 0.15, 0.5] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return <>
    <header className="site-header">
      <a className="skip-link" href="#main">Skip to content</a>
      <nav className="nav-wrap" aria-label="Main navigation">
        <a className={`nav-status ${activeSection === "home" ? "is-active" : ""}`} href="#home" aria-label="Home" aria-current={activeSection === "home" ? "location" : undefined}>
          <span className="status-dot" aria-hidden="true" /><span className="nav-status-desktop">OPEN TO OPPORTUNITIES</span><span className="mobile-nav-brand">Vansh Sharma</span>
        </a>
        <div className="desktop-nav">
          {links.map(([label, href]) => <a className={activeSection === href.slice(1) ? "is-active" : ""} key={href} href={href} aria-current={activeSection === href.slice(1) ? "location" : undefined}>{label}</a>)}
          <a className="nav-contact" href="#contact">Let&apos;s talk <ArrowUpRight size={14} /></a>
        </div>
        <button className="menu-toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      {open && <div className="mobile-menu" id="mobile-menu">
          {links.map(([label, href]) => <a className={activeSection === href.slice(1) ? "is-active" : ""} key={href} href={href} aria-current={activeSection === href.slice(1) ? "location" : undefined} onClick={() => setOpen(false)}>{label}</a>)}
          <a className="mobile-menu-contact" href="#contact" onClick={() => setOpen(false)}>Let&apos;s talk <ArrowUpRight size={16} /></a>
        </div>}
    </header>
    <MotionControl />
  </>;
}
