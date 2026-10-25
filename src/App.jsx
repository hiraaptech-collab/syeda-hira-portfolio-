import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loader from './components/Loader';
import CustomCursor from './components/CustomCursor';
import { FloatingMotion, ScrollProgress } from './components/MotionDetails';
import Home from './pages/Home';
import useMediaQuery from './hooks/useMediaQuery';
import { syncPageSeo } from './seo';

const foundation = (name) => lazy(() => import('./pages/Foundations').then(module => ({ default: module[name] })));
const AboutPage = foundation('AboutPage');
const ProjectsPage = foundation('ProjectsPage');
const SkillsPage = foundation('SkillsPage');
const EducationPage = foundation('EducationPage');
const ContactPage = foundation('ContactPage');
const NotFoundPage = foundation('NotFoundPage');
export default function App() {
  const location = useLocation();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [fontsLoaded, setFontsLoaded] = useState(0);
  const [sceneReady, setSceneReady] = useState(location.pathname !== '/');
  const [sceneProgress, setSceneProgress] = useState(location.pathname !== '/' ? 100 : 0);
  const [deadline, setDeadline] = useState(false);
  const [entered, setEntered] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const onSceneReady = useCallback(() => { setSceneReady(true); setSceneProgress(100); }, []);
  const onExitStart = useCallback(() => {
    if (location.pathname === '/') setEntered(true);
  }, [location.pathname]);
  const onExit = useCallback(() => { setEntered(true); setLoaderVisible(false); }, []);
  useEffect(() => {
    let mounted = true;
    if (!document.fonts) { setFontsLoaded(3); return; }
    ['400 1em "DM Sans"', '400 1em "Cormorant Garamond"', 'italic 500 1em "Cormorant Garamond"'].forEach(font => {
      document.fonts.load(font).catch(() => {}).finally(() => { if (mounted) setFontsLoaded(count => count + 1); });
    });
    const timer = setTimeout(() => setDeadline(true), 7000);
    return () => { mounted = false; clearTimeout(timer); };
  }, []);
  useEffect(() => {
    const original = document.body.style.overflow;
    if (!entered) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [entered]);
  useEffect(() => {
    let frame = 0;
    const syncViewportWidth = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--layout-viewport-width', `${document.body.getBoundingClientRect().width}px`);
      });
    };
    syncViewportWidth();
    window.addEventListener('resize', syncViewportWidth, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', syncViewportWidth);
      document.documentElement.style.removeProperty('--layout-viewport-width');
    };
  }, [entered]);
  useEffect(() => {
    syncPageSeo(location.pathname);
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (entered) document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [location.pathname, entered]);
  const ready = (fontsLoaded >= 3 && sceneReady) || deadline;
  return <>
    <a className="skip-link" href="#main-content" tabIndex={entered ? 0 : -1}>Skip to content</a>
    {loaderVisible && <Loader ready={ready} progress={(Math.min(fontsLoaded, 3) + sceneProgress / 100) / 4} onExitStart={onExitStart} onExit={onExit} reducedMotion={reducedMotion} />}
    <ScrollProgress />
    <FloatingMotion />
    <div className="site-content" inert={!entered}>
    <div className="starfield" aria-hidden="true" />
    <Navbar />
    <main id="main-content" tabIndex={-1}>
      <Suspense fallback={<div className="route-loading" role="status">Opening page<span className="loading-dots">…</span></div>}>
        <div className="route-transition" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home entered={entered} onSceneReady={onSceneReady} onSceneProgress={setSceneProgress} reducedMotion={reducedMotion} />} />
          <Route path="/about" element={<AboutPage reducedMotion={reducedMotion} />} />
          <Route path="/projects" element={<ProjectsPage reducedMotion={reducedMotion} />} />
          <Route path="/skills" element={<SkillsPage reducedMotion={reducedMotion} />} />
          <Route path="/education" element={<EducationPage reducedMotion={reducedMotion} />} />
          <Route path="/contact" element={<ContactPage reducedMotion={reducedMotion} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </div>
      </Suspense>
    </main>
    <Footer /></div><CustomCursor />
  </>;
}
