'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './HowWeWork.module.css';

/*
 * "How we work", the section after a journey's opening. Not a process: the
 * growth disciplines we work across, each with what we actually do in it, set
 * as one interlocking grid (a + where tiles meet), then why working across
 * them compounds.
 *
 * Per-journey copy lives in journeys.js as `work`: { disciplines, compounding }.
 * The tiles settle in once, when the grid first comes into view.
 */
export default function HowWeWork({ work }) {
  const gridRef = useRef(null);
  const [state, setState] = useState('');
  useEffect(() => {
    const el = gridRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    setState(styles.armed);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState(`${styles.armed} ${styles.in}`);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className={styles.section} aria-labelledby="work-title">
      <div className="shell">
        <header className={styles.head}>
          <div>
            <p className={styles.eyebrow}>How we work</p>
            <h2 id="work-title" className={styles.title}>
              We don’t hand you a strategy. <em>We get in and do the work.</em>
            </h2>
          </div>
          <p className={styles.lede}>Senior thinking is only useful if somebody makes it happen.</p>
        </header>

        <h3 className={styles.subhead}>
          Complementary disciplines. <em>Compounding impact.</em>
        </h3>

        <div ref={gridRef} className={`${styles.grid} ${state}`}>
          <ol className={styles.list}>
            {work.disciplines.map((d, i) => (
              <li key={d.name} className={styles.item} style={{ '--i': i }}>
                <span className={styles.num} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h4 className={styles.name}>{d.name}</h4>
                <p className={styles.text}>{d.text}</p>
              </li>
            ))}
          </ol>
          {[1, 2].map((n) => (
            <span key={n} className={`${styles.plus} ${styles[`p${n}`]}`} aria-hidden="true" />
          ))}
        </div>

        <div className={styles.close}>
          <p className={styles.closeLabel}>Why it compounds</p>
          <p className={styles.closeText}>
            {work.compounding.map((s, i) => (
              <span key={s} className={i === work.compounding.length - 1 ? styles.closeLast : undefined}>
                {s}{' '}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
