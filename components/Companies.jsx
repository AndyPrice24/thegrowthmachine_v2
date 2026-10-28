'use client';

import { useEffect, useRef, useState } from 'react';
import { COMPANIES } from './companies';
import styles from './Companies.module.css';

/*
 * "Companies we've worked with": a strip of small logo plates across the
 * width of a dark section. Whichever company reaches the middle opens into a
 * card with what we did and, where there is one, the client's own words;
 * after a few seconds the strip moves on and the next one opens.
 *
 * Every company sits at a slot worked out from its distance to the middle
 * (CSS places the slots, so they scale with the screen). Moving on changes
 * those distances and the pills glide; the one wrapping round from one end to
 * the other jumps instead, out of sight.
 *
 * It keeps moving on its own, with nothing to pause or steer it; it only
 * waits while off screen, so it starts where the reader arrives. For readers
 * who prefer reduced motion it still moves on, but without gliding. The
 * countdown is the progress bar itself: when its fill finishes, the strip
 * moves on. Screen readers get the companies as a plain list instead.
 *
 * Companies live in companies.js.
 */

// Seconds each company stays open: long enough to read what's on its card,
// at a little under four words a second.
const hold = (c) => {
  const words = `${c.quote?.text || ''} ${c.statement || ''}`.split(/\s+/).filter(Boolean).length;
  return Math.max(6, 4 + words * 0.22);
};

export default function Companies({ companies = COMPANIES }) {
  const n = companies.length;
  // Where the strip is, and where it was (to spot the company that wraps).
  const [{ active, from }, setPos] = useState({ active: 0, from: null });
  const [inView, setInView] = useState(false);
  const [still, setStill] = useState(false);
  const stageRef = useRef(null);

  // Distance of each company from the middle, -n/2 … n/2, wrapping round.
  const offset = (i, at) => {
    let k = (((i - at) % n) + n) % n;
    if (k > n / 2) k -= n;
    return k;
  };

  useEffect(() => {
    setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(stageRef.current);
    return () => io.disconnect();
  }, []);

  const next = () => setPos({ active: (active + 1) % n, from: active });

  return (
    <section className={styles.section} aria-labelledby="companies-title">
      <div className={styles.head}>
        <h2 id="companies-title" className={styles.title}>
          Companies we’ve <em>worked with.</em>
        </h2>
        <p className={styles.lede}>Businesses we’ve helped build, launch and grow.</p>
      </div>

      <div ref={stageRef} className={`${styles.stage} ${still ? styles.still : ''}`} aria-hidden="true">
        <span className={styles.rail} aria-hidden="true" />

        {companies.map((c, i) => {
          const k = offset(i, active);
          const jump = from !== null && Math.abs(k - offset(i, from)) > 1;
          const on = k === 0;
          return (
            <div
              key={c.name}
              className={`${styles.item} ${on ? styles.on : ''} ${jump ? styles.jump : ''} ${Math.abs(k) > 3 ? styles.far : ''}`}
              style={{ '--s': Math.sign(k), '--a': Math.abs(k) }}
            >
              <span className={styles.pill}>
                <Logo c={c} />
              </span>

              <div className={styles.card}>
                <div className={styles.id}>
                  <Logo c={c} big />
                  <p className={styles.tags}>
                    {c.own && <span className={styles.own}>Our own brand</span>}
                    <span>{c.sector}</span>
                    <span>{c.country}</span>
                  </p>
                </div>
                <ul className={styles.did}>
                  {c.did.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                {c.quote && (
                  <blockquote className={styles.quote}>
                    <p>“{c.quote.text}”</p>
                    <footer>
                      <b>{c.quote.name || c.name}</b>
                      {c.quote.name && (
                        <span>
                          {c.quote.role ? `${c.quote.role}, ` : ''}
                          {c.name}
                        </span>
                      )}
                    </footer>
                  </blockquote>
                )}
                {c.statement && <p className={styles.statement}>{c.statement}</p>}
                {c.href && (
                  <a className={styles.visit} href={c.href} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
                    Visit site <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.ctrl} aria-hidden="true">
        <span className={styles.prog}>
          <i key={active} className={inView ? '' : styles.held} style={{ animationDuration: `${hold(companies[active])}s` }} onAnimationEnd={next} />
        </span>
      </div>

      <ul className={styles.srOnly}>
        {companies.map((c) => (
          <li key={c.name}>
            {c.href ? <a href={c.href}>{c.name}</a> : c.name} ({c.own ? 'our own brand, ' : ''}
            {c.sector}, {c.country}): {c.did.join(', ')}.
            {c.quote && ` “${c.quote.text}” ${[c.quote.name, c.quote.role].filter(Boolean).join(', ') || c.name}.`}
            {c.statement && ` ${c.statement}`}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Logo({ c, big }) {
  return (
    <span className={`${styles.logo} ${big ? styles.logoBig : ''}`} aria-hidden="true">
      {c.logo ? <img src={c.logo} alt="" /> : <span className={styles.wordmark}>{c.name}</span>}
    </span>
  );
}
