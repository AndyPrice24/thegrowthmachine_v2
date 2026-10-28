# The Growth Machine — Website v1

A production-oriented Next.js build for **thegrowthmachine.co**.

## What is included
- Responsive lead-generation homepage
- Ecommerce / Consumer growth page
- B2B / SaaS / B2B2C growth page
- How It Works page
- About page
- Insights index + 3 starter article routes
- Contact / lead form
- SEO metadata, sitemap and robots
- Minimal responsive “systems blueprint” visual rather than the heavy industrial machine
- Subtle red cog motion with reduced-motion support

## Run locally
```bash
npm install
npm run dev
```
Then open http://localhost:3000.

## Contact form
The form is wired to the Resend REST API without an extra package. Before launch, set:
```
RESEND_API_KEY=...
CONTACT_TO_EMAIL=you@example.com
CONTACT_FROM_EMAIL=website@thegrowthmachine.co
```
Set them wherever the site is hosted (Cloudflare Pages: Settings → Variables and Secrets; Vercel: Project → Environment Variables). The sending domain must be verified in Resend. The sending logic lives in `lib/contact.js`, used by both `functions/api/contact.js` (Cloudflare) and `app/api/contact/route.vercel.js` (Vercel). If you prefer HubSpot, Mailchimp, Brevo, Formspark or another CRM/form provider, change `lib/contact.js`.

## Content still intentionally placeholder
- Reference brands / client logos
- Founder portraits
- Real case studies and measured outcomes
- Calendar link / booking provider

No fictional client results have been inserted.

## Cloudflare Pages deployment
The site builds as plain static files for Cloudflare Pages (free plan, commercial use allowed). Cloudflare sets `CF_PAGES=1` during its builds, which switches `next.config.mjs` to a static export; Vercel and `npm run dev` are unaffected.

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git, and pick this repository.
2. Build settings: framework preset **None**, build command `npm run build`, build output directory `out`. Node comes from `.nvmrc`.
3. Add the three contact form variables above (as secrets).
4. Pages builds a preview for every branch and deploys the production branch to `<project>.pages.dev`.
5. Custom domains: see `LAUNCH.md` for the full go-live steps (moving DNS to Cloudflare, connecting `thegrowthmachine.co`, and setting up the contact form email).

What runs where on Cloudflare: pages are static HTML in `out/`; the contact form is the Pages Function `functions/api/contact.js`; the old audience URLs redirect via `public/_redirects` (keep it in step with `redirects()` in `next.config.mjs`). To build the same output locally: `npm run build:cloudflare`.

## GoDaddy + Vercel deployment
Recommended path:
1. Push this folder to a GitHub repository.
2. Import the repo into Vercel.
3. Add `thegrowthmachine.co` and `www.thegrowthmachine.co` in Vercel > Project > Domains.
4. Vercel will show the DNS records required.
5. In GoDaddy DNS, replace/update only the records Vercel specifies. Keep any existing email/MX records intact.
6. Set one version (www or apex) as the primary domain and redirect the other.

Do not change GoDaddy nameservers unless you intentionally want to move DNS hosting.

## Editorial workflow
The starter insights are code-backed in `app/insights/posts.js`. For a real publishing workflow, add a CMS such as Sanity, Contentful, Storyblok or WordPress headless after the first version is approved. The current structure is deliberately CMS-ready.

## Logo and icons
The logo (the wordmark with the lop-sided cog in the O) lives as vector paths in `components/growth-machine/logo-paths.js`. `python3 tools/brand/build_logo.py` builds everything else from it: the header and footer logos and PNG copies for collateral in `public/brand/`, and the browser and home-screen icons in `app/` (`icon.svg`, `favicon.ico`, `apple-icon.png`). Rerun it after changing the logo, and commit the output.

## Brand variables
Edit the CSS variables at the top of `app/globals.css` to change the global visual system.
