/*
 * Copy for the opening section of each journey, below the choice.
 *
 * b2b: Andrew's B2B section (October 2026 mockups), word for word.
 * ecommerce: a stand-in until the ecommerce section is designed, using the
 * copy from the previous ecommerce page; the statement is shared with B2B.
 *
 * image: a file in /public (square, at least 1400x1400; phones crop it to
 * 4:3). Leave null to show the placeholder.
 */
export const JOURNEYS = {
  b2b: {
    id: 'b2b',
    eyebrow: 'B2B, SaaS & sales-led growth',
    title: 'The next stage of growth may not start with more leads.',
    lede: 'The next growth opportunity may come from optimisation, expansion, or a completely different part of the commercial system.',
    statement: 'We diagnose, prioritise and execute — not just advise.',
    levers: [
      { icon: 'target', name: 'Position', text: 'Market, ICP & proposition' },
      { icon: 'bars', name: 'Create demand', text: 'Channels, messaging & lead generation' },
      { icon: 'funnel', name: 'Convert pipeline', text: 'Qualification, sales process & conversion' },
      { icon: 'trend', name: 'Grow revenue', text: 'Pricing, expansion & revenue economics' },
    ],
    image: null,
    imageAlt: '',
  },
  ecommerce: {
    id: 'ecommerce',
    eyebrow: 'Ecommerce & consumer growth',
    title: 'Scale the brand without losing the economics.',
    lede: 'We connect consumer insight, brand, performance, ecommerce operations and commercial margin so growth is not just bigger — it is healthier.',
    statement: 'We diagnose, prioritise and execute — not just advise.',
    levers: [
      { icon: 'target', name: 'Acquire', text: 'The right customers' },
      { icon: 'funnel', name: 'Convert', text: 'More of the demand' },
      { icon: 'loop', name: 'Retain', text: 'More lifetime value' },
      { icon: 'shield', name: 'Protect', text: 'Margin as you scale' },
    ],
    image: null,
    imageAlt: '',
  },
};
