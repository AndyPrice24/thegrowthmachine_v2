# The Growth Machine: how to work in this repo

## Purpose of "the machine" (Growth Machine Studio)
The machine exists to find, size and fix what holds a client business back. It is not a copy of the client's
spreadsheets, and it does not take part in their day-to-day running.

Always be looking for:
- **Leaks:** money, time or customers lost (churn, downgrades, unbilled work, duplicate tools, manual rework).
- **Bad processes and glaring holes:** broken hand-offs, missing owners, steps that rely on one person, no data.
- **Lost opportunities:** upsell, win-back, pricing, new channels, products the market is asking for.
- **Weaknesses** in processes, flow, people, departments, decisions and direction.
- **Better tools:** what to replace, consolidate or automate, and what it saves.

Always ask what new data says when it is **combined** with what we already know (e.g. contract status × revenue ×
adoption = revenue at risk). Joined-up insights are the most valuable ones.

Then propose better ways of working: new models, flows, systems and tools, plus a strategy to plug each hole and take each opportunity.

The full method is in the `growth-machine` skill (`.claude/skills/growth-machine/SKILL.md`).

## How to present it
- Clear, actionable insights first. Each one says what it is, roughly what it costs or is worth, and what to do next.
- Keep the view simple: categorise (leak / weakness / opportunity / tool), rank by size, show the top few.
- Don't mirror the client's minutiae. Digest source data into categories, totals and the few examples that prove the point.
  Keep raw detail only where it is needed as evidence.
- Every finding should lead to a recommendation, a question for a named role, or a data request.
- Be honest: say when a number is an estimate or a source is messy, and ask rather than guess.
- Recommendations are suggestions for the client to decide. Each one says how it will stick (system, ease, visibility,
  incentive, owner); see the skill.
- Where the client's documents disagree with the evidence, keep the evidence and log a feedback item for the client,
  citing both sides precisely: source, tab or section, who, date of the information, and when we received it.

## Data and privacy
- Client data lives only in `clients/<client>/` (gitignored). Never commit it; this repo is public.
- Exclude personal data of clients' contacts (names, birthdays, phone numbers).
- Report interviews by role. Never attribute confidential remarks to the person who made them.
- Studio updates are stamped JSON files (`_meta.generatedAt`) that the user merges in the Studio, then backs up.

## Code
- Studio source: `tools/growth-machine/src/`. Build: `node tools/growth-machine/build.mjs` → `dist/growth-machine-studio.html`.
- Test changes in Playwright (Chromium is pre-installed) before shipping. See `README.md` for features.
