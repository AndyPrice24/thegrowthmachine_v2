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
    // "How we work": the disciplines (named as on the B2B card in the
    // choice above) and what we actually do in each, then why it compounds.
    work: {
      disciplines: [
        { name: 'GTM & market focus', text: 'Define who you win with and why, then rewrite the positioning to match.' },
        { name: 'Lead generation & pipeline', text: 'Build and run the channels: outbound, content, partners, events.' },
        { name: 'Sales process & conversion', text: 'Map the stages, tighten qualification, fix where deals stall.' },
        { name: 'Pricing & commercial model', text: 'Rework packaging, pricing and terms.' },
        { name: 'CRM, data & operating systems', text: 'Set up the CRM, reporting and weekly rhythm so the numbers are trusted.' },
        { name: 'Team structure & accountability', text: 'Shape roles, targets and incentives; hire and coach where needed.' },
      ],
      compounding: [
        'Sharper positioning makes demand cheaper.',
        'Better pipeline makes sales faster.',
        'Cleaner pricing lifts every deal.',
        'Fix one in isolation and the gain leaks out at the next step.',
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
