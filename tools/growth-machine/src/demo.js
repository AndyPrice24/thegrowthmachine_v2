/* Fictional sample engagement so every view has something to show.
   NOT Location Bank data. Delete it once you have a real client loaded. */
function demoEngagement() {
  const e = blankEngagement('Demo Co (fictional sample)');
  e.id = 'eng_demo';
  Object.assign(e.client, {
    sector: 'B2B SaaS', subSector: 'Location data & reputation software', hq: 'Cape Town, South Africa', website: 'example.com',
    founded: '2017', stage: 'Scale-up, founder-led', businessModel: 'Annual SaaS subscriptions sold to multi-location brands, plus onboarding fees. Agencies resell.',
    revenueModel: 'Per-location monthly subscription (annual contracts), once-off onboarding fee, reseller margin share.',
    description: 'FICTIONAL SAMPLE DATA to demonstrate the tool. Names, numbers and people are invented.',
    goals: 'Grow ARR 40% without growing headcount at the same rate. Free the founders from operations.',
    constraints: 'Cash conservative. Two founders still approve pricing. Dev team is small.'
  });
  e.departments = [
    { id: 'd_exec', name: 'Leadership', headId: 'p1' }, { id: 'd_sales', name: 'Sales', headId: 'p3' },
    { id: 'd_cs', name: 'Customer Success', headId: 'p7' }, { id: 'd_ops', name: 'Data Operations', headId: 'p10' },
    { id: 'd_prod', name: 'Product & Engineering', headId: 'p13' }, { id: 'd_fin', name: 'Finance & Admin', headId: 'p16' },
    { id: 'd_mkt', name: 'Marketing', headId: 'p18' }
  ];
  const P = (id, name, title, dep, mgr, cost, extra) => Object.assign({ id, name, title, departmentId: dep, managerId: mgr, annualCost: cost, fte: 1, employmentType: 'Full-time', location: 'Cape Town' }, extra || {});
  e.people = [
    P('p1', 'Sam Rivers', 'Co-founder & CEO', 'd_exec', '', 1800000),
    P('p2', 'Alex Okafor', 'Co-founder & COO', 'd_exec', 'p1', 1500000),
    P('p3', 'Priya Naidoo', 'Head of Sales', 'd_sales', 'p1', 1100000),
    P('p4', 'Jordan Smit', 'Account Executive', 'd_sales', 'p3', 620000),
    P('p5', 'Lebo Dlamini', 'Account Executive', 'd_sales', 'p3', 600000, { location: 'Johannesburg' }),
    P('p6', 'Chris van Wyk', 'Sales Development Rep', 'd_sales', 'p3', 360000),
    P('p7', 'Thandi Mokoena', 'Head of Customer Success', 'd_cs', 'p2', 750000),
    P('p8', 'Ravi Pillay', 'Customer Success Manager', 'd_cs', 'p7', 540000, { location: 'Pune' }),
    P('p9', 'Megan Botha', 'Support Agent', 'd_cs', 'p7', 300000),
    P('p10', 'Kabelo Molefe', 'Data Ops Lead', 'd_ops', 'p2', 520000),
    P('p11', 'Ayesha Khan', 'Data Ops Analyst', 'd_ops', 'p10', 330000),
    P('p12', 'Ben Fourie', 'Data Ops Analyst', 'd_ops', 'p10', 330000),
    P('p13', 'Nina Joubert', 'CTO', 'd_prod', 'p1', 1600000),
    P('p14', 'Dev Patel', 'Senior Developer', 'd_prod', 'p13', 900000),
    P('p15', 'Zoe Adams', 'Developer', 'd_prod', 'p13', 720000, { employmentType: 'Contractor' }),
    P('p16', 'Grace Nkosi', 'Finance Manager', 'd_fin', 'p2', 650000),
    P('p17', 'Tom Kruger', 'Bookkeeper', 'd_fin', 'p16', 280000, { fte: 0.6, employmentType: 'Part-time' }),
    P('p18', 'Lisa Marais', 'Marketing Manager', 'd_mkt', 'p1', 600000)
  ];
  const T = (id, name, category, monthlyCost, seats, activeUsers, departmentIds, purpose) => ({ id, name, category, monthlyCost, seats, activeUsers, departmentIds, purpose });
  e.tools = [
    T('t1', 'HubSpot Sales Hub', 'CRM', 18000, 8, 5, 'd_sales,d_cs', 'Pipeline, deals, contacts'),
    T('t2', 'Pipedrive', 'CRM', 3500, 4, 2, 'd_sales', 'Legacy pipeline still used by two reps'),
    T('t3', 'Zendesk', 'Support desk', 4200, 4, 3, 'd_cs', 'Client support tickets'),
    T('t4', 'Google Workspace', 'Productivity', 6300, 18, 18, 'd_exec,d_sales,d_cs,d_ops,d_prod,d_fin,d_mkt', 'Email, docs, sheets, slides'),
    T('t5', 'Slack', 'Communication', 2700, 18, 17, 'd_exec,d_sales,d_cs,d_ops,d_prod,d_fin,d_mkt', 'Internal chat'),
    T('t6', 'Xero', 'Accounting', 1400, 2, 2, 'd_fin', 'Invoicing, ledger'),
    T('t7', 'Spreadsheets (manual)', 'Reporting', 0, 0, 0, 'd_cs,d_ops,d_fin', 'Client reports, data cleaning, reconciliations'),
    T('t8', 'Jira', 'Project management', 2100, 6, 4, 'd_prod', 'Engineering backlog'),
    T('t9', 'Asana', 'Project management', 2400, 10, 3, 'd_cs,d_ops', 'Onboarding task lists'),
    T('t11', 'Mailchimp', 'Email marketing', 1900, 2, 1, 'd_mkt', 'Newsletters'),
    T('t12', 'Internal admin panel', 'Platform', 0, 0, 0, 'd_ops,d_cs', 'Uploading and managing client locations')
  ];
  const S = (id, name, actorId, toolId, durationMins, extra) => Object.assign({ id, name, actorId, toolId, durationMins, automated: false }, extra || {});
  e.processes = [
    { id: 'pr1', name: 'Client onboarding', departmentId: 'd_ops', ownerId: 'p10', frequency: 'Per new client', runsPerMonth: 6,
      inputs: 'Signed contract + client location list', outputs: 'All client locations live and verified', steps: [
        S('s1', 'Sales hands over signed deal', 'p4', 't1', 30, { painPoint: 'Handover notes incomplete; CS re-asks the client' }),
        S('s2', 'Collect location data from client', 'p7', 't7', 120, { painPoint: 'Clients send data in inconsistent formats' }),
        S('s3', 'Clean & validate location data', 'p11', 't7', 240, { painPoint: 'Re-keying by hand, frequent errors' }),
        S('s4', 'Upload locations to platform', 'p12', 't12', 90),
        S('s5', 'Verify listings are live', 'p11', 't12', 60),
        S('s6', 'Kick-off email & training', 'p7', 't4', 60)
      ] },
    { id: 'pr2', name: 'Monthly client reporting', departmentId: 'd_cs', ownerId: 'p7', frequency: 'Monthly per client', runsPerMonth: 40,
      inputs: 'Platform performance stats', outputs: 'PDF report emailed to each client', steps: [
        S('s1', 'Export stats from platform', 'p8', 't12', 20),
        S('s2', 'Build report in spreadsheet', 'p8', 't7', 60, { painPoint: 'Same report rebuilt by hand every month' }),
        S('s3', 'Write commentary', 'p7', 't4', 20),
        S('s4', 'Email report to client', 'p8', 't4', 10)
      ] },
    { id: 'pr3', name: 'Invoicing & collections', departmentId: 'd_fin', ownerId: 'p16', frequency: 'Monthly', runsPerMonth: 1,
      inputs: 'Active client list + contracts', outputs: 'Invoices issued, cash collected', steps: [
        S('s1', 'Pull active clients from CRM', 'p17', 't1', 120),
        S('s2', 'Reconcile CRM against contracts', 'p17', 't7', 240, { painPoint: 'CRM and contracts disagree on location counts' }),
        S('s3', 'Raise invoices', 'p17', 't6', 180),
        S('s4', 'Chase overdue accounts', 'p16', 't4', 300, { painPoint: 'No automated dunning; debtor days creeping up' })
      ] },
    { id: 'pr4', name: 'Lead to proposal', departmentId: 'd_sales', ownerId: 'p3', frequency: 'Per qualified lead', runsPerMonth: 30,
      inputs: 'Inbound or outbound lead', outputs: 'Proposal sent', steps: [
        S('s1', 'Lead captured from website', '', 't1', 0, { automated: true }),
        S('s2', 'Qualify lead', 'p6', 't1', 30),
        S('s3', 'Build proposal deck', 'p4', 't4', 90, { painPoint: 'Proposal built from scratch each time' }),
        S('s4', 'Pricing approval', 'p3', 't5', 20, { painPoint: 'Deals stall waiting for approval' }),
        S('s5', 'Send & follow up', 'p4', 't1', 30)
      ] }
  ];
  e.financePeriods = [
    { id: 'f1', label: 'Q4 2025', months: 3, revenue: 5800000, cogs: 820000, payroll: 3300000, tools: 140000, marketing: 320000, premises: 240000, other: 290000 },
    { id: 'f2', label: 'Q1 2026', months: 3, revenue: 6050000, cogs: 860000, payroll: 3350000, tools: 145000, marketing: 360000, premises: 240000, other: 270000 },
    { id: 'f3', label: 'Q2 2026', months: 3, revenue: 5950000, cogs: 850000, payroll: 3375000, tools: 140000, marketing: 300000, premises: 240000, other: 310000 },
    { id: 'f4', label: 'Q3 2026', months: 3, revenue: 6400000, cogs: 900000, payroll: 3375000, tools: 145000, marketing: 380000, premises: 250000, other: 280000 }
  ];
  e.segments = [
    { id: 'g1', name: 'Retail chains', customers: 22, annualRevenue: 14000000, churnPct: 6, acquisitionChannel: 'Outbound + referrals' },
    { id: 'g2', name: 'Franchise groups', customers: 12, annualRevenue: 6000000, churnPct: 9, acquisitionChannel: 'Outbound' },
    { id: 'g3', name: 'Agencies (resellers)', customers: 8, annualRevenue: 3500000, churnPct: 12, acquisitionChannel: 'Partnerships' },
    { id: 'g4', name: 'SMB direct', customers: 30, annualRevenue: 1500000, churnPct: 22, acquisitionChannel: 'Inbound' }
  ];
  e.markets = [
    { id: 'm1', name: 'South Africa', region: 'Africa', revenueShare: 78 },
    { id: 'm2', name: 'India', region: 'Asia', revenueShare: 15 },
    { id: 'm3', name: 'Rest of Africa', region: 'Africa', revenueShare: 7 }
  ];
  e.topClients = [
    { id: 'c1', name: 'Client A (retail)', segmentId: 'g1', annualRevenue: 4200000 },
    { id: 'c2', name: 'Client B (retail)', segmentId: 'g1', annualRevenue: 2100000 },
    { id: 'c3', name: 'Client C (franchise)', segmentId: 'g2', annualRevenue: 1600000 },
    { id: 'c4', name: 'Client D (agency)', segmentId: 'g3', annualRevenue: 1200000 }
  ];
  e.interviews = [
    { id: 'i1', personId: 'p7', date: '2026-10-06', interviewer: 'TGM', summary: 'CS spends most of the month on reporting and onboarding admin rather than account growth.',
      themes: 'manual reporting, onboarding data quality, handover', painPoints: 'Monthly reports by hand\nBad client data at onboarding\nHandover from sales is thin', ideas: 'Self-serve client dashboard', quotes: '"We are report builders, not customer success."' },
    { id: 'i2', personId: 'p11', date: '2026-10-07', interviewer: 'TGM', summary: 'Data cleaning is repetitive and error-prone. Same fixes every onboarding.',
      themes: 'onboarding data quality, manual data entry', painPoints: 'Re-keying addresses\nNo validation rules', ideas: 'Upload template with validation', quotes: '' },
    { id: 'i3', personId: 'p17', date: '2026-10-07', interviewer: 'TGM', summary: 'Invoicing depends on reconciling CRM to contracts by hand.',
      themes: 'manual data entry, data mismatch', painPoints: 'CRM location counts wrong\nChasing payments manually', ideas: 'Billing driven from platform location count', quotes: '' },
    { id: 'i4', personId: 'p4', date: '2026-10-08', interviewer: 'TGM', summary: 'Two CRMs in use; proposals built from scratch; approvals slow.',
      themes: 'tool overlap, approvals, handover', painPoints: 'Pipedrive vs HubSpot confusion\nWaiting on pricing approval', ideas: 'Pricing guardrails', quotes: '"I lose deals waiting for a yes."' },
    { id: 'i5', personId: 'p2', date: '2026-10-09', interviewer: 'TGM', summary: 'COO is the escalation point for everything operational.',
      themes: 'founder dependency, manual reporting', painPoints: 'No single view of the business', ideas: 'Weekly founder dashboard', quotes: '' }
  ];
  e.findings = [
    { id: 'fd1', title: 'Customer Success is mostly report production', area: 'Process', severity: 'high', evidence: 'About 60 hrs/month of CS time goes on building reports by hand (process map + interviews i1, i5).' },
    { id: 'fd2', title: 'No single source of truth for location counts', area: 'Data', severity: 'high', evidence: 'CRM, contracts and platform disagree, and billing reconciles them by hand (i3).' }
  ];
  e.recommendations = [
    { id: 'r1', title: 'Build a validated onboarding intake portal', type: 'Build', horizon: '0-3 months', effort: 3, risk: 2, confidence: 4, oneOffCost: 180000, otherAnnualSaving: 0, revenueUplift: 0, status: 'Proposed',
      description: 'Clients upload locations through a template with validation rules, replacing email and spreadsheet collection and manual cleaning.',
      ops: [
        { op: 'addTool', tool: { id: 't_new1', name: 'Onboarding intake portal (custom)', category: 'Platform', monthlyCost: 1500, departmentIds: 'd_ops,d_cs', purpose: 'Validated client data intake' } },
        { op: 'updateStep', processId: 'pr1', stepId: 's2', changes: { durationMins: 20, toolId: 't_new1', painPoint: '' } },
        { op: 'updateStep', processId: 'pr1', stepId: 's3', changes: { durationMins: 30, toolId: 't_new1', automated: false, painPoint: '' } }
      ] },
    { id: 'r2', title: 'Consolidate CRM onto HubSpot; retire Pipedrive', type: 'Tool', horizon: '0-3 months', effort: 1, risk: 1, confidence: 5, oneOffCost: 15000, otherAnnualSaving: 0, revenueUplift: 0, status: 'Proposed',
      description: 'Move the two remaining reps to HubSpot and cut unused HubSpot seats.',
      ops: [{ op: 'removeTool', toolId: 't2' }, { op: 'updateTool', toolId: 't1', changes: { seats: 6, monthlyCost: 13500 } }] },
    { id: 'r3', title: 'Retire Asana; run onboarding tasks in HubSpot', type: 'Tool', horizon: '0-3 months', effort: 1, risk: 1, confidence: 4, oneOffCost: 5000, otherAnnualSaving: 0, revenueUplift: 0, status: 'Proposed',
      description: 'Asana has 3 active users of 10 seats. Use HubSpot onboarding pipelines instead.', ops: [{ op: 'removeTool', toolId: 't9' }] },
    { id: 'r4', title: 'Self-serve client reporting dashboard', type: 'Build', horizon: '3-6 months', effort: 3, risk: 2, confidence: 4, oneOffCost: 250000, otherAnnualSaving: 0, revenueUplift: 250000, status: 'Proposed',
      description: 'Clients see live performance in a portal. CS writes a short quarterly commentary instead of building monthly reports.',
      ops: [
        { op: 'addTool', tool: { id: 't_new2', name: 'Client reporting portal (custom)', category: 'Reporting', monthlyCost: 2500, departmentIds: 'd_cs', purpose: 'Live client dashboards' } },
        { op: 'updateStep', processId: 'pr2', stepId: 's1', changes: { automated: true, durationMins: 0, actorId: '', toolId: 't_new2' } },
        { op: 'removeStep', processId: 'pr2', stepId: 's2' },
        { op: 'updateStep', processId: 'pr2', stepId: 's4', changes: { automated: true, durationMins: 0, actorId: '', toolId: 't_new2' } }
      ] },
    { id: 'r5', title: 'Restructure Data Ops after automation', type: 'People', horizon: '6-12 months', effort: 3, risk: 4, confidence: 3, oneOffCost: 60000, otherAnnualSaving: 0, revenueUplift: 0, status: 'Proposed',
      description: 'Once intake is automated, Data Ops needs one analyst, not two. Redeploy or exit one role. Only after r1 is proven.',
      ops: [{ op: 'removePerson', personId: 'p12' }, { op: 'updateStep', processId: 'pr1', stepId: 's4', changes: { actorId: 'p11' } }] },
    { id: 'r6', title: 'Automate billing from platform location counts', type: 'Process', horizon: '3-6 months', effort: 2, risk: 2, confidence: 4, oneOffCost: 40000, otherAnnualSaving: 30000, revenueUplift: 0, status: 'Proposed',
      description: 'Bill from the platform location count with automated reminders. Removes the reconciliation step and manual chasing.',
      ops: [
        { op: 'removeStep', processId: 'pr3', stepId: 's1' },
        { op: 'updateStep', processId: 'pr3', stepId: 's2', changes: { durationMins: 30, painPoint: '' } },
        { op: 'updateStep', processId: 'pr3', stepId: 's4', changes: { durationMins: 60, painPoint: '' } },
        { op: 'addTool', tool: { id: 't_new3', name: 'Billing automation', category: 'Billing', monthlyCost: 3000, departmentIds: 'd_fin', purpose: 'Usage billing + dunning' } }
      ] },
    { id: 'r7', title: 'Proposal templates + pricing guardrails', type: 'Process', horizon: '0-3 months', effort: 1, risk: 1, confidence: 4, oneOffCost: 10000, otherAnnualSaving: 0, revenueUplift: 300000, status: 'Proposed',
      description: 'Standard proposal templates, plus pre-approved discount bands so reps only escalate exceptions.',
      ops: [{ op: 'updateStep', processId: 'pr4', stepId: 's3', changes: { durationMins: 25, painPoint: '' } }, { op: 'removeStep', processId: 'pr4', stepId: 's4' }] }
  ];
  e.scenarios = [
    { id: 'sc1', name: 'A · Quick wins', description: 'Tool consolidation and sales templates. Low risk, fast.', recommendationIds: ['r2', 'r3', 'r7'] },
    { id: 'sc2', name: 'B · Automation programme', description: 'Quick wins plus the three automation builds. No headcount change.', recommendationIds: ['r1', 'r2', 'r3', 'r4', 'r6', 'r7'] },
    { id: 'sc3', name: 'C · Automation + restructure', description: 'Everything in B plus the Data Ops restructure.', recommendationIds: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'] }
  ];
  // Competitor sample (fictional)
  e.client.pricePoint = 450;
  e.competitors = [
    { id: 'co1', name: 'Competitor A (global platform)', type: 'Direct', threat: 'High', hq: 'USA', markets: 'Global incl. SA', segments: 'Enterprise retail', offering: 'Listings, reviews, social and reporting suite', pricingModel: 'Per location, annual', pricePoint: 520, strengths: 'Brand, breadth, integrations', weaknesses: 'No local support; USD pricing', whereWeWin: 'Local support, ZAR pricing, onboarding speed', whereWeLose: 'Large multinationals with global contracts', sources: 'https://example.com/pricing', lastReviewed: addDaysISO(todayISO(), -10) },
    { id: 'co2', name: 'Competitor B (local agency)', type: 'Indirect', threat: 'Medium', hq: 'Johannesburg', markets: 'South Africa', segments: 'Franchise groups, SMB', offering: 'Managed local SEO service', pricingModel: 'Monthly retainer', pricePoint: 300, strengths: 'Hands-on service, relationships', weaknesses: 'Manual, limited reporting', whereWeWin: 'Scale and reporting', whereWeLose: 'Small franchise groups wanting a done-for-you service', sources: 'https://example.org', lastReviewed: addDaysISO(todayISO(), -10) },
    { id: 'co3', name: 'Competitor C (budget SaaS)', type: 'Direct', threat: 'Low', hq: 'Europe', markets: 'Global', segments: 'SMB', offering: 'Self-serve listings sync', pricingModel: 'Per location, monthly', pricePoint: 180, strengths: 'Cheap, self-serve', weaknesses: 'Thin features, no reviews module', whereWeWin: 'Anything multi-location', whereWeLose: 'Price-only SMB buyers', sources: '', lastReviewed: '' }
  ];
  e.capabilities = [
    { id: 'cap1', name: 'Listings sync across directories', importance: 'High', client: 'Strong', scores: { co1: 'Strong', co2: 'Partial', co3: 'Strong' } },
    { id: 'cap2', name: 'Review management & responses', importance: 'High', client: 'Strong', scores: { co1: 'Strong', co2: 'Partial', co3: 'None' } },
    { id: 'cap3', name: 'Client reporting dashboard', importance: 'Medium', client: 'Partial', scores: { co1: 'Strong', co2: 'None', co3: 'Partial' } },
    { id: 'cap4', name: 'Local onboarding & support', importance: 'Medium', client: 'Strong', scores: { co1: 'None', co2: 'Strong', co3: 'None' } },
    { id: 'cap5', name: 'API / integrations', importance: 'Low', client: 'Partial', scores: { co1: 'Strong', co2: 'None', co3: 'Partial' } }
  ];
  e.intel = [
    { id: 'it1', competitorId: 'co1', topic: 'Pricing', note: 'Lists per-location pricing in USD on its website; annual contracts only.', sourceType: 'Online research', source: 'https://example.com/pricing', date: addDaysISO(todayISO(), -10) },
    { id: 'it2', competitorId: 'co1', topic: 'Customers', note: 'Two lost deals in Q3 went to them via a global head-office contract.', sourceType: 'Staff', source: 'Sales interview', date: addDaysISO(todayISO(), -8) },
    { id: 'it3', competitorId: 'co2', topic: 'Marketing', note: 'Runs a free local-SEO audit offer to franchise owners.', sourceType: 'Founder', source: 'Founder session', date: addDaysISO(todayISO(), -12) }
  ];
  e.usps = [
    { id: 'us1', claim: 'Local onboarding and support in SA time zones', strength: 'Unique', proof: 'Only Competitor B offers local support, and it lacks the platform.', competitorsWithIt: 'Competitor B (partly)' },
    { id: 'us2', claim: 'Most accurate listings data', strength: 'Claimed only', proof: 'No third-party evidence yet.', competitorsWithIt: '' }
  ];
  e.client.positioning = 'For multi-location brands in Africa, Demo Co is the location platform that keeps every store findable and reviewed, with local support, unlike global tools priced in dollars.';
  e.opportunities = [
    { id: 'op1', title: 'Free location-health audit as a lead magnet', area: 'Marketing', description: 'Counter Competitor B\'s audit offer with an automated, data-backed version.', basedOn: 'Intel: Competitor B audit offer', impact: 'High', effort: 'Low', status: 'Proposed' },
    { id: 'op2', title: 'ZAR-priced enterprise bundle', area: 'Pricing', description: 'Lead with ZAR pricing against Competitor A at renewal time.', basedOn: 'Competitor A pricing (USD)', impact: 'Medium', effort: 'Low', status: 'Idea' }
  ];
  // Engagement tracking sample: started three weeks ago
  const start = addDaysISO(todayISO(), -20);
  e.engagement = Object.assign(blankEngagementBlock(), { contact: 'Alex Okafor', contactRole: 'COO, decision-maker', start, daysTotal: 30, daysPerMonth: 10, targetMonthly: 60000 });
  seedStandardPlan(e);
  const g = e.engagement;
  g.phases[0].status = 'Done'; g.phases[1].status = 'Done'; g.phases[2].status = 'In progress';
  g.requests.forEach((r, i) => { if (i < 7) r.receivedDate = addDaysISO(r.dueDate, i === 2 ? 3 : 0); });
  g.activities.forEach((a, i) => { if (i < 6) { a.status = 'Done'; a.doneDate = a.due; } else if (i === 6 || i === 7) a.status = 'In progress'; });
  [[0, 'ph0', '1', 'Kick-off meeting and set-up'], [2, 'ph1', '1', 'Finance review, cost lines, subscriptions'], [5, 'ph1', '1', 'Systems & data map'], [8, 'ph1', '0.5', 'Draft cost baseline'],
   [9, 'ph2', '1', 'Manager interviews (4)'], [13, 'ph2', '1', 'Team interviews (6)'], [16, 'ph2', '0.5', 'Process mapping: onboarding']].forEach(([d, ph, days, act]) => g.timeLog.push({ id: uid('tl'), date: addDaysISO(start, d), phaseId: ph, days, activity: act, notes: '' }));
  g.delays.push({ id: 'dl1', dateRaised: addDaysISO(start, 5), phaseId: 'ph1', cause: 'Client: information late', description: 'P&L and management accounts arrived 3 days after the agreed date.', daysImpact: 3, noticeDate: addDaysISO(start, 5), status: 'Resolved', resolution: 'Received; baseline work re-sequenced.' });
  g.delays.push({ id: 'dl2', dateRaised: addDaysISO(start, 15), phaseId: 'ph2', cause: 'Client: availability / cooperation', description: 'Two team interviews rescheduled twice (Sales).', daysImpact: 2, noticeDate: addDaysISO(start, 16), status: 'Open', resolution: 'Raised with point of contact; new slots requested.' });
  e.recommendations.forEach((r) => { if (r.id === 'r2') r.status = 'Realised'; if (r.id === 'r3' || r.id === 'r7') r.status = 'Approved'; });
  e.report = Object.assign(e.report, { title: 'Operational Diagnostic', preparedFor: 'Founders, Demo Co', scenarioId: 'sc2', processIds: ['pr1', 'pr2'],
    summary: 'Demo Co has strong product-market fit with retail chains. But growth is limited by manual operations: onboarding, reporting and billing are run by hand, and they absorb most of Customer Success and Data Ops capacity. We recommend a three-month automation programme that pays back within the year, before any structural change.',
    nextSteps: '1. Approve Scenario B.\n2. Scope the onboarding portal (2 weeks).\n3. Consolidate CRM this month.\n4. Review the Data Ops structure in Q2, once automation is live.' });
  return e;
}

/** A blank shell for the first live client. Only public facts are filled in; the rest comes from discovery. */
function locationBankShell() {
  const e = blankEngagement('Location Bank');
  e.id = 'eng_locationbank';
  Object.assign(e.client, { sector: 'B2B SaaS', subSector: 'Local search, listings & reputation management for multi-location brands', hq: 'South Africa',
    description: 'To be completed during discovery.' });
  e.report.title = 'Operational Diagnostic';
  e.report.preparedFor = 'Founders, Location Bank';
  return e;
}
