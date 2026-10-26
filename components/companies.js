/*
 * "Companies we've worked with" (Companies.jsx): one entry per company, in
 * the order they come round the strip.
 *
 * PLACEHOLDERS: every company below is invented, to show the layout. Replace
 * them all with real companies (and their permission) before launch.
 *
 *   name, initials  shown in the strip; initials stand in until there's a logo
 *   logo            optional: a path under /public (square, transparent works best)
 *   sector, country tags on the featured card
 *   href            optional: the company's live site ("Visit site")
 *   highlights      one or two: { figure, label } for a number and what it
 *                   counts, or { text } for a statement
 */

export const COMPANIES = [
  {
    name: 'Northvale',
    initials: 'NV',
    sector: 'B2B',
    country: 'UK',
    highlights: [{ figure: '£1M', label: 'raised to launch' }, { text: 'Designed the business model and led the funding round.' }],
  },
  {
    name: 'Kinbridge',
    initials: 'KB',
    sector: 'SaaS',
    country: 'South Africa',
    highlights: [{ text: 'Built the go-to-market and the first sales team.' }, { text: 'Rebuilt pricing around how customers actually buy.' }],
  },
  {
    name: 'Alder & Co',
    initials: 'AL',
    sector: 'Ecommerce',
    country: 'UK',
    highlights: [{ figure: '2', label: 'new channels opened' }, { text: 'Took the range onto Amazon and into retail.' }],
  },
  {
    name: 'Meridian Studio',
    initials: 'MS',
    sector: 'Services',
    country: 'UK',
    highlights: [{ text: 'Repositioned the business and rebuilt the sales process from lead to close.' }],
  },
  {
    name: 'Harbourline',
    initials: 'HB',
    sector: 'Ecommerce',
    country: 'UK',
    highlights: [{ figure: '3', label: 'markets launched' }, { text: 'Built the brand, the commercial model and the go-to-market from day one.' }],
  },
  {
    name: 'Otterly',
    initials: 'OT',
    sector: 'Consumer',
    country: 'Australia',
    highlights: [{ figure: '6 wks', label: 'from brief to launch' }, { text: 'Launched the brand online and built the content engine behind it.' }],
  },
  {
    name: 'Brightwater',
    initials: 'BR',
    sector: 'Proptech',
    country: 'UK',
    highlights: [{ text: 'Designed the product, the brand and the launch plan.' }, { text: 'Set up the data and reporting the board runs on.' }],
  },
];
