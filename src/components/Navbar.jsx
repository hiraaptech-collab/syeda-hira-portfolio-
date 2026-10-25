import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const navigation = [
  ['/', 'Home'],
  ['/about', 'About Me'],
  ['/projects', 'Projects'],
  ['/skills', 'Skills'],
  ['/education', 'Education & Experience'],
  ['/contact', 'Contact'],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const toggle = useRef(null);
  const panel = useRef(null);
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 18));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event) => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
      if (event.key !== 'Tab') return;
      const nodes = [toggle.current, ...panel.current.querySelectorAll('a')];
      const first = nodes[0];
      const last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const media = window.matchMedia('(min-width: 1101px)');
    const closeOnDesktop = () => { if (media.matches) setOpen(false); };
    media.addEventListener('change', closeOnDesktop);
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', handleKey); media.removeEventListener('change', closeOnDesktop); };
  }, [open]);
  return <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
    <div className="nav-inner">
      <Link to="/" className="brand" aria-label="Syeda Hira home">sh<span>.</span><span className="brand-caption">SYEDA HIRA</span></Link>
      <nav aria-label="Main navigation" className="desktop-nav">
        {navigation.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
      </nav>
      <NavLink className="nav-contact" to="/contact" data-magnetic aria-label="Hire Me, go to Contact">Hire Me <ArrowUpRight size={14} /></NavLink>
      <button ref={toggle} className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X size={23} /> : <Menu size={23} />}</button>
    </div>
    {open && <nav ref={panel} id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">
      <span className="eyebrow">A LITTLE EXPLORATION</span>
      {navigation.map(([to, label], i) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}><span className="mobile-index">0{i + 1}</span>{label}<ArrowUpRight size={22} /></NavLink>)}
      <NavLink className="mobile-hire-link" to="/contact" onClick={() => setOpen(false)}>Hire Me <ArrowUpRight size={19} /></NavLink>
      <p>Thoughtfully built in Karachi, Pakistan.</p>
    </nav>}
  </header>;
}
