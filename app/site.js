/**
 * Launched in October 2026: every page may be indexed, and robots.txt points
 * search engines at the sitemap. Set back to false to hide the whole site from
 * search engines again (every page then says noindex, and robots.txt
 * disallows everything).
 */
export const LAUNCHED = true;

/** The company behind the site, as registered with CIPC (South Africa). */
export const COMPANY = {
  name: 'The Growth Machine (Pty) Ltd',
  registration: '2023/635888/07',
  country: 'South Africa',
};

/** The public contact address: enquiries, privacy questions, and the
 * fallback the contact form offers if sending fails. */
export const CONTACT_EMAIL = 'hello@thegrowthmachine.co';
