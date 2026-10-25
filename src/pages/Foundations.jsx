import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import {
  ArrowUpRight, ArrowRight, Mail, Phone, MapPin,
  ExternalLink, Layers, Database, Code, Globe, Terminal,
  Cpu, Award, Calendar, GraduationCap, Briefcase, Check, Copy, Sparkles
} from 'lucide-react'
import ProjectCard from '../components/ProjectCard'
import Reveal from '../components/Reveal'
import { projects } from '../data/projects'
import { skillGroups } from '../data/skills'
import { education, experience, certificates } from '../data/education'
import { profile, socials } from '../data/profile'
import SceneBoundary from '../components/SceneBoundary'

const ProjectsScene = lazy(() => import('../components/three/ShowcaseScenes').then(module => ({ default: module.ProjectsScene })))
const ContactScene = lazy(() => import('../components/three/ShowcaseScenes').then(module => ({ default: module.ContactScene })))
const AboutScene = lazy(() => import('../components/three/ShowcaseScenes').then(module => ({ default: module.AboutScene })))
const SkillsScene = lazy(() => import('../components/three/ShowcaseScenes').then(module => ({ default: module.SkillsScene })))
const EducationScene = lazy(() => import('../components/three/ShowcaseScenes').then(module => ({ default: module.EducationScene })))

function PageIntro({ eyebrow, title, children, variant = '', reducedMotion = false }) {
  const titleRef = useRef(null)
  useEffect(() => {
    if (reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !['about', 'projects', 'skills', 'education', 'contact'].includes(variant) || !titleRef.current) return
    const words = titleRef.current.querySelectorAll('.page-title-word')
    const tween = gsap.fromTo(words, { y: 24, z: -60, opacity: 0, rotateX: 16, rotateY: -3, transformPerspective: 850 }, { y: 0, z: 0, opacity: 1, rotateX: 0, rotateY: 0, stagger: 0.075, duration: 0.95, ease: 'power3.out', clearProps: 'transform,opacity' })
    return () => tween.kill()
  }, [reducedMotion, title, variant])
  return (
    <section className={`page-intro page-intro--${variant}`} data-cinematic-hero={variant || 'not-found'}>
      <Reveal className="page-intro-content">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title" ref={titleRef}>
          {['about', 'projects', 'skills', 'education', 'contact'].includes(variant) ? title.split(' ').map((word, index, words) => <Fragment key={`${word}-${index}`}><span className="page-title-word">{word}</span>{index < words.length - 1 ? ' ' : ''}</Fragment>) : title}
        </h1>
        {children && <p className="page-lead">{children}</p>}
      </Reveal>
    </section>
  )
}

/* =========================================================================
   PAGE 2: ABOUT ME
   ========================================================================= */
export function AboutPage({ reducedMotion = false }) {
  return (
    <div className="page-shell">
      <PageIntro variant="about" reducedMotion={reducedMotion} eyebrow="ABOUT ME / 01" title="Curious by nature. Full Stack Developer by passion.">
        {profile.about[0]}
      </PageIntro>

      <Suspense fallback={<div className="phase1-scene-fallback" role="status">Preparing the About scene…</div>}>
        <SceneBoundary><AboutScene reducedMotion={reducedMotion} /></SceneBoundary>
      </Suspense>

      {/* Main Narrative Split */}
      <div className="about-narrative-grid">
        <Reveal className="wavy-card wave-delay-1 about-card">
          <span className="eyebrow">DEVELOPMENT JOURNEY</span>
          <h2>From curiosity to full-stack code.</h2>
          <p>{profile.about[1]}</p>
          <p>{profile.about[2]}</p>
          <div className="narrative-quote">
            <p>"{profile.about[3]}"</p>
          </div>
          <Link className="text-link" to="/projects">
            Explore my verified projects <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </Reveal>

        <Reveal className="wavy-card wave-delay-2 about-card">
          <span className="eyebrow">CREATIVE THINKING & DESIGN</span>
          <h2>Where aesthetics meet engineering.</h2>
          <p>
            I approach digital development through a holistic lens. Rather than treating frontend styling and backend architectures as separate worlds, I design workflows that seamlessly bridge visual atmosphere with reliable data pipelines.
          </p>
          <div className="about-pillars">
            <div className="pillar-item">
              <h4>01 / Editorial Aesthetics</h4>
              <p>Muted palettes of greige, sage, and deep royal navy with careful typographic balance.</p>
            </div>
            <div className="pillar-item">
              <h4>02 / Robust Backend Foundations</h4>
              <p>Structured PHP, Laravel, Node.js services and clean relational database schemas.</p>
            </div>
            <div className="pillar-item">
              <h4>03 / Spatial 3D Interactivity</h4>
              <p>Engaging Three.js and WebGL viewports engineered with smooth GPU memory cleanup.</p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Philosophy & Growth Grid */}
      <div className="about-details-grid">
        <Reveal className="wavy-card wave-delay-3 foundation-card">
          <span className="eyebrow">WORKING PHILOSOPHY</span>
          <h3>Code with intention, deliver with empathy.</h3>
          <p>
            Every interface I write is built to be fast, accessible, and intuitive. I believe software should serve real human needs without visual clutter or unnecessary technical friction.
          </p>
          <ul className="about-checklist">
            <li><span className="bullet-dot" /> Clean and maintainable component architectures</li>
            <li><span className="bullet-dot" /> Mobile-first responsive layouts with zero horizontal scroll</li>
            <li><span className="bullet-dot" /> Respect for user motion preferences and fast page loads</li>
          </ul>
        </Reveal>

        <Reveal className="wavy-card wave-delay-4 foundation-card">
          <span className="eyebrow">FUTURE GOALS & CONTINUOUS GROWTH</span>
          <h3>Always building. Always advancing.</h3>
          <p>
            Currently studying Information System Management at Aptech Computer Education while continuing Intermediate studies in Computer Science.
          </p>
          <p>
            My goal is to continue engineering meaningful full-stack platforms and immersive digital experiences that push creative web standards forward.
          </p>
          <Link className="text-link" to="/contact">
            Let's connect & collaborate <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </div>
  )
}

/* =========================================================================
   PAGE 3: PROJECTS (SHOWCASING ONLY THE 4 ACTUAL PROJECTS)
   ========================================================================= */
export function ProjectsPage({ reducedMotion = false }) {
  const [filter, setFilter] = useState('all')

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(p => p.category.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="page-shell">
      <PageIntro variant="projects" eyebrow="SELECTED WORK / 01—04" title="Original projects, brought to life.">
        Four projects, with original screenshots and links to their live websites.
      </PageIntro>

      <Suspense fallback={<div className="phase1-scene-fallback" role="status">Preparing the project scene…</div>}>
        <SceneBoundary><ProjectsScene reducedMotion={reducedMotion} /></SceneBoundary>
      </Suspense>

      {/* Category Filter Pills */}
      <div className="project-filter-bar">
        {['all', 'Entertainment', '3D & Architecture', 'Fashion', 'Health'].map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat === 'all' ? 'All Projects (4)' : cat}
          </button>
        ))}
      </div>

      {/* Dedicated Project Cards Grid with Original Screenshots */}
      <div className="project-grid">
        {filteredProjects.map((project, index) => (
          <Reveal key={project.id} delay={index * 0.08}>
            <ProjectCard project={project} index={index} />
          </Reveal>
        ))}
      </div>

      <div className="project-footer-note">
        <p>
          Fan Hub, Architecture 3D, Lumière, and FitFusion.
        </p>
      </div>
    </div>
  )
}

/* =========================================================================
   PAGE 4: SKILLS
   ========================================================================= */
const groupIcons = {
  'Frontend': <Code size={20} className="skill-cat-icon" />,
  'Backend': <Cpu size={20} className="skill-cat-icon" />,
  'Databases': <Database size={20} className="skill-cat-icon" />,
  '3D & Animation': <Layers size={20} className="skill-cat-icon" />,
  'Development Tools': <Terminal size={20} className="skill-cat-icon" />,
  'Deployment': <Globe size={20} className="skill-cat-icon" />,
}

export function SkillsPage({ reducedMotion = false }) {
  const [activeCategory, setActiveCategory] = useState('All')

  const displayedGroups = activeCategory === 'All'
    ? skillGroups
    : skillGroups.filter(g => g.title === activeCategory)

  return (
    <div className="page-shell">
      <PageIntro variant="skills" reducedMotion={reducedMotion} eyebrow="TECHNICAL CAPABILITIES / 06 DOMAINS" title="A versatile full-stack foundation.">
        From responsive user interfaces and interactive 3D WebGL viewports to server-side backend logic and relational database systems.
      </PageIntro>

      <Suspense fallback={<div className="phase1-scene-fallback" role="status">Preparing the Skills scene…</div>}>
        <SceneBoundary><SkillsScene reducedMotion={reducedMotion} /></SceneBoundary>
      </Suspense>

      <div className="skills-filter-row">
        {['All', 'Frontend', 'Backend', 'Databases', '3D & Animation', 'Development Tools', 'Deployment'].map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="skills-grid">
        {displayedGroups.map((group, index) => (
          <Reveal key={group.title} delay={index * 0.06} className={`wavy-card wave-delay-${(index % 4) + 1} skill-card`}>
            <div className="skill-card-top">
              <div className="skill-icon-wrap">
                {groupIcons[group.title] || <Code size={20} />}
              </div>
              <span className="skill-num">0{index + 1}</span>
            </div>
            <h2 className="skill-group-title">{group.title}</h2>
            <div className="skill-tags">
              {group.skills.map((skill) => (
                <span className="tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </Reveal>
        ))}
      </div>

      <div className="skills-note-card wavy-card wave-delay-2">
        <Sparkles size={20} className="note-sparkle" />
        <div>
          <h3>Full Stack Developer Identity</h3>
          <p>
            My core focus is full-stack versatility. Rather than confining myself to a single framework or frontend layer, I balance complete end-to-end development from database design to spatial WebGL user interactions.
          </p>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   PAGE 5: EDUCATION & EXPERIENCE
   ========================================================================= */
export function EducationPage({ reducedMotion = false }) {
  return (
    <div className="page-shell">
      <PageIntro variant="education" reducedMotion={reducedMotion} eyebrow="ACADEMIC & PROFESSIONAL BACKGROUND" title="Always learning. Always building.">
        My educational foundation in Computer Science, Information System Management diploma studies, professional freelance experience, and certifications.
      </PageIntro>

      <Suspense fallback={<div className="phase1-scene-fallback" role="status">Preparing the Education scene…</div>}>
        <SceneBoundary><EducationScene reducedMotion={reducedMotion} /></SceneBoundary>
      </Suspense>

      <div className="education-experience-grid">
        {/* Education Timeline */}
        <Reveal className="wavy-card wave-delay-1 foundation-card">
          <div className="card-header-icon">
            <GraduationCap size={22} className="header-icon" />
            <div>
              <p className="eyebrow">THE FOUNDATION</p>
              <h2>Education</h2>
            </div>
          </div>

          <div className="timeline">
            {education.map((item) => (
              <article key={item.id} className="timeline-item">
                <span className="tag timeline-badge">{item.status}</span>
                <h3>{item.title}</h3>
                {item.institution && <p className="timeline-inst">{item.institution}</p>}
                {item.detail && <p className="timeline-detail">{item.detail}</p>}
                {item.subdetail && <p className="timeline-subdetail">{item.subdetail}</p>}
              </article>
            ))}
          </div>
        </Reveal>

        {/* Experience Timeline */}
        <Reveal className="wavy-card wave-delay-2 foundation-card">
          <div className="card-header-icon">
            <Briefcase size={22} className="header-icon" />
            <div>
              <p className="eyebrow">PRACTICAL APPLICATION</p>
              <h2>Experience</h2>
            </div>
          </div>

          <div className="timeline">
            {experience.map((item) => (
              <article key={item.id} className="timeline-item">
                <span className="tag timeline-badge">Professional</span>
                <h3>{item.title}</h3>
                <p className="timeline-inst">{item.organization}</p>
                {item.description && <p className="timeline-detail">{item.description}</p>}
              </article>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Extensible Certificate Gallery */}
      <Reveal className="wavy-card wave-delay-3 cert-section-card">
        <div className="cert-header">
          <div className="card-header-icon">
            <Award size={22} className="header-icon" />
            <div>
              <p className="eyebrow">VERIFIED ACHIEVEMENTS</p>
              <h2>Certifications & Participation</h2>
            </div>
          </div>
          <span className="cert-count">{certificates.length} Certificate Verified</span>
        </div>

        <div className="cert-gallery-grid">
          {certificates.map((cert) => (
            <div key={cert.id} className="cert-card">
              <div className="cert-badge-row">
                <span className="tag cert-tag">Certificate of Participation</span>
                <span className="cert-date">
                  <Calendar size={12} /> {cert.date}
                </span>
              </div>
              <h3 className="cert-title">{cert.title}</h3>
              <p className="cert-event">{cert.event}</p>
              <p className="cert-issuer">Issued by: <strong>{cert.issuer}</strong></p>
              <p className="cert-recipient">Recipient: <strong>{cert.recipient}</strong></p>
              {cert.assetUrl && (
                <a
                  className="button button-outline cert-link"
                  href={cert.assetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>View Original Certificate</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  )
}

/* =========================================================================
   PAGE 6: CONTACT
   ========================================================================= */
export function ContactPage({ reducedMotion = false }) {
  const [copied, setCopied] = useState(false)

  const copyEmail = () => {
    navigator.clipboard?.writeText(profile.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div className="page-shell">
      <PageIntro variant="contact" eyebrow="HIRE ME / LET’S COLLABORATE" title="Let's Build Something Extraordinary.">
        Your vision. My code. Endless possibilities.
      </PageIntro>

      <p className="contact-hero-support">Turning bold ideas into digital reality. From concept to code, let's create something remarkable.</p>

      <Suspense fallback={<div className="phase1-scene-fallback" role="status">Preparing the collaboration scene…</div>}>
        <SceneBoundary><ContactScene reducedMotion={reducedMotion} /></SceneBoundary>
      </Suspense>

      <div className="contact-grid">
        {/* Direct Channels */}
        <Reveal className="wavy-card wave-delay-1 foundation-card">
          <p className="eyebrow">DIRECT CONTACT CHANNELS</p>
          <h2>Start a conversation.</h2>

          <div className="contact-links-list">
            <div className="contact-item">
              <a className="contact-link" href={profile.emailHref}>
                <Mail aria-hidden="true" size={20} />
                <span>{profile.email}</span>
                <ArrowUpRight aria-hidden="true" size={17} />
              </a>
              <button
                className="copy-btn"
                onClick={copyEmail}
                aria-label="Copy email address"
                title="Copy email address"
              >
                {copied ? <Check size={14} className="copied-check" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="contact-item">
              <a className="contact-link" href={profile.phoneHref}>
                <Phone aria-hidden="true" size={20} />
                <span>{profile.phone}</span>
                <ArrowUpRight aria-hidden="true" size={17} />
              </a>
            </div>

            <div className="contact-item">
              <div className="contact-link static-link">
                <MapPin aria-hidden="true" size={20} />
                <span>{profile.location}</span>
                <span className="live-status-pill"><span className="tiny-dot" /> Active</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Social Channels (Strictly Verified, No LinkedIn) */}
        <Reveal className="wavy-card wave-delay-2 foundation-card">
          <p className="eyebrow">ONLINE PRESENCE</p>
          <h2>Stay connected.</h2>
          <p className="social-subtext">
            Find me on GitHub, Instagram, and Facebook.
          </p>

          <div className="social-cards-list">
            {socials.map((social) => (
              <a
                className="social-row-link"
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
              >
                <div className="social-row-info">
                  <span className="social-label">{social.label}</span>
                  <span className="social-handle">{social.url.replace('https://', '')}</span>
                </div>
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Collaboration Callout */}
      <Reveal delay={0.1} className="wavy-card wave-delay-3 contact-callout">
        <div className="callout-content">
          <span className="eyebrow">COLLABORATION NOTICE</span>
          <h3>Looking for a dedicated Full Stack Developer?</h3>
          <p>
            Creative thinking. Powerful development. Let's turn your next big idea into an unforgettable experience.
          </p>
        </div>
        <a href={profile.emailHref} className="button button-dark" data-magnetic>
          <span>Send an Email</span>
          <ArrowUpRight size={17} />
        </a>
      </Reveal>
    </div>
  )
}

/* =========================================================================
   404 NOT FOUND
   ========================================================================= */
export function NotFoundPage() {
  return (
    <div className="page-shell">
      <PageIntro eyebrow="404 / PAGE NOT FOUND" title="A little off the path.">
        This page couldn't be located. Let's get you back to the main journey.
      </PageIntro>
      <Link className="button button-dark" to="/">
        <span>Back to home</span>
        <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </div>
  )
}

