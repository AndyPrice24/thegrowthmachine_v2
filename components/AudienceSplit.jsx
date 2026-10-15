'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { goToJourney } from './JourneyStart';
import styles from './AudienceSplit.module.css';

/*
 * "How you grow depends on how you sell." Two growth systems side by side:
 * ecommerce/consumer and B2B/SaaS/sales-led, each a card with a photo and its
 * commercial levers. Stacks on narrow screens, photo on top.
 *
 * This is the choice at the end of the shared homepage. Choosing a card goes
 * to /ecommerce or /b2b without scrolling to the top: the opening above stays
 * put and the page glides on into that journey (see JourneyStart). On a
 * journey, its card is marked current and the other stays one click away.
 *
 * Photos live in /public/systems: a 3:4 portrait for the side-by-side card
 * and a 4:3 landscape for phones, where the photo sits above the text.
 */
const SYSTEMS = [
  {
    title: ['Ecommerce &', 'consumer growth'],
    lede: 'For businesses where growth happens through customers, products and channels.',
    levers: [
      'Acquisition & media economics',
      'Conversion & onsite experience',
      'Offer, pricing & merchandising',
      'CRM, retention & LTV',
      'Brand & demand',
      'Margin & channel performance',
    ],
    href: '/ecommerce',
    cta: 'Explore ecommerce growth',
    image: 'ecommerce',
    focus: '42% 50%',
    alt: 'A botanical face oil bottle and its box on a stone plinth in warm afternoon light.',
  },
  {
    title: ['B2B, SaaS &', 'sales-led growth'],
    lede: 'For businesses where growth happens through pipeline, people and systems.',
    levers: [
      'GTM & market focus',
      'Lead generation & pipeline',
      'Sales process & conversion',
      'Pricing & commercial model',
      'CRM, data & operating systems',
      'Team structure & accountability',
    ],
    href: '/b2b',
    cta: 'Explore B2B growth',
    image: 'b2b',
    focus: '66% 50%',
    alt: 'A leadership team in a high-rise boardroom at sunset, mapping a lead generation and conversion funnel on a whiteboard.',
  },
];

export default function AudienceSplit() {
  const pathname = usePathname();
  const chosen = SYSTEMS.some((s) => s.href === pathname);

  // On the homepage the two cards are a choice still to be made: when they
  // first come into view, their selection markers pulse once.
  const gridRef = useRef(null);
  const [cue, setCue] = useState(false);
  useEffect(() => {
    if (chosen || cue || !gridRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCue(true);
          io.disconnect();
        }
      },
      { threshold: 0.55 }
    );
    io.observe(gridRef.current);
    return () => io.disconnect();
  }, [chosen, cue]);

  return (
    <section className={styles.section} aria-labelledby="systems-title">
      <div className="shell">
        <header className={styles.head}>
          <p className={styles.eyebrow}>Two growth systems</p>
          <h2 id="systems-title" className={styles.title}>
            How you grow depends on how you <em>sell</em>.
          </h2>
          <p className={styles.lede}>The principles are the same. The commercial levers aren’t.</p>
        </header>

        <div ref={gridRef} className={`${styles.grid} ${cue ? styles.cue : ''}`}>
          {SYSTEMS.map((s) => (
            <article
              key={s.href}
              className={`${styles.card} ${chosen ? (pathname === s.href ? styles.current : styles.other) : ''}`}
            >
              <span className={styles.select} aria-hidden="true">
                <svg viewBox="0 0 16 16" focusable="false">
                  <path d="M4 8.4 6.8 11 12 5.4" />
                </svg>
              </span>
              <div className={styles.media}>
                {s.image ? (
                  <picture>
                    <source media="(max-width: 600px)" srcSet={`/systems/${s.image}-landscape.webp`} />
                    <img
                      src={`/systems/${s.image}-portrait.webp`}
                      alt={s.alt}
                      style={{ objectPosition: s.focus }}
                      width="900"
                      height="1200"
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                ) : (
                  <span className={styles.placeholder} aria-hidden="true" />
                )}
              </div>
              <div className={styles.body}>
                <h3 className={styles.name}>
                  {s.title[0]}
                  <br />
                  {s.title[1]}
                </h3>
                <p className={styles.cardLede}>{s.lede}</p>
                <ul className={styles.levers}>
                  {s.levers.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
                <Link
                  href={s.href}
                  scroll={false}
                  className={styles.cta}
                  onClick={goToJourney(pathname, s.href)}
                  aria-current={pathname === s.href ? 'page' : undefined}
                >
                  {s.cta} <span aria-hidden="true">{pathname === s.href ? '↓' : '→'}</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className={styles.foot}>
          <span>B2B2C or somewhere in between? We work across both systems.</span>
        </p>
      </div>
    </section>
  );
}
