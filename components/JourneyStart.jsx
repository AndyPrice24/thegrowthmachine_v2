'use client';

import { useEffect } from 'react';

/*
 * When a reader picks a growth system on the homepage, the page stays where
 * it is (the shared opening never reloads) and then glides down to the start
 * of their journey. Arriving at /b2b or /ecommerce directly, from a link or a
 * bookmark, starts at the top as usual, so the shared story comes first.
 *
 * The menu bar's journey links always land on the journey itself: from
 * another homepage address they glide like the cards; from any other page
 * they open the journey straight at its start.
 */
export const JOURNEY_FLAG = 'tgm-journey';

export const HOME_ROUTES = ['/', '/b2b', '/ecommerce'];

export function scrollToJourney(instant = false) {
  const el = document.getElementById('journey');
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: instant || reduce ? 'auto' : 'smooth', block: 'start' });
}

/* Click handler for any link into a journey (the cards, the menu bar). */
export function goToJourney(pathname, href) {
  return (event) => {
    if (pathname === href) {
      event.preventDefault();
      scrollToJourney();
      return;
    }
    // Arriving from outside the homepage there is nothing to glide past.
    const mode = HOME_ROUTES.includes(pathname) ? 'glide' : 'jump';
    try {
      sessionStorage.setItem(JOURNEY_FLAG, mode);
    } catch {}
  };
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
    if (chosen) requestAnimationFrame(() => scrollToJourney(chosen === 'jump'));
  }, []);
  return null;
}
