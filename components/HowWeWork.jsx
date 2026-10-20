'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from './HowWeWork.module.css';

/*
 * "How we work", the section after a journey's opening: one headline, then
 * the growth disciplines we work across, drawn as six nodes wired into a
 * central gear (the outcome they all drive).
 *
 * Desktop (1024px+): the hub diagram, three nodes a side, each with what it
 * covers beside it. Everything sits in the diagram's own 1200x600 units, as
 * percentages, so the wiring stays locked at any width. Below 1024px the
 * same content as the gear over a branching spine: two columns on tablets,
 * one on phones.
 *
 * Copy lives in journeys.js as `work`: { hub, disciplines[6] }, left column
 * first; a discipline's optional `node` gives its two lines in the circle.
 * The diagram wires up once, when it first comes into view.
 */

const W = 1200;
const H = 600;
const R = 86; // node radius
const NODES = [
  [365, 110], [355, 300], [365, 490], // left, top to bottom
  [835, 110], [845, 300], [835, 490], // right
];
const TICK = 40; // the short rule between a node and its list
const GAP = 14;

// Node to gear: out of the node's inner side, into the gear's flank.
const WIRES = [
  'M451 110C505 110 466 222 506 226',
  'M441 300H480',
  'M451 490C505 490 466 378 506 374',
  'M749 110C695 110 734 222 694 226',
  'M759 300H720',
  'M749 490C695 490 734 378 694 374',
];

// A twelve-tooth gear, centred on 0,0.
function gearPath(n = 12, outer = 140, root = 119) {
  const step = (Math.PI * 2) / n;
  const pt = (rad, a) => `${(rad * Math.cos(a)).toFixed(2)} ${(rad * Math.sin(a)).toFixed(2)}`;
  const base = step * 0.29;
  const tip = step * 0.19;
  let d = `M${pt(root, -base)}`;
  for (let i = 0; i < n; i++) {
    const a = i * step;
    d += `L${pt(outer, a - tip)}A${outer} ${outer} 0 0 1 ${pt(outer, a + tip)}L${pt(root, a + base)}`;
    d += `A${root} ${root} 0 0 1 ${pt(root, a + step - base)}`;
  }
  return `${d}Z`;
}
const GEAR = gearPath();

function Gear({ hub }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <div className={styles.gear}>
      <svg viewBox="-150 -150 300 300" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${id}-body`} cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#fffdf9" />
            <stop offset="0.6" stopColor="#f1ebe2" />
            <stop offset="1" stopColor="#ddd3c6" />
          </radialGradient>
          <radialGradient id={`${id}-well`} cx="62%" cy="68%" r="80%">
            <stop offset="0" stopColor="#fffdf9" />
            <stop offset="1" stopColor="#e4dbcf" />
          </radialGradient>
        </defs>
        <g className={styles.gearTurn}>
          <path d={GEAR} fill={`url(#${id}-body)`} stroke="rgba(110, 90, 70, 0.28)" strokeWidth="1.2" />
          <circle r="104" fill={`url(#${id}-well)`} stroke="rgba(110, 90, 70, 0.22)" strokeWidth="1.2" />
        </g>
        <circle r="88" fill="#fbf8f3" stroke="rgba(110, 90, 70, 0.16)" strokeWidth="1" />
      </svg>
      <p className={styles.hubText}>
        {hub[0]}
        <br />
        {hub[1]}
      </p>
    </div>
  );
}

const pct = (v, of) => `${(v / of) * 100}%`;

export default function HowWeWork({ work }) {
  const figRef = useRef(null);
  const [state, setState] = useState('');
  useEffect(() => {
    const el = figRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.8) return;
    setState(styles.armed);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState(`${styles.armed} ${styles.in}`);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { hub, disciplines } = work;
  const columns = [disciplines.slice(0, 3), disciplines.slice(3)];

  return (
    <section className={styles.section} aria-labelledby="work-title">
      <div className="shell">
        <p className={styles.eyebrow}>How we work</p>
        <h2 id="work-title" className={styles.title}>
          We don’t hand you a strategy. <em>We get in and do the work.</em>
        </h2>
        <p className={styles.lede}>Senior thinking is only useful if somebody makes it happen.</p>

        <h3 className={styles.subhead}>
          Complementary disciplines. <em>Compounding impact.</em>
        </h3>

        <div ref={figRef} className={`${styles.figure} ${state}`}>
          {/* Desktop: the hub diagram. */}
          <div className={styles.diagram}>
            <svg className={styles.wires} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
              {WIRES.map((d, i) => (
                <path key={d} d={d} pathLength="1" style={{ '--i': i % 3 }} />
              ))}
              {NODES.map(([x, y], i) => {
                const left = i < 3;
                const x1 = left ? x - R - TICK : x + R;
                return <path key={i} className={styles.tick} d={`M${x1} ${y}h${TICK}`} pathLength="1" style={{ '--i': i % 3 }} />;
              })}
            </svg>

            <div className={styles.hub} style={{ left: pct(600 - 150, W), top: pct(300 - 150, H), width: pct(300, W) }}>
              <Gear hub={hub} />
            </div>

            {disciplines.map((d, i) => {
              const [x, y] = NODES[i];
              const left = i < 3;
              const edge = left ? x - R - TICK - GAP : x + R + TICK + GAP;
              return (
                <div key={d.name} style={{ '--i': i % 3 }}>
                  <div
                    className={styles.node}
                    style={{ left: pct(x - R, W), top: pct(y - R, H), width: pct(R * 2, W) }}
                  >
                    <h4>
                      {d.node ? (
                        <>
                          {d.node[0]}
                          <br />
                          {d.node[1]}
                        </>
                      ) : (
                        d.name
                      )}
                    </h4>
                  </div>
                  <ul
                    className={`${styles.items} ${left ? styles.itemsLeft : ''}`}
                    style={left ? { right: pct(W - edge, W), top: pct(y, H) } : { left: pct(edge, W), top: pct(y, H) }}
                  >
                    {d.items.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Tablets and phones: the gear over a branching spine. */}
          <div className={styles.stack}>
            <div className={styles.stackHub}>
              <Gear hub={hub} />
            </div>
            <div className={styles.branches}>
              {columns.map((col, c) => (
                <ul key={c} className={styles.branch}>
                  {col.map((d, i) => (
                    <li key={d.name} style={{ '--i': c * 3 + i }}>
                      <h4>{d.name}</h4>
                      <p>{d.items.join(' · ')}</p>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
