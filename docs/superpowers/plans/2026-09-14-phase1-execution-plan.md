# Phase 1 (World Prototype) — Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, this session) — the master plan is already written. Use superpowers:test-driven-development for Tasks 1.3 / 1.7 / 1.8 and superpowers:verification-before-completion before any "done" claim.

**Goal:** Reach the master plan's **Phase 1 exit gate**: `/world` renders the hub room at 60 fps, WASD moves AJ.exe with collision and wall-slide, `[E]` prompts appear near the terminal and door frames, ESC pauses, and mobile/no-WebGL shows the fallback.

**Architecture:** Everything is already decided in `2026-09-14-portfolio-revised-plan.md` (v1.1): Next.js App Router + a client-only R3F canvas at `/world`, tile-grid collision with no physics engine, one `InstancedMesh` per room for walls, player position outside React state (AD-12), fixed-angle follow camera (AD-10).

**Tech Stack:** Next.js 16.3.5, React ~19.2.0, TypeScript strict, Tailwind v4 (CSS-first `@theme`), three 0.186.0, @react-three/fiber 9.7.0, zustand 5.0.15, vitest 5. No other runtime dependencies.

**Spec:** `Portfolio Experience Design Specification.md` (repo root) → §4 camera, §5 character, §6 controls, §7 HUD, §9 core room, §23 performance, §27 Phase 1.
**Master plan:** `docs/superpowers/plans/2026-09-14-portfolio-revised-plan.md` — **this document routes execution; the code lives there. If you find yourself pasting code here, stop.**

## Global constraints (verbatim from the master plan)

- §0 Executor Contract in full: tasks in order, never skip a Verify step, never invent file paths, **no new dependencies**, commit after every green step with the exact message given, UTF-8 everywhere, `ponytail:` comments for deliberate ceilings.
- §1 pinned versions; §4 design system locked (tokens, room palettes).
- §2 AD-07…AD-13 for anything in this phase (separate tile maps, no voxel engine, no physics, camera, no drei, no player position in React state, testing split).
- §1 budgets: `/world` lazy chunk ≤ 1.2 MB gz, 60 fps on integrated graphics, ≤ ~120 draw calls, **no network requests from the world at load time except the page itself**.

## Why there is a prerequisite slice

Plan Phase 1 imports things Phase 1 does not own: the `site/` project, the test runner, the `@/` alias, the design tokens the HUD class names come from, and the root layout that loads the fonts. **Phase 1 cannot reach a green `npm run build` without them.** So this session does the smallest Phase 0 slice that Phase 1 actually consumes, and stops there.

### Task P0-lite.a — master plan Task 0.1, in full

Scaffold `site/`, pin React to `~19.2.0` (fiber 9.7.0 peers `react >=19 <19.3` — non-negotiable), install the §1 list, `vitest.config.ts`, package scripts, root `.gitignore`, root `AGENTS.md`, `site/AGENTS.md`, `.env.example`.
Pre-flight already done this session: Node `v24.19.0` (≥ 22.12 ✓), npm `11.17.0` (≥ 10 ✓), git `2.49.0` ✓.

- [ ] Verify: `npx tsc --noEmit` clean, `npm run build` green, `npm run test` runs (0 tests is fine at this point), `git log` shows the baseline + Task 0.1 commits.

### Task P0-lite.b — master plan Task 0.3, **steps 1–3 only**

`globals.css` tokens + root layout (Geist fonts, `lang`, `id="main"` `<main>`, facility background) + `Nav`/`Footer`. Stop before the landing page (0.4). Phase 1 needs the tokens and the fonts; it does not need a single content page.

`site/src/app/(site)/page.tsx` and every content page are **deliberately absent**. That means `npm run build` produces a 404-only site root, which is expected, and the Phase 0 exit gate stays unticked.

## Isolation (superpowers:using-git-worktrees → adapted)

`portfolio/` is not a repo and is untracked by its parent (`?? portfolio/`, 0 tracked files), so `git init` here cannot touch anything else. Worktree creation on a repo with no commits is meaningless, so isolation is by branch instead of worktree, with AJ's consent assumed from "implement v1":

- [ ] `git init` in `portfolio/`, commit the spec + plan docs as the baseline (message `docs: add portfolio spec and v1.1 implementation plan`).
- [ ] `git switch -c phase/1-world-prototype`; all Phase 1 commits land there; `main` stays at the baseline so the whole phase is one `git switch main` away from being abandoned.
- [ ] Never commit `node_modules`/`.next` (root `.gitignore` from Task 0.1).

## Execution order and gates

| # | Master task | Deliverable you can see | Gate that must be green before the next row |
|---|---|---|---|
| 1 | 0.1 | `site/` runs, tooling wired | `npm run build` |
| 2 | 0.3 (steps 1–3) | tokens, fonts, Nav/Footer | `npm run build` |
| 3 | 1.1 | `/world` stub + WebGL/coarse-pointer guards + `?force=1` | build; fallback visible in device emulation |
| 4 | 1.2 | `types.ts`, `store.ts`, `rooms.ts`, hub data | `npx tsc --noEmit` + build |
| 5 | 1.3 (TDD) | `collision.ts` + failing-test-first suite | `npm run test` passes, and you **saw it fail** |
| 6 | 1.4 | hub rendered: instanced walls, floor grid, props, lights | dev server + build |
| 7 | 1.5 | AJ.exe (~10 boxes, idle bob, fake blob shadow) | dev server + build |
| 8 | 1.6 | `CameraRig` damped follow | dev server + build |
| 9 | 1.7 (TDD) | `input.ts` + `getMoveDir` test, `actions.ts`, `PlayerController` | `npm run test`; walk + wall-slide + blocked props |
| 10 | 1.8 (TDD) | `interaction.ts` + test, HUD, prompt bar, pause menu | **Phase 1 exit gate in full** |

Row 10 is the only row whose gate is "the phase works". Everything before it is allowed to look unfinished.

## Do not build in this phase (ponytail: YAGNI, deletion over addition)

Content pages, research/about/resume/contact, SEO, staging deploy (Phase 0's rest) · rooms beyond hub · door teleports and panels (Phase 2) · `/api/inspect`, demo, heatmap (Phase 3) · Noctis (Phase 4) · research/about rooms, sound, easter egg (Phase 5) · Playwright, a11y pass, perf audit (Phase 6) · anything from the cut list: drei, framer-motion, physics engine, real shadows, virtual joystick, achievements, audio assets.
The five `UNDER CONSTRUCTION` prompts in the hub are **the whole point** of Phase 1's room: they prove the interaction system works while nothing is wired to it.

## Known risks, checked before starting

| Risk | Mitigation |
|---|---|
| `create-next-app@latest` scaffolds Next newer than the pinned 16.3.5 | After scaffold, `npm ls next react`; if Next ≠ 16.3.5, `npm install next@16.3.5` (same major; §1 is the verified set) and re-run the build. React downgrade to `~19.2.0` is mandatory either way. |
| npm registry install is slow or blocked | Task 0.1 fails loudly at install; report it, do not substitute packages. |
| ESLint from the scaffold flags plan code (e.g. `react-hooks/exhaustive-deps` in 3.8/4.x later) | Fix the code or add the narrow inline disable the plan already uses. Never `--fix` away a rule file-wide, never delete a check. |
| R3F + `key={roomId}` remounts are the Phase 1 hot spot for stale textures | Dispose in the `useEffect` cleanups exactly as Tasks 1.4/1.5/1.6 specify. |
| Dev-server "60 fps" is a human read of the FPS meter, not an assertion | Recorded as an observation in the report; the instrumented check belongs to Phase 6 (Appendix C.4/C.5). |

## Completion = master plan Phase 1 exit gate + report

- [ ] `/world` renders the hub at 60 fps with no console errors
- [ ] WASD + arrows move; walls, pillars and the terminal block; wall-slide works
- [ ] `[E]` prompts appear at the terminal and all four door frames, and vanish when you walk away
- [ ] ESC opens/closes the pause menu; movement stops; its links navigate
- [ ] Mobile emulation or WebGL-disabled shows the fallback, never a broken canvas
- [ ] `npm run build` and `npm run test` green; every step box ticked in the master plan; one commit per green step

**Then report:** commits + hashes, tests seen failing before passing, the exit-gate table with what was actually observed, the Phase 0 slice still outstanding, and any deviation from §2 (with a §2a amendment row if a decision changed).
