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
The sending domain must be verified in Resend. If you prefer HubSpot, Mailchimp, Brevo, Formspark or another CRM/form provider, replace `app/api/contact/route.js`.

## Content still intentionally placeholder
- Reference brands / client logos
- Founder portraits
- Real case studies and measured outcomes
- Calendar link / booking provider

No fictional client results have been inserted.

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

## Brand variables
Edit the CSS variables at the top of `app/globals.css` to change the global visual system.
