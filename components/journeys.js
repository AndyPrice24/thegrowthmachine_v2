/*
 * Copy for the opening section of each journey, below the choice.
 *
 * b2b: Andrew's B2B section (October 2026 mockups), word for word, minus its
 *   four-lever row: the How we work section below covers the disciplines.
 * ecommerce: Andrew's ecommerce section (October 2026 mockups), word for word,
 *   minus its four-lever row, for the same reason.
 *
 * intel: the "Data, systems & AI" section (ContextIntelligence). Its figures
 * are illustrative. Each signal lists the question cards it feeds (0-3, in
 * order: leak, rank, scenario, trend); each scenario lever moves its results
 * in a straight line, `per` step of the slider ({v} is the slider's value).
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
    // "How we work": the six disciplines, each a card linking to its own
    // page (/b2b/<slug>), and the photo behind the board.
    work: {
      photo: '/systems/b2b-landscape.webp',
      disciplines: [
        { slug: 'brand-and-demand', icon: 'target', name: 'Brand & Demand', items: ['Positioning & proposition', 'Differentiation', 'Messaging & sales materials'] },
        { slug: 'sales-and-conversion', icon: 'funnel', name: 'Sales & Conversion', items: ['Lead generation & funnels', 'Sales process & conversion', 'Tools & enablement'] },
        { slug: 'gtm-and-market-expansion', icon: 'compass', name: 'GTM & Market Expansion', items: ['ICP & market focus', 'Routes to market', 'Launch & partnerships'] },
        { slug: 'commercial-model', icon: 'bars', name: 'Commercial Model', items: ['Pricing & packaging', 'Revenue model', 'Growth economics'] },
        { slug: 'data-systems-and-ai', icon: 'chip', name: 'Data, Systems & AI', items: ['Connected data', 'Forecasting & scenarios', 'Automation & bespoke tools'] },
        { slug: 'team-and-operating-model', icon: 'people', name: 'Team & Operating Model', items: ['Structure & accountability', 'Leadership rhythm', 'Training & capability'] },
      ],
    },
    intel: {
      lede: 'Your CRM knows one thing, finance another, marketing another. We connect the signals across the commercial system and turn them into tools that help you see what is actually happening, and what to do next.',
      active: 4,
      signals: [
        { name: 'CRM', detail: 'Accounts · Opportunities', icon: 'crm', feeds: [1, 3] },
        { name: 'Pipeline', detail: 'Stages · Value · Velocity', icon: 'funnel', feeds: [1, 2] },
        { name: 'Marketing', detail: 'Campaigns · Attribution', icon: 'mega', feeds: [3] },
        { name: 'Sales', detail: 'Activity · Conversion', icon: 'bars', feeds: [2, 3] },
        { name: 'Finance', detail: 'Revenue · Costs · Margin', icon: 'db', feeds: [0, 2] },
        { name: 'Customer', detail: 'Usage · NPS · Renewals', icon: 'people', feeds: [0, 2] },
        { name: 'Operations', detail: 'Capacity · Delivery', icon: 'gear', feeds: [0] },
        { name: 'Product', detail: 'Adoption · Engagement', icon: 'box', feeds: [0, 3] },
      ],
      leak: {
        title: 'Where is margin leaking?', value: '£1.2M', label: 'estimated annual leakage', delta: '↑ 23% vs. last period',
        bars: [['List price', 100, 'base'], ['Discounting', -14, 'loss'], ['Delivery', -8, 'loss'], ['Churn', -9, 'loss'], ['Net margin', 69, 'net']],
      },
      rank: {
        title: 'Which opportunities deserve attention?', value: '12', label: 'high-value opportunities', delta: '£3.4M potential revenue',
        cols: ['Opportunity', 'Value', 'Win chance'],
        rows: [['Global Retail Group', '£850K', 0.78, '78%'], ['HealthTech Co', '£620K', 0.64, '64%'], ['Apex Manufacturing', '£420K', 0.52, '52%'], ['SaaS Platform', '£310K', 0.48, '48%'], ['Public Sector', '£280K', 0.46, '46%']],
      },
      levers: [
        { tab: 'Win rate', title: 'What if we lift win rate {v}%?', label: 'Win rate + {v}%', min: 1, max: 20, step: 1, value: 10, money: 280, moneyLabel: 'additional revenue (p.a.)', kpis: [[1.8, '%', 'total revenue'], [0.6, '%', 'EBITDA']] },
        { tab: 'Churn', title: 'What if we cut churn by {v} pts?', label: 'Churn − {v} pts', min: 1, max: 10, step: 1, value: 3, money: 220, moneyLabel: 'retained revenue (p.a.)', kpis: [[1, 'pts', 'net retention'], [0.7, '%', 'EBITDA']] },
        { tab: 'Price', title: 'What if we raise prices {v}%?', label: 'Price + {v}%', min: 1, max: 10, step: 1, value: 5, money: 170, moneyLabel: 'additional revenue (p.a.)', kpis: [[-0.4, 'pts', 'win rate'], [0.9, '%', 'EBITDA']] },
        { tab: 'Volume', title: 'What if pipeline grows {v}%?', label: 'Pipeline + {v}%', min: 5, max: 40, step: 5, value: 20, money: 75, moneyLabel: 'additional revenue (p.a.)', kpis: [[0.5, '%', 'total revenue'], [0.15, '%', 'EBITDA']] },
      ],
      trend: { title: 'What drives conversion?', value: '3.6%', label: 'visitor to opportunity', delta: '↑ 0.8pp', points: [2.0, 2.1, 2.3, 2.4, 2.6, 2.8, 3.0, 3.2, 3.6] },
      outcomes: [
        { name: 'Profitability', value: '+18%', label: 'EBITDA potential', icon: 'trend' },
        { name: 'Leakage', value: '£1.2M', label: 'addressable', icon: 'leak' },
        { name: 'Opportunity', value: '£3.4M', label: 'in pipeline', icon: 'target' },
        { name: 'Forecasts', value: '+24%', label: 'more accurate', icon: 'chart' },
        { name: 'Priorities', value: '5', label: 'key actions', icon: 'list' },
        { name: 'Action', value: null, label: 'From insight to execution', icon: 'send' },
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
    // "How we work": the six disciplines, each a card linking to its own
    // page (/ecommerce/<slug>), and the photo behind the board.
    work: {
      photo: '/systems/ecommerce-landscape.webp',
      disciplines: [
        { slug: 'brand-and-demand', icon: 'target', name: 'Brand & Demand', items: ['Positioning & proposition', 'Creative & content', 'Brand building'] },
        { slug: 'acquisition-and-discoverability', icon: 'compass', name: 'Acquisition & Discoverability', items: ['Paid media & channel mix', 'SEO, GEO & AEO', 'Media economics'] },
        { slug: 'conversion-and-onsite', icon: 'cart', name: 'Conversion & Onsite', items: ['Site & landing pages', 'Offer & pricing', 'Testing & optimisation'] },
        { slug: 'retention-and-ltv', icon: 'loop', name: 'Retention & LTV', items: ['CRM & email', 'Loyalty & subscriptions', 'Customer lifetime value'] },
        { slug: 'margin-and-channels', icon: 'bars', name: 'Margin & Channels', items: ['Unit economics', 'Marketplaces & retail', 'Product mix'] },
        { slug: 'data-systems-and-ai', icon: 'chip', name: 'Data, Systems & AI', items: ['Connected data', 'Forecasting & reporting', 'Automation & tools'] },
      ],
    },
    intel: {
      lede: 'Your store knows one thing, your ad platforms another, finance another. We connect the signals across the commercial system and turn them into tools that help you see what is actually happening, and what to do next.',
      active: 5,
      signals: [
        { name: 'Store & orders', detail: 'Orders · AOV · Returns', icon: 'store', feeds: [0, 3] },
        { name: 'Ad platforms', detail: 'Spend · ROAS · CAC', icon: 'mega', feeds: [1, 2] },
        { name: 'Email & CRM', detail: 'Customers · Repeat · LTV', icon: 'mail', feeds: [2, 3] },
        { name: 'Marketplaces', detail: 'Amazon · Retail', icon: 'cart', feeds: [0, 1] },
        { name: 'Stock & supply', detail: 'Inventory · Lead times', icon: 'box', feeds: [1] },
        { name: 'Finance', detail: 'Margin · Costs · Cash', icon: 'db', feeds: [0, 2] },
      ],
      leak: {
        title: 'Where is margin leaking?', value: '£1.2M', label: 'estimated annual leakage', delta: '↑ 23% vs. last period',
        bars: [['List price', 100, 'base'], ['Discounting', -12, 'loss'], ['Fulfilment', -9, 'loss'], ['Returns', -7, 'loss'], ['Net margin', 72, 'net']],
      },
      rank: {
        title: 'Which products deserve the budget?', value: '3', label: 'products take 41% of ad spend', delta: 'with under 12 days of stock left',
        cols: ['Product', 'Spend', 'Margin', 'Stock risk'],
        rows: [['Glow Serum', '£48K', '22%', 0.92, '9d'], ['Starter Kit', '£19K', '14%', 0.95, '6d'], ['Night Repair Oil', '£31K', '58%', 0.25, '64d'], ['Hydra Cleanser', '£22K', '61%', 0.18, '80d'], ['Body Balm', '£12K', '49%', 0.3, '45d']],
      },
      levers: [
        { tab: 'Price', title: 'What if we raise prices {v}%?', label: 'Price + {v}%', min: 1, max: 10, step: 1, value: 5, money: 128, moneyLabel: 'additional gross profit (p.a.)', kpis: [[-0.6, '%', 'order volume'], [0.82, 'pts', 'gross margin']] },
        { tab: 'Discounting', title: 'What if we cut discounting by {v} pts?', label: 'Average discount − {v} pts', min: 1, max: 10, step: 1, value: 4, money: 95, moneyLabel: 'additional gross profit (p.a.)', kpis: [[-0.9, '%', 'order volume'], [0.75, 'pts', 'gross margin']] },
        { tab: 'Repeat rate', title: 'What if repeat rate rises {v} pts?', label: 'Repeat rate + {v} pts', min: 1, max: 10, step: 1, value: 3, money: 70, moneyLabel: 'additional gross profit (p.a.)', kpis: [[4, '%', 'customer LTV'], [-0.4, ' mo', 'CAC payback']] },
        { tab: 'Ad mix', title: 'What if we shift {v}% of ad spend?', label: 'To top-margin products: {v}%', min: 5, max: 40, step: 5, value: 20, money: 12, moneyLabel: 'additional gross profit (p.a.)', kpis: [[0.03, 'x', 'blended ROAS'], [0.1, 'pts', 'gross margin']] },
      ],
      trend: { title: 'What drives repeat purchase?', value: '28%', label: 'of customers buy again within 90 days', delta: '↑ 3.2pp', points: [19, 20, 20.5, 21, 22, 22.5, 24, 25.5, 28] },
      outcomes: [
        { name: 'Profitability', value: '+18%', label: 'gross margin potential', icon: 'trend' },
        { name: 'Leakage', value: '£1.2M', label: 'addressable', icon: 'leak' },
        { name: 'Opportunity', value: '£640K', label: 'from pricing', icon: 'target' },
        { name: 'Forecasts', value: '+24%', label: 'more accurate', icon: 'chart' },
        { name: 'Priorities', value: '5', label: 'key actions', icon: 'list' },
        { name: 'Action', value: null, label: 'From insight to execution', icon: 'send' },
      ],
    },
    image: {
      desktop: '/journeys/ecommerce-portrait.webp',
      mobile: '/journeys/ecommerce-landscape.webp',
      focus: '50% 30%',
    },
    imageAlt: 'An ecommerce founder planning at a sunlit desk beside her skincare range, with a wall of campaign imagery behind her.',
  },
};
