import { useEffect } from 'react';

export function FloatingMotion() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        target.classList.toggle('is-in-view', isIntersecting);
      });
    }, { rootMargin: '80px 0px', threshold: 0 });

    const observeCards = (root) => {
      if (root instanceof Element && root.matches('.wavy-card')) observer.observe(root);
      root.querySelectorAll?.('.wavy-card').forEach((card) => observer.observe(card));
    };

    observeCards(document);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof Element) observeCards(node);
      }));
    });
    mutations.observe(document.getElementById('root'), { childList: true, subtree: true });

    return () => { mutations.disconnect(); observer.disconnect(); };
  }, []);

  return null;
}

export function ScrollProgress() {
  useEffect(() => {
    const bar = document.querySelector('.scroll-progress-bar');
    if (!bar) return undefined;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return <div className="scroll-progress-track" aria-hidden="true"><span className="scroll-progress-bar" /></div>;
}
