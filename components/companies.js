/*
 * "Companies we've worked with" (Companies.jsx): one entry per company, in
 * the order they come round the strip. Each company has agreed to be named,
 * to its logo being shown, and to the words attributed to it.
 *
 *   name            the company's name (for screen readers, and in place of a
 *                   logo until there is one)
 *   logo            optional: a wordmark under /public/companies (trimmed,
 *                   transparent, 160px tall)
 *   sector, country tags on the open card
 *   href            optional: the company's live site ("Visit site")
 *   did             what we did, as two or three short tags
 *   quote           optional: { text, name?, role? } in the client's words;
 *                   attributed to the company alone when there's no name
 *   statement       optional, for our own brand in place of a quote
 *   own             true for a brand we run ourselves: labelled as ours
 *
 * Quotes are placeholders agreed with each client; confirm the final
 * wording with them before launch.
 */

export const COMPANIES = [
  {
    name: 'WeAreMonsters',
    logo: '/companies/wearemonsters.webp',
    sector: 'Professional services',
    country: 'South Africa',
    href: 'https://wearemonsters.co.za',
    did: ['Revenue model', 'Marketing & acquisition', 'Digital sales funnels'],
    quote: {
      text: 'The Growth Machine team have been instrumental in the design of my company’s revenue model, as well as restructuring our marketing, acquisition, and digital sales funnels and strategies. They set up processes, did the work, and put in 110% effort. Their influence has been huge, and I can’t recommend them enough.',
      name: 'Pieter van Reenen',
      role: 'CEO',
    },
  },
  {
    name: 'Hoddogs',
    sector: 'Pet · DTC',
    country: 'US & Australia',
    did: ['Brand', 'Marketing', 'Website & conversion', 'Retail & Amazon'],
    statement:
      'Everything from brand refinement to marketing, website and conversion optimisation, retailer sales, Amazon, and back again.',
    own: true,
  },
  {
    name: 'National Debt Advisors',
    logo: '/companies/nda.webp',
    sector: 'Financial services',
    country: 'South Africa',
    href: 'https://nationaldebtadvisors.co.za',
    did: ['Revenue growth'],
    quote: {
      text: 'I love these guys. A complete one-stop shop for getting your revenue where it needs to be. No buzzwords and vanity metrics. They figure out what is going to move the needle, and then they make it happen.',
      name: 'Sebastien Alexanderson',
      role: 'Owner',
    },
  },
  {
    name: 'Hollywood Browzer',
    logo: '/companies/hollywood-browzer.webp',
    sector: 'Beauty',
    country: 'UK',
    did: ['Creative & website', 'Commercial model', 'Amazon & search'],
  },
  {
    name: 'Score Up',
    logo: '/companies/scoreup.webp',
    sector: 'Fintech',
    country: 'South Africa',
    href: 'https://scoreup.co.za',
    did: ['Go-to-market', 'Brand', 'RevOps'],
    quote: {
      text: 'We thought we just needed a launch plan and to push marketing, but The Growth Machine came in and aligned everything, from brand to RevOps, and caught the leaks first. Immediately the company looked better. If you’re looking for help with taking your company to market, I highly recommend these guys.',
    },
  },
  {
    name: 'UsedCarParts',
    logo: '/companies/usedcarparts.webp',
    sector: 'Ecommerce',
    country: 'South Africa',
    href: 'https://usedcarparts.co.za',
    did: ['Revenue leaks', 'Optimisation', 'Scaling'],
    quote: {
      text: 'The trouble with being a one-man band and founder: you are spread so thin, and never really have the capacity to look deep enough into any area of the business. Working with this team helped me find the leaky buckets, and optimise to help scale my business. It felt like I had a team of founders, rather than just an agency.',
      name: 'Pieter van Reenen',
      role: 'Owner',
    },
  },
];
