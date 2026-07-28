# Testing

Tests are what let a community of strangers change this codebase quickly
without breaking students' study plans. With them, a contributor can trust
their instincts and ship; without them, every merge is a gamble taken on
someone else's exam prep.

## Framework

- **vitest** (with happy-dom) in `apps/web`
- Run: `bun run test` (repo root, via turbo) or `cd apps/web && bun run test`
- Watch mode: `cd apps/web && bun run test:watch`
- CI runs the suite on every PR with `TZ=Asia/Kolkata`: most of our
  students live at UTC+05:30, and the timezone is load-bearing (see
  `journey.regression-1.test.ts` for the day-shift bug it guards against)

## Layers

| Layer | What | Where |
|---|---|---|
| Unit | Pure logic: date math, name formatting, stores | `src/**/*.test.ts` next to the code |
| Regression | One test per fixed bug, named `*.regression-N.test.ts`, with an attribution comment linking the issue | next to the fixed code |
| E2E / QA | Browser walkthroughs of the live app | maintainer-run `/qa` passes; findings become issues |

## Conventions

- Test real behavior with meaningful assertions. `expect(x).toBeDefined()`
  proves nothing.
- When you fix a bug, add a regression test that fails on the pre-fix code
  (mutation-check it: revert the fix locally, watch the test go red).
- When you add a conditional, test both paths.
- localStorage comes from `vitest.setup.ts` (a complete in-memory
  implementation); do not mock it per-test.
- Never import secrets or real API keys in tests. AI flows are mocked or
  left to QA passes.

## The first suite (July 2026)

- `src/lib/journey.regression-1.test.ts`: local-calendar day bookkeeping
  (runway never schedules in the past, exam eve stays free, shaky-first
  prioritization, streak counting)
- `src/lib/utils.test.ts`: `titleCase()`, the gate between WikiSyllabus
  folder names and every visible label
