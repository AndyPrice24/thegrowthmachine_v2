import Link from 'next/link';
import SystemBlueprint from '@/components/SystemBlueprint';
import Method from '@/components/Method';
import AudienceSplit from '@/components/AudienceSplit';
import CTA from '@/components/CTA';

const roles=['CMO','CRO','GTM Lead','Head of Growth','Entrepreneur in Residence'];
export default function Home(){
  return <>
    <section className="hero section-tight"><div className="shell hero-grid">
      <div className="hero-copy">
        <span className="eyebrow">Fractional growth leadership</span>
        <h1>The growth leadership you need <em>before</em> you know which title to hire.</h1>
        <p className="lede">A senior, hands-on growth office for businesses that need some of a CMO, some of a CRO, some GTM thinking and an operator who will actually make the plan happen.</p>
        <div className="button-row"><Link className="button" href="/contact">Book a Growth Call →</Link><Link className="button button-ghost" href="/how-it-works">See how it works</Link></div>
        <div className="micro-proof"><span>Senior-led</span><span>Hands-on execution</span><span>B2B + B2C</span></div>
      </div>
      <SystemBlueprint compact/>
    </div></section>

    <section className="section role-strip"><div className="shell"><p className="role-question">You may be asking: <strong>“Do we need a…?”</strong></p><div className="role-list">{roles.map(r=><span key={r}>{r}</span>)}</div><p className="role-answer">We start one level above the job title: <strong>what does the business actually need to grow?</strong></p></div></section>

    <section className="section"><div className="shell split-heading"><div><span className="eyebrow">The problem with hiring the title first</span><h2>Growth rarely lives neatly inside one job description.</h2></div><div><p>When growth gets complicated, hiring a single functional leader too early can lock the business into the wrong diagnosis. We step in fractionally, determine the hierarchy of needs, and build the roadmap before you commit to the permanent org chart.</p></div></div></section>

    <section className="section section-ink"><div className="shell"><div className="section-heading light"><span className="eyebrow inverse">Two commercial worlds. One growth system.</span><h2>Different routes to growth. The same need for senior judgement.</h2></div><AudienceSplit/></div></section>

    <section className="section"><div className="shell"><div className="section-heading"><span className="eyebrow">How The Growth Machine works</span><h2>Strategy only matters if someone makes it happen.</h2><p>We diagnose the whole commercial system, choose the few things that matter most, implement them with your team, and leave the business easier to run.</p></div><Method/></div></section>

    <section className="section section-soft"><div className="shell"><div className="split-heading"><div><span className="eyebrow">Three ways to engage</span><h2>Start with clarity. Add execution where it creates value.</h2></div><p>Most relationships begin with a defined diagnostic or focused mandate, then expand only if the work justifies it.</p></div><div className="offer-grid">
      <article className="offer-card"><span>01</span><h3>Machine Check</h3><p>A senior diagnostic across growth, GTM, sales, marketing, ecommerce, data, systems and team. Leave with the hierarchy of problems and a prioritised roadmap.</p><Link href="/contact">Start here →</Link></article>
      <article className="offer-card featured"><span>02</span><h3>Growth Sprint</h3><p>A focused mandate to solve and implement a specific commercial growth challenge—from GTM and sales to ecommerce, conversion or operating model.</p><Link href="/contact">Discuss a sprint →</Link></article>
      <article className="offer-card"><span>03</span><h3>Fractional Growth Office</h3><p>Ongoing senior leadership across the growth function without prematurely hiring the wrong full-time executive. We own the roadmap with you.</p><Link href="/contact">Explore fractional leadership →</Link></article>
    </div></div></section>

    <section className="section"><div className="shell proof-shell"><div><span className="eyebrow">Selected experience</span><h2>Senior operators, not a junior delivery team.</h2><p>Client names and reference brands will be added as permissions are confirmed. The final site will use real experience only—no invented logos or results.</p></div><div className="placeholder-logos">{['Reference brand 01','Reference brand 02','Reference brand 03','Reference brand 04'].map(x=><div key={x}>{x}</div>)}</div></div></section>

    <section className="section section-ink"><div className="shell founders-preview"><div><span className="eyebrow inverse">Two senior operators. One growth mandate.</span><h2>Commercial architecture meets consumer and ecommerce depth.</h2></div><div className="founder-cols"><article><h3>Andrew</h3><p>Business design, revenue models, B2B GTM, sales, systems, operating models and founder-level execution.</p></article><article><h3>Tarren</h3><p>Consumer insight, brand, FMCG, trade marketing, ecommerce, data, performance and DTC growth systems.</p></article></div><Link className="light-link" href="/about">Meet the founders →</Link></div></section>

    <section className="section"><div className="shell"><div className="section-heading"><span className="eyebrow">Insights</span><h2>Thinking for founders building the next stage.</h2></div><div className="insight-grid">
      {[
        ['Do you actually need a CMO—or is that the wrong diagnosis?','The question to ask before committing to a senior marketing hire.','/insights/do-you-need-a-cmo'],
        ['Founder-led growth has a ceiling. What comes next?','How to move from intuition and heroics to a repeatable commercial system.','/insights/founder-led-growth-ceiling'],
        ['Hire the roadmap before you hire the role.','Why the best next executive hire often becomes obvious after the growth system is designed.','/insights/hire-the-roadmap-first']
      ].map(([t,d,h])=><article className="insight-card" key={t}><span>Growth note</span><h3>{t}</h3><p>{d}</p><Link href={h}>Read →</Link></article>)}
    </div></div></section>
    <CTA/>
  </>
}
