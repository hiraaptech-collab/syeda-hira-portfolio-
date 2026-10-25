import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import useMediaQuery from '../hooks/useMediaQuery';

export default function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  useEffect(() => {
    if (reducedMotion) return;
    let tween;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const element = ref.current;
      const projectImage = element.querySelector('.project-screenshot-img');
      const type = element.querySelector('.project-card') ? 'project'
        : element.classList.contains('skill-card') ? 'skill'
          : element.classList.contains('contact-callout') ? 'callout'
            : element.classList.contains('foundation-card') ? 'foundation' : 'editorial';
      const direction = Math.floor(delay / 0.08) % 2 ? 1 : -1;
      const from = type === 'project'
        ? { y: 46, z: -90, rotateY: direction * 7, scale: .95, opacity: 0, transformPerspective: 1100 }
        : type === 'skill'
          ? { y: 38, z: -65, rotateX: -7, scale: .96, opacity: 0, transformPerspective: 1000 }
          : type === 'foundation'
            ? { x: direction * 36, z: -45, rotateY: direction * 3, opacity: 0, transformPerspective: 950 }
            : type === 'callout'
              ? { x: -44, z: -80, rotateY: 5, scale: .97, opacity: 0, transformPerspective: 1050 }
              : { y: 30, z: -35, opacity: 0, transformPerspective: 900 };
      tween = gsap.fromTo(element, from, {
        x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, scale: 1, opacity: 1,
        duration: type === 'project' ? 1.05 : .88, delay, ease: 'power3.out', clearProps: 'transform,opacity',
        onComplete: () => element.dataset.revealed = 'true',
      });
      if (projectImage) gsap.fromTo(projectImage,
        { scale: 1.12, clipPath: 'inset(0 9% 0 9%)' },
        { scale: 1, clipPath: 'inset(0 0% 0 0%)', duration: 1.2, delay: delay + .08, ease: 'power2.out', clearProps: 'clipPath' },
      );
      observer.disconnect();
    }, { threshold: .08 });
    observer.observe(ref.current);
    return () => { observer.disconnect(); tween?.revert(); if (ref.current) gsap.killTweensOf(ref.current.querySelector('.project-screenshot-img')); };
  }, [reducedMotion, delay]);
  return <div ref={ref} className={className}>{children}</div>;
}
