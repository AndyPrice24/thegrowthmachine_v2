'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const inputs = [
  'STALLED GROWTH',
  'UNCLEAR GTM',
  'WEAK ACQUISITION',
  'LOW CONVERSION',
  'MARGIN LEAKAGE',
  'FOUNDER DEPENDENCY'
];

const outputs = [
  'MORE REVENUE',
  'BETTER MARGINS',
  'BETTER SYSTEMS',
  'STRONGER TEAM',
  'SCALABLE GROWTH'
];

const functions = [
  { label: 'STRATEGY & GTM', x: 135, y: 135 },
  { label: 'BRAND & DEMAND', x: 285, y: 135 },
  { label: 'OPERATIONS', x: 135, y: 285 },
  { label: 'REVENUE', x: 285, y: 285 }
];

function gearPoints(cx, cy, outerR, innerR, teeth) {
  const pts = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / teeth;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
  }
  return pts.join(' ');
}

function MachineCore() {
  const mainGear = useMemo(() => gearPoints(210, 210, 94, 78, 28), []);
  const smallGear = useMemo(() => gearPoints(0, 0, 58, 48, 18), []);

  return (
    <div className="gm-machine-core">
      <svg viewBox="0 0 420 420" className="gm-machine-svg" role="img" aria-label="The Growth Machine with four connected growth functions">
        <defs>
          <radialGradient id="gmMetal" cx="50%" cy="38%" r="68%">
            <stop offset="0%" stopColor="#fffdf8" />
            <stop offset="58%" stopColor="#e6ded2" />
            <stop offset="82%" stopColor="#b7aa9b" />
            <stop offset="100%" stopColor="#756d64" />
          </radialGradient>
          <radialGradient id="gmInner" cx="48%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#fffdfa" />
            <stop offset="70%" stopColor="#eee6db" />
            <stop offset="100%" stopColor="#c5b8a8" />
          </radialGradient>
          <filter id="gmSoftShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="9" stdDeviation="8" floodOpacity=".14" />
          </filter>
          <filter id="gmRedGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <circle cx="210" cy="210" r="188" fill="none" stroke="#b9ada0" strokeWidth="5" />
        <circle cx="210" cy="210" r="174" fill="none" stroke="#ded6cc" strokeWidth="2" />
        <circle cx="210" cy="210" r="158" fill="none" stroke="#827970" strokeWidth="2" opacity=".45" />

        <g className="gm-shafts">
          <rect x="203" y="26" width="14" height="368" rx="7" fill="url(#gmMetal)" stroke="#70675e" strokeWidth="2" />
          <rect x="26" y="203" width="368" height="14" rx="7" fill="url(#gmMetal)" stroke="#70675e" strokeWidth="2" />
          <circle cx="210" cy="45" r="17" fill="url(#gmMetal)" stroke="#70675e" strokeWidth="2" />
          <circle cx="375" cy="210" r="17" fill="url(#gmMetal)" stroke="#70675e" strokeWidth="2" />
          <circle cx="210" cy="375" r="17" fill="url(#gmMetal)" stroke="#70675e" strokeWidth="2" />
          <circle cx="45" cy="210" r="17" fill="url(#gmMetal)" stroke="#70675e" strokeWidth="2" />
        </g>

        <g className="gm-small-gears" filter="url(#gmSoftShadow)">
          {functions.map((fn, i) => (
            <g className={`gm-small-gear gm-small-gear-${i}`} transform={`translate(${fn.x} ${fn.y})`} key={fn.label}>
              <polygon points={smallGear} fill="url(#gmMetal)" stroke="#554e47" strokeWidth="2.5" />
              <circle r="45" fill="url(#gmInner)" stroke="#b9ada0" strokeWidth="2" />
              <circle r="38" fill="none" stroke="#f8f3eb" strokeWidth="1.2" opacity=".9" />
              <foreignObject x="-39" y="-22" width="78" height="44">
                <div xmlns="http://www.w3.org/1999/xhtml" className="gm-gear-label">{fn.label}</div>
              </foreignObject>
            </g>
          ))}
        </g>

        <g className="gm-main-gear" filter="url(#gmSoftShadow)">
          <polygon points={mainGear} fill="#d82b20" stroke="#8f160f" strokeWidth="2.5" />
          <circle cx="210" cy="210" r="72" fill="#f7f1e8" stroke="#b7a99b" strokeWidth="2" />
          <circle cx="210" cy="210" r="65" fill="#fffdf8" stroke="#e2d8cc" strokeWidth="1.5" />
        </g>

        <g className="gm-hub-glows" filter="url(#gmRedGlow)">
          <circle cx="210" cy="71" r="5" fill="#e42d22" />
          <circle cx="349" cy="210" r="5" fill="#e42d22" />
          <circle cx="210" cy="349" r="5" fill="#e42d22" />
          <circle cx="71" cy="210" r="5" fill="#e42d22" />
        </g>
      </svg>

      <img src="/tgm-logo.png" alt="" aria-hidden="true" className="gm-core-logo" />

      <div className="gm-process-label gm-process-diagnose">DIAGNOSE</div>
      <div className="gm-process-label gm-process-design">DESIGN</div>
      <div className="gm-process-label gm-process-execute">EXECUTE</div>
      <div className="gm-process-label gm-process-embed">EMBED</div>
    </div>
  );
}

export default function SystemBlueprint() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.38 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`gm-hero-machine ${active ? 'is-active' : ''}`}>
      <div className="gm-desktop" aria-label="Business challenges enter The Growth Machine and become stronger commercial outcomes">
        <div className="gm-card-stack gm-input-stack">
          {inputs.map((label, i) => (
            <div className="gm-card gm-input-card" style={{ '--i': i }} key={label}>{label}</div>
          ))}
        </div>

        <div className="gm-machine-stage">
          <svg className="gm-pipes gm-pipes-desktop" viewBox="0 0 1100 560" preserveAspectRatio="none" aria-hidden="true">
            {inputs.map((_, i) => {
              const y = 91 + i * 74;
              return <path key={`in-${i}`} className="gm-pipe gm-pipe-in" style={{ '--i': i }} d={`M180 ${y} C 300 ${y}, 322 ${280 + (i - 2.5) * 18}, 455 280`} />;
            })}
            {outputs.map((_, i) => {
              const y = 107 + i * 88;
              return <path key={`out-${i}`} className="gm-pipe gm-pipe-out" style={{ '--i': i }} d={`M645 280 C 778 ${280 + (i - 2) * 20}, 802 ${y}, 920 ${y}`} />;
            })}
          </svg>
          <MachineCore />
        </div>

        <div className="gm-card-stack gm-output-stack">
          {outputs.map((label, i) => (
            <div className="gm-card gm-output-card" style={{ '--i': i }} key={label}>{label}</div>
          ))}
        </div>
      </div>

      <div className="gm-mobile" aria-label="Business challenges flow through The Growth Machine to stronger commercial outcomes">
        <div className="gm-mobile-inputs">
          {inputs.map((label, i) => (
            <div className="gm-card gm-input-card" style={{ '--i': i }} key={label}>{label}</div>
          ))}
        </div>

        <div className="gm-mobile-stage">
          <svg className="gm-pipes gm-pipes-mobile-in" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true">
            {inputs.map((_, i) => {
              const x = 50 + i * 100;
              return <path key={`mi-${i}`} className="gm-pipe gm-pipe-in" style={{ '--i': i }} d={`M${x} 0 C ${x} 95, ${270 + (i - 2.5) * 17} 112, 300 220`} />;
            })}
          </svg>
          <MachineCore />
          <svg className="gm-pipes gm-pipes-mobile-out" viewBox="0 0 600 215" preserveAspectRatio="none" aria-hidden="true">
            {outputs.map((_, i) => {
              const x = 70 + i * 115;
              return <path key={`mo-${i}`} className="gm-pipe gm-pipe-out" style={{ '--i': i }} d={`M300 0 C 300 98, ${x} 105, ${x} 215`} />;
            })}
          </svg>
        </div>

        <div className="gm-mobile-outputs">
          {outputs.map((label, i) => (
            <div className="gm-card gm-output-card" style={{ '--i': i }} key={label}>{label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
