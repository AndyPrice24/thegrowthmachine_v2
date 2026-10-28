import Link from 'next/link';
import styles from './about.module.css';

/*
 * About: the company first, the founders as proof. Six parts: what The
 * Growth Machine is, why we built it (the middle ground most growing
 * businesses get stuck in), the complementary skills that cover the whole
 * spectrum of growth, how we work, meet the team (equal cards with a few
 * highlights each, not a CV), and one call to talk.
 *
 * Only the big brands are named; everything else is described.
 */

export const metadata = {
  title: 'About',
  description:
    'The Growth Machine gives growing businesses senior, hands-on growth leadership across the whole commercial system, without the full-time hire. Founded by Andrew and Tarren Price.',
  alternates: { canonical: '/about' },
};

const MIDDLE = [
  {
    tag: 'You need growth',
    title: 'The next stage needs a different engine.',
    text: 'What got the business here won’t get it to the next level, and the pressure to grow is real.',
  },
  {
    tag: 'Not another full-time hire',
    title: 'A senior hire is a big, slow bet.',
    text: 'It takes months to find the right person, costs a fixed salary, and brings one person’s experience to a many-sided problem.',
  },
  {
    tag: 'Growth spans everything',
    title: 'The problem sits between roles.',
    text: 'Brand, sales, pricing, data and team all move growth. The constraint is rarely inside just one of them.',
  },
];

const SPECTRUM = [
  'Brand & positioning',
  'Customer insight',
  'Acquisition',
  'Conversion',
  'Sales',
  'Pricing & model',
  'Data & AI',
  'Team & operations',
];

const PILLARS = [
  {
    tag: 'Growth operators',
    title: '15+ years each in growth roles.',
    text: 'Sales, marketing, revenue and commercial leadership, from enterprise deals to ecommerce and marketplaces.',
  },
  {
    tag: 'Brand builders',
    title: 'From global brands to our own.',
    text: 'Commercial and insight roles at Red Bull and Beiersdorf, and brands we’ve built from scratch.',
  },
  {
    tag: 'Founders',
    title: 'We’ve built businesses ourselves.',
    text: '6+ startups founded and run, £1.5M+ raised, a venture built and sold, and a brand trading internationally today.',
  },
];

const STEPS = [
  ['Diagnose', 'We look across the whole commercial system to find what’s really holding growth back.'],
  ['Prioritise', 'We agree the few changes with the biggest commercial impact, and what good looks like.'],
  ['Do the work', 'We build and run it alongside your team, directing agencies and partners where needed.'],
  ['Embed', 'We leave the tools, rhythm and skills behind, so it keeps working without us.'],
];

const FOUNDERS = [
  {
    name: 'Andrew Price',
    photo: '/founders/andrew.webp',
    linkedin: 'https://www.linkedin.com/in/andrew-perry-price',
    intro:
      'A founder and commercial leader who has owned the growth in every business Andrew has built or led: the model, the sales, the brand and the funding.',
    highlights: [
      'Co-founded a 15-person venture studio and led its revenue',
      'Built and sold a fintech venture',
      'Raised £1.5M+ and secured a global patent as a CEO',
      'Ran a creative agency and built its sales engine',
      'Co-founded and runs an international DTC pet brand',
    ],
    brands: 'ABSA · Woolworths · Vodacom',
  },
  {
    name: 'Tarren Price',
    photo: '/founders/tarren.webp',
    linkedin: 'https://www.linkedin.com/in/tarren-price-3389835a/',
    intro:
      'A consumer and commercial growth leader who turns customer and market insight into decisions on brand, channel, product and price.',
    highlights: [
      'Trade marketing strategy for a global skincare brand',
      'National insights for a global drinks brand',
      'Founded and ran a consumer health brand',
      'Leads ecommerce growth for a UK beauty brand',
      'Co-founded and runs an international DTC pet brand',
    ],
    brands: 'Red Bull · Beiersdorf',
  },
];

export default function About() {
  return (
    <article className={styles.page}>
      {/* 1. What The Growth Machine is */}
      <section className={styles.hero}>
        <div className={`${styles.shell} ${styles.heroGrid}`}>
          <div>
            <p className={styles.eyebrow}>About The Growth Machine</p>
            <h1 className={styles.title}>
              Senior growth leadership. <em>Without the full-time hire.</em>
            </h1>
            <p className={styles.lede}>
              The Growth Machine is a fractional growth partnership, founded by Andrew and Tarren Price. We give founders and leadership
              teams senior, hands-on growth leadership across the whole commercial system, for as long as they need it.
            </p>
            <p className={styles.badge}>
              <span aria-hidden="true" />
              Founder-led · Senior-only · Hands-on
            </p>
          </div>
          <div className={styles.pics} aria-hidden="true">
            {FOUNDERS.map((f, i) => (
              <figure key={f.name} className={`${styles.pic} ${i ? styles.picB : styles.picA}`}>
                <img src={f.photo} alt="" width="800" height="999" decoding="async" />
                <figcaption>{f.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Why we built it */}
      <section className={styles.why} aria-labelledby="why-title">
        <div className={styles.shell}>
          <p className={styles.eyebrowLight}>Why we built it</p>
          <h2 id="why-title" className={styles.h2}>
            Most growing businesses get stuck <em>in the middle.</em>
          </h2>
          <ol className={styles.middle}>
            {MIDDLE.map((m, i) => (
              <li key={m.tag}>
                <small>
                  0{i + 1} · {m.tag}
                </small>
                <h3>{m.title}</h3>
                <p>{m.text}</p>
              </li>
            ))}
          </ol>
          <div className={styles.comeIn}>
            <h3>
              That’s where <em>we come in.</em>
            </h3>
            <p>
              Senior growth leadership across every discipline, fractional and hands-on: we find the real constraint, own the outcome and do
              the work, alongside your team.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Complementary skills */}
      <section className={styles.spectrum} aria-labelledby="spectrum-title">
        <div className={styles.shell}>
          <div className={styles.split}>
            <div>
              <p className={styles.eyebrow}>Why two founders</p>
              <h2 id="spectrum-title" className={styles.h2}>
                Complementary skills. <em>The whole spectrum of growth.</em>
              </h2>
            </div>
            <p className={styles.splitCopy}>
              Growth doesn’t live in one department, so neither does our experience. Between us, we’ve led it from both ends: the commercial
              model, sales and revenue, and the customer, brand and channels. Where our experience overlaps, we challenge each other.
              Together, it covers every lever a business can pull to grow.
            </p>
          </div>
          <ul className={styles.levers}>
            {SPECTRUM.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className={styles.bracket}>
            <span>Between us, all of it</span>
          </p>
          <p className={styles.any}>In any industry: B2B, SaaS, ecommerce and consumer.</p>
          <div className={styles.pillars}>
            {PILLARS.map((p) => (
              <div key={p.tag} className={styles.pillar}>
                <small>{p.tag}</small>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How we work */}
      <section className={styles.process} aria-labelledby="process-title">
        <div className={styles.shell}>
          <p className={styles.eyebrow}>How we work</p>
          <h2 id="process-title" className={styles.h2}>
            We don’t hand you a strategy. <em>We get in and do the work.</em>
          </h2>
          <ol className={styles.track}>
            {STEPS.map(([title, text], i) => (
              <li key={title}>
                <span className={styles.node} aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Meet the team */}
      <section className={styles.team} aria-labelledby="team-title">
        <div className={styles.shell}>
          <p className={styles.eyebrow}>Meet the team</p>
          <h2 id="team-title" className={styles.h2}>
            The people <em>you’ll work with.</em>
          </h2>
          <div className={styles.cards}>
            {FOUNDERS.map((f) => (
              <article key={f.name} className={styles.card}>
                <img src={f.photo} alt={`Portrait of ${f.name}`} width="800" height="999" loading="lazy" decoding="async" />
                <div className={styles.cardBody}>
                  <h3 className={styles.name}>{f.name}</h3>
                  <p className={styles.role}>Co-founder &amp; Growth Operator</p>
                  <p className={styles.intro}>{f.intro}</p>
                  <ul className={styles.highlights}>
                    {f.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                  <p className={styles.brands}>
                    Worked with <b>{f.brands}</b>
                  </p>
                  <a className={styles.linkedin} href={f.linkedin} target="_blank" rel="noopener noreferrer">
                    {f.name.split(' ')[0]} on LinkedIn <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
          <p className={styles.direct}>
            When you work with The Growth Machine, <em>you work directly with us.</em>
          </p>
        </div>
      </section>

      {/* 6. Talk to us */}
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
