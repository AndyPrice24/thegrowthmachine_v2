/*
 * Copy and figures for the "Data, systems & AI" section (ContextIntelligence),
 * one screen per growth discipline. All figures are illustrative.
 *
 * Each screen asks one question and answers it twice: `alone` is the chart
 * one system gives you and the conclusion it invites; `context` is the same
 * question with the other sources joined in, and the real story. Then three
 * key figures and the action.
 *
 * Captions name the measure and time window; figures say when they are
 * estimated or modelled. Insights state what the joined-up data shows, and
 * the action carries any test needed before committing.
 *
 * Panels: { sources: [[icon, name]], caption, chart, read }. In `read`,
 * *asterisks* mark the words picked out in red.
 *
 * Charts ({ type, ... }), drawn by ContextIntelligence:
 *   vbars   bars: [[label, value, shown]]
 *   hbars   rows: [[label, value, shown, hot?]]
 *   diverge rows: [[label, value, shown]], negatives in red
 *   slope   left, right (column titles), items: [[name, leftShown, rightShown]]
 *           in left-hand order, rightOrder: names, hot: name
 *   lines   x: labels, series: [{ points, tone, label, range? }], range,
 *           markers?: [{ at, label }], gap?: [i, j] (shade between series)
 *   funnel  stages: [[label, shown, width 0-1]], rates: [shown], leak: index
 *   bubble  x, y (axis titles), points: [[name, x, y, size, hot?, rank?]]
 *           (x, y and size 0-1; rank shows before the name)
 *   share   rows: [[label, [[segment, percent]]]], hot: segment
 */

export const INTEL = {
  b2b: {
    lede: 'Your CRM knows one thing, finance another, marketing another. We connect them, so you can see what is really happening, and what to do next.',
    active: 3,
    screens: [
      {
        icon: 'target',
        name: 'Brand & Demand',
        short: 'Brand',
        question: 'Which message actually creates revenue?',
        alone: {
          sources: [['mega', 'Marketing']],
          caption: 'Leads by campaign message, last 12 months',
          chart: { type: 'vbars', bars: [['Efficiency', 420, '420'], ['Cost saving', 260, '260'], ['Compliance', 180, '180'], ['Innovation', 140, '140']] },
          read: 'Efficiency is your strongest message.',
        },
        context: {
          sources: [['mega', 'Marketing'], ['crm', 'CRM'], ['db', 'Finance']],
          caption: 'The same messages: leads against revenue won, 12 months',
          chart: {
            type: 'slope', left: 'Leads', right: 'Revenue won',
            items: [['Efficiency', '420', '£0.9M'], ['Cost saving', '260', '£1.9M'], ['Compliance', '180', '£0.7M'], ['Innovation', '140', '£0.3M']],
            rightOrder: ['Cost saving', 'Efficiency', 'Compliance', 'Innovation'], hot: 'Cost saving',
          },
          read: 'Your best lead-generating message *isn’t your best revenue-generating one*.',
        },
        figures: [['34%', 'cost-saving win rate, vs 12%'], ['+£1.0M', 'revenue from the same leads'], ['−22%', 'cost per won deal']],
        action: 'Lead with cost saving, and prove it over the next two campaigns.',
      },
      {
        icon: 'funnel',
        name: 'Sales & Conversion',
        short: 'Sales',
        question: 'Where do deals really stall?',
        alone: {
          sources: [['crm', 'CRM']],
          caption: 'Pipeline by stage, last 12 months',
          chart: {
            type: 'funnel',
            stages: [['Leads', '1,000', 1], ['Qualified', '420', 0.72], ['Demo', '260', 0.56], ['Proposal', '150', 0.42], ['Won', '38', 0.2]],
            rates: ['42%', '62%', '58%', '25%'], leak: 3,
          },
          read: 'Your proposals aren’t good enough.',
        },
        context: {
          sources: [['crm', 'CRM'], ['mail', 'Email'], ['cal', 'Calendar']],
          caption: 'Close rate from proposal, by buyers engaged on the deal, last 12 months',
          chart: { type: 'hbars', rows: [['1 contact', 9, '9%', true], ['2 contacts', 27, '27%'], ['Buyer mapped', 41, '41%']] },
          read: '*High-value deals reach proposal* without the right buyers engaged.',
        },
        figures: [['64%', 'of proposals have one contact'], ['41%', 'close rate with the economic buyer mapped'], ['£1.4M', 'stuck at proposal']],
        action: 'For complex deals, map the economic buyer before proposal, and review aged deals weekly.',
      },
      {
        icon: 'compass',
        name: 'GTM & Market Expansion',
        short: 'GTM',
        question: 'Which market should we enter next?',
        alone: {
          sources: [['crm', 'CRM']],
          caption: 'Open pipeline by segment, today',
          chart: { type: 'hbars', rows: [['Manufacturing', 2.1, '£2.1M'], ['Retail', 1.5, '£1.5M'], ['Logistics', 0.9, '£0.9M'], ['Healthcare', 0.3, '£0.3M']] },
          read: 'Double down on manufacturing.',
        },
        context: {
          sources: [['crm', 'CRM'], ['db', 'Finance'], ['globe', 'Market data']],
          caption: 'Right to win against customer value, last 2 years; size is reachable market, numbers are our ranking',
          chart: {
            type: 'bubble', x: 'Right to win', y: 'Customer value',
            points: [['Retail', 0.14, 0.2, 0.55, false, 4], ['Manufacturing', 0.4, 0.3, 0.95, false, 3], ['Logistics', 0.64, 0.52, 0.45, false, 2], ['Healthcare', 0.86, 0.82, 0.7, true, 1]],
          },
          read: 'Your biggest pipeline isn’t your best market. *Healthcare ranks first.*',
        },
        figures: [['3x', 'customer value in healthcare'], ['−40%', 'shorter sales cycle'], ['6%', 'of pipeline today']],
        action: 'Run a 90-day healthcare entry sprint: one profile, named accounts. Scale on signed demand.',
      },
      {
        icon: 'bars',
        name: 'Commercial Model',
        short: 'Commercial',
        question: 'Which revenue is actually profitable?',
        alone: {
          sources: [['crm', 'CRM']],
          caption: 'Revenue by customer, last 12 months',
          chart: {
            type: 'hbars',
            rows: [['Global Retail', 850, '£850K'], ['HealthTech Co', 620, '£620K'], ['Apex Mfg', 540, '£540K'], ['Northwind', 480, '£480K'], ['Brightline', 410, '£410K'], ['Public Sector', 380, '£380K'], ['Vertex Labs', 300, '£300K'], ['Orbit Media', 260, '£260K']],
          },
          read: 'Your biggest accounts are your best.',
        },
        context: {
          sources: [['crm', 'CRM'], ['db', 'Finance'], ['tag', 'Discounts'], ['truck', 'Delivery']],
          caption: 'Contribution by customer, after discounts and delivery, 12 months',
          chart: {
            type: 'diverge',
            rows: [['Global Retail', 190, '£190K'], ['HealthTech Co', -60, '−£60K'], ['Apex Mfg', 140, '£140K'], ['Northwind', 120, '£120K'], ['Brightline', -45, '−£45K'], ['Public Sector', -80, '−£80K'], ['Vertex Labs', 95, '£95K'], ['Orbit Media', 70, '£70K']],
          },
          read: 'Three major accounts are *buying growth at the expense of your margin*.',
        },
        figures: [['£420K', 'a year lost to discounts over 15%'], ['−£185K', 'contribution on three big accounts'], ['+6pts', 'modelled EBITDA, if fixed']],
        action: 'Reprice or rescope the three accounts at renewal, and give sales value-based discount rules.',
      },
      {
        icon: 'chip',
        name: 'Data, Systems & AI',
        short: 'Data & AI',
        question: 'What will we actually land this quarter?',
        alone: {
          sources: [['crm', 'CRM']],
          caption: 'Bookings this quarter: the CRM forecast against target',
          chart: {
            type: 'lines', x: ['Jul', '', '', '', 'Aug', '', '', '', 'Sep', '', '', '', ''], range: [0, 4.6],
            series: [
              { points: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], tone: 'dash', label: '£4.0M target' },
              { points: [0.3, 0.6, 1, 1.4, 1.8, 2.2, 2.6, 3, 3.4, 3.7, 3.9, 4, 4.1], tone: 'muted', label: '£4.1M' },
            ],
          },
          read: 'You’re on track to hit target.',
        },
        context: {
          sources: [['crm', 'CRM'], ['clock', 'Deal history'], ['db', 'Finance']],
          caption: 'Weighted by how your deals really convert, and their age',
          chart: {
            type: 'lines', x: ['Jul', '', '', '', 'Aug', '', '', '', 'Sep', '', '', '', ''], range: [0, 4.6], gap: [1, 2],
            series: [
              { points: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], tone: 'dash', label: '£4.0M target' },
              { points: [0.3, 0.6, 1, 1.4, 1.8, 2.2, 2.6, 3, 3.4, 3.7, 3.9, 4, 4.1], tone: 'light', label: '£4.1M' },
              { points: [0.3, 0.6, 1, 1.4, 1.8, 2.2, 2.6, 3, 3.1, 3.25, 3.4, 3.5, 3.6], tone: 'hot', label: '£3.6M' },
            ],
          },
          read: 'The forecast looks healthy because CRM stages are *hiding £500K of deal risk*.',
        },
        figures: [['£3.6M', 'likely landing, vs £4.1M in the CRM'], ['6 deals', 'at risk: 3 no next meeting, 2 slipped, 1 no buyer'], ['±4%', 'past forecast accuracy']],
        action: 'Re-qualify the six at-risk deals this week, and run a weekly evidence-based forecast.',
      },
      {
        icon: 'people',
        name: 'Team & Operating Model',
        short: 'Team',
        question: 'Do we have the capacity to hit the plan?',
        alone: {
          sources: [['people', 'HR']],
          caption: 'Sales headcount against plan, this year',
          chart: {
            type: 'lines', x: ['Jan', '', '', 'Apr', '', '', 'Jul', '', '', 'Oct', '', 'Dec'], range: [4, 13],
            series: [
              { points: [8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 12, 12], tone: 'dash', label: 'Plan' },
              { points: [8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 12, 12], tone: 'muted', label: '12 reps' },
            ],
          },
          read: 'You’re fully staffed for the plan.',
        },
        context: {
          sources: [['people', 'HR'], ['crm', 'CRM'], ['clock', 'Ramp-up']],
          caption: 'Productive capacity, after ramp-up and attainment',
          chart: {
            type: 'lines', x: ['Jan', '', '', 'Apr', '', '', 'Jul', '', '', 'Oct', '', 'Dec'], range: [4, 13], gap: [1, 2],
            series: [
              { points: [8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 12, 12], tone: 'dash', label: 'Plan' },
              { points: [8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 12, 12], tone: 'light', label: '12 hired' },
              { points: [6, 6.3, 6.6, 7, 7.2, 7.5, 7.8, 8, 8.1, 8.3, 8.5, 8.6], tone: 'hot', label: '8.6 productive' },
            ],
          },
          read: 'You’re hiring to a headcount plan, *not a revenue-capacity plan*.',
        },
        figures: [['8.6', 'productive reps, of 12 hired'], ['5 mo', 'to ramp a new rep'], ['£1.1M', 'estimated Q3 shortfall']],
        action: 'Cover Q3 with territory moves, deal focus and coaching. Hire now for Q4 and Q1.',
      },
    ],
  },

  ecommerce: {
    lede: 'Your store knows one thing, your ad platforms another, finance another. We connect them, so you can see what is really happening, and what to do next.',
    active: 1,
    screens: [
      {
        icon: 'target',
        name: 'Brand & Demand',
        short: 'Brand',
        question: 'Are we creating demand, or just converting it?',
        alone: {
          sources: [['mega', 'Ad platforms']],
          caption: 'Return on ad spend by campaign type, as platforms report it, 12 months',
          chart: { type: 'vbars', bars: [['Retargeting', 5.1, '5.1x'], ['New customers', 3.4, '3.4x'], ['Brand-building', 0.6, '0.6x']] },
          read: 'Brand spend doesn’t pay back.',
        },
        context: {
          sources: [['mega', 'Ad platforms'], ['search', 'Search'], ['store', 'Store']],
          caption: 'Branded search and new-customer acquisition cost, 12 months',
          chart: {
            type: 'lines', x: ['Jan', '', '', 'Apr', '', '', 'Jul', '', '', 'Oct', '', 'Dec'],
            series: [
              { points: [100, 104, 108, 113, 118, 121, 125, 128, 131, 134, 136, 138], tone: 'light', label: 'Search +38%', range: [80, 145] },
              { points: [31, 30.6, 30, 29.4, 28.5, 27.8, 27, 26.4, 25.6, 25, 24.5, 24], tone: 'hot', label: 'New CAC £24', range: [20, 36] },
            ],
          },
          read: 'Brand spend grew. So did branded search, and *new customers got cheaper*.',
        },
        figures: [['+38%', 'branded search, 12 months'], ['£24', 'new-customer CAC, down from £31'], ['0.6x', 'all last-click credits brand with']],
        action: 'Hold brand spend, and run a lift test to prove its share.',
      },
      {
        icon: 'compass',
        name: 'Acquisition & Discoverability',
        short: 'Acquisition',
        question: 'Where should the next £1 go?',
        alone: {
          sources: [['mega', 'Ad platforms']],
          caption: 'Return on ad spend, as each platform reports it',
          chart: { type: 'vbars', bars: [['Google', 4.2, '4.2x'], ['Affiliates', 3.1, '3.1x'], ['Meta', 2.1, '2.1x'], ['TikTok', 1.8, '1.8x']] },
          read: 'Google is your best channel.',
        },
        context: {
          sources: [['mega', 'Ad platforms'], ['store', 'Store'], ['mail', 'CRM'], ['db', 'Finance']],
          caption: 'Contribution per £1 spent, from new customers’ first 12 months',
          chart: {
            type: 'slope', left: 'Platform says', right: '12-month contribution',
            items: [['Google', '4.2x', '£2.10'], ['Affiliates', '3.1x', '£1.20'], ['Meta', '2.1x', '£3.80'], ['TikTok', '1.8x', '£2.60']],
            rightOrder: ['Meta', 'TikTok', 'Google', 'Affiliates'], hot: 'Meta',
          },
          read: 'Over a year, *Meta customers are worth 1.8x* Google’s.',
        },
        figures: [['£260K', 'modelled extra contribution, shifting 20%'], ['−14%', 'modelled blended acquisition cost'], ['£180K', 'a year bidding on your own brand name']],
        action: 'Test moving 20% of Google spend to Meta. Scale if contribution holds.',
      },
      {
        icon: 'cart',
        name: 'Conversion & Onsite',
        short: 'Conversion',
        question: 'Which frictions are costing us orders?',
        alone: {
          sources: [['chart', 'Analytics']],
          caption: 'Site conversion rate, 12 months',
          chart: {
            type: 'lines', x: ['Jan', '', '', 'Apr', '', '', 'Jul', '', '', 'Oct', '', 'Dec'], range: [2, 3.2],
            series: [{ points: [2.9, 2.9, 2.95, 2.9, 2.85, 2.9, 2.8, 2.75, 2.7, 2.6, 2.55, 2.5], tone: 'muted', label: '2.5%' }],
          },
          read: 'The whole site is converting worse.',
        },
        context: {
          sources: [['chart', 'Analytics'], ['store', 'Store'], ['box', 'Stock']],
          caption: 'Change in conversion vs last year, by device and checkout step',
          chart: {
            type: 'diverge',
            rows: [['Desktop', 0.1, '+0.1pts'], ['Mobile: browsing', -0.05, '−0.05pts'], ['Mobile: shipping cost', -0.6, '−0.6pts'], ['Mobile: hero out of stock', -0.35, '−0.35pts']],
          },
          read: 'The drop is *mobile checkout and one stock-out*, not the traffic.',
        },
        figures: [['38%', 'of mobile shoppers leave at the shipping step'], ['£310K', 'estimated gross profit at stake a year'], ['11 days', 'hero product out of stock']],
        action: 'Test showing shipping earlier, and fix the hero product’s reorder.',
      },
      {
        icon: 'loop',
        name: 'Retention & LTV',
        short: 'Retention',
        question: 'Which first purchases create the most valuable customers?',
        alone: {
          sources: [['store', 'Store']],
          caption: 'Repeat purchase rate, 12 months',
          chart: {
            type: 'lines', x: ['Jan', '', '', 'Apr', '', '', 'Jul', '', '', 'Oct', '', 'Dec'], range: [15, 32],
            series: [{ points: [22, 22.5, 23, 23.6, 24, 24.8, 25.5, 26, 26.6, 27, 27.5, 28], tone: 'muted', label: '28%' }],
          },
          read: 'Retention is improving.',
        },
        context: {
          sources: [['store', 'Store'], ['mail', 'CRM'], ['tag', 'Discounts']],
          caption: 'Share of each cohort still buying, by first order, months 0 to 12',
          chart: {
            type: 'lines', x: ['0', '', '', '3', '', '', '6', '', '', '9', '', '', '12 mo'], range: [0, 100],
            series: [
              { points: [100, 30, 21, 17, 15, 13, 12, 11, 11, 10, 10, 10, 9], tone: 'muted', label: '30% off: 9%' },
              { points: [100, 48, 40, 36, 33, 31, 29, 28, 27, 26, 25, 25, 24], tone: 'light', label: 'Full price: 24%' },
              { points: [100, 62, 55, 51, 48, 46, 44, 43, 42, 41, 40, 40, 39], tone: 'hot', label: 'Starter Kit: 39%' },
            ],
          },
          read: 'The cheapest first order *brings in the least valuable customers*.',
        },
        figures: [['2.3x', '12-month contribution, Starter Kit vs 30%-off buyers'], ['39% vs 9%', 'still buying at 12 months'], ['£410K', 'estimated repeat contribution missed a year']],
        action: 'Lead acquisition with the kit, and test it against the discount.',
      },
      {
        icon: 'bars',
        name: 'Margin & Channels',
        short: 'Margin',
        question: 'Which channels make money, and which consume it?',
        alone: {
          sources: [['store', 'Sales']],
          caption: 'Revenue growth by channel, year on year',
          chart: { type: 'vbars', bars: [['Amazon', 64, '+64%'], ['DTC', 18, '+18%'], ['Retail', 9, '+9%']] },
          read: 'Amazon is your star channel.',
        },
        context: {
          sources: [['store', 'Sales'], ['cart', 'Amazon'], ['truck', 'Fulfilment'], ['db', 'Finance']],
          caption: 'Share of revenue against share of contribution, after fees, fulfilment, returns and ads',
          chart: {
            type: 'share', hot: 'Amazon',
            rows: [['Revenue', [['DTC', 52], ['Amazon', 31], ['Retail', 17]]], ['Contribution', [['DTC', 78], ['Amazon', 9], ['Retail', 13]]]],
          },
          read: 'Amazon is *31% of revenue, but 9% of contribution*.',
        },
        figures: [['£340K', 'Amazon fees, returns and ads, 12 months'], ['12', 'Amazon lines losing money after costs'], ['+£190K', 'modelled, if repriced or cut']],
        action: 'Review the 12 lines: test price, fulfilment and ads before exiting any.',
      },
      {
        icon: 'chip',
        name: 'Data, Systems & AI',
        short: 'Data & AI',
        question: 'Will best-sellers be in stock when demand peaks?',
        alone: {
          sources: [['box', 'Stock']],
          caption: 'Days of stock left at current sales, by product',
          chart: { type: 'hbars', rows: [['Glow Serum', 38, '38 days'], ['Starter Kit', 52, '52 days'], ['Night Repair Oil', 71, '71 days'], ['Hydra Cleanser', 84, '84 days'], ['Body Balm', 96, '96 days']] },
          read: 'Stock looks healthy.',
        },
        context: {
          sources: [['box', 'Stock'], ['store', 'Store'], ['cal', 'Promos'], ['truck', 'Suppliers']],
          caption: 'Glow Serum forecast stock, with promos, incoming orders and lead time',
          chart: {
            type: 'lines', x: ['Oct', '', '', '', 'Nov', '', '', '', 'Dec'], range: [0, 4200],
            markers: [{ at: 7, label: 'Forecast sell-out' }, { at: 8, label: 'Black Friday' }],
            series: [
              { points: [3800, 3550, 3300, 3050, 2800, 2550, 2300, 2050, 1800], tone: 'muted', label: 'Usual demand' },
              { points: [3800, 3450, 3050, 2600, 2050, 1300, 550, 0, 0], tone: 'hot', label: 'With promos' },
            ],
          },
          read: 'Glow Serum is forecast to *sell out before Black Friday*.',
        },
        figures: [['14 Nov', 'last order date, at a 6-week lead time'], ['£180K', 'estimated sales at risk'], ['£90K', 'cash tied up in slow stock']],
        action: 'Order Glow Serum by 14 Nov, or expedite. Clear slow lines to fund it.',
      },
    ],
  },
};
