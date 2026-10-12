'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    ['How it works','/how-it-works'],
    ['Ecommerce','/ecommerce-growth'],
    ['B2B / SaaS','/b2b-saas-growth'],
    ['About','/about'],
    ['Insights','/insights']
  ];
  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link className="brand" href="/" aria-label="The Growth Machine home">
          <img src="/tgm-logo.png" alt="The Growth Machine" />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          <Link href="/contact" className="button button-small">Book a Growth Call</Link>
        </nav>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">
          <span/><span/>
        </button>
      </div>
      {open && <nav className="mobile-nav shell" aria-label="Mobile navigation">
        {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        <Link href="/contact" className="button" onClick={() => setOpen(false)}>Book a Growth Call</Link>
      </nav>}
    </header>
  );
}
