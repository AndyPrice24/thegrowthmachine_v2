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
- **Automation, always:** every process, system and hand-off is a candidate. First prize is automating inside the systems the
  client already uses or is moving to (e.g. Paper-trail, the platform, the CRM, Google Workspace); AI where it does the job better.
  Log each one as an automation opportunity: what it removes, the system it uses, rough value and effort.

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
- When a founder names a priority (e.g. Daryl's NRR 125% and client visibility), pin it (`pinned` on the finding and
  recommendation) so it leads Home and Plan, give it dated next steps, and make sure TGM's work visibly closes it.
- Be honest: say when a number is an estimate or a source is messy, and ask rather than guess.
- Recommendations are suggestions for the client to decide. Each one says how it will stick (system, ease, visibility,
  incentive, owner); see the skill.
- Where the client's documents disagree with the evidence, keep the evidence and log a feedback item for the client,
  citing both sides precisely: source, tab or section, who, date of the information, and when we received it.

## Data and privacy
- Client data lives only in `clients/<client>/` (gitignored). Never commit it; this repo is public.
- Exclude personal data of clients' contacts (names, birthdays, phone numbers).
- Report interviews by role. Never attribute confidential remarks to the person who made them.
- Studio updates are stamped JSON files (`_meta.generatedAt`, `_meta.client`). Upload each one to the private Google Drive folder
  **TGM Studio updates** (never shared); the user clicks ⟳ Updates in the Studio, which merges new files oldest first and saves a
  backup into the folder's `backups/`. Also send the file in chat if asked.
- When new data arrives, the same update closes the matching data requests (received date, what came in, what is still missing).
- Every interview, meeting, voice note or written answer is offset against ALL open questions in the same update: answers go
  on the speaker's interview, keyed by question id, with the source and date. "Partly: ..." records what is known and the
  question stays open, narrowed to what is still missing (original kept in `qWas`). Answers to someone else's questions are
  recorded as "(per the <role>)" but that question is not reworded, so it doesn't leak the source or lead the answer.
  Never record confidential remarks about named staff as answers.
- The same update also brings the process maps up to date with what was described: corrected or new steps, pain points,
  flags and sources by role. Where accounts differ, keep both as flags rather than overwriting one with the other.
- Questions are only narrowed when the person told us the partial answer themselves, in a conversation with us. For a first
  interview, or where what we know came second-hand or from a relayed message, keep their questions neutral, as if we
  know nothing, so we hear it from them; afterwards compare with earlier comms by and about them and log inconsistencies.

## Code
- Studio source: `tools/growth-machine/src/`. Build: `node tools/growth-machine/build.mjs` → `dist/growth-machine-studio.html`.
- Test changes in Playwright (Chromium is pre-installed) before shipping. See `README.md` for features.
