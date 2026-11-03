/* ============================================================
   Founder report — rendered from the engagement, exportable as PDF (print) or standalone HTML
   ============================================================ */
function renderReport(e) {
  const r = e.report, sec = r.sections, anon = !!r.anonymise;
  const scId = r.scenarioId || '';
  const cur = stateFor(e, 'current');
  const hasScenario = !!scId;
  const next = hasScenario ? stateFor(e, scId) : null;
  const base = metrics(cur); const rev = annualRevenue(e);
  const imp = hasScenario ? scenarioImpact(e, scId) : null;
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const scored = scoreRecommendations(e);
  const inScope = hasScenario ? scored.filter((x) => scenarioRecIds(e, scId).includes(x.rec.id)) : scored.filter((x) => x.rec.status !== 'Rejected');
  const ins = insights(e, fmtMoney, anon).filter((x) => x.severity !== 'low').slice(0, 8);
  const para = (t) => String(t || '').split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join('');
  let h = '';

  h += `<header class="rpt-cover"><div class="rpt-brand">THE <strong>GROWTH</strong> MACHINE</div>
    <h1>${esc(r.title || 'Operational Diagnostic')}</h1>
    <p class="rpt-client">${esc(e.client.name)}</p>
    <p class="rpt-meta">Prepared for ${esc(r.preparedFor || 'the founders')} · ${date} · Confidential</p></header>`;

  if (r.summary) h += `<section class="rpt-sec"><h2>Executive summary</h2>${para(r.summary)}
    ${imp ? `<div class="kpis">${kpi('Recommended scenario', esc(scenarioName(e, scId)))}${kpi('Annual cash saving', fmtMoney(imp.cashSaving))}${kpi('Revenue uplift', fmtMoney(imp.revenueUplift))}${kpi('One-off investment', fmtMoney(imp.oneOff))}${kpi('Payback', imp.paybackMonths == null ? '—' : imp.paybackMonths.toFixed(1) + ' months')}</div>` : ''}</section>`;

  if (sec.snapshot) h += `<section class="rpt-sec"><h2>Where the business is today</h2>
    <div class="kpis">${kpi('Run-rate revenue', fmtMoney(rev))}${kpi('Headcount', `${base.headcount}`)}${kpi('Annual payroll', fmtMoney(base.payroll))}${kpi('Payroll / revenue', rev ? pct(base.payroll / rev * 100) : '—')}${kpi('Tool spend / yr', fmtMoney(base.toolSpend))}${kpi('Mapped process hours / mo', hrs(base.procHours))}</div>
    <div class="rpt-2">
      <div><h3>People + tool cost by department</h3>${hbars(departmentScorecard(e, cur).map((d) => ({ label: d.dept.name, value: d.payroll + d.toolSpend, swatch: deptColor(e.departments, d.dept.id) })).sort((a, b) => b.value - a.value), { fmt: fmtMoney })}</div>
      <div><h3>Revenue by customer segment</h3>${hbars(e.segments.map((s) => ({ label: s.name, value: num(s.annualRevenue) })).sort((a, b) => b.value - a.value), { fmt: fmtMoney, color: 'var(--s2)' })}</div>
    </div></section>`;

  if (sec.competition && e.competitors.length) h += `<section class="rpt-sec rpt-break"><h2>Market & competition</h2>
    <table class="tbl"><thead><tr><th>Competitor</th><th>Threat</th><th>Pricing</th><th>Where ${esc(e.client.name)} wins</th><th>Where it loses</th></tr></thead><tbody>
    ${e.competitors.map((c) => `<tr><td><strong>${esc(c.name)}</strong><div class="muted small">${esc([c.type, c.markets].filter(Boolean).join(' · '))}</div></td><td>${esc(c.threat || '—')}</td><td class="small">${esc(c.pricingModel || '')}${num(c.pricePoint) ? ` · ~${esc(fmtMoney(num(c.pricePoint)))}/location/mo` : ''}</td><td class="small">${esc(c.whereWeWin || '—')}</td><td class="small">${esc(c.whereWeLose || '—')}</td></tr>`).join('')}</tbody></table>
    ${e.capabilities.length ? `<h3>Capability comparison</h3><div class="rpt-fig">${capabilityMatrix(e, { editable: false })}</div>` : ''}
    ${positioningMap(e).includes('<svg') ? `<h3>Positioning: price vs capability</h3>${positioningMap(e)}` : ''}
    ${e.client.positioning ? `<h3>Positioning</h3><p class="rpt-lead">${esc(e.client.positioning)}</p>` : ''}
    ${e.usps.length ? `<h3>USPs tested against competitors</h3><table class="tbl"><thead><tr><th>Claim</th><th>Versus competitors</th><th>Evidence</th></tr></thead><tbody>${e.usps.map((u) => `<tr><td>${esc(u.claim)}</td><td>${esc(u.strength || '')}</td><td class="small">${esc(u.proof || '')}</td></tr>`).join('')}</tbody></table>` : ''}
    ${e.opportunities.filter((o) => o.status !== 'Idea').length ? `<h3>Opportunities</h3><ul>${e.opportunities.filter((o) => o.status !== 'Idea').map((o) => `<li><b>${esc(o.title)}</b> <span class="muted small">(${esc(o.area || '')} · impact ${esc(o.impact || '—')})</span>${o.description ? ' · ' + esc(o.description) : ''}</li>`).join('')}</ul>` : ''}
    <p class="small muted">Competitor information comes from public sources and interviews, reviewed ${esc([...new Set(e.competitors.map((c) => c.lastReviewed).filter(Boolean))].sort().slice(-1)[0] || 'recently')}. Indicative prices are estimates.</p></section>`;

  if (sec.findings && (e.findings.length || ins.length)) h += `<section class="rpt-sec"><h2>Key findings</h2>
    ${e.findings.length ? `<ol class="rpt-findings">${e.findings.map((f) => `<li>${sevChip(f.severity || 'medium')} <strong>${esc(f.title)}</strong><p>${esc(f.evidence || '')}</p></li>`).join('')}</ol>` : ''}
    ${ins.length ? `<h3>What the data shows</h3><ul class="insights">${ins.map((x) => `<li>${sevChip(x.severity)} <strong>${esc(x.title)}</strong><div class="muted small">${esc(x.detail)}</div></li>`).join('')}</ul>` : ''}</section>`;

  if (sec.org && cur.people.length) h += `<section class="rpt-sec rpt-break"><h2>Organisation${hasScenario ? ': current vs proposed' : ''}</h2>${orgLegend(e.departments)}
    <h3>Current</h3><div class="rpt-fig">${orgChart(cur.people, cur.departments, { anonymise: anon, showGhosts: false, showCost: false })}</div>
    ${hasScenario ? `<h3>Proposed: ${esc(scenarioName(e, scId))}</h3><div class="rpt-fig">${orgChart(next.people, next.departments, { anonymise: anon, showGhosts: true, showCost: false })}</div>` : ''}</section>`;

  if (sec.processes && (r.processIds || []).length) {
    h += `<section class="rpt-sec rpt-break"><h2>Process maps${hasScenario ? ': before and after' : ''}</h2>`;
    (r.processIds || []).forEach((pid) => {
      const p = cur.processes.find((x) => x.id === pid); if (!p) return;
      const pn = next ? next.processes.find((x) => x.id === pid) : null;
      h += `<h3>${esc(p.name)}</h3><p class="muted small">${hrs(processHours(p))}/month · ${pct(processManualHours(p) / Math.max(1, processHours(p)) * 100)} manual · about ${fmtMoney(processCostMonthly(p, cur) * 12)}/yr staff time${pn ? ` → after: ${hrs(processHours(pn))}/month, about ${fmtMoney(processCostMonthly(pn, next) * 12)}/yr` : ''}</p>
        ${p.summary ? `<p>${esc(p.summary)}</p>` : ''}
        <div class="rpt-fig">${flowSchematic(p, cur.people, cur.tools, cur.departments, { cols: 2, anonymise: anon, interactive: false, clientSafe: true })}</div>
        ${pn ? `<h4>After</h4><div class="rpt-fig">${flowSchematic(pn, next.people, next.tools, next.departments, { cols: 2, anonymise: anon, interactive: false, clientSafe: true })}</div>` : ''}`;
    });
    h += '</section>';
  }

  if (sec.recommendations && inScope.length) {
    const horizons = ['0-3 months', '3-6 months', '6-12 months', '12+ months', ''];
    h += `<section class="rpt-sec rpt-break"><h2>Recommendations roadmap</h2><p class="muted small">Ranked by priority score: value, effort, risk and confidence.</p>`;
    horizons.forEach((hz) => {
      const items = inScope.filter((x) => (x.rec.horizon || '') === hz || (!hz && !horizons.includes(x.rec.horizon || '')));
      if (!items.length) return;
      h += `<h3>${hz || 'Unscheduled'}</h3><table class="tbl"><thead><tr><th>Recommendation</th><th class="r">Cash / yr</th><th class="r">Revenue / yr</th><th class="r">Hours freed / mo</th><th class="r">One-off</th><th class="r">Payback</th></tr></thead><tbody>
        ${items.map((x) => `<tr><td><strong>${esc(x.rec.title)}</strong> <span class="chip">${esc(x.rec.type || '')}</span><div class="muted small">${esc(x.rec.description || '')}</div></td><td class="r">${fmtMoney(x.cash)}</td><td class="r">${fmtMoney(x.revenue)}</td><td class="r">${Math.round(x.hoursSaved)}</td><td class="r">${fmtMoney(x.oneOff)}</td><td class="r">${x.payback == null ? '—' : x.payback.toFixed(1) + ' mo'}</td></tr>`).join('')}</tbody></table>`;
    });
    h += '</section>';
  }

  if (sec.financials && e.scenarios.length) {
    const rows = e.scenarios.map((s) => ({ s, i: scenarioImpact(e, s.id) }));
    h += `<section class="rpt-sec"><h2>Financial impact by scenario</h2>
      <table class="tbl"><thead><tr><th>Scenario</th><th class="r">Headcount Δ</th><th class="r">Payroll saving</th><th class="r">Tool saving</th><th class="r">Other saving</th><th class="r">Revenue uplift</th><th class="r">One-off</th><th class="r">Payback</th></tr></thead><tbody>
      ${rows.map(({ s, i }) => `<tr class="${s.id === scId ? 'rpt-hl' : ''}"><td><strong>${esc(s.name)}</strong><div class="muted small">${esc(s.description || '')}</div></td><td class="r">${i.headcountDelta}</td><td class="r">${fmtMoney(i.payrollSaving)}</td><td class="r">${fmtMoney(i.toolSaving)}</td><td class="r">${fmtMoney(i.otherSaving)}</td><td class="r">${fmtMoney(i.revenueUplift)}</td><td class="r">${fmtMoney(i.oneOff)}</td><td class="r">${i.paybackMonths == null ? '—' : i.paybackMonths.toFixed(1) + ' mo'}</td></tr>`).join('')}
      </tbody></table>
      <p class="muted small">Savings are annualised estimates from the modelled changes. Freed hours are shown as capacity and only become cash when roles change. Figures should be validated with finance before decisions are made.</p></section>`;
  }

  if (sec.nextSteps && r.nextSteps) h += `<section class="rpt-sec"><h2>Next steps</h2><ol>${splitList(r.nextSteps.replace(/^\s*\d+[.)]\s*/gm, '')).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>`;
  h += `<footer class="rpt-foot">The Growth Machine · thegrowthmachine.co · ${date} · Confidential. Prepared for ${esc(e.client.name)}.</footer>`;
  return h;
}

function downloadReportHTML(e, kind) {
  const isStatus = kind === 'status';
  const css = (document.getElementById('viz-css') || {}).textContent + '\n' + (document.getElementById('report-css') || {}).textContent;
  const html = `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc((isStatus ? 'Status report' : (e.report.title || 'Report')) + ' · ' + e.client.name)}</title><style>${css}
body{margin:0;background:#f6f1e9;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#171715}
.rpt{max-width:1100px;margin:24px auto;}
</style></head><body><main class="rpt">${isStatus ? renderStatusReport(e) : renderReport(e)}</main></body></html>`;
  const slug = (e.client.name + '-' + (isStatus ? 'status-report' : (e.report.title || 'report'))).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  downloadFile(`${slug}-${todayISO()}.html`, html, 'text/html');
}
