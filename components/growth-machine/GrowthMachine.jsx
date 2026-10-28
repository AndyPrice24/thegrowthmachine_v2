'use client';

/*
 * The Growth Machine hero.
 *
 * Andrew's approved artwork is the machine. Every layer in /public/machine is
 * generated from the two approved WebPs by tools/machine/build_machine.py,
 * which also writes manifest.json: card boxes, gear centres and tooth counts,
 * and the traced centre-line of every pipe, all in the artwork's own pixels.
 *
 *   body.webp      the machine with true transparency (no backdrop rectangle)
 *   cards          live text, sized to stay readable, where the art had them
 *   logo           the real vector logo over the cleaned nameplate
 *   rig            gear rings that turn; shown only while they turn, so at
 *                  rest the page shows the approved art itself
 *   flow           light that travels along the real pipe paths
 *
 * It plays once, when the machine comes into view: input cards light, the
 * inlet pipes energise into the inlet, whose red innard lights; light runs
 * along the shaft to the flash at the central gear; the gear turns once and
 * the function gears answer it; light runs from the gear's other flash along
 * the outlet shaft, the outlet's innard lights, the outlet pipes energise and
 * the outcome cards light; then it settles with the inlet rings softly lit. Reduced motion shows the settled
 * state without movement. Without JavaScript it is the static machine.
 */
import { useEffect, useRef } from 'react';
import manifest from './manifest.json';
import { LOGO_VIEWBOX, WORDMARK, COG, COG_CENTRE, COG_SCALE, COG_SHADOW } from './logo-paths';
import styles from './GrowthMachine.module.css';

const INPUTS = ['Stalled growth', 'Unclear GTM', 'Weak acquisition', 'Low conversion', 'Margin leakage', 'Founder dependency'];
const OUTPUTS = ['More revenue', 'Better margins', 'Better systems', 'AI-enabled operations', 'Stronger team', 'Scalable growth'];

/* Timeline, in seconds from the start. Total about 5s. The gear turn and
   the settle are passed to the CSS as --gears and --settle. */
const T = {
  cardIn: (i) => 0.0 + i * 0.09,
  pipeIn: (i) => 0.28 + i * 0.09,
  innardIn: 1.3,
  shaftIn: 1.55,
  gears: 1.9,
  shaftOut: 2.95,
  innardOut: 3.3,
  pipeOut: (i) => 3.5 + i * 0.07,
  cardOut: (i) => 3.95 + i * 0.08,
  settle: 4.7,
};

const LOGO_ASPECT = 528 / 1409;

const pct = (v, total) => `${((v / total) * 100).toFixed(4)}%`;

function Stage({ kind }) {
  const m = manifest[kind];
  const [W, H] = m.size;
  const box = ([x, y, w, h]) => ({ left: pct(x, W), top: pct(y, H), width: pct(w, W), height: pct(h, H) });
  const src = (name) => `/machine/${kind}/${name}.webp`;
  const red = m.gears.find((g) => g.id === 'red');
  const logoH = m.logo.w * LOGO_ASPECT;

  const card = (label, b, i, dir) => (
    <li
      key={label}
      className={`${styles.card} ${dir === 'in' ? styles.cardIn : styles.cardOut}`}
      style={{ ...box(b), '--d': `${dir === 'in' ? T.cardIn(i) : T.cardOut(i)}s` }}
    >
      <span>{label}</span>
    </li>
  );

  const flowPath = (p, key, delay, dur, cls) => (
    <g key={key} className={cls} style={{ '--d': `${delay}s`, '--dur': `${dur}s` }}>
      <path className={styles.glow} d={p.d} pathLength="1" filter={`url(#gm-blur-${kind})`} />
      <path className={styles.core} d={p.d} pathLength="1" />
      <path className={styles.head} d={p.d} pathLength="1" filter={`url(#gm-soft-${kind})`} />
    </g>
  );

  return (
    <div className={`${styles.stage} ${styles[kind]}`}>
      {kind === 'mobile' && (
        <ul className={styles.compact} aria-hidden="true">
          {INPUTS.map((label, i) => (
            <li key={label} className={`${styles.card} ${styles.cardIn}`} style={{ '--d': `${T.cardIn(i)}s` }}>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.canvas} style={{ aspectRatio: `${W} / ${H}` }}>
        {kind === 'desktop' && <div className={styles.shadow} aria-hidden="true" />}
        <img className={styles.body} src={src('body')} alt="" width={W} height={H} decoding="async" />

        <div className={styles.rig} aria-hidden="true">
          <img className={styles.layer} style={box(m.rig)} src={src('rig-base')} alt="" />
          {m.gears.map((g) => (
            <img
              key={g.id}
              className={`${styles.layer} ${styles.gear}`}
              style={{
                ...box(g.box),
                transformOrigin: `${pct(g.pivot[0], g.box[2])} ${pct(g.pivot[1], g.box[3])}`,
                '--turn': `${g.id === 'red' ? 360 : (-360 * red.N) / g.N}deg`,
              }}
              src={src(`gear-${g.id}`)}
              alt=""
            />
          ))}
          <img className={styles.layer} style={box(m.rig)} src={src('rig-front')} alt="" />
        </div>

        <img
          className={`${styles.layer} ${styles.innard}`}
          style={{ ...box(m.innardIn), '--d': `${T.innardIn}s` }}
          src={src('innard-in')}
          alt=""
          aria-hidden="true"
        />
        <img
          className={`${styles.layer} ${styles.innard}`}
          style={{ ...box(m.innardOut), '--d': `${T.innardOut}s` }}
          src={src('innard-out')}
          alt=""
          aria-hidden="true"
        />

        <svg className={styles.arcs} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
          {m.arcs.lines.map((d, i) => (
            <path key={`l${i}`} className={styles.ringLine} d={d} />
          ))}
          {m.arcs.nums.map((g, i) => (
            <text key={`n${i}`} className={styles.stepNum} x={g.x} y={g.y} fontSize={g.size} transform={`rotate(${g.rot} ${g.x} ${g.y})`}>
              {g.ch}
            </text>
          ))}
          {m.arcs.glyphs.map((g, i) => (
            <text key={`g${i}`} x={g.x} y={g.y} fontSize={g.size} transform={`rotate(${g.rot} ${g.x} ${g.y})`}>
              {g.ch}
            </text>
          ))}
        </svg>

        <svg className={styles.flow} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
          <defs>
            <filter id={`gm-blur-${kind}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={kind === 'desktop' ? 3.2 : 3.6} />
            </filter>
            <filter id={`gm-soft-${kind}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          </defs>
          {m.pipesIn.map((p, i) => flowPath(p, `in${i}`, T.pipeIn(i), 0.78, styles.pipeIn))}
          {flowPath(m.shaftIn, 'shaftIn', T.shaftIn, 0.36, styles.shaft)}
          {flowPath(m.shaftOut, 'shaftOut', T.shaftOut, 0.36, styles.shaft)}
          {m.pipesOut.map((p, i) => flowPath(p, `out${i}`, T.pipeOut(i), 0.72, styles.pipeOut))}
        </svg>

        <svg
          className={styles.logo}
          style={{
            left: pct(m.logo.cx - m.logo.w / 2, W),
            top: pct(m.logo.cy - logoH / 2, H),
            width: pct(m.logo.w, W),
          }}
          viewBox={LOGO_VIEWBOX}
          role="img"
          aria-label="The Growth Machine"
        >
          {WORDMARK.map((d, i) => (
            <path key={i} d={d} className={styles.wordmark} />
          ))}
          <g transform={`translate(${COG_CENTRE.x} ${COG_CENTRE.y}) scale(${COG_SCALE})`}>
            <g transform={`translate(${COG_SHADOW.x / COG_SCALE} ${COG_SHADOW.y / COG_SCALE})`}>
              <path d={COG} className={`${styles.logoGear} ${styles.logoGearShadow}`} />
            </g>
            <path d={COG} className={styles.logoGear} />
          </g>
        </svg>

        <ul className={styles.inputs} aria-label="What comes in">
          {INPUTS.map((label, i) => card(label, m.cardsIn[i], i, 'in'))}
        </ul>
        <ul className={styles.outputs} aria-label="What comes out">
          {OUTPUTS.map((label, i) => card(label, m.cardsOut[i], i, 'out'))}
        </ul>
      </div>
      {kind === 'mobile' && (
        <ul className={styles.compact} aria-hidden="true">
          {OUTPUTS.map((label, i) => (
            <li key={label} className={`${styles.card} ${styles.cardOut}`} style={{ '--d': `${T.cardOut(i)}s` }}>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function GrowthMachine() {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add(styles.settled);
      return;
    }
    let started = false;
    const start = async () => {
      if (started) return;
      started = true;
      // Wait for the visible stage's layers so nothing pops in mid-sequence.
      const imgs = [...root.querySelectorAll('img')].filter((img) => img.offsetParent !== null);
      await Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())));
      requestAnimationFrame(() => root.classList.add(styles.running));
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect();
          start();
        }
      },
      { threshold: 0.45 }
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <figure ref={ref} className={styles.machine} style={{ '--gears': `${T.gears}s`, '--settle': `${T.settle}s` }}>
      <Stage kind="desktop" />
      <Stage kind="mobile" />
      <figcaption className={styles.srOnly}>
        The Growth Machine. Growth problems go in: stalled growth, unclear go-to-market, weak acquisition, low
        conversion, margin leakage and founder dependency. Four connected functions, strategy and GTM, brand and
        demand, operations and revenue, are driven together by The Growth Machine through diagnose, design, execute
        and embed. What comes out: more revenue, better margins, better systems, AI-enabled operations, a stronger
        team and scalable growth.
      </figcaption>
    </figure>
  );
}
