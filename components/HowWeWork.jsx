'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import styles from './HowWeWork.module.css';

/*
 * "How we work", the section after a journey's opening: a tilted cream board
 * on a dark, dotted photo, holding the headline and a bento grid of the six
 * growth disciplines around "Profitable growth".
 *
 * Each discipline card links to its own page. Cards lift and turn red under
 * the pointer, and under a finger on touch screens, including while it is
 * scrolling past (the card under the finger is tracked from touch events,
 * which are passive, so scrolling is never held up).
 *
 * Copy lives in journeys.js as `work`: { photo, disciplines[6] }, each
 * { slug, icon, name, items }. Links go to `${base}/${slug}`.
 */

export function DisciplineIcon({ name }) {
  const paths = {
    target: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.6" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
    funnel: <path d="M3.5 5h17l-6.5 7.5V19l-4-2v-4.5L3.5 5Z" />,
    compass: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m15.6 8.4-2.2 5-5 2.2 2.2-5 5-2.2Z" />
      </>
    ),
    bars: (
      <>
        <path d="M5 19v-6M10 19V7M15 19v-9M20 19V4" />
        <path d="M3 19h18" />
      </>
    ),
    cart: (
      <>
        <path d="M3 4h2.2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1" />
        <circle cx="9.5" cy="19.5" r="1.3" />
        <circle cx="17" cy="19.5" r="1.3" />
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
    chip: (
      <>
        <rect x="7" y="7" width="10" height="10" rx="1.6" />
        <path d="M10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5" />
      </>
    ),
    people: (
      <>
        <circle cx="8.5" cy="8.5" r="2.8" />
        <circle cx="16" cy="9.5" r="2.3" />
        <path d="M3.5 18.5c.6-3.2 2.6-4.8 5-4.8s4.4 1.6 5 4.8M13.8 14.2c.7-.4 1.4-.6 2.2-.6 2 0 3.6 1.4 4.2 4.4" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

// Where each card sits in the desktop bento (4 columns, 3 rows), in order;
// the hub fills the middle of row two.
const AREAS = ['a', 'b', 'c', 'd', 'e', 'f'];

export default function HowWeWork({ work, base }) {
  const boardRef = useRef(null);
  const [touched, setTouched] = useState(null);
  const [shown, setShown] = useState(true);

  // The board swings into place once, when it first comes into view.
  useEffect(() => {
    const el = boardRef.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    setShown(false);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Touch: light the card under the finger as it moves, scrolling or not.
  useEffect(() => {
    const board = boardRef.current;
    let clear;
    const pick = (e) => {
      const t = e.touches[0];
      if (!t) return;
      const card = document.elementFromPoint(t.clientX, t.clientY)?.closest('[data-card]');
      clearTimeout(clear);
      setTouched(card && board.contains(card) ? card.dataset.card : null);
    };
    const end = () => {
      clearTimeout(clear);
      clear = setTimeout(() => setTouched(null), 450);
    };
    board.addEventListener('touchstart', pick, { passive: true });
    board.addEventListener('touchmove', pick, { passive: true });
    board.addEventListener('touchend', end, { passive: true });
    board.addEventListener('touchcancel', end, { passive: true });
    return () => {
      clearTimeout(clear);
      board.removeEventListener('touchstart', pick);
      board.removeEventListener('touchmove', pick);
      board.removeEventListener('touchend', end);
      board.removeEventListener('touchcancel', end);
    };
  }, []);

  // Pointer: a slight tilt towards the cursor on the card it is over.
  const tilt = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty('--tx', `${(x * 6).toFixed(2)}deg`);
    e.currentTarget.style.setProperty('--ty', `${(-y * 6).toFixed(2)}deg`);
  };
  const untilt = (e) => {
    e.currentTarget.style.removeProperty('--tx');
    e.currentTarget.style.removeProperty('--ty');
  };

  return (
    <section
      className={styles.section}
      aria-labelledby="work-title"
      style={{ '--photo': `url(${work.photo})` }}
    >
      <div className="shell">
        <div ref={boardRef} className={`${styles.board} ${shown ? '' : styles.waiting}`}>
          <p className={styles.eyebrow}>How we work</p>
          <h2 id="work-title" className={styles.title}>
            We don’t hand you a strategy. <em>We get in and do the work.</em>
          </h2>
          <p className={styles.lede}>Senior thinking is only useful if somebody makes it happen.</p>

          <div className={styles.bento}>
            {work.disciplines.map((d, i) => (
              <Link
                key={d.slug}
                href={`${base}/${d.slug}`}
                data-card={d.slug}
                className={`${styles.card} ${styles[AREAS[i]]} ${touched === d.slug ? styles.active : ''}`}
                style={{ '--i': i }}
                onPointerMove={tilt}
                onPointerLeave={untilt}
              >
                <span className={styles.icon}>
                  <DisciplineIcon name={d.icon} />
                </span>
                <span className={styles.num} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className={styles.name}>{d.name}</h3>
                <ul className={styles.items}>
                  {d.items.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <span className={styles.more} aria-hidden="true">
                  How it works <b>→</b>
                </span>
              </Link>
            ))}

            <div className={styles.hub}>
              <p className={styles.hubEyebrow}>
                Complementary disciplines. <em>Compounding impact.</em>
              </p>
              <p className={styles.hubTitle}>Profitable growth</p>
              <p className={styles.hubText}>Six disciplines run as one commercial function, so a gain in one isn’t lost in the next.</p>
            </div>

            <Link href="/contact" className={styles.start}>
              <p className={styles.startTitle}>Not sure which of the six is holding you back?</p>
              <span className={styles.more} aria-hidden="true">
                Talk to us <b>→</b>
              </span>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
