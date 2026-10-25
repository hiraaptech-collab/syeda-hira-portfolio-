import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function Loader({ ready, onExitStart, onExit, reducedMotion }) {
  const containerRef = useRef(null);
  const headlineRef = useRef(null);
  const taglineRef = useRef(null);
  const signatureRef = useRef(null);
  const spinnerRef = useRef(null);
  const exitStarted = useRef(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // If reduced motion or previously visited in session, skip long delay
    const hasSeenIntro = sessionStorage.getItem('sh_intro_seen');
    if (reducedMotion || hasSeenIntro) {
      setMinTimeElapsed(true);
      return;
    }

    // Keep completed intro visible for ~3 seconds on first visit
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      // Cinematic 3D text zoom & reveal sequence
      gsap.fromTo(
        headlineRef.current,
        { opacity: 0, scale: 0.88, y: 35, rotateX: 20 },
        { opacity: 1, scale: 1, y: 0, rotateX: 0, duration: 1.4, ease: 'power3.out', transformPerspective: 900 }
      );

      gsap.fromTo(
        taglineRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.1, delay: 0.6, ease: 'power2.out' }
      );

      gsap.fromTo(
        spinnerRef.current,
        { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1, duration: 0.8, delay: 0.9, ease: 'power2.out' }
      );

      gsap.fromTo(
        signatureRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.0, delay: 1.1, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  useEffect(() => {
    // Both minimum presentation time and ready trigger (or safety timeout) satisfied
    if (ready && minTimeElapsed && !exitStarted.current) {
      exitStarted.current = true;
      sessionStorage.setItem('sh_intro_seen', 'true');
      // Start the page entrance under the fade so the loader never reveals a blank hero.
      onExitStart?.();
      const exitAnim = gsap.to(containerRef.current, {
        opacity: 0,
        scale: reducedMotion ? 1 : 1.02,
        duration: reducedMotion ? 0.2 : 1.0,
        ease: 'power2.inOut',
        onComplete: onExit,
      });
      return () => exitAnim.kill();
    }
  }, [ready, minTimeElapsed, onExitStart, onExit, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="loader loader-overlay"
      role="status"
      aria-live="polite"
      aria-label="Loading Syeda Hira portfolio"
    >
      <div className="loader-backdrop-glow" aria-hidden="true" />
      <div className="loader-content">
        <p ref={headlineRef} className="loader-headline" role="heading" aria-level="2">
          Loading the Future of Code<span className="loader-dot">.</span>
        </p>
        <p ref={taglineRef} className="loader-tagline">
          Where creativity meets development.
        </p>
        
        {/* Minimal rotating circular loading indicator */}
        <div ref={spinnerRef} className="loader-spinner-wrapper" aria-hidden="true">
          <svg className="loader-circular-spinner" viewBox="0 0 50 50">
            <circle
              className="loader-spinner-track"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="2.5"
            />
            <circle
              className="loader-spinner-circle"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="2.5"
            />
          </svg>
        </div>

        <div ref={signatureRef} className="loader-signature">
          <span className="signature-pill">SYEDA HIRA · FULL STACK DEVELOPER</span>
        </div>
      </div>
    </div>
  );
}

