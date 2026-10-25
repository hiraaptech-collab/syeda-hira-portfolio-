import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, ArrowDown, Asterisk, Layers3, Cpu, Sparkles, Terminal, Compass } from 'lucide-react';
import gsap from 'gsap';
import Reveal from '../components/Reveal';
import { profile } from '../data/profile';

const HomeWorkspace = lazy(() => import('../components/three/ShowcaseScenes').then(module => ({ default: module.HomeWorkspace })));
const creativeWords = ['FULL STACK ARCHITECTURE', 'CREATIVE 3D EXPERIENCES', 'THOUGHTFUL DESIGN', 'INTENTIONAL CODE'];

const coreExpertise = [
  {
    number: '01',
    title: 'Full Stack Engineering',
    tag: 'ARCHITECTURE & LOGIC',
    description: 'Building responsive interfaces and practical web applications across the frontend, backend, and database layers.',
    points: ['JavaScript, HTML, CSS & Bootstrap', 'PHP, Laravel, Node.js & Express.js', 'MySQL']
  },
  {
    number: '02',
    title: 'Immersive 3D & Creative Motion',
    tag: 'SPATIAL & INTERACTIVE',
    description: 'Exploring 3D web experiences and motion through the tools in my development toolkit.',
    points: ['Three.js and WebGL', 'GSAP animation', 'Interactive 3D visualization']
  },
  {
    number: '03',
    title: 'Dynamic Web Platforms & E-Commerce',
    tag: 'SCALABLE SYSTEMS',
    description: 'Working across entertainment, fashion, and fitness concepts shown in my selected projects.',
    points: ['Fandom and media discovery', 'Fashion browsing and virtual try-on concept', 'Fitness guidance and planning features']
  },
  {
    number: '04',
    title: 'Design-Minded Craft & UX',
    tag: 'EDITORIAL EXCELLENCE',
    description: 'Bringing visual direction and practical functionality together in clear, responsive web experiences.',
    points: ['Thoughtful typography and visual hierarchy', 'Responsive interface design', 'Attention to motion and interaction']
  }
];

const methodologySteps = [
  {
    step: '01',
    phase: 'Concept & Architecture',
    summary: 'Clarifying the idea, intended audience, and information a project needs to present.'
  },
  {
    step: '02',
    phase: 'Interface & 3D Spatial Design',
    summary: 'Planning the layout, visual direction, and interactions for the experience.'
  },
  {
    step: '03',
    phase: 'Full-Stack Implementation',
    summary: 'Building the interface and application functionality with the chosen tools.'
  },
  {
    step: '04',
    phase: 'Refinement & Delivery',
    summary: 'Reviewing the result across screen sizes and refining details before delivery.'
  }
];

export default function Home({ entered, onSceneReady, onSceneProgress, reducedMotion }) {
  const hero = useRef(null);

  useEffect(() => {
    onSceneProgress?.(100);
    onSceneReady?.();
  }, [onSceneReady, onSceneProgress]);

  useEffect(() => {
    if (!entered || reducedMotion) return;
    const context = gsap.context(() => {
      gsap.fromTo('.hero-reveal', { y: 24, z: -50, scale: 0.96, opacity: 0.35, rotateX: 10, rotateY: -2, transformPerspective: 1100 }, { y: 0, z: 0, scale: 1, opacity: 1, rotateX: 0, rotateY: 0, stagger: 0.055, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.fromTo('.hero-art', { scale: 0.98, opacity: 0.6 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity' });
    }, hero);
    return () => context.revert();
  }, [entered, reducedMotion]);

  return (
    <>
      {/* Procedural 3D developer workspace */}
      <section className="hero container" ref={hero} aria-labelledby="hero-heading" data-cinematic-hero="home">
        <div className="hero-topline">
          <span className="eyebrow">INDEPENDENT DEVELOPER · KARACHI, PK</span>
          <span className="availability">
            <span className="tiny-dot" /> Karachi, Pakistan
          </span>
        </div>

        <div className="hero-layout">
          {/* Left Column: Developer Identity & Typography */}
          <div className="hero-copy">
            <p className="eyebrow hero-reveal hero-role">
              <span className="label-line" /> FULL STACK DEVELOPER
            </p>
            <h1 id="hero-heading" className="hero-name" aria-label="Syeda Hira">
              <span className="hero-reveal">Syeda</span>
              <span className="hero-reveal name-second">
                Hira<span className="name-period">.</span>
                <Asterisk className="name-asterisk" size={45} strokeWidth={1} aria-hidden="true" />
              </span>
            </h1>
            <p className="hero-tagline hero-reveal">
              Where creativity<br />meets <em>development.</em>
            </p>
            <p className="hero-description hero-reveal">
              {profile.introduction}
            </p>

            <div className="hero-actions hero-reveal">
              <Link to="/contact" className="button button-dark" data-magnetic>
                Hire Me <ArrowUpRight size={17} />
              </Link>
              <Link to="/projects" className="button button-outline" data-magnetic>
                Explore My Work <ArrowUpRight size={17} />
              </Link>
            </div>

            <Link to="/about" className="about-link hero-reveal">
              More About Me <ArrowRight size={15} />
            </Link>
          </div>

          {/* Procedural developer workspace. */}
          <div className="hero-art">
            <span className="art-coordinate art-coordinate-top">01 — PROCEDURAL DEVELOPER WORKSPACE</span>

            
              <div className="scene-canvas" role="region" aria-label="Procedural 3D developer workspace">
                <Suspense fallback={<div className="workspace-loading" aria-hidden="true" />}>
                  <HomeWorkspace reducedMotion={reducedMotion} started={entered} />
                </Suspense>
              </div>
            

          </div>
        </div>

        <div className="hero-bottom">
          <a href="#expertise" className="scroll-cue">
            <span className="scroll-circle"><ArrowDown size={16} /></span>
            EXPLORE MY EXPERTISE
          </a>
          <span className="hero-bottom-note">
            Thoughtful code.<br /><span>Endless possibility.</span>
          </span>
          <span className="portfolio-edition">SYEDA HIRA · PORTFOLIO</span>
        </div>
      </section>

      {/* Marquee Strip */}
      <div className="creative-strip" aria-hidden="true">
        <div>
          {[...creativeWords, ...creativeWords].map((word, i) => (
            <span key={`${word}-${i}`}>
              <Asterisk size={20} strokeWidth={1} />
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Core Expertise Highlights (Wavy Floating Cards) */}
      <section className="expertise-section container" id="expertise" aria-labelledby="expertise-heading">
        <Reveal>
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span className="section-number">01 /</span> CORE EXPERTISE</p>
              <h2 id="expertise-heading">
                Comprehensive skill across the <em>full stack.</em>
              </h2>
            </div>
            <Link to="/skills" className="text-link">
              Explore technical toolkit <ArrowUpRight size={17} />
            </Link>
          </div>
        </Reveal>

        <div className="wavy-card-grid">
          {coreExpertise.map((item, index) => (
            <Reveal key={item.number} delay={index * 0.08}>
              <div className={`wavy-card wave-delay-${(index % 4) + 1}`}>
                <div className="wavy-card-header">
                  <span className="wavy-card-number">{item.number}</span>
                  <span className="wavy-card-tag">{item.tag}</span>
                </div>
                <h3 className="wavy-card-title">{item.title}</h3>
                <p className="wavy-card-desc">{item.description}</p>
                <ul className="wavy-card-points">
                  {item.points.map((pt) => (
                    <li key={pt}><span className="bullet-dot" />{pt}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Creative Development Philosophy Section */}
      <section className="philosophy-section" aria-labelledby="philosophy-heading">
        <div className="container philosophy-inner">
          <Reveal>
            <div className="philosophy-copy">
              <p className="eyebrow"><span className="section-number">02 /</span> PHILOSOPHY & VALUES</p>
              <h2 id="philosophy-heading">
                Where technical rigor meets <em>visual storytelling.</em>
              </h2>
              <p className="philosophy-text">
                I believe web experiences should never force a compromise between striking visual aesthetics and robust underlying software engineering. Every line of backend code, database query, and CSS rule should work in quiet harmony to make digital interactions feel effortless, responsive, and memorable.
              </p>
              <div className="philosophy-features">
                <div className="phil-item">
                  <Cpu size={22} className="phil-icon" />
                  <h4>Thoughtful Craft</h4>
                  <p>Choosing clear, practical approaches to interface and application development.</p>
                </div>
                <div className="phil-item">
                  <Layers3 size={22} className="phil-icon" />
                  <h4>Creative Direction</h4>
                  <p>Bringing visual ideas together with useful web functionality.</p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="philosophy-card wavy-card wave-delay-3">
              <span className="eyebrow">MY CORE PRINCIPLE</span>
              <h3>"Code with intention, design with empathy, and deliver with excellence."</h3>
              <p>
                My goal is to bring practical web development together with an expressive visual experience.
              </p>
              <div className="philosophy-badge">
                <Sparkles size={16} />
                <span>SYEDA HIRA · FULL STACK DEVELOPER</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* What I Build & How I Approach Development (Methodology) */}
      <section className="methodology-section container" aria-labelledby="methodology-heading">
        <Reveal>
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span className="section-number">03 /</span> PROCESS & APPROACH</p>
              <h2 id="methodology-heading">
                How ideas become <em>interactive reality.</em>
              </h2>
            </div>
            <Link to="/about" className="text-link">
              Read my full journey <ArrowUpRight size={17} />
            </Link>
          </div>
        </Reveal>

        <div className="methodology-grid">
          {methodologySteps.map((step, idx) => (
            <Reveal key={step.step} delay={idx * 0.08}>
              <div className={`methodology-card wavy-card wave-delay-${(idx % 4) + 1}`}>
                <span className="method-step-num">{step.step}</span>
                <h3 className="method-phase">{step.phase}</h3>
                <p className="method-summary">{step.summary}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Freelancing & Collaboration Introduction */}
      <section className="freelance-strip container" aria-labelledby="freelance-heading">
        <Reveal>
          <div className="freelance-card wavy-card wave-delay-1">
            <div className="freelance-content">
              <p className="eyebrow"><span className="section-number">04 /</span> FREELANCING & WORK</p>
              <h2 id="freelance-heading">
                Ready to build something remarkable <em>together?</em>
              </h2>
              <p>
                I welcome conversations about web development, interactive 3D, and creative digital projects. Tell me what you have in mind.
              </p>
              <div className="freelance-actions">
                <Link to="/contact" className="button button-dark" data-magnetic>
                  Start a Conversation <ArrowUpRight size={17} />
                </Link>
                <Link to="/projects" className="button button-outline" data-magnetic>
                  View My Work on Projects Page <ArrowRight size={15} />
                </Link>
              </div>
            </div>
            <div className="freelance-details">
              <div className="freelance-metric">
                <Terminal size={20} className="metric-icon" />
                <div>
                  <span className="metric-label">SPECIALIZATION</span>
                  <span className="metric-value">Full Stack & 3D Web</span>
                </div>
              </div>
              <div className="freelance-metric">
                <Compass size={20} className="metric-icon" />
                <div>
                  <span className="metric-label">BASED IN</span>
                  <span className="metric-value">Karachi, Pakistan</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Collaboration CTA Section */}
      <section className="contact-cta container" aria-labelledby="cta-heading">
        <Reveal>
          <p className="eyebrow">HAVE A PROJECT IN MIND?</p>
          <Link to="/contact" className="contact-cta-link" id="cta-heading">
            Let’s build<br /><em>something remarkable.</em>
            <span className="cta-circle"><ArrowUpRight strokeWidth={1} /></span>
          </Link>
          <div className="cta-bottom">
            <span>Good ideas start with a conversation.</span>
            <a href={profile.emailHref}>{profile.email} <ArrowUpRight size={14} /></a>
          </div>
        </Reveal>
      </section>
    </>
  );
}

