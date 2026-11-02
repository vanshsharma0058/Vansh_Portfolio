"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { useMotionPreference } from "@/components/MotionPreference";

const SECTION_THRESHOLD = .2;
const DISPLAY_DURATION = 5600;
const TRANSITION_DURATION = 600;

type TourEntry = {
  id: string;
  section: HTMLElement;
  duration: number;
  itemCount: number;
  activeIndex: number;
  stepCounts: number[];
  autoplay: boolean;
  manual: boolean;
  paused: boolean;
  completed: boolean;
  visibility: number;
  advance: () => void;
  onStep: (itemIndex: number, stepIndex: number) => void;
  onLeave: () => void;
  progress: HTMLSpanElement | null;
};
type TourPatch = Partial<Omit<TourEntry, "id" | "section">>;
type TourController = {
  activeTour: string | null;
  register: (entry: TourEntry) => void;
  update: (id: string, patch: TourPatch) => void;
  remove: (id: string) => void;
  cancel: (id: string) => void;
};
const TourContext = createContext<TourController | null>(null);

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const entries = useRef(new Map<string, TourEntry>());
  const observer = useRef<IntersectionObserver | null>(null);
  const timelines = useRef(new Map<string, gsap.core.Timeline>());
  const pageVisibleRef = useRef(true);
  const [activeTour, setActiveTour] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const { enabled, reducedMotion } = useMotionPreference();

  const chooseTour = useCallback(() => {
    if (!pageVisibleRef.current) { setActiveTour(null); return; }
    const candidate = [...entries.current.values()]
      .filter((entry) => entry.visibility >= SECTION_THRESHOLD)
      .sort((a, b) => b.visibility - a.visibility)[0];
    setActiveTour((current) => current === candidate?.id ? current : candidate?.id ?? null);
  }, []);

  const register = useCallback((entry: TourEntry) => {
    entries.current.set(entry.id, entry);
    observer.current?.observe(entry.section);
    chooseTour();
    setRevision((value) => value + 1);
  }, [chooseTour]);

  const update = useCallback((id: string, patch: TourPatch) => {
    const entry = entries.current.get(id);
    if (!entry) return;
    entries.current.set(id, { ...entry, ...patch });
    chooseTour();
    setRevision((value) => value + 1);
  }, [chooseTour]);

  const remove = useCallback((id: string) => {
    const entry = entries.current.get(id);
    if (entry) observer.current?.unobserve(entry.section);
    entries.current.delete(id);
    chooseTour();
    setRevision((value) => value + 1);
  }, [chooseTour]);

  const cancel = useCallback((id: string) => {
    const timeline = timelines.current.get(id);
    if (!timeline) return;
    timeline.kill();
    timelines.current.delete(id);
  }, []);

  useEffect(() => {
    const sectionObserver = new IntersectionObserver((observations) => {
      for (const observation of observations) {
        const entry = [...entries.current.values()].find((candidate) => candidate.section === observation.target);
        if (!entry) continue;
        const bounds = observation.boundingClientRect;
        const visible = observation.intersectionRect;
        const denominatorWidth = Math.max(1, Math.min(bounds.width, window.innerWidth));
        const denominatorHeight = Math.max(1, Math.min(bounds.height, window.innerHeight));
        const normalizedVisibility = (visible.width * visible.height) / (denominatorWidth * denominatorHeight);
        const nextVisibility = observation.isIntersecting ? Math.min(1, normalizedVisibility) : 0;
        if (nextVisibility < SECTION_THRESHOLD && entry.manual) {
          cancel(entry.id);
          entry.onLeave();
          entries.current.set(entry.id, { ...entry, manual: false, visibility: nextVisibility });
        } else entries.current.set(entry.id, { ...entry, visibility: nextVisibility });
      }
      chooseTour();
    }, { threshold: [0, .01, .05, .1, .15, .2, .3, .45, .6, .8, 1] });
    observer.current = sectionObserver;
    entries.current.forEach((entry) => sectionObserver.observe(entry.section));
    return () => {
      observer.current = null;
      sectionObserver.disconnect();
    };
  }, [chooseTour, cancel]);

  useEffect(() => {
    const onVisibility = () => {
      const visible = document.visibilityState === "visible";
      pageVisibleRef.current = visible;
      setPageVisible(visible);
      if (!visible && activeTour) cancel(activeTour);
      chooseTour();
    };
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [chooseTour, activeTour, cancel]);

  useEffect(() => {
    const runningId = activeTour;
    const entry = runningId ? entries.current.get(runningId) : undefined;
    if (!runningId || !entry || !pageVisible || !enabled || reducedMotion || entry.visibility < SECTION_THRESHOLD || !entry.autoplay || entry.manual || entry.paused || entry.completed || !entry.progress) return;

    const bar = entry.progress;
    const progress = Math.max(0, Math.min(1, Number(gsap.getProperty(bar, "scaleX")) || 0));
    const progressTrack = bar.parentElement;
    if (progress >= 1) gsap.set(bar, { scaleX: 0 });
    progressTrack?.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    const remaining = entry.duration * (1 - progress);
    const timeline = gsap.timeline();
    timelines.current.set(runningId, timeline);
    const stepCount = Math.max(1, entry.stepCounts[entry.activeIndex] ?? 1);
    const firstStep = Math.min(stepCount - 1, Math.floor(progress * stepCount));
    const stepInterval = entry.duration / stepCount;
    for (let step = firstStep; step < stepCount; step++) {
      const stepTime = Math.max(0, step * stepInterval - progress * entry.duration);
      timeline.call(() => entry.onStep(entry.activeIndex, step), [], stepTime / 1000);
    }
    timeline.to(bar, {
      scaleX: 1,
      duration: remaining / 1000,
      ease: "none",
      onUpdate: function () {
        progressTrack?.setAttribute("aria-valuenow", String(Math.round((progress + (1 - progress) * this.progress()) * 100)));
      },
    }, 0);
    timeline.call(() => {
      if (entry.activeIndex >= entry.itemCount - 1) {
        progressTrack?.setAttribute("aria-valuenow", "100");
        entry.advance();
      } else {
        gsap.set(bar, { scaleX: 0 });
        progressTrack?.setAttribute("aria-valuenow", "0");
        entry.advance();
      }
    }, [], remaining / 1000);
    return () => {
      timeline.kill();
      if (timelines.current.get(runningId) === timeline) timelines.current.delete(runningId);
    };
  }, [activeTour, revision, pageVisible, enabled, reducedMotion]);

  const context = useMemo(() => ({ activeTour, register, update, remove, cancel }), [activeTour, register, update, remove, cancel]);
  return <TourContext.Provider value={context}>{children}</TourContext.Provider>;
}

export function useSequentialTour<SectionElement extends HTMLElement = HTMLElement>({
  id,
  itemCount,
  duration = DISPLAY_DURATION,
  transitionDuration = TRANSITION_DURATION,
  stepCounts,
  onStep,
}: {
  id: string;
  itemCount: number;
  duration?: number;
  transitionDuration?: number;
  stepCounts?: number[];
  onStep?: (itemIndex: number, stepIndex: number) => void;
}) {
  const context = useContext(TourContext);
  if (!context) throw new Error("useSequentialTour must be used within GuidedTourProvider");
  const { register, update, remove, cancel, activeTour } = context;
  const sectionRef = useRef<SectionElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [manual, setManual] = useState(false);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { enabled, reducedMotion } = useMotionPreference();
  const advance = useCallback(() => {
    if (activeIndex >= itemCount - 1) {
      setCompleted(true);
      setAutoplay(false);
      return;
    }
    setActiveIndex(activeIndex + 1);
  }, [activeIndex, itemCount]);
  const markLeft = useCallback(() => setManual(false), []);
  const setStep = useCallback((itemIndex: number, stepIndex: number) => onStep?.(itemIndex, stepIndex), [onStep]);
  const eligible = autoplay && !manual && !paused && !completed;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    register({
      id, section, duration, itemCount, activeIndex, stepCounts: stepCounts ?? [], autoplay: eligible, manual, paused, completed,
      visibility: 0, advance, onStep: setStep, onLeave: markLeft, progress: progressRef.current,
    });
    return () => remove(id);
  }, [register, remove, id]);

  useEffect(() => {
    update(id, { duration, itemCount, activeIndex, stepCounts: stepCounts ?? [], autoplay: eligible, manual, paused, completed, advance, onStep: setStep, onLeave: markLeft, progress: progressRef.current });
  }, [update, id, duration, itemCount, activeIndex, stepCounts, eligible, manual, paused, completed, advance, setStep, markLeft]);

  const select = useCallback((index: number) => {
    cancel(id);
    update(id, { manual: true, autoplay: true, paused: false, completed: false });
    setActiveIndex(index);
    setManual(true);
    setPaused(false);
    setCompleted(false);
    setAutoplay(true);
    gsap.set(progressRef.current, { scaleX: 0 });
  }, [cancel, id, update]);
  const pause = useCallback(() => { cancel(id); update(id, { manual: false, paused: true }); setManual(false); setPaused(true); }, [cancel, id, update]);
  const resume = useCallback(() => { setManual(false); setPaused(false); setAutoplay(true); }, []);
  const replay = useCallback(() => {
    cancel(id);
    update(id, { activeIndex: 0, manual: false, paused: false, completed: false, autoplay: true });
    gsap.set(progressRef.current, { scaleX: 0 });
    setActiveIndex(0);
    setManual(false);
    setPaused(false);
    setCompleted(false);
    setAutoplay(true);
  }, [cancel, id, update]);
  const pauseForInteraction = useCallback(() => { cancel(id); update(id, { manual: true, paused: false, autoplay: true }); setManual(true); setPaused(false); setAutoplay(true); }, [cancel, id, update]);
  const isSectionActive = activeTour === id;
  const isPlaying = isSectionActive && eligible && enabled && !reducedMotion;

  return {
    sectionRef,
    progressRef,
    transitionDuration,
    activeIndex,
    select,
    pause,
    resume,
    replay,
    pauseForInteraction,
    isPlaying,
    isComplete: completed,
    isPaused: paused || manual,
    isSectionActive,
    canAnimate: enabled && !reducedMotion,
  };
}

export { TRANSITION_DURATION };
