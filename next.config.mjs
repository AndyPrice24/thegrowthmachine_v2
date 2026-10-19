/*
 * Builds for two hosts from the same code:
 *
 *   Cloudflare Pages (CF_PAGES=1, set by Cloudflare during its builds):
 *   a fully static export to out/. The contact form is served by the Pages
 *   Function in functions/api/contact.js and redirects come from
 *   public/_redirects.
 *
 *   Vercel and local `npm run dev`: a normal Next.js build, with the contact
 *   route in app/api/contact/route.vercel.js and the redirects below.
 */
const cloudflare = process.env.CF_PAGES === '1';

const redirects = [
  { source: '/b2b-saas-growth', destination: '/b2b', permanent: true },
  { source: '/ecommerce-growth', destination: '/ecommerce', permanent: true },
];

/** @type {import('next').NextConfig} */
const nextConfig = cloudflare
  ? {
      output: 'export',
      // route.vercel.js is not a route here: only plain .js/.jsx files are.
      pageExtensions: ['jsx', 'js'],
    }
  : {
      pageExtensions: ['jsx', 'js', 'vercel.js'],
      async redirects() {
        return redirects;
      },
    };

export default nextConfig;
