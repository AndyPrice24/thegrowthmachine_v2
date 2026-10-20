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
 * same content as the gear over two lines, one down each side (see Spine).
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

// A graphite gear with a red rim and a polished metal centre behind the
// words. split (the spine version) adds a darker plate directly behind,
// turned part of a tooth out of step so its teeth show through, which
// clicks into register; then the teeth blink red and keep the red rim.
function Gear({ hub, split = false }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <div className={styles.gear}>
      <svg viewBox="-150 -150 300 300" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${id}-body`} cx="36%" cy="30%" r="78%">
            <stop offset="0" stopColor="#a8a39c" />
            <stop offset="0.55" stopColor="#7a756e" />
            <stop offset="1" stopColor="#56524c" />
          </radialGradient>
          <radialGradient id={`${id}-back`} cx="36%" cy="30%" r="78%">
            <stop offset="0" stopColor="#6c6862" />
            <stop offset="1" stopColor="#3b3834" />
          </radialGradient>
          <linearGradient id={`${id}-bevel`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#ebe8e3" />
            <stop offset="0.5" stopColor="#b9b4ad" />
            <stop offset="1" stopColor="#8d8881" />
          </linearGradient>
        </defs>
        {split && (
          <g className={styles.plateBack}>
            <path d={GEAR} fill={`url(#${id}-back)`} stroke="rgba(25, 20, 15, 0.4)" strokeWidth="1.2" />
          </g>
        )}
        <g className={split ? styles.plateFront : styles.gearTurn}>
          <path d={GEAR} fill={`url(#${id}-body)`} stroke="rgba(25, 20, 15, 0.35)" strokeWidth="1.2" />
          <circle r="104" fill={`url(#${id}-bevel)`} stroke="rgba(25, 20, 15, 0.3)" strokeWidth="1" />
        </g>
        {split && <path className={styles.flash} d={GEAR} fill="#c8221c" />}
        <path className={styles.rim} d={GEAR} fill="none" stroke="#c8221c" strokeWidth="2.4" />
      </svg>
      <span className={styles.metal} aria-hidden="true" />
      <p className={styles.hubText}>
        {hub[0]}
        <br />
        {hub[1]}
      </p>
    </div>
  );
}

/*
 * Below 1024px: the gear, and from the bottom of it two lines, one down each
 * side. The disciplines alternate between them (left side as on desktop:
 * the first three), titles on the left line left-aligned, on the right line
 * right-aligned. The lines are drawn from measured positions so they meet
 * each bullet exactly.
 *
 * Once, as the gear comes into view: its back plate clicks into register,
 * the teeth blink red and keep a red rim, a glint crosses the metal centre, then a red glow runs down both
 * lines and each bullet pulses as the glow reaches it, in reading order,
 * lighting the short rule to its title. Without the animation (reduced
 * motion), the page shows that finished state.
 */
const ORDER = [0, 3, 1, 4, 2, 5];
const DOT = 15;
const DROP = 56; // how far the lines fall while curving out to the sides
const GLOW_START = 1.6; // s, after the plates lock and the blink
const GLOW_TIME = 3.6; // s, for the longer of the two lines

function bezierLength(p0, p1, p2, p3) {
  let len = 0;
  let prev = p0;
  for (let i = 1; i <= 40; i++) {
    const t = i / 40;
    const u = 1 - t;
    const pt = [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
    len += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]);
    prev = pt;
  }
  return len;
}

function Spine({ hub, disciplines }) {
  const rootRef = useRef(null);
  const gearRef = useRef(null);
  const listRef = useRef(null);
  const [geo, setGeo] = useState(null);
  const [phase, setPhase] = useState('');

  useEffect(() => {
    const root = rootRef.current;
    const measure = () => {
      if (!root.offsetParent) return; // hidden on desktop
      const r = root.getBoundingClientRect();
      const g = gearRef.current.getBoundingClientRect();
      const cx = g.left + g.width / 2 - r.left;
      const gy = g.top - r.top + g.height * 0.9;
      const items = [...listRef.current.children];
      const sides = ['left', 'right'].map((side) => {
        const x = side === 'left' ? DOT / 2 : r.width - DOT / 2;
        const p0 = [cx, gy];
        const p1 = [cx, gy + DROP * 0.75];
        const p2 = [x, gy + DROP * 0.25];
        const p3 = [x, gy + DROP];
        const curve = bezierLength(p0, p1, p2, p3);
        const dots = items
          .map((li, k) => ({ li, k }))
          .filter(({ k }) => (ORDER[k] >= 3) === (side === 'right'))
          .map(({ li, k }) => {
            const top = parseFloat(getComputedStyle(li, '::after').top) || 0;
            const y = li.getBoundingClientRect().top - r.top + top + DOT / 2;
            return { k, at: curve + (y - p3[1]) };
          });
        const end = dots[dots.length - 1].at;
        return {
          d: `M${p0}C${p1} ${p2} ${p3}V${p3[1] + end - curve}`,
          len: end,
          dots,
        };
      });
      const speed = Math.max(...sides.map((sd) => sd.len)) / GLOW_TIME;
      const at = [];
      sides.forEach((sd) => sd.dots.forEach((d) => (at[d.k] = GLOW_START + d.at / speed)));
      setGeo({ w: r.width, h: r.height, sides, speed, at });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  const ready = Boolean(geo);
  useEffect(() => {
    const el = gearRef.current;
    if (!ready || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.6) return;
    setPhase(styles.spineArmed);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase(`${styles.spineArmed} ${styles.spineIn}`);
          io.disconnect();
        }
      },
      { threshold: 1, rootMargin: '0px 0px -12% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready]);

  return (
    <div ref={rootRef} className={`${styles.stack} ${phase}`}>
      {geo && (
        <svg className={styles.spine} width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden="true" focusable="false">
          {geo.sides.map((sd) => (
            <path key={`b${sd.d}`} className={styles.spineBase} d={sd.d} />
          ))}
          {geo.sides.map((sd) => (
            <path
              key={`g${sd.d}`}
              className={styles.spineGlow}
              d={sd.d}
              style={{ '--len': sd.len, '--dur': `${sd.len / geo.speed}s` }}
            />
          ))}
        </svg>
      )}
      <div ref={gearRef} className={styles.stackHub}>
        <Gear hub={hub} split />
      </div>
      <ol ref={listRef} className={styles.zig}>
        {ORDER.map((idx, k) => {
          const d = disciplines[idx];
          return (
            <li
              key={d.name}
              className={idx >= 3 ? styles.right : undefined}
              style={geo ? { '--at': `${geo.at[k]}s` } : undefined}
            >
              <h4>{d.name}</h4>
              <p>
                {d.items.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </p>
            </li>
          );
        })}
      </ol>
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

          {/* Tablets and phones: the gear over two lines, one down each side. */}
          <Spine hub={hub} disciplines={disciplines} />
        </div>
      </div>
    </section>
  );
}
