'use client';

import { useEffect, useRef, useState } from 'react';

export default function SystemBlueprint(){
  const ref=useRef(null);
  const [active,setActive]=useState(false);

  useEffect(()=>{
    const node=ref.current;
    if(!node) return;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){ setActive(true); return; }
    const observer=new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting){ setActive(true); observer.disconnect(); }
    },{threshold:.38});
    observer.observe(node);
    return()=>observer.disconnect();
  },[]);

  return (
    <div ref={ref} className={`gm-approved-wrap ${active?'is-active':''}`}>
      <picture>
        <source media="(max-width: 820px)" srcSet="/growth-machine-mobile-approved.webp" />
        <img
          className="gm-approved-art"
          src="/growth-machine-desktop-approved.webp"
          alt="The Growth Machine turning stalled growth, unclear GTM, weak acquisition, low conversion, margin leakage and founder dependency into more revenue, better margins, better systems, a stronger team and scalable growth."
        />
      </picture>

      <div className="gm-desktop-overlays" aria-hidden="true">
        <div className="gm-input-glow gmi1"/><div className="gm-input-glow gmi2"/><div className="gm-input-glow gmi3"/>
        <div className="gm-input-glow gmi4"/><div className="gm-input-glow gmi5"/><div className="gm-input-glow gmi6"/>
        <div className="gm-pipe-sheen gm-pipe-sheen-in"/>
        <div className="gm-core-pulse"/>
        <div className="gm-pipe-sheen gm-pipe-sheen-out"/>
        <div className="gm-output-glow gmo1"/><div className="gm-output-glow gmo2"/><div className="gm-output-glow gmo3"/>
        <div className="gm-output-glow gmo4"/><div className="gm-output-glow gmo5"/>
      </div>

      <div className="gm-mobile-overlays" aria-hidden="true">
        <div className="gm-mobile-input-light"/>
        <div className="gm-mobile-core-pulse"/>
        <div className="gm-mobile-output-light"/>
      </div>
    </div>
  );
}
