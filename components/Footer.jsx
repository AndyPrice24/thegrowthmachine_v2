'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONTACT_EMAIL } from '@/app/site';

export default function Footer(){
  // The homepage ends at the choice between the two growth systems, so it
  // has no footer: nothing should suggest the site ends there.
  if (usePathname() === '/') return null;
  return <footer className="footer">
    <div className="shell footer-grid">
      <div>
        <img src="/brand/tgm-logo-white.svg" alt="The Growth Machine" className="footer-logo"/>
        <p>Fractional growth leadership for businesses that need clarity before another senior hire.</p>
      </div>
      <div><h4>Explore</h4><Link href="/how-it-works">How it works</Link><Link href="/ecommerce">Ecommerce</Link><Link href="/b2b">B2B / SaaS</Link></div>
      <div><h4>Company</h4><Link href="/about">About</Link><Link href="/contact">Contact</Link></div>
      <div><h4>Start here</h4><p>It starts with a free call about where your business is going.</p><Link href="/contact" className="text-link">Book a growth call →</Link></div>
    </div>
    <div className="shell footer-bottom"><span>© {new Date().getFullYear()} The Growth Machine (Pty) Ltd</span><nav aria-label="Legal"><Link href="/privacy">Privacy policy</Link><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></nav></div>
  </footer>
}
