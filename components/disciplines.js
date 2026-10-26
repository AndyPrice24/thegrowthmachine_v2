/*
 * The write-up for each growth discipline's own page (DisciplinePage.jsx),
 * by journey and slug. The discipline's name, icon and three area titles
 * come from journeys.js; this adds the rest:
 *
 *   promise   one line under the title: what changes
 *   lede      two sentences: the problem and how we take it on
 *   signs     what it feels like when this discipline is the constraint
 *   areas     for each of the three areas, in order: what we do (desc) and
 *             what you come away with (gets)
 *   outcomes  what's different afterwards
 *   related   two disciplines it works best with (slugs on the same journey)
 *
 * The "question we'd answer first" panel reuses the matching dashboard
 * screen from intel.js (same order as the disciplines).
 */

export const DISCIPLINE_PAGES = {
  b2b: {
    'brand-and-demand': {
      promise: 'Be the obvious choice before the first sales call.',
      lede: 'Most B2B brands describe what they do. Buyers choose the one that explains why it matters to them, so we sharpen who you’re for and why you win, and give sales the words and materials to prove it.',
      signs: [
        'Prospects can’t tell you apart from two competitors.',
        'Sales rewrite the pitch deck for every meeting.',
        'Marketing creates leads that sales don’t want.',
        'You win on relationships, then lose on price.',
      ],
      areas: [
        { desc: 'Define who you’re for, the problem you solve and why now, grounded in deals you’ve won and lost rather than a workshop.', gets: ['Ideal customer profile', 'Value proposition', 'Positioning statement'] },
        { desc: 'Find the few things that make you the safer, smarter choice, and the proof that backs them up.', gets: ['Competitor map', 'Proof points', 'Objection handling'] },
        { desc: 'Turn the positioning into words sales actually use, from the website to the proposal.', gets: ['Messaging framework', 'Pitch deck', 'Website and proposal copy'] },
      ],
      outcomes: ['A story every salesperson tells the same way.', 'Fewer, better-fit leads.', 'Price conversations that start from value.'],
      related: ['sales-and-conversion', 'gtm-and-market-expansion'],
    },
    'sales-and-conversion': {
      promise: 'Turn more of the pipeline you already have into revenue.',
      lede: 'Pipeline problems are rarely about volume. We find where deals stall, fix the process and tools around it, and work alongside your team until the new way sticks.',
      signs: [
        'Plenty of pipeline, not enough closing.',
        'Forecasts slip every quarter.',
        'Every rep sells a different way.',
        'The CRM records the past instead of shaping the next deal.',
      ],
      areas: [
        { desc: 'Build the routes that bring the right prospects in, and judge each one by the revenue it creates, not the leads.', gets: ['Channel mix', 'Lead scoring', 'Funnel reporting'] },
        { desc: 'Map how deals really move, set clear rules for each stage, and fix the stage where value leaks.', gets: ['Stage definitions', 'Qualification framework', 'Deal reviews'] },
        { desc: 'Give the team a CRM, a playbook and coaching they’ll actually use.', gets: ['CRM set-up', 'Sales playbook', 'Training and coaching'] },
      ],
      outcomes: ['Higher win rates from the same pipeline.', 'Forecasts you can plan around.', 'A sales process new hires learn in weeks.'],
      related: ['brand-and-demand', 'team-and-operating-model'],
    },
    'gtm-and-market-expansion': {
      promise: 'Grow into the right markets, in the right order.',
      lede: 'Expansion fails when it’s driven by opportunity rather than evidence. We find where you’re most likely to win, choose how to reach it, and lead the launch.',
      signs: [
        'You sell to everyone, so you stand out to no one.',
        'A new market or product is on the table, but the case is thin.',
        'Partners are signed, but nothing is sold.',
        'Growth has stalled in your core market.',
      ],
      areas: [
        { desc: 'Use your own customer and deal data to find the segments you win most often and keep longest.', gets: ['Segment analysis', 'Ideal customer profile', 'Market sizing'] },
        { desc: 'Choose the mix of direct, partner and digital routes that fits your deal size and your buyer.', gets: ['Channel strategy', 'Partner model', 'Sales coverage plan'] },
        { desc: 'Plan and run the launch, and build partnerships that create pipeline rather than press releases.', gets: ['Launch plan', 'Partner programme', 'Early-signal tracking'] },
      ],
      outcomes: ['A clear list of where to play, and where not to.', 'Launches with a plan, owners and early signals.', 'Partnerships measured in pipeline.'],
      related: ['brand-and-demand', 'commercial-model'],
    },
    'commercial-model': {
      promise: 'Make sure growth makes money.',
      lede: 'Revenue can grow while profit quietly shrinks. We look at what you sell, how you price it and what it costs to win and serve, and rebuild the model so every sale counts.',
      signs: [
        'Discounting has become the default way to close.',
        'Your biggest customers might not be your most profitable.',
        'Pricing hasn’t been reviewed in years.',
        'Growth needs more cash than it makes.',
      ],
      areas: [
        { desc: 'Set prices on value, design packages that sell up, and put rules around discounting.', gets: ['Pricing review', 'Packages and tiers', 'Discount rules'] },
        { desc: 'Shape how you earn, whether recurring, usage-based, services or a mix, and how it scales.', gets: ['Revenue model design', 'Contract and renewal terms', 'Revenue mix plan'] },
        { desc: 'Know your real profit by customer, product and channel, and what it costs to grow.', gets: ['Customer profitability', 'Unit economics', 'Growth scenarios'] },
      ],
      outcomes: ['Prices that hold in negotiation.', 'Margin visible by customer and product.', 'A growth plan the numbers support.'],
      related: ['sales-and-conversion', 'data-systems-and-ai'],
    },
    'data-systems-and-ai': {
      promise: 'See the whole business, and act on it faster.',
      lede: 'Your CRM, finance and marketing data each tell part of the story. We connect them, build the forecasts and tools your team uses every day, and automate the work that slows them down.',
      signs: [
        'Reporting takes days, and the numbers still get argued about.',
        'The forecast is a spreadsheet one person understands.',
        'Teams copy data between systems by hand.',
        'You know AI could help, but not where to start.',
      ],
      areas: [
        { desc: 'Join CRM, finance, marketing and product data into one view everyone trusts.', gets: ['Data audit', 'Connected reporting', 'Metric definitions'] },
        { desc: 'Forecast from how your deals really behave, and test decisions before you make them.', gets: ['Revenue forecast', 'Scenario models', 'Board reporting'] },
        { desc: 'Build the automations and AI tools that take manual work away, and that you own.', gets: ['Workflow automation', 'AI assistants', 'Bespoke tools'] },
      ],
      outcomes: ['One version of the numbers.', 'Forecasts you can trust.', 'Hours back every week, in tools you keep.'],
      related: ['commercial-model', 'team-and-operating-model'],
    },
    'team-and-operating-model': {
      promise: 'Build the team and rhythm that keep growth going.',
      lede: 'Strategy only lands when people own it. We shape the structure, the meetings and the skills, and help you hire the right people, so growth keeps running after we step back.',
      signs: [
        'Nobody owns growth from end to end.',
        'Meetings report the past instead of deciding what’s next.',
        'You’re about to hire a senior role, but aren’t sure which.',
        'The team is busy, but the numbers aren’t moving.',
      ],
      areas: [
        { desc: 'Design who owns what, with clear goals and the authority to act on them.', gets: ['Organisation design', 'Role scorecards', 'Goals and KPIs'] },
        { desc: 'Set the weekly, monthly and quarterly rhythm that keeps the priorities moving.', gets: ['Operating rhythm', 'Meeting cadence', 'Dashboard reviews'] },
        { desc: 'Coach the team, fill the gaps, and help you hire your next senior role.', gets: ['Skills review', 'Training and coaching', 'Hiring support'] },
      ],
      outcomes: ['A clear owner for every growth target.', 'Meetings that make decisions.', 'The right next hire, with a role ready for them.'],
      related: ['sales-and-conversion', 'data-systems-and-ai'],
    },
  },

  ecommerce: {
    'brand-and-demand': {
      promise: 'Give customers a reason to choose you, not just a reason to click.',
      lede: 'When ad spend is all that drives sales, growth gets more expensive every year. We sharpen what your brand stands for, and build the creative and content that make people seek you out.',
      signs: [
        'Customers buy on discount, not on brand.',
        'Ad costs keep rising while returns keep falling.',
        'Creative is made in a rush and tested by luck.',
        'You struggle to explain why you’re different.',
      ],
      areas: [
        { desc: 'Define who you’re for, what you stand for and why it’s worth paying for.', gets: ['Customer research', 'Brand positioning', 'Proposition'] },
        { desc: 'Build a creative system that feeds your ads, site and social, and test it properly.', gets: ['Creative strategy', 'Content plan', 'Testing framework'] },
        { desc: 'Grow the demand that makes every other channel cheaper.', gets: ['Brand campaigns', 'Partnerships and PR', 'Brand tracking'] },
      ],
      outcomes: ['A brand people search for by name.', 'Creative that’s planned, tested and improving.', 'Acquisition costs that fall over time.'],
      related: ['acquisition-and-discoverability', 'retention-and-ltv'],
    },
    'acquisition-and-discoverability': {
      promise: 'Be found by the right customers, at a cost that pays back.',
      lede: 'Customers now find brands through ads, search and AI answers. We plan the channel mix, get you found where people are looking, and judge every channel by profit rather than platform numbers.',
      signs: [
        'You rely on one or two ad platforms.',
        'The platform reports and your bank account disagree.',
        'You barely show up in search or in AI answers.',
        'Every increase in spend raises costs faster than sales.',
      ],
      areas: [
        { desc: 'Plan, test and run the mix across Meta, Google, TikTok, affiliates and beyond.', gets: ['Channel plan', 'Campaign structure', 'Testing roadmap'] },
        { desc: 'Get found in search results, and in the answers ChatGPT, Gemini and other AI tools give.', gets: ['Technical SEO', 'Content and FAQs', 'AI answer visibility'] },
        { desc: 'Set targets from margin and customer value, and hold every channel to them.', gets: ['Acquisition cost targets', 'Attribution', 'Budget allocation'] },
      ],
      outcomes: ['Budget moved to the channels that make money.', 'Visibility in search and AI answers.', 'Spend that scales without breaking margin.'],
      related: ['conversion-and-onsite', 'margin-and-channels'],
    },
    'conversion-and-onsite': {
      promise: 'Turn more visitors into customers.',
      lede: 'Every point of conversion lowers the cost of every customer. We find where shoppers drop out, fix the site and the offer, and keep testing so it keeps getting better.',
      signs: [
        'Traffic is up, but sales aren’t.',
        'Mobile converts far worse than desktop.',
        'Checkout drop-off is high, and nobody knows why.',
        'Offers are planned around the calendar, not the customer.',
      ],
      areas: [
        { desc: 'Rework product pages, landing pages and checkout around how your customers really shop.', gets: ['Site audit', 'Page redesigns', 'Checkout fixes'] },
        { desc: 'Shape bundles, prices and promotions that lift order value without eroding margin.', gets: ['Offer strategy', 'Bundles and price points', 'Promotion calendar'] },
        { desc: 'Run a steady programme of tests, and keep what works.', gets: ['Testing roadmap', 'Analytics set-up', 'Monthly test reviews'] },
      ],
      outcomes: ['More sales from the traffic you already pay for.', 'Bigger orders without deeper discounts.', 'A site that improves every month.'],
      related: ['acquisition-and-discoverability', 'retention-and-ltv'],
    },
    'retention-and-ltv': {
      promise: 'Make the second order as likely as the first.',
      lede: 'Most brands pay to win customers, then let them drift. We build the email, loyalty and subscription engine that brings them back, and track what each customer is really worth.',
      signs: [
        'Most customers buy once and never return.',
        'Email is a weekly discount blast.',
        'You don’t know your customer lifetime value.',
        'Subscriptions cancel as fast as they start.',
      ],
      areas: [
        { desc: 'Build lifecycle email and SMS that speak to where each customer is.', gets: ['Lifecycle flows', 'Segmentation', 'Campaign calendar'] },
        { desc: 'Design loyalty and subscription offers customers want to stay in.', gets: ['Loyalty programme', 'Subscription offer', 'Churn reduction'] },
        { desc: 'Measure value by cohort, channel and first product, and grow it.', gets: ['Cohort analysis', 'Lifetime value model', 'Retention targets'] },
      ],
      outcomes: ['More repeat orders, at a lower cost.', 'Customer value tracked, and growing.', 'Less reliance on paid acquisition.'],
      related: ['conversion-and-onsite', 'brand-and-demand'],
    },
    'margin-and-channels': {
      promise: 'Grow the channels and products that actually make money.',
      lede: 'Amazon, retail and DTC rarely earn the same. We work out the true profit of every channel and product, then reshape the mix and the terms so growth adds to the bottom line.',
      signs: [
        'Revenue grows, but cash doesn’t.',
        'Amazon or retail sales look great until fees and returns land.',
        'Some products sell well and lose money.',
        'Stock is tied up in the wrong lines.',
      ],
      areas: [
        { desc: 'Know the real profit per order, product and channel, after every cost.', gets: ['Contribution margin', 'Cost to serve', 'Pricing review'] },
        { desc: 'Run Amazon and other marketplaces well, and win retail listings on terms that work.', gets: ['Marketplace strategy', 'Listings and ads', 'Retail terms'] },
        { desc: 'Back the products that earn, fix or cut the ones that don’t, and plan the range.', gets: ['Range review', 'Stock planning', 'New product cases'] },
      ],
      outcomes: ['Profit by channel and product, every month.', 'Marketplaces and retail on terms that pay.', 'Cash freed from the wrong stock.'],
      related: ['acquisition-and-discoverability', 'data-systems-and-ai'],
    },
    'data-systems-and-ai': {
      promise: 'See the whole business, and act on it faster.',
      lede: 'Your store, ad platforms, marketplaces and finance each tell part of the story. We connect them, build the forecasts and reports you run the business on, and automate the busywork with AI tools you own.',
      signs: [
        'Every platform reports a different number.',
        'Stock-outs and overstock keep catching you out.',
        'Month-end reporting takes days.',
        'The team loses hours to manual tasks.',
      ],
      areas: [
        { desc: 'Join store, ads, email, marketplace and finance data into one view of profit.', gets: ['Data audit', 'Profit dashboard', 'Metric definitions'] },
        { desc: 'Forecast demand and stock against the promo calendar, and report on what matters.', gets: ['Demand forecast', 'Stock planning', 'Weekly reporting'] },
        { desc: 'Build the automations and AI tools that take the busywork off the team.', gets: ['Workflow automation', 'AI assistants', 'Bespoke tools'] },
      ],
      outcomes: ['One version of the numbers.', 'Stock in the right place at the right time.', 'Hours back every week, in tools you keep.'],
      related: ['margin-and-channels', 'retention-and-ltv'],
    },
  },
};
