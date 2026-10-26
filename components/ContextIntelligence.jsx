'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ContextIntelligence.module.css';

/*
 * "Data, systems & AI", after How we work on each journey: the headline, then
 * a working miniature of the kind of tool we build. Business signals on the
 * left feed four commercial questions in the middle, which add up to what
 * becomes clear on the right.
 *
 * It works as a small demo: picking a signal lights the questions it feeds
 * (and, on desktop, its wire); the scenario card's tabs and slider recalculate
 * its results. Desktop draws the wires between the columns from measured
 * positions; tablets and phones stack the columns and drop the wires.
 *
 * Copy and figures live in journeys.js as `intel`.
 */

const ICONS = {
  crm: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3.3 2.7-5 5.5-5s4.9 1.7 5.5 5" /><path d="M16 5.5a3 3 0 0 1 0 5.6M18 14.3c1.5.6 2.4 2.1 2.7 4.7" /></>,
  funnel: <path d="M3.5 5h17l-6.5 7.5V19l-4-2v-4.5z" />,
  mega: <><path d="M4 10v4h3l7 4V6l-7 4z" /><path d="M17.5 9.5a4 4 0 0 1 0 5" /></>,
  bars: <path d="M5 19v-5M10 19v-9M15 19v-6M20 19V6M3 19h18" />,
  db: <><ellipse cx="12" cy="6" rx="7" ry="2.6" /><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" /></>,
  people: <><circle cx="8.5" cy="8.5" r="2.8" /><circle cx="16" cy="9.5" r="2.3" /><path d="M3.5 18.5c.6-3.2 2.6-4.8 5-4.8s4.4 1.6 5 4.8M13.8 14.2c.7-.4 1.4-.6 2.2-.6 2 0 3.6 1.4 4.2 4.4" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></>,
  box: <><path d="M12 3 4 7v10l8 4 8-4V7z" /><path d="m4 7 8 4 8-4M12 11v10" /></>,
  cart: <><path d="M3 4h2.2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  store: <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16v10H4zM9 19.5v-5h6v5" />,
  trend: <><path d="m4 16 5-5 4 3 7-7" /><path d="M15 7h5v5" /></>,
  leak: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
  chart: <><path d="M4 4v16h16" /><path d="m7 14 4-4 3 3 5-6" /></>,
  list: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  send: <><path d="M21 3 10 14" /><path d="m21 3-7 18-4-7-7-4z" /></>,
};

function Icon({ name }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  );
}

// "+4.1pts", "−3%", "£640K", "£2.8M": signed, at most one decimal.
const signed = (n, unit) => {
  const r = Math.round(n * 10) / 10;
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r)}${unit}`;
};
const money = (k) => (k >= 1000 ? `£${(Math.round(k / 100) / 10).toFixed(1)}M` : `£${Math.round(k)}K`);
const fill = (text, v) => text.replace('{v}', v);

function Headline({ q }) {
  return (
    <div className={styles.big}>
      <b>{q.value}</b>
      <span>
        {q.label}
        <em>{q.delta}</em>
      </span>
    </div>
  );
}

function Waterfall({ bars }) {
  const W = 330, H = 170, gap = W / bars.length, bw = gap * 0.62;
  let level = 0;
  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H + 22}`} aria-hidden="true">
      {bars.map(([label, v, kind], i) => {
        let top, bottom;
        if (kind === 'base') [top, bottom, level] = [0, 100, 100];
        else if (kind === 'net') [top, bottom] = [100 - v, 100];
        else [top, bottom, level] = [100 - level, 100 - level - v, level + v];
        const x = i * gap + (gap - bw) / 2;
        return (
          <g key={label}>
            <rect className={styles[kind]} x={x} y={(Math.min(top, bottom) / 100) * H} width={bw} height={Math.max((Math.abs(bottom - top) / 100) * H, 2)} />
            <text className={styles.axis} x={x + bw / 2} y={H + 16}>{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Trend({ points, tag }) {
  const W = 330, H = 92, lo = Math.min(...points) * 0.9, hi = Math.max(...points) * 1.05;
  const xy = points.map((p, i) => [(i * (W - 20)) / (points.length - 1) + 6, H - ((p - lo) / (hi - lo)) * H]);
  const [lx, ly] = xy[xy.length - 1];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H + 22}`} aria-hidden="true">
      {[0.25, 0.5, 0.75, 1].map((g) => <line key={g} className={styles.grid} x1="0" x2={W} y1={H * g} y2={H * g} />)}
      <path className={styles.line} d={`M${xy.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}`} />
      {xy.slice(0, -1).map(([x, y], i) => <circle key={i} className={styles.dot} cx={x} cy={y} r="2.4" />)}
      <circle className={styles.last} cx={lx} cy={ly} r="5" />
      <g transform={`translate(${lx - 44} ${ly - 30})`}>
        <rect className={styles.tagBox} width="40" height="20" rx="4" />
        <text className={styles.tag} x="20" y="14">{tag}</text>
      </g>
      {xy.map(([x], i) => <text key={i} className={styles.axis} x={x} y={H + 16}>{months[i]}</text>)}
    </svg>
  );
}

function Card({ n, title, lit, children }) {
  return (
    <article className={`${styles.q} ${lit ? styles.lit : ''}`} aria-labelledby={`ci-q${n}`}>
      <div className={styles.qh}>
        <span className={styles.qn} aria-hidden="true">0{n}</span>
        <h3 id={`ci-q${n}`}>{title}</h3>
        <span className={styles.qa} aria-hidden="true">→</span>
      </div>
      {children}
    </article>
  );
}

function Scenario({ levers, lit }) {
  const [tab, setTab] = useState(0);
  const [values, setValues] = useState(() => levers.map((l) => l.value));
  const l = levers[tab];
  const v = values[tab];
  const pct = ((v - l.min) / (l.max - l.min)) * 100;
  return (
    <Card n={3} title={fill(l.title, v)} lit={lit}>
      <div className={styles.tabs} role="tablist" aria-label="Lever">
        {levers.map((x, i) => (
          <button key={x.tab} type="button" role="tab" aria-selected={i === tab} className={i === tab ? styles.on : ''} onClick={() => setTab(i)}>
            {x.tab}
          </button>
        ))}
      </div>
      <label className={styles.slider}>
        <span>{fill(l.label, v)}</span>
        <input
          type="range"
          min={l.min}
          max={l.max}
          step={l.step}
          value={v}
          style={{ '--f': `${pct}%` }}
          onChange={(e) => setValues((vs) => vs.map((x, i) => (i === tab ? Number(e.target.value) : x)))}
        />
      </label>
      <div className={styles.kpis} aria-live="polite">
        <div>
          <b className={styles.hot}>{money(l.money * v)}</b>
          <span>{l.moneyLabel}</span>
        </div>
        {l.kpis.map(([per, unit, label]) => (
          <div key={label}>
            <b>{signed(per * v, unit)}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// A wire from (0, y0) to (w, y1), leaving and arriving level.
const wire = (w, y0, y1) => `M0 ${y0} C ${w * 0.6} ${y0}, ${w * 0.4} ${y1}, ${w} ${y1}`;

export default function ContextIntelligence({ intel }) {
  const [active, setActive] = useState(intel.active);
  const screenRef = useRef(null);
  const tabsRef = useRef(null);
  const feeds = intel.signals[active].feeds;

  // Desktop wires: every signal into the middle panel, the middle panel out
  // to every outcome, redrawn whenever the screen changes size. The wire of
  // the signal that is on is red; it draws itself in when a signal is picked.
  const activeRef = useRef(active);
  useEffect(() => {
    const screen = screenRef.current;
    const [wl, wr] = screen.querySelectorAll('[data-wires]');
    const draw = () => {
      const box = wl.getBoundingClientRect();
      if (!box.width) return;
      const mid = screen.querySelector('[data-mid]').getBoundingClientRect();
      const cy = mid.top + mid.height / 2;
      const ys = (sel, top) => [...screen.querySelectorAll(sel)].map((e) => {
        const r = e.getBoundingClientRect();
        return r.top + r.height / 2 - top;
      });
      const paths = (svg, ds) => {
        if (svg.children.length !== ds.length) {
          svg.innerHTML = ds.map(() => '<path pathLength="1"/>').join('');
        }
        ds.forEach((d, i) => svg.children[i].setAttribute('d', d));
      };
      wl.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      paths(wl, ys('[data-signal]', box.top).map((y) => wire(box.width, y, cy - box.top)));
      wl.children[activeRef.current]?.classList.add(styles.won);
      const rb = wr.getBoundingClientRect();
      wr.setAttribute('viewBox', `0 0 ${rb.width} ${rb.height}`);
      paths(wr, ys('[data-outcome]', rb.top).map((y) => wire(rb.width, cy - rb.top, y)));
    };
    draw();
    document.fonts?.ready.then(draw);
    const ro = new ResizeObserver(draw);
    ro.observe(screen);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (activeRef.current === active) return;
    activeRef.current = active;
    const wl = screenRef.current.querySelector('[data-wires]');
    [...wl.children].forEach((p, i) => {
      p.classList.remove(styles.won, styles.drawIn);
      if (i !== active) return;
      p.getBoundingClientRect(); // restart the draw-in
      p.classList.add(styles.won, styles.drawIn);
    });
  }, [active]);

  // Phones: start the row of signal tabs scrolled to the one that is on.
  useEffect(() => {
    const row = tabsRef.current;
    const on = row.children[intel.active];
    if (row.scrollWidth > row.clientWidth) row.scrollLeft = on.offsetLeft - row.offsetLeft - 16;
  }, [intel.active]);

  const q = (n) => feeds.includes(n);
  const fed = [intel.leak.title, intel.rank.title, 'the scenario planner', intel.trend.title].filter((_, i) => q(i));

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

        <div ref={screenRef} className={styles.screen}>
          <div className={styles.signals}>
            <div className={styles.colHead}>
              <p>Your business signals</p>
              <span aria-hidden="true">Tap a signal →</span>
            </div>
            <div ref={tabsRef} className={styles.sigList} role="group" aria-label="Business signals">
              {intel.signals.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  data-signal
                  aria-pressed={i === active}
                  className={`${styles.signal} ${i === active ? styles.on : ''}`}
                  onClick={() => setActive(i)}
                >
                  <Icon name={s.icon} />
                  <span className={styles.sigText}>
                    <b>{s.name}</b>
                    <small>{s.detail}</small>
                  </span>
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className={styles.srOnly} aria-live="polite">
              {intel.signals[active].name} feeds: {fed.join('; ')}
            </p>
          </div>

          <svg data-wires className={`${styles.wires} ${styles.wireL}`} aria-hidden="true" />

          <div data-mid className={styles.mid}>
            <div className={styles.midHead}>
              <p>Commercial intelligence</p>
              <span className={styles.periods} aria-hidden="true">
                <span>7D</span><span>30D</span><span className={styles.on}>90D</span><span>12M</span>
              </span>
            </div>
            <div className={styles.cards}>
              <Card n={1} title={intel.leak.title} lit={q(0)}>
                <Headline q={intel.leak} />
                <Waterfall bars={intel.leak.bars} />
              </Card>
              <Card n={2} title={intel.rank.title} lit={q(1)}>
                <Headline q={intel.rank} />
                <table className={styles.table} data-cols={intel.rank.cols.length}>
                  <thead>
                    <tr>{intel.rank.cols.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {intel.rank.rows.map((r) => {
                      const n = intel.rank.cols.length;
                      return (
                        <tr key={r[0]}>
                          {r.slice(0, n - 1).map((c, i) => <td key={i}>{c}</td>)}
                          <td className={styles.barCell}>
                            <i style={{ '--w': `${r[n - 1] * 100}%` }} aria-hidden="true" />
                            <small>{r[n]}</small>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
              <Scenario levers={intel.levers} lit={q(2)} />
              <Card n={4} title={intel.trend.title} lit={q(3)}>
                <Headline q={intel.trend} />
                <Trend points={intel.trend.points} tag={intel.trend.value} />
              </Card>
            </div>
          </div>

          <svg data-wires className={`${styles.wires} ${styles.wireR}`} aria-hidden="true" />

          <div className={styles.outcomes}>
            <div className={styles.colHead}>
              <p>What becomes clear</p>
            </div>
            <ul>
              {intel.outcomes.map((o) => (
                <li key={o.name} data-outcome className={o.value ? '' : styles.action}>
                  <Icon name={o.icon} />
                  <span className={styles.outText}>
                    <b>{o.name}</b>
                    <em>{o.value || 'On'}</em>
                    <small>{o.label}</small>
                  </span>
                  {!o.value && <s aria-hidden="true" />}
                </li>
              ))}
            </ul>
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
