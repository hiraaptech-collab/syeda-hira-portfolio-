import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import useMediaQuery from '../hooks/useMediaQuery';

export default function CustomCursor() {
  const enabled = useMediaQuery('(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)');
  const dot = useRef(null);
  const ring = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    const cursor = ring.current;
    const pointer = dot.current;
    const x = gsap.quickTo(cursor, 'x', { duration: .25, ease: 'power3.out' });
    const y = gsap.quickTo(cursor, 'y', { duration: .25, ease: 'power3.out' });
    let magnetic;
    const move = (event) => {
      gsap.set(pointer, { x: event.clientX, y: event.clientY });
      x(event.clientX); y(event.clientY);
      cursor.style.opacity = '1'; pointer.style.opacity = '1';
      const card = event.target.closest('[data-cursor="view"]');
      cursor.classList.toggle('is-view', Boolean(card));
      cursor.classList.toggle('is-link', Boolean(event.target.closest('a,button')));
      const target = event.target.closest('[data-magnetic]');
      if (magnetic && magnetic !== target) gsap.to(magnetic, { x: 0, y: 0, duration: .4 });
      magnetic = target;
      if (target) {
        const bounds = target.getBoundingClientRect();
        gsap.to(target, { x: (event.clientX - bounds.left - bounds.width / 2) * .1, y: (event.clientY - bounds.top - bounds.height / 2) * .14, duration: .35, overwrite: 'auto' });
      }
    };
    const leave = () => { cursor.style.opacity = '0'; pointer.style.opacity = '0'; if (magnetic) gsap.to(magnetic, { x: 0, y: 0 }); };
    document.addEventListener('pointermove', move);
    document.documentElement.addEventListener('pointerleave', leave);
    return () => { document.removeEventListener('pointermove', move); document.documentElement.removeEventListener('pointerleave', leave); x.tween.kill(); y.tween.kill(); if (magnetic) { gsap.killTweensOf(magnetic); gsap.set(magnetic, { clearProps: 'transform' }); } };
  }, [enabled]);
  if (!enabled) return null;
  return <div className="custom-cursor" aria-hidden="true"><span ref={dot} className="cursor-dot" /><span ref={ring} className="cursor-ring"><span>View</span></span></div>;
}
