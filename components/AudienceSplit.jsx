'use client';

import Link from 'next/link';
import { Fragment, useEffect, useRef, useState } from 'react';
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
 * Each card is a photo with the title and description on a panel that
 * overlaps its lower edge, then the levers and the button. Side by side from
 * 1024px, stacked (compact, so both show while scrolling) below, an "or"
 * between them. Cards lift and turn red under the pointer or a finger,
 * including while scrolling past (passive touch listeners).
 *
 * Photos live in /public/systems as 4:3 landscapes.
 */
const SYSTEMS = [
  {
    title: ['Ecommerce &', 'consumer growth'],
    lede: 'For businesses where growth happens through customers, products and channels.',
    levers: [
      // The six disciplines of the ecommerce How we work section, in its order.
      'Brand & demand',
      'Acquisition & discoverability',
      'Conversion & onsite',
      'Retention & LTV',
      'Margin & channels',
      'Data, systems & AI',
    ],
    href: '/ecommerce',
    cta: 'Explore ecommerce growth',
    image: 'ecommerce',
    focus: '42% 60%',
    alt: 'A botanical face oil bottle and its box on a stone plinth in warm afternoon light.',
  },
  {
    title: ['B2B, SaaS &', 'sales-led growth'],
    lede: 'For businesses where growth happens through pipeline, people and systems.',
    levers: [
      // The six disciplines of the B2B How we work section, in its order.
      'Brand & demand',
      'Sales & conversion',
      'GTM & market expansion',
      'Commercial model',
      'Data, systems & AI',
      'Team & operating model',
    ],
    href: '/b2b',
    cta: 'Explore B2B growth',
    image: 'b2b',
    focus: '60% 50%',
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
  const [touched, setTouched] = useState(null);

  // Touch: light the card under the finger as it moves, scrolling or not.
  useEffect(() => {
    const grid = gridRef.current;
    let clear;
    const pick = (e) => {
      const t = e.touches[0];
      if (!t) return;
      const card = document.elementFromPoint(t.clientX, t.clientY)?.closest('[data-card]');
      clearTimeout(clear);
      setTouched(card && grid.contains(card) ? card.dataset.card : null);
    };
    const end = () => {
      clearTimeout(clear);
      clear = setTimeout(() => setTouched(null), 450);
    };
    const opts = { passive: true };
    grid.addEventListener('touchstart', pick, opts);
    grid.addEventListener('touchmove', pick, opts);
    grid.addEventListener('touchend', end, opts);
    grid.addEventListener('touchcancel', end, opts);
    return () => {
      clearTimeout(clear);
      grid.removeEventListener('touchstart', pick, opts);
      grid.removeEventListener('touchmove', pick, opts);
      grid.removeEventListener('touchend', end, opts);
      grid.removeEventListener('touchcancel', end, opts);
    };
  }, []);
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
          {SYSTEMS.map((s, i) => (
            <Fragment key={s.href}>
              {i === 1 && (
                <span className={styles.or} aria-hidden="true">
                  or
                </span>
              )}
              <article
                data-card={s.href}
                className={`${styles.card} ${chosen ? (pathname === s.href ? styles.current : styles.other) : ''} ${
                  touched === s.href ? styles.active : ''
                }`}
              >
                <span className={styles.select} aria-hidden="true">
                  <svg viewBox="0 0 16 16" focusable="false">
                    <path d="M4 8.4 6.8 11 12 5.4" />
                  </svg>
                </span>
                <div className={styles.media}>
                  <img
                    src={`/systems/${s.image}-landscape.webp`}
                    alt={s.alt}
                    style={{ objectPosition: s.focus }}
                    width="1200"
                    height="900"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className={styles.panel}>
                  <h3 className={styles.name}>
                    {s.title[0]} {s.title[1]}
                  </h3>
                  <p className={styles.cardLede}>{s.lede}</p>
                </div>
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
              </article>
            </Fragment>
          ))}
        </div>

        <p className={styles.foot}>
          <span>B2B2C or somewhere in between? We work across both systems.</span>
        </p>
      </div>
    </section>
  );
}
