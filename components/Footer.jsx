import Link from 'next/link';
export default function Footer(){
  return <footer className="footer">
    <div className="shell footer-grid">
      <div>
        <img src="/tgm-logo.png" alt="The Growth Machine" className="footer-logo"/>
        <p>Fractional growth leadership for businesses that need clarity before another senior hire.</p>
      </div>
      <div><h4>Explore</h4><Link href="/how-it-works">How it works</Link><Link href="/ecommerce-growth">Ecommerce</Link><Link href="/b2b-saas-growth">B2B / SaaS</Link></div>
      <div><h4>Company</h4><Link href="/about">About</Link><Link href="/insights">Insights</Link><Link href="/contact">Contact</Link></div>
      <div><h4>Start here</h4><p>Not sure whether you need a CMO, CRO, GTM lead or something else?</p><Link href="/contact" className="text-link">Let’s diagnose it →</Link></div>
    </div>
    <div className="shell footer-bottom"><span>© {new Date().getFullYear()} The Growth Machine</span><span>thegrowthmachine.co</span></div>
  </footer>
}
