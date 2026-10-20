'use client';

import { useEffect, useRef, useState } from 'react';
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
 *
 * Both versions run the same sequence once, when they first come into view:
 * the gear's back plate clicks into register, its enamel ring lights (a
 * sweep from the top round both sides), and the red runs out along the
 * lines to each discipline, which pulses as it arrives. Without the
 * animation (reduced motion) the page shows the finished, lit state.
 */

// The sequence, in seconds from its start: the click runs 0.2-1.15 and the
// ring lights 1.2-1.8 (both in the CSS), then the red flows out.
const FLOW_AT = 1.8;

const W = 1200;
const H = 600;
const R = 86; // node radius
const NODES = [
  [365, 110], [355, 300], [365, 490], // left, top to bottom
  [835, 110], [845, 300], [835, 490], // right
];
const TICK = 40; // the short rule between a node and its list
const GAP = 14;

// Gear to node: out of the gear's flank, into the node's inner side, with
// how long the red takes to run each (the curves are about four times the
// length of the straights).
const WIRES = [
  ['M506 226C466 222 505 110 451 110', 1.1],
  ['M480 300H441', 0.3],
  ['M506 374C466 378 505 490 451 490', 1.1],
  ['M694 226C734 222 695 110 749 110', 1.1],
  ['M720 300H759', 0.3],
  ['M694 374C734 378 695 490 749 490', 1.1],
];
const GEAR_BOX = 350; // the gear images' square canvas, in diagram units

// The gear: pre-rendered layers (tools/gear/build_gear.py), the words live
// text over the dial. state is '', 'armed' (waiting: back plate out of step,
// ring dark) or 'in' (running the sequence).
const LAYERS = ['shadow', 'back', 'front', 'ring', 'glow'];
const LAYER_CLASS = { back: 'plateBack', front: 'plateFront', ring: 'ring', glow: 'glow' };

function Gear({ hub, state = '' }) {
  const cls = state === 'in' ? `${styles.gearArmed} ${styles.gearIn}` : state === 'armed' ? styles.gearArmed : '';
  return (
    <div className={`${styles.gear} ${cls}`}>
      {LAYERS.map((l) => (
        <img
          key={l}
          className={LAYER_CLASS[l] ? styles[LAYER_CLASS[l]] : undefined}
          src={`/how-we-work/${l}.webp`}
          alt=""
          width="720"
          height="720"
          decoding="async"
          draggable="false"
        />
      ))}
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
 * In the sequence the red runs down both lines at once, so the bullets
 * light in reading order, each lighting the short rule to its title.
 */
const ORDER = [0, 3, 1, 4, 2, 5];
const DOT = 15;
const DROP = 56; // how far the lines fall while curving out to the sides
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
      const gy = g.top - r.top + g.height * 0.88; // just inside the bottom tooth
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
      sides.forEach((sd) => sd.dots.forEach((d) => (at[d.k] = FLOW_AT + d.at / speed)));
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
              style={{ '--len': sd.len, '--dur': `${sd.len / geo.speed}s`, '--from': `${FLOW_AT}s` }}
            />
          ))}
        </svg>
      )}
      <div ref={gearRef} className={styles.stackHub}>
        <Gear hub={hub} state={phase ? (phase.includes(styles.spineIn) ? 'in' : 'armed') : ''} />
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
    const el = figRef.current?.firstElementChild; // the desktop diagram
    if (!el || !el.offsetParent || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.5) return;
    setState('armed');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('in');
          io.disconnect();
        }
      },
      { threshold: 0.6 }
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

        <div
          ref={figRef}
          className={`${styles.figure} ${state ? styles.armed : ''} ${state === 'in' ? styles.in : ''}`}
        >
          {/* Desktop: the hub diagram. */}
          <div className={styles.diagram}>
            <svg className={styles.wires} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
              {WIRES.map(([d]) => (
                <path key={d} d={d} />
              ))}
              {WIRES.map(([d, dur]) => (
                <path
                  key={`g${d}`}
                  className={styles.wireGlow}
                  d={d}
                  pathLength="1"
                  style={{ '--dur': `${dur}s`, '--from': `${FLOW_AT}s` }}
                />
              ))}
              {NODES.map(([x, y], i) => {
                const left = i < 3;
                const x1 = left ? x - R : x + R;
                return (
                  <path
                    key={i}
                    className={styles.tick}
                    d={`M${x1} ${y}h${left ? -TICK : TICK}`}
                    style={{ '--at': `${FLOW_AT + WIRES[i][1]}s` }}
                  />
                );
              })}
            </svg>

            <div
              className={styles.hub}
              style={{
                left: pct(600 - GEAR_BOX / 2, W),
                top: pct(300 - GEAR_BOX / 2, H),
                width: pct(GEAR_BOX, W),
              }}
            >
              <Gear hub={hub} state={state} />
            </div>

            {disciplines.map((d, i) => {
              const [x, y] = NODES[i];
              const left = i < 3;
              const edge = left ? x - R - TICK - GAP : x + R + TICK + GAP;
              return (
                <div key={d.name} style={{ '--at': `${FLOW_AT + WIRES[i][1]}s` }}>
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
