# Roadmap — Beyond Syllabus

*Phased against [VISION.md](./VISION.md). Community issues [#10–#19](https://github.com/The-Purple-Movement/Beyond-Syllabus/issues) are mapped into phases below — the community already told us what to build; this file puts it in order.*

**Current state (July 2026):** Next.js 16 + React 19 + Bun monorepo with a Groq-powered chat, AI module summaries, mind-maps, and share links, fed by a build-time snapshot of WikiSyllabus (12 universities). Solid skeleton, real gaps: no brainstorm/Socratic mode, no persistence or progress, a 12 MB all-universities JSON payload, manual syllabus sync, no tests or CI.

## Phase 0 — Hygiene & trust (weeks, not months)

The unglamorous work that makes contributors take the repo seriously:

- [ ] **CI**: lint + typecheck + build on every PR (`oxlint` exists; wire it to GitHub Actions)
- [ ] **Move all LLM calls server-side** — today Groq calls run in web server actions with the key in web env (and a `'api key'` string fallback in `ai.ts`). Single AI route on the server app, key lives only there, rate-limited
- [ ] **Split the 12 MB syllabus.json** — serve per-university/per-course slices from the oRPC API; mobile-data users are the design target (vision principle 3)
- [ ] **Automated WikiSyllabus sync** — nightly GitHub Action replaces the manual `bun sync`; new syllabus merged upstream appears here within 24h, no human in the loop
- [ ] **Replace the keyword-blocklist topic filter** with prompt-level scoping (today "bollywood" is hard-blocked — a film-studies student literally can't ask about their own syllabus)
- [ ] Label 10+ `good first issue`s from this list; add PR preview deploys

## Phase 1 — The brainstorm becomes the product (months 1–3)

The flipped-classroom core (vision moment #1):

- [ ] **Guided Brainstorm mode**: module-scoped session — activate prior knowledge → why/where context → surface confusions. Distinct UI from chat; this is the flagship flow, not a prompt preset
- [ ] **The Question Sheet**: every brainstorm produces a takeaway list of the student's open questions — exportable, shareable (permanent links, not 7-day Redis TTL), and designed to be *brought to class* (issue #17's notes problem, solved at the artifact level)
- [ ] **Socratic mode in chat**: answer, then turn it back — a mentor persona that ends responses with a forward question (the persona/prompt-builder system already supports this cleanly)
- [ ] **Prerequisite awareness v1** (issue #15): module-to-module "builds on" links generated from syllabus structure, shown before each brainstorm — "this stands on Module 2; shaky there? start there"
- [ ] **Relatable-examples pass** (issue #12): region- and industry-anchored examples in module context, with a community contribution path for better ones

## Phase 2 — Continuity & motivation (months 4–6)

- [ ] **Lightweight accounts** (optional, never required to learn): saved brainstorms, question sheets, per-module progress
- [ ] **Progress & streaks** (issue #18): module completion, brainstorm streaks — designed for eventual **μLearn Karma interop**, not a parallel points economy
- [ ] **Exam runway** (issue #14): enter exam dates → module-by-module revision plan built from your progress and prerequisite graph
- [ ] **Foundation check** (vision moment #3): per-module self-assessment; **PYQ integration** (issue #16) where the community contributes previous-year questions via WikiSyllabus-style open files
- [ ] **Personalized delivery modes** (issue #11): explain-like-a-peer / formal / example-first as a user setting (persona system already models this)

## Phase 3 — The classroom loop & the network (months 7–12)

- [ ] **Teacher view**: anonymized, aggregated Question Sheets per class/module — the flipped classroom's teacher half. Ship to 2–3 pilot classrooms via the μLearn campus network before generalizing
- [ ] **Offline-tolerant PWA** (issue #19): cached syllabus + brainstorm artifacts survive patchy data; AI degrades gracefully to structured prompts
- [ ] **Ecosystem hand-offs**: module → related Beyond-Borders problem statements ("what could you build with this?"); course → upcoming Evolve sessions in that domain
- [ ] **Coverage push with WikiSyllabus** (issue #10): coordinated campaign for niche departments and more universities — every new syllabus file lights up a course here automatically (Phase 0 sync makes this real)

## Metrics that match the mission

- Questions brought to class (sheets created/exported) — the north star
- Brainstorm sessions per active student per week; % of universities in WikiSyllabus live here within 24h of merge
- Contributor count and time-to-first-merged-PR
- **Not** metrics: total chat messages, session length. An answer machine maximizes those; a question machine doesn't.

## How to pick something up

Comment on the mapped issue, or open one referencing the roadmap line. Architecture questions → open a discussion. New contributors: start at `good first issue` — Phase 0 items are deliberately scoped to be first PRs.
