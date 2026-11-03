import { ArrowDown, ArrowDownRight, ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { ScrollReveals } from "@/components/MotionRuntime";
import { EngineeringApproach } from "@/components/EngineeringApproach";
import { EngineeringPerspectives } from "@/components/EngineeringPerspectives";
import { HeroSculpture } from "@/components/HeroSculpture";
import { TechnicalCapabilities } from "@/components/TechnicalCapabilities";
import { profile, skillGroups } from "@/data/portfolio";
import { ProjectShowcase } from "@/components/ProjectShowcase";
import { EngineeringJourney } from "@/components/EngineeringJourney";

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Vansh Sharma",
  jobTitle: "Software Engineer and Full Stack Developer",
  email: "mailto:vanshsharmagi288@gmail.com",
  sameAs: ["https://www.linkedin.com/in/vansh58sharma/", "https://github.com/vanshsharma0058"],
  knowsAbout: ["Full-stack development", "React", "Node.js", "AI application development", "Three.js"],
};

const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "Vansh Sharma Portfolio", inLanguage: "en" };

function SectionHeading({ index, eyebrow, title, id, children }: { index: string; eyebrow: string; title: string; id?: string; children?: React.ReactNode }) {
  return <div className="section-heading" data-reveal><div className="section-kicker"><span>{index}</span><span>{eyebrow}</span></div><h2 id={id}>{title}</h2>{children && <p>{children}</p>}</div>;
}

export default function Home() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([personSchema, websiteSchema]).replace(/</g, "\\u003c") }} />
    <SiteHeader />
    <main id="main">
      <section className="hero cinematic-hero" id="home" aria-labelledby="hero-title">
        <div className="hero-architecture" aria-hidden="true" />
        <div className="hero-top"><span className="eyebrow">SOFTWARE ENGINEER <span className="eyebrow-slash">/</span> FULL STACK DEVELOPER</span><span className="hero-location">BASED IN INDIA <i /> OPEN TO OPPORTUNITIES</span></div>
        <div className="hero-layout">
          <aside className="hero-annotation hero-annotation-left"><span className="annotation-index">01</span><span>ENGINEERING<br />CREATIVITY<br />PROBLEM SOLVING<br />REAL IMPACT</span></aside>
          <div className="hero-center">
            <div className="hero-art"><HeroSculpture />
            {/* <span className="hero-art-label hero-art-label-left">CODE<br />DESIGN<br />DEPLOY<br />IMPROVE</span><span className="hero-art-label hero-art-label-right">IDEAS<br />INTO<br />PRODUCTS</span> */}
            </div>
            <div className="hero-copy">
              <p className="hero-index">INDEPENDENT THINKING. CONNECTED SYSTEMS.</p>
              <h1 id="hero-title"><span className="hero-title-line"><span>Vansh <em>Sharma</em></span></span></h1>
              <p className="hero-intro">I build useful digital products with clean interfaces, scalable systems, and emerging technologies.</p>
              <div className="hero-actions"><a className="button button-primary" href="#work">Explore my work <ArrowUpRight size={16} /></a><a className="button button-secondary" href="#approach">See how I think <ArrowUpRight size={16} /></a></div>
            </div>
          </div>
          <aside className="hero-annotation hero-annotation-right"><span className="hero-side-label">FROM SIGNAL<br />TO SYSTEM</span><span className="hero-scroll-cue">SCROLL<br />TO EXPLORE <ArrowDown size={15} /></span></aside>
        </div>
        <div className="hero-bottom"><span className="hero-bottom-scroll hero-scroll-cue">SCROLL<br />TO EXPLORE <ArrowDown size={15} /></span><span>TURNING IDEAS INTO MEANINGFUL SOFTWARE</span><span className="hero-note">VANSH SHARMA / 2026</span><span className="hero-bottom-status"><i /> AVAILABLE FOR OPPORTUNITIES</span></div>
      </section>

      <div className="signal-band" aria-label="From signal to system: ideas in motion">
        <div className="signal-track"><span>IDEAS IN MOTION <i>&#10038;</i> FROM SIGNAL TO SYSTEM <i>&#10038;</i> BUILD WITH INTENT <i>&#10038;</i> IDEAS IN MOTION <i>&#10038;</i> FROM SIGNAL TO SYSTEM <i>&#10038;</i> BUILD WITH INTENT <i>&#10038;</i></span><span aria-hidden="true">IDEAS IN MOTION <i>&#10038;</i> FROM SIGNAL TO SYSTEM <i>&#10038;</i> BUILD WITH INTENT <i>&#10038;</i> IDEAS IN MOTION <i>&#10038;</i> FROM SIGNAL TO SYSTEM <i>&#10038;</i> BUILD WITH INTENT <i>&#10038;</i></span></div>
      </div>

      <section className="manifesto section-shell" id="about" aria-labelledby="about-title">
        <div className="manifesto-top"><span className="section-kicker"><span>01</span><span>THE PERSON BEHIND THE PIXELS</span></span><span className="manifesto-aside">A HUMAN STORY, BUILT IN CODE.</span></div>
        <div className="manifesto-grid">
          <div className="about-constellation" data-reveal role="img" aria-label="Abstract diagram connecting people, interfaces, and systems"><svg viewBox="0 0 520 500" aria-hidden="true"><circle className="about-orbit" cx="260" cy="250" r="190" /><circle className="about-orbit about-orbit-two" cx="260" cy="250" r="130" /><path d="M260 250 112 145M260 250 412 142M260 250 110 354M260 250 411 360M112 145H412M110 354H411" /><circle className="about-node about-node-center" cx="260" cy="250" r="40" /><circle className="about-node" cx="112" cy="145" r="25" /><circle className="about-node" cx="412" cy="142" r="25" /><circle className="about-node" cx="110" cy="354" r="25" /><circle className="about-node" cx="411" cy="360" r="25" /></svg><span className="about-core-label">PEOPLE<br />&amp; SYSTEMS</span><span className="about-node-label node-label-a">NEED</span><span className="about-node-label node-label-b">INTERFACE</span><span className="about-node-label node-label-c">LOGIC</span><span className="about-node-label node-label-d">DATA</span><span className="about-figure-note">A SYSTEM IS A SET OF CONNECTIONS</span></div>
          <div className="manifesto-copy" data-reveal><h2 id="about-title">Ideas are only<br />a starting point<span>.</span></h2><p>I enjoy understanding the problem behind an idea, then shaping it into something people can actually use. That means moving between interface details, application logic, and the connections that make a product work.</p><p>My work and interests span full-stack development, AI integration, responsive interface design, and interactive web experiences. I&apos;m early in my engineering journey, curious about the craft, and keen to keep learning alongside people who care about what they build.</p><a className="inline-link" href="#experience">A little about how I got here <ArrowDownRight size={15} /></a></div>
        </div>
        <div className="pillars">
          {[
            ["01", "BUILD", "Full-stack applications, APIs, databases, authentication, and the connections between them."],
            ["02", "SHAPE", "Responsive interfaces, clear interactions, reusable components, and considered details."],
            ["03", "EXPLORE", "Practical AI, 3D web experiences, motion, and the creative edges of the browser."],
          ].map(([number, title, copy]) => <article className="pillar" key={number} data-reveal><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <EngineeringPerspectives />

      <section className="work section-shell" id="work" aria-labelledby="work-title">
        <SectionHeading index="03" eyebrow="SELECTED WORK" title="Ideas, made tangible." id="work-title">A few projects that show different sides of how I think, build, and explore.</SectionHeading>
        <ProjectShowcase />
      </section>

      <EngineeringApproach />

      <section className="experience section-shell" id="experience" aria-labelledby="experience-title">
        <SectionHeading index="05" eyebrow="REAL-WORLD EXPERIENCE" title="Learning in the work." id="experience-title">Internship experience across production software, user interfaces, and connected application workflows.</SectionHeading>
        <EngineeringJourney />
      </section>

      <section className="toolkit section-shell" id="skills" aria-labelledby="skills-title">
        <SectionHeading index="06" eyebrow="INTERACTIVE ENGINEERING ATLAS" title="The whole system, connected." id="skills-title">Explore the technologies behind my documented work and projects, one connected discipline at a time.</SectionHeading>
        <TechnicalCapabilities groups={skillGroups} />
      </section>

      <section className="learning section-shell" id="learning" aria-labelledby="learning-title">
        <SectionHeading index="07" eyebrow="LEARNING & DIRECTION" title="Grounded in learning." id="learning-title">A foundation to build on, and room to keep growing.</SectionHeading>
        <div className="learning-grid">
          <article className="education-card" data-reveal><span className="mono-label">EDUCATION / 2022—2026</span><h3>Bachelor of Technology</h3><p>Computer Science and Engineering</p><div className="education-bottom"><span>S.D. College of Engineering & Technology</span><strong>8.2 <small>/ 10 CGPA</small></strong></div></article>
          <div className="learning-column">
            <article className="achievement" data-reveal><span className="mono-label">RECOGNITION / 01</span><h3>Second place — Turbo AI</h3><p>Zonal-level technology festival achievement in an AI-focused event.</p></article>
            <article className="achievement" data-reveal><span className="mono-label">RECOGNITION / 02</span><h3>HackerRank Python — 4-star</h3><p>Programming problem-solving, as listed in my professional materials.</p></article>
          </div>
          <article className="credentials" data-reveal><span className="mono-label">ADDITIONAL LEARNING</span><ul><li>Microsoft Azure AI Fundamentals</li><li>IBM SkillsBuild AI & ML</li><li>Full Stack Web Development — Udemy</li></ul><p>Credentials listed in my resume. Exact certificate details and verification links are not available in this workspace.</p></article>
        </div>
        <div className="direction-note" data-reveal><span>WHAT&apos;S NEXT</span><p>I want to grow into a stronger, more well-rounded engineer — contributing to useful products, deepening my technical craft, and taking greater ownership from an idea through to release.</p></div>
      </section>

      <section className="contact section-shell" id="contact" aria-labelledby="contact-title">
        <div className="contact-visual" aria-hidden="true"><div className="contact-rings"><i /><i /><i /><i /></div><span>OPEN<br />CHANNEL</span></div>
        <div className="contact-copy" data-reveal><span className="section-kicker"><span>08</span><span>THE NEXT CHAPTER</span></span><h2 id="contact-title">Let&apos;s build<br />something <em>useful.</em></h2><p>I&apos;m open to early-career software engineering roles, collaborations, and conversations about thoughtful technology.</p><a className="button button-primary contact-button" href={`mailto:${profile.email}`}>Start a conversation <ArrowUpRight size={16} /></a></div>
        <div className="contact-links"><a href={`mailto:${profile.email}`}><span><Mail size={16} /> EMAIL</span><strong>{profile.email}</strong><ArrowUpRight size={16} /></a><a href={profile.linkedin} target="_blank" rel="noreferrer"><span><Linkedin size={16} /> LINKEDIN</span><strong>Connect professionally</strong><ArrowUpRight size={16} /></a><a href={profile.github} target="_blank" rel="noreferrer"><span><Github size={16} /> GITHUB</span><strong>Explore my repositories</strong><ArrowUpRight size={16} /></a></div>
      </section>
    </main>
    <footer className="site-footer"><span>Vansh Sharma <i>·</i> Software Engineer</span><a href="#home">BACK TO TOP <ArrowUpRight size={13} /></a><span>IDEAS IN MOTION / 2026</span></footer>
    <ScrollReveals />
  </>;
}

