import Link from 'next/link';
import GrowthMachine from '@/components/growth-machine/GrowthMachine';
import AudienceSplit from '@/components/AudienceSplit';
import TradeOff from '@/components/TradeOff';

/*
 * The homepage is one page with three addresses: /, /b2b and /ecommerce.
 * This layout is the shared opening (hero, machine, trade-off) and ends at
 * the choice between the two growth systems. It persists across the three
 * routes, so choosing a direction swaps only what is below the choice: the
 * page does not reload and the reader keeps their place.
 *
 *   /            ends at the choice: nothing below it until one is made
 *   /b2b         continues into the B2B, SaaS & sales-led journey
 *   /ecommerce   continues into the ecommerce & consumer journey
 */
export default function HomeLayout({ children }) {
  return <div className="home-v2">
    <section className="v2-hero">
      <div className="shell v2-hero-head">
        <div className="v2-hero-title">
          <h1>Don’t hire the title.<br/><em>Solve the growth problem.</em></h1>
        </div>
        <div className="v2-hero-copy">
          <p className="v2-hero-lede">When growth slows, businesses often reach for a title: CMO, CRO, Head of Growth, GTM lead. But growth rarely fits neatly inside one role. We diagnose the whole system, then step in and do the work that matters most.</p>
          <div className="v2-hero-actions">
            <Link className="button" href="/contact">Talk to The Growth Machine →</Link>
            <span className="v2-note">Fractional. Senior-led. Hands-on.</span>
          </div>
        </div>
      </div>
      <div className="v2-hero-machine">
        <GrowthMachine/>
      </div>
    </section>

    <TradeOff/>

    <AudienceSplit/>

    {children}
  </div>
}
