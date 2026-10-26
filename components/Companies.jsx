'use client';

import { useEffect, useRef, useState } from 'react';
import { COMPANIES } from './companies';
import styles from './Companies.module.css';

/*
 * "Companies we've worked with": a strip of small logo-and-name pills across
 * the width of a dark section. Whichever company reaches the red marker in
 * the middle opens into a card with one or two highlights; after a few
 * seconds the strip moves on and the next one opens.
 *
 * Every company sits at a slot worked out from its distance to the middle
 * (CSS places the slots, so they scale with the screen). Moving on changes
 * those distances and the pills glide; the one wrapping round from one end to
 * the other jumps instead, out of sight.
 *
 * It pauses on hover, on focus, with the pause button, and while off screen;
 * for readers who prefer reduced motion it starts paused and doesn't glide.
 * The countdown is the progress bar itself: when its fill finishes, the strip
 * moves on, so pausing the bar pauses the strip.
 *
 * Companies live in companies.js.
 */

const HOLD = 5.5; // seconds each company stays open

export default function Companies({ companies = COMPANIES }) {
  const n = companies.length;
  // Where the strip is, and where it was (to spot the company that wraps).
  const [{ active, from }, setPos] = useState({ active: 0, from: null });
  const [stopped, setStopped] = useState(false);
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(false);
  const [still, setStill] = useState(false);
  const [told, setTold] = useState(false);
  const stageRef = useRef(null);
  const touchX = useRef(null);

  // Distance of each company from the middle, -n/2 … n/2, wrapping round.
  const offset = (i, at) => {
    let k = (((i - at) % n) + n) % n;
    if (k > n / 2) k -= n;
    return k;
  };

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    setStill(reduce.matches);
    if (reduce.matches) setStopped(true);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(stageRef.current);
    return () => io.disconnect();
  }, []);

  const go = (i, byHand = true) => {
    setPos({ active: ((i % n) + n) % n, from: active });
    if (byHand) setTold(true);
  };

  const paused = stopped || hover || !inView;

  return (
    <section className={styles.section} aria-labelledby="companies-title">
      <div className={styles.head}>
        <p className={styles.eyebrow}>Proof</p>
        <h2 id="companies-title" className={styles.title}>
          Companies we’ve <em>worked with.</em>
        </h2>
        <p className={styles.lede}>Businesses we’ve helped build, launch and grow.</p>
      </div>

      <div
        ref={stageRef}
        className={`${styles.stage} ${still ? styles.still : ''}`}
        role="region"
        aria-roledescription="carousel"
        aria-label="Companies we’ve worked with"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHover(false)}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - (touchX.current ?? e.changedTouches[0].clientX);
          if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        <span className={styles.rail} aria-hidden="true" />
        <span className={styles.mark} aria-hidden="true" />

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
              <button type="button" className={styles.pill} onClick={() => go(i)} tabIndex={on ? -1 : 0} aria-label={`Show ${c.name}`}>
                <Logo c={c} />
                <span className={styles.pillName}>{c.name}</span>
              </button>

              <article className={styles.card} aria-hidden={!on}>
                <div className={styles.id}>
                  <Logo c={c} big />
                  <div>
                    <h3 className={styles.name}>{c.name}</h3>
                    <p className={styles.tags}>
                      <span>{c.sector}</span>
                      <span>{c.country}</span>
                    </p>
                  </div>
                </div>
                <div className={`${styles.hl} ${c.highlights.length > 1 && c.highlights[0].figure ? styles.split : ''}`}>
                  {c.highlights.map((h, j) =>
                    h.figure ? (
                      <div key={j} className={styles.figure}>
                        <b>{h.figure}</b>
                        <small>{h.label}</small>
                      </div>
                    ) : (
                      <p key={j} className={styles.statement}>{h.text}</p>
                    )
                  )}
                </div>
                {c.href && (
                  <a className={styles.visit} href={c.href} target="_blank" rel="noopener noreferrer" tabIndex={on ? 0 : -1}>
                    Visit site <span aria-hidden="true">↗</span>
                  </a>
                )}
              </article>
            </div>
          );
        })}
      </div>

      <div className={styles.ctrl}>
        <button type="button" className={styles.btn} onClick={() => go(active - 1)} aria-label="Previous company">
          ←
        </button>
        <span className={styles.prog} aria-hidden="true">
          <i
            key={active}
            className={paused ? styles.held : ''}
            style={{ animationDuration: `${HOLD}s` }}
            onAnimationEnd={() => go(active + 1, false)}
          />
        </span>
        <button
          type="button"
          className={styles.btn}
          onClick={() => setStopped((v) => !v)}
          aria-label={stopped ? 'Play' : 'Pause'}
          aria-pressed={stopped}
        >
          {stopped ? '▶' : '❚❚'}
        </button>
        <button type="button" className={styles.btn} onClick={() => go(active + 1)} aria-label="Next company">
          →
        </button>
      </div>

      <p className={styles.srOnly} aria-live={told ? 'polite' : 'off'}>
        {companies[active].name}, {active + 1} of {n}
      </p>
    </section>
  );
}

function Logo({ c, big }) {
  return (
    <span className={`${styles.logo} ${big ? styles.logoBig : ''}`} aria-hidden="true">
      {c.logo ? <img src={c.logo} alt="" /> : c.initials}
    </span>
  );
}
