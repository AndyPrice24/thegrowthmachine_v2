/**
 * Flip to true on launch day, and only once the launch checklist is done.
 * Until then every page tells search engines not to index it and robots.txt
 * disallows everything, so a preview deployment cannot end up in Google with
 * placeholders on it. (Pattern carried over from the original Astro build.)
 */
export const LAUNCHED = false;
