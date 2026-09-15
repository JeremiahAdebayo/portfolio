# AGENTS.md

## Read first
- `docs/superpowers/plans/2026-09-14-portfolio-revised-plan.md` is the implementation plan.
  Work task-by-task, in order, checking off steps in the plan file itself.
- `Portfolio Experience Design Specification.md` is the vision spec.

## Commands (run inside `site/`)
- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build; must pass before committing app code
- `npm run test` — vitest unit tests
- `npm run lint` — eslint; **part of the green gate**, run it with every commit, not occasionally
- `npx playwright test` — e2e smoke tests
- `npx tsc --noEmit` — type check

If a route file is deleted or renamed, delete `.next/dev` and `.next/types` before
trusting `npx tsc --noEmit`: the generated typed-route validators go stale and report
errors that are not in the app (plan A23).

## Hard rules
- No dependencies beyond the pinned list in plan §1.
- In JSX, a design-system `// Label` must be a string expression (`{"// Label"}`), never a bare text node (plan A19).
- Never render one mesh per map tile; walls use InstancedMesh.
- All content lives in `src/content/`; pages and world render it, never duplicate it.
- Player position never enters React state (plan AD-12).
- Commit only green, verified steps. Conventional commits.
- Every file is UTF-8.
- Mark deliberate shortcuts with `ponytail:` comments.
