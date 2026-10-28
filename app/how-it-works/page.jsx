import Link from 'next/link';
import { JOURNEYS } from '@/components/journeys';
import styles from './how-it-works.module.css';

/*
 * How it works: how an engagement runs, from the first call to handover.
 * The route is the same four steps the rest of the site uses (Diagnose,
 * Prioritise, Do the work, Embed) with a free call in front; the first three
 * stages are free, and the Deep Dive is an optional, paid branch off
 * Diagnose. Then the two ways to work (no prices: those follow the Machine
 * Check), what working with us is like, where to start (links into each
 * route's six areas), what clients are left with, and one call to talk.
 */

export const metadata = {
  title: 'How it works',
  description:
    'From a free growth call and Machine Check to sprints or ongoing support: how The Growth Machine diagnoses, prioritises, does the work and embeds it in your business.',
  alternates: { canonical: '/how-it-works' },
};

const STAGES = [
  {
    step: 'Talk',
    title: 'Growth call',
    text: 'A conversation about your business, your goals and what’s getting in the way.',
    get: 'A clear next step.',
  },
  {
    step: 'Diagnose',
    title: 'Machine Check',
    text: 'A lightweight diagnostic of:',
    options: [['The whole machine'], ['Just one area', 'if you already know where you need help']],
    get: 'Where growth is stuck, and what it would take.',
    spur: {
      title: 'Machine Deep Dive',
      text: 'A full, cross-business diagnostic, for when you want the whole picture first.',
    },
  },
  {
    step: 'Prioritise',
    title: 'Plan & quote',
    text: 'We break the work into parts, in order of impact, and scope each one as a sprint or as ongoing work.',
    get: 'A clear plan, and a quote for it.',
  },
  {
    step: 'Do the work',
    title: 'Sprints or ongoing',
    text: 'We get in and do it, with your team.',
    options: [
      ['Sprint', 'a defined outcome, in a set time'],
      ['Ongoing', 'continuous optimisation and management'],
    ],
    paid: true,
  },
  {
    step: 'Embed',
    title: 'Hand over',
    text: 'We leave the tools, rhythm and skills behind, so it keeps working.',
    get: 'Growth your team can run.',
    paid: true,
  },
];

const WAYS = [
  {
    tag: 'Defined work',
    title: 'Sprints',
    price: 'Priced per sprint',
    text: 'A focused piece of work in one area, with a clear outcome, scope and timeline.',
    best: 'you know what needs fixing and want it done.',
  },
  {
    tag: 'Continuous work',
    title: 'Ongoing',
    price: 'Day rate · from one day a week',
    text: 'Senior hands on the work every week: optimising, managing and moving it forward.',
    best: 'the work needs a steady hand, not a one-off fix.',
  },
];

const WITH_US = [
  {
    icon: 'people',
    title: 'Both founders, every client.',
    text: 'Whoever’s experience fits the work leads it, and that can shift as the work moves on.',
  },
  { icon: 'team', title: 'Part of your team.', text: 'We work alongside your people, and direct your agencies and partners where needed.' },
  { icon: 'tools', title: 'In your tools.', text: 'We build in the systems you already use, so nothing leaves with us.' },
  { icon: 'globe', title: 'Remote, anywhere.', text: 'We work remotely, so we can work with businesses anywhere in the world.' },
];

const ROUTES = [
  { journey: JOURNEYS.b2b, label: 'B2B, SaaS & sales-led', base: '/b2b', more: 'Explore B2B growth' },
  { journey: JOURNEYS.ecommerce, label: 'Ecommerce & consumer', base: '/ecommerce', more: 'Explore ecommerce growth' },
];

const LEFT_WITH = [
  'A defined growth model',
  'A prioritised roadmap',
  'Clear roles and a working rhythm',
  'Measurement in your own tools',
  'A brief for any permanent hire',
];

function Icon({ name }) {
  const paths = {
    people: (
      <>
        <circle cx="8.5" cy="8.5" r="2.8" />
        <circle cx="16" cy="9.5" r="2.3" />
        <path d="M3.5 18.5c.6-3.2 2.6-4.8 5-4.8s4.4 1.6 5 4.8M13.8 14.2c.7-.4 1.4-.6 2.2-.6 2 0 3.6 1.4 4.2 4.4" />
      </>
    ),
    team: (
      <>
        <rect x="3.5" y="5" width="17" height="13" rx="2" />
        <path d="M8 18v2M16 18v2M7 10h10M7 13.5h6" />
      </>
    ),
    tools: (
      <>
        <rect x="7" y="7" width="10" height="10" rx="1.6" />
        <path d="M10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5Z" />
      </>
    ),
    loop: (
      <>
        <path d="M19 9a7.5 7.5 0 0 0-13.4-2.2" />
        <path d="M5 4v3.5h3.5" />
        <path d="M5 15a7.5 7.5 0 0 0 13.4 2.2" />
        <path d="M19 20v-3.5h-3.5" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

export default function HowItWorks() {
  return (
    <article className={styles.page}>
      {/* 1. Hero */}
      <section className={styles.hero}>
        <div className={styles.shell}>
          <p className={styles.eyebrow}>How it works</p>
          <h1 className={styles.title}>
            We don’t hand over a strategy deck <em>and disappear.</em>
          </h1>
          <p className={styles.lede}>
            We find what’s holding your growth back, plan the fix with you, then do the work alongside your team, until it runs without us.
          </p>
          <ul className={styles.facts}>
            <li>The first steps are free</li>
            <li>From one day a week</li>
            <li>Remote, worldwide</li>
          </ul>
        </div>
      </section>

      {/* 2. The route */}
      <section className={styles.route} aria-labelledby="route-title">
        <div className={styles.shell}>
          <p className={styles.eyebrowLight}>The route</p>
          <h2 id="route-title" className={styles.h2}>
            From first call to growth <em>that runs without us.</em>
          </h2>
          <p className={styles.routeLede}>Five stages. You only pay once you’ve seen the plan and the quote, and decided it’s worth doing.</p>

          <div className={styles.zones} aria-hidden="true">
            <p className={styles.zoneFree}>
              Free <b>Talk · Diagnose · Prioritise</b>
            </p>
            <p className={styles.zonePaid}>
              Paid <b>Do the work · Embed</b>
            </p>
          </div>
          <ol className={styles.stages}>
            {STAGES.map((s, i) => (
              <li key={s.step} className={s.paid ? styles.paid : undefined}>
                <span className={styles.node} aria-hidden="true">
                  {i + 1}
                </span>
                <p className={styles.step}>
                  {s.step} <span className={styles.price}>{s.paid ? 'Paid' : 'Free'}</span>
                </p>
                <h3 className={styles.stageTitle}>{s.title}</h3>
                <div className={styles.stageCard}>
                  <p>{s.text}</p>
                  {s.options && (
                    <ul className={styles.options}>
                      {s.options.map(([name, note]) => (
                        <li key={name}>
                          {name}
                          {note && <span>{note}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.get && (
                    <p className={styles.get}>
                      <b>You get</b>
                      {s.get}
                    </p>
                  )}
                </div>
                {s.spur && (
                  <div className={styles.spur}>
                    <span className={styles.spurTag}>Optional · Paid</span>
                    <h4>{s.spur.title}</h4>
                    <p>{s.spur.text}</p>
                  </div>
                )}
              </li>
            ))}
          </ol>
          <p className={styles.loop}>
            <Icon name="loop" />
            Then on to the next priority, or a clean handover.
          </p>
        </div>
      </section>

      {/* 3. Two ways to work */}
      <section className={styles.ways} aria-labelledby="ways-title">
        <div className={styles.shell}>
          <p className={styles.eyebrow}>Two ways to work</p>
          <h2 id="ways-title" className={styles.h2}>
            As fractional as <em>your budget allows.</em>
          </h2>
          <div className={styles.waysGrid}>
            {WAYS.map((w) => (
              <div key={w.title} className={styles.way}>
                <p className={styles.tag}>{w.tag}</p>
                <h3>{w.title}</h3>
                <p className={styles.wayPrice}>{w.price}</p>
                <p className={styles.wayText}>{w.text}</p>
                <p className={styles.best}>
                  <b>Best when</b> {w.best}
                </p>
              </div>
            ))}
          </div>
          <p className={styles.mix}>
            You can mix both.
            <span>We’ll recommend the right shape, and price it, after the Machine Check.</span>
          </p>
        </div>
      </section>

      {/* 4. Working with us */}
      <section className={styles.withUs} aria-labelledby="with-us-title">
        <div className={styles.shell}>
          <p className={styles.eyebrow}>Working with us</p>
          <h2 id="with-us-title" className={styles.h2}>
            Senior people, <em>inside your business.</em>
          </h2>
          <div className={styles.withUsGrid}>
            {WITH_US.map((w) => (
              <div key={w.title} className={styles.point}>
                <Icon name={w.icon} />
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Where we start */}
      <section className={styles.start} aria-labelledby="start-title">
        <div className={styles.shell}>
          <p className={styles.eyebrow}>Where we start</p>
          <h2 id="start-title" className={styles.h2}>
            The whole machine, <em>or one part of it.</em>
          </h2>
          <div className={styles.routes}>
            {ROUTES.map((r) => (
              <div key={r.base} className={styles.routeCard}>
                <p className={styles.tag}>{r.label}</p>
                <h3>Six areas we work on</h3>
                <ul>
                  {r.journey.work.disciplines.map((d) => (
                    <li key={d.slug}>
                      <Link href={`${r.base}/${d.slug}`}>
                        {d.name} <span aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link className={styles.more} href={r.base}>
                  {r.more} <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. How it ends */}
      <section className={styles.ends} aria-labelledby="ends-title">
        <div className={`${styles.shell} ${styles.endsGrid}`}>
          <div>
            <p className={styles.eyebrow}>How it ends</p>
            <h2 id="ends-title" className={styles.h2}>
              Your next <span className={styles.nowrap}>full-time</span> hire inherits <em>clarity, not ambiguity.</em>
            </h2>
          </div>
          <ol className={styles.leftWith}>
            {LEFT_WITH.map((x, i) => (
              <li key={x}>
                <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                {x}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7. Talk to us */}
      <section className={styles.cta} aria-labelledby="cta-title">
        <div className={styles.shell}>
          <div className={styles.ctaPanel}>
            <div>
              <h2 id="cta-title" className={styles.ctaTitle}>
                It starts with <em>a free call.</em>
              </h2>
              <p className={styles.ctaText}>
                Tell us where you are and where you want to get to. We’ll tell you honestly whether we can help.
              </p>
            </div>
            <Link className={styles.ctaButton} href="/contact">
              Book a growth call <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
