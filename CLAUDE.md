# Beyond Syllabus

The Purple Movement's flipped-classroom app: students walk into class with
questions worth asking. Built on WikiSyllabus (the open syllabus commons)
as the single source of data truth.

- Monorepo: `apps/web` (Next.js 16) + `apps/server` (Elysia + oRPC), Bun + Turborepo
- UI changes are reviewed against [DESIGN.md](./DESIGN.md)
- Contribution flow: [CONTRIBUTION.md](./CONTRIBUTION.md)

## Testing

- Run all tests: `bun run test` (root) — vitest in `apps/web`
- Details and conventions: [TESTING.md](./TESTING.md)
- Expectations:
  - When writing a new function with logic, write a corresponding test
  - When fixing a bug, write a regression test that fails on the pre-fix code
  - When adding a conditional, test both paths
  - Date/day logic must be tested under `TZ=Asia/Kolkata` (CI does this)
  - Never commit code that makes existing tests fail

## Commands

- `bun run dev:web` / `bun run dev:server` — local dev (web on :3001, server on :3000)
- `bun run patch` — sync WikiSyllabus data + regenerate syllabus.json (never commit the regenerated file)
- `cd apps/web && bun run typecheck` / `cd apps/server && bun run check-types`
