/*
 * The write-up for each growth discipline's own page (DisciplinePage.jsx),
 * by journey and slug. The discipline's name, icon and three area titles
 * come from journeys.js; this adds the rest:
 *
 *   promise     one line under the title: what changes
 *   lede        two sentences: the problem and how we take it on
 *   signsTitle  the "Sound familiar?" headline, in the founder's words;
 *               *asterisks* mark the words picked out in red
 *   signs       four things it feels like when this is the constraint
 *   goal        the commercial goal, under "Three areas. One commercial goal."
 *   areas       for each of the three areas, in order: what we do (desc),
 *               the working things you're left with (gets), and optionally
 *               a fuller title for the page than the card's (title)
 *   steps       what Diagnose, Prioritise, Do the work and Embed mean here
 *   outcomes    what's different afterwards
 *   related     two disciplines it works best with, on the same journey:
 *               [slug, why they go together]
 *
 * The "question we'd answer first" panel reuses the matching dashboard
 * screen from intel.js (same order as the disciplines).
 */

export const DISCIPLINE_PAGES = {
  b2b: {
    'brand-and-demand': {
      promise: 'Be the obvious choice before the first sales call.',
      lede: 'B2B brands don’t lose because buyers haven’t heard of them. They lose when the value isn’t clear enough to defend internally, so we sharpen the positioning, build the proof and arm sales with a story buyers can repeat.',
      signsTitle: 'Signs buyers can’t see *why you, not them*.',
      signs: [
        'Prospects can’t tell you apart from two competitors.',
        'Sales rewrite the pitch deck for every meeting.',
        'Marketing creates leads that sales don’t want.',
        'You win on relationships, then lose on price.',
      ],
      goal: 'Win more of the right deals at the right price, because buyers see why you’re different.',
      areas: [
        { desc: 'Define who you’re for, the problem you solve and why now, grounded in deals you’ve won and lost rather than a workshop.', gets: ['Ideal customer profile', 'Value proposition', 'Positioning the team uses'] },
        { desc: 'Find the few things that make you the safer, smarter choice, and the proof that backs them up.', gets: ['Competitor map', 'Proof library', 'Objection handling'] },
        { desc: 'Turn the positioning into words sales actually use, from the website to the proposal.', gets: ['Messaging framework', 'Live sales deck', 'Website and proposal copy'] },
      ],
      steps: [
        'Review won and lost deals, and how buyers describe you.',
        'Pick the segment and the message that win most often.',
        'Rewrite the pitch, site and proposals, and train the team on them.',
        'Track win rate by message, and refresh it every quarter.',
      ],
      outcomes: ['Messaging judged by revenue won, not leads.', 'A story every salesperson tells the same way.', 'Price conversations that start from value.'],
      related: [
        ['sales-and-conversion', 'Positioning only pays off when sales tell the story the same way.'],
        ['gtm-and-market-expansion', 'Who you’re for decides where you should go next.'],
      ],
    },
    'sales-and-conversion': {
      promise: 'Turn more of the pipeline you already have into revenue.',
      lede: 'A bigger pipeline means nothing if the deals inside it aren’t moving. We connect pipeline data with buyer engagement and sales execution to find where revenue is slipping, and change how the team sells.',
      signsTitle: 'Signs your pipeline is *bigger than your results*.',
      signs: [
        'Plenty of pipeline, not enough closing.',
        'Forecasts slip every quarter.',
        'Every rep sells a different way.',
        'The CRM records the past instead of shaping the next deal.',
      ],
      goal: 'Convert more of the pipeline you already have, with forecasts you can plan around.',
      areas: [
        { desc: 'Build the routes that bring the right prospects in, and judge each one by the revenue it creates, not the leads.', gets: ['Channel mix by revenue', 'Lead scoring', 'Funnel dashboard'] },
        { desc: 'Map how deals really move, set clear rules for each stage, and fix the stage where value leaks.', gets: ['Stage rules', 'Qualification framework', 'Weekly deal reviews'] },
        { desc: 'Give the team a CRM, a playbook and coaching they’ll actually use.', gets: ['CRM set up for selling', 'Sales playbook', 'Coaching routine'] },
      ],
      steps: [
        'Map how deals really move, and where they stall.',
        'Fix the stage leaking the most value first.',
        'Rebuild the process, CRM and playbook with the team.',
        'Run weekly deal reviews until the new way is habit.',
      ],
      outcomes: ['Complex deals with the right buyers engaged.', 'Higher win rates from the same pipeline.', 'Forecasts you can plan around.'],
      related: [
        ['brand-and-demand', 'Better-fit leads and a sharper story lift win rates at every stage.'],
        ['team-and-operating-model', 'A new sales process only lasts with clear owners and a rhythm.'],
      ],
    },
    'gtm-and-market-expansion': {
      promise: 'Grow into the right markets, in the right order.',
      lede: 'Expansion isn’t about going wider. It’s about finding the segment where your offer has the strongest economics and the highest right to win, then building a repeatable route into it.',
      signsTitle: 'Signs you’re *growing in the wrong places*.',
      signs: [
        'You sell to everyone, so you stand out to no one.',
        'A new market or product is on the table, but the case is thin.',
        'Partners are signed, but nothing is sold.',
        'Growth has stalled in your core market.',
      ],
      goal: 'Grow into the markets you’re most likely to win, in the order that pays back soonest.',
      areas: [
        { desc: 'Use your own customer and deal data to find the segments you win most often and keep longest.', gets: ['Segment analysis', 'Ideal customer profile', 'Market sizing'] },
        { desc: 'Choose the mix of direct, partner and digital routes that fits your deal size and your buyer.', gets: ['Route-to-market model', 'Partner model', 'Sales coverage plan'] },
        { desc: 'Plan and run the launch, and build partnerships that create pipeline rather than press releases.', gets: ['Launch in motion', 'Partner programme', 'Early-signal dashboard'] },
      ],
      steps: [
        'Find where you win most often and keep customers longest.',
        'Rank markets by size, fit and how hard they are to reach.',
        'Build the route in and run the launch with your team.',
        'Set early signals, and scale or stop on the evidence.',
      ],
      outcomes: ['A ranked list of where to play, and where not to.', 'Launches with owners, targets and early signals.', 'Partnerships measured in pipeline.'],
      related: [
        ['brand-and-demand', 'Every new market needs positioning that speaks to it.'],
        ['commercial-model', 'A new market is only worth it if the model makes money there.'],
      ],
    },
    'commercial-model': {
      promise: 'Make sure growth makes money.',
      lede: 'You can be winning deals and still weakening the business. We connect pricing, discounting, customer economics and delivery costs, so every commercial decision strengthens the revenue line, not just enlarges it.',
      signsTitle: 'Signs you’re *winning deals that don’t pay*.',
      signs: [
        'Discounting has become the default way to close.',
        'Your biggest customers might not be your most profitable.',
        'Pricing hasn’t been reviewed in years.',
        'Growth needs more cash than it makes.',
      ],
      goal: 'Make every sale count: prices that hold, and profit you can see by customer.',
      areas: [
        { desc: 'Set prices on value, design packages that sell up, and put rules around discounting.', gets: ['Pricing and packages', 'Discount rules in the CRM', 'Price-change plan'] },
        { desc: 'Shape how you earn, whether recurring, usage-based, services or a mix, and how it scales.', gets: ['Revenue model', 'Contract and renewal terms', 'Revenue mix plan'] },
        { desc: 'Know your real profit by customer, product and channel, and what it costs to grow.', gets: ['Customer profitability view', 'Unit economics model', 'Growth scenarios'] },
      ],
      steps: [
        'Work out real profit by customer, product and deal.',
        'Find the discounts, prices and accounts that cost the most.',
        'Reprice, repackage and set discount rules with sales.',
        'Track margin by customer every month, in your own tools.',
      ],
      outcomes: ['Every account earning its place, and repriced at renewal if not.', 'Prices that hold in negotiation.', 'A growth plan the numbers support.'],
      related: [
        ['sales-and-conversion', 'Pricing only holds if sales can sell the value.'],
        ['data-systems-and-ai', 'You can’t manage margin you can’t see.'],
      ],
    },
    'data-systems-and-ai': {
      promise: 'See the whole business, and act on it faster.',
      lede: 'You already have the numbers. We connect the commercial signals, show where the plan is drifting, and build the decisions and systems to correct it, while there’s still time to act.',
      signsTitle: 'Signs disconnected information is *slowing you down*.',
      signs: [
        'Reporting takes days, and the numbers still get argued about.',
        'The forecast is a spreadsheet one person understands.',
        'Teams copy data between systems by hand.',
        'You know AI could help, but not where to start.',
      ],
      goal: 'Faster, better decisions, by connecting information, ownership and action.',
      areas: [
        { desc: 'Join CRM, finance, marketing and product data into one view everyone trusts.', gets: ['Data audit', 'Connected reporting', 'Agreed metric definitions'] },
        { desc: 'Forecast from how your deals really behave, and test decisions before you make them.', gets: ['Revenue forecast', 'Scenario models', 'Board reporting'] },
        { desc: 'Build the automations and AI tools that take manual work away, and that you own.', gets: ['Workflow automations', 'AI tools in daily use', 'Bespoke tools you own'] },
      ],
      steps: [
        'Audit every system, report and manual task.',
        'Choose the decisions that most need better information.',
        'Connect the data, build the forecasts and automate the busywork.',
        'Hand over tools you own, and train the team to use them.',
      ],
      outcomes: ['A forecast that shows its risks early.', 'One version of the numbers.', 'Hours back every week, in tools you keep.'],
      related: [
        ['commercial-model', 'Connected data is how you see margin by customer.'],
        ['team-and-operating-model', 'Tools only help if the team’s rhythm runs on them.'],
      ],
    },
    'team-and-operating-model': {
      promise: 'Build the team and rhythm that keep growth going.',
      lede: 'A growth plan only works if the organisation can execute it. We align structure, ownership, leadership rhythm and capability to the revenue plan, then leave the team able to keep it moving.',
      signsTitle: 'Signs nobody *owns growth*.',
      signs: [
        'Nobody owns growth from end to end.',
        'Meetings report the past instead of deciding what’s next.',
        'You’re about to hire a senior role, but aren’t sure which.',
        'The team is busy, but the numbers aren’t moving.',
      ],
      goal: 'A team and rhythm that keep growth going after we step back.',
      areas: [
        { desc: 'Design who owns what, with clear goals and the authority to act on them.', gets: ['Organisation design', 'Role scorecards', 'Goals and KPIs'] },
        { desc: 'Set the weekly, monthly and quarterly rhythm that keeps the priorities moving.', gets: ['Operating rhythm', 'Meeting cadence', 'Dashboard reviews'] },
        { desc: 'Coach the team, fill the gaps, and help you hire your next senior role.', gets: ['Skills plan', 'Coaching programme', 'Next senior hire, briefed'] },
      ],
      steps: [
        'Map who owns what, and where decisions get stuck.',
        'Agree the structure, goals and meetings that matter.',
        'Set up the rhythm, coach the team and support hiring.',
        'Step back once it runs without us.',
      ],
      outcomes: ['Capacity planned against revenue, not headcount.', 'A clear owner for every growth target.', 'Meetings that make decisions.'],
      related: [
        ['sales-and-conversion', 'Sales performance comes down to people, process and rhythm.'],
        ['data-systems-and-ai', 'A good rhythm runs on numbers everyone trusts.'],
      ],
    },
  },

  ecommerce: {
    'brand-and-demand': {
      promise: 'Give customers a reason to choose you, not just a reason to click.',
      lede: 'When ad spend is all that drives sales, growth gets more expensive every year. We sharpen what your brand stands for, and build the creative and content that make people seek you out.',
      signsTitle: 'Signs your brand *isn’t doing enough of the heavy lifting*.',
      signs: [
        'Customers buy on discount, not on brand.',
        'Ad costs keep rising while returns keep falling.',
        'Creative is made in a rush and tested by luck.',
        'You struggle to explain why you’re different.',
      ],
      goal: 'Create new customer demand and preference, without losing sight of profitable growth.',
      areas: [
        { desc: 'Define who you’re for, what you stand for and why it’s worth paying for.', gets: ['Customer research', 'Brand positioning', 'Proposition'] },
        { desc: 'Build a creative system that feeds your ads, site and social, and test it properly.', gets: ['Creative strategy', 'Creative testing system', 'Content engine'] },
        { desc: 'Grow the demand that makes every other channel’s job easier, and measure it properly.', gets: ['Brand campaigns', 'Partnerships and PR', 'Brand lift measurement'] },
      ],
      steps: [
        'Learn why customers choose you, and why they don’t.',
        'Agree what the brand stands for, and the creative bets to test.',
        'Make, run and test the creative across ads, site and social.',
        'Measure brand lift, and feed the learning into the next round.',
      ],
      outcomes: ['A brand people search for by name.', 'Creative that’s planned, tested and improving.', 'New customers that cost less over time.'],
      related: [
        ['acquisition-and-discoverability', 'Brand demand is what your paid channels convert.'],
        ['retention-and-ltv', 'Customers who buy into the brand are the ones who come back.'],
      ],
    },
    'acquisition-and-discoverability': {
      promise: 'Be found by the right customers, at a cost that pays back.',
      lede: 'Customers now find brands through ads, search and AI answers. We plan the channel mix, get you found where people are looking, and judge every channel by contribution rather than platform numbers.',
      signsTitle: 'Signs you’re *spending more to find customers*, without enough to show for it.',
      signs: [
        'You rely on one or two ad platforms.',
        'The platform reports and your bank account disagree.',
        'You barely show up in search or in AI answers.',
        'Every increase in spend raises costs faster than sales.',
      ],
      goal: 'Win more profitable new customers, through a better channel mix and being easier to find.',
      areas: [
        { desc: 'Plan, test and run the mix across Meta, Google, TikTok, affiliates and beyond.', gets: ['Channel plan', 'Campaign structure', 'Testing programme'] },
        { title: 'Search & AI discoverability (SEO, GEO & AEO)', desc: 'Get found in search results, and in the answers ChatGPT, Gemini and other AI tools give.', gets: ['Technical SEO', 'Content and FAQs', 'AI answer visibility'] },
        { desc: 'Set targets from margin and customer value, and hold every channel to them.', gets: ['Acquisition cost targets', 'Attribution you trust', 'Channel investment model'] },
      ],
      steps: [
        'Compare what platforms report with what customers are really worth.',
        'Set targets from margin and customer value, by channel.',
        'Rebuild campaigns and search content, and test budget moves.',
        'Review channels monthly on contribution, not platform ROAS.',
      ],
      outcomes: ['Budget moved to the channels that make money.', 'Visibility in search and AI answers.', 'Spend that scales without breaking margin.'],
      related: [
        ['conversion-and-onsite', 'Every point of conversion makes each channel cheaper.'],
        ['margin-and-channels', 'Channel targets only work if you know the margin behind them.'],
      ],
    },
    'conversion-and-onsite': {
      promise: 'Turn more of the traffic you’re already paying for into profitable sales.',
      lede: 'Every point of conversion lowers the cost of every customer. We find where shoppers drop out, fix the site and the offer, and keep testing so it keeps getting better.',
      signsTitle: 'Signs your website is *losing sales it should be winning*.',
      signs: [
        'Traffic is up, but sales aren’t.',
        'Mobile converts far worse than desktop.',
        'Checkout drop-off is high, and nobody knows why.',
        'Offers are planned around the calendar, not the customer.',
      ],
      goal: 'Recover profitable orders from the demand you already have, without more returns or lost margin.',
      areas: [
        { desc: 'Rework product pages, landing pages and checkout around how your customers really shop.', gets: ['Site audit', 'Page redesigns', 'Checkout fixes'] },
        { desc: 'Shape bundles, prices and promotions that lift order value without eroding margin.', gets: ['Offer strategy', 'Bundles and price points', 'Promotion calendar'] },
        { desc: 'Run a steady programme of tests, and keep what works.', gets: ['Testing programme', 'Analytics you trust', 'Continuous improvement system'] },
      ],
      steps: [
        'Find where shoppers drop out, by device and step.',
        'Rank fixes by the orders and margin they could recover.',
        'Redesign, re-offer and test, one change at a time.',
        'Keep a monthly testing rhythm, so the site keeps improving.',
      ],
      outcomes: ['More sales from the traffic you already pay for.', 'Bigger orders without deeper discounts.', 'A site that improves every month.'],
      related: [
        ['acquisition-and-discoverability', 'Better conversion lowers the cost of every customer.'],
        ['retention-and-ltv', 'The first order sets up the second.'],
      ],
    },
    'retention-and-ltv': {
      promise: 'Make every customer worth more than the cost of winning them.',
      lede: 'Most brands pay to win customers, then let them drift. We build the lifecycle email, offers and, where they fit, loyalty and subscriptions that bring them back, and track what each customer is really worth.',
      signsTitle: 'Signs customers *buy once and drift away*.',
      signs: [
        'Most customers buy once and never return.',
        'Email is a weekly discount blast.',
        'You don’t know your customer lifetime value.',
        'Subscriptions cancel as fast as they start.',
      ],
      goal: 'Raise the contribution of every customer you win, through better first offers and repeat buying.',
      areas: [
        { desc: 'Build lifecycle email and SMS that speak to where each customer is.', gets: ['Lifecycle flows', 'Segmentation', 'Campaign calendar'] },
        { desc: 'Shape the journey to the next order, using loyalty and subscriptions where they fit how customers buy.', gets: ['Repeat-purchase journey', 'Loyalty or subscription offer', 'Churn reduction'] },
        { desc: 'Measure value by cohort, channel and first product, and grow it.', gets: ['Cohort dashboard', 'Lifetime value model', 'Retention targets'] },
      ],
      steps: [
        'Track each cohort by first product, offer and channel.',
        'Find the first orders that build the best customers.',
        'Build the flows and offers that bring them back.',
        'Review cohort value monthly, and adjust.',
      ],
      outcomes: ['More repeat orders, at a lower cost.', 'Customer value tracked, and growing.', 'Less reliance on paid acquisition.'],
      related: [
        ['conversion-and-onsite', 'The right first offer decides who comes back.'],
        ['brand-and-demand', 'Customers who buy into the brand stay longer.'],
      ],
    },
    'margin-and-channels': {
      promise: 'Grow the channels and products that actually make money.',
      lede: 'Amazon, retail and DTC rarely earn the same. We work out the true contribution of every channel and product, then reshape the mix and the terms so growth adds to the bottom line.',
      signsTitle: 'Signs revenue is *growing faster than profit*.',
      signs: [
        'Revenue grows, but cash doesn’t.',
        'Amazon or retail sales look great until fees and returns land.',
        'Some products sell well and lose money.',
        'Stock is tied up in the wrong lines.',
      ],
      goal: 'Grow contribution and free up cash, through better channel, product and pricing decisions.',
      areas: [
        { desc: 'Know the real contribution per order, product and channel, after every cost.', gets: ['Contribution by order', 'Cost-to-serve view', 'Pricing review'] },
        { desc: 'Run Amazon and other marketplaces well, and win retail listings on terms that work.', gets: ['Marketplace strategy', 'Listings and ads', 'Retail terms'] },
        { desc: 'Back the products that earn, fix or cut the ones that don’t, and plan the range.', gets: ['Range review', 'Stock plan', 'New product cases'] },
      ],
      steps: [
        'Work out contribution per order, product and channel.',
        'Find the lines and channels that consume profit.',
        'Test price, fulfilment and ads before cutting anything.',
        'Report contribution monthly, so the mix keeps up.',
      ],
      outcomes: ['Contribution by channel and product, every month.', 'Marketplaces and retail on terms that pay.', 'Cash freed from the wrong stock.'],
      related: [
        ['acquisition-and-discoverability', 'Ad spend is often the biggest hidden cost in a channel.'],
        ['data-systems-and-ai', 'Contribution by product starts with connected data.'],
      ],
    },
    'data-systems-and-ai': {
      promise: 'See the whole business, and act on it faster.',
      lede: 'Your store, ad platforms, marketplaces and finance each tell part of the story. We connect them, make sense of them, and turn them into decisions and actions you can measure, with forecasts, reporting and AI tools you own.',
      signsTitle: 'Signs disconnected information is *slowing your business down*.',
      signs: [
        'Every platform reports a different number.',
        'Stock-outs and overstock keep catching you out.',
        'Month-end reporting takes days.',
        'The team loses hours to manual tasks.',
      ],
      goal: 'Faster, better decisions, by connecting information, ownership and action.',
      areas: [
        { desc: 'Join store, ads, email, marketplace and finance data into one view of profit.', gets: ['Data audit', 'Profit dashboard', 'Agreed metric definitions'] },
        { desc: 'Forecast demand and stock against the promo calendar, and report on what matters.', gets: ['Demand forecast', 'Stock plan', 'Weekly reporting'] },
        { desc: 'Build the automations and AI tools that take the busywork off the team.', gets: ['Workflow automations', 'AI tools in daily use', 'Bespoke tools you own'] },
      ],
      steps: [
        'Audit every platform, report and manual task.',
        'Choose the decisions that most need better information.',
        'Connect the data, build the forecasts and automate the busywork.',
        'Hand over tools you own, and train the team to use them.',
      ],
      outcomes: ['One version of the numbers.', 'Stock in the right place at the right time.', 'Hours back every week, in tools you keep.'],
      related: [
        ['margin-and-channels', 'Contribution by product starts with connected data.'],
        ['retention-and-ltv', 'Cohort value needs store, CRM and finance joined up.'],
      ],
    },
  },
};
