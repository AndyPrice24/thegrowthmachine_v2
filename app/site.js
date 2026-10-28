/**
 * Flip to true on launch day, and only once the launch checklist is done.
 * Until then every page tells search engines not to index it and robots.txt
 * disallows everything, so a preview deployment cannot end up in Google with
 * placeholders on it. (Pattern carried over from the original Astro build.)
 */
export const LAUNCHED = false;

/** The company behind the site, as registered with CIPC (South Africa). */
export const COMPANY = {
  name: 'The Growth Machine (Pty) Ltd',
  registration: '2023/635888/07',
  country: 'South Africa',
};

/** The public contact address: enquiries, privacy questions, and the
 * fallback the contact form offers if sending fails. */
export const CONTACT_EMAIL = 'hello@thegrowthmachine.co';
