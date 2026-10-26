'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { DisciplineIcon } from './HowWeWork';
import styles from './ContextIntelligence.module.css';

/*
 * "Data, systems & AI", after How we work on each journey: the headline, then
 * a working miniature of the tools we build, one screen per growth
 * discipline. Each screen asks one question and answers it twice: the chart
 * one system gives you ("On its own", and the conclusion it invites), then
 * the same question with the other sources joined in ("In context", and the
 * real story), then three key figures and the action.
 *
 * Desktop (from 1180px): the disciplines down the left of a dark screen, the
 * two answers side by side. Tablets and phones: the disciplines become a row
 * of tabs above the screen, which shows one answer at a time behind a
 * "Plain data" / "Enhanced data" switch. Every discipline opens on plain
 * data; the reader always has to ask for the enhanced view.
 *
 * Copy and figures live in intel.js. Charts are drawn here, to the width
 * they are given, and grow in each time a screen or answer is shown.
 */

const SOURCE_ICONS = {
  crm: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3.3 2.7-5 5.5-5s4.9 1.7 5.5 5" /><path d="M16 5.5a3 3 0 0 1 0 5.6M18 14.3c1.5.6 2.4 2.1 2.7 4.7" /></>,
  mega: <><path d="M4 10v4h3l7 4V6l-7 4z" /><path d="M17.5 9.5a4 4 0 0 1 0 5" /></>,
  db: <><ellipse cx="12" cy="6" rx="7" ry="2.6" /><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" /></>,
  tag: <><path d="M3.5 12.5V4.5h8l9 9-8 8z" /><circle cx="8" cy="9" r="1.4" /></>,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  cal: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
  people: <><circle cx="8.5" cy="8.5" r="2.8" /><circle cx="16" cy="9.5" r="2.3" /><path d="M3.5 18.5c.6-3.2 2.6-4.8 5-4.8s4.4 1.6 5 4.8M13.8 14.2c.7-.4 1.4-.6 2.2-.6 2 0 3.6 1.4 4.2 4.4" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  store: <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16v10H4zM9 19.5v-5h6v5" />,
  chart: <><path d="M4 4v16h16" /><path d="m7 14 4-4 3 3 5-6" /></>,
  box: <><path d="M12 3 4 7v10l8 4 8-4V7z" /><path d="m4 7 8 4 8-4M12 11v10" /></>,
  cart: <><path d="M3 4h2.2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></>,
  send: <><path d="M21 3 10 14" /><path d="m21 3-7 18-4-7-7-4z" /></>,
};

function Icon({ name, className = styles.icon }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {SOURCE_ICONS[name]}
    </svg>
  );
}

// "*Meta customers are worth 1.8x* Google’s." → the starred words in red.
function Marked({ text }) {
  return text.split('*').map((part, i) => (i % 2 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>));
}

// ------------------------------------------------------------------ charts

// Each chart draws at the pixel width of its box, so its text stays the same
// size on a phone and a desktop. Until measured (and when rendered on the
// server) it assumes a typical width.
function useWidth(ref) {
  const [width, setWidth] = useState(380);
  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

const pct = (i) => ({ '--i': i });

function VBars({ c, W, hot }) {
  const H = 210, n = c.bars.length, gap = W / n, bw = Math.min(64, gap * 0.5), base = H - 24, top = 42;
  const max = Math.max(...c.bars.map((b) => b[1]));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {c.bars.map(([label, v, shown], i) => {
        const x = i * gap + (gap - bw) / 2, h = Math.max(3, ((base - top) * v) / max);
        return (
          <g key={label} style={pct(i)}>
            <rect className={`${styles.growY} ${i === 0 ? styles.barLead : styles.barMuted}`} x={x} y={base - h} width={bw} height={h} rx="3" />
            <text className={`${styles.fade} ${i === 0 ? styles.bigLead : styles.bigMuted}`} x={x + bw / 2} y={base - h - 10} textAnchor="middle">{shown}</text>
            <text className={styles.label} x={x + bw / 2} y={H - 6} textAnchor="middle">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function HBars({ c, W, hot }) {
  const n = c.rows.length, RH = Math.min(46, Math.max(27, 180 / n)), bh = Math.min(18, RH * 0.55);
  const lw = Math.min(124, W * 0.33), x1 = W - 58, max = Math.max(...c.rows.map((r) => r[1]));
  return (
    <svg width={W} height={RH * n} viewBox={`0 0 ${W} ${RH * n}`}>
      {c.rows.map(([label, v, shown, red], i) => {
        const y = i * RH + RH / 2, w = Math.max(3, ((x1 - lw) * v) / max);
        const tone = hot ? (red ? styles.barHot : styles.barLight) : i === 0 ? styles.barLead : styles.barMuted;
        return (
          <g key={label} style={pct(i)}>
            <text className={hot && red ? styles.labelHot : hot ? styles.labelLight : styles.label} x="0" y={y + 4}>{label}</text>
            <rect className={`${styles.growX} ${tone}`} x={lw} y={y - bh / 2} width={w} height={bh} rx="2" />
            <text className={`${styles.fade} ${hot && red ? styles.valueHot : hot ? styles.valueLight : styles.value}`} x={lw + w + 6} y={y + 4}>{shown}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Diverge({ c, W }) {
  const n = c.rows.length, RH = Math.min(46, Math.max(27, 180 / n)), bh = Math.min(18, RH * 0.55);
  const vals = c.rows.map((r) => r[1]);
  const lo = Math.min(0, ...vals) * 1.05, hi = Math.max(0, ...vals) * 1.05 || 1;
  const lw = Math.min(150, W * 0.36), x0 = lw + 4, x1 = W - 62, s = (x1 - x0) / (hi - lo), z = x0 - lo * s;
  return (
    <svg width={W} height={RH * n} viewBox={`0 0 ${W} ${RH * n}`}>
      <line className={styles.zero} x1={z} x2={z} y1="0" y2={RH * n} />
      {c.rows.map(([label, v, shown], i) => {
        const y = i * RH + RH / 2, neg = v < 0, w = Math.max(2, Math.abs(v) * s);
        return (
          <g key={label} style={pct(i)}>
            <text className={neg ? styles.labelHot : styles.labelLight} x="0" y={y + 4}>{label}</text>
            <rect className={`${neg ? styles.growXr : styles.growX} ${neg ? styles.barHot : styles.barLight}`} x={neg ? z - w : z} y={y - bh / 2} width={w} height={bh} rx="2" />
            <text className={`${styles.fade} ${neg ? styles.valueHot : styles.valueLight}`} x={neg ? z + 6 : z + w + 6} y={y + 4}>{shown}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Slope({ c, W }) {
  // Columns placed so the longest label on each side just fits.
  const room = (side) => Math.max(...c.items.map((x) => (x[0].length + x[side].length + 1) * 6.2)) + 14;
  const H = 214, xl = Math.round(room(1)), xr = Math.round(W - room(2)), ty = 36, rh = (H - ty - 12) / (c.items.length - 1);
  const items = [...c.items].sort((a, b) => (a[0] === c.hot) - (b[0] === c.hot));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <text className={styles.axis} x={xl} y="12" textAnchor="middle">{c.left}</text>
      <text className={styles.axis} x={xr} y="12" textAnchor="middle">{c.right}</text>
      {items.map(([name, l, r], i) => {
        const yl = ty + c.items.findIndex((x) => x[0] === name) * rh, yr = ty + c.rightOrder.indexOf(name) * rh, hot = name === c.hot;
        const mx = (xl + xr) / 2;
        return (
          <g key={name} style={pct(i)}>
            <path pathLength="1" className={`${styles.draw} ${hot ? styles.lineHot : styles.lineMuted}`} d={`M${xl} ${yl} C ${mx} ${yl}, ${mx} ${yr}, ${xr} ${yr}`} />
            <circle className={hot ? styles.dotHot : styles.dotMuted} cx={xl} cy={yl} r="5" />
            <circle className={`${styles.fade} ${hot ? styles.dotHot : styles.dotMuted}`} cx={xr} cy={yr} r="5" />
            <text className={hot ? styles.valueHot : styles.label} x={xl - 12} y={yl + 4} textAnchor="end">{name} {l}</text>
            <text className={`${styles.fade} ${hot ? styles.valueHot : styles.valueLight}`} x={xr + 12} y={yr + 4}>{r} {name}</text>
          </g>
        );
      })}
    </svg>
  );
}

const LINE_TONES = { dash: 'lineDash', muted: 'lineMuted', light: 'lineLight', hot: 'lineHot' };
const END_TONES = { dash: 'label', muted: 'label', light: 'valueLight', hot: 'valueHot' };

function Lines({ c, W, hot }) {
  const H = 200, pl = 4, pr = 104, pt = c.markers ? 26 : 12, pb = 24, n = c.x.length;
  const X = (i) => pl + (i * (W - pl - pr)) / (n - 1);
  const Y = (s, v) => {
    const [lo, hi] = s.range || c.range;
    return pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  };
  const pts = (s) => s.points.map((v, i) => [X(i), Y(s, v)]);
  // End labels, nudged apart so they never sit on top of each other.
  const ends = c.series.map((s, i) => ({ i, y: Y(s, s.points[n - 1]) })).sort((a, b) => a.y - b.y);
  ends.forEach((e, k) => {
    if (k && e.y - ends[k - 1].y < 15) e.y = ends[k - 1].y + 15;
  });
  const endY = Object.fromEntries(ends.map((e) => [e.i, e.y]));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {[0, 0.5, 1].map((g) => <line key={g} className={styles.grid} x1={pl} x2={W - pr} y1={pt + g * (H - pt - pb)} y2={pt + g * (H - pt - pb)} />)}
      {c.gap && (
        <polygon
          className={`${styles.fade} ${styles.gapFill}`}
          points={[...pts(c.series[c.gap[0]]), ...pts(c.series[c.gap[1]]).reverse()].map((p) => p.join(',')).join(' ')}
        />
      )}
      {(c.markers || []).map((m, k) => (
        <g key={m.label} className={styles.fade} style={pct(4 + k)}>
          <line className={styles.marker} x1={X(m.at)} x2={X(m.at)} y1={pt - 6} y2={H - pb} />
          <text className={k ? styles.axis : styles.valueHot} x={X(m.at) + (k ? 4 : -4)} y={pt - 12} textAnchor={k ? 'start' : 'end'}>{m.label}</text>
        </g>
      ))}
      {c.series.map((s, i) => {
        const tone = !hot && s.tone !== 'dash' ? 'muted' : s.tone;
        const p = pts(s);
        return (
          <g key={i} style={pct(i)}>
            <path
              pathLength={tone === 'dash' ? undefined : 1}
              className={`${tone === 'dash' ? styles.fade : styles.draw} ${styles[LINE_TONES[tone]]}`}
              d={`M${p.map((q) => q.join(' ')).join(' L')}`}
            />
            <circle className={`${styles.fade} ${tone === 'hot' ? styles.dotHot : styles.dotMuted}`} cx={p[n - 1][0]} cy={p[n - 1][1]} r={tone === 'hot' ? 4.5 : 3.5} />
            <text className={`${styles.fade} ${styles[END_TONES[tone]]}`} x={W - pr + 10} y={endY[i] + 4}>{s.label}</text>
          </g>
        );
      })}
      {c.x.map((t, i) => t && <text key={i} className={styles.label} x={X(i)} y={H - 6} textAnchor={i ? (i === n - 1 ? 'end' : 'middle') : 'start'}>{t}</text>)}
    </svg>
  );
}

function Funnel({ c, W }) {
  const n = c.stages.length, RH = 40, H = RH * n, lw = 74, x0 = lw, x1 = W - 54, cx = (x0 + x1) / 2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {c.stages.map(([label, shown, f], i) => {
        const w = (x1 - x0) * f, y = i * RH + 6, leak = i === c.leak;
        return (
          <g key={label} style={pct(i)}>
            <text className={leak ? styles.labelLight : styles.label} x="0" y={y + 17}>{label}</text>
            <rect className={`${styles.growXc} ${leak ? styles.barLead : styles.barMuted}`} x={cx - w / 2} y={y} width={w} height={RH - 14} rx="3" />
            <text className={`${styles.fade} ${styles.inBar}`} x={cx} y={y + 17} textAnchor="middle">{shown}</text>
            {i < n - 1 && (
              <text className={`${styles.fade} ${i === c.leak ? styles.valueLight : styles.label}`} x={W} y={y + RH - 2} textAnchor="end">↓ {c.rates[i]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Bubble({ c, W }) {
  const H = 214, pl = 18, pb = 22, pt = 8, pr = 8;
  const X = (v) => pl + v * (W - pl - pr), Y = (v) => pt + (1 - v) * (H - pt - pb);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <line className={styles.axisLine} x1={pl} x2={W - pr} y1={H - pb} y2={H - pb} />
      <line className={styles.axisLine} x1={pl} x2={pl} y1={pt} y2={H - pb} />
      <text className={styles.axis} x={W - pr} y={H - 6} textAnchor="end">{c.x} →</text>
      <text className={styles.axis} x="0" y={pt} transform={`rotate(-90 0 ${pt})`} textAnchor="end" dy="10">{c.y} →</text>
      {c.points.map(([name, x, y, size, red], i) => {
        const r = 10 + size * 26;
        return (
          <g key={name} style={pct(i)}>
            <circle className={`${styles.pop} ${red ? styles.bubbleHot : styles.bubble}`} cx={X(x)} cy={Y(y)} r={r} />
            <text className={`${styles.fade} ${red ? styles.valueHot : styles.labelLight}`} x={X(x)} y={Y(y) + r + 13} textAnchor="middle">{name}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Share({ c, W }) {
  // Row labels on the left; segment names above the first bar, percentages
  // inside.
  const BH = 40, RH = 56, lw = 64, top = 22, H = top + RH * c.rows.length, bw = W - lw;
  const tones = [styles.barLight, null, styles.barMuted];
  const at = (segs, k) => lw + (bw * segs.slice(0, k).reduce((t, x) => t + x[1], 0)) / 100;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {c.rows[0][1].map(([name], k) => (
        <text key={name} className={name === c.hot ? styles.valueHot : styles.labelLight} x={at(c.rows[0][1], k) + 2} y="12">{name}</text>
      ))}
      {c.rows.map(([label, segs], r) => {
        const y = top + r * RH;
        return (
          <g key={label}>
            <text className={styles.axis} x="0" y={y + BH / 2 + 4}>{label}</text>
            {segs.map(([name, p], i) => {
              const x = at(segs, i), w = (bw * p) / 100, hotSeg = name === c.hot;
              return (
                <g key={name} style={pct(r * 3 + i)}>
                  <rect className={`${styles.growX} ${hotSeg ? styles.barHot : tones[i] || styles.barMuted}`} x={x} y={y} width={Math.max(0, w - 2)} height={BH} rx="3" />
                  <text className={`${styles.fade} ${hotSeg ? styles.inHot : i ? styles.inMuted : styles.inDark}`} x={x + 7} y={y + BH / 2 + 4}>{p}%</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

const CHARTS = { vbars: VBars, hbars: HBars, diverge: Diverge, slope: Slope, lines: Lines, funnel: Funnel, bubble: Bubble, share: Share };

function Chart({ chart, hot }) {
  const ref = useRef(null);
  const W = useWidth(ref);
  const Draw = CHARTS[chart.type];
  return (
    <div ref={ref} className={styles.chart} aria-hidden="true">
      <Draw c={chart} W={W} hot={hot} />
    </div>
  );
}

function Panel({ kind, panel, shown, play }) {
  const hot = kind === 'context';
  return (
    <section className={`${styles.panel} ${hot ? styles.ctx : styles.alone} ${shown ? styles.shown : ''}`} aria-label={hot ? 'In context' : 'On its own'}>
      <div className={styles.ph}>
        <span className={styles.tag}>{hot ? 'In context' : 'On its own'}</span>
        <span className={styles.chips}>
          {panel.sources.map(([icon, name]) => (
            <span key={name} className={styles.chip}>
              <Icon name={icon} className={styles.chipIcon} />
              {name}
            </span>
          ))}
        </span>
      </div>
      <p className={styles.cap}>{panel.caption}</p>
      <Chart key={play} chart={panel.chart} hot={hot} />
      <p className={styles.read}>
        <b>{hot ? 'Actually' : 'Looks like'}</b>
        <Marked text={panel.read} />
      </p>
    </section>
  );
}

// ------------------------------------------------------------------ section

const STACKED = '(max-width: 1179px)';

export default function ContextIntelligence({ intel }) {
  const [active, setActive] = useState(intel.active);
  const [view, setView] = useState('alone');
  const tabsRef = useRef(null);
  const s = intel.screens[active];

  // Start the row of tabs scrolled to the one that is on.
  useEffect(() => {
    const row = tabsRef.current;
    if (row.scrollWidth > row.clientWidth) row.scrollLeft = row.children[intel.active].offsetLeft - row.offsetLeft - 16;
  }, [intel.active]);

  // A new discipline always opens on plain data.
  const pick = (i, e) => {
    setActive(i);
    setView('alone');
    const row = tabsRef.current;
    if (row.scrollWidth > row.clientWidth) {
      const tab = e.currentTarget;
      row.scrollTo({ left: tab.offsetLeft - row.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
    }
    if (!window.matchMedia(STACKED).matches) return;
    // Bring the tabs, and the screen under them, up to the top of the view.
    const header = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
    const gap = row.closest('nav').getBoundingClientRect().top - header - 12;
    if (Math.abs(gap) > 24) {
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({ top: gap, behavior: still ? 'auto' : 'smooth' });
    }
  };

  const play = `${active}-${view}`;

  return (
    <section className={styles.section} aria-labelledby="ci-title">
      <div className={styles.wrap}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Data, systems &amp; AI</p>
          <h2 id="ci-title" className={styles.title}>
            Most businesses don’t have a data problem. <span>They have a context problem.</span>
          </h2>
          <p className={styles.lede}>{intel.lede}</p>
        </header>

        <div className={styles.screen}>
          <nav className={styles.nav} aria-label="Growth disciplines">
            <div className={styles.navHead}>
              <p>Disciplines</p>
              <span aria-hidden="true">Swipe →</span>
            </div>
            <div ref={tabsRef} className={styles.tabs} role="tablist">
              {intel.screens.map((d, i) => (
                <button
                  key={d.name}
                  type="button"
                  role="tab"
                  id={`ci-tab-${i}`}
                  aria-selected={i === active}
                  aria-controls="ci-view"
                  className={`${styles.tab} ${i === active ? styles.on : ''}`}
                  onClick={(e) => pick(i, e)}
                >
                  <span className={styles.num} aria-hidden="true">0{i + 1}</span>
                  <span className={styles.tabIcon}>
                    <DisciplineIcon name={d.icon} />
                  </span>
                  <span className={styles.tabName}>{d.name}</span>
                  <span className={styles.tabShort} aria-hidden="true">{d.short}</span>
                </button>
              ))}
            </div>
          </nav>

          <div id="ci-view" className={styles.view} role="tabpanel" aria-labelledby={`ci-tab-${active}`}>
            <div className={styles.main}>
              <div className={styles.vh}>
                <div key={active} className={styles.enter}>
                  <p className={styles.kick}>0{active + 1} · {s.name}</p>
                  <h3 className={styles.question}>{s.question}</h3>
                </div>
                <span className={styles.periods} aria-hidden="true">
                  <span>30D</span><span>90D</span><span className={styles.on}>12M</span>
                </span>
              </div>

              <div className={styles.switch} role="group" aria-label="Show the answer">
                <button type="button" aria-pressed={view === 'alone'} className={view === 'alone' ? styles.on : ''} onClick={() => setView('alone')}>
                  Plain data
                </button>
                <button type="button" aria-pressed={view === 'context'} className={view === 'context' ? `${styles.on} ${styles.hotOn}` : ''} onClick={() => setView('context')}>
                  Enhanced data
                </button>
              </div>

              <div className={styles.pair}>
                <Panel kind="alone" panel={s.alone} shown={view === 'alone'} play={`${play}-a`} />
                <div className={styles.plus} aria-hidden="true">
                  <i />
                  <span>+</span>
                  <small>Add context</small>
                  <i />
                </div>
                <Panel kind="context" panel={s.context} shown={view === 'context'} play={`${play}-c`} />
              </div>
            </div>

            <div key={active} className={`${styles.strip} ${styles.enter}`}>
              {s.figures.map(([v, l]) => (
                <div key={l} className={styles.fig}>
                  <b>{v}</b>
                  <span>{l}</span>
                </div>
              ))}
              <div className={styles.act}>
                <Icon name="send" className={styles.actIcon} />
                <div>
                  <small>Do next</small>
                  <p>{s.action}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className={styles.foot}>
          <h3>
            Built for your business. Used by your team. <em>Yours to keep.</em>
          </h3>
          <p>From profitability models and decision dashboards to workflow tools, forecasting systems and bespoke software.</p>
        </footer>
      </div>
    </section>
  );
}
