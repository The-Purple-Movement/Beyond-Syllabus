# Design Principles

These are the principles UI changes are reviewed against. They exist so a
contributor can design confidently without waiting for a maintainer's taste,
and so review feedback is grounded in something written rather than opinion.
If a PR and a principle disagree, either the PR changes or this file does,
by discussion, never silently.

## 1. The surface tells the truth

- No fake links (a "Privacy Policy" that points at the repo root is a lie).
- No dishonest labels: models are named what they are, counts are real,
  "coming soon" is said out loud.
- Data-derived names are humanized (`titleCase`), never raw slugs or
  ALL CAPS folder names.

## 2. Brainstorm first, chat second

The product exists to help students walk into class with questions worth
asking. "Brainstorm before class" is the primary action wherever both
appear; open-ended AI chat is the secondary path. Any change that inverts
this hierarchy is a regression, however pretty.

## 3. A home, not a gate

A student has one course for months. Returning users land on their
semester, not a wizard. The wizard exists for first-run and switching.
Anything that adds steps between a returning student and their subjects
needs a very good reason.

## 4. Local-first, no accounts

Learning never requires a login. The journey lives on the device, is
exportable, and the UI says so plainly. Do not add features that only work
with accounts; design them local-first with sync as a later layer.

## 5. Data gaps are invitations

Beyond Syllabus renders WikiSyllabus. Where data is missing (a semester, a
subject, a past paper), the UI says what is missing and links to where one
markdown file fixes it for everyone. Silent absence wastes the gap;
an error message wastes the contributor.

## 6. Never fail silently

A disabled control explains what would enable it. An empty state says what
belongs there and how it gets there. Every async action has a pending
state. `alert()` is banned; use toasts with sentences a student would
understand.

## 7. Accessibility is the floor, not a feature

- Every interactive element is a real `<button>`, `<a>`, or input:
  reachable by keyboard, visible focus ring, announced by screen readers.
- Text meets WCAG AA contrast at the size it is used. Do not dilute
  `muted-foreground` with opacity modifiers on small text.
- Icon-only buttons carry `aria-label`.

## 8. Phones are the primary device

Most students are on phones. Layouts are designed at 375px first and
enhanced upward. Navigation must exist at every breakpoint (no
`hidden md:flex` without a mobile equivalent).

## 9. The AI is a coach, not a dependency

AI output is generated on demand, cached where sensible, and never blocks
the core reading experience. Offline states coach the student through the
same exercise manually. No auto-firing AI calls on page view. No walls of
generated boilerplate: if a summary reads the same for every subject, it
is not a summary.

## 10. Speed is respect

No artificial delays. No spinner theater. If something is fast, let it be
fast; if something is slow, show honest progress.

---

## Copy voice

Plain, direct, warm. Write like a good senior explaining to a first-year:
no marketing verbs ("unlock", "streamline", "empower"), no exclamation
inflation. Say what a thing does and why a student would care.

## PR checklist for UI changes

- [ ] Works at 375px and with keyboard only
- [ ] Interactive elements are semantic, labeled, and focus-visible
- [ ] Pending, empty, and error states exist and explain themselves
- [ ] New copy passes the voice rules above
- [ ] No new AI call fires without a user action
- [ ] `bun run typecheck` and `next build` pass

*This file was seeded from the July 2026 UX review (see the pinned "Design
north star" issue). Amend it by PR like any other file.*
