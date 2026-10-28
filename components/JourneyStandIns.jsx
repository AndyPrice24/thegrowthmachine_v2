import Link from 'next/link';
import Method from '@/components/Method';

/*
 * Stand-ins for the parts of each journey still to be designed. Both the B2B
 * and ecommerce journeys show these after their own opening section; replace
 * them per journey as the tailored sections arrive. howWeWork={false} drops
 * the two "how we work" stand-ins for a journey that has its own HowWeWork.
 */
export function JourneyStandIns({ howWeWork = true }){
  return <>
    {howWeWork && <>
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
    </>}

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
