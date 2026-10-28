import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DisciplineIcon } from '@/components/HowWeWork';
import { ContextScreen } from '@/components/ContextIntelligence';
import { JOURNEYS } from '@/components/journeys';
import { INTEL } from '@/components/intel';
import { DISCIPLINE_PAGES } from '@/components/disciplines';
import styles from './DisciplinePage.module.css';

/*
 * A growth discipline's own page, opened from its card in a journey's How we
 * work section (/b2b/<slug>, /ecommerce/<slug>). Each route file is one call
 * to disciplineRoute.
 *
 *   1. Opening: the promise, and the card you clicked, opened up
 *   2. Sound familiar? The signs this discipline is the constraint
 *   3. What we do: the commercial goal, the three areas, and what you're
 *      left with
 *   4. The question we'd answer first: the discipline's dashboard screen
 *   5. How it works: diagnose, prioritise, do the work, embed, as they
 *      apply to this discipline
 *   6. What changes
 *   7. Works best with: two related disciplines and why, and all six to
 *      jump between
 *   8. Talk to us: about the real constraint, wherever it turns out to be
 *
 * Copy lives in disciplines.js; names, icons and area titles in journeys.js;
 * the dashboard screen in intel.js.
 */

const LABELS = {
  b2b: { short: 'B2B', back: 'B2B, SaaS & sales-led growth' },
  ecommerce: { short: 'Ecommerce', back: 'Ecommerce & consumer growth' },
};

const STEPS = ['Diagnose', 'Prioritise', 'Do the work', 'Embed'];

// "Signs your brand *isn’t doing enough*." → the starred words in red.
function Marked({ text }) {
  return text.split('*').map((part, i) => (i % 2 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>));
}

const pad = (n) => String(n).padStart(2, '0');

export function disciplineRoute(journey) {
  const disciplines = JOURNEYS[journey].work.disciplines;
  const pages = DISCIPLINE_PAGES[journey];
  const screens = INTEL[journey].screens;
  const { short, back } = LABELS[journey];
  const base = `/${journey}`;

  function generateStaticParams() {
    return disciplines.map((d) => ({ slug: d.slug }));
  }

  async function generateMetadata({ params }) {
    const { slug } = await params;
    const d = disciplines.find((x) => x.slug === slug);
    if (!d) return {};
    return {
      title: `${d.name} | ${short} growth`,
      description: `${pages[slug].promise} ${pages[slug].lede}`,
      alternates: { canonical: `${base}/${slug}` },
    };
  }

  async function Discipline({ params }) {
    const { slug } = await params;
    const i = disciplines.findIndex((x) => x.slug === slug);
    if (i < 0) notFound();
    const d = disciplines[i];
    const p = pages[slug];
    const prev = disciplines[(i + disciplines.length - 1) % disciplines.length];
    const next = disciplines[(i + 1) % disciplines.length];
    const related = p.related.map(([r, why]) => ({ ...disciplines.find((x) => x.slug === r), why }));

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `${d.name} (${short})`,
      description: `${p.promise} ${p.lede}`,
      serviceType: d.name,
      provider: { '@type': 'Organization', name: 'The Growth Machine' },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: d.name,
        itemListElement: d.items.map((t) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: t } })),
      },
    };

    return (
      <article className={styles.page}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

        {/* 1. Opening */}
        <section className={styles.hero}>
          <div className={styles.shell}>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href={base}>{back}</Link>
              <span aria-hidden="true">/</span>
              <Link href={`${base}#work-title`}>How we work</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{d.name}</span>
            </nav>

            <div className={styles.heroGrid}>
              <div>
                <p className={styles.eyebrow}>
                  {short} discipline {pad(i + 1)} of {pad(disciplines.length)}
                </p>
                <h1 className={styles.title}>{d.name}</h1>
                <p className={styles.promise}>{p.promise}</p>
                <p className={styles.lede}>{p.lede}</p>
                <div className={styles.actions}>
                  <Link className={styles.button} href="/contact">
                    Talk to us about this <span aria-hidden="true">→</span>
                  </Link>
                  <a className={styles.textLink} href="#question">
                    See the question we’d answer first <span aria-hidden="true">↓</span>
                  </a>
                </div>
              </div>

              {/* The card from the How we work board, opened up. */}
              <div className={styles.cardWrap} aria-hidden="true">
                <div className={styles.card}>
                  <span className={styles.cardIcon}>
                    <DisciplineIcon name={d.icon} />
                  </span>
                  <span className={styles.cardNum}>{pad(i + 1)}</span>
                  <p className={styles.cardName}>{d.name}</p>
                  <ul className={styles.cardItems}>
                    {d.items.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Sound familiar? */}
        <section className={styles.signs} aria-labelledby="signs-title">
          <div className={styles.shell}>
            <div className={styles.signsHead}>
              <p className={styles.eyebrowLight}>Sound familiar?</p>
              <h2 id="signs-title" className={styles.h2Light}>
                <Marked text={p.signsTitle} />
              </h2>
            </div>
            <ul className={styles.notes}>
              {p.signs.map((t, k) => (
                <li key={t} style={{ '--k': k }}>
                  <span aria-hidden="true">“</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. What we do */}
        <section className={styles.areas} aria-labelledby="areas-title">
          <div className={styles.shell}>
            <p className={styles.eyebrow}>What we do</p>
            <h2 id="areas-title" className={styles.h2}>
              Three areas. <em>One commercial goal.</em>
            </h2>
            <p className={styles.goal}>
              <b>The goal</b>
              {p.goal}
            </p>
            <ol className={styles.areaList}>
              {d.items.map((t, k) => (
                <li key={t} className={styles.area}>
                  <span className={styles.areaNum} aria-hidden="true">{pad(k + 1)}</span>
                  <h3>{p.areas[k].title || t}</h3>
                  <p>{p.areas[k].desc}</p>
                  <small>What you’re left with</small>
                  <ul className={styles.gets}>
                    {p.areas[k].gets.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4. The question we'd answer first */}
        <section id="question" className={styles.question} aria-labelledby="question-title">
          <div className={styles.shell}>
            <div className={styles.questionHead}>
              <p className={styles.eyebrow}>The question we’d answer first</p>
              <h2 id="question-title" className={styles.h2}>
                Data on its own can mislead. <em>Context shows what to do.</em>
              </h2>
              <p className={styles.sectionLede}>
                One question we’d bring to {d.name} straight away, answered twice: with one system’s data, then with
                the rest of the business joined in. Figures are illustrative.
              </p>
            </div>
            <ContextScreen screen={screens[i]} n={i + 1} />
          </div>
        </section>

        {/* 5. How it works */}
        <section className={styles.how} aria-labelledby="how-title">
          <div className={styles.shell}>
            <p className={styles.eyebrow}>How it works</p>
            <h2 id="how-title" className={styles.h2}>
              We don’t hand you a strategy. <em>We get in and do the work.</em>
            </h2>
            <ol className={styles.steps}>
              {STEPS.map((t, k) => (
                <li key={t}>
                  <span className={styles.stepNode} aria-hidden="true">{k + 1}</span>
                  <h3>{t}</h3>
                  <p>{p.steps[k]}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6. What changes */}
        <section className={styles.outcomes} aria-labelledby="outcomes-title">
          <div className={styles.shell}>
            <h2 id="outcomes-title" className={styles.outcomesTitle}>What changes</h2>
            <ul className={styles.outcomeList}>
              {p.outcomes.map((t) => (
                <li key={t}>
                  <span aria-hidden="true">→</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 7. Works best with */}
        <section className={styles.related} aria-labelledby="related-title">
          <div className={styles.shell}>
            <p className={styles.eyebrow}>Complementary disciplines. Compounding impact.</p>
            <h2 id="related-title" className={styles.h2}>
              Works best <em>with</em>
            </h2>
            <div className={styles.relatedGrid}>
              {related.map((r) => (
                <Link key={r.slug} href={`${base}/${r.slug}`} className={styles.relCard}>
                  <span className={styles.relIcon}>
                    <DisciplineIcon name={r.icon} />
                  </span>
                  <h3>{r.name}</h3>
                  <p>{r.why}</p>
                  <span className={styles.more}>
                    Explore <b aria-hidden="true">→</b>
                  </span>
                </Link>
              ))}
            </div>

            <nav className={styles.all} aria-label={`All ${short} disciplines`}>
              <p>All six disciplines</p>
              <ul>
                {disciplines.map((x, k) => (
                  <li key={x.slug}>
                    <Link href={`${base}/${x.slug}`} aria-current={x.slug === slug ? 'page' : undefined} className={x.slug === slug ? styles.here : ''}>
                      <span className={styles.allIcon}>
                        <DisciplineIcon name={x.icon} />
                      </span>
                      <span className={styles.allNum}>{pad(k + 1)}</span>
                      <span className={styles.allName}>{x.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>

        {/* 8. Talk to us */}
        <section className={styles.cta} aria-labelledby="cta-title">
          <div className={styles.shell}>
            <div className={styles.ctaPanel}>
              <div>
                <p className={styles.eyebrowLight}>Start with a conversation</p>
                <h2 id="cta-title" className={styles.ctaTitle}>
                  Not sure what’s really holding growth back? <em>Let’s identify the constraint, and what to do next.</em>
                </h2>
                <p className={styles.ctaText}>Whether it’s {d.name} or somewhere else in the system, finding the real constraint is the first thing we do.</p>
              </div>
              <Link className={styles.ctaButton} href="/contact">
                Book a growth call <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className={styles.pager}>
              <Link href={`${base}/${prev.slug}`}>
                <small>← Previous</small>
                {prev.name}
              </Link>
              <Link href={base} className={styles.pagerBack}>
                <small>Back to</small>
                {back}
              </Link>
              <Link href={`${base}/${next.slug}`} className={styles.pagerNext}>
                <small>Next →</small>
                {next.name}
              </Link>
            </div>
          </div>
        </section>
      </article>
    );
  }

  return { generateStaticParams, generateMetadata, Discipline };
}
