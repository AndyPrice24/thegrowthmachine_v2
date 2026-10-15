'use client';

import { useEffect } from 'react';

/*
 * When a reader picks a growth system on the homepage, the page stays where
 * it is (the shared opening never reloads) and then glides down to the start
 * of their journey. Arriving at /b2b or /ecommerce directly, from a link or a
 * bookmark, starts at the top as usual, so the shared story comes first.
 */
export const JOURNEY_FLAG = 'tgm-journey';

export function scrollToJourney() {
  const el = document.getElementById('journey');
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

export default function JourneyStart() {
  useEffect(() => {
    let chosen = null;
    try {
      chosen = sessionStorage.getItem(JOURNEY_FLAG);
      sessionStorage.removeItem(JOURNEY_FLAG);
    } catch {
      return;
    }
    if (chosen) requestAnimationFrame(scrollToJourney);
  }, []);
  return null;
}
