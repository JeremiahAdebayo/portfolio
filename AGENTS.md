# AGENTS.md

## Read first
- `docs/superpowers/plans/2026-09-14-portfolio-revised-plan.md` is the implementation plan.
  Work task-by-task, in order, checking off steps in the plan file itself.
- `Portfolio Experience Design Specification.md` is the vision spec.

## Commands (run inside `site/`)
- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build; must pass before committing app code
- `npm run test` — vitest unit tests
- `npx playwright test` — e2e smoke tests
- `npx tsc --noEmit` — type check

## Hard rules
- No dependencies beyond the pinned list in plan §1.
- Never render one mesh per map tile; walls use InstancedMesh.
- All content lives in `src/content/`; pages and world render it, never duplicate it.
- Player position never enters React state (plan AD-12).
- Commit only green, verified steps. Conventional commits.
- Every file is UTF-8.
- Mark deliberate shortcuts with `ponytail:` comments.
