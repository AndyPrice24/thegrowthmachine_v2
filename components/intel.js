/*
 * Copy and figures for the "Data, systems & AI" section (ContextIntelligence),
 * one screen per growth discipline. All figures are illustrative.
 *
 * Each screen asks one question and answers it twice: `alone` is the chart
 * one system gives you and the conclusion it invites; `context` is the same
 * question with the other sources joined in, and the real story. Then three
 * key figures and the action.
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
 *   bubble  x, y (axis titles), points: [[name, x, y, size, hot?]] (all 0-1)
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
          caption: 'Leads by campaign message',
          chart: { type: 'vbars', bars: [['Efficiency', 420, '420'], ['Cost saving', 260, '260'], ['Compliance', 180, '180'], ['Innovation', 140, '140']] },
          read: 'Efficiency is your strongest message.',
        },
        context: {
          sources: [['mega', 'Marketing'], ['crm', 'CRM'], ['db', 'Finance']],
          caption: 'The same messages: leads against revenue won',
          chart: {
            type: 'slope', left: 'Leads', right: 'Revenue won',
            items: [['Efficiency', '420', '£0.9M'], ['Cost saving', '260', '£1.9M'], ['Compliance', '180', '£0.7M'], ['Innovation', '140', '£0.3M']],
            rightOrder: ['Cost saving', 'Efficiency', 'Compliance', 'Innovation'], hot: 'Cost saving',
          },
          read: '*Cost saving wins twice* the revenue.',
        },
        figures: [['34%', 'cost-saving win rate, vs 12%'], ['+£1.0M', 'revenue from the same leads'], ['−22%', 'cost per won deal']],
        action: 'Lead every campaign with cost saving.',
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
          caption: 'Close rate from proposal, by people engaged on the deal',
          chart: { type: 'hbars', rows: [['1 contact', 9, '9%', true], ['2 contacts', 27, '27%'], ['3+ contacts', 41, '41%']] },
          read: '*Single-contact deals* close at 9%.',
        },
        figures: [['64%', 'of deals have one contact'], ['41%', 'close rate with three or more'], ['£1.4M', 'stuck at proposal']],
        action: 'Require a second stakeholder before proposal.',
      },
      {
        icon: 'compass',
        name: 'GTM & Market Expansion',
        short: 'GTM',
        question: 'Which market should we enter next?',
        alone: {
          sources: [['crm', 'CRM']],
          caption: 'Pipeline by segment',
          chart: { type: 'hbars', rows: [['Manufacturing', 2.1, '£2.1M'], ['Retail', 1.5, '£1.5M'], ['Logistics', 0.9, '£0.9M'], ['Healthcare', 0.3, '£0.3M']] },
          read: 'Double down on manufacturing.',
        },
        context: {
          sources: [['crm', 'CRM'], ['db', 'Finance'], ['globe', 'Market data']],
          caption: 'Win rate against customer value; size is market size',
          chart: {
            type: 'bubble', x: 'Win rate', y: 'Customer value',
            points: [['Retail', 0.14, 0.2, 0.55], ['Manufacturing', 0.4, 0.3, 0.95], ['Logistics', 0.64, 0.52, 0.45], ['Healthcare', 0.86, 0.82, 0.7, true]],
          },
          read: '*Healthcare is your best market*, and you’re barely in it.',
        },
        figures: [['3x', 'customer value in healthcare'], ['−40%', 'shorter sales cycle'], ['6%', 'of pipeline today']],
        action: 'Build a healthcare route to market.',
      },
      {
        icon: 'bars',
        name: 'Commercial Model',
        short: 'Commercial',
        question: 'Which revenue is actually profitable?',
        alone: {
          sources: [['crm', 'CRM']],
          caption: 'Revenue by customer',
          chart: {
            type: 'hbars',
            rows: [['Global Retail', 850, '£850K'], ['HealthTech Co', 620, '£620K'], ['Apex Mfg', 540, '£540K'], ['Northwind', 480, '£480K'], ['Brightline', 410, '£410K'], ['Public Sector', 380, '£380K'], ['Vertex Labs', 300, '£300K'], ['Orbit Media', 260, '£260K']],
          },
          read: 'Your biggest accounts are your best.',
        },
        context: {
          sources: [['crm', 'CRM'], ['db', 'Finance'], ['tag', 'Discounts'], ['truck', 'Delivery']],
          caption: 'Profit by customer, after discounts and delivery',
          chart: {
            type: 'diverge',
            rows: [['Global Retail', 190, '£190K'], ['HealthTech Co', -60, '−£60K'], ['Apex Mfg', 140, '£140K'], ['Northwind', 120, '£120K'], ['Brightline', -45, '−£45K'], ['Public Sector', -80, '−£80K'], ['Vertex Labs', 95, '£95K'], ['Orbit Media', 70, '£70K']],
          },
          read: '*3 of your top 8* lose money.',
        },
        figures: [['£420K', 'lost to discounts over 15%'], ['−£185K', 'on three big accounts'], ['+6pts', 'EBITDA if fixed']],
        action: 'Cap discounts at 15%. Reprice three accounts.',
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
          read: '*£500K short*, held in six stale deals.',
        },
        figures: [['£3.6M', 'evidence-based forecast'], ['6', 'stale deals hold the gap'], ['±4%', 'forecast accuracy']],
        action: 'Re-qualify six deals this week.',
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
          read: 'You have *the capacity of 8.6 reps*, not 12.',
        },
        figures: [['8.6', 'productive reps'], ['5 mo', 'to ramp a new rep'], ['£1.1M', 'Q3 shortfall']],
        action: 'Hire two reps now, not in May.',
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
        question: 'Is brand spend making growth cheaper?',
        alone: {
          sources: [['mega', 'Ad platforms']],
          caption: 'Return on ad spend, by campaign type',
          chart: { type: 'vbars', bars: [['Retargeting', 5.1, '5.1x'], ['Performance', 3.4, '3.4x'], ['Brand', 0.6, '0.6x']] },
          read: 'Brand spend doesn’t pay back.',
        },
        context: {
          sources: [['mega', 'Ad platforms'], ['search', 'Search'], ['store', 'Store']],
          caption: 'Branded search and blended acquisition cost, 12 months',
          chart: {
            type: 'lines', x: ['Jan', '', '', 'Apr', '', '', 'Jul', '', '', 'Oct', '', 'Dec'],
            series: [
              { points: [100, 104, 108, 113, 118, 121, 125, 128, 131, 134, 136, 138], tone: 'light', label: 'Search +38%', range: [80, 145] },
              { points: [31, 30.6, 30, 29.4, 28.5, 27.8, 27, 26.4, 25.6, 25, 24.5, 24], tone: 'hot', label: 'CAC £24', range: [20, 36] },
            ],
          },
          read: 'Brand is making *every channel cheaper*.',
        },
        figures: [['−6%', 'CAC for each +10% branded search'], ['£24', 'blended CAC, down from £31'], ['+38%', 'branded search in 12 months']],
        action: 'Hold brand spend through Q4.',
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
          caption: 'Profit per £1 spent, over a customer’s first 12 months',
          chart: {
            type: 'slope', left: 'Platform says', right: '12-month profit',
            items: [['Google', '4.2x', '£2.10'], ['Affiliates', '3.1x', '£1.20'], ['Meta', '2.1x', '£3.80'], ['TikTok', '1.8x', '£2.60']],
            rightOrder: ['Meta', 'TikTok', 'Google', 'Affiliates'], hot: 'Meta',
          },
          read: '*Meta customers are worth 1.8x* Google’s.',
        },
        figures: [['£260K', 'more profit, moving 20%'], ['−14%', 'blended acquisition cost'], ['£180K', 'spent on your own brand name']],
        action: 'Move 20% of Google spend to Meta.',
      },
      {
        icon: 'cart',
        name: 'Conversion & Onsite',
        short: 'Conversion',
        question: 'What’s really hurting conversion?',
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
          caption: 'Change in conversion, split by device and step',
          chart: {
            type: 'diverge',
            rows: [['Desktop', 0.1, '+0.1pts'], ['Mobile: browsing', -0.05, '−0.05pts'], ['Mobile: shipping cost', -0.6, '−0.6pts'], ['Mobile: hero out of stock', -0.35, '−0.35pts']],
          },
          read: 'It’s *mobile checkout and one stock-out*.',
        },
        figures: [['38%', 'mobile drop at shipping cost'], ['£310K', 'a year at stake'], ['11 days', 'hero product out of stock']],
        action: 'Show shipping earlier. Fix the reorder.',
      },
      {
        icon: 'loop',
        name: 'Retention & LTV',
        short: 'Retention',
        question: 'Which customers are worth keeping?',
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
          caption: 'Customers still buying, by month and how they first bought',
          chart: {
            type: 'lines', x: ['0', '', '', '3', '', '', '6', '', '', '9', '', '', '12 mo'], range: [0, 100],
            series: [
              { points: [100, 30, 21, 17, 15, 13, 12, 11, 11, 10, 10, 10, 9], tone: 'muted', label: '30% off: 9%' },
              { points: [100, 48, 40, 36, 33, 31, 29, 28, 27, 26, 25, 25, 24], tone: 'light', label: 'Full price: 24%' },
              { points: [100, 62, 55, 51, 48, 46, 44, 43, 42, 41, 40, 40, 39], tone: 'hot', label: 'Starter Kit: 39%' },
            ],
          },
          read: '*Discount buyers churn twice as fast.*',
        },
        figures: [['2.3x', 'value of Starter Kit buyers'], ['2x', 'churn on 30%-off buyers'], ['£410K', 'a year in lost repeat orders']],
        action: 'Lead with the kit, not the discount.',
      },
      {
        icon: 'bars',
        name: 'Margin & Channels',
        short: 'Margin',
        question: 'Which channels really make money?',
        alone: {
          sources: [['store', 'Sales']],
          caption: 'Revenue growth by channel, year on year',
          chart: { type: 'vbars', bars: [['Amazon', 64, '+64%'], ['DTC', 18, '+18%'], ['Retail', 9, '+9%']] },
          read: 'Amazon is your star channel.',
        },
        context: {
          sources: [['store', 'Sales'], ['cart', 'Amazon'], ['truck', 'Fulfilment'], ['db', 'Finance']],
          caption: 'Share of revenue against share of profit',
          chart: {
            type: 'share', hot: 'Amazon',
            rows: [['Revenue', [['DTC', 52], ['Amazon', 31], ['Retail', 17]]], ['Profit', [['DTC', 78], ['Amazon', 9], ['Retail', 13]]]],
          },
          read: 'Amazon is *31% of revenue, 9% of profit*.',
        },
        figures: [['£340K', 'in fees, returns and ads'], ['12', 'lines losing money'], ['+£190K', 'from repricing them']],
        action: 'Reprice or cut 12 Amazon lines.',
      },
      {
        icon: 'chip',
        name: 'Data, Systems & AI',
        short: 'Data & AI',
        question: 'Will we have the right stock in time?',
        alone: {
          sources: [['box', 'Stock']],
          caption: 'Days of stock left, by product',
          chart: { type: 'hbars', rows: [['Glow Serum', 38, '38 days'], ['Starter Kit', 52, '52 days'], ['Night Repair Oil', 71, '71 days'], ['Hydra Cleanser', 84, '84 days'], ['Body Balm', 96, '96 days']] },
          read: 'Stock looks healthy.',
        },
        context: {
          sources: [['box', 'Stock'], ['store', 'Store'], ['cal', 'Promos'], ['truck', 'Suppliers']],
          caption: 'Glow Serum stock, with the promo calendar',
          chart: {
            type: 'lines', x: ['Oct', '', '', '', 'Nov', '', '', '', 'Dec'], range: [0, 4200],
            markers: [{ at: 7, label: 'Sells out' }, { at: 8, label: 'Black Friday' }],
            series: [
              { points: [3800, 3550, 3300, 3050, 2800, 2550, 2300, 2050, 1800], tone: 'muted', label: 'Usual demand' },
              { points: [3800, 3450, 3050, 2600, 2050, 1300, 550, 0, 0], tone: 'hot', label: 'With promos' },
            ],
          },
          read: 'Glow Serum *sells out before Black Friday*.',
        },
        figures: [['14 Nov', 'last day to reorder'], ['£180K', 'sales at risk'], ['£90K', 'cash in slow stock']],
        action: 'Reorder Glow Serum. Clear slow lines.',
      },
    ],
  },
};
