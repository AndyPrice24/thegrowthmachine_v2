import Link from 'next/link';
import Method from '@/components/Method';

/*
 * Stand-ins for the parts of each journey still to be designed. Both the B2B
 * and ecommerce journeys show these after their own opening section; replace
 * them per journey as the tailored sections arrive.
 */
export function JourneyStandIns(){
  return <>
    <section className="v2-method section">
      <div className="shell">
        <div className="v2-section-intro dark">
          <span className="eyebrow">How we work</span>
          <h2>Senior thinking is only useful<br/>if somebody makes it happen.</h2>
        </div>
        <Method/>
      </div>
    </section>

    <section className="v2-do section">
      <div className="shell v2-do-grid">
        <div className="v2-do-statement">
          <span className="eyebrow">Not a deck-and-disappear consultancy</span>
          <h2>We don’t hand you a strategy.<br/><em>We get in and do the work.</em></h2>
        </div>
        <div className="v2-do-list">
          {[
            ['01','On our own','When something needs ownership, we take it.'],
            ['02','With your team','We work alongside the people already inside the business.'],
            ['03','With your partners','We can direct agencies, specialists and suppliers when needed.'],
            ['04','Across functions','We follow the constraint — not the org chart.']
          ].map(([n,t,d])=><div className="v2-do-item" key={t}><span>{n}</span><div><strong>{t}</strong><p>{d}</p></div></div>)}
        </div>
      </div>
    </section>

    <section className="v2-engage section section-soft">
      <div className="shell">
        <div className="v2-section-intro dark">
          <span className="eyebrow">Ways to work together</span>
          <h2>Start where the problem is.<br/>Scale the engagement where it helps.</h2>
        </div>
        <div className="v2-engage-grid">
          <article><span>01</span><h3>Machine Check</h3><p>A senior diagnostic across the commercial system to identify the true constraints, priorities and opportunities.</p><Link href="/contact">Start with clarity →</Link></article>
          <article><span>02</span><h3>Growth Sprint</h3><p>A focused mandate to solve and implement a specific growth challenge — from GTM to conversion, sales or operating model.</p><Link href="/contact">Discuss a sprint →</Link></article>
          <article><span>03</span><h3>Fractional Growth Office</h3><p>Ongoing senior leadership and execution across the growth function, without forcing everything into one executive title.</p><Link href="/contact">Explore fractional leadership →</Link></article>
        </div>
      </div>
    </section>

    <section className="v2-founders section section-ink">
      <div className="shell v2-founders-grid">
        <div>
          <span className="eyebrow inverse">The people doing the work</span>
          <h2>Two senior operators.<br/>One growth mandate.</h2>
          <p>Between us, we bring founder-level commercial judgement across B2B, consumer, ecommerce, brand, GTM, sales, revenue models, systems and execution.</p>
          <Link href="/about" className="light-link">Meet Andrew & Tarren →</Link>
        </div>
        <div className="v2-founder-cards">
          <article><span>Andrew</span><p>Business design · Revenue · B2B GTM · Sales · Systems · Founder execution</p></article>
          <article><span>Tarren</span><p>Consumer · Brand · FMCG · Ecommerce · Data · DTC growth</p></article>
        </div>
      </div>
    </section>

    <section className="v2-proof section">
      <div className="shell v2-proof-grid">
        <div>
          <span className="eyebrow">Selected experience</span>
          <h2>Built from years inside businesses, not from a playbook.</h2>
          <p>Reference brands will be added here as permissions are confirmed.</p>
        </div>
        <div className="v2-logo-row">
          {['Reference brand','Reference brand','Reference brand','Reference brand'].map((x,i)=><span key={i}>{x} {String(i+1).padStart(2,'0')}</span>)}
        </div>
      </div>
    </section>

    <section className="v2-insights section">
      <div className="shell">
        <div className="v2-insights-head">
          <div><span className="eyebrow">Insights</span><h2>Thinking for the next stage of growth.</h2></div>
          <Link href="/insights">View all insights →</Link>
        </div>
        <div className="v2-article-list">
          {[
            ['Do you actually need a CMO — or is that the wrong diagnosis?','/insights/do-you-need-a-cmo'],
            ['Founder-led growth has a ceiling. What comes next?','/insights/founder-led-growth-ceiling'],
            ['Hire the roadmap before you hire the role.','/insights/hire-the-roadmap-first']
          ].map(([t,h],i)=><Link href={h} className="v2-article-row" key={t}><span>0{i+1}</span><h3>{t}</h3><b>↗</b></Link>)}
        </div>
      </div>
    </section>

  </>
}

/* The closing call to action, shared by / and both journeys. */
export function ClosingCta(){
  return <>
    <section className="v2-final section">
      <div className="shell v2-final-panel">
        <div><span className="eyebrow inverse">The Growth Machine</span><h2>Bring us the growth problem.<br/>We’ll help work out what it actually needs.</h2></div>
        <Link className="button v2-final-button" href="/contact">Start a conversation →</Link>
      </div>
    </section>
  </>
}
