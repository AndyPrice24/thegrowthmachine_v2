/*
 * Copy for the opening section of each journey, below the choice.
 *
 * b2b: Andrew's B2B section (October 2026 mockups), word for word, minus its
 *   four-lever row: the How we work section below covers the disciplines.
 * ecommerce: Andrew's ecommerce section (October 2026 mockups), word for word.
 *
 * image: { desktop, mobile, focus }. Desktop shows a near-square crop beside
 * the copy (a 3:4 portrait works best); phones and tablets show a 4:3
 * landscape under the levers. focus is the desktop crop's object-position.
 * Leave null to show the placeholder.
 */
export const JOURNEYS = {
  b2b: {
    id: 'b2b',
    eyebrow: 'B2B, SaaS & sales-led growth',
    title: 'The next stage of growth may not start with more leads.',
    lede: 'The next growth opportunity may come from optimisation, expansion, or a completely different part of the commercial system.',
    statement: 'We diagnose, prioritise and execute — not just advise.',
    image: {
      desktop: '/journeys/b2b-portrait.webp',
      mobile: '/journeys/b2b-landscape.webp',
      focus: '50% 22%',
    },
    // "How we work": six disciplines around one hub, three a side (left
    // column first, top to bottom), each with what it covers. `node` sets
    // the line breaks inside the circle where the automatic ones read badly.
    work: {
      hub: ['Profitable', 'growth'],
      disciplines: [
        { name: 'Brand & Demand', items: ['Positioning & proposition', 'Differentiation', 'Messaging & sales materials'] },
        { name: 'Sales & Conversion', items: ['Lead generation & funnels', 'Sales process & conversion', 'Tools & enablement'] },
        { name: 'GTM & Market Expansion', items: ['ICP & market focus', 'Routes to market', 'Launch & partnerships'] },
        { name: 'Commercial Model', items: ['Pricing & packaging', 'Revenue model', 'Growth economics'] },
        { name: 'Data, Systems & AI', node: ['Data, Systems', '& AI'], items: ['Connected data', 'Forecasting & scenarios', 'Automation & bespoke tools'] },
        { name: 'Team & Operating Model', items: ['Structure & accountability', 'Leadership rhythm', 'Training & capability'] },
      ],
    },
    imageAlt: 'A growth leader mapping a B2B growth engine, from ICP and demand through pipeline to revenue and expansion, on a whiteboard in a sunlit meeting room.',
  },
  ecommerce: {
    id: 'ecommerce',
    eyebrow: 'Ecommerce & consumer growth',
    title: 'The next stage of growth may not start with more traffic.',
    lede: 'The next growth opportunity may come from sharper acquisition, stronger conversion, greater customer value, or healthier unit economics.',
    statement: 'We diagnose, prioritise and execute — not just advise.',
    levers: [
      { icon: 'bars', name: 'Acquire', text: 'Customers, channels & media economics' },
      { icon: 'cart', name: 'Convert', text: 'Offer, pricing & onsite experience' },
      { icon: 'people', name: 'Grow customer value', text: 'AOV, retention & LTV' },
      { icon: 'stack', name: 'Protect margin', text: 'Product mix, channel economics & profitability' },
    ],
    image: {
      desktop: '/journeys/ecommerce-portrait.webp',
      mobile: '/journeys/ecommerce-landscape.webp',
      focus: '50% 30%',
    },
    imageAlt: 'An ecommerce founder planning at a sunlit desk beside her skincare range, with a wall of campaign imagery behind her.',
  },
};
