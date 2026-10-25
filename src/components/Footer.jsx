import { ArrowUpRight, ArrowUp, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { profile, socials } from '../data/profile';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Me' },
  { to: '/projects', label: 'Projects' },
  { to: '/skills', label: 'Skills' },
  { to: '/education', label: 'Education & Experience' },
  { to: '/contact', label: 'Contact' },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };

  return (
    <footer className="site-footer container">
      <div className="footer-main">
        <div className="footer-brand-block">
          <Link to="/" className="footer-brand">
            Syeda Hira<span>.</span>
          </Link>
          <p className="footer-subtitle">FULL STACK DEVELOPER · KARACHI, PK</p>
          <a href={profile.emailHref} className="footer-email-link">
            <Mail size={13} />
            <span>{profile.email}</span>
          </a>
        </div>

        <nav className="footer-nav" aria-label="Footer navigation">
          {navLinks.map((item) => (
            <Link key={item.to} to={item.to} className="footer-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="footer-socials">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${social.label} (opens in a new tab)`}
            >
              <span>{social.label}</span>
              <ArrowUpRight size={13} />
            </a>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Syeda Hira. Thoughtfully engineered with Three.js & Vite.</span>
        <span className="footer-location">
          <span className="tiny-dot" /> Karachi, Pakistan
        </span>
        <button onClick={scrollToTop} aria-label="Scroll back to top">
          <span>Back to top</span>
          <ArrowUp size={13} />
        </button>
      </div>
    </footer>
  );
}

