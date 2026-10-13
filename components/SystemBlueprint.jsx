'use client';

import { useEffect, useRef, useState } from 'react';

const desktopIn = [
  'M230 203 C 290 203, 305 315, 405 315',
  'M230 270 C 302 270, 318 340, 405 340',
  'M230 337 C 315 337, 330 365, 405 365',
  'M230 403 C 315 403, 330 400, 405 400',
  'M230 470 C 302 470, 318 430, 405 430',
  'M230 537 C 290 537, 305 455, 405 455'
];

const desktopOut = [
  'M995 320 C 1082 320, 1094 225, 1165 225',
  'M995 345 C 1088 345, 1100 304, 1165 304',
  'M995 385 C 1085 385, 1100 383, 1165 383',
  'M995 425 C 1088 425, 1100 461, 1165 461',
  'M995 452 C 1082 452, 1094 540, 1165 540'
];

const mobileIn = [
  'M82 184 C 82 250, 286 250, 338 350',
  'M210 184 C 210 260, 320 275, 360 350',
  'M337 184 C 337 270, 355 300, 382 350',
  'M464 184 C 464 270, 445 300, 418 350',
  'M591 184 C 591 260, 480 275, 440 350',
  'M718 184 C 718 250, 515 250, 462 350'
];

const mobileOut = [
  'M360 1062 C 330 1140, 91 1140, 91 1193',
  'M380 1062 C 365 1140, 246 1140, 246 1193',
  'M400 1062 C 400 1140, 400 1140, 400 1193',
  'M420 1062 C 435 1140, 554 1140, 554 1193',
  'M440 1062 C 470 1140, 709 1140, 709 1193'
];

function DesktopOverlay(){
  const inputYs=[176,246,316,386,456,526];
  const outputYs=[197,276,355,434,513];
  return <svg className="gm-sequence gm-sequence-desktop" viewBox="0 0 1400 787" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <filter id="cardGlowDesk" x="-60%" y="-100%" width="220%" height="300%">
        <feGaussianBlur stdDeviation="12" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="pipeGlowDesk" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="coreGlowDesk">
        <stop offset="0%" stopColor="#ffb083" stopOpacity=".52"/>
        <stop offset="48%" stopColor="#ef3d2e" stopOpacity=".18"/>
        <stop offset="100%" stopColor="#ef3d2e" stopOpacity="0"/>
      </radialGradient>
    </defs>

    {inputYs.map((y,i)=><rect key={'ig'+i} className="gm-svg-card-glow gm-svg-input-glow" style={{'--i':i}} x="18" y={y} width="216" height="56" rx="27" filter="url(#cardGlowDesk)"/>)}
    {desktopIn.map((d,i)=><path key={'ip'+i} className="gm-svg-pulse gm-svg-pulse-in" style={{'--i':i}} d={d} pathLength="1" filter="url(#pipeGlowDesk)"/>)}

    <circle className="gm-svg-core-glow" cx="700" cy="390" r="176" fill="url(#coreGlowDesk)"/>
    <circle className="gm-svg-core-ring" cx="700" cy="390" r="139" pathLength="1"/>

    {desktopOut.map((d,i)=><path key={'op'+i} className="gm-svg-pulse gm-svg-pulse-out" style={{'--i':i}} d={d} pathLength="1" filter="url(#pipeGlowDesk)"/>)}
    {outputYs.map((y,i)=><rect key={'og'+i} className="gm-svg-card-glow gm-svg-output-glow" style={{'--i':i}} x="1164" y={y} width="220" height="56" rx="27" filter="url(#cardGlowDesk)"/>)}
  </svg>
}

function MobileOverlay(){
  const inputXs=[24,151,278,405,532,659];
  const outputXs=[27,182,337,492,647];
  return <svg className="gm-sequence gm-sequence-mobile" viewBox="0 0 800 1421" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <filter id="cardGlowMob" x="-60%" y="-100%" width="220%" height="300%">
        <feGaussianBlur stdDeviation="11" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="pipeGlowMob" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="4" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="coreGlowMob">
        <stop offset="0%" stopColor="#ffb083" stopOpacity=".5"/>
        <stop offset="48%" stopColor="#ef3d2e" stopOpacity=".17"/>
        <stop offset="100%" stopColor="#ef3d2e" stopOpacity="0"/>
      </radialGradient>
    </defs>

    {inputXs.map((x,i)=><rect key={'mig'+i} className="gm-svg-card-glow gm-svg-input-glow" style={{'--i':i}} x={x} y="88" width="116" height="100" rx="24" filter="url(#cardGlowMob)"/>)}
    {mobileIn.map((d,i)=><path key={'mip'+i} className="gm-svg-pulse gm-svg-pulse-in" style={{'--i':i}} d={d} pathLength="1" filter="url(#pipeGlowMob)"/>)}

    <circle className="gm-svg-core-glow" cx="400" cy="720" r="270" fill="url(#coreGlowMob)"/>
    <circle className="gm-svg-core-ring" cx="400" cy="720" r="185" pathLength="1"/>

    {mobileOut.map((d,i)=><path key={'mop'+i} className="gm-svg-pulse gm-svg-pulse-out" style={{'--i':i}} d={d} pathLength="1" filter="url(#pipeGlowMob)"/>)}
    {outputXs.map((x,i)=><rect key={'mog'+i} className="gm-svg-card-glow gm-svg-output-glow" style={{'--i':i}} x={x} y="1190" width="130" height="101" rx="24" filter="url(#cardGlowMob)"/>)}
  </svg>
}

export default function SystemBlueprint(){
  const ref=useRef(null);
  const [active,setActive]=useState(false);

  useEffect(()=>{
    const node=ref.current;
    if(!node) return;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){ setActive(true); return; }

    const observer=new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting){
        setActive(true);
        observer.disconnect();
      }
    },{threshold:.32});

    observer.observe(node);
    return()=>observer.disconnect();
  },[]);

  return <div ref={ref} className={`gm-approved-wrap ${active?'is-active':''}`}>
    <picture>
      <source media="(max-width: 820px)" srcSet="/growth-machine-mobile-approved.webp"/>
      <img
        className="gm-approved-art"
        src="/growth-machine-desktop-approved.webp"
        alt="The Growth Machine turning stalled growth, unclear GTM, weak acquisition, low conversion, margin leakage and founder dependency into more revenue, better margins, better systems, a stronger team and scalable growth."
      />
    </picture>
    <DesktopOverlay/>
    <MobileOverlay/>
  </div>
}
