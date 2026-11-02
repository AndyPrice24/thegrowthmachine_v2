/* ============================================================
   Discovery question bank — the single source for:
   - the founder intake form (Google Form generator + leave-behind PDF)
   - the Studio's interview capture forms (core + level + department sets)
   Every question is tagged to a discovery CRITERION, so answers are stored
   against what we are trying to establish, not as loose notes.
   ============================================================ */
const CRITERIA = [
  { id: 'strategy', label: 'Goals & strategy', feeds: 'Business profile' },
  { id: 'revenue', label: 'Revenue', feeds: 'Finance · Segments' },
  { id: 'customers', label: 'Customers & delivery', feeds: 'Segments · Processes' },
  { id: 'market', label: 'Market & competition', feeds: 'Competitors' },
  { id: 'cost', label: 'Cost base', feeds: 'Finance · Tools' },
  { id: 'people', label: 'People & structure', feeds: 'People & org' },
  { id: 'process', label: 'Processes & workload', feeds: 'Processes' },
  { id: 'tech', label: 'Technology & systems', feeds: 'Tools' },
  { id: 'data', label: 'Data & reporting', feeds: 'Tools · Findings' },
  { id: 'decisions', label: 'Decisions & governance', feeds: 'Findings' },
  { id: 'risk', label: 'Risk & dependencies', feeds: 'Findings' },
  { id: 'pain', label: 'Pain points & ideas', feeds: 'Interviews · Recommendations' }
];

const DEPT_TYPES = [
  ['leadership', 'Leadership / admin'], ['sales', 'Sales'], ['cs', 'Customer success / support'],
  ['ops', 'Operations / data'], ['finance', 'Finance'], ['tech', 'Product / engineering'], ['marketing', 'Marketing']
];

/* ---------- Founder intake (sent as a form, also printed in the leave-behind) ---------- */
const INTAKE_SECTIONS = [
  { id: 'about', title: 'About you', intro: 'So we know who answered.', questions: [
    { id: 'i_name', crit: 'people', type: 'short', q: 'Your name', required: true },
    { id: 'i_role', crit: 'people', type: 'short', q: 'Your role', required: true }
  ] },
  { id: 'goals', title: '1. Goals & success', intro: 'What this engagement must achieve for you.', questions: [
    { id: 'i_success', p: 1, crit: 'strategy', type: 'long', q: 'By 1 February 2027, what would make this engagement a clear success for you?' },
    { id: 'i_priorities', p: 1, crit: 'strategy', type: 'long', q: 'What are the three things you most want fixed or improved?' },
    { id: 'i_offlimits', p: 1, crit: 'strategy', type: 'long', q: 'Is anything off-limits, sensitive or already decided (people, products, suppliers, systems)?' },
    { id: 'i_plans', crit: 'strategy', type: 'long', q: 'What plans are already in motion that we should know about (hires, exits, new products, funding, system changes)?' }
  ] },
  { id: 'revenue', title: '2. Revenue & customers', intro: 'Where the money comes from, and where it is strongest and weakest.', questions: [
    { id: 'i_streams', crit: 'revenue', type: 'long', q: 'What are your main revenue streams, and roughly what share of revenue does each bring?' },
    { id: 'i_strong', p: 1, crit: 'revenue', type: 'long', q: 'Where is revenue strongest (products, client types, markets, channels)? Why?' },
    { id: 'i_weak', p: 1, crit: 'revenue', type: 'long', q: 'Where is revenue weakest or declining? Why do you think that is?' },
    { id: 'i_markets', crit: 'revenue', type: 'checkbox', q: 'Which markets do you sell into?', options: ['South Africa', 'India', 'Rest of Africa', 'Middle East', 'Europe / UK', 'United States'], other: true },
    { id: 'i_market_split', crit: 'revenue', type: 'short', q: 'Roughly what share of revenue comes from each market?' },
    { id: 'i_concentration', p: 1, crit: 'customers', type: 'long', q: 'How many active clients do you have, and roughly what share of revenue do your top five bring in?' },
    { id: 'i_pricing', crit: 'revenue', type: 'long', q: 'How do you price (per location, per month, set-up fees, reseller margins, discounts)?' },
    { id: 'i_churn', crit: 'customers', type: 'long', q: 'Which clients leave, and why? Roughly how many left in the last 12 months?' }
  ] },
  { id: 'competition', title: '2b. Competition', intro: 'Who you compete with, and where you win and lose.', questions: [
    { id: 'i_comp_who', crit: 'market', type: 'long', q: 'Who are your main competitors, locally and internationally?' },
    { id: 'i_comp_win', p: 1, crit: 'market', type: 'long', q: 'Where do you win against competitors, and where do you lose? Why?' },
    { id: 'i_comp_threat', crit: 'market', type: 'long', q: 'Which competitor worries you most, and why?' },
    { id: 'i_comp_price', crit: 'market', type: 'long', q: 'How does your pricing compare with theirs?' }
  ] },
  { id: 'cost', title: '3. Cost base', intro: 'This helps us agree the cost baseline the savings target is measured against.', questions: [
    { id: 'i_costs_top', p: 1, crit: 'cost', type: 'long', q: 'Apart from salaries, what are your five biggest monthly costs?' },
    { id: 'i_costs_high', crit: 'cost', type: 'long', q: 'Which costs feel too high or poor value?' },
    { id: 'i_renewals', p: 1, crit: 'cost', type: 'long', q: 'Which contracts or subscriptions renew in the next six months, and what are their notice periods?', help: 'Notice periods decide how quickly savings can land.' },
    { id: 'i_cost_changes', crit: 'cost', type: 'long', q: 'Have costs changed significantly in the last 12 months? What drove it?' }
  ] },
  { id: 'people', title: '4. People & structure', questions: [
    { id: 'i_headcount', p: 1, crit: 'people', type: 'short', q: 'How many people work in the business: employees, contractors and outsourced?' },
    { id: 'i_structure', p: 1, crit: 'people', type: 'long', q: 'How is the team organised, and who leads each area?' },
    { id: 'i_unclear', crit: 'people', type: 'long', q: 'Where are roles unclear, duplicated or overloaded?' },
    { id: 'i_keyperson', crit: 'risk', type: 'long', q: 'If one person left tomorrow, whose absence would hurt most? Why?' },
    { id: 'i_hiring', crit: 'people', type: 'long', q: 'What roles are open, or what hires or exits are planned?' }
  ] },
  { id: 'tech', title: '5. Technology & data', intro: 'Which systems you run, where they are hosted and where your data lives.', questions: [
    { id: 'i_crm', p: 1, crit: 'tech', type: 'choice', q: 'Which CRM do you use?', options: ['HubSpot', 'Salesforce', 'Pipedrive', 'Zoho', 'Spreadsheets / none'], other: true },
    { id: 'i_accounting', p: 1, crit: 'tech', type: 'choice', q: 'Which accounting system do you use?', options: ['Xero', 'Sage', 'QuickBooks', 'Pastel'], other: true },
    { id: 'i_workspace', crit: 'tech', type: 'choice', q: 'Which email and office suite does the company use?', options: ['Google Workspace', 'Microsoft 365', 'Both'], other: true },
    { id: 'i_comms', crit: 'tech', type: 'checkbox', q: 'How does the team communicate day to day?', options: ['Slack', 'Microsoft Teams', 'WhatsApp', 'Email'], other: true },
    { id: 'i_support', crit: 'tech', type: 'short', q: 'What do you use for client support or tickets?' },
    { id: 'i_pm', crit: 'tech', type: 'short', q: 'What project or task management tools do you use?' },
    { id: 'i_platform_hosting', p: 1, crit: 'tech', type: 'choice', q: 'Where is the Location Bank platform hosted?', options: ['Amazon Web Services (AWS)', 'Microsoft Azure', 'Google Cloud', 'Our own / local servers', 'A third-party hosting provider', 'Not sure'], other: true },
    { id: 'i_local', crit: 'tech', type: 'choice', q: 'Do you run any servers, databases or file storage on your own premises?', options: ['Yes', 'No', 'Not sure'] },
    { id: 'i_local_detail', crit: 'tech', type: 'long', q: 'If yes, what runs locally, and why?' },
    { id: 'i_files', crit: 'data', type: 'choice', q: 'Where are company files mainly stored?', options: ['Google Drive', 'SharePoint / OneDrive', 'Dropbox', 'Local or network drive', 'A mix'], other: true },
    { id: 'i_integrations', crit: 'data', type: 'long', q: 'Which systems share data automatically? Where is data re-typed or copied by hand?' },
    { id: 'i_sysadmin', crit: 'tech', type: 'long', q: 'Who manages your systems, user access and licences? Do you use an external IT provider?' },
    { id: 'i_subscriptions', crit: 'cost', type: 'short', q: 'Is there a list of all software subscriptions and their costs? Who holds it?' }
  ] },
  { id: 'reporting', title: '6. Reporting & decisions', questions: [
    { id: 'i_numbers', crit: 'data', type: 'long', q: 'Which numbers do you look at weekly or monthly to run the business?' },
    { id: 'i_numbers_source', crit: 'data', type: 'long', q: 'Where do those numbers come from, who prepares them and how long does it take?' },
    { id: 'i_trust', crit: 'data', type: 'scale', q: 'How much do you trust the accuracy of your current financial and operational reporting?', low: 'Not at all', high: 'Completely' },
    { id: 'i_decisions', crit: 'decisions', type: 'long', q: 'Which decisions wait on you (the founders) that you would rather did not?' },
    { id: 'i_cadence', crit: 'decisions', type: 'long', q: 'What regular meetings run the business (who attends, how often)?' }
  ] },
  { id: 'pain', title: '7. Frustrations & ideas', questions: [
    { id: 'i_frustrations', p: 1, crit: 'pain', type: 'long', q: 'What are your three biggest operational frustrations right now?' },
    { id: 'i_fix', crit: 'pain', type: 'long', q: 'If you could fix one thing tomorrow, what would it be?' },
    { id: 'i_tried', crit: 'pain', type: 'long', q: 'What has been tried before that did not work? Why not?' }
  ] },
  { id: 'practical', title: '8. Getting started', questions: [
    { id: 'i_managers', p: 1, crit: 'people', type: 'long', q: 'Which managers should Andrew interview first (name and role)?' },
    { id: 'i_staff_comms', p: 1, crit: 'decisions', type: 'choice', q: 'How should the team hear about this engagement?', options: ['The founders announce it before interviews start (recommended)', 'Andrew introduces it at a team meeting', 'Both', "Let's discuss"] },
    { id: 'i_access', crit: 'tech', type: 'short', q: 'Who can grant read-only access to systems (CRM, accounting, helpdesk)?' },
    { id: 'i_other', crit: 'pain', type: 'long', q: 'Is there anything else you think I should know?' }
  ] }
];

/* ---------- Staff pre-interview questionnaire (Google Form, max ~10 minutes, named) ---------- */
const STAFF_SECTIONS = [
  { id: 'about', title: 'About you', intro: 'About 10 minutes. Short answers are perfect. This helps Andrew make your interview quicker and more useful.', questions: [
    { id: 'st_name', crit: 'people', type: 'short', q: 'Your name', required: true },
    { id: 'st_role', crit: 'people', type: 'short', q: 'Your role and team', required: true },
    { id: 'st_tenure', crit: 'people', type: 'choice', q: 'How long have you been in this role?', options: ['Less than 6 months', '6–12 months', '1–3 years', 'More than 3 years'] }
  ] },
  { id: 'work', title: 'Your work', questions: [
    { id: 'st_main', crit: 'process', type: 'long', q: 'What are the 3–5 main things you do in a typical week?' },
    { id: 'st_split', crit: 'process', type: 'short', q: 'Roughly what % of your week goes on: core work / admin & reporting / meetings / fixing problems?', help: 'e.g. 50 / 20 / 15 / 15. A rough guess is fine.' },
    { id: 'st_tools', crit: 'tech', type: 'short', q: 'Which systems or tools do you use every day?' },
    { id: 'st_copy', crit: 'data', type: 'long', q: 'Where do you re-type, copy or check data by hand between systems or spreadsheets?' },
    { id: 'st_depend', crit: 'process', type: 'short', q: 'Who do you depend on most to get your work done, and where do things get stuck?' },
    { id: 'st_workload', crit: 'people', type: 'scale', q: 'How is your workload most weeks?', low: 'Too light', high: 'Too heavy' }
  ] },
  { id: 'improve', title: 'What would help', questions: [
    { id: 'st_frustration', crit: 'pain', type: 'long', q: 'What is the biggest frustration or time-waster in your work?' },
    { id: 'st_hour', crit: 'pain', type: 'long', q: 'What one change would save you an hour a week?' },
    { id: 'st_private', crit: 'pain', type: 'long', q: 'Anything you would rather raise with Andrew in person? (Optional: just a topic is fine.)' }
  ] }
];

/* ---------- Interview bank (Studio capture forms) ----------
   level: 'all' | 'founder' | 'manager' | 'staff'   dept: 'all' | one of DEPT_TYPES ids */
const INTERVIEW_QUESTIONS = [
  // Core — asked of everyone, so answers compare across the company
  { id: 'c_role', level: 'all', dept: 'all', crit: 'people', q: 'In your own words, what is your role and what are you responsible for?' },
  { id: 'c_week', level: 'all', dept: 'all', crit: 'process', q: 'Walk me through a typical week. Where does your time actually go?' },
  { id: 'c_time_split', level: 'all', dept: 'all', crit: 'process', q: 'Roughly what % of your time goes on core work, admin/reporting, meetings and fixing problems?' },
  { id: 'c_tools', level: 'all', dept: 'all', crit: 'tech', q: 'Which tools and systems do you use daily? Which help you most, and which get in your way?' },
  { id: 'c_data_in', level: 'all', dept: 'all', crit: 'data', q: 'Where does the information you need come from? Do you ever re-type or copy data between systems?' },
  { id: 'c_data_out', level: 'all', dept: 'all', crit: 'data', q: 'What do you produce or hand on to others (reports, files, updates)? Who uses it?' },
  { id: 'c_handoffs', level: 'all', dept: 'all', crit: 'process', q: 'Who do you depend on, and who depends on you? Where do things get stuck between people or teams?' },
  { id: 'c_pain', level: 'all', dept: 'all', crit: 'pain', q: 'What are the three biggest frustrations in your work?' },
  { id: 'c_waste', level: 'all', dept: 'all', crit: 'process', q: 'What do you do that feels repetitive, duplicated or pointless?' },
  { id: 'c_decisions', level: 'all', dept: 'all', crit: 'decisions', q: 'What do you need approval for, and how long does approval usually take?' },
  { id: 'c_customer', level: 'all', dept: 'all', crit: 'customers', q: 'What do clients complain about or praise most, from what you see?' },
  { id: 'c_fix', level: 'all', dept: 'all', crit: 'pain', q: 'If you ran the company for a week, what would you change first?' },
  { id: 'c_anything', level: 'all', dept: 'all', crit: 'pain', q: "Is there anything I haven't asked that I should know?" },
  // Founder
  { id: 'f_vision', level: 'founder', dept: 'all', crit: 'strategy', q: 'Where do you want the business to be in 12–24 months?' },
  { id: 'f_bottleneck', level: 'founder', dept: 'all', crit: 'decisions', q: 'Where are you personally the bottleneck?' },
  { id: 'f_trust', level: 'founder', dept: 'all', crit: 'data', q: 'Which numbers do you trust least, and why?' },
  { id: 'f_comp', level: 'founder', dept: 'all', crit: 'market', q: 'If a well-funded competitor copied you tomorrow, what would protect you?' },
  { id: 'f_people', level: 'founder', dept: 'all', crit: 'people', q: 'Which roles or people are critical, and where do you have doubts?' },
  // Manager
  { id: 'm_team', level: 'manager', dept: 'all', crit: 'people', q: 'Who is in your team, what does each person do, and how is the work split?' },
  { id: 'm_capacity', level: 'manager', dept: 'all', crit: 'people', q: 'Is your team over- or under-capacity? Where?' },
  { id: 'm_kpis', level: 'manager', dept: 'all', crit: 'data', q: 'Which numbers or KPIs do you manage to? How do you get them, and how long does that take?' },
  { id: 'm_budget', level: 'manager', dept: 'all', crit: 'cost', q: 'What does your area spend money on (tools, suppliers, contractors)? What is poor value?' },
  { id: 'm_processes', level: 'manager', dept: 'all', crit: 'process', q: 'What are the 3–5 main processes your team runs? Which is most painful? (We will map one in detail.)' },
  { id: 'm_keyperson', level: 'manager', dept: 'all', crit: 'risk', q: 'Which tasks does only one person know how to do?' },
  { id: 'm_redesign', level: 'manager', dept: 'all', crit: 'people', q: 'If you could redesign your team from scratch, what would it look like?' },
  // Staff
  { id: 's_clarity', level: 'staff', dept: 'all', crit: 'people', q: 'Is it clear what is expected of you and how you are measured?' },
  { id: 's_training', level: 'staff', dept: 'all', crit: 'people', q: 'Do you have the training and tools you need to do the job well?' },
  { id: 's_hour', level: 'staff', dept: 'all', crit: 'pain', q: 'What one small change would save you an hour a week?' },
  // Department-specific
  { id: 'd_sales_pipeline', level: 'all', dept: 'sales', crit: 'process', q: 'How do leads come in and move to a signed deal? Where do deals stall?' },
  { id: 'd_sales_proposal', level: 'all', dept: 'sales', crit: 'process', q: 'How long does a proposal or quote take to produce? Who approves pricing?' },
  { id: 'd_sales_handover', level: 'all', dept: 'sales', crit: 'customers', q: 'What happens when a deal is signed? How is it handed over?' },
  { id: 'd_sales_crm', level: 'all', dept: 'sales', crit: 'data', q: 'How accurate is the CRM? What lives outside it?' },
  { id: 'd_sales_comp', level: 'all', dept: 'sales', crit: 'market', q: 'Which competitors come up in deals? Why do we win or lose against them?' },
  { id: 'd_cs_onboarding', level: 'all', dept: 'cs', crit: 'process', q: 'Walk me through onboarding a new client, step by step. How long does it take?' },
  { id: 'd_cs_reporting', level: 'all', dept: 'cs', crit: 'customers', q: 'What reporting do clients receive, and how is it produced?' },
  { id: 'd_cs_churn', level: 'all', dept: 'cs', crit: 'customers', q: 'Why do clients leave? What early warning signs do you see?' },
  { id: 'd_cs_comp', level: 'all', dept: 'cs', crit: 'market', q: 'Which competitors do clients mention, or leave us for? What do they say those competitors do better?' },
  { id: 'd_cs_tickets', level: 'all', dept: 'cs', crit: 'process', q: 'What are the most common support requests? Could clients self-serve any of them?' },
  { id: 'd_ops_volume', level: 'all', dept: 'ops', crit: 'process', q: 'How many locations or listings are processed per week or month? How is the work assigned?' },
  { id: 'd_ops_manual', level: 'all', dept: 'ops', crit: 'process', q: 'Which steps are manual (data cleaning, uploads, verification, corrections)?' },
  { id: 'd_ops_errors', level: 'all', dept: 'ops', crit: 'risk', q: 'Where do errors happen, and how are they caught?' },
  { id: 'd_ops_sla', level: 'all', dept: 'ops', crit: 'customers', q: 'What turnaround targets do you have? Are they met?' },
  { id: 'd_fin_billing', level: 'all', dept: 'finance', crit: 'process', q: 'How are invoices produced? How does billing know what to charge?' },
  { id: 'd_fin_collections', level: 'all', dept: 'finance', crit: 'revenue', q: 'How are overdue payments chased? What are debtor days?' },
  { id: 'd_fin_close', level: 'all', dept: 'finance', crit: 'process', q: 'How long does month-end take? What is manual?' },
  { id: 'd_fin_spend', level: 'all', dept: 'finance', crit: 'cost', q: 'How are purchases and subscriptions approved and tracked?' },
  { id: 'd_tech_hosting', level: 'all', dept: 'tech', crit: 'tech', q: 'Where is the platform hosted, and what do hosting and infrastructure cost per month?' },
  { id: 'd_tech_internal', level: 'all', dept: 'tech', crit: 'process', q: 'How much dev time goes on internal requests and manual fixes, compared with product work?' },
  { id: 'd_tech_fragile', level: 'all', dept: 'tech', crit: 'risk', q: 'Which systems or integrations are fragile, or depend on one person?' },
  { id: 'd_tech_data', level: 'all', dept: 'tech', crit: 'data', q: 'Where does client and operational data live? Who has access? How is it backed up?' },
  { id: 'd_mkt_channels', level: 'all', dept: 'marketing', crit: 'revenue', q: 'Which channels bring leads, and at what cost?' },
  { id: 'd_mkt_tools', level: 'all', dept: 'marketing', crit: 'cost', q: 'Which marketing tools do you pay for? Which are actually used?' },
  { id: 'd_mkt_comp', level: 'all', dept: 'marketing', crit: 'market', q: 'How do we position against competitors? Which of their messages or channels are working?' },
  { id: 'd_mkt_measure', level: 'all', dept: 'marketing', crit: 'data', q: 'How do you measure what works?' },
  { id: 'd_lead_admin', level: 'all', dept: 'leadership', crit: 'process', q: 'How are HR, leave and payroll administered?' },
  { id: 'd_lead_suppliers', level: 'all', dept: 'leadership', crit: 'cost', q: 'Which suppliers and contracts do you manage? When do they renew?' }
];

/* Information & documents requested from the client (seeds the "Waiting on client" tracker) */
const DOCUMENT_REQUESTS = [
  { id: 'doc_org', crit: 'people', item: 'Org chart or staff list: name, role, department, manager, start date, employment type', dueDays: 4 },
  { id: 'doc_payroll', crit: 'people', item: 'Payroll cost per person or role (founder-only, via secure folder)', dueDays: 4 },
  { id: 'doc_pl', crit: 'cost', item: 'Management accounts / P&L: last 12 months, plus the current budget', dueDays: 4 },
  { id: 'doc_ledger', crit: 'cost', item: 'Detailed expense listing for the last 6–12 months (recurring costs)', dueDays: 7 },
  { id: 'doc_software', crit: 'cost', item: 'Software & subscriptions list: cost, seats, owner, renewal date (or card/bank statements)', dueDays: 7 },
  { id: 'doc_contracts', crit: 'cost', item: 'Key supplier contracts with notice periods and renewal dates', dueDays: 7 },
  { id: 'doc_clients', crit: 'revenue', item: 'Client list: monthly revenue, segment, number of locations, start date; plus churned clients (12 months)', dueDays: 7 },
  { id: 'doc_pricing', crit: 'revenue', item: 'Pricing sheet / rate card and standard contract terms', dueDays: 7 },
  { id: 'doc_reports', crit: 'data', item: 'Current management reports or dashboards (examples)', dueDays: 7 },
  { id: 'doc_sops', crit: 'process', item: 'Any process documents, SOPs or onboarding checklists', dueDays: 10 },
  { id: 'doc_jds', crit: 'people', item: 'Job or role descriptions, where they exist', dueDays: 10 },
  { id: 'doc_access', crit: 'tech', item: 'Read-only system access as agreed (CRM, accounting, helpdesk)', dueDays: 10 }
];

/* Standard 3-month engagement plan (matches the TGM EIR Statement of Work structure) */
function standardPlan(startISO) {
  const d = (n) => { const x = new Date(startISO + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const m = (k, n) => { const x = new Date(startISO + 'T00:00:00Z'); x.setUTCMonth(x.getUTCMonth() + k); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  return [
    { id: 'ph0', name: 'Kick-off & alignment', month: 1, start: d(0), end: d(4), plannedDays: 1, status: 'In progress', deliverables: 'Agreed goals, point of contact, communication plan, information request issued' },
    { id: 'ph1', name: 'Foundations: information, systems & cost baseline', month: 1, start: d(0), end: d(11), plannedDays: 3, status: 'Not started', deliverables: 'Information received, systems & data map, draft cost baseline' },
    { id: 'ph2', name: 'Listening: manager & staff interviews', month: 1, start: d(7), end: d(18), plannedDays: 4, status: 'Not started', deliverables: 'All interviews complete, key processes mapped' },
    { id: 'ph3', name: 'Diagnose & prioritise', month: 1, start: d(14), end: m(1, -1), plannedDays: 2, status: 'Not started', deliverables: 'Agreed cost baseline, opportunity register with monthly impact, roadmap, Month-1 readout' },
    { id: 'ph4', name: 'Design & execute', month: 2, start: m(1, 0), end: m(2, -1), plannedDays: 10, status: 'Not started', deliverables: 'Approved initiatives implemented, tools/automations, structure recommendations' },
    { id: 'ph5', name: 'Embed & measure', month: 3, start: m(2, 0), end: m(3, -1), plannedDays: 10, status: 'Not started', deliverables: 'Adoption & training, handover, savings report (identified/approved/realised), next-step roadmap' }
  ];
}
