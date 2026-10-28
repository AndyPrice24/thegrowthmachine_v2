'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { HOME_ROUTES, goToJourney } from './JourneyStart';

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // The journey links land on the journey itself, not the top of the page.
  const linkProps = (href, close) => {
    const journey = href === '/b2b' || href === '/ecommerce';
    if (!journey) return { onClick: close };
    const go = goToJourney(pathname, href);
    return {
      scroll: !HOME_ROUTES.includes(pathname),
      onClick: (event) => { go(event); close && close(); },
    };
  };
  const links = [
    ['How it works','/how-it-works'],
    ['Ecommerce','/ecommerce'],
    ['B2B / SaaS','/b2b'],
    ['About','/about']
  ];
  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link className="brand" href="/" aria-label="The Growth Machine home">
          <img src="/brand/tgm-logo.svg" alt="The Growth Machine" />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => <Link key={href} href={href} {...linkProps(href)}>{label}</Link>)}
          <Link href="/contact" className="button button-small">Book a Growth Call</Link>
        </nav>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">
          <span/><span/>
        </button>
      </div>
      {open && <nav className="mobile-nav shell" aria-label="Mobile navigation">
        {links.map(([label, href]) => <Link key={href} href={href} {...linkProps(href, () => setOpen(false))}>{label}</Link>)}
        <Link href="/contact" className="button" onClick={() => setOpen(false)}>Book a Growth Call</Link>
      </nav>}
    </header>
  );
}
