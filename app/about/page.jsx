import Link from 'next/link';
import styles from './about.module.css';

/*
 * About: confidence in the two people a client works with, not a second
 * explanation of the growth proposition (the homepage and discipline pages
 * do that). Five parts: the introduction, the experience behind the
 * machine, the founders (equal cards, each with a bio and a career timeline
 * tagged with the growth roles held in it), the combined advantage, and one
 * call to talk.
 *
 * Careers name only the big brands; everything else is described.
 */

export const metadata = {
  title: 'About',
  description:
    'Andrew and Tarren Price: founders, entrepreneurs and hands-on commercial growth operators behind The Growth Machine.',
  alternates: { canonical: '/about' },
};

const PROOF = [
  ['£1.5M+', 'raised across three funding rounds'],
  ['1 exit', 'a fintech venture built and sold'],
  ['Global patent', 'secured across 11 regions'],
  ['2 global brands', 'commercial and insight roles at Red Bull and Beiersdorf'],
];

const FOUNDERS = [
  {
    name: 'Andrew Price',
    photo: '/founders/andrew.webp',
    linkedin: 'https://www.linkedin.com/in/andrew-perry-price',
    bio: 'Andrew has spent 15+ years building businesses and the commercial engines that make them grow. In every role, from enterprise sales and running an agency P&L to co-founding a 15-person venture studio and leading ventures as CEO, Andrew has owned the growth: sales, marketing, brand, forecasting, fundraising and the business model, while leading the team. Andrew’s strength is seeing the whole commercial picture, and turning it into a model a business can execute.',
    career: [
      { when: '2014–15', role: 'Head of business development', where: 'global creative-research network', what: 'Ran enterprise B2B sales end to end, with pipeline forecasting and quota accountability.', tags: ['Sales', 'Forecasting', 'B2B'] },
      { when: '2015–16', role: 'Managing director', where: 'full-service creative & marketing agency', what: 'Ran the P&L and a 12-person team across brand, digital, content and PR; built the agency’s first outbound sales engine.', tags: ['Growth', 'Sales', 'Marketing', 'Brand', 'Team'] },
      { when: '2016–20', role: 'Co-founder & CRO', where: '15-person venture and innovation studio', what: 'Built the revenue model and personally sold programmes to ABSA, Woolworths and Vodacom.', tags: ['Sales', 'Business models', 'Go-to-market', 'Team'] },
      { when: '2019–21', role: 'General manager', where: 'fintech venture', what: 'Built the business case, proposition and revenue model; led the launch and took it through to acquisition by an industry partner.', tags: ['Business design', 'Go-to-market', 'Partnerships', 'Exit'] },
      { when: '2020–23', role: 'CEO', where: 'patented consumer-tech venture', what: 'Raised £1.5M+ across three rounds, led a multidisciplinary team, and ran go-to-market in the UK and South Africa.', tags: ['Fundraising', 'Go-to-market', 'Brand', 'Team'] },
      { when: '2023', role: 'Fractional CRO', where: 'fintech business', what: 'Reworked the commercial model, pricing and go-to-market, and led investor and partner talks.', tags: ['Revenue', 'Pricing', 'Partnerships'] },
      { when: '2024–', role: 'Commercial director & co-founder', where: 'international DTC pet brand', what: 'Built the growth model across DTC, Amazon and paid acquisition, plus the AI tools for forecasting and unit economics.', tags: ['Growth', 'Brand', 'Forecasting', 'AI'] },
    ],
    earlier: 'Earlier: field marketing, sales and general management roles.',
  },
  {
    name: 'Tarren Price',
    photo: '/founders/tarren.webp',
    linkedin: 'https://www.linkedin.com/in/tarren-price-3389835a/',
    bio: 'Tarren brings 15+ years of connecting consumer and market intelligence with commercial growth. From trade marketing at Beiersdorf and national insights at Red Bull to founding and running consumer brands, Tarren’s work spans brand strategy, marketing, consumer insight, ecommerce, pricing and commercial optimisation. Today that means hands-on growth leadership across acquisition, conversion, marketplaces and operations, and the people and partners behind them: turning what customers and markets reveal into better commercial decisions.',
    career: [
      { role: 'Trade marketing strategist', where: 'Beiersdorf', what: 'Used competitor, customer, market and financial data to shape positioning, distribution, product and retailer relationships.', tags: ['Insight', 'Positioning', 'Trade marketing', 'Distribution'] },
      { role: 'National insights manager', where: 'Red Bull', what: 'Turned market and sales data into go-to-market, trade and marketing decisions.', tags: ['Insight', 'Go-to-market', 'Marketing'] },
      { role: 'Founder', where: 'health-supplement brand', what: 'Built and ran a consumer brand from launch.', tags: ['Brand', 'Ecommerce', 'Growth'] },
      { role: 'Co-founder', where: 'international DTC pet brand', what: 'Trading direct and on Amazon in the US and Australia.', tags: ['Growth', 'Ecommerce', 'Marketplaces', 'Brand'] },
      { role: 'Fractional growth lead', where: 'UK beauty brand', what: 'Reshaping the creative, website, costings, commercial model, Amazon, search and team.', tags: ['Ecommerce', 'Commercial model', 'Marketplaces', 'Team'] },
    ],
  },
];

export default function About() {
  return (
    <article className={styles.page}>
      {/* 1. Introduction */}
      <section className={styles.intro}>
        <div className={styles.shell}>
          <p className={styles.eyebrow}>About The Growth Machine</p>
          <div className={styles.introGrid}>
            <h1 className={styles.title}>
              We’ve built businesses. <em>Now we help grow yours.</em>
            </h1>
            <div className={styles.introCopy}>
              <p className={styles.lead}>We’re Andrew and Tarren: founders, entrepreneurs and hands-on commercial growth operators.</p>
              <p>
                Between us, we’ve launched multiple ventures, raised investment, led teams, worked with international brands and built
                businesses trading across global markets.
              </p>
              <p>
                We’ve experienced growth from both sides: setting the commercial strategy, and being the people accountable for making it
                work. We founded The Growth Machine to bring that experience directly into other businesses.
              </p>
              <p className={styles.featured}>
                <span aria-hidden="true" />
                As featured in <b>Fast Company</b> South Africa
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The experience behind the machine */}
      <section className={styles.proof} aria-labelledby="proof-title">
        <div className={styles.shell}>
          <h2 id="proof-title" className={styles.proofTitle}>The experience behind the machine</h2>
          <ul className={styles.proofList}>
            {PROOF.map(([value, label]) => (
              <li key={value}>
                <b>{value}</b>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Meet the founders */}
      <section className={styles.founders} aria-labelledby="founders-title">
        <div className={styles.shell}>
          <p className={styles.eyebrow}>Meet the founders</p>
          <h2 id="founders-title" className={styles.h2}>
            Operators first. <em>Advisers second.</em>
          </h2>
          <div className={styles.cards}>
            {FOUNDERS.map((f) => (
              <article key={f.name} className={styles.card}>
                <div className={styles.portrait}>
                  <img src={f.photo} alt={`Portrait of ${f.name}`} width="800" height="999" loading="lazy" decoding="async" />
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.name}>{f.name}</h3>
                  <p className={styles.role}>Co-founder &amp; Growth Operator</p>
                  <p className={styles.bio}>{f.bio}</p>

                  <h4 className={styles.careerTitle}>Career</h4>
                  <ol className={styles.career}>
                    {f.career.map((c) => (
                      <li key={c.role + c.where}>
                        {c.when && <span className={styles.when}>{c.when}</span>}
                        <p className={styles.post}>
                          <b>{c.role}</b>, {c.where}
                        </p>
                        <p className={styles.what}>{c.what}</p>
                        <ul className={styles.tags} aria-label="Roles held">
                          {c.tags.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                  {f.earlier && <p className={styles.earlier}>{f.earlier}</p>}
                  <a className={styles.linkedin} href={f.linkedin} target="_blank" rel="noopener noreferrer">
                    {f.name.split(' ')[0]} on LinkedIn <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. The combined advantage */}
      <section className={styles.together} aria-labelledby="together-title">
        <div className={styles.shell}>
          <div className={styles.togetherGrid}>
            <div>
              <p className={styles.eyebrowLight}>The combined advantage</p>
              <h2 id="together-title" className={styles.togetherTitle}>
                Different experience. <em>Shared accountability.</em>
              </h2>
            </div>
            <div className={styles.togetherCopy}>
              <p>
                We’ve built and operated businesses together, including <b>Hoddogs</b>, an international consumer brand trading in the US and
                Australia.
              </p>
              <p>
                Our different backgrounds give us a broader perspective. Our shared experience as founders means we approach decisions with
                the same commercial accountability.
              </p>
              <p>
                We don’t divide your business into functional silos. We challenge assumptions, connect the dots and focus on the opportunities
                most likely to make a commercial difference.
              </p>
              <p className={styles.leads}>The challenge determines who leads. Both perspectives strengthen the solution.</p>
            </div>
          </div>
          <p className={styles.direct}>
            When you work with The Growth Machine, <em>you work directly with us.</em>
          </p>
        </div>
      </section>

      {/* 5. Talk to us */}
      <section className={styles.cta} aria-labelledby="cta-title">
        <div className={styles.shell}>
          <div className={styles.ctaPanel}>
            <div>
              <h2 id="cta-title" className={styles.ctaTitle}>
                Let’s talk about <em>your business.</em>
              </h2>
              <p className={styles.ctaText}>Every business has opportunities hiding between its moving parts. Let’s find yours.</p>
            </div>
            <Link className={styles.ctaButton} href="/contact">
              Start a conversation <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
