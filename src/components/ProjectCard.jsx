import { useEffect, useRef } from 'react';
import { ArrowUpRight, CheckCircle2, Globe } from 'lucide-react';
import gsap from 'gsap';
import useMediaQuery from '../hooks/useMediaQuery';

export default function ProjectCard({ project, index = 0 }) {
  const ref = useRef(null);
  const canTilt = useMediaQuery('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

  useEffect(() => {
    const card = ref.current;
    if (!canTilt) gsap.set(card, { clearProps: 'transform' });
    return () => {
      gsap.killTweensOf(card);
      gsap.set(card, { clearProps: 'transform' });
    };
  }, [canTilt]);

  const move = (event) => {
    if (!canTilt || !ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left - bounds.width / 2) / bounds.width;
    const y = (event.clientY - bounds.top - bounds.height / 2) / bounds.height;
    gsap.to(ref.current, {
      rotateX: -y * 6,
      rotateY: x * 6,
      duration: 0.45,
      ease: 'power2.out',
      transformPerspective: 1100,
      overwrite: 'auto',
    });
  };

  const reset = () => {
    if (canTilt && ref.current) {
      gsap.to(ref.current, { rotateX: 0, rotateY: 0, duration: 0.65, ease: 'power2.out' });
    }
  };

  return (
    <article
      className={`project-card wavy-card wave-delay-${(index % 4) + 1}`}
      ref={ref}
      onPointerMove={move}
      onPointerLeave={reset}
    >
      <a
        href={project.url}
        className="project-cover"
        target="_blank"
        rel="noopener noreferrer"
        data-cursor="view"
        aria-label={`View live ${project.title} website (opens in a new tab)`}
      >
        <div className="project-screenshot-wrapper">
          <img
            src={project.screenshot}
            loading="lazy"
            alt={`${project.title} homepage screenshot`}
            className="project-screenshot-img"
          />
          <div className="project-screenshot-overlay">
            <span className="live-preview-pill">
              <Globe size={13} /> LIVE WEB APPLICATION
            </span>
          </div>
        </div>
      </a>

      <div className="project-body">
        <div className="project-meta">
          <span className="eyebrow project-cat-tag">{project.category}</span>
          <span className="project-number">PROJECT 0{project.number}</span>
        </div>

        <div className="project-heading">
          <h3>
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              {project.title}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </h3>
        </div>

        {project.subtitle && (
          <p className="project-subtitle">{project.subtitle}</p>
        )}

        <p className="project-desc">{project.description}</p>

        {project.features && project.features.length > 0 && (
          <div className="project-features-list">
            <span className="features-label">VERIFIED HIGHLIGHTS</span>
            <ul>
              {project.features.map((feat) => (
                <li key={feat}>
                  <CheckCircle2 size={13} className="feature-check" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {project.technologies && project.technologies.length > 0 && (
          <div className="project-tech-tags">
            {project.technologies.map((tech) => (
              <span key={tech} className="tech-badge">{tech}</span>
            ))}
          </div>
        )}

        <div className="project-action-row">
          <a
            href={project.url}
            className="button button-dark project-live-button"
            target="_blank"
            rel="noopener noreferrer"
            data-magnetic
          >
            <span>View Live Project</span>
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </article>
  );
}

