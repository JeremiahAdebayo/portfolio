# AJ Interactive Portfolio — Revised Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build AJ's interactive voxel-research-facility portfolio as a content-first Next.js site with an optional 3D world, a real (rate-limited) Nightfall inference demo, a replay-based Noctis room, and a conventional fallback UI — shipped incrementally, deployable from Phase 0.

**Architecture:** Next.js App Router serves the canonical content pages (SSG, shareable URLs, SEO) and a client-only React-Three-Fiber world at `/world`. A single typed content layer (`src/content/`) feeds both renderers, so nothing is maintained twice. Rooms are separate tile maps connected by door teleports with a short fade. Noctis is driven by **replayed traces of real runs**, never live public execution. Nightfall inference goes through a same-origin rate-limited proxy with a mock mode and graceful degradation.

**Tech Stack:** Next.js 16.3.5, React 19.2.x, TypeScript (strict), Tailwind CSS v4, three 0.186.0, @react-three/fiber 9.7.0, zustand 5.0.15, vitest 5, Playwright. No other runtime dependencies.

**Spec:** `Portfolio Experience Design Specification.md` (repo root). The spec is the vision document; this plan re-sequences and constrains it. Where they conflict, this plan wins — the differences are deliberate and recorded in the Architecture Decisions below.

**Plan version:** 1.1 — 2026-09-14. Versions in §1 were verified against live package registries on this date, not guessed. v1.1 adds Tasks 3.3 → 7.4, Appendices A–D, and the §2a amendment log (read §2a before executing Phase 3).

---

## 0. Executor Contract — read this whole section before Task 0.1

This plan is written to be executed by a fast model that should **not** make design decisions. Follow it literally.

1. **Read the spec and this plan fully before starting.** Do not skim.
2. **Work tasks in order, steps in order.** Check off steps (`- [ ]` → `- [x]`) in this file as you complete them.
3. **Never skip a Verify step.** A step is not done until its command/check has produced the expected result. If you cannot verify, the task is not done.
4. **Never invent file paths.** Use exactly the paths in each task's Files block. If a name genuinely must change, stop and note it in the plan file first.
5. **No new dependencies.** The full allowed list is §1. If you believe you need another package, you are off-plan — re-read the task.
6. **When a step fails:** stop, re-read the failing step, fix the minimal cause, re-run the verify command. Never "work around" a failing check by deleting the check.
7. **Commit after every green step** using the exact commit messages given.
8. **UTF-8 everywhere.** All files created by this plan are UTF-8. When reading existing files with Windows PowerShell, pass `-Encoding UTF8` (the spec is UTF-8 and renders correctly when read properly).
9. **Do not refactor beyond the task.** If you notice something ugly outside the task scope, add a `ponytail:` comment and move on.
10. **Human decision points** are collected in Appendix D. If a task hits an `EDIT-ME` value, use the placeholder behavior described and keep moving; AJ replaces the values later.

### Ponytail rules for this repo (permanent)

- The laziest solution that actually works is the correct solution. Stdlib and native platform features before dependencies. Deletion over addition.
- No speculative abstractions: no interface with one implementation, no factory for one product, no config for a value that never changes.
- Non-trivial logic (collision, rate limiting, trace playback, content validation) leaves one runnable check behind. Trivial one-liners need no test.
- Deliberate corner-cutting is marked in code with a `ponytail:` comment naming the ceiling and the upgrade path.
- Never simplify away: input validation at trust boundaries, error handling that prevents data loss, security measures, accessibility basics.

### The cut list — do NOT build these (spec items deliberately deferred or cut)

| Item | Status | Rationale |
|---|---|---|
| Live Noctis execution for the public | **Cut from MVP** | Public code execution is the single riskiest item in the spec. Replay real traces instead (AD-05). |
| Framer Motion | **Cut** | CSS transitions + R3F animation cover everything. Zero JS animation deps. |
| Virtual joystick / full mobile 3D world | **Cut from v1** | Mobile gets the standard UI (AD-04). `?force=1` escape hatch only. |
| Achievements system | Deferred post-MVP | Spec §16 says subtle; v1 has none. |
| Easter eggs | One, Phase 5, optional | Spec §17 — optional seasoning. |
| Sound | Phase 5, optional, muted by default | WebAudio oscillators only, no audio assets. |
| Camera capture in Nightfall demo | Phase 3 optional task | Upload + samples first (spec lists camera as "Option B"). |
| Contact form backend | **Cut** | `mailto:` + links. No spam surface, zero backend. Spec §15: "extremely easy to use". |
| Separate Contact room | **Cut** → comms terminal inside the About room (AD-15) | Spec §15 wants near-zero friction for contact. A whole room for five links is a worse experience than a terminal with `[E]` → links. Hub gets a `COMMS` sign so it is still discoverable in-world. |
| CMS / MDX / zod / database / auth | **Cut** | Typed TS content modules are the single source of truth (AD-01). |
| @react-three/drei | **Cut** | Signs and screens via `CanvasTexture`. Fewer deps, smaller bundle, no font-loading workers (AD-11). |
| Real-time shadows | **Cut** | Fake blob shadow under character. Perf on integrated GPUs. |
| Physics engine | **Cut** | Tile-grid collision with wall-slide (AD-09). |
| Sentry error monitoring | Decision point (Appendix D) | `error.tsx` boundaries ship by default. |
| Analytics platform dependency | Decision point (Appendix D) | No analytics code ships without an explicit plan amendment (§2a / A8). |

---

## 1. Verified Environment & Versions (researched 2026-09-14)

**Pre-flight (Task 0.1 Step 0):** `node -v` must be ≥ 22.12 (Vitest 5 requires `^22.12 || ^24 || >=26`; Next 16 requires `>=20.9`). `npm -v` ≥ 10.

**Pinned runtime dependencies** (exact versions, verified against registry peer ranges):

| Package | Version | Verified constraint |
|---|---|---|
| next | 16.3.5 | peer `react ^18.2 \|\| ^19` |
| react / react-dom | **~19.2.0** | ⚠ `@react-three/fiber@9.7.0` peers `react >=19 <19.3`. React latest is 19.3.0, which does **not** satisfy the fiber peer range. create-next-app installs 19.3.x — you MUST downgrade to 19.2.x in Task 0.1 or installing fiber will fail with ERESOLVE. |
| three | 0.186.0 | fiber peer `three >=0.156` ✓ |
| @react-three/fiber | 9.7.0 | peers: react `>=19 <19.3`, three `>=0.156` |
| zustand | 5.0.15 | peer react `>=18` ✓ |
| tailwindcss | 4.3.3 | v4: CSS-first config via `@theme` in `globals.css`. **No `tailwind.config.js` exists — do not create one.** create-next-app generates the correct v4 setup. |

**Dev dependencies (latest is fine):** `typescript`, `@types/three`, `vitest` (v5), `@playwright/test`.

**Not installed (see cut list):** `@react-three/drei`, `framer-motion`, `zod`, `@next/bundle-analyzer`, any UI kit, any animation library, any state library besides zustand.

### Performance budgets (hard gates, checked in Phase 6)

- Landing + standard pages: **First Load JS ≤ 150 KB gz**, LCP < 2.5 s on throttled 3G, Lighthouse Performance ≥ 90.
- `/world`: lazy chunk **≤ 1.2 MB gz total** (three + fiber + world code), loads < 5 s on broadband, 60 fps on integrated graphics, ≤ ~120 draw calls.
- Demo API: **request body ≤ 2 MB** (client downscales before sending), inference timeout 15 s, 5 requests / 60 s / IP. *(Amended in v1.1 — was 5 MB. Vercel Functions reject request bodies over **4.5 MB** with `413 FUNCTION_PAYLOAD_TOO_LARGE`, so a 5 MB allowance could never deploy.)*
- No network requests from the world at load time except the page itself.

---

## 2. Architecture Decisions

These are settled. Do not re-litigate them during execution.

- **AD-01 Content-as-data.** `src/content/*.ts` typed modules are the single source of truth for projects, about, research, timeline, and owner info. Standard pages and world overlays render the same data. Editing portfolio content never touches world code.
- **AD-02 Standard pages are canonical.** `/projects/nightfall` etc. are the real, shareable, indexable URLs. `/world` is the enhanced experience. Deep link into a room: `/world?room=nightfall`.
- **AD-03 Landing page is a fast static shell.** Name, tagline, project cards, links, and an "Enter Facility" button. The world chunk loads only when the visitor asks for it. Satisfies spec success criterion #1 (identity in ~30 s) and keeps LCP small.
- **AD-04 Mobile = standard UI.** Coarse-pointer devices get the standard pages; `/world` shows a fallback panel with a "Try anyway" link (`/world?force=1`). No virtual joystick in v1.
- **AD-05 Noctis is replay, not execution.** Real agent runs are recorded as JSON traces (Appendix B) and replayed in the room with honest labeling ("Replay of a real Noctis run"). A recorder adapter (Appendix B.4) is the hook point for generating more traces locally. No public task execution without a separate security review.
- **AD-06 Nightfall demo goes through `/api/inspect`.** Same-origin route handler (Node runtime): validates MIME type and size (≤ 2 MB), rate-limits per IP (5 req / 60 s, keyed on the first `x-forwarded-for` token), forwards the multipart body to `NIGHTFALL_API_URL` with a 15 s `AbortSignal.timeout`. `NIGHTFALL_MOCK=1` (or unset URL) returns a deterministic simulated result, clearly badged. Client falls back to sample mode on any API failure. Rate limiting is **per warm instance** and therefore best-effort — see the `ponytail:` ceiling in Task 3.4 and Appendix D.5.
- **AD-07 Rooms are separate tile maps.** Each room is an ASCII map (`#` wall, `.` floor, `D` door) with props, blocked rects, and interactables. Doors teleport with a 250 ms fade. No single growing world map — room coordinates never shift when another room is added.
- **AD-08 Voxel aesthetic without a voxel engine.** Everything is axis-aligned boxes: walls are one `InstancedMesh` per room, props are a few dozen boxes, the character is ~10 boxes. **Never render one mesh per map tile.**
- **AD-09 No physics.** Tile-grid collision, 4-corner radius check, per-axis movement (wall-slide). Pure functions, unit tested.
- **AD-10 Fixed-angle follow camera.** Offset `(0, 10, 8)`, look-at player, frame-rate-independent damping. No orbit, no zoom, no first person (spec §4).
- **AD-11 No drei.** Signs and in-world screens use `CanvasTexture` helpers in `src/world/textures.ts`.
- **AD-12 Player position never enters React state.** Player position lives in a ref inside the canvas; the zustand store holds only UI-relevant state (room, prompt, panel, pause, transition). Updating React state at 60 Hz is the #1 perf bug to avoid.
- **AD-13 Testing split.** vitest (node env) for pure logic: collision, input direction, rate limit, trace player, trace validator, content validator. Playwright for page smoke tests. No 3D component unit tests — visual verification is a dev-server check with concrete expectations, plus Playwright assertions that the canvas exists without console errors.
- **AD-14 Deploy = Vercel + GitHub.** Frontend and demo proxy on Vercel; Nightfall/Noctis backends stay independently deployable (spec §26) and are addressed via env vars.
- **AD-15 Contact lives in the About room, not its own room.** The About room contains a `COMMS` terminal whose interaction opens the contact surface (email / GitHub / LinkedIn / resume links, `Action: { type: "link" }`). Spec §15 is satisfied by making contact two keystrokes away, not by building a room.
- **AD-16 Trace playback state is split.** Discrete playback controls (`traceId`, `playing`, `speed`) live in a second zustand store (`world/noctis/store.ts`) so both the 3D room and the DOM console panel can read them. The playback clock is a module-level mutable object written at 60 Hz by the room and **never** stored in React state. DOM consumers poll it on a ≤ 5 Hz interval and only while their panel is open. Same reasoning as AD-12.
- **AD-17 One room-data validator guards all rooms.** `world/rooms.test.ts` (Task 3.3) asserts map integrity, walkable spawns, door symmetry and in-bounds props for every room in the registry. Room data is hand-written ASCII art; without a validator it is the most likely class of silent breakage in Phases 4–5.
- **AD-18 The world exposes one E2E hook: `canvas[data-ready="1"]`.** R3F's `onCreated` sets it after the first frame. Playwright asserts on that attribute (with `--use-gl=angle --use-angle=swiftshader`), never on pixels, screenshots, or frame counts. Visual quality remains a human dev-server check (AD-13).

---

## 2a. Amendment log — v1.0 → v1.1

Written when Phases 3.3 → 7.4 were added. Read this before executing Phase 3; it is the only place where v1.0 decisions were changed after verification. Each item was checked against a live source on 2026-09-14, not remembered.

| # | What changed | Why it was wrong before | Source |
|---|---|---|---|
| A1 | Upload budget **5 MB → 2 MB**, client resizes to a 1024 px long edge | A Vercel Function request body is capped at 4.5 MB and returns `413 FUNCTION_PAYLOAD_TOO_LARGE`. The v1.0 number could never deploy, and §1 and the Phase 3 gate disagreed with each other. | vercel.com/docs/functions/limitations |
| A2 | Rate-limit key fixed to the first `x-forwarded-for` token, and documented as **best-effort per warm instance** | v1.0 said "per IP" without saying how to get the IP, and implied a guarantee the platform does not give: cold starts and multiple instances each carry their own counter. | vercel.com/docs/headers/request-headers |
| A3 | 15 s inference timeout is **safe on Vercel** — no change needed, but now stated | §1's budget looked like it might exceed a function duration limit. Hobby's default and maximum duration is 300 s, so 15 s is fine; `maxDuration = 30` documents intent. | vercel.com/docs/functions/limitations |
| A4 | Real-backend response contract pinned to anomalib's own field names (`pred_score`, `pred_label`, `anomaly_map`) | The spec promised "anomaly heatmap" without a wire format, so Phase 3 would have invented one and the backend would have had to guess it back. | anomalib docs, `Engine.predict` / `OpenVINOInferencer` output |
| A5 | Noctis demo is replayed from **recorded traces** with a named format and a recorder adapter (Appendix B) | AD-05 promised "traces (Appendix B)" but v1.0 had no Appendix B, no schema and no way to produce a trace. The room was unbuildable as written. | — (plan defect) |
| A6 | `playwright.config.ts` and `tests/e2e/*` are now **created by a task** (6.2); §3a records the gap | §3 listed them and `npm run e2e` existed since Task 0.1, but no v1.0 task ever created either file. The Phase 6 gate would have failed on a missing config. | — (plan defect) |
| A7 | `src/components/demo/InspectDemo.tsx`, `demo/heatmap.ts`, `lib/rate-limit.ts`, `lib/demo-results.ts`, `app/api/inspect/route.ts` are now created by named tasks (3.4–3.7) | Same class of defect: the file map promised them, the Phase 3 gate tested them, and no task wrote them. | — (plan defect) |
| A8 | **Accessibility is now a phase of work (6.1), not an assumption.** Skip link, dialog semantics, live regions, focus return, reduced motion, and a non-3D reading of every room | A search of all 3,247 lines of v1.0 found **zero** occurrences of `aria-*`, `role=`, focus management, `prefers-reduced-motion`, or `sr-only` — while spec §24 makes an accessible alternative a hard requirement and §0 tells the executor never to simplify away "accessibility basics". This was the largest gap in the plan. | spec §24, §8, §23 |
| A9 | Room data gained a validator (3.3, AD-17) before two more hand-drawn maps were added | Six maps of ASCII art with door symmetry and walkability constraints, previously verified only by someone walking around hoping. | — (plan defect) |
| A10 | Analytics and error monitoring stay **off** until an explicit amendment (Appendix D.6/D.7) | §1 pins "no other runtime dependencies"; a single line of `@vercel/speed-insights` would silently violate it. | — (plan rule) |
| A11 | Task 1.3's wall-slide fixture corrected (measured 2026-09-14, Phase 1 run) | The fixture asserted `moveWithCollision(map, {1.4, 2}, {-0.5, +0.5})` lands at `(1.4, 2.5)`. Against the plan's own model it lands at `(0.9, 2)`: `0.9 - 0.3 = 0.6` rounds to tile 1 (floor), so the x axis was never blocked, and `2 + 0.5 + 0.3 = 2.8` rounds to row 3 (wall), so z could not reach 2.5. The implementation is right and matches §"a tile's center is at its integer coordinates; the player radius is 0.3"; the fixture contradicted it. Verified by running the plan's fixture verbatim: `AssertionError: expected 0.8999999999999999 to be close to 1.4`. Fixture now starts at the standable edge `x = 0.8` so the x axis genuinely blocks. |
| A12 | `@types/node` must be `^22` (or `>=24`), not the scaffold's `^20` | `vitest@5` declares `peerOptional @types/node@"^22.0.0 \|\| >=24.0.0"`; `npm install -D vitest` on a fresh create-next-app scaffold fails with `ERESOLVE` (measured 2026-09-14). Fixed by upgrading the existing devDependency — no new package, no `--legacy-peer-deps` (which would disable the very peer checking §1 relies on). |
| A13 | React downgrade (Task 0.1 Step 2) is a **no-op** on Next 16.3.5's scaffold | It installs `react@19.2.8`, already inside fiber 9.7.0's `>=19 <19.3` range. Step 2 becomes "verify the version", not "downgrade". |
| A14 | `npm run test` exits 1 until the first test file exists | Vitest 5 fails on "no test files found". That is the correct behaviour and Task 0.2's test lands first, so nothing to fix — but an executor hitting red at the end of Task 0.1 should not add `passWithNoTests` to hide it. |
| A15 | `/world` logs two `404` console errors while Phase 0's pages are unbuilt | Measured in Phase 1: Next prefetches the `PauseMenu` links (`/projects`, `/contact`) that Tasks 0.4–0.6 create. Do **not** add `prefetch={false}` to hide it; build Phase 0 and the noise disappears on its own. |
| A16 | Phase 1 was executed against a **Phase 0-lite** slice (Task 0.1 + Task 0.3 Step 1 + the body-class half of Step 2) | The hub renderer, HUD and world page consume only the design tokens, the scaffolded fonts, the `@/*` alias and the test runner. The content layer, `(site)` group, Nav/Footer, landing and project pages are still owed by Phase 0 and are *not* needed to walk the hub. Task 0.3 stays unticked below so the next executor completes it for real. |
| A17 | **AJ.exe recoloured: charcoal suit → light `#e6eaf2`, cyan visor → dark visor + cyan antenna** (Task 1.5). Measured 2026-09-15 | `BODY = "#232b3e"` is the same hex as `facility-border` and sits on room floors from `#1f2b26` to `#2e2a26`: **1.01:1** against the hub floor, i.e. the character was effectively invisible. Worse, the original separation was hue-based, which is exactly what fails colour-blind visitors, and spec §24 forbids the world being an accessibility barrier. Replacement uses only existing §4 tokens, keyed on **lightness**: `#e6eaf2` body (worst case 7.86:1 against any wall, 10.7–12.2:1 against floors), `#0b0e14` visor against the light head (~16.9:1, so the face still reads), with `#f6ad55` pack and `#4fd1c5` antenna (5.1:1 worst case) keeping the brand. Verified on **real rendered pixels**, not by eye: brightest figure pixel `#d9dbdd` vs sampled floor `#090f1c` = **13.79:1** through the browser; the Phase 1 regression gate still passes. |
| A18 | `npm run lint` is added to the standing verify gate for every task (Task 0.1 Step 9, and it belongs in AGENTS.md Commands as a gate, not just a command) | Phase 1 was reported green on `tsc` + `build` + `test` and I never ran the linter; `npm run lint` then reported 18 errors across Phase 0/1 code, including two React-hooks violations in code copied verbatim from the plan. Verification must include the linter, or "green" is only three quarters of the truth. |
| A19 | The design-system label pattern must be a JSX **string expression**, not a text node: write `{"// Projects"}`, or a template literal when interpolating (Task 0.3-0.7 updated, section 4 noted) | The plan's copy-pasteable `// Label` text nodes trip `react/jsx-no-comment-textnodes`, which eslint-config-next enables. Every page and panel in the plan uses that pattern, so this was systematic, not a one-off: 13 files affected. Rendered output is identical and no rule is disabled. |
| A20 | The `/world` capability guard is restructured (Task 1.1): detection moved from `useState` + `useEffect` in `app/world/page.tsx` into `src/world/WorldGate.tsx`, loaded through `dynamic(..., { ssr: false })` and evaluated during render | `react-hooks/set-state-in-effect` correctly flagged the plan's pattern. The effect existed only to avoid touching `window` during server render; a component that is never server-rendered does not need it. Same behaviour, one less state, one less effect, and the `ssr: false` boundary is what makes render-time detection legal. Measured: canvas attaches 1598 ms after navigation at 900x600. |
| A21 | `useKeyboard` publishes its latest handlers in an effect instead of during render (Task 1.7) | `h.current = handlers` in the render body trips `react-hooks/refs`, and it is genuinely wrong under React 19 concurrency: a discarded render would mutate the ref. Effects flush after commit, before any input event can arrive, so the behaviour is identical. |
| A22 | Task 0.7 additions: each `opengraph-image.tsx` text block is one child (`{`${site.owner.name} // RESEARCH FACILITY`}`), and the root layout sets `metadataBase` from `NEXT_PUBLIC_SITE_URL` | As written, the OG image div held two children (an expression plus text) and Satori refuses that without `display: flex`: the build failed while prerendering `/opengraph-image`. Without `metadataBase` every build warns and social previews get relative image URLs. |
| A23 | If a route file is deleted or renamed, remove `.next/dev` and `.next/types` before trusting `npx tsc --noEmit` | Next generates typed-route validators into `.next/(dev/)types`, and tsconfig includes them. A stale validator references the deleted `src/app/page.tsx` and reports `TS2307` plus a missing `LayoutProps` global, which looks like an app bug and is not one. This is why the plan's Task 0.3 Step 6 (delete the scaffold page) needs a clean cache before the next type check. |
| A24 | Real repository facts replace the plan's invented project copy (`src/content/projects.ts`, `site.ts`) | The plan's sample content described Nightfall as "built around PatchCore" using anomalib and Noctis as a generic planner/researcher/coder/tester. The actual repositories (JeremiahAdebayo/Nightfall, /Noctis) are different and considerably stronger: Nightfall hand-rolls the whole algorithm across all 15 MVTec AD categories and carries it through ONNX, INT8, gRPC, a REST gateway and an ESP32 client; Noctis is a LangGraph StateGraph with 8 named nodes, `Send` fan-out to parallel engineers and libcst node-level patching. Portfolio copy that understates or misstates the work is worse than no copy. Numbers now in content: 0.938 mean image AUROC, 0.651 PRO, 99.6 to 25.0 MB, 293 ms fp32 vs 1304 ms INT8 p50. |
| A25 | **Noctis's real agent roster is now known** and must drive Task 4.5's stations: `reset, indexer, planner, test_generator, engineer (parallel), reassembler, executor, critic` (+ `retry_router` as a gate, `debug_agent` as telemetry) | Task 4.5 guessed planner/researcher/coder/tester. Appendix D.4 forbids inventing agents for visual effect. `engineer` genuinely runs as N parallel instances via `Send`, so the room should fan several boxes out at once - that is the real architecture, and it is a better show than a linear chain. |
| A26 | **Neither project has a deployed public endpoint, so both demos are animated, not live.** Nightfall launches in mock mode (plan Option A of Task 7.2) and the `/api/inspect` proxy + backend contract stay in the plan as the upgrade path; Noctis keeps trace replay (AD-05) but the traces must come from real runs of the 8-node graph. | The v1.1 plan already allowed mock mode, but Phase 3/4's exit gates assumed "real inference" and "AJ provides sample images". Reframed: the deliverable is an honest animated demonstration (conveyor + simulated verdicts badged SAMPLE/MOCK, replayed agent traces) plus a genuine written description. Nothing in the UI may imply live inference. |
| A27 | Browser E2E must never assert on held-key duration; poll for state instead | `useFrame` clamps dt to 0.05s, so at software-GL frame rates (~9 fps) the player covers ~2 tiles/s, not the nominal 4.5. Time-based "hold W for 900 ms then expect room X" is flaky by construction - it produced three false failures while verifying Phase 2. Task 6.2's specs must hold a key until the HUD changes, with a budget. |
| A28 | `SiteContent.owner` gains an `x` field (X/Twitter URL); Contact page, site Footer and the world's About panel all list the four channels | AJ supplied real handles on 2026-09-15 and asked for X alongside email/LinkedIn. `validateContent` checks every owner field, so the field is required rather than optional - a missing link is a content bug, not a silent gap. Contact display text is derived from the URL (one source of truth). |
| A29 | In-world outbound links use a programmatic anchor click, not `window.open` (Task 1.7's `runAction`) | Measured 2026-09-15: `window.open(url, "_blank", "noopener")` silently does nothing in headless Chromium when a popup opened moments earlier (popup cooldown), while a `target="_blank"` anchor always opens. The feature string looked like the culprit until the control was re-run with one mechanism per fresh context. A GitHub link that nothing happens when you press is worse than no link, so the world now uses `rel="noopener noreferrer"` on a real anchor - same protection, reliable behaviour. |
| A30 | Text props (`sign`, `frame`, `plaque`) dispose their `CanvasTexture` on unmount (Task 1.4's `Props.tsx`) | The plan's sign code created a texture in `useMemo` and never disposed it, so every hub/lab switch leaked GPU textures - invisible in dev, cumulative in real sessions, and directly at odds with the plan's texture budget. One `useEffect` cleanup covers all text prop kinds. |

| A31 | `SiteContent.owner.location` is **deleted**, not filled (schema, content, and both renderers) | AJ's call, 2026-09-16: no location on the site. It was the register's most visible `EDIT-ME` - it rendered on `/about` and in the world's About panel - and "fill it later" had no owner and no date. Deleting the field is the honest fix: a placeholder nobody intends to fill is worse than a fact that does not exist, and `validateContent` only checks keys that are present, so no validator change was needed. |
| A32 | `public/resume.pdf` is shipped (18 KB); the "BROKEN NOW" register row is closed | `/resume.pdf` 404'd from `/resume`, the landing button and the world's resume pickup. AJ supplied the PDF on 2026-09-16, so it now sits at `site/public/resume.pdf` and the URL returns 200 `application/pdf`. It is a plain committed asset - nothing generates it at build time. |
| A33 | The timeline is transcribed from AJ's resume, and **CGPA is deliberately not shown** | AJ asked for the CGPA to stay off the site even though his resume lists it. Timeline rows come from the resume's EXPERIENCE and EDUCATION sections and claim only what the resume claims: UniK Connect (March-August 2026), OpenGov Africa (August 2025-present), B.Sc. Information Technology at the University of Ilorin (expected 2027). The study year reads "Final year" rather than "fourth year" because "final year" is what a reader can act on without knowing the programme's length. NOTE: the shipped PDF still says "Third Year" - AJ should regenerate it. |

| A34 | Animated set-pieces share the player's frame-rate clamp: their wall-clock duration is not their nominal duration | The player has been clamped since A27 (`useFrame` caps dt at 0.05s), and the Nightfall belt inherits it. Under SwiftShader the belt's 12.2s cycle takes 17-20s of wall time, so anything that waits for a nominal duration sees the wrong number of beats. Probes must poll for an observable signal (a card's photo being fetched), never sleep for the cycle length. This is also why the cycle reads as "slow" on a software renderer and normal on real hardware. |
| A35 | Which categories the belt shows is AJ's choice of photos; the published numbers always follow the category | AJ supplied bottle, cable and wood. The plan had bottle, cable, grid. Grid (0.799/0.558) and wood (0.954/0.779) are different MVTec categories, so the card was rewritten to wood rather than reusing grid's row under a wood photo - a published result attached to the wrong category is worse than a missing card. Same rule as D.4: a room that under-claims beats one that over-claims. |

| A36 | The room camera zooms by **field of view** (45° hub → 36° room), and the rig is higher for every room: `(0, 11.5, 6.2)` instead of `(0, 10, 8)` | AJ, 2026-09-16: "the cameras in the rooms are too distant, I can barely see the writings on the wall". Two measured constraints rather than taste. (1) Moving the camera closer re-composes the shot: the camera frames the player and the room's content is 6-8 tiles in front of it, so pulling in pushed the belt off the top of the screen. Narrowing the fov magnifies everything without re-framing. (2) The rig must see *over* the wall between it and the player. The camera always sits south, so at the old 10/8 the player vanished completely behind the south wall for any tile south of z≈10.7 - a bug that predates this work and was invisible because the doorway gap happens to sit at x=9 where everyone spawns. Clearing a 3-tall wall from behind the player forces a pitch above ~57°, which is why the rig is steep. Honest caveat: the wall frames are on *side* walls, so a fixed south-facing camera always views them at a grazing angle. That, not distance, is the main reason wall copy is hard to read; fixing it properly means either rotating the camera with the player or moving the frames to the north wall. |
| A37 | A photo texture must land on a **freshly mounted material**: a keyed mesh, never one mesh whose material gains a `map` later | Measured 2026-09-16. A `<mesh>` whose `<meshBasicMaterial>` is compiled without a `map` and then receives one renders the texture **black** - R3F reconciles by element type, reuses the material instance, and never rebuilds the shader for the new sampler. AJ's report ("the images are not showing, only cards") was this: the bottle photo drew as a black rectangle on the product face and the display. Isolated by putting the card texture on the same plane (renders) and a flat colour (renders). Fix: the mapped mesh carries its own `key`, so it mounts fresh. Also, the photos are shown at their own aspect instead of being resampled through a 4:3 canvas with a cover-crop - the resample bought nothing and the canvas path only works when the texture is built during render. |
| A38 | Doorways are **three tiles wide**, every tile of an opening is a door entry, and a lintel prop closes the wall above the sign | AJ, 2026-09-16: the doors were too small. The opening was a single tile ('D' in the map, no wall rendered, so the "door" was a one-tile hole). Three is not arbitrary: the hub's midline is the odd tile x=9, so 2 would sit half a tile off-centre, and 3 is exactly the width of the door signs that already hang over each opening - they now read as the header. The lintel (behind the sign, 0.7 deep so it never intersects it) exists because a 3-wide hole would otherwise leave 0.2 of nothing above the sign. |

New decisions AD-15 → AD-18 are in §2 above. Everything else in §0–§4 stands as written.

---

## 3. Complete File Map

Repo root:

```text
portfolio/                          # repo root (git init here)
├── Portfolio Experience Design Specification.md   # existing spec — do not modify
├── AGENTS.md                       # Task 0.1 — executor rules for this repo
├── .gitignore                      # Task 0.1
├── docs/superpowers/plans/2026-09-14-portfolio-revised-plan.md   # this file
└── site/                           # create-next-app output
    ├── package.json
    ├── next.config.ts
    ├── vitest.config.ts
    ├── playwright.config.ts
    ├── .env.example
    ├── public/
    │   ├── samples/                # Nightfall sample images (Appendix D)
    │   └── resume.pdf              # AJ provides (Appendix D)
    ├── tests/e2e/smoke.spec.ts
    └── src/
        ├── app/
        │   ├── layout.tsx          # root layout: fonts, metadata, html/body only
        │   ├── globals.css         # Tailwind v4 + design tokens
        │   ├── (site)/             # standard pages — Nav+Footer via group layout
        │   │   ├── layout.tsx
        │   │   ├── page.tsx        # landing (AD-03)
        │   │   ├── projects/page.tsx
        │   │   ├── projects/[slug]/page.tsx
        │   │   ├── research/page.tsx
        │   │   ├── about/page.tsx
        │   │   ├── resume/page.tsx
        │   │   └── contact/page.tsx
        │   ├── world/page.tsx      # standalone full-screen (no Nav/Footer)
        │   ├── api/inspect/route.ts
        │   ├── sitemap.ts
        │   ├── robots.ts
        │   ├── opengraph-image.tsx
        │   ├── error.tsx
        │   └── not-found.tsx
        ├── components/
        │   ├── site/Nav.tsx
        │   ├── site/Footer.tsx
        │   ├── site/ProjectCard.tsx
        │   ├── project/ProjectSections.tsx   # shared: standard page + world panel
        │   ├── project/ProjectPanel.tsx      # world overlay wrapper
        │   ├── demo/InspectDemo.tsx          # Nightfall demo UI
        │   ├── demo/heatmap.ts               # simulated heatmap canvas util
        │   └── hud/                           # world DOM overlay (all React, no 3D)
        │       ├── Hud.tsx
        │       ├── PromptBar.tsx
        │       ├── PauseMenu.tsx
        │       ├── PanelHost.tsx
        │       ├── TransitionOverlay.tsx
        │       └── WorldFallback.tsx
        ├── content/
        │   ├── types.ts
        │   ├── site.ts             # owner, research, timeline
        │   ├── projects.ts         # nightfall, noctis entries
        │   └── validate.ts
        ├── lib/
        │   ├── rate-limit.ts
        │   └── demo-results.ts     # InspectResult type + mock generator (shared client/server)
        └── world/
            ├── types.ts            # RoomDef, PropDef, InteractableDef, Action...
            ├── store.ts            # zustand
            ├── input.ts            # keyboard + getMoveDir
            ├── collision.ts        # GridMap + movement
            ├── rooms.ts            # registry + tileAt + door lookup
            ├── actions.ts          # runAction + goThroughDoor
            ├── textures.ts         # makeSignTexture, ScreenTexture, grid texture
            ├── WorldCanvas.tsx     # Canvas + guards + HUD mounting
            ├── Scene.tsx           # room composition
            ├── Floor.tsx
            ├── Walls.tsx
            ├── Props.tsx
            ├── Character.tsx
            ├── CameraRig.tsx
            ├── PlayerController.tsx
            ├── InteractionSystem.tsx
            ├── rooms/
            │   ├── hub.ts
            │   ├── nightfall.ts
            │   ├── noctis.ts
            │   ├── about.ts
            │   └── research.ts
            └── noctis/
                ├── trace-player.ts
                ├── trace-types.ts
                ├── AgentStation.tsx
                └── ArtifactBox.tsx
```

Tests are colocated as `*.test.ts` next to the module under `src/` (vitest `include: ['src/**/*.test.ts']`).

## 3a. Files added by v1.1 (Phases 3.3 → 7.4)

These paths are as authoritative as §3. Nothing else may be created.

```text
site/
├── playwright.config.ts                   # Task 6.2 — v1.0 GAP: §3 listed it, no task created it
├── tests/e2e/smoke.spec.ts                # Task 6.2 — same gap
├── tests/e2e/world.spec.ts                # Task 6.2 — world + demo flows
├── scripts/check-content.mjs              # Task 6.5 — EDIT-ME / empty-field launch gate
├── src/components/a11y/SkipLink.tsx       # Task 6.1
├── src/components/demo/InspectDemo.tsx    # Task 3.7 — Nightfall demo UI (§3 listed it, never created)
├── src/components/demo/heatmap.ts         # Task 3.6 (§3 listed it, never created)
├── src/components/demo/downscale.ts       # Task 3.6 — resize before upload (2 MB budget)
├── src/components/noctis/NoctisConsole.tsx# Task 4.6 — replay controls panel
├── src/lib/hash.ts                        # Task 3.4 — FNV-1a + seeded PRNG
├── src/lib/rate-limit.ts                  # Task 3.4 (§3 listed it, never created)
├── src/lib/demo-results.ts                # Task 3.4 — InspectResult, mock, backend parser
├── src/app/api/inspect/route.ts           # Task 3.5 (§3 listed it, never created)
├── src/world/rooms.test.ts                # Task 3.3 — room data validator (AD-17)
├── src/world/nightfall/SampleRail.tsx     # Task 3.8
├── src/world/noctis/
│   ├── traces.ts                          # Task 4.1 — embedded recorded traces
│   ├── validate-trace.ts                  # Task 4.2 — trace schema guard
│   ├── trace-player.ts                    # Task 4.3 (§3) — pure clock → world state
│   ├── store.ts                           # Task 4.4 — playback controls (AD-16)
│   ├── AgentStation.tsx                   # Task 4.4 (§3)
│   ├── ArtifactBox.tsx                    # Task 4.4 (§3)
│   └── TraceDirector.tsx                  # Task 4.5 — clock driver, stations, handoffs
├── src/content/samples.ts                  # Task 3.7 — demo sample list (Appendix D.2)
└── src/world/rooms/research.ts, about.ts   # Tasks 5.1 / 5.2 (§3 already lists both)
```

**Route groups:** `(site)` never appears in URLs — `/projects` is `app/(site)/projects/page.tsx`. The world page sits outside the group so it renders full-screen without site chrome.

---

## 4. Design System (locked — do not improvise styles)

### Palette

| Token | Hex | Use |
|---|---|---|
| `facility-bg` | `#0b0e14` | page background |
| `facility-surface` | `#131826` | cards, panels |
| `facility-border` | `#232b3e` | borders, dividers |
| `facility-text` | `#e6eaf2` | body text |
| `facility-muted` | `#8b94a7` | secondary text |
| `accent` | `#4fd1c5` | facility cyan — primary accent, links, CTAs |
| `anomaly` | `#e5534b` | errors, anomaly states |
| `warn` | `#f6ad55` | warnings, degraded/demo-notice badges |
| `ok` | `#48bb78` | success, NORMAL states, Noctis accent |

Restrained on purpose (spec §18: "designed rather than decorated"). No gradients, no glow, no glassmorphism. Accent color is used sparingly — labels, links, one CTA per view.

### Typography

- Geist Sans (body, headings) and Geist Mono (labels, code, terminal text) via `next/font/google`.
- Label pattern: `font-mono text-xs uppercase tracking-widest text-facility-muted` with a `//` prefix (e.g. `// Projects`).
- Headings: `font-semibold`; page H1 `text-3xl`/`text-4xl`, section H2 inside `Section` component.

### Component recipes (copy these class strings)

| Element | Classes |
|---|---|
| Card / panel | `rounded-lg border border-facility-border bg-facility-surface p-5` |
| Primary button | `rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg hover:opacity-90` |
| Ghost button | `rounded-md border border-facility-border px-5 py-3 font-mono text-sm hover:border-accent` |
| Chip | `rounded border border-facility-border px-2 py-1 font-mono text-xs` |
| Page container | `mx-auto max-w-5xl px-6 py-16` (narrow pages: `max-w-3xl`) |
| Section label | `font-mono text-xs uppercase tracking-widest text-facility-muted` |

### World room palettes (used from Phase 1 on)

| Room | floor | wall | accent | trim |
|---|---|---|---|---|
| hub | `#2a3242` | `#3b465c` | `#4fd1c5` | `#8b94a7` |
| nightfall | `#2e2a26` | `#4a4038` | `#f6ad55` | `#b08968` |
| noctis | `#1f2b26` | `#31423a` | `#48bb78` | `#6b9c8a` |
| about | `#2f2c33` | `#443f4a` | `#cbd5e1` | `#9aa2b1` |
| research | `#262b33` | `#38414e` | `#7f9cf5` | `#a0aec0` |

---

# Phase 0 — Foundation: shippable standard portfolio

**Goal:** A complete, deployed, conventional portfolio where every page renders from the content layer. This is the escape hatch (spec §8), the mobile experience (AD-04), and the SEO surface. It ships **before** any 3D exists.

**Exit gate (all must be true before starting Phase 1):**

- [x] `npm run build` and `npm run test` green in `site/`
- [ ] Staging URL deployed on Vercel; every route returns 200
- [ ] Landing Lighthouse Performance ≥ 90
- [x] Editing `src/content/projects.ts` changes the site (proves AD-01)

### Task 0.1: Scaffold + tooling + repo rules

**Files:**
- Create: `site/` (create-next-app output), root `.gitignore`, root `AGENTS.md`, `site/vitest.config.ts`, `site/.env.example`
- Modify: `site/package.json` (scripts), `site/AGENTS.md` (scaffolded — point it at this plan)

**Interfaces:**
- Produces: runnable Next.js app at `site/`, test runner (`npm run test`), type check (`npx tsc --noEmit`), git repo at root.

- [x] **Step 0: Pre-flight.** Run `node -v`. Expected: `v22.12` or higher (Next 16 needs ≥20.9; Vitest 5 needs ≥22.12). If lower, stop and report — do not proceed.

- [x] **Step 1: Scaffold.** From repo root (`C:\Users\Jeremiah\scripts\portfolio`), run:

```powershell
npx create-next-app@latest site --typescript --tailwind --eslint --app --src-dir --use-npm --disable-git --yes
```

Expected: `site/` created, dependencies installed, no prompts. If prompted despite `--yes`, answer: TypeScript / ESLint / Tailwind / src dir / App Router / default import alias / AGENTS.md yes / React Compiler **no**.

- [x] **Step 2: Pin React to 19.2.x (mandatory).** `@react-three/fiber@9.7.0` peers `react >=19 <19.3`; the scaffold installs 19.3.x which violates it. From `site/`:

```powershell
npm install react@~19.2.0 react-dom@~19.2.0
```

Expected: installs cleanly, `package.json` shows `"react": "~19.2.0"`.

- [x] **Step 3: Install world + test dependencies.** From `site/`:

```powershell
npm install three@0.186.0 @react-three/fiber@9.7.0 zustand@5.0.15
npm install -D @types/three vitest @playwright/test
npx playwright install chromium
```

- [x] **Step 4: Create `site/vitest.config.ts`** exactly:

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

- [x] **Step 5: Add scripts to `site/package.json`.** The `scripts` block must contain exactly these entries (keep any scaffold entries not listed here, e.g. `lint`):

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "e2e": "playwright test"
}
```

- [x] **Step 6: Create root `.gitignore`:**

```text
node_modules/
.next/
out/
test-results/
playwright-report/
.env
.env.*
!.env.example
*.tsbuildinfo
.DS_Store
```

- [x] **Step 7: Create root `AGENTS.md`:**

```markdown
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
```

Then edit the scaffolded `site/AGENTS.md` to contain a single line: `See ../AGENTS.md — repo-wide rules apply, plus the implementation plan at ../docs/superpowers/plans/2026-09-14-portfolio-revised-plan.md.`

- [x] **Step 8: Create `site/.env.example`:**

```text
# Nightfall inference backend. Leave NIGHTFALL_API_URL unset to use built-in mock mode.
NIGHTFALL_API_URL=
NIGHTFALL_API_KEY=
NIGHTFALL_MOCK=1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [x] **Step 9: Verify.** From `site/`:

```powershell
npm run build
npx tsc --noEmit
npx vitest --version
```

Expected: build succeeds; tsc reports nothing; vitest prints `v5.x.x`.

- [x] **Step 10: Init git and commit.** From repo root:

```powershell
git init
git add -A
git commit -m "chore: scaffold Next.js 16 site with pinned world deps"
```

### Task 0.2: Content layer + validation (TDD)

**Files:**
- Create: `site/src/content/types.ts`, `site/src/content/site.ts`, `site/src/content/projects.ts`, `site/src/content/validate.ts`
- Test: `site/src/content/validate.test.ts`

**Interfaces:**
- Produces: `SiteContent` and `Project` types (below), `site: SiteContent`, `projects: Project[]`, and `validateContent(content: SiteContent): string[]` (returns `[]` when valid). Every later task that renders content consumes these.

**EDIT-ME rule:** `EDIT-ME` markers are the **only** placeholders allowed in this repo. They mark facts only AJ can supply (real metrics, URLs, bio) and are catalogued in Appendix D. Structure, fields, and all other values are final. The Phase 6 launch gate fails if any `EDIT-ME` remains.

- [x] **Step 1: Write the failing test** — `site/src/content/validate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateContent } from "./validate";
import { site } from "./site";
import { projects } from "./projects";

describe("validateContent", () => {
  it("passes for the real site content", () => {
    expect(validateContent({ ...site, projects })).toEqual([]);
  });

  it("reports duplicate slugs, empty names, and missing links", () => {
    const bad = {
      ...site,
      projects: [{ ...projects[0] }, { ...projects[0], name: "", links: [] }],
    };
    const errors = validateContent(bad);
    expect(errors.some((e) => e.includes('duplicate "nightfall"'))).toBe(true);
    expect(errors.some((e) => e.includes("projects[1].name"))).toBe(true);
    expect(errors.some((e) => e.includes("projects[1].links"))).toBe(true);
  });
});
```

- [x] **Step 2: Run it to verify it fails.** From `site/`:

```powershell
npm run test
```

Expected: FAIL — cannot resolve `./validate` / `./site` / `./projects`.

- [x] **Step 3: Write `site/src/content/types.ts`:**

```ts
export interface Link {
  label: string;
  href: string;
}

export interface Metric {
  label: string;
  value: string;
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  problem: string;
  approach: string;
  technologies: string[];
  metrics: Metric[];
  limitations: string;
  links: Link[];
  demo: "nightfall" | "noctis" | null;
  room: {
    title: string;
    subtitle: string;
    accent: string;
  };
}

export interface ResearchStation {
  title: string;
  summary: string;
  links: Link[];
}

export interface TimelineEntry {
  period: string;
  title: string;
  org: string;
  note?: string;
}

export interface SiteContent {
  owner: {
    name: string;
    title: string;
    tagline: string;
    location: string;
    email: string;
    github: string;
    linkedin: string;
    resumeUrl: string;
  };
  research: ResearchStation[];
  timeline: TimelineEntry[];
}
```

- [x] **Step 4: Write `site/src/content/validate.ts`:**

```ts
import type { Project, SiteContent } from "./types";

const PROJECT_TEXT_FIELDS = [
  "name",
  "tagline",
  "summary",
  "problem",
  "approach",
  "limitations",
] as const;

export function validateProject(p: Project, index: number): string[] {
  const errors: string[] = [];
  const at = `projects[${index}]`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) {
    errors.push(`${at}.slug: must be lowercase kebab-case, got "${p.slug}"`);
  }
  for (const field of PROJECT_TEXT_FIELDS) {
    if (!p[field]?.trim()) errors.push(`${at}.${field}: required`);
  }
  if (p.technologies.length === 0) errors.push(`${at}.technologies: at least one required`);
  if (p.metrics.length < 1 || p.metrics.length > 4) errors.push(`${at}.metrics: 1-4 required`);
  if (p.links.length === 0) errors.push(`${at}.links: at least one (GitHub or demo)`);
  if (p.demo !== null && p.demo !== "nightfall" && p.demo !== "noctis") {
    errors.push(`${at}.demo: must be "nightfall", "noctis", or null`);
  }
  return errors;
}

export function validateContent(content: SiteContent): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(content.owner)) {
    if (typeof value === "string" && !value.trim()) errors.push(`owner.${key}: required`);
  }
  const slugs = new Set<string>();
  content.projects.forEach((p, i) => {
    errors.push(...validateProject(p, i));
    if (slugs.has(p.slug)) errors.push(`projects[${i}].slug: duplicate "${p.slug}"`);
    slugs.add(p.slug);
  });
  if (content.projects.length === 0) errors.push("projects: at least one required");
  content.research.forEach((r, i) => {
    if (!r.title?.trim() || !r.summary?.trim()) {
      errors.push(`research[${i}]: title and summary required`);
    }
  });
  content.timeline.forEach((t, i) => {
    if (!t.period?.trim() || !t.title?.trim() || !t.org?.trim()) {
      errors.push(`timeline[${i}]: period, title, org required`);
    }
  });
  return errors;
}
```

- [x] **Step 5: Write `site/src/content/site.ts`:**

```ts
import type { SiteContent } from "./types";

export const site: SiteContent = {
  owner: {
    name: "AJ",
    title: "EDIT-ME: e.g. Machine Learning Engineer",
    tagline: "EDIT-ME: one sentence — what you build and why it matters.",
    location: "EDIT-ME: City, Country",
    email: "EDIT-ME@example.com",
    github: "https://github.com/EDIT-ME",
    linkedin: "https://www.linkedin.com/in/EDIT-ME",
    resumeUrl: "/resume.pdf",
  },
  research: [
    {
      title: "Computer Vision",
      summary: "EDIT-ME: 1-2 sentences — anomaly detection, industrial inspection.",
      links: [],
    },
    { title: "Machine Learning", summary: "EDIT-ME: current focus.", links: [] },
    { title: "3D Vision", summary: "EDIT-ME: current focus.", links: [] },
    { title: "Systems", summary: "EDIT-ME: current focus.", links: [] },
  ],
  timeline: [
    {
      period: "EDIT-ME: 2023–now",
      title: "EDIT-ME: Role",
      org: "EDIT-ME: Company",
      note: "EDIT-ME: one-line impact",
    },
  ],
};
```

- [x] **Step 6: Write `site/src/content/projects.ts`:**

```ts
import type { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "nightfall",
    name: "Nightfall",
    tagline: "Visual anomaly detection for industrial inspection.",
    summary:
      "Nightfall is a visual anomaly detection system built around PatchCore. It inspects product images, flags defects, and produces anomaly heatmaps showing where the model looked.",
    problem:
      "Manual visual inspection is slow, inconsistent, and expensive. Supervised defect classifiers also need labeled examples of every defect class — which real factories rarely have.",
    approach:
      "Unsupervised anomaly detection: learn the distribution of normal products only, then flag deviations. PatchCore with a pretrained feature extractor, a memory bank of normal patch features, and nearest-neighbor scoring at inference time.",
    technologies: ["PyTorch", "PatchCore", "ONNX Runtime", "FastAPI"],
    metrics: [
      { label: "Inference", value: "EDIT-ME: e.g. 112 ms" },
      { label: "Detection", value: "EDIT-ME: e.g. 99.1% AUROC" },
      { label: "Dataset", value: "EDIT-ME: dataset name" },
    ],
    limitations:
      "Unsupervised detectors flag any deviation from normal — including benign process variation. Camera angle and lighting must stay consistent with training conditions.",
    links: [{ label: "GitHub", href: "https://github.com/EDIT-ME/nightfall" }],
    demo: "nightfall",
    room: {
      title: "VISION LAB",
      subtitle: "Visual Anomaly Detection",
      accent: "#f6ad55",
    },
  },
  {
    slug: "noctis",
    name: "Noctis",
    tagline: "A multi-agent system for autonomous engineering tasks.",
    summary:
      "Noctis decomposes an engineering task across cooperating agents — planning, research, implementation, and testing — with explicit work handoffs between them.",
    problem:
      "Single-shot LLM calls fail on tasks that need planning, context gathering, and verification. The interesting problem is orchestration: how agents hand off, what context travels with the work, and how results get verified.",
    approach:
      "A planner decomposes the task into work packages. Specialist agents (research, code, test) process each package and hand the artifact to the next stage. Every handoff is explicit and observable.",
    technologies: ["Python", "LangGraph", "EDIT-ME: agent framework"],
    metrics: [
      { label: "Agents", value: "EDIT-ME: e.g. 4" },
      { label: "EDIT-ME: metric", value: "EDIT-ME: value" },
    ],
    limitations:
      "Quality depends on task decomposition; long tasks accumulate context drift. The public demo replays recorded runs rather than executing live.",
    links: [{ label: "GitHub", href: "https://github.com/EDIT-ME/noctis" }],
    demo: "noctis",
    room: {
      title: "AGENT LAB",
      subtitle: "Multi-Agent AI Laboratory",
      accent: "#48bb78",
    },
  },
];
```

- [x] **Step 7: Run the test to verify it passes.** From `site/`: `npm run test`. Expected: 2 passed.

- [x] **Step 8: Commit.**

```powershell
git add site/src/content
git commit -m "feat: typed content layer with validation"
```

### Task 0.3: Design tokens, root layout, site chrome

> **Status 2026-09-14: partially executed, deliberately.** Step 1 is done exactly as written (tokens are live and the world/HUD already consume them), and `layout.tsx` gained the `min-h-screen bg-facility-bg font-sans text-facility-text antialiased` body classes only. Steps 2's metadata/`site.owner` import, 3, 4, 5 and 6 are **still owed** — they need the content layer (Task 0.2), which Phase 1 does not require. Do not treat this task as done because Phase 1 shipped.

**Files:**
- Modify: `site/src/app/globals.css`, `site/src/app/layout.tsx`
- Create: `site/src/app/(site)/layout.tsx`, `site/src/components/site/Nav.tsx`, `site/src/components/site/Footer.tsx`
- Delete: the scaffolded `site/src/app/page.tsx` (recreated in Task 0.4 inside `(site)/`)

**Interfaces:**
- Produces: Tailwind tokens as utilities (`bg-facility-bg`, `text-facility-muted`, `border-facility-border`, `text-accent`, `bg-anomaly`, `text-warn`, `text-ok`, `font-mono`), `Nav`, `Footer`. All later UI uses only these.

- [x] **Step 1: Replace `site/src/app/globals.css`** (keep the `@import "tailwindcss";` line, replace the rest):

```css
@import "tailwindcss";

@theme {
  --color-facility-bg: #0b0e14;
  --color-facility-surface: #131826;
  --color-facility-border: #232b3e;
  --color-facility-text: #e6eaf2;
  --color-facility-muted: #8b94a7;
  --color-accent: #4fd1c5;
  --color-anomaly: #e5534b;
  --color-warn: #f6ad55;
  --color-ok: #48bb78;
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, "Cascadia Mono", monospace;
}

html {
  color-scheme: dark;
}

body {
  background-color: var(--color-facility-bg);
  color: var(--color-facility-text);
}

::selection {
  background: var(--color-accent);
  color: var(--color-facility-bg);
}
```

- [x] **Step 2: Replace `site/src/app/layout.tsx`:**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: `${site.owner.name} — ${site.owner.title}`,
    template: `%s — ${site.owner.name}`,
  },
  description: site.owner.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-facility-bg font-sans text-facility-text antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [x] **Step 3: Create `site/src/app/(site)/layout.tsx`:**

```tsx
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

- [x] **Step 4: Create `site/src/components/site/Nav.tsx`:**

```tsx
import Link from "next/link";
import { site } from "@/content/site";

const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  return (
    <header className="border-b border-facility-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-widest text-facility-text"
        >
          {site.owner.name} <span className="text-accent">//</span> FACILITY
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm text-facility-muted">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-accent">
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/world"
          className="ml-auto rounded-md border border-accent px-3 py-1.5 font-mono text-sm text-accent hover:bg-accent hover:text-facility-bg"
        >
          ENTER WORLD
        </Link>
      </div>
    </header>
  );
}
```

- [x] **Step 5: Create `site/src/components/site/Footer.tsx`:**

```tsx
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-facility-border">
      <div className="mx-auto flex max-w-5xl flex-wrap gap-4 px-6 py-8 font-mono text-sm text-facility-muted">
        <span>
          © {new Date().getFullYear()} {site.owner.name}
        </span>
        <a href={`mailto:${site.owner.email}`} className="hover:text-accent">
          {site.owner.email}
        </a>
        <a
          href={site.owner.github}
          target="_blank"
          rel="noreferrer"
          className="hover:text-accent"
        >
          GitHub
        </a>
        <a
          href={site.owner.linkedin}
          target="_blank"
          rel="noreferrer"
          className="hover:text-accent"
        >
          LinkedIn
        </a>
        <span className="ml-auto">Next.js · three.js · React Three Fiber</span>
      </div>
    </footer>
  );
}
```

- [x] **Step 6: Delete the scaffolded `site/src/app/page.tsx`** (it moves to `(site)/page.tsx` in Task 0.4):

```powershell
Remove-Item site\src\app\page.tsx
```

- [x] **Step 7: Verify.** From `site/`: `npm run build`. Expected: build succeeds (Next may warn about no root page — that is fine until Task 0.4).

- [x] **Step 8: Commit.**

```powershell
git add -A
git commit -m "feat: design tokens, root layout, nav and footer"
```

### Task 0.4: Landing page

**Files:**
- Create: `site/src/app/(site)/page.tsx`, `site/src/components/site/ProjectCard.tsx`

**Interfaces:**
- Consumes: `site`, `projects` from `@/content/*`.
- Produces: `ProjectCard` (reused on `/projects`).

- [x] **Step 1: Create `site/src/components/site/ProjectCard.tsx`:**

```tsx
import Link from "next/link";
import type { Project } from "@/content/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group rounded-lg border border-facility-border bg-facility-surface p-5 transition-colors hover:border-accent"
    >
      <p
        className="font-mono text-xs tracking-widest"
        style={{ color: project.room.accent }}
      >
        {project.room.title}
      </p>
      <h3 className="mt-2 text-xl font-semibold group-hover:text-accent">
        {project.name}
      </h3>
      <p className="mt-1 text-sm text-facility-muted">{project.tagline}</p>
      {project.demo && (
        <p className="mt-3 inline-block rounded border border-facility-border px-2 py-0.5 font-mono text-xs text-accent">
          INTERACTIVE DEMO
        </p>
      )}
    </Link>
  );
}
```

- [x] **Step 2: Create `site/src/app/(site)/page.tsx`:**

```tsx
import Link from "next/link";
import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { ProjectCard } from "@/components/site/ProjectCard";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-sm tracking-widest text-accent">
        {site.owner.name} // RESEARCH FACILITY
      </p>
      <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
        {site.owner.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-facility-muted">
        {site.owner.tagline}
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/world"
          className="rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg hover:opacity-90"
        >
          [ ENTER FACILITY ]
        </Link>
        <a
          href={site.owner.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-facility-border px-5 py-3 font-mono text-sm hover:border-accent"
        >
          GitHub
        </a>
        <Link
          href="/resume"
          className="rounded-md border border-facility-border px-5 py-3 font-mono text-sm hover:border-accent"
        >
          Resume
        </Link>
        <Link
          href="/contact"
          className="rounded-md border border-facility-border px-5 py-3 font-mono text-sm hover:border-accent"
        >
          Contact
        </Link>
      </div>

      <section className="mt-16">
        <h2 className="font-mono text-xs uppercase tracking-widest text-facility-muted">
          // Projects
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [x] **Step 3: Verify.** From `site/`: `npm run dev`, open `http://localhost:3000`. Expected: dark page, name/title/tagline, four buttons, both project cards, Nav + Footer. Then `npm run build` — succeeds.

- [x] **Step 4: Commit.**

```powershell
git add -A
git commit -m "feat: landing page and project cards"
```

### Task 0.5: Projects index + project detail pages

**Files:**
- Create: `site/src/app/(site)/projects/page.tsx`, `site/src/app/(site)/projects/[slug]/page.tsx`, `site/src/components/project/ProjectSections.tsx`

**Interfaces:**
- Produces: `ProjectSections({ project }: { project: Project })` — the shared body used by BOTH the standard project page and the world's project panel (Phase 2). Do not inline its sections anywhere.

- [x] **Step 1: Create `site/src/app/(site)/projects/page.tsx`:**

```tsx
import type { Metadata } from "next";
import { projects } from "@/content/projects";
import { ProjectCard } from "@/components/site/ProjectCard";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">
        // Projects
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Things I built</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </div>
  );
}
```

- [x] **Step 2: Create `site/src/components/project/ProjectSections.tsx`:**

```tsx
import type { Project } from "@/content/types";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-mono text-xs uppercase tracking-widest text-facility-muted">
        // {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ProjectSections({ project }: { project: Project }) {
  return (
    <>
      <Section title="Overview">
        <p>{project.summary}</p>
      </Section>
      <Section title="Problem">
        <p>{project.problem}</p>
      </Section>
      <Section title="Approach">
        <p>{project.approach}</p>
      </Section>
      <Section title="Technologies">
        <ul className="flex flex-wrap gap-2">
          {project.technologies.map((t) => (
            <li
              key={t}
              className="rounded border border-facility-border px-2 py-1 font-mono text-xs"
            >
              {t}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Metrics">
        <dl className="grid gap-3 sm:grid-cols-3">
          {project.metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-facility-border bg-facility-surface p-4"
            >
              <dt className="font-mono text-xs uppercase text-facility-muted">
                {m.label}
              </dt>
              <dd className="mt-1 font-mono text-lg text-accent">{m.value}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section title="Limitations">
        <p>{project.limitations}</p>
      </Section>
      <Section title="Links">
        <ul className="flex flex-wrap gap-3 font-mono text-sm">
          {project.links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
```

- [x] **Step 3: Create `site/src/app/(site)/projects/[slug]/page.tsx`:**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/content/projects";
import { ProjectSections } from "@/components/project/ProjectSections";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  return {
    title: project ? project.name : "Project",
    description: project?.tagline,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p
        className="font-mono text-xs uppercase tracking-widest"
        style={{ color: project.room.accent }}
      >
        {project.room.title} — {project.room.subtitle}
      </p>
      <h1 className="mt-2 text-4xl font-semibold">{project.name}</h1>
      <p className="mt-2 text-lg text-facility-muted">{project.tagline}</p>
      {project.demo && (
        <Link
          href={`/world?room=${project.slug}`}
          className="mt-6 inline-block rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg hover:opacity-90"
        >
          [ ENTER THE LAB ]
        </Link>
      )}
      <div className="mt-6">
        <ProjectSections project={project} />
      </div>
    </article>
  );
}
```

- [x] **Step 4: Verify.** Dev server: `/projects` lists both; `/projects/nightfall` shows all sections; `/projects/does-not-exist` → 404 page. `npm run build` succeeds.

- [x] **Step 5: Commit.**

```powershell
git add -A
git commit -m "feat: projects index and shared project sections"
```

### Task 0.6: About, Research, Resume, Contact

**Files:**
- Create: `site/src/app/(site)/about/page.tsx`, `site/src/app/(site)/research/page.tsx`, `site/src/app/(site)/resume/page.tsx`, `site/src/app/(site)/contact/page.tsx`

- [x] **Step 1: `about/page.tsx`:**

```tsx
import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">
        // About
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{site.owner.name}</h1>
      <p className="mt-1 text-facility-muted">
        {site.owner.title} · {site.owner.location}
      </p>
      <p className="mt-6">{site.owner.tagline}</p>
      <h2 className="mt-10 font-mono text-xs uppercase tracking-widest text-facility-muted">
        // Timeline
      </h2>
      <ul className="mt-4 space-y-4">
        {site.timeline.map((t) => (
          <li
            key={`${t.period}-${t.title}`}
            className="rounded-lg border border-facility-border bg-facility-surface p-4"
          >
            <p className="font-mono text-xs text-accent">{t.period}</p>
            <p className="mt-1 font-semibold">
              {t.title} · {t.org}
            </p>
            {t.note && (
              <p className="mt-1 text-sm text-facility-muted">{t.note}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [x] **Step 2: `research/page.tsx`:**

```tsx
import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Research" };

export default function ResearchPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">
        // Research
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Research stations</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {site.research.map((r) => (
          <div
            key={r.title}
            className="rounded-lg border border-facility-border bg-facility-surface p-5"
          >
            <h2 className="font-mono text-sm font-bold tracking-widest text-accent">
              {r.title.toUpperCase()}
            </h2>
            <p className="mt-2 text-sm text-facility-muted">{r.summary}</p>
            {r.links.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-3 font-mono text-xs">
                {r.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline"
                    >
                      {l.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [x] **Step 3: `resume/page.tsx`:**

```tsx
import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Resume" };

export default function ResumePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">
        // Resume
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Resume</h1>
      <p className="mt-4 text-facility-muted">
        Full CV with experience, education, and publications.
      </p>
      <a
        href={site.owner.resumeUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-block rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg hover:opacity-90"
      >
        [ DOWNLOAD PDF ]
      </a>
      <h2 className="mt-10 font-mono text-xs uppercase tracking-widest text-facility-muted">
        // Quick history
      </h2>
      <ul className="mt-4 space-y-3">
        {site.timeline.map((t) => (
          <li key={`${t.period}-${t.title}`} className="font-mono text-sm">
            <span className="text-accent">{t.period}</span> — {t.title},{" "}
            {t.org}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [x] **Step 4: `contact/page.tsx`:**

```tsx
import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const channels = [
    { label: "Email", href: `mailto:${site.owner.email}`, value: site.owner.email },
    { label: "GitHub", href: site.owner.github, value: "github.com/EDIT-ME" },
    {
      label: "LinkedIn",
      href: site.owner.linkedin,
      value: "linkedin.com/in/EDIT-ME",
    },
  ];
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">
        // Contact
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Open a channel</h1>
      <p className="mt-4 text-facility-muted">
        Email is fastest. No forms, no friction.
      </p>
      <a
        href={`mailto:${site.owner.email}`}
        className="mt-6 inline-block rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg hover:opacity-90"
      >
        [ SEND EMAIL ]
      </a>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target={c.label === "Email" ? undefined : "_blank"}
            rel="noreferrer"
            className="rounded-lg border border-facility-border bg-facility-surface p-4 hover:border-accent"
          >
            <p className="font-mono text-xs uppercase text-facility-muted">
              {c.label}
            </p>
            <p className="mt-1 truncate font-mono text-sm text-accent">
              {c.value}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
```

- [x] **Step 5: Verify.** Dev server: all four pages render from content data. `npm run build` succeeds.

- [x] **Step 6: Commit.**

```powershell
git add -A
git commit -m "feat: about, research, resume, contact pages"
```

### Task 0.7: SEO, error pages, metadata

**Files:**
- Create: `site/src/app/sitemap.ts`, `site/src/app/robots.ts`, `site/src/app/opengraph-image.tsx`, `site/src/app/error.tsx`, `site/src/app/not-found.tsx`

- [x] **Step 1: `sitemap.ts`:**

```ts
import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticRoutes = [
    "",
    "/projects",
    "/research",
    "/about",
    "/resume",
    "/contact",
    "/world",
  ].map((r) => ({ url: `${base}${r}`, lastModified: new Date() }));
  const projectRoutes = projects.map((p) => ({
    url: `${base}/projects/${p.slug}`,
    lastModified: new Date(),
  }));
  return [...staticRoutes, ...projectRoutes];
}
```

- [x] **Step 2: `robots.ts`:**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/sitemap.xml`,
  };
}
```

- [x] **Step 3: `opengraph-image.tsx`** (uses `next/og`, built into Next — no new dependency):

```tsx
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.owner.name} — ${site.owner.title}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#0b0e14",
          color: "#e6eaf2",
          fontFamily: "monospace",
        }}
      >
        <div style={{ color: "#4fd1c5", fontSize: 28 }}>
          {site.owner.name} // RESEARCH FACILITY
        </div>
        <div style={{ fontSize: 72, fontWeight: 700 }}>{site.owner.title}</div>
        <div style={{ fontSize: 32, color: "#8b94a7" }}>
          {site.owner.tagline}
        </div>
      </div>
    ),
    size,
  );
}
```

- [x] **Step 4: `error.tsx`:**

```tsx
"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-anomaly">
        // System fault
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Something went offline</h1>
      <p className="mt-2 text-facility-muted">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg"
      >
        [ RETRY ]
      </button>
    </div>
  );
}
```

- [x] **Step 5: `not-found.tsx`:**

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-warn">
        // 404 — sector not found
      </p>
      <h1 className="mt-2 text-3xl font-semibold">
        This room does not exist
      </h1>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg"
      >
        [ RETURN TO LOBBY ]
      </Link>
    </div>
  );
}
```

- [x] **Step 6: Verify.** `npm run build` succeeds; `/sitemap.xml` and `/robots.txt` return XML/txt in dev; visiting a bad URL shows the 404 page.

- [x] **Step 7: Commit.**

```powershell
git add -A
git commit -m "feat: sitemap, robots, og image, error pages"
```

### Task 0.8: Deploy staging to Vercel (human-assisted)

This task needs AJ's accounts. The executor prepares everything and stops at the human steps.

- [ ] **Step 1 (executor):** Verify clean tree: `git status --short` → empty. `npm run build` green.

- [ ] **Step 2 (human):** Create a private GitHub repo (e.g. `portfolio`) and push:

```powershell
git remote add origin <REPO_URL>
git push -u origin main
```

- [ ] **Step 3 (human):** In Vercel: Add New → Project → import the repo. Set **Root Directory** to `site`. Framework preset auto-detects Next.js. Deploy.

- [ ] **Step 4 (human):** In the Vercel project → Settings → Environment Variables, add for Production + Preview:

| Key | Value |
|---|---|
| `NIGHTFALL_MOCK` | `1` |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-staging-domain>` |

(`NIGHTFALL_API_URL` / `NIGHTFALL_API_KEY` stay unset — mock mode — until Phase 3.)

- [ ] **Step 5 (executor):** Verify the deployment: all routes (`/`, `/projects`, `/projects/nightfall`, `/research`, `/about`, `/resume`, `/contact`, `/world`) return 200. `/world` will show a 404-ish placeholder — that is correct until Phase 1; do not "fix" it.

- [ ] **Step 6:** Record the staging URL at the bottom of this plan file under "Deployment log" (create the heading). Commit that edit: `git commit -m "docs: record staging deployment"`.

**Phase 0 exit gate** — verify all four boxes at the top of this phase, then proceed.

---

## Phase 0 execution record (2026-09-15)

Executed on `phase/1-world-prototype` after Phase 1, in the plan's task order. The
plan's Task 0.1/0.2 code landed as written; Tasks 0.3-0.7 needed the corrections
recorded as A18-A23.

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | exit 0 (after clearing stale `.next/dev` + `.next/types`, A23) |
| Lint | `npm run lint` | exit 0 (was 18 errors: 13x A19, plus A20/A21; probes ignored, A18) |
| Unit tests | `npm run test` | 12 passed / 4 files (content validator 2, collision 5, input 3, interaction 2) |
| Build | `npm run build` | green, 13 routes: `/`, `/projects`, `/projects/nightfall`, `/projects/noctis`, `/research`, `/about`, `/resume`, `/contact`, `/world`, `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, `/_not-found` |
| Content drives the site (AD-01) | every page renders `site.owner.*`, `site.research`, `site.timeline` and `projects` | the h1s and copy that appeared are the `EDIT-ME` strings from `src/content/`, i.e. content is the only source |
| World unharmed by the gate refactor | headless probe: canvas attaches 1598 ms, 900x600, HUD reads CORE MAIN HUB, `[E] ACCESS TERMINAL` on walking north | pass |
| Guard still degrades correctly | Pixel-7-like context: fallback panel, zero canvas; `?force=1` boots the canvas | pass |
| Unknown room | `?room=nonsense` and `?room=nightfall` (room not registered until Phase 2) both stay in the hub | pass |
| A15 resolved | `/projects` and `/contact` now exist, so the PauseMenu prefetch no longer logs 404s; a full browse of the world plus all 8 routes produced zero console errors | pass |

Still open in Phase 0: **Task 0.8** (Vercel staging - needs AJ's GitHub and Vercel
accounts), the two exit-gate boxes that depend on it (staging URL, deployed
Lighthouse), and every `EDIT-ME` in `src/content/` (Appendix D.2). Phase 1's only
open item is unchanged: 60 fps on real integrated graphics.

---
# Phase 1 — World Prototype: the hub room

**Goal:** A single explorable room that already feels good to walk around in (spec Phase 1: "Walking around should already feel good"). Character, camera, collision, HUD, interaction prompts, pause menu. No project integrations.

**Exit gate:**

- [ ] `/world` renders the hub room at 60 fps with no console errors
- [x] WASD + arrows move the character; walls, pillars, and the terminal block movement; sliding along walls works
- [x] `[E]` prompts appear near the terminal and door frames, and disappear when you walk away
- [x] ESC opens/closes the pause menu; its links work
- [x] Mobile emulation (or WebGL disabled) shows the fallback panel, never a broken canvas
- [x] `npm run build` and `npm run test` green
- [x] A11–A16 recorded here as the only deviations found while executing the phase

### Task 1.1: `/world` route, guards, lazy canvas

**Files:**
- Create: `site/src/app/world/page.tsx`, `site/src/components/hud/WorldFallback.tsx`, `site/src/world/WorldCanvas.tsx` (stub)

**Interfaces:**
- Produces: `/world` (client page) that mounts `WorldCanvas` (default export, loaded via `next/dynamic` with `ssr: false`) only when WebGL exists and the pointer is fine; otherwise renders `WorldFallback`. `?force=1` bypasses the coarse-pointer check only (never the WebGL check).

- [x] **Step 1: Create `site/src/world/WorldCanvas.tsx` (temporary stub — replaced in Task 1.4):**

```tsx
"use client";

export default function WorldCanvas() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-facility-bg font-mono text-accent">
      WORLD STUB — PHASE 1.4
    </div>
  );
}
```

- [x] **Step 2: Create `site/src/components/hud/WorldFallback.tsx`:**

```tsx
import Link from "next/link";

export function WorldFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-facility-bg px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-warn">
        // Facility requires WebGL and a precise pointer
      </p>
      <h1 className="text-3xl font-semibold">The standard facility is open</h1>
      <p className="max-w-md text-facility-muted">
        This device is set up for the classic interface. All projects,
        research, and contact channels are available there.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg"
        >
          [ STANDARD PORTFOLIO ]
        </Link>
        <Link
          href="/projects"
          className="rounded-md border border-facility-border px-5 py-3 font-mono text-sm hover:border-accent"
        >
          Projects
        </Link>
        <Link
          href="/contact"
          className="rounded-md border border-facility-border px-5 py-3 font-mono text-sm hover:border-accent"
        >
          Contact
        </Link>
      </div>
      <Link
        href="/world?force=1"
        className="font-mono text-xs text-facility-muted underline hover:text-accent"
      >
        try the 3D facility anyway
      </Link>
    </div>
  );
}
```

- [x] **Step 3: Create `site/src/app/world/page.tsx`:**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { WorldFallback } from "@/components/hud/WorldFallback";

const WorldCanvas = dynamic(() => import("@/world/WorldCanvas"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-facility-bg font-mono text-sm text-facility-muted">
      LOADING FACILITY...
    </div>
  ),
});

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function WorldPage() {
  const [status, setStatus] = useState<"checking" | "ok" | "fallback">(
    "checking",
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("force") === "1";
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!hasWebGL()) setStatus("fallback");
    else if (coarse && !forced) setStatus("fallback");
    else setStatus("ok");
  }, []);

  if (status === "checking") {
    return <div className="fixed inset-0 bg-facility-bg" />;
  }
  if (status === "fallback") {
    return <WorldFallback />;
  }
  return <WorldCanvas />;
}
```

- [x] **Step 4: Verify.** Dev server: `/world` shows the stub text; browser devtools device emulation (iPhone) shows the fallback panel; `/world?force=1` in emulation shows the stub. `npm run build` green.

- [x] **Step 5: Commit.**

```powershell
git add -A
git commit -m "feat: /world route with WebGL and pointer guards"
```

### Task 1.2: World types, store, room registry, hub data

**Files:**
- Create: `site/src/world/types.ts`, `site/src/world/store.ts`, `site/src/world/rooms.ts`, `site/src/world/rooms/hub.ts`

**Interfaces:**
- Produces: `RoomDef` / `PropDef` / `InteractableDef` / `Action` / `PanelTarget` / `DoorTarget` / `RoomPalette` types (below), `useWorldStore` (zustand) and the exported mutable `playerPos` object, and `rooms: Record<string, RoomDef>` containing `hub`. Every world task after this consumes these names.

- [x] **Step 1: Create `site/src/world/types.ts`:**

```ts
export type Facing = "n" | "s" | "e" | "w";

export interface RoomPalette {
  floor: string;
  wall: string;
  accent: string;
  trim: string;
}

export type PropType =
  | "box"
  | "sign"
  | "screen"
  | "terminal"
  | "crate"
  | "conveyor"
  | "cameraGantry";

export interface PropDef {
  type: PropType;
  /** [x, y, z] in tile units; tile (x, z) has its center at world (x, 0, z) */
  pos: [number, number, number];
  /** [width, height, depth] in tile units */
  size: [number, number, number];
  color?: string;
  text?: string;
  /** direction the prop is readable from (sign/screen normal) */
  face?: Facing;
}

export type PanelTarget =
  | { kind: "project"; slug: string }
  | { kind: "about" }
  | { kind: "research" }
  | { kind: "demo"; slug: string };

export type Action =
  | { type: "panel"; panel: PanelTarget }
  | { type: "link"; href: string };

export interface InteractableDef {
  id: string;
  /** tile [x, z] the visitor stands near */
  pos: [number, number];
  /** interaction radius in tiles */
  radius: number;
  /** shown in HUD as "[E] {prompt}" */
  prompt: string;
  /** optional; prompt-only interactables (e.g. "under construction") omit it */
  action?: Action;
}

export interface DoorTarget {
  targetRoom: string;
  spawn: { x: number; z: number };
  facing: Facing;
}

export interface BlockedRect {
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface RoomDef {
  id: string;
  name: string;
  subtitle: string;
  palette: RoomPalette;
  /**
   * Equal-length rows. '#' = wall, '.' = floor, 'D' = door (walkable, may teleport).
   * Row index = z (south positive), column index = x (east positive).
   */
  map: string[];
  spawn: { x: number; z: number; facing: Facing };
  props: PropDef[];
  blocked: BlockedRect[];
  interactables: InteractableDef[];
  /** key is `${x},${z}` of the 'D' tile */
  doors: Record<string, DoorTarget>;
}
```

- [x] **Step 2: Create `site/src/world/store.ts`:**

```ts
import { create } from "zustand";
import type { Action, PanelTarget } from "./types";

/**
 * AD-12: player position NEVER lives here. `playerPos` is a plain mutable
 * object the PlayerController writes each frame and the InteractionSystem
 * reads — no React re-renders at 60 Hz.
 */
export const playerPos = { x: 9, z: 8 };

interface WorldState {
  roomId: string;
  spawn: { x: number; z: number };
  prompt: string | null;
  action: Action | null;
  panel: PanelTarget | null;
  paused: boolean;
  /** 0 = clear, 1 = fully black (door transitions) */
  transition: number;
  enterRoom: (roomId: string, spawn: { x: number; z: number }) => void;
  setPrompt: (prompt: string | null, action: Action | null) => void;
  openPanel: (panel: PanelTarget) => void;
  closePanel: () => void;
  setPaused: (paused: boolean) => void;
  setTransition: (v: number) => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  roomId: "hub",
  spawn: { x: 9, z: 8 }, // keep in sync with rooms/hub.ts spawn
  prompt: null,
  action: null,
  panel: null,
  paused: false,
  transition: 0,
  enterRoom: (roomId, spawn) =>
    set({ roomId, spawn, prompt: null, action: null }),
  setPrompt: (prompt, action) => set({ prompt, action }),
  openPanel: (panel) => set({ panel, paused: false }),
  closePanel: () => set({ panel: null }),
  setPaused: (paused) => set({ paused }),
  setTransition: (transition) => set({ transition }),
}));
```

- [x] **Step 3: Create `site/src/world/rooms.ts`:**

```ts
import type { RoomDef } from "./types";
import { hub } from "./rooms/hub";

// ponytail: one import per room; switch to lazy loading if rooms exceed ~10
export const rooms: Record<string, RoomDef> = {
  hub,
};
```

- [x] **Step 4: Create `site/src/world/rooms/hub.ts`.** The map is 19×15. Count characters carefully — every row is exactly 19 chars:

```ts
import type { RoomDef } from "../types";

export const hub: RoomDef = {
  id: "hub",
  name: "CORE MAIN HUB",
  subtitle: "Welcome to the facility",
  palette: {
    floor: "#2a3242",
    wall: "#3b465c",
    accent: "#4fd1c5",
    trim: "#8b94a7",
  },
  map: [
    "#########D#########",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "D.................D",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#.................#",
    "#########D#########",
  ],
  spawn: { x: 9, z: 8, facing: "n" },
  props: [
    // central terminal (blocked tile 9,5)
    { type: "box", pos: [9, 0.4, 5], size: [1.4, 0.8, 1], color: "#3b465c" },
    {
      type: "screen",
      pos: [9, 1.15, 5.1],
      size: [1.1, 0.6, 0.12],
      color: "#4fd1c5",
      face: "s",
    },
    // door signs — readable from inside the room
    {
      type: "sign",
      pos: [9, 2.4, 0.45],
      size: [3.2, 0.8, 0.12],
      text: "VISION LAB",
      face: "s",
    },
    {
      type: "sign",
      pos: [17.55, 2.4, 7],
      size: [3.2, 0.8, 0.12],
      text: "AGENT LAB",
      face: "w",
    },
    {
      type: "sign",
      pos: [1.45, 2.4, 7],
      size: [3.2, 0.8, 0.12],
      text: "RESEARCH",
      face: "e",
    },
    {
      type: "sign",
      pos: [9, 2.4, 14.55],
      size: [3.2, 0.8, 0.12],
      text: "ABOUT",
      face: "n",
    },
    // corner pillars (blocked)
    { type: "box", pos: [4, 1.2, 3], size: [1, 2.4, 1], color: "#3b465c" },
    { type: "box", pos: [14, 1.2, 3], size: [1, 2.4, 1], color: "#3b465c" },
    { type: "box", pos: [4, 1.2, 11], size: [1, 2.4, 1], color: "#3b465c" },
    { type: "box", pos: [14, 1.2, 11], size: [1, 2.4, 1], color: "#3b465c" },
  ],
  blocked: [
    { x: 9, z: 5, w: 1, d: 1 }, // terminal
    { x: 4, z: 3, w: 1, d: 1 },
    { x: 14, z: 3, w: 1, d: 1 },
    { x: 4, z: 11, w: 1, d: 1 },
    { x: 14, z: 11, w: 1, d: 1 },
  ],
  interactables: [
    {
      id: "hub-terminal",
      pos: [9, 6],
      radius: 1.6,
      prompt: "ACCESS TERMINAL",
    },
    {
      id: "door-n",
      pos: [9, 1],
      radius: 1.6,
      prompt: "VISION LAB — UNDER CONSTRUCTION",
    },
    {
      id: "door-e",
      pos: [17, 7],
      radius: 1.6,
      prompt: "AGENT LAB — UNDER CONSTRUCTION",
    },
    {
      id: "door-w",
      pos: [1, 7],
      radius: 1.6,
      prompt: "RESEARCH — UNDER CONSTRUCTION",
    },
    {
      id: "door-s",
      pos: [9, 13],
      radius: 1.6,
      prompt: "ABOUT — UNDER CONSTRUCTION",
    },
  ],
  doors: {}, // wired in Phase 2+
};
```

- [x] **Step 5: Verify.** `npx tsc --noEmit` passes. `npm run build` green.

- [x] **Step 6: Commit.**

```powershell
git add -A
git commit -m "feat: world types, store, hub room data"
```

### Task 1.3: Grid collision (TDD)

**Files:**
- Create: `site/src/world/collision.ts`
- Test: `site/src/world/collision.test.ts`

**Interfaces:**
- Produces: `makeGridMap(rows: string[], blocked?: BlockedRect[]): GridMap`, `canStand(map, x, z): boolean`, `moveWithCollision(map, from, delta): {x, z}`, `tileCharAt(rows, x, z): string`. `tileCharAt` returns `"#"` for out-of-bounds. Positions are floats in tile units; a tile's center is at its integer coordinates; the player radius is 0.3.

- [x] **Step 1: Write the failing test — `site/src/world/collision.test.ts`:**

```ts
import { describe, expect, it } from "vitest";
import { canStand, makeGridMap, moveWithCollision } from "./collision";

const ROWS = ["#####", "#...#", "#...#", "#####"];

describe("collision", () => {
  it("builds a map and blocks wall tiles", () => {
    const map = makeGridMap(ROWS);
    expect(canStand(map, 2, 2)).toBe(true);
    expect(canStand(map, 0, 2)).toBe(false);
    expect(canStand(map, 2, 0)).toBe(false);
  });

  it("rejects ragged maps", () => {
    expect(() => makeGridMap(["###", "##"])).toThrow(/equal length/);
  });

  it("merges blocked rects (props) into the grid", () => {
    const map = makeGridMap(ROWS, [{ x: 1, z: 1, w: 1, d: 2 }]);
    expect(canStand(map, 1, 1)).toBe(false);
    expect(canStand(map, 1, 2)).toBe(false);
    expect(canStand(map, 2, 2)).toBe(true);
  });

  it("slides along a wall when only one axis is blocked", () => {
    const map = makeGridMap(ROWS);
    // x=0.8 is the standable edge (radius 0.3 + tile-centred rounding), so the -x
    // half of this delta is blocked and +z still moves: that is the wall-slide.
    const next = moveWithCollision(map, { x: 0.8, z: 1 }, { x: -0.5, z: 0.5 });
    expect(next.x).toBeCloseTo(0.8);
    expect(next.z).toBeCloseTo(1.5);
  });

  it("stops the player from squeezing into a wall corner", () => {
    const map = makeGridMap(["####", "#..#", "#..#", "####"]);
    let pos = { x: 1.6, z: 1.6 };
    for (let i = 0; i < 10; i++) {
      pos = moveWithCollision(map, pos, { x: -0.4, z: -0.4 });
    }
    expect(pos.x).toBeGreaterThanOrEqual(0.5);
    expect(pos.z).toBeGreaterThanOrEqual(0.5);
  });
});
```

- [x] **Step 2: Run it to verify it fails.** `npm run test` → FAIL: cannot resolve `./collision`.

- [x] **Step 3: Create `site/src/world/collision.ts`:**

```ts
import type { BlockedRect } from "./types";

export interface GridMap {
  width: number;
  depth: number;
  solid: Uint8Array; // index = z * width + x; 1 = blocked
}

export interface Vec2 {
  x: number;
  z: number;
}

const PLAYER_RADIUS = 0.3;

export function makeGridMap(
  rows: string[],
  blocked: BlockedRect[] = [],
): GridMap {
  const depth = rows.length;
  const width = rows[0]?.length ?? 0;
  if (rows.some((r) => r.length !== width)) {
    throw new Error(
      `map rows must be equal length (got ${rows.map((r) => r.length).join(", ")})`,
    );
  }
  const solid = new Uint8Array(width * depth);
  rows.forEach((row, z) => {
    row.split("").forEach((ch, x) => {
      if (ch === "#") solid[z * width + x] = 1;
    });
  });
  for (const b of blocked) {
    for (let z = b.z; z < b.z + b.d; z++) {
      for (let x = b.x; x < b.x + b.w; x++) {
        if (x >= 0 && x < width && z >= 0 && z < depth) {
          solid[z * width + x] = 1;
        }
      }
    }
  }
  return { width, depth, solid };
}

export function tileCharAt(rows: string[], x: number, z: number): string {
  const row = rows[Math.round(z)];
  return row?.[Math.round(x)] ?? "#";
}

function isSolid(map: GridMap, x: number, z: number): boolean {
  const ix = Math.round(x);
  const iz = Math.round(z);
  if (ix < 0 || iz < 0 || ix >= map.width || iz >= map.depth) return true;
  return map.solid[iz * map.width + ix] === 1;
}

export function canStand(map: GridMap, x: number, z: number): boolean {
  const r = PLAYER_RADIUS;
  return (
    !isSolid(map, x - r, z - r) &&
    !isSolid(map, x + r, z - r) &&
    !isSolid(map, x - r, z + r) &&
    !isSolid(map, x + r, z + r)
  );
}

/** Per-axis movement — blocked axes are dropped, free axes slide (wall-slide). */
export function moveWithCollision(
  map: GridMap,
  from: Vec2,
  delta: Vec2,
): Vec2 {
  let { x, z } = from;
  if (delta.x !== 0 && canStand(map, x + delta.x, z)) x += delta.x;
  if (delta.z !== 0 && canStand(map, x, z + delta.z)) z += delta.z;
  return { x, z };
}
```

- [x] **Step 4: Run the test to verify it passes.** `npm run test` → all collision tests PASS.

- [x] **Step 5: Commit.**

```powershell
git add site/src/world/collision.ts site/src/world/collision.test.ts
git commit -m "feat: tile-grid collision with wall-slide"
```

---

### Task 1.4: Room renderer — floor, walls, props, lights

**Files:**
- Create: `site/src/world/textures.ts`, `site/src/world/Floor.tsx`, `site/src/world/Walls.tsx`, `site/src/world/Props.tsx`, `site/src/world/Scene.tsx`
- Modify: `site/src/world/WorldCanvas.tsx` (replace stub)

**Interfaces:**
- Consumes: `RoomDef`, `rooms`, `useWorldStore`.
- Produces: `Scene({ room }: { room: RoomDef })`, `makeSignTexture`, `makeFloorTexture`, `ScreenTexture`. Sign/screen faces: `s` = rotation 0, `n` = π, `e` = π/2, `w` = −π/2.

- [x] **Step 1: Create `site/src/world/textures.ts`:**

```ts
import * as THREE from "three";

/** In-world sign as a canvas texture. No drei, no font loading (AD-11). */
export function makeSignTexture(
  text: string,
  opts: { bg?: string; fg?: string; accent?: string } = {},
): THREE.CanvasTexture {
  const { bg = "#131826", fg = "#e6eaf2", accent = "#4fd1c5" } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);
  ctx.fillStyle = fg;
  ctx.font = "bold 44px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 66, 470);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Updatable monitor texture (Nightfall monitor, Noctis terminal). */
export class ScreenTexture {
  readonly texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;

  constructor(width = 512, height = 256, private bg = "#05070c") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    this.ctx = canvas.getContext("2d")!;
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.update([]);
  }

  update(lines: string[], accent = "#4fd1c5") {
    const { ctx } = this;
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = "20px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    lines.slice(-10).forEach((line, i) => {
      ctx.fillStyle = i === 0 ? accent : "#8b94a7";
      ctx.fillText(line, 16, 14 + i * 24, ctx.canvas.width - 32);
    });
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}

/** Tiled floor texture — one tile per repeat. */
export function makeFloorTexture(
  floor: string,
  line: string,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
```

- [x] **Step 2: Create `site/src/world/Floor.tsx`:**

```tsx
"use client";

import { useEffect, useMemo } from "react";
import { makeFloorTexture } from "./textures";
import type { RoomDef } from "./types";

export function Floor({ room }: { room: RoomDef }) {
  const texture = useMemo(
    () => makeFloorTexture(room.palette.floor, room.palette.wall),
    [room.palette.floor, room.palette.wall],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  const width = room.map[0].length;
  const depth = room.map.length;
  texture.repeat.set(width, depth);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[(width - 1) / 2, 0, (depth - 1) / 2]}
    >
      <planeGeometry args={[width, depth]} />
      <meshLambertMaterial map={texture} />
    </mesh>
  );
}
```

- [x] **Step 3: Create `site/src/world/Walls.tsx`.** One InstancedMesh for ALL wall tiles (AD-08 — never one mesh per tile):

```tsx
"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { RoomDef } from "./types";

const WALL_HEIGHT = 3;

export function Walls({ room }: { room: RoomDef }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const cells = useMemo(() => {
    const out: Array<[number, number]> = [];
    room.map.forEach((row, z) =>
      row.split("").forEach((ch, x) => {
        if (ch === "#") out.push([x, z]);
      }),
    );
    return out;
  }, [room]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    cells.forEach(([x, z], i) => {
      m.makeTranslation(x, WALL_HEIGHT / 2, z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [cells]);

  return (
    <instancedMesh
      key={cells.length}
      ref={ref}
      args={[undefined, undefined, cells.length]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, WALL_HEIGHT, 1]} />
      <meshLambertMaterial color={room.palette.wall} />
    </instancedMesh>
  );
}
```

- [x] **Step 4: Create `site/src/world/Props.tsx`:**

```tsx
"use client";

import { useMemo } from "react";
import { makeSignTexture } from "./textures";
import type { PropDef, RoomDef } from "./types";

const FACING_ROT: Record<string, number> = {
  s: 0,
  n: Math.PI,
  e: Math.PI / 2,
  w: -Math.PI / 2,
};

export function Props({ room }: { room: RoomDef }) {
  return (
    <>
      {room.props.map((p, i) => (
        <Prop key={i} def={p} accent={room.palette.accent} />
      ))}
    </>
  );
}

function Prop({ def, accent }: { def: PropDef; accent: string }) {
  const signTexture = useMemo(
    () =>
      def.type === "sign" && def.text
        ? makeSignTexture(def.text, { accent })
        : null,
    [def.type, def.text, accent],
  );

  return (
    <mesh
      position={def.pos}
      rotation={[0, FACING_ROT[def.face ?? "s"], 0]}
    >
      <boxGeometry args={def.size} />
      {def.type === "sign" && signTexture ? (
        <meshBasicMaterial map={signTexture} />
      ) : (
        <meshLambertMaterial color={def.color ?? "#3b465c"} />
      )}
    </mesh>
  );
}
```

- [x] **Step 5: Create `site/src/world/Scene.tsx` (without PlayerController/InteractionSystem until Tasks 1.7/1.8):**

```tsx
"use client";

import { Floor } from "./Floor";
import { Walls } from "./Walls";
import { Props } from "./Props";
import type { RoomDef } from "./types";

export function Scene({ room }: { room: RoomDef }) {
  const width = room.map[0].length;
  const depth = room.map.length;
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={0.9}
        color={room.palette.trim}
      />
      <pointLight
        position={[(width - 1) / 2, 3, (depth - 1) / 2]}
        intensity={0.6}
        color={room.palette.accent}
        distance={20}
      />
      <Floor room={room} />
      <Walls room={room} />
      <Props room={room} />
    </>
  );
}
```

- [x] **Step 6: Replace `site/src/world/WorldCanvas.tsx` with the real canvas:**

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { useWorldStore } from "./store";
import { rooms } from "./rooms";
import { Scene } from "./Scene";

export default function WorldCanvas() {
  const roomId = useWorldStore((s) => s.roomId);
  const room = rooms[roomId] ?? rooms.hub;

  return (
    <div className="fixed inset-0 bg-facility-bg">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 45, near: 0.1, far: 100, position: [9, 10, 16] }}
      >
        <Scene key={roomId} room={room} />
      </Canvas>
    </div>
  );
}
```

- [x] **Step 7: Verify.** Dev server → `/world`: you see the hub room — dark floor with grid, walls, four door signs, terminal block with cyan screen, four pillars. Camera looks down at ~50°. No console errors. `npm run build` green.

- [x] **Step 8: Commit.**

```powershell
git add -A
git commit -m "feat: instanced voxel room renderer"
```

### Task 1.5: AJ.exe character

**Files:**
- Create: `site/src/world/Character.tsx`

**Interfaces:**
- Produces: `Character({ movingRef }: { movingRef: React.RefObject<boolean> })`. Renders ~1.8-unit-tall voxel humanoid, faces local +z. Reads `movingRef.current` each frame — no props that change per frame.

- [x] **Step 1: Create `site/src/world/Character.tsx`:**

```tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// AJ.exe — original voxel humanoid. Deliberately NOT a Steve clone (spec §5).
//
// Readability is a hard requirement, not a taste call (spec §24). Charcoal
// #232b3e measured 1.01:1 against the hub floor — effectively invisible, and
// worst against dark rooms. Every colour here is an existing §4 token chosen on
// LIGHTNESS rather than hue, so the figure survives colour blindness:
//   BODY   #e6eaf2 (facility-text) 7.9-12.2:1 vs every room floor and wall
//   ACCENT #4fd1c5 (accent)        5.1:1 worst case, antenna only
//   VISOR  #0b0e14 (facility-bg)   ~16.9:1 against the BODY, so the face reads
const BODY = "#e6eaf2"; // light suit, not charcoal
const VISOR = "#0b0e14";
const ACCENT = "#4fd1c5";
const PACK = "#f6ad55";

export function Character({
  movingRef,
}: {
  movingRef: React.RefObject<boolean>;
}) {
  const group = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    const moving = movingRef.current;
    const walk = moving ? Math.sin(t.current * 10) * 0.6 : 0;
    if (legL.current) legL.current.rotation.x = walk;
    if (legR.current) legR.current.rotation.x = -walk;
    if (armL.current) armL.current.rotation.x = -walk * 0.7;
    if (armR.current) armR.current.rotation.x = walk * 0.7;
    if (group.current) {
      group.current.position.y = moving
        ? Math.abs(Math.sin(t.current * 10)) * 0.04
        : Math.sin(t.current * 2) * 0.02;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={legL} position={[-0.13, 0.38, 0]}>
        <boxGeometry args={[0.2, 0.75, 0.24]} />
        <meshLambertMaterial color={BODY} />
      </mesh>
      <mesh ref={legR} position={[0.13, 0.38, 0]}>
        <boxGeometry args={[0.2, 0.75, 0.24]} />
        <meshLambertMaterial color={BODY} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.52, 0.6, 0.3]} />
        <meshLambertMaterial color={BODY} />
      </mesh>
      <mesh position={[0, 1.1, -0.22]}>
        <boxGeometry args={[0.34, 0.4, 0.14]} />
        <meshLambertMaterial color={PACK} />
      </mesh>
      <mesh ref={armL} position={[-0.36, 1.08, 0]}>
        <boxGeometry args={[0.16, 0.6, 0.22]} />
        <meshLambertMaterial color={BODY} />
      </mesh>
      <mesh ref={armR} position={[0.36, 1.08, 0]}>
        <boxGeometry args={[0.16, 0.6, 0.22]} />
        <meshLambertMaterial color={BODY} />
      </mesh>
      <mesh position={[0, 1.58, 0]}>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshLambertMaterial color={BODY} />
      </mesh>
      <mesh position={[0, 1.6, 0.22]}>
        <boxGeometry args={[0.34, 0.12, 0.03]} />
        <meshBasicMaterial color={ACCENT} />
      </mesh>
      <mesh position={[0.14, 1.9, 0]}>
        <boxGeometry args={[0.04, 0.24, 0.04]} />
        <meshBasicMaterial color={VISOR} />
      </mesh>
      {/* fake blob shadow — no real-time shadows (AD cut list) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
```

- [x] **Step 2: Verify.** Add `<Character movingRef={{ current: false }} />` temporarily inside `Scene` — a motionless AJ.exe stands at room center (9, 0, 8): wrap it in `<group position={[9, 0, 8]}>`. Idle bob visible. Then remove the temporary usage (the controller wires it in Task 1.7). `npm run build` green.

- [x] **Step 3: Commit.**

```powershell
git add site/src/world/Character.tsx
git commit -m "feat: AJ.exe voxel character"
```

> **Amended 2026-09-15 (A17):** the colour constants in Task 1.5 are the corrected ones. If you are executing from an older copy, do not restore `BODY = "#232b3e"` — see the amendment log.

### Task 1.6: Camera rig

**Files:**
- Create: `site/src/world/CameraRig.tsx`

**Interfaces:**
- Produces: `CameraRig({ target }: { target: React.RefObject<THREE.Object3D | null> })`. Fixed offset `(0, 10, 8)`, damped follow, look-at 1 unit above target. Consumed by PlayerController in Task 1.7.

- [x] **Step 1: Create `site/src/world/CameraRig.tsx`:**

```tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const OFFSET = new THREE.Vector3(0, 10, 8);

export function CameraRig({
  target,
}: {
  target: React.RefObject<THREE.Object3D | null>;
}) {
  const desired = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    if (!target.current) return;
    const t = target.current.position;
    desired.current.set(t.x + OFFSET.x, OFFSET.y, t.z + OFFSET.z);
    // frame-rate-independent damping: close fraction 1 - exp(-k*dt) per frame
    state.camera.position.lerp(desired.current, 1 - Math.exp(-6 * dt));
    state.camera.lookAt(t.x, 1, t.z);
  });

  return null;
}
```

- [x] **Step 2: Verify.** `npm run build` green (component is exercised in Task 1.7).

- [x] **Step 3: Commit.**

```powershell
git add site/src/world/CameraRig.tsx
git commit -m "feat: damped follow camera rig"
```

### Task 1.7: Input + player controller

**Files:**
- Create: `site/src/world/input.ts`, `site/src/world/actions.ts`, `site/src/world/PlayerController.tsx`
- Test: `site/src/world/input.test.ts`
- Modify: `site/src/world/Scene.tsx` (mount PlayerController)

**Interfaces:**
- Produces: `getMoveDir(keys: Set<string>): Dir` (normalized), `useKeyboard({ onInteract, onPause }): RefObject<Set<string>>` (WASD + arrows; E = interact edge; ESC = pause; keys cleared on blur), `runAction(action: Action)`, `goThroughDoor(door: DoorTarget)`.

- [x] **Step 1: Write the failing test — `site/src/world/input.test.ts`:**

```ts
import { describe, expect, it } from "vitest";
import { getMoveDir } from "./input";

describe("getMoveDir", () => {
  it("maps single keys to unit directions", () => {
    expect(getMoveDir(new Set(["KeyW"]))).toEqual({ x: 0, z: -1 });
    expect(getMoveDir(new Set(["ArrowDown"]))).toEqual({ x: 0, z: 1 });
    expect(getMoveDir(new Set(["KeyA"]))).toEqual({ x: -1, z: 0 });
    expect(getMoveDir(new Set(["ArrowRight"]))).toEqual({ x: 1, z: 0 });
  });

  it("normalizes diagonals", () => {
    const d = getMoveDir(new Set(["KeyW", "KeyD"]));
    expect(d.x).toBeCloseTo(Math.SQRT1_2);
    expect(d.z).toBeCloseTo(-Math.SQRT1_2);
  });

  it("returns zero for no movement keys", () => {
    expect(getMoveDir(new Set(["KeyE", "ShiftLeft"]))).toEqual({ x: 0, z: 0 });
  });
});
```

- [x] **Step 2: Run it to verify it fails.** `npm run test` → FAIL: cannot resolve `./input`.

- [x] **Step 3: Create `site/src/world/input.ts`:**

```ts
import { useEffect, useRef } from "react";

export interface Dir {
  x: number;
  z: number;
}

const KEY_DIRS: Record<string, Dir> = {
  KeyW: { x: 0, z: -1 },
  ArrowUp: { x: 0, z: -1 },
  KeyS: { x: 0, z: 1 },
  ArrowDown: { x: 0, z: 1 },
  KeyA: { x: -1, z: 0 },
  ArrowLeft: { x: -1, z: 0 },
  KeyD: { x: 1, z: 0 },
  ArrowRight: { x: 1, z: 0 },
};

export function getMoveDir(keys: Set<string>): Dir {
  let x = 0;
  let z = 0;
  for (const key of keys) {
    const d = KEY_DIRS[key];
    if (d) {
      x += d.x;
      z += d.z;
    }
  }
  const len = Math.hypot(x, z);
  return len > 0 ? { x: x / len, z: z / len } : { x: 0, z: 0 };
}

export function useKeyboard(handlers: {
  onInteract: () => void;
  onPause: () => void;
}) {
  const keys = useRef<Set<string>>(new Set());
  const h = useRef(handlers);
  h.current = handlers;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "KeyE") {
        h.current.onInteract();
        return;
      }
      if (e.code === "Escape") {
        h.current.onPause();
        return;
      }
      if (KEY_DIRS[e.code]) {
        e.preventDefault(); // stop arrow-key page scroll
        keys.current.add(e.code);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  return keys;
}
```

- [x] **Step 4: Run the test to verify it passes.** `npm run test` → input tests PASS.

- [x] **Step 5: Create `site/src/world/actions.ts`:**

```ts
import { useWorldStore } from "./store";
import type { Action, DoorTarget } from "./types";

export function runAction(action: Action) {
  const store = useWorldStore.getState();
  switch (action.type) {
    case "panel":
      store.openPanel(action.panel);
      break;
    case "link":
      window.open(action.href, "_blank", "noopener");
      break;
  }
}

export function goThroughDoor(door: DoorTarget) {
  useWorldStore.getState().setTransition(1);
  window.setTimeout(() => {
    useWorldStore
      .getState()
      .enterRoom(door.targetRoom, door.spawn);
    window.setTimeout(() => {
      useWorldStore.getState().setTransition(0);
    }, 200);
  }, 250);
}
```

- [x] **Step 6: Create `site/src/world/PlayerController.tsx`:**

```tsx
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Character } from "./Character";
import { CameraRig } from "./CameraRig";
import { getMoveDir, useKeyboard } from "./input";
import { makeGridMap, moveWithCollision, tileCharAt } from "./collision";
import { useWorldStore, playerPos } from "./store";
import { rooms } from "./rooms";
import { runAction, goThroughDoor } from "./actions";

const SPEED = 4.5; // tiles per second
const FACING_ANGLE: Record<string, number> = {
  n: Math.PI,
  s: 0,
  e: Math.PI / 2,
  w: -Math.PI / 2,
};

function dampAngle(current: number, target: number, lambda: number, dt: number) {
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * (1 - Math.exp(-lambda * dt));
}

export function PlayerController() {
  const room = rooms[useWorldStore((s) => s.roomId)];
  const spawn = useWorldStore((s) => s.spawn);
  const paused = useWorldStore((s) => s.paused);
  const panelOpen = useWorldStore((s) => s.panel !== null);

  const map = useMemo(() => makeGridMap(room.map, room.blocked), [room]);
  const group = useRef<THREE.Group>(null);
  const pos = useRef({ x: spawn.x, z: spawn.z });
  const rotation = useRef(FACING_ANGLE[room.spawn.facing]);
  const movingRef = useRef(false);
  const doorLock = useRef(false);

  const keys = useKeyboard({
    onInteract: () => {
      const { action, paused: p, panel } = useWorldStore.getState();
      if (p || panel) return;
      if (action) runAction(action);
    },
    onPause: () => {
      const { paused: p, panel } = useWorldStore.getState();
      if (panel) useWorldStore.getState().closePanel();
      else useWorldStore.getState().setPaused(!p);
    },
  });

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05); // clamp tab-switch spikes
    const blocked = paused || panelOpen;
    const dir = blocked ? { x: 0, z: 0 } : getMoveDir(keys.current);
    movingRef.current = dir.x !== 0 || dir.z !== 0;

    if (movingRef.current) {
      pos.current = moveWithCollision(map, pos.current, {
        x: dir.x * SPEED * dt,
        z: dir.z * SPEED * dt,
      });
      rotation.current = dampAngle(
        rotation.current,
        Math.atan2(dir.x, dir.z),
        12,
        dt,
      );
    }

    // publish position for the interaction system (never React state — AD-12)
    playerPos.x = pos.current.x;
    playerPos.z = pos.current.z;

    if (group.current) {
      group.current.position.set(pos.current.x, 0, pos.current.z);
      group.current.rotation.y = rotation.current;
    }

    // door tiles teleport (auto, on step)
    const ch = tileCharAt(room.map, pos.current.x, pos.current.z);
    if (ch === "D" && !doorLock.current) {
      const key = `${Math.round(pos.current.x)},${Math.round(pos.current.z)}`;
      const door = room.doors[key];
      if (door) {
        doorLock.current = true;
        goThroughDoor(door);
      }
    } else if (ch !== "D") {
      doorLock.current = false;
    }
  });

  return (
    <group ref={group}>
      <Character movingRef={movingRef} />
    </group>
  );
}
```

Note: `CameraRig` must follow this group — add it inside the returned `<group>` is wrong (it would move with the player); instead render it as a sibling. Final return:

```tsx
  return (
    <>
      <CameraRig target={group} />
      <group ref={group}>
        <Character movingRef={movingRef} />
      </group>
    </>
  );
```

- [x] **Step 7: Modify `Scene.tsx`** — add `import { PlayerController } from "./PlayerController";` and render `<PlayerController />` after `<Props room={room} />`.

- [x] **Step 8: Verify.** Dev server → `/world`: character stands south of the terminal facing north. WASD moves with walk animation; character turns toward movement; camera follows with damping; walls/pillars/terminal block; sliding along the north wall while holding W+A works. No console errors. `npm run build` + `npm run test` green.

- [x] **Step 9: Commit.**

```powershell
git add -A
git commit -m "feat: player controller with input, camera follow, door hooks"
```

### Task 1.8: Interaction system + HUD

**Files:**
- Create: `site/src/world/interaction.ts`, `site/src/world/InteractionSystem.tsx`, `site/src/components/hud/Hud.tsx`, `site/src/components/hud/PromptBar.tsx`, `site/src/components/hud/PauseMenu.tsx`, `site/src/components/hud/TransitionOverlay.tsx`
- Test: `site/src/world/interaction.test.ts`
- Modify: `site/src/world/Scene.tsx` (mount InteractionSystem), `site/src/world/WorldCanvas.tsx` (mount Hud)

**Interfaces:**
- Produces: `nearestInteractable(interactables, pos)` (pure, tested), `InteractionSystem({ room })` (throttled prompt updates), and the HUD family. `Hud({ room }: { room: RoomDef })` is the single mount point WorldCanvas uses.

- [x] **Step 1: Write the failing test — `site/src/world/interaction.test.ts`:**

```ts
import { describe, expect, it } from "vitest";
import { nearestInteractable } from "./interaction";
import type { InteractableDef } from "./types";

const its: InteractableDef[] = [
  { id: "a", pos: [2, 2], radius: 1.5, prompt: "A" },
  { id: "b", pos: [6, 6], radius: 2, prompt: "B" },
];

describe("nearestInteractable", () => {
  it("returns the closest interactable within radius", () => {
    expect(nearestInteractable(its, { x: 2, z: 3 })?.id).toBe("a");
    expect(nearestInteractable(its, { x: 7, z: 6 })?.id).toBe("b");
  });

  it("returns null when nothing is in range", () => {
    expect(nearestInteractable(its, { x: 4, z: 4 })).toBeNull();
  });
});
```

- [x] **Step 2: Run it to verify it fails.** `npm run test` → FAIL: cannot resolve `./interaction`.

- [x] **Step 3: Create `site/src/world/interaction.ts`:**

```ts
import type { InteractableDef } from "./types";

export function nearestInteractable(
  interactables: InteractableDef[],
  pos: { x: number; z: number },
): InteractableDef | null {
  let best: InteractableDef | null = null;
  let bestDist = Infinity;
  for (const it of interactables) {
    const d = Math.hypot(it.pos[0] - pos.x, it.pos[1] - pos.z);
    if (d <= it.radius && d < bestDist) {
      best = it;
      bestDist = d;
    }
  }
  return best;
}
```

- [x] **Step 4: Run the test to verify it passes.** `npm run test` → interaction tests PASS.

- [x] **Step 5: Create `site/src/world/InteractionSystem.tsx`:**

```tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { playerPos, useWorldStore } from "./store";
import { nearestInteractable } from "./interaction";
import type { RoomDef } from "./types";

const CHECK_INTERVAL = 0.1; // seconds

export function InteractionSystem({ room }: { room: RoomDef }) {
  const acc = useRef(0);

  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < CHECK_INTERVAL) return;
    acc.current = 0;

    const store = useWorldStore.getState();
    if (store.paused || store.panel) {
      if (store.prompt !== null) store.setPrompt(null, null);
      return;
    }

    const nearest = nearestInteractable(room.interactables, playerPos);
    const prompt = nearest?.prompt ?? null;
    if (prompt !== store.prompt) {
      store.setPrompt(prompt, nearest?.action ?? null);
    }
  });

  return null;
}
```

- [x] **Step 6: Create the HUD components.** `site/src/components/hud/PromptBar.tsx`:

```tsx
export function PromptBar({ prompt }: { prompt: string }) {
  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded border border-accent bg-facility-bg/90 px-4 py-2 text-sm text-accent">
      [E] {prompt}
    </div>
  );
}
```

`site/src/components/hud/PauseMenu.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useWorldStore } from "@/world/store";

export function PauseMenu() {
  const paused = useWorldStore((s) => s.paused);
  const setPaused = useWorldStore((s) => s.setPaused);
  if (!paused) return null;
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-facility-bg/80">
      <div className="w-80 rounded-lg border border-facility-border bg-facility-surface p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">
          // Paused
        </p>
        <button
          onClick={() => setPaused(false)}
          className="mt-4 w-full rounded-md bg-accent px-4 py-2.5 font-mono text-sm font-bold text-facility-bg"
        >
          [ RESUME ]
        </button>
        <div className="mt-3 space-y-2 font-mono text-sm">
          <Link
            href="/"
            className="block rounded-md border border-facility-border px-4 py-2 hover:border-accent"
          >
            Standard portfolio
          </Link>
          <Link
            href="/projects"
            className="block rounded-md border border-facility-border px-4 py-2 hover:border-accent"
          >
            Projects
          </Link>
          <Link
            href="/contact"
            className="block rounded-md border border-facility-border px-4 py-2 hover:border-accent"
          >
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
```

`site/src/components/hud/TransitionOverlay.tsx`:

```tsx
"use client";

import { useWorldStore } from "@/world/store";

export function TransitionOverlay() {
  const transition = useWorldStore((s) => s.transition);
  return (
    <div
      className="absolute inset-0 bg-facility-bg transition-opacity duration-200"
      style={{ opacity: transition }}
    />
  );
}
```

`site/src/components/hud/Hud.tsx`:

```tsx
"use client";

import { useWorldStore } from "@/world/store";
import { PromptBar } from "./PromptBar";
import { PauseMenu } from "./PauseMenu";
import { TransitionOverlay } from "./TransitionOverlay";
import type { RoomDef } from "@/world/types";

export function Hud({ room }: { room: RoomDef }) {
  const prompt = useWorldStore((s) => s.prompt);
  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-4 font-mono">
      <div className="flex items-start justify-between">
        <div className="rounded border border-facility-border bg-facility-bg/80 px-3 py-2 text-xs tracking-widest">
          <span className="text-accent">AJ // RESEARCH FACILITY</span>
          <span className="mx-2 text-facility-muted">—</span>
          <span className="text-facility-text">{room.name}</span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="rounded border border-facility-border bg-facility-bg/80 px-3 py-2 text-xs text-facility-muted">
          WASD MOVE · E INTERACT · ESC MENU
        </span>
      </div>
      {prompt && <PromptBar prompt={prompt} />}
      <PauseMenu />
      <TransitionOverlay />
    </div>
  );
}
```

- [x] **Step 7: Wire up.** In `Scene.tsx` render `<InteractionSystem room={room} />` after `<PlayerController />`. In `WorldCanvas.tsx` render `<Hud room={room} />` right after `</Canvas>` (inside the wrapping div).

- [x] **Step 8: Verify (Phase 1 exit gate).** Dev server → `/world`:
  - HUD top-left shows `AJ // RESEARCH FACILITY — CORE MAIN HUB`; bottom-left shows controls hint
  - Walk to the terminal: `[E] ACCESS TERMINAL` appears (E does nothing yet — correct, no action attached)
  - Walk to each door: `[E] ... — UNDER CONSTRUCTION` appears
  - ESC opens pause menu (movement stops); RESUME closes; links navigate
  - Prompts vanish when you walk away; no prompt while paused
  - No console errors; steady 60 fps (devtools performance or FPS overlay)
  - `npm run build` + `npm run test` green

- [x] **Step 9: Commit.**

```powershell
git add -A
git commit -m "feat: interaction system and world HUD"
```

**Phase 1 exit gate** — verify all boxes at the top of this phase, then proceed.

---

### Phase 1 execution record (2026-09-14)

Executed on branch `phase/1-world-prototype` (repo initialised at `portfolio/`, baseline commit of spec + docs first). Evidence, not assertions:

| Check | How it was proven | Result |
|---|---|---|
| `npx tsc --noEmit` | run after Tasks 1.2, 1.4, 1.8 | exit 0 each time |
| `npm run build` | run after Tasks 1.1, 1.2, 1.4, 1.8 | green; `/world` prerendered (proves the `ssr:false`-in-client-component pattern works) |
| `npm run test` | collision (5), input (3), interaction (2) | 10/10 pass; each file seen failing first (module-not-found) before implementing |
| Canvas actually renders | headless Chromium (`--use-angle=swiftshader`) screenshot of `/world` | hub visible: tiled floor, instanced walls, four readable sign textures, terminal block, pillars, AJ.exe with visor + blob shadow |
| Prompts appear / clear | walk west 4 s → `[E] RESEARCH — UNDER CONSTRUCTION`; walk east 4 s → `[E] AGENT LAB — UNDER CONSTRUCTION`; walk away → cleared | pass |
| Collision blocks | walk north 4 s from spawn: `ACCESS TERMINAL` still in range and `VISION LAB` door prompt **not** reached → the terminal tile stops the player | pass |
| Wall-slide | unit test at the standable edge (`x=0.8`) plus the west-wall walk above | pass |
| ESC layering | pause hides the prompt; `[ RESUME ]` restores it | pass |
| Movement blocked while paused | byte-identical screenshots before/after 1.5 s of held movement while paused | pass |
| Touch/no-WebGL path | Pixel-7-like context on `/world` → `WorldFallback` | pass |
| Frame rate | **not claimed.** Software GL scales with pixels: 480×270 → 52 fps, 1280×720 → 9 fps, 1900×1080 → 4 fps, walking 8 fps. That is fill-rate of the CPU rasteriser, not scene cost | **open: needs 60 fps on a real integrated GPU** |
| Console errors | only the two Phase-0 prefetch 404s (A15) | benign, self-resolving |

Two things a human should still eyeball before Phase 2 is believed: the walk animation's readability at the fixed camera distance, and the fact that the hub's south-wall `ABOUT` sign shows its mirrored back face from the spawn camera (it reads correctly once you approach the door from inside — the camera sits further south than the wall).

---

# Phase 2 — Rooms & content integration

**Goal:** Hub connects to Nightfall and Noctis room shells via door teleports; in-world panels display real content from `src/content/`; deep links work.

**Exit gate:**

- [x] Walking through hub's N door fades to the Nightfall shell; E door to Noctis; doors back return to hub — no way to escape the map through a door tile
- [x] Hub terminal opens the About panel; Nightfall/Noctis terminals open their project panels; all panels close via ESC/× and pause movement
- [x] `/world?room=nightfall` starts inside Nightfall; the "ENTER THE LAB" button on `/projects/nightfall` works

### Task 2.1: Room shells + door wiring

**Files:**
- Create: `site/src/world/rooms/nightfall.ts`, `site/src/world/rooms/noctis.ts`
- Modify: `site/src/world/rooms/hub.ts` (add door records, remove `door-n`/`door-e` construction interactables), `site/src/world/rooms.ts` (register both rooms)

**Spec (data — copy exactly):**

Both rooms: `RoomDef` shaped like `hub.ts`. Maps are 19 wide × 13 deep:

```text
nightfall.map:  row 0  "###################"
                rows 1–11  "#.................#"
                row 12 "#########D#########"      // door S at (9,12)

noctis.map:     rows 0–5  "#.................#"
                row 6  "D.................#"      // door W at (0,6)
                rows 7–11 "#.................#"
                row 12 "###################"
```

| Field | nightfall | noctis |
|---|---|---|
| id / name | `nightfall` / `NIGHTFALL — VISION LAB` | `noctis` / `NOCTIS — AGENT LAB` |
| palette | floor `#2e2a26`, wall `#4a4038`, accent `#f6ad55`, trim `#b08968` | floor `#1f2b26`, wall `#31423a`, accent `#48bb78`, trim `#6b9c8a` |
| spawn | `{ x: 9, z: 11, facing: "n" }` | `{ x: 1, z: 6, facing: "e" }` |
| doors | `"9,12": { targetRoom: "hub", spawn: { x: 9, z: 1 }, facing: "s" }` | `"0,6": { targetRoom: "hub", spawn: { x: 17, z: 7 }, facing: "w" }` |

Shell props (replaced by full environments in Phases 3–4): one `sign` prop on the north wall interior (`text: "NIGHTFALL"` / `"NOCTIS"`, `face: "s"`, pos `[9, 2.4, 0.45]`, size `[3.2, 0.8, 0.12]`), one `screen` prop above it (pos `[9, 1.6, 0.55]`, size `[2.6, 1.4, 0.12]`, color = room accent, `face: "s"`), and two `box` crates (nightfall: `(4,9)` and `(14,9)`, size `[1,1,1]`; noctis: central pedestal at `(9,6)`, size `[1.6,1,1.6]`, blocked `{x:8,z:5,w:2,d:2}`). Nightfall crates blocked at their tiles. No interactables yet.

Hub edits: add to `doors`: `"9,0": { targetRoom: "nightfall", spawn: { x: 9, z: 11 }, facing: "n" }` and `"18,7": { targetRoom: "noctis", spawn: { x: 1, z: 6 }, facing: "e" }`. Delete the `door-n` and `door-e` interactables (doors now auto-teleport on step). Keep `door-w`/`door-s` construction prompts until Phase 5.

- [x] Verify: dev server — walk through each door both ways with the fade transition; walking onto a door tile and back does not re-trigger (door lock); you cannot walk off the map through a doorway (outside tiles are solid). `npm run build` + `npm run test` green.
- [x] Commit: `git add -A && git commit -m "feat: nightfall and noctis room shells with door teleports"`

### Task 2.2: Real content panels

**Files:**
- Create: `site/src/components/project/ProjectPanel.tsx`, `site/src/components/hud/PanelHost.tsx`
- Modify: `site/src/components/hud/Hud.tsx` (render `<PanelHost />` last)

**Contracts:**

- `ProjectPanel({ title, onClose, children })` — dim overlay (`bg-facility-bg/70`), centered scrollable card (`max-w-2xl max-h-[80vh] overflow-y-auto`, card recipe classes from §4), header with `// {title}` label + `[ CLOSE ]` button, click-outside closes, `stopPropagation` on the card.
- `PanelHost` — reads `panel` from the world store; renders nothing when null. Branches:
  - `kind: "project"` → find project by slug in `projects`, render `<ProjectSections project={project} />` inside `ProjectPanel` titled `{project.name} — {project.room.title}`.
  - `kind: "about"` → About panel: name, title, location, tagline, timeline list (from `site`), plus a contact footer with email/GitHub/LinkedIn links (this is the contact surface — no 3D contact form, per cut list).
  - `kind: "research"` → Research panel: `site.research` stations as compact cards.
  - `kind: "demo"` → return `null` (wired in Phase 3).

- [x] Verify: temporarily add an interactable with a project panel action, open it, check sections render identically to `/projects/nightfall`, ESC closes, movement is blocked while open. `npm run build` green.
- [x] Commit: `git add -A && git commit -m "feat: world panels render shared content"`

### Task 2.3: Wire interactables to panels

**Files:** Modify `site/src/world/rooms/hub.ts`, `nightfall.ts`, `noctis.ts`

**Interactables to add (exact):**

| Room | id | pos | radius | prompt | action |
|---|---|---|---|---|---|
| hub | `hub-terminal` (modify existing) | `[9,6]` | 1.6 | `ACCESS TERMINAL` | panel `about` |
| nightfall | `nf-monitor` | `[9,2]` | 1.8 | `VIEW SYSTEM STATUS` | panel project `nightfall` |
| nightfall | `nf-terminal-l` | `[4,8]` | 1.4 | `TECHNICAL DETAILS` | panel project `nightfall` |
| nightfall | `nf-terminal-r` | `[14,8]` | 1.4 | `TECHNICAL DETAILS` | panel project `nightfall` |
| noctis | `nx-display` | `[9,7]` | 1.8 | `VIEW AGENT SYSTEM` | panel project `noctis` |

Also add a sign prop to each lab labeling the door back (`text: "← CORE HUB"` above the interior side of the door, facing into the room).

- [x] Verify: each prompt appears at the right spot; E opens the right panel; walking away clears the prompt; no prompt shows while a panel is open.
- [x] Commit: `git add -A && git commit -m "feat: interactables open content panels"`

### Task 2.4: Deep links

**Files:** Modify `site/src/world/WorldCanvas.tsx`

Add a mount-only `useEffect`: read `new URLSearchParams(window.location.search).get("room")`; if `rooms[room]` exists and is not `"hub"`, call `useWorldStore.getState().enterRoom(room, rooms[room].spawn)`. A brief hub flash before the swap is acceptable — do not add a loading state for it.

- [x] Verify: `/world?room=nightfall` and `/world?room=noctis` start in the right room; `/world?room=nonsense` starts in hub; the "ENTER THE LAB" buttons on project pages work end-to-end.
- [x] Commit: `git add -A && git commit -m "feat: world deep links"`

---

## Phase 2 execution record (2026-09-15)

Tasks 2.1–2.4 executed on `phase/1-world-prototype`. The hub now has two live
doorways; Nightfall and Noctis are walkable rooms whose terminals open panels
rendered from `src/content/` (the same `ProjectSections` body the pages use), and
`/world?room=<slug>` deep links work.

| Gate | Evidence |
|---|---|
| Doors both ways, no escape through a doorway | probe: Nightfall south doorway → hub, and the same doorway re-enters Nightfall; identical round trip for Noctis's west doorway. Door lock verified by the return leg not re-triggering. |
| Panels show real content | probe: `// Nightfall — VISION LAB` panel contains "0.938 mean over 15 MVTec categories" and the unfavourable "1304 ms INT8"; `Noctis — AGENT LAB` panel lists the real graph nodes (`reassembler`, `critic`); hub terminal opens the About panel with the timeline. |
| ESC layering | probe: ESC closes a panel without opening the pause menu; with no panel open, ESC opens it. |
| Deep links | probe: `?room=nightfall` / `?room=noctis` start in the right room; an unknown or not-yet-registered room (e.g. `?room=research`) falls back to the hub rather than a blank world. |
| Collision and prompts intact | probe: a straight north walk from spawn is stopped by the central terminal (`[E] ACCESS TERMINAL` appears), i.e. blocked props still block. |
| Gates | `npx tsc --noEmit` 0 · `npm run lint` 0 · `npm run test` 12/12 · `npm run build` green (13 routes) · zero console errors in every scenario. |

**Deviation from the plan's commit granularity:** Tasks 2.1 and 2.3 edit the same
room-data files (a room's `interactables` are part of its `RoomDef`), so they land
as one commit; 2.2 and 2.4 are separate. Task 2.1's "no interactables yet" step
therefore does not exist as a separate state.

**Two things a human should look at before Phase 3 is trusted:**
1. The hub's central terminal sits exactly on the spawn→north-door axis, so the
   first thing every visitor does is walk into it. It reads as intentional
   furniture and `[E]` explains it, but if it feels like a wall, move the terminal
   to tile (9,5)→(8,5) or shift spawn to x=11.
2. The lab doorways have no `[E]` prompt any more (they teleport on step, per
   Task 2.1). The `← CORE HUB` signs are what tell you a doorway is a doorway.
   Walk it yourself and decide whether that is enough signalling.

---
# Phase 3 — Nightfall room: full environment + animated inspection demo

> **Amended 2026-09-15 (A26).** Nightfall has no deployed public endpoint, so this
> phase ships the **animated** demo: the visitor's image is resized, scored by the
> deterministic mock and badged `SAMPLE MODE`, with the anomaly map drawn over it.
> Everything else about the phase is unchanged — the `/api/inspect` proxy, its
> validation, rate limiting and backend contract (Appendix A) are still built,
> because they are what makes the demo switchable to live inference later without
> touching the UI. **Nothing in the UI may imply live inference while the mock is
> what is running.** The live path becomes opt-in when a backend exists (Task 7.2
> Option B), not a launch requirement.

**Goal:** The complete industrial lab (spec §11) with a working inspection demo: upload an image, get a clearly-labelled simulated inference result with heatmap, score, and latency — through a rate-limited, timeout-guarded proxy that degrades gracefully.

**Exit gate:**

- [ ] Room reads as an inspection station: conveyor with moving products, gantry camera, live monitor, anomaly samples, glowing TRY IT YOURSELF sign
- [ ] Demo: upload → result panel with status/score/latency/heatmap, badged SAMPLE/MOCK; samples tab works once AJ provides images
- [ ] `/api/inspect`: 400 missing field, 415 non-image, 413 over 2 MB, 429 after 5 rapid requests, 503 backend down, 504 on timeout, mock result when `NIGHTFALL_MOCK=1`
- [ ] With the backend unreachable, the demo still works in clearly-badged sample mode
- [ ] `npm run build` + `npm run test` + `npm run lint` green

### Task 3.1: Full room environment

**Files:** Modify `site/src/world/rooms/nightfall.ts` (replace shell props/interactables)

**Props (exact; `pos` is `[x, y, z]` in tile units):**

| Element | Props |
|---|---|
| Conveyor (z=4, x 3–15) | belt: `box [9, 0.35, 4] size [13, 0.3, 1.2]` color `#3a332c`; two rails: `box [9, 0.5, 3.55]` and `[9, 0.5, 4.45]`, `size [13, 0.12, 0.12]`, color trim; blocked `{ x: 3, z: 4, w: 13, d: 1 }` |
| Inspection gantry | post: `box [9, 1.2, 3.3] size [0.2, 2.4, 0.2]` color `#232b3e`; camera head: `box [9, 2.2, 4] size [0.5, 0.4, 0.5]` color `#232b3e` + lens `box [9, 2.2, 4.28] size [0.2, 0.2, 0.06]` color accent; blocked `{ x: 9, z: 3, w: 1, d: 1 }` |
| Main monitor (north wall) | screen mesh at `[9, 1.8, 0.55] size [3.6, 2, 0.15]` facing `s` — driven by `ScreenTexture` in Task 3.2 (until then, a plain accent-colored screen prop) |
| Sample shelves (west wall, z 6–9) | two planks: `box [1.25, 0.6, 7.5]` and `[1.25, 1.2, 7.5]`, `size [0.7, 0.08, 3.6]`, color `#4a4038`; three product boxes on the planks (`size [0.4, 0.3, 0.4]`, one tinted `#e5534b`); blocked `{ x: 1, z: 6, w: 1, d: 4 }` |
| TRY IT YOURSELF sign (east wall) | `sign [17.5, 2.2, 7] size [3.2, 0.9, 0.12] text "TRY IT YOURSELF" face "w"` + frame `box [17.55, 2.2, 7] size [0.12, 1, 3.4]` color `#232b3e` |
| Terminals | keep shell terminals at `(4,9)` and `(14,9)` |

**Interactables (final):** keep `nf-monitor`, `nf-terminal-l/r` from Task 2.3; add `nf-sign`: pos `[17, 7]`, radius 1.8, prompt `TRY NIGHTFALL`, action panel `demo` `nightfall`; add `nf-samples`: pos `[2, 7]`, radius 1.6, prompt `INSPECT SAMPLES`, action panel project `nightfall`.

- [ ] Verify: room reads correctly at a glance — conveyor spans the room, camera hangs over its center, big monitor on the north wall, red-tinted sample on the shelf, sign glows on the east wall. All blocked rects actually block.
- [ ] Commit: `git add -A && git commit -m "feat: nightfall lab environment"`

### Task 3.2: Conveyor + monitor ambient loop

**Files:** Create `site/src/world/nightfall/Conveyor.tsx`; modify `Scene.tsx` to render it when `room.id === "nightfall"`

**Spec:**

- 5 product boxes (`size [0.7, 0.35, 0.7]`, color `#b08968`), spaced 2.6 tiles apart, moving `+x` at 1.2 tiles/s along z=4 at y=0.65; wrap x > 15.5 → x = 3.
- Every 4th product (deterministic by index) is anomalous. Anomaly products turn `#e5534b` **after** passing the gantry (x > 9).
- When a product crosses x=9 (prev < 9 ≤ now), update the monitor. The monitor is a `ScreenTexture` (from `textures.ts`) rendered on the monitor mesh from Task 3.1; update at most 2×/second:

```text
NIGHTFALL VISION SYSTEM
STATUS: ONLINE
MODEL: PatchCore
INFERENCE: 112 ms        <- EDIT-ME: replace with real measured latency
LAST: NORMAL             <- or ANOMALY DETECTED (accent switches ok/anomaly color)
```

- All state is local refs inside the component. No zustand, no React state per frame (AD-12). Dispose the `ScreenTexture` on unmount.

- [ ] Verify: products flow continuously at 60 fps; monitor text updates as products pass; anomaly tint appears only after the gantry; walking into the conveyor is blocked.
- [ ] Commit: `git add -A && git commit -m "feat: nightfall conveyor and live monitor"`

---

### Task 3.3: Room data validator (TDD)

**Files:**
- Create: `site/src/world/rooms.test.ts`

**Interfaces:**
- Consumes: `rooms` (registry), `RoomDef`. Produces: nothing importable — a permanent guard on hand-written room data (AD-17). Runs on every `npm run test`.

**Why this exists before the demo:** every room in this plan is hand-drawn ASCII (Task 1.2, 2.1, 3.1, 4.1, 5.1, 5.2). One miscounted `#` puts the player outside the world or buries a door. Phase 4–5 add three more rooms; this task makes that cheap.

- [ ] **Step 1: Write the test** — `site/src/world/rooms.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { rooms } from "./rooms";
import type { RoomDef } from "./types";

const LEGAL = new Set(["#", ".", "D"]);
const ids = Object.keys(rooms);

function charAt(room: RoomDef, x: number, z: number): string | undefined {
  return room.map[z]?.[x];
}

function walkable(room: RoomDef, x: number, z: number): boolean {
  const c = charAt(room, Math.floor(x), Math.floor(z));
  return c === "." || c === "D";
}

describe.each(ids)("room %s", (id) => {
  const room = rooms[id];
  const width = room.map[0].length;
  const depth = room.map.length;

  it("is registered under its own id", () => {
    expect(room.id).toBe(id);
  });

  it("has a rectangular map of legal tiles", () => {
    expect(depth).toBeGreaterThanOrEqual(5);
    expect(width).toBeGreaterThanOrEqual(9);
    for (const row of room.map) {
      expect(row.length, `${id}: ragged row "${row}"`).toBe(width);
      for (const ch of row) expect(LEGAL.has(ch), `${id}: illegal tile "${ch}"`).toBe(true);
    }
  });

  it("is sealed: walls or doors on the border, floor everywhere inside", () => {
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        const border = x === 0 || z === 0 || x === width - 1 || z === depth - 1;
        const c = charAt(room, x, z)!;
        if (border) {
          expect(c === "#" || c === "D", `${id}: border tile ${x},${z} is "${c}"`).toBe(true);
        } else {
          expect(c, `${id}: interior tile ${x},${z} must be "."`).toBe(".");
        }
      }
    }
  });

  it("spawns on a walkable tile", () => {
    expect(walkable(room, room.spawn.x, room.spawn.z), `${id}: spawn is inside a wall`).toBe(true);
  });

  it("points every door at a real room, onto a walkable tile", () => {
    for (const [key, door] of Object.entries(room.doors)) {
      const [x, z] = key.split(",").map(Number);
      expect(charAt(room, x, z), `${id}: door key ${key} is not a 'D' tile`).toBe("D");
      const target = rooms[door.targetRoom];
      expect(target, `${id}: door ${key} targets unknown room "${door.targetRoom}"`).toBeDefined();
      expect(walkable(target, door.spawn.x, door.spawn.z), `${id}: door ${key} lands inside a wall in ${target.id}`).toBe(true);
    }
  });

  it("pairs each door with a return door next to the doorway it came from", () => {
    for (const [key, door] of Object.entries(room.doors)) {
      const target = rooms[door.targetRoom];
      const backs = Object.values(target.doors).filter((d) => d.targetRoom === id);
      expect(backs.length, `${id}: ${target.id} has no door back`).toBeGreaterThan(0);
      const [dx, dz] = key.split(",").map(Number);
      const min = Math.min(...backs.map((d) => Math.hypot(d.spawn.x - dx, d.spawn.z - dz)));
      expect(min, `${id}: return door from ${target.id} drops you ${min} tiles from the doorway`).toBeLessThanOrEqual(2);
      void door;
    }
  });

  it("keeps interactables unique, on floor, and in range", () => {
    const seen = new Set<string>();
    for (const item of room.interactables) {
      expect(seen.has(item.id), `${id}: duplicate interactable id "${item.id}"`).toBe(false);
      seen.add(item.id);
      expect(walkable(room, item.pos[0], item.pos[1]), `${id}: interactable "${item.id}" is not on floor`).toBe(true);
      expect(item.radius).toBeGreaterThan(0);
      expect(item.radius).toBeLessThanOrEqual(3);
      expect(item.prompt.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps blocked rects and props inside the room", () => {
    for (const b of room.blocked) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.z).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w - 1).toBeLessThan(width);
      expect(b.z + b.d - 1).toBeLessThan(depth);
    }
    for (const p of room.props) {
      expect(p.pos[0]).toBeGreaterThanOrEqual(0);
      expect(p.pos[0]).toBeLessThan(width);
      expect(p.pos[2]).toBeGreaterThanOrEqual(0);
      expect(p.pos[2]).toBeLessThan(depth);
      expect(p.pos[1]).toBeGreaterThanOrEqual(0);
      expect(p.size.every((s) => s > 0), `${id}: prop at ${p.pos.join(",")} has a non-positive size`).toBe(true);
    }
  });
});

describe("facility connectivity", () => {
  it("reaches every registered room from hub", () => {
    const seen = new Set(["hub"]);
    const queue = ["hub"];
    while (queue.length) {
      const room = rooms[queue.shift()!];
      for (const d of Object.values(room.doors)) {
        if (!seen.has(d.targetRoom)) {
          seen.add(d.targetRoom);
          queue.push(d.targetRoom);
        }
      }
    }
    expect([...seen].sort()).toEqual([...ids].sort());
  });
});
```

- [ ] **Step 2: Run it.** `npm run test` → PASS (hub, nightfall, noctis). If a room data bug surfaces, **fix the room, not the test** — unless the room is deliberately different, in which case record why here.

- [ ] **Step 3: Prove the test bites.** Temporarily change one character in `rooms/nightfall.ts` row 1 from `.` to `#`, run `npm run test` → expect a failure naming the tile; revert.

- [ ] **Step 4: Verify.** `npm run build` green. `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "test: guard every hand-written room map"`

---

### Task 3.4: Demo contract, deterministic mock, rate limiter (TDD)

**Files:**
- Create: `site/src/lib/hash.ts`, `site/src/lib/rate-limit.ts`, `site/src/lib/demo-results.ts`
- Tests: `site/src/lib/hash.test.ts`, `site/src/lib/rate-limit.test.ts`, `site/src/lib/demo-results.test.ts`

**Interfaces:**
- Produces: `fnv1a(str): number`, `prng(seed): () => number`, `createRateLimiter(opts?): RateLimiter`, `InspectResult`, `DemoSource`, `GRID_SIZE`, `MODEL_LABEL`, `mockInspectResult(inputKey, latencyMs): InspectResult`, `parseBackendResponse(json): InspectResult | null`. Task 3.5 (server) and Tasks 3.6–3.7 (client) both consume these; the type never gets redefined.

- [ ] **Step 1: Create `site/src/lib/hash.ts`:**

```ts
/** FNV-1a 32-bit. Deterministic keys for the mock (no crypto needed). */
export function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32: same seed -> same sequence. Keeps mock results stable across reloads. */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 2: Create `site/src/lib/hash.test.ts`:**

```ts
import { describe, expect, it } from "vitest";
import { fnv1a, prng } from "./hash";

describe("fnv1a", () => {
  it("matches the 32-bit offset basis for the empty string", () => {
    expect(fnv1a("")).toBe(2166136261);
  });

  it("is deterministic and inside uint32", () => {
    const a = fnv1a("gear-01.jpg:48213");
    expect(fnv1a("gear-01.jpg:48213")).toBe(a);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(4294967295);
  });

  it("separates nearby inputs", () => {
    const set = new Set(["a", "b", "a ", "gear-01.jpg", "gear-02.jpg"].map(fnv1a));
    expect(set.size).toBe(5);
  });
});

describe("prng", () => {
  it("produces the same sequence for the same seed", () => {
    expect([prng(7)(), prng(7)(), prng(7)()]).toEqual([prng(7)(), prng(7)(), prng(7)()]);
  });

  it("stays in [0, 1)", () => {
    const r = prng(12345);
    for (let i = 0; i < 500; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
```

- [ ] **Step 3: Create `site/src/lib/rate-limit.ts`:**

```ts
export interface RateDecision {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number, nowMs: number): RateDecision;
}

/**
 * Fixed-window counter keyed by caller-supplied string (an IP in Task 3.5).
 * `nowMs` is injected so the logic is unit-testable without fake timers.
 */
export function createRateLimiter(opts: { maxKeys?: number } = {}): RateLimiter {
  const maxKeys = opts.maxKeys ?? 5000;
  const windows = new Map<string, { start: number; count: number }>();

  return {
    check(key, limit, windowMs, nowMs) {
      const prev = windows.get(key);
      const entry = prev && nowMs - prev.start < windowMs ? prev : { start: nowMs, count: 0 };
      entry.count += 1;
      windows.set(key, entry);

      // ponytail: swept only when the map grows, because a portfolio never
      // gets enough distinct IPs to care. Upgrade path: Upstash / Vercel
      // middleware for a shared, cross-instance counter.
      if (windows.size > maxKeys) {
        for (const [k, v] of windows) {
          if (nowMs - v.start >= windowMs) windows.delete(k);
        }
      }

      const allowed = entry.count <= limit;
      return {
        allowed,
        remaining: Math.max(0, limit - entry.count),
        retryAfterMs: allowed ? 0 : Math.max(0, windowMs - (nowMs - entry.start)),
      };
    },
  };
}
```

- [ ] **Step 4: Create `site/src/lib/rate-limit.test.ts`:**

```ts
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

const LIMIT = 5;
const WINDOW = 60_000;

describe("createRateLimiter", () => {
  it("allows `limit` requests then blocks with a usable retryAfter", () => {
    const l = createRateLimiter();
    const t0 = 1_000_000;
    for (let i = 1; i <= LIMIT; i++) {
      const d = l.check("ip", LIMIT, WINDOW, t0);
      expect(d.allowed).toBe(true);
      expect(d.remaining).toBe(LIMIT - i);
    }
    const blocked = l.check("ip", LIMIT, WINDOW, t0 + 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(WINDOW - 1_000);
  });

  it("resets in a new window", () => {
    const l = createRateLimiter();
    for (let i = 0; i < LIMIT; i++) l.check("ip", LIMIT, WINDOW, 0);
    expect(l.check("ip", LIMIT, WINDOW, WINDOW).allowed).toBe(true);
    expect(l.check("ip", LIMIT, WINDOW, WINDOW).remaining).toBe(LIMIT - 1);
  });

  it("tracks keys independently", () => {
    const l = createRateLimiter();
    for (let i = 0; i < LIMIT; i++) l.check("a", LIMIT, WINDOW, 0);
    expect(l.check("a", LIMIT, WINDOW, 0).allowed).toBe(false);
    expect(l.check("b", LIMIT, WINDOW, 0).allowed).toBe(true);
  });

  it("does not grow without bound past maxKeys", () => {
    const l = createRateLimiter({ maxKeys: 10 });
    for (let i = 0; i < 500; i++) l.check(`ip-${i}`, LIMIT, WINDOW, i * (WINDOW + 1));
    expect(l.check("late-key", LIMIT, WINDOW, 10_000_000).allowed).toBe(true);
  });
});
```

- [ ] **Step 5: Create `site/src/lib/demo-results.ts`:**

```ts
import { fnv1a, prng } from "./hash";

export type DemoSource = "live" | "mock" | "sample";

/** The anomaly map is always downscaled to GRID_SIZE x GRID_SIZE before it crosses the wire. */
export const GRID_SIZE = 32;
export const MODEL_LABEL = "PatchCore (wide_resnet50_2)";
const THRESHOLD = 0.5;

export interface InspectResult {
  status: "NORMAL" | "ANOMALY";
  score: number;
  threshold: number;
  latencyMs: number;
  model: string;
  gridSize: number;
  /** row-major, gridSize^2 values in 0..1 */
  grid: number[];
  source: DemoSource;
  /** human sentence explaining what the visitor is looking at; null only for live results */
  note: string | null;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Deterministic stand-in for a real inference (AD-06). Same image key -> same
 * verdict, so the demo never contradicts itself between the monitor, the panel
 * and the standard page.
 */
export function mockInspectResult(inputKey: string, latencyMs: number): InspectResult {
  const seed = fnv1a(inputKey);
  const rand = prng(seed);
  const anomalous = seed % 3 === 0;
  const score = anomalous ? 0.62 + rand() * 0.36 : 0.04 + rand() * 0.3;
  const grid: number[] = [];

  const blobs = anomalous ? 1 + (seed % 2) : 0;
  const centres = Array.from({ length: blobs }, () => ({
    x: 0.2 + rand() * 0.6,
    z: 0.2 + rand() * 0.6,
    r: 0.08 + rand() * 0.1,
  }));

  for (let z = 0; z < GRID_SIZE; z++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const u = x / (GRID_SIZE - 1);
      const v = z / (GRID_SIZE - 1);
      let cell = rand() * 0.06; // sensor noise floor
      for (const c of centres) {
        const d = Math.hypot(u - c.x, v - c.z);
        cell += Math.exp(-(d * d) / (2 * c.r * c.r)) * score;
      }
      grid.push(round3(Math.min(1, cell)));
    }
  }

  return {
    status: score >= THRESHOLD ? "ANOMALY" : "NORMAL",
    score: round3(score),
    threshold: THRESHOLD,
    latencyMs,
    model: MODEL_LABEL,
    gridSize: GRID_SIZE,
    grid,
    source: "mock",
    note: "MOCK RESULT — the Nightfall backend is not connected. Values are simulated deterministically from your image.",
  };
}

/**
 * Validate the untrusted Nightfall backend payload (Appendix A.2). Field names
 * match anomalib's prediction object. Returns null on anything malformed so the
 * route can answer 502 instead of rendering garbage.
 */
export function parseBackendResponse(json: unknown): InspectResult | null {
  if (typeof json !== "object" || json === null) return null;
  const r = json as Record<string, unknown>;
  const score = r.pred_score;
  const label = r.pred_label;
  const map = r.anomaly_map;
  const latency = r.latency_ms;

  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1) return null;
  if (label !== 0 && label !== 1) return null;
  if (typeof latency !== "number" || !Number.isFinite(latency) || latency < 0) return null;
  if (!Array.isArray(map) || map.length === 0 || map.length > 64) return null;

  const grid: number[] = [];
  for (const row of map) {
    if (!Array.isArray(row) || row.length !== map.length) return null; // square only
    for (const v of row) {
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1) return null;
      grid.push(round3(v));
    }
  }
  if (grid.length !== map.length * map.length) return null;

  return {
    status: label === 1 || score >= THRESHOLD ? "ANOMALY" : "NORMAL",
    score: round3(score),
    threshold: THRESHOLD,
    latencyMs: Math.round(latency),
    model: MODEL_LABEL,
    gridSize: map.length,
    grid,
    source: "live",
    note: null,
  };
}
```

Note on `latency_ms`: if the backend omits or mis-types it, `parseBackendResponse` still returns a result only when it is a finite non-negative number; Task 3.5 overwrites `latencyMs` with the proxy's own wall-clock measurement either way, so the number the visitor sees is always real.

- [ ] **Step 6: Create `site/src/lib/demo-results.test.ts`:**

```ts
import { describe, expect, it } from "vitest";
import { GRID_SIZE, MODEL_LABEL, mockInspectResult, parseBackendResponse } from "./demo-results";

describe("mockInspectResult", () => {
  it("is deterministic for the same image key", () => {
    expect(mockInspectResult("gear-01.jpg:48213", 118)).toEqual(mockInspectResult("gear-01.jpg:48213", 118));
  });

  it("returns a well-formed, in-range result for many inputs", () => {
    for (let i = 0; i < 60; i++) {
      const r = mockInspectResult(`key-${i}`, 100 + i);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
      expect(r.status).toBe(r.score >= r.threshold ? "ANOMALY" : "NORMAL");
      expect(r.grid).toHaveLength(GRID_SIZE * GRID_SIZE);
      expect(r.grid.every((v) => v >= 0 && v <= 1)).toBe(true);
      expect(r.model).toBe(MODEL_LABEL);
      expect(r.source).toBe("mock");
      expect(r.note).toContain("MOCK");
    }
  });

  it("produces both verdicts across a realistic spread of images", () => {
    const verdicts = new Set(Array.from({ length: 40 }, (_, i) => mockInspectResult(`img-${i}.jpg`, 110).status));
    expect(verdicts.has("NORMAL")).toBe(true);
    expect(verdicts.has("ANOMALY")).toBe(true);
  });
});

describe("parseBackendResponse", () => {
  const good = {
    pred_label: 1,
    pred_score: 0.87,
    latency_ms: 121,
    anomaly_map: Array.from({ length: 8 }, (_, z) =>
      Array.from({ length: 8 }, (_, x) => (x === z ? 0.9 : 0.02)),
    ),
  };

  it("accepts a valid anomalib-shaped payload", () => {
    const r = parseBackendResponse(good);
    expect(r).not.toBeNull();
    expect(r!.status).toBe("ANOMALY");
    expect(r!.gridSize).toBe(8);
    expect(r!.grid).toHaveLength(64);
    expect(r!.source).toBe("live");
  });

  it("rejects garbage at the trust boundary", () => {
    expect(parseBackendResponse(null)).toBeNull();
    expect(parseBackendResponse("ok")).toBeNull();
    expect(parseBackendResponse({ ...good, pred_score: 12 })).toBeNull();
    expect(parseBackendResponse({ ...good, pred_score: "0.8" })).toBeNull();
    expect(parseBackendResponse({ ...good, pred_label: 7 })).toBeNull();
    expect(parseBackendResponse({ ...good, latency_ms: -1 })).toBeNull();
    expect(parseBackendResponse({ ...good, anomaly_map: [] })).toBeNull();
    expect(parseBackendResponse({ ...good, anomaly_map: [[0.1], [0.2]] })).toBeNull();
    expect(parseBackendResponse({ ...good, anomaly_map: good.anomaly_map.map((row, i) => (i === 0 ? row.slice(0, 7) : row)) })).toBeNull();
    expect(parseBackendResponse({ ...good, anomaly_map: good.anomaly_map.map((row) => row.map(() => 2)) })).toBeNull();
    expect(parseBackendResponse({ ...good, anomaly_map: Array.from({ length: 65 }, () => [0.1]) })).toBeNull();
  });
});
```

- [ ] **Step 7: Run the tests.** `npm run test` → all hash / rate-limit / demo-results tests PASS. Then `npx tsc --noEmit` clean (fix any strict-mode complaint properly — e.g. `map.length` narrowing after `Array.isArray` is fine, `r!.grid` in tests is fine).

- [ ] **Step 8: Commit.** `git add -A && git commit -m "feat: demo contract with deterministic mock and rate limiter"`

---

### Task 3.5: `/api/inspect` — the rate-limited inference proxy

**Files:**
- Create: `site/src/app/api/inspect/route.ts`

**Interfaces:**
- Consumes: `createRateLimiter` (Task 3.4), `mockInspectResult`, `parseBackendResponse`, `InspectResult` (Task 3.4), env vars from `.env.example` (Task 0.1).
- Produces: `POST /api/inspect` → `InspectResult` JSON, or `{ error, message }` with the status codes in the table below. Task 3.7 is the only caller.

**Response contract (exact):**

| Condition | Status | `error` |
|---|---|---|
| success (live or mock) | 200 | — |
| body is not multipart / no `file` field / unreadable | 400 | `bad_request` |
| MIME type not in `image/jpeg`, `image/png`, `image/webp` | 415 | `unsupported_media_type` |
| empty file, or > 2 MB after the client already downscaled | 413 | `payload_too_large` |
| 6th request from the same IP inside 60 s | 429 | `rate_limited` (+ `Retry-After` header) |
| backend DNS/connect/HTTP failure | 503 | `backend_unreachable` |
| backend replied but payload failed `parseBackendResponse` | 502 | `backend_shape` |
| backend took > 15 s | 504 | `backend_timeout` |
| any verb other than POST | 405 | `method_not_allowed` (+ `Allow: POST`) |

**Why 2 MB and not the spec's looser number:** a Vercel Function request body caps at **4.5 MB** (verified 2026-09-14) and a Next.js route handler cannot raise it. The client resizes to a 1024 px long edge at JPEG q0.85 (Task 3.6), which lands at roughly 100–350 KB for a photo, so the 2 MB server cap is a guard rail, not a user-facing limit. Anything bigger means someone is not using the browser UI.

- [ ] **Step 1: Create `site/src/app/api/inspect/route.ts`:**

```ts
import { createRateLimiter } from "@/lib/rate-limit";
import {
  mockInspectResult,
  parseBackendResponse,
  type InspectResult,
} from "@/lib/demo-results";

export const runtime = "nodejs";
export const maxDuration = 30; // > our own 15 s upstream timeout, < Vercel's 300 s ceiling

const LIMIT = 5;
const WINDOW_MS = 60_000;
const MAX_BYTES = 2 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 15_000;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Module scope = shared by every request handled by this warm instance. */
const limiter = createRateLimiter();

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

function fail(error: string, message: string, status: number, headers?: Record<string, string>) {
  return json({ error, message }, status, headers);
}

export async function POST(request: Request) {
  // Rate limit before touching the body: a flooded endpoint should never pay
  // for parsing uploads it will refuse anyway.
  const ip = (request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
  const now = Date.now();
  const decision = limiter.check(ip, LIMIT, WINDOW_MS, now);
  if (!decision.allowed) {
    const seconds = Math.ceil(decision.retryAfterMs / 1000);
    return fail(
      "rate_limited",
      `The inspection demo is limited to ${LIMIT} images per minute. Try again in ${seconds}s.`,
      429,
      { "retry-after": String(seconds) },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("bad_request", "Expected a multipart/form-data upload with a file field.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail("bad_request", 'Missing the "file" field.', 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return fail("unsupported_media_type", "Upload a JPEG, PNG or WebP photo of a part.", 415);
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return fail("payload_too_large", "That image is too large for the demo (2 MB max after resize).", 413);
  }

  const started = Date.now();
  const baseUrl = process.env.NIGHTFALL_API_URL;
  const mocked = process.env.NIGHTFALL_MOCK === "1" || !baseUrl;

  if (mocked) {
    // Honest latency: this is the real round trip through the route handler,
    // only the inference inside it is simulated.
    const result: InspectResult = mockInspectResult(`${file.name}:${file.size}:${file.type}`, Date.now() - started);
    return json(result, 200);
  }

  const headers: Record<string, string> = {};
  if (process.env.NIGHTFALL_API_KEY) {
    headers.authorization = `Bearer ${process.env.NIGHTFALL_API_KEY}`;
  }

  let upstream: Response;
  try {
    upstream = await fetch(baseUrl, {
      method: "POST",
      body: form, // forward the already-validated multipart body as-is (Appendix A.2)
      headers,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    return timedOut
      ? fail("backend_timeout", "Inference took longer than 15 seconds.", 504)
      : fail("backend_unreachable", "The Nightfall backend could not be reached.", 503);
  }

  if (!upstream.ok) {
    return fail("backend_unreachable", `The Nightfall backend returned ${upstream.status}.`, 503);
  }

  let parsed: InspectResult | null;
  try {
    parsed = parseBackendResponse(await upstream.json());
  } catch {
    parsed = null;
  }
  if (!parsed) {
    return fail("backend_shape", "The Nightfall backend returned something unexpected.", 502);
  }

  return json({ ...parsed, latencyMs: Date.now() - started }, 200);
}

export function GET() {
  return fail("method_not_allowed", "POST an image to this endpoint.", 405, { allow: "POST" });
}
```

- [ ] **Step 2: Verify locally with curl** (dev server running, `NIGHTFALL_MOCK=1` in `.env.local`). Full recipe in Appendix C.2; the short form:

```powershell
curl.exe -s -o out.json -w "%{http_code}" -X POST http://localhost:3000/api/inspect -F "file=@C:\path\to\test.jpg"
```

Expected: `200`, and `out.json` contains `"source":"mock"`, `"gridSize":32`, a `grid` of 1024 numbers, and a `latencyMs` of a few ms.

- [ ] **Step 3: Verify every rejection path** — run the Appendix C.2 matrix end to end. All eight rows must produce exactly the status shown there (and the `error` string from the table above where one is defined), including 429 on the sixth rapid request — restart `next dev` first so the counters start empty — and 405 for GET.

- [ ] **Step 4: Verify the size guard is the last line, not the only line.** Send a 4 MB JPEG with `curl` (row 3 of C.2): expect the route's own `413` JSON body, not Vercel's platform error page and not a forward to the backend. The browser UI cannot even produce that request, because Task 3.6 resizes first — which is the intended order of defence.

- [ ] **Step 5: Verify no state leaks.** `npm run build` green. Confirm `route.ts` imports nothing from `src/world/**` or `src/components/**` — the API must not drag three.js into a server bundle. `npx tsc --noEmit` clean.

- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat: rate-limited nightfall inference proxy"`

---

### Task 3.6: Heatmap rendering + upload downscale

**Files:**
- Create: `site/src/components/demo/heatmap.ts`, `site/src/components/demo/heatmap.test.ts`, `site/src/components/demo/downscale.ts`

**Interfaces:**
- Produces: `heatColor(t: number): [r, g, b, a]`, `drawHeatmap(ctx, width, height, grid, gridSize)`, `MAX_EDGE`, `JPEG_QUALITY`, `downscaleToBlob(input): Promise<{ blob, name, width, height }>`. Consumed by Task 3.7 only.

- [ ] **Step 1: Create `site/src/components/demo/heatmap.ts`:**

```ts
/**
 * Anomaly-map visualisation. The grid arrives tiny (32x32), so we paint one
 * pixel per cell into an offscreen canvas and let the 2D context bilinear-upsample
 * it to display size. No per-pixel loop over a 1024x768 image, no deps.
 */
const STOPS: Array<[number, number, number, number, number]> = [
  [0.0, 11, 14, 20, 0], // facility-bg, invisible
  [0.25, 20, 90, 160, 70],
  [0.5, 72, 187, 120, 120], // ok green
  [0.72, 246, 173, 85, 170], // warn amber
  [1.0, 229, 83, 75, 215], // anomaly red
];

export function heatColor(t: number): [number, number, number, number] {
  const x = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, r1, g1, b1, a1] = STOPS[i - 1];
    const [p2, r2, g2, b2, a2] = STOPS[i];
    if (x <= p2) {
      const f = p2 === p1 ? 1 : (x - p1) / (p2 - p1);
      return [
        Math.round(r1 + (r2 - r1) * f),
        Math.round(g1 + (g2 - g1) * f),
        Math.round(b1 + (b2 - b1) * f),
        Math.round(a1 + (a2 - a1) * f),
      ];
    }
  }
  const [, r, g, b, a] = STOPS[STOPS.length - 1];
  return [r, g, b, a];
}

export function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  grid: number[],
  gridSize: number,
): void {
  if (!Number.isInteger(gridSize) || gridSize < 2) {
    throw new Error(`heatmap: gridSize must be an integer >= 2, got ${gridSize}`);
  }
  if (grid.length !== gridSize * gridSize) {
    throw new Error(`heatmap: expected ${gridSize * gridSize} cells, got ${grid.length}`);
  }
  if (width < 1 || height < 1) return;

  const off = document.createElement("canvas");
  off.width = gridSize;
  off.height = gridSize;
  const octx = off.getContext("2d")!;
  const img = octx.createImageData(gridSize, gridSize);
  for (let i = 0; i < grid.length; i++) {
    const [r, g, b, a] = heatColor(grid[i]);
    const o = i * 4;
    img.data[o] = r;
    img.data[o + 1] = g;
    img.data[o + 2] = b;
    img.data[o + 3] = a;
  }
  octx.putImageData(img, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(off, 0, 0, width, height);
  ctx.restore();
}
```

- [ ] **Step 2: Create `site/src/components/demo/heatmap.test.ts`:**

```ts
import { describe, expect, it } from "vitest";
import { drawHeatmap, heatColor } from "./heatmap";

describe("heatColor", () => {
  it("returns 8-bit rgba for every position on the ramp", () => {
    for (const t of [0, 0.1, 0.25, 0.4, 0.5, 0.72, 0.9, 1]) {
      const [r, g, b, a] = heatColor(t);
      for (const channel of [r, g, b, a]) {
        expect(Number.isInteger(channel)).toBe(true);
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }
  });

  it("is invisible at zero and opaque at one", () => {
    expect(heatColor(0)[3]).toBe(0);
    expect(heatColor(1)[3]).toBeGreaterThan(200);
  });

  it("gets hotter with score: alpha rises and the red channel dominates late", () => {
    expect(heatColor(0.8)[3]).toBeGreaterThan(heatColor(0.3)[3]);
    expect(heatColor(1)[0]).toBeGreaterThan(heatColor(1)[2]);
  });

  it("clamps out-of-range and NaN input instead of exploding", () => {
    expect(heatColor(-5)).toEqual(heatColor(0));
    expect(heatColor(50)).toEqual(heatColor(1));
    expect(heatColor(Number.NaN)).toEqual(heatColor(0));
  });
});

describe("drawHeatmap", () => {
  it("rejects a malformed grid before touching the canvas", () => {
    const ctx = null as unknown as CanvasRenderingContext2D;
    expect(() => drawHeatmap(ctx, 10, 10, [0.1, 0.2], 32)).toThrow(/expected 1024 cells/);
    expect(() => drawHeatmap(ctx, 10, 10, [], 1)).toThrow(/gridSize must be an integer/);
  });
});
```

- [ ] **Step 3: Create `site/src/components/demo/downscale.ts`:**

```ts
export const MAX_EDGE = 1024;
export const JPEG_QUALITY = 0.85;
/** Below this we send the bytes untouched — re-encoding helps nobody. */
export const PASS_THROUGH_BYTES = 300_000;

export interface PreparedImage {
  blob: Blob;
  name: string;
  width: number;
  height: number;
}

/**
 * Resize + recompress in the browser so the request always fits the 2 MB route
 * limit (and the 4.5 MB Vercel function body ceiling behind it). This is also
 * what a real inspection camera would send: a fixed-resolution crop, not a
 * 12 MP phone original.
 */
export async function downscaleToBlob(input: File | Blob): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(input);
  const longest = Math.max(bitmap.width, bitmap.height);

  if (input.size <= PASS_THROUGH_BYTES && longest <= MAX_EDGE) {
    return { blob: input, name: nameOf(input), width: bitmap.width, height: bitmap.height };
  }

  const scale = Math.min(1, MAX_EDGE / longest);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error("downscale: the browser refused to encode this image");
  return { blob, name: `${baseName(nameOf(input))}.jpg`, width, height };
}

function nameOf(input: File | Blob): string {
  return input instanceof File ? input.name : "capture.jpg";
}

function baseName(name: string): string {
  return name.replace(/\.[^.]*$/, "") || "capture";
}
```

- [ ] **Step 4: Verify.** `npm run test` → heatmap tests PASS. `npx tsc --noEmit` clean (dev-only check: paste a 4000×3000 photo into `public/` and run `downscaleToBlob` from the browser console — expect `1024` longest edge and a blob under 350 KB). `npm run build` green.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: heatmap ramp and browser-side upload downscale"`

---

### Task 3.7: `InspectDemo` — the working inspection station

**Files:**
- Create: `site/src/content/samples.ts`, `site/src/components/demo/InspectDemo.tsx`
- Modify: `site/src/components/hud/PanelHost.tsx` (replace the `kind: "demo"` → `null` branch), `site/src/components/project/ProjectSections.tsx` (render the demo on the standard page too), `site/src/world/rooms/hub.ts` (drop the `door-w`/`door-s` construction prompt? **no** — those stay until Phase 5; this task does not touch hub)

**Why it lives on the standard page as well:** spec §24 — `MENU → PROJECTS → NIGHTFALL` must open "the same project information and demo directly". One component, two mounts, zero duplicated logic.

**Interfaces:**
- Consumes: `downscaleToBlob`, `drawHeatmap`, `InspectResult`, `samples`, §4 recipes.
- Produces: `InspectDemo({ projectHref }: { projectHref?: string })` and `samples: DemoSample[]`.

- [ ] **Step 1: Create `site/src/content/samples.ts`:**

```ts
export interface DemoSample {
  id: string;
  label: string;
  href: string;
  /** what the model is expected to say — shown only after a run, so the demo is a test, not a lie */
  truth: "normal" | "anomaly";
  caption: string;
}

/**
 * EDIT-ME (Appendix D.2): replace with images AJ actually trained on, or with
 * public-domain inspection photos whose licence allows redistribution. Do not
 * ship real factory imagery. Keep 3 normal + 2 anomalous.
 */
export const samples: DemoSample[] = [
  { id: "gear-01", label: "GEAR 01", href: "/samples/gear-01.jpg", truth: "normal", caption: "EDIT-ME: machined gear, nominal" },
  { id: "gear-02", label: "GEAR 02", href: "/samples/gear-02.jpg", truth: "anomaly", caption: "EDIT-ME: chipped tooth" },
  { id: "seal-01", label: "SEAL 01", href: "/samples/seal-01.jpg", truth: "normal", caption: "EDIT-ME: shaft seal, nominal" },
  { id: "seal-02", label: "SEAL 02", href: "/samples/seal-02.jpg", truth: "anomaly", caption: "EDIT-ME: surface scoring" },
  { id: "belt-01", label: "BELT 01", href: "/samples/belt-01.jpg", truth: "normal", caption: "EDIT-ME: drive belt, nominal" },
];
```

- [ ] **Step 2: Create `site/src/components/demo/InspectDemo.tsx`:**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { samples } from "@/content/samples";
import { mockInspectResult, type InspectResult } from "@/lib/demo-results";
import { drawHeatmap } from "./heatmap";
import { downscaleToBlob, MAX_EDGE } from "./downscale";

type Phase = "idle" | "ready" | "running" | "done";

interface Preview {
  url: string;
  name: string;
  width: number;
  height: number;
}

const SOURCE_BADGE: Record<InspectResult["source"], { text: string; className: string }> = {
  live: { text: "LIVE INFERENCE", className: "border-ok text-ok" },
  mock: { text: "MOCK MODE", className: "border-warn text-warn" },
  sample: { text: "SAMPLE MODE", className: "border-warn text-warn" },
};

export function InspectDemo({ projectHref }: { projectHref?: string }) {
  const [tab, setTab] = useState<"upload" | "samples">("upload");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pending, setPending] = useState<Blob | File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<InspectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const overlay = useRef<HTMLCanvasElement>(null);

  function replacePreview(next: Preview | null, blob: Blob | File | null) {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return next;
    });
    setPending(blob);
    setResult(null);
    setError(null);
    setPhase(next ? "ready" : "idle");
  }

  async function pickFile(file: File | undefined | null) {
    if (!file) return;
    try {
      const prepared = await downscaleToBlob(file);
      replacePreview(
        { url: URL.createObjectURL(prepared.blob), name: prepared.name, width: prepared.width, height: prepared.height },
        prepared.blob,
      );
    } catch {
      setPreview(null);
      setError("That file is not a readable JPEG/PNG/WebP image.");
      setPhase("idle");
    }
  }

  async function run() {
    if (!pending || !preview) return;
    setPhase("running");
    setResult(null);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", pending, preview.name);
      const res = await fetch("/api/inspect", { method: "POST", body: form });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message ?? "The inspection service rejected the request.");
      }
      setResult(body as InspectResult);
      setPhase("done");
    } catch (err) {
      // Degrade, never dead-end (AD-06): the visitor still sees what a result looks like.
      const message = err instanceof Error ? err.message : "Inspection failed.";
      setResult({ ...mockInspectResult(preview.name, 0), source: "sample", note: `${message} Showing a simulated result so you can see the output format.` });
      setError(message);
      setPhase("done");
    }
  }

  useEffect(() => {
    if (!result || !overlay.current || !preview) return;
    const canvas = overlay.current;
    canvas.width = preview.width;
    canvas.height = preview.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (showMap) drawHeatmap(ctx, canvas.width, canvas.height, result.grid, result.gridSize);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [result, showMap, preview]);

  const badge = result ? SOURCE_BADGE[result.source] : null;

  return (
    <div className="space-y-5">
      <div className="flex gap-2" role="tablist" aria-label="Inspection input">
        {(["upload", "samples"] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-widest ${
              tab === key ? "border-accent text-accent" : "border-facility-border text-facility-muted"
            }`}
          >
            {key === "upload" ? "Your image" : "Samples"}
          </button>
        ))}
      </div>

      {tab === "upload" ? (
        <div>
          <label htmlFor="nf-upload" className="block cursor-pointer rounded-md border border-dashed border-facility-border px-4 py-6 text-center font-mono text-sm hover:border-accent">
            Choose a product photo (JPEG / PNG / WebP — resized to {MAX_EDGE} px in your browser first)
          </label>
          <input
            id="nf-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => void pickFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {samples.map((s) => (
            <button
              key={s.id}
              onClick={() => replacePreview({ url: s.href, name: `${s.id}.jpg`, width: 1024, height: 1024 }, null)}
              className="rounded-md border border-facility-border p-2 text-left font-mono text-xs hover:border-accent"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div className="relative overflow-hidden rounded-lg border border-facility-border bg-facility-bg">
          <img src={preview.url} alt={`Inspection input: ${preview.name}`} className="block w-full" />
          <canvas ref={overlay} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => void run()}
          disabled={!preview || !pending || phase === "running"}
          aria-busy={phase === "running"}
          className="rounded-md bg-accent px-5 py-3 font-mono text-sm font-bold text-facility-bg disabled:opacity-40"
        >
          {phase === "running" ? "INSPECTING…" : "RUN INSPECTION"}
        </button>
        {(phase === "done" || phase === "ready") && (
          <button onClick={() => replacePreview(null, null)} className="rounded-md border border-facility-border px-4 py-3 font-mono text-sm hover:border-accent">
            CLEAR
          </button>
        )}
      </div>

      {error && (
        <p className="rounded border border-warn px-3 py-2 font-mono text-xs text-warn" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-lg border border-facility-border bg-facility-surface p-4" role="status" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`font-mono text-lg font-bold ${result.status === "ANOMALY" ? "text-anomaly" : "text-ok"}`}>
              {result.status === "ANOMALY" ? "ANOMALY DETECTED" : "NORMAL"}
            </p>
            {badge && <span className={`rounded border px-2 py-1 font-mono text-[10px] ${badge.className}`}>{badge.text}</span>}
          </div>
          <p className="sr-only">
            {`Nightfall returned ${result.status} with an anomaly score of ${Math.round(result.score * 100)} percent, decision threshold ${Math.round(result.threshold * 100)} percent, in ${result.latencyMs} milliseconds.`}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs sm:grid-cols-4">
            {[
              ["SCORE", result.score.toFixed(3)],
              ["THRESHOLD", result.threshold.toFixed(2)],
              ["LATENCY", `${result.latencyMs} ms`],
              ["MODEL", result.model],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="uppercase tracking-widest text-facility-muted">{k}</dt>
                <dd className="mt-1 text-facility-text">{v}</dd>
              </div>
            ))}
          </dl>
          <label className="mt-3 flex items-center gap-2 font-mono text-xs text-facility-muted">
            <input type="checkbox" checked={showMap} onChange={(e) => setShowMap(e.target.checked)} />
            show anomaly map
          </label>
          {result.note && <p className="mt-3 font-mono text-xs text-warn">{result.note}</p>}
        </div>
      )}

      {projectHref && (
        <p className="font-mono text-xs text-facility-muted">
          <a href={projectHref} className="text-accent underline">
            Read the architecture, dataset and benchmarks
          </a>
        </p>
      )}
    </div>
  );
}
```

Three things that are deliberate, so do not "tidy" them away:
- Samples set `pending = null`, which disables `RUN INSPECTION`. Sample browsing becomes real in Task 3.8, where the click fetches the bytes and runs them. Until then the samples tab is a preview list only.
- There is no object-URL cleanup in this task, and that is a **known, temporary leak**: `replacePreview` revokes the URL it is replacing, so only the last preview of a session escapes. Task 3.8 Step 1 replaces this function with `showPreview` plus a real unmount revoke. Do not invent a third pattern here.
- `MAX_EDGE` comes from `import { downscaleToBlob, MAX_EDGE } from "./downscale";` — one import line, and the copy stays tied to the number that is actually enforced.

- [ ] **Step 3: Mount it in both places.** In `PanelHost.tsx`, replace the `kind: "demo"` branch:

```tsx
if (panel.kind === "demo") {
  const project = projects.find((p) => p.slug === panel.slug);
  if (!project) return null;
  return (
    <ProjectPanel title={`${project.name} — INSPECTION STATION`} onClose={closePanel}>
      <InspectDemo projectHref={`/projects/${project.slug}`} />
    </ProjectPanel>
  );
}
```

In `ProjectSections.tsx`, append at the end of the returned fragment (it becomes a client boundary — add nothing else, `ProjectSections` may stay a server component because a client import is allowed inside it):

```tsx
{project.demo === "nightfall" && (
  <Section title="Try it yourself">
    <InspectDemo />
  </Section>
)}
```

- [ ] **Step 4: Verify the world path.** Dev server, `NIGHTFALL_MOCK=1`, `/world?room=nightfall` → walk to the `TRY IT YOURSELF` sign → `[E]` → the panel shows the inspection station. Pick a file, run it, confirm: status line, score/threshold/latency/model, a visible heat tint concentrated somewhere in the image, and the `MOCK MODE` badge. Re-run the same file: identical score and heatmap (determinism). Six rapid runs: the 6th shows `SAMPLE MODE` with the rate-limit message — **and the panel stays usable**.

- [ ] **Step 5: Verify the standard-page path.** `/projects/nightfall` shows the same demo under "Try it yourself", works with keyboard only (Tab → file input → Run), and the result is announced to a screen reader (`role="status"` + the `sr-only` sentence). `npm run build` + `npm run test` green.

- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat: nightfall inspection demo on page and in world"`

---

### Task 3.8: Samples that actually run, camera capture, shelf board — and the Phase 3 gate

**Files:**
- Create: `site/src/world/nightfall/SampleRail.tsx`
- Modify: `site/src/components/demo/InspectDemo.tsx`, `site/src/world/Scene.tsx`

This task pays off the two placeholders left in Task 3.7 (sample browsing without a run path, and the lint-only cleanup effect). Do them first — they are required, the camera is optional.

- [ ] **Step 1: Real object-URL lifecycle.** In `InspectDemo.tsx` delete the placeholder `useEffect` from Task 3.7 and use a ref-driven cleanup:

```tsx
const objectUrl = useRef<string | null>(null);
useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);

function showPreview(url: string, name: string, width: number, height: number, blob: Blob | File | null, expected: DemoSample["truth"] | null) {
  if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  objectUrl.current = url.startsWith("blob:") ? url : null;
  setPreview({ url, name, width, height });
  setPending(blob);
  setExpected(expected);
  setResult(null);
  setError(null);
  setPhase(url ? "ready" : "idle");
}
```
Add `const [expected, setExpected] = useState<DemoSample["truth"] | null>(null);` — which means widening the import line to `import { samples, type DemoSample } from "@/content/samples";`. Route every existing `replacePreview(...)` call through `showPreview(...)`, then delete `replacePreview` and the `pending` assignment it owned (`showPreview` sets `pending`).

- [ ] **Step 2: Samples run.** Replace the sample buttons' `onClick` with a fetch-and-inspect path, and auto-run so the shelf behaves like the conveyor — you pick a part, the machine looks at it:

```tsx
async function pickSample(s: DemoSample) {
  setPhase("running");
  setError(null);
  try {
    const res = await fetch(s.href);
    if (!res.ok) throw new Error(`Sample ${s.label} is not available yet (${res.status}).`);
    const prepared = await downscaleToBlob(await res.blob());
    const url = URL.createObjectURL(prepared.blob);
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = url;
    setPreview({ url, name: `${s.id}.jpg`, width: prepared.width, height: prepared.height });
    setPending(prepared.blob);
    setExpected(s.truth);
    setResult(null);
    await run({ name: `${s.id}.jpg`, blob: prepared.blob });
  } catch (err) {
    setPhase("idle");
    setError(err instanceof Error ? err.message : "Could not load that sample.");
  }
}
```
Refactor `run()` to accept an optional `{ name, blob }` argument and fall back to the current `preview`/`pending` when called with nothing, so both call sites share one implementation. `RUN INSPECTION` keeps `onClick={() => void run()}`.

- [ ] **Step 3: Show the verdict against the truth label.** Under the score grid, when `expected !== null`, render the honest comparison. This is what turns the demo from decoration into evidence:

```tsx
{expected && result && (
  <p className="mt-3 font-mono text-xs">
    <span className="uppercase tracking-widest text-facility-muted">expected: </span>
    <span className="text-facility-text">{expected.toUpperCase()}</span>
    <span className={result.status.toLowerCase() === expected ? "ml-2 text-ok" : "ml-2 text-anomaly"}>
      {result.status.toLowerCase() === expected ? "· match" : "· mismatch"}
    </span>
  </p>
)}
```
In `idle` also caption the chosen sample with its `caption` text (never its `truth`) so the label is not visible before the run.

- [ ] **Step 4: Camera capture (OPTIONAL — skip if it costs more than 30 minutes).** Spec §11.7 Option B. Add a third tab, `"camera"`, rendered only when the API exists:

```tsx
const canCapture = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
```
`CameraCapture` sub-component in the same file: on mount `getUserMedia({ video: { facingMode: "environment" } })` → `<video playsInline muted />`; `[ CAPTURE ]` draws the current frame into a canvas and calls `showPreview(canvas.toBlob…)`; `[ CANCEL ]` and unmount stop every track (`stream.getTracks().forEach(t => t.stop())`). On `NotAllowedError` / `NotFoundError`, render the message "Camera unavailable — use Your image instead." and the upload tab, never a broken video element. If `getUserMedia` is missing, the tab is not rendered at all.

- [ ] **Step 5: `site/src/world/nightfall/SampleRail.tsx`.** The physical shelf from Task 3.1 gains a live caption board so the room explains itself before anyone presses `E`:

```tsx
"use client";

import { useEffect, useMemo } from "react";
import { samples } from "@/content/samples";
import { ScreenTexture } from "../textures";

/** Static caption board above the sample shelf. No animation, no state. */
export function SampleRail({ accent }: { accent: string }) {
  const screen = useMemo(() => {
    const tex = new ScreenTexture(512, 256);
    tex.update(
      ["SAMPLE TRAY", ...samples.slice(0, 5).map((s) => `${s.label.padEnd(10, " ")} ${s.caption.slice(0, 26)}`)],
      accent,
    );
    return tex;
  }, [accent, samples]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => screen.dispose(), [screen]);

  return (
    <mesh position={[1.3, 1.9, 5.4]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[2.2, 1.1]} />
      <meshBasicMaterial map={screen.texture} />
    </mesh>
  );
}
```
Render it from `Scene.tsx` inside the existing `room.id === "nightfall"` branch, next to `<Conveyor />`. (If the `samples` dep in the memo list upsets the lint rule, drop `samples` from the deps and keep the eslint-disable line — the list is module-constant.)

- [ ] **Step 6: Verify.** Dev server: the shelf board lists the five sample ids; the samples tab loads, inspects and reports match/mismatch for each of the five (with mock mode they will not all match — that is expected and honest; the point is the label is only revealed afterwards). Camera tab appears on a machine with a webcam, is absent without one, and never leaves a stream running after you close the panel. `npm run build` + `npm run test` green.

- [ ] **Step 7: Commit.** `git add -A && git commit -m "feat: nightfall samples, capture path and shelf board"`

- [ ] **Step 8: Phase 3 exit gate.** Re-read the gate at the top of this phase and tick every box. Then confirm the two things that make Phase 3 "done" rather than "compiling":
  - A visitor with **no** backend, **no** webcam and **no** interest in ML can still reach Nightfall's technical content in one click from `/projects/nightfall`.
  - Nothing in the world made a network request: open devtools → Network → walk hub → nightfall → hub → `/world?room=noctis`. The only entries are the document, its chunks, and fonts. If `/api/inspect` appears without you pressing Run, find out why before continuing.

**Human handoff:** the demo is only convincing with real images. Appendix D.2 lists exactly what AJ must drop into `public/samples/`. Phase 3 can be code-complete and still be waiting on that — it does not block Phase 4.

---

# Phase 4 — Noctis room: architecture you can watch

**Goal:** spec §12 as a physical environment — every agent is a voxel workstation, every handoff is a box that travels across the floor, and the whole thing is driven by **replayed traces of real Noctis runs** (AD-05). Nobody is executing visitor code.

**Exit gate:**

- [ ] Four agent stations with role signs, status lamps that reflect playback, and a central ops display
- [ ] Selecting a recorded run plays it: lamps change, labelled artifacts travel station-to-station, the ops log scrolls, and a `REPLAY OF A REAL RUN` badge is always visible
- [ ] Playback controls work from the DOM console panel **and** survive walking out of the room (no runaway timers)
- [ ] `snapshotAt` and `validateTrace` are unit-tested; no React state updates at frame rate (AD-12, AD-16)
- [ ] `/world?room=noctis` → `[E] RUN A RECORDED TASK` opens the console; the standard page `/projects/noctis` shows the same console
- [ ] `npm run build` + `npm run test` green

### Task 4.1: Trace types + recorded traces

**Files:**
- Create: `site/src/world/noctis/trace-types.ts`, `site/src/world/noctis/traces.ts`

**Interfaces:**
- Produces: `TraceEvent`, `NoctisTrace`, `traces: NoctisTrace[]`, `traceById(id): NoctisTrace | undefined`. Tasks 4.2, 4.3, 4.5, 4.6 consume them. The trace format is specified in **Appendix B** — traces are data, and AJ regenerates them with the recorder adapter (Appendix B.4) rather than editing them by hand.

- [ ] **Step 1: Create `site/src/world/noctis/trace-types.ts`:**

```ts
/**
 * One recorded moment of a real Noctis run. See Appendix B for how these are
 * produced from LangGraph `stream_mode="updates"` output.
 */
export interface TraceEvent {
  /** milliseconds since the run started; non-decreasing */
  t: number;
  /** roster id of the agent doing the work (see rooms/noctis.ts) */
  agent: string;
  /** the artifact this agent produced: TASK, PLAN, RESEARCH, PATCH, TEST RESULT... */
  artifact: string;
  /** who receives it; null for the terminal step */
  next: string | null;
  ok: boolean;
}

export interface NoctisTrace {
  id: string;
  /** the task the operator gave Noctis, verbatim (truncated by the UI, never by the data) */
  task: string;
  /** one line for a recruiter: what came out */
  outcome: string;
  /** where this came from, so the replay can never be mistaken for a live system */
  provenance: string;
  recordedAt: string;
  /** real wall-clock length of the run, in ms */
  durationMs: number;
  events: TraceEvent[];
}
```

- [ ] **Step 2: Create `site/src/world/noctis/traces.ts`** with two runs. `noctis-fix-off-by-one` deliberately contains a failed test and a retry loop, because that is the most interesting thing a multi-agent system does and the room can show it:

```ts
import type { NoctisTrace } from "./trace-types";

/**
 * EDIT-ME (Appendix D.3): these are hand-transcribed placeholders for AJ's real
 * runs. Regenerate them with the recorder adapter in Appendix B.4 and keep the
 * provenance strings truthful — this file is the difference between "an
 * architecture diagram you can walk through" and a fiction.
 */
export const traces: NoctisTrace[] = [
  {
    id: "fix-off-by-one",
    task: "calculate_average() raises ZeroDivisionError on an empty list — fix it and cover it with tests.",
    outcome: "Patch applied, 2 tests added, full suite green in 41 s.",
    provenance: "Replay of a real Noctis run — noctis@EDIT-ME short-sha, recorded EDIT-ME date",
    recordedAt: "EDIT-ME: 2026-08-14",
    durationMs: 41_000,
    events: [
      { t: 0, agent: "planner", artifact: "TASK", next: "planner", ok: true },
      { t: 3_200, agent: "planner", artifact: "PLAN", next: "researcher", ok: true },
      { t: 6_400, agent: "researcher", artifact: "RESEARCH", next: "coder", ok: true },
      { t: 15_100, agent: "coder", artifact: "PATCH", next: "tester", ok: true },
      { t: 22_800, agent: "tester", artifact: "TEST RESULT", next: "coder", ok: false },
      { t: 26_500, agent: "coder", artifact: "PATCH", next: "tester", ok: true },
      { t: 34_900, agent: "tester", artifact: "TEST RESULT", next: "planner", ok: true },
      { t: 40_100, agent: "planner", artifact: "REPORT", next: null, ok: true },
    ],
  },
  {
    id: "document-endpoint",
    task: "Document the /inspect endpoint in the README, including the request and response shapes.",
    outcome: "README section written from the live FastAPI schema; 1 file changed.",
    provenance: "Replay of a real Noctis run — noctis@EDIT-ME short-sha, recorded EDIT-ME date",
    recordedAt: "EDIT-ME: 2026-08-21",
    durationMs: 23_000,
    events: [
      { t: 0, agent: "planner", artifact: "TASK", next: "planner", ok: true },
      { t: 2_600, agent: "planner", artifact: "PLAN", next: "researcher", ok: true },
      { t: 5_900, agent: "researcher", artifact: "RESEARCH", next: "coder", ok: true },
      { t: 12_400, agent: "coder", artifact: "PATCH", next: "tester", ok: true },
      { t: 18_700, agent: "tester", artifact: "TEST RESULT", next: null, ok: true },
    ],
  },
];

export function traceById(id: string): NoctisTrace | undefined {
  return traces.find((t) => t.id === id);
}
```

The first event of every trace is the planner holding the TASK (`next: "planner"`): it means "the planner is working on the task", and it gives the room something to animate at t=0 instead of a dead opening second.

- [ ] **Step 3: Verify.** `npx tsc --noEmit` clean. `npm run build` green (nothing imports these files yet — that is expected).

- [ ] **Step 4: Commit.** `git add -A && git commit -m "feat: noctis trace format and recorded runs"`

---

### Task 4.2: Trace validator (TDD)

**Files:**
- Create: `site/src/world/noctis/validate-trace.ts`, `site/src/world/noctis/validate-trace.test.ts`

**Interfaces:**
- Consumes: `NoctisTrace`. Produces: `validateTrace(trace: NoctisTrace, roster: string[]): string[]` — `[]` when the trace is replayable. Used by a test now, and by `TraceDirector` in Task 4.5 as a dev-only guard.

- [ ] **Step 1: Write the failing test** — `site/src/world/noctis/validate-trace.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateTrace } from "./validate-trace";
import { traces } from "./traces";
import type { NoctisTrace } from "./trace-types";

const ROSTER = ["planner", "researcher", "coder", "tester"];
const base: NoctisTrace = traces[0];

function patched(over: Partial<NoctisTrace>): NoctisTrace {
  return { ...base, ...over };
}

describe("validateTrace", () => {
  it("accepts every shipped trace", () => {
    for (const t of traces) expect(validateTrace(t, ROSTER), t.id).toEqual([]);
  });

  it("requires replayable metadata", () => {
    const errors = validateTrace(
      patched({ id: "", task: "  ", outcome: "", provenance: "", recordedAt: "yesterday", durationMs: 0, events: [] }),
      ROSTER,
    );
    expect(errors.some((e) => e.includes("id"))).toBe(true);
    expect(errors.some((e) => e.includes("task"))).toBe(true);
    expect(errors.some((e) => e.includes("outcome"))).toBe(true);
    expect(errors.some((e) => e.includes("provenance"))).toBe(true);
    expect(errors.some((e) => e.includes("recordedAt"))).toBe(true);
    expect(errors.some((e) => e.includes("durationMs"))).toBe(true);
    expect(errors.some((e) => e.includes("events"))).toBe(true);
  });

  it("rejects unknown agents, self-handoffs and off-roster targets", () => {
    const errors = validateTrace(
      patched({
        events: [
          { t: 0, agent: "ghost", artifact: "TASK", next: "planner", ok: true },
          { t: 100, agent: "planner", artifact: "PLAN", next: "planner", ok: true },
          { t: 200, agent: "planner", artifact: "REPORT", next: null, ok: true },
        ],
        durationMs: 400,
      }),
      ROSTER,
    );
    expect(errors.some((e) => e.includes('unknown agent "ghost"'))).toBe(true);
    expect(errors.some((e) => e.includes("self-handoff"))).toBe(true);
  });

  it("requires non-decreasing times inside the recorded duration, and exactly one terminal step last", () => {
    const errors = validateTrace(
      patched({
        durationMs: 100,
        events: [
          { t: 0, agent: "planner", artifact: "TASK", next: "planner", ok: true },
          { t: 900, agent: "planner", artifact: "PLAN", next: "coder", ok: true },
          { t: 400, agent: "coder", artifact: "REPORT", next: null, ok: true },
          { t: 500, agent: "coder", artifact: "REPORT", next: null, ok: true },
        ],
      }),
      ROSTER,
    );
    expect(errors.some((e) => e.includes("decreasing"))).toBe(true);
    expect(errors.some((e) => e.includes("beyond durationMs"))).toBe(true);
    expect(errors.filter((e) => e.includes("terminal"))).toHaveLength(2);
  });

  it("rejects empty artifact names", () => {
    const errors = validateTrace(
      patched({ events: [{ t: 0, agent: "planner", artifact: "  ", next: null, ok: true }] }),
      ROSTER,
    );
    expect(errors.some((e) => e.includes("artifact"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails.** `npm run test` → FAIL: cannot resolve `./validate-trace`.

- [ ] **Step 3: Create `site/src/world/noctis/validate-trace.ts`:**

```ts
import type { NoctisTrace } from "./trace-types";

/** Pure, stringly-typed errors — same shape as content/validate.ts. */
export function validateTrace(trace: NoctisTrace, roster: string[]): string[] {
  const errors: string[] = [];
  const known = new Set(roster);

  if (!trace.id?.trim()) errors.push("trace.id: required");
  if (!trace.task?.trim()) errors.push("trace.task: required");
  if (!trace.outcome?.trim()) errors.push("trace.outcome: required");
  if (!trace.provenance?.trim()) errors.push("trace.provenance: required — a replay must say so");
  if (!trace.recordedAt || Number.isNaN(Date.parse(trace.recordedAt))) {
    errors.push(`trace.recordedAt: must be a parseable date, got "${trace.recordedAt}"`);
  }
  if (!(trace.durationMs > 0)) errors.push("trace.durationMs: must be > 0");
  if (trace.events.length === 0) errors.push("trace.events: at least one required");

  let terminalCount = 0;
  let terminalIndex = -1;
  let prev = -1;

  trace.events.forEach((e, i) => {
    const at = `events[${i}]`;
    if (!known.has(e.agent)) errors.push(`${at}: unknown agent "${e.agent}" (not in the room roster)`);
    if (e.next !== null && !known.has(e.next)) errors.push(`${at}: unknown agent "${e.next}" (not in the room roster)`);
    if (e.next === e.agent && i !== 0) errors.push(`${at}: self-handoff — only the opening TASK may stay with its agent`);
    if (!e.artifact?.trim()) errors.push(`${at}: artifact label required`);
    if (e.t < prev) errors.push(`${at}: t=${e.t} is decreasing (previous event was ${prev})`);
    if (e.t > trace.durationMs) errors.push(`${at}: t=${e.t} is beyond durationMs=${trace.durationMs}`);
    prev = Math.max(prev, e.t);
    if (e.next === null) {
      terminalCount += 1;
      terminalIndex = i;
    }
  });

  if (terminalCount === 0) errors.push("events: no terminal step (an event with next: null) — nothing to end on");
  if (terminalCount > 1) errors.push(`events: ${terminalCount} terminal steps, expected exactly 1`);
  if (terminalCount === 1 && terminalIndex !== trace.events.length - 1) {
    errors.push("events: the terminal step must be last");
  }

  return errors;
}
```

- [ ] **Step 4: Run the test to verify it passes.** `npm run test` → validate-trace PASS. If a shipped trace fails, the trace is wrong — fix `traces.ts`.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "test: noctis trace validator"`

---

### Task 4.3: Trace player — clock in, world state out (TDD)

**Files:**
- Create: `site/src/world/noctis/trace-player.ts`, `site/src/world/noctis/trace-player.test.ts`

**Interfaces:**
- Produces: `HANDOFF_MS`, `AgentStatus`, `ArtifactFlight`, `Snapshot`, `snapshotAt(trace, tMs, roster): Snapshot`. This is the only place the trace becomes a picture, and it is pure (Task 4.5 renders it, nothing else computes it).

**Playback model (do not redesign it):**
- Events are milestones: "agent X finished and is passing artifact L to Y". The active event `i` is the last one with `t <= tMs`.
- `next === agent` (the opening TASK only) means *X is working on L*: status `working`, and no box on the floor.
- Otherwise, for `travel = min(HANDOFF_MS, gap * 0.6)` after the milestone (`gap = events[i+1].t - events[i].t`, or `HANDOFF_MS` when there is no next event): the box moves (`progress = since / travel`), X is `handoff` (`error` when `ok` is false) and Y is `idle`.
- Once the box lands it rests on Y's desk (`progress: 1`), Y becomes `working` and X returns to `idle`. A handoff therefore always completes before the next agent reports, and the room is never empty of activity between milestones.
- `next === null` = terminal: that agent is `done` (or `error`), and `finished` only becomes true after `HANDOFF_MS` has elapsed, so the ops display cannot say COMPLETE while a box is still mid-floor.
- A failing step (`ok: false`) still travels — a red test result nobody receives is not what a real agent system does.

- [ ] **Step 1: Write the failing test** — `site/src/world/noctis/trace-player.test.ts`. These assertions *are* the model above; read them as the spec.

```ts
import { describe, expect, it } from "vitest";
import { HANDOFF_MS, snapshotAt } from "./trace-player";
import { traces } from "./traces";

const ROSTER = ["planner", "researcher", "coder", "tester"];
const trace = traces[0]; // fix-off-by-one, 8 events, 41 s
const empty = traces[1];

describe("snapshotAt", () => {
  it("starts with everything idle and the planner working", () => {
    const s = snapshotAt(trace, 0, ROSTER);
    expect(s.stepIndex).toBe(0);
    expect(s.statuses.planner).toBe("working");
    expect(s.statuses.coder).toBe("idle");
    expect(s.finished).toBe(false);
    expect(s.flight).toBeNull();
  });

  it("advances the step index monotonically across the whole run", () => {
    let last = -1;
    for (let t = 0; t <= trace.durationMs; t += 250) {
      const i = snapshotAt(trace, t, ROSTER).stepIndex;
      expect(i).toBeGreaterThanOrEqual(last);
      last = i;
    }
    expect(last).toBe(trace.events.length - 1);
  });

  it("puts the artifact in flight between events, with progress 0 -> 1", () => {
    const a = snapshotAt(trace, 3_300, ROSTER); // 100 ms after PLAN hands off
    expect(a.flight).not.toBeNull();
    expect(a.flight!.label).toBe("PLAN");
    expect(a.flight!.from).toBe("planner");
    expect(a.flight!.to).toBe("researcher");
    expect(a.flight!.progress).toBeGreaterThan(0);
    expect(a.flight!.progress).toBeLessThan(1);
    expect(a.statuses.planner).toBe("handoff");
    expect(a.statuses.researcher).toBe("idle");

    const late = snapshotAt(trace, 6_300, ROSTER); // just before researcher reports
    expect(late.flight!.progress).toBeCloseTo(1, 1);
  });

  it("shows a failure as an error on the agent that reported it, while the result still travels", () => {
    const s = snapshotAt(trace, 23_000, ROSTER); // tester returned a failing TEST RESULT at 22.8 s
    expect(s.statuses.tester).toBe("error");
    expect(s.flight).toMatchObject({ label: "TEST RESULT", from: "tester", to: "coder" });
    // Once the box lands, the coder is the one working on it and the tester waits.
    const landed = snapshotAt(trace, 25_000, ROSTER);
    expect(landed.statuses.coder).toBe("working");
    expect(landed.statuses.tester).toBe("idle");
    expect(landed.flight!.progress).toBe(1);
  });

  it("finishes, and stays finished past the end", () => {
    const s = snapshotAt(trace, trace.durationMs, ROSTER);
    expect(s.finished).toBe(true);
    expect(s.flight).toBeNull();
    expect(s.statuses.planner).toBe("done");
    expect(snapshotAt(trace, trace.durationMs + 99_000, ROSTER).finished).toBe(true);
  });

  it("builds a readable log line per milestone", () => {
    const s = snapshotAt(trace, 16_000, ROSTER);
    expect(s.log.length).toBe(4); // t=0, 3.2s, 6.4s, 15.1s
    expect(s.log[3]).toMatch(/coder.*PATCH.*tester/);
    expect(s.log[3]).toMatch(/^00:15/);
  });

  it("never throws on a clock outside the run or a trace with one event", () => {
    expect(snapshotAt(empty, -500, ROSTER).stepIndex).toBe(0);
    const single = { ...empty, events: [empty.events[0]], durationMs: 10 };
    const s = snapshotAt(single, 5, ROSTER);
    expect(s.finished).toBe(false);
    expect(s.statuses.planner).toBe("working"); // the opening TASK stays with its agent: no box
    expect(s.flight).toBeNull();
  });

  it("keeps handoffs shorter than the gap that follows them", () => {
    // events[5] -> events[6] is 8.4 s apart; the box must be long gone before 6.
    const s = snapshotAt(trace, 34_000, ROSTER);
    expect(HANDOFF_MS).toBeLessThan(8_400);
    expect(s.flight === null || s.flight.progress === 1).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails.** `npm run test` → FAIL: cannot resolve `./trace-player`.

- [ ] **Step 3: Create `site/src/world/noctis/trace-player.ts`:**

```ts
import type { NoctisTrace } from "./trace-types";

export const HANDOFF_MS = 900;

export type AgentStatus = "idle" | "working" | "handoff" | "done" | "error";

export interface ArtifactFlight {
  label: string;
  from: string;
  to: string;
  /** 0 -> 1 across the travel window */
  progress: number;
}

export interface Snapshot {
  stepIndex: number;
  statuses: Record<string, AgentStatus>;
  flight: ArtifactFlight | null;
  /** oldest first, "mm:ss  agent -> agent ARTIFACT" */
  log: string[];
  finished: boolean;
}

function stamp(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Pure and cheap: ~O(events) per call, called once per frame by TraceDirector. */
export function snapshotAt(trace: NoctisTrace, tMs: number, roster: string[]): Snapshot {
  const t = Math.max(0, tMs);
  const statuses: Record<string, AgentStatus> = {};
  for (const agent of roster) statuses[agent] = "idle";

  const events = trace.events;
  let index = 0;
  for (let i = 0; i < events.length; i++) {
    if (events[i].t <= t) index = i;
    else break;
  }

  const log = events.slice(0, index + 1).map((e) => {
    const arrow = e.next === null ? "(complete)" : `-> ${e.next}`;
    return `${stamp(e.t)}  ${e.agent} ${arrow} ${e.artifact}${e.ok ? "" : " [FAILED]"}`;
  });

  const current = events[index];
  const nextEvent = events[index + 1] ?? null;
  const since = t - current.t;
  const terminal = current.next === null;
  const finished = terminal && t >= current.t + HANDOFF_MS;

  let flight: ArtifactFlight | null = null;

  if (terminal) {
    statuses[current.agent] = current.ok ? "done" : "error";
  } else if (current.next === current.agent) {
    statuses[current.agent] = current.ok ? "working" : "error";
  } else {
    const gap = nextEvent ? Math.max(1, nextEvent.t - current.t) : HANDOFF_MS;
    const travel = Math.min(HANDOFF_MS, gap * 0.6);
    const to = current.next as string;
    if (since < travel) {
      flight = { label: current.artifact, from: current.agent, to, progress: since / travel };
      statuses[current.agent] = current.ok ? "handoff" : "error";
    } else {
      flight = { label: current.artifact, from: current.agent, to, progress: 1 };
      statuses[current.agent] = "idle";
      statuses[to] = "working";
    }
  }

  return { stepIndex: index, statuses, flight, log, finished };
}
```

- [ ] **Step 4: Run the test to verify it passes.** `npm run test` → trace-player PASS. Two rules when you have to debug this: the `flight` at `progress: 1` stays in place (the box sits on the receiving desk until the next milestone), and `finished` requires the travel window to elapse — the ops display must not say COMPLETE while a box is still mid-floor.

- [ ] **Step 5: Verify the shape is stable.** `npx tsc --noEmit` clean. `npm run build` green.

- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat: pure noctis trace player"`

---

### Task 4.4: Playback controls, agent stations, travelling artifact

**Files:**
- Create: `site/src/world/noctis/store.ts`, `site/src/world/noctis/AgentStation.tsx`, `site/src/world/noctis/ArtifactBox.tsx`
- Modify: `site/src/world/noctis/trace-types.ts` (add `StationDef`)

**Interfaces:**
- Consumes: `AgentStatus`, `ArtifactFlight` (Task 4.3), `makeSignTexture` (Task 1.4), `RoomPalette`.
- Produces: `SPEEDS`, `playbackClock`, `usePlayback`, `StationDef`, `AgentStation`, `ArtifactBox`. Task 4.5 mounts them.

- [ ] **Step 1: Add the roster type** to `site/src/world/noctis/trace-types.ts`:

```ts
/** Where an agent physically lives in the Noctis room (data lives in rooms/noctis.ts). */
export interface StationDef {
  id: string;
  /** sign text above the desk, e.g. "RESEARCH AGENT" */
  role: string;
  /** one-line description revealed by the console panel */
  about: string;
  /** tile [x, z] of the desk */
  tile: [number, number];
}
```

- [ ] **Step 2: Create `site/src/world/noctis/store.ts`:**

```ts
import { create } from "zustand";
import { traceById, traces } from "./traces";

export const SPEEDS: number[] = [1, 2, 4];

/**
 * AD-16: the clock is a plain module object written every frame by TraceDirector.
 * Putting it in this store would re-render the DOM panel at 60 Hz — the exact bug
 * AD-12 exists to prevent.
 */
export const playbackClock = { ms: 0 };

interface PlaybackState {
  traceId: string;
  playing: boolean;
  speed: number;
  setTrace: (id: string) => void;
  toggle: () => void;
  cycleSpeed: () => void;
  rewind: () => void;
}

export const usePlayback = create<PlaybackState>((set, get) => ({
  traceId: traces[0].id,
  playing: false,
  speed: 2,
  setTrace: (id) => {
    playbackClock.ms = 0;
    set({ traceId: id, playing: true });
  },
  toggle: () => {
    const trace = traceById(get().traceId);
    if (!get().playing && trace && playbackClock.ms >= trace.durationMs) playbackClock.ms = 0;
    set({ playing: !get().playing });
  },
  cycleSpeed: () => {
    const next = SPEEDS[(SPEEDS.indexOf(get().speed) + 1) % SPEEDS.length];
    set({ speed: next ?? 1 });
  },
  rewind: () => {
    playbackClock.ms = 0;
    set({ playing: false });
  },
}));
```

- [ ] **Step 3: Create `site/src/world/noctis/AgentStation.tsx`:**

```tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeSignTexture } from "../textures";
import type { AgentStatus } from "./trace-player";
import type { StationDef } from "./trace-types";

const LAMP: Record<AgentStatus, string> = {
  idle: "#8b94a7",
  working: "#48bb78",
  handoff: "#f6ad55",
  done: "#4fd1c5",
  error: "#e5534b",
};

export function AgentStation({
  station,
  status,
  accent,
  wall,
}: {
  station: StationDef;
  status: AgentStatus;
  accent: string;
  wall: string;
}) {
  const [x, z] = station.tile;
  const body = useRef<THREE.Group>(null);
  const sign = useMemo(() => makeSignTexture(station.role, { accent }), [station.role, accent]);
  useEffect(() => () => sign.dispose(), [sign]);

  // The only per-frame work per station: a 2 px bob while the agent is working.
  useFrame((state) => {
    if (!body.current) return;
    const active = status === "working" || status === "handoff";
    body.current.position.y = active ? 0.95 + Math.sin(state.clock.elapsedTime * 4) * 0.04 : 0.95;
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.6, 0.8, 1.2]} />
        <meshLambertMaterial color={wall} />
      </mesh>
      <mesh position={[0, 1.15, -0.3]}>
        <boxGeometry args={[1.1, 0.6, 0.1]} />
        <meshLambertMaterial color={LAMP[status]} />
      </mesh>
      <group ref={body} position={[0, 0.95, 0.55]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.45, 0.5, 0.3]} />
          <meshLambertMaterial color={accent} />
        </mesh>
        <mesh position={[0, 0.68, 0]}>
          <boxGeometry args={[0.32, 0.32, 0.3]} />
          <meshLambertMaterial color="#e6eaf2" />
        </mesh>
      </group>
      <mesh position={[0, 2.3, 0]}>
        <boxGeometry args={[3, 0.6, 0.12]} />
        <meshBasicMaterial map={sign} />
      </mesh>
      <mesh position={[0.85, 0.86, 0]}>
        <boxGeometry args={[0.22, 0.12, 0.22]} />
        <meshLambertMaterial color={LAMP[status]} />
      </mesh>
    </group>
  );
}
```

The small box on the desk corner is the status lamp; the big screen behind it is the agent's terminal. Both change colour from the same `LAMP` lookup, so a station can never disagree with itself.

- [ ] **Step 4: Create `site/src/world/noctis/ArtifactBox.tsx`:**

```tsx
"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeSignTexture } from "../textures";
import type { ArtifactFlight } from "./trace-player";
import type { StationDef } from "./trace-types";

const FLIGHT_HEIGHT = 1.35;

/**
 * One box, re-used. Its position is written every frame from a ref (AD-16); only
 * the label — which changes a handful of times per run — goes through React state.
 */
export function ArtifactBox({
  flightRef,
  stations,
  accent,
}: {
  flightRef: MutableRefObject<ArtifactFlight | null>;
  stations: Record<string, StationDef>;
  accent: string;
}) {
  const group = useRef<THREE.Group>(null);
  const label = useRef<THREE.Mesh>(null);
  const texture = useRef<THREE.CanvasTexture | null>(null);
  const [shown, setShown] = useState<string | null>(null);

  useEffect(
    () => () => {
      texture.current?.dispose();
      texture.current = null;
    },
    [],
  );

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const flight = flightRef.current;
    const from = flight ? stations[flight.from] : undefined;
    const to = flight ? stations[flight.to] : undefined;
    if (!flight || !from || !to) {
      g.visible = false;
      return;
    }
    g.visible = true;

    // L-shaped path: slide along x, then along z, so the box follows the floor rails.
    const p = Math.min(1, Math.max(0, flight.progress));
    const corner = { x: to.tile[0], z: from.tile[1] };
    const legA = Math.abs(corner.x - from.tile[0]);
    const legB = Math.abs(to.tile[1] - corner.z);
    const total = legA + legB || 1;
    const travelled = p * total;
    const at =
      travelled <= legA
        ? { x: from.tile[0] + Math.sign(corner.x - from.tile[0]) * travelled, z: from.tile[1] }
        : {
            x: corner.x,
            z: corner.z + Math.sign(to.tile[1] - corner.z) * (travelled - legA),
          };

    g.position.set(at.x, FLIGHT_HEIGHT + Math.sin(p * Math.PI) * 0.35, at.z);
    if (flight.label !== shown) setShown(flight.label);
  });

  const labelTexture = useMemo(() => (shown ? makeSignTexture(shown, { accent }) : null), [shown, accent]);
  useEffect(() => {
    if (texture.current && texture.current !== labelTexture) texture.current.dispose();
    texture.current = labelTexture;
  }, [labelTexture]);

  return (
    <group ref={group} visible={false}>
      <mesh>
        <boxGeometry args={[0.42, 0.32, 0.42]} />
        <meshLambertMaterial color={accent} />
      </mesh>
      {labelTexture && (
        <mesh position={[0, 0.45, 0]}>
          <planeGeometry args={[1.5, 0.375]} />
          <meshBasicMaterial map={labelTexture} transparent={false} />
        </mesh>
      )}
    </group>
  );
}
```
Add `useMemo` to the react import line. The label plane is left at rotation 0 deliberately: the camera never orbits (AD-10), so a fixed south-facing label is always readable — no billboarding maths.

- [ ] **Step 5: Verify.** Nothing is mounted yet, so: `npx tsc --noEmit` clean, `npm run build` green, `npm run test` green (no new pure logic to test — the two components are exercised in Task 4.5's dev-server check, per AD-13).

- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat: noctis stations, playback controls, artifact box"`

---

### Task 4.5: The agent lab — room data and the director that drives it

**Files:**
- Create: `site/src/world/noctis/TraceDirector.tsx`
- Modify: `site/src/world/rooms/noctis.ts` (replace the Task 2.1 shell with the full environment), `site/src/world/Scene.tsx` (mount the director in the noctis room)

**Interfaces:**
- Consumes: everything from 4.1–4.4, `RoomDef`, `ScreenTexture`, `useWorldStore`.
- Produces: `noctisStations: StationDef[]`, `noctisStationMap: Record<string, StationDef>`, `TraceDirector`.

- [ ] **Step 1: Replace the shell in `site/src/world/rooms/noctis.ts`** — keep `id`/`name`/`subtitle`/`palette`/`map`/`spawn`/`doors` from Task 2.1 exactly (the door at `"0,6"` and `nx-display` stay), delete the shell crates and pedestal, and add:

```ts
import type { StationDef } from "../noctis/trace-types";

// The REAL node names from Noctis agent/graph.py (plan A25), laid out as the
// execution order they actually run in: five stations along the north wall,
// three along the south, so the retry hop (critic -> planner) crosses the room
// where a visitor can see it.
export const noctisStations: StationDef[] = [
  { id: "reset", role: "REPO RESET", about: "Restores the workspace to a known state before anything is touched.", tile: [3, 3] },
  { id: "indexer", role: "LOCALIZER", about: "AST code map plus a lexical index and a Qdrant vector collection, fused into one ranking; parses pytest tracebacks back into candidate locations.", tile: [6, 3] },
  { id: "planner", role: "PLANNER", about: "Emits typed per-file work packages: file, plan, exact target functions, related files with stated reasons.", tile: [9, 3] },
  { id: "test_generator", role: "TEST GENERATOR", about: "Writes the pytest file that should have caught the bug.", tile: [12, 3] },
  { id: "engineer", role: "ENGINEER (PARALLEL)", about: "LangGraph Send fans out one engineer per work package. Returns surgical Edit records, never a whole file.", tile: [15, 3] },
  { id: "reassembler", role: "REASSEMBLER", about: "Applies each Edit to the syntax tree with libcst, so untouched code stays byte-stable.", tile: [15, 9] },
  { id: "executor", role: "TEST EXECUTOR", about: "Runs the suite and captures real output.", tile: [12, 9] },
  { id: "critic", role: "CRITIC", about: "Verdict plus the list of files that actually failed; the routing gate loops back to the planner up to five times.", tile: [9, 9] },
];

export const noctisStationMap: Record<string, StationDef> = Object.fromEntries(
  noctisStations.map((s) => [s.id, s]),
);
```

The roster above is the real one (plan A25, transcribed from `agent/graph.py` on 2026-09-15), so this is no longer an EDIT-ME. Two rendering notes for whoever executes this task:

1. **`engineer` genuinely runs N instances at once** (LangGraph `Send`). A single travelling box cannot show that. Render the fan-out as one box per engineer event in flight — `ArtifactBox` already takes a flight ref, so lift it to a small list keyed by step index rather than building a new system. If that grows past ~6 boxes on screen, cap it and say so in a `ponytail:` comment.
2. `debug_agent` (state telemetry) and `retry_router` are real nodes in the graph but are plumbing, not agents; `retry_router`'s decision is what the critic→planner hop *shows*. Do not give them desks.
3. Eight desks on the 19×13 map means the north wall row (z=3) has stations at x=3,6,9,12,15 — check each against `blocked` and the `← CORE HUB` door path at (0,6) before committing, and let the Task 3.3 validator catch the rest.

**Props (exact, `pos` is `[x, y, z]` in tile units — every one inside the 19×13 map):**

| Element | Props |
---|---|
| Ops monitor (north wall) | frame: `box [9, 1.8, 0.5]` size `[4.8, 2.6, 0.14]` color `#0b0e14`; two fins: `box [6.4, 1.8, 0.5]` and `[11.6, 1.8, 0.5]` size `[0.16, 2.6, 0.3]` color `#31423a` |
| Room signs | title above the monitor: `sign [9, 3.0, 0.5]` size `[4.2, 0.55, 0.12]` text `NOCTIS AGENT OPS` face `s`; honesty badge below it: `sign [9, 0.75, 0.62]` size `[3.4, 0.42, 0.12]` text `REPLAY OF REAL RUNS` face `s` |
| Ops table (centre) | `box [9, 0.5, 6]` size `[3, 1, 2]` color `#31423a`; four corner lamps `box [8, 1.06, 5]`, `[10, 1.06, 5]`, `[8, 1.06, 7]`, `[10, 1.06, 7]` size `[0.18, 0.12, 0.18]` color `#48bb78`; blocked `{ x: 8, z: 5, w: 2, d: 2 }` |
| Floor rails | `box [9, 0.05, 3]` size `[7.4, 0.1, 0.44]` color `#6b9c8a`; `box [13, 0.05, 6]` size `[0.44, 0.1, 5.4]`; `box [9, 0.05, 9]` size `[7.4, 0.1, 0.44]`; `box [5, 0.05, 6]` size `[0.44, 0.1, 5.4]` — walkable, they are 10 cm proud of the floor |
| Task intake (east wall) | `box [16.6, 0.5, 6]` size `[1, 1, 1.6]` color `#31423a`; `screen [16, 1.4, 6]` size `[1.2, 0.8, 0.12]` color `#48bb78` face `w`; blocked `{ x: 16, z: 6, w: 1, d: 1 }` |
| Door sign (interior) | `sign [0.45, 2.4, 6]` size `[2.6, 0.6, 0.12]` text `← CORE HUB` face `e` |
| Ambient | two `box` server racks: `[17.5, 1.2, 2]` and `[17.5, 1.2, 10]` size `[1, 2.4, 1.4]` color `#31423a`; blocked `{x:17,z:2,w:1,d:1}` and `{x:17,z:10,w:1,d:1}` |

**Interactables (final list for this room):** keep `nx-display` (`[9, 7]`, radius 1.8, `VIEW AGENT SYSTEM`, panel project `noctis`); add `nx-intake` (`[15, 6]`, radius 1.6, prompt `RUN A RECORDED TASK`, action `panel` → `{ kind: "demo", slug: "noctis" }`); add one per desk: `nx-agent-<id>` at the tile **in front of** each desk — planner `[5, 4]`, researcher `[13, 4]`, coder `[13, 8]`, tester `[5, 8]` — radius 1.5, prompt `ASK ABOUT THE {ROLE}`, action `panel` → `{ kind: "project", slug: "noctis" }`.

- [ ] **Step 2: Create `site/src/world/noctis/TraceDirector.tsx`:**

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { ScreenTexture } from "../textures";
import { noctisStationMap, noctisStations } from "../rooms/noctis";
import { snapshotAt, type ArtifactFlight, type Snapshot } from "./trace-player";
import { validateTrace } from "./validate-trace";
import { traceById, traces } from "./traces";
import { playbackClock, usePlayback } from "./store";
import { AgentStation } from "./AgentStation";
import { ArtifactBox } from "./ArtifactBox";

const SCREEN_INTERVAL = 0.25; // seconds between ops-monitor redraws (4 Hz)

export function TraceDirector({ accent = "#48bb78", wall = "#31423a" }: { accent?: string; wall?: string }) {
  const traceId = usePlayback((s) => s.traceId);
  const playing = usePlayback((s) => s.playing);
  const speed = usePlayback((s) => s.speed);

  const roster = useMemo(() => noctisStations.map((s) => s.id), []);
  const trace = traceById(traceId) ?? traces[0];

  const flightRef = useRef<ArtifactFlight | null>(null);
  const lastStep = useRef(-1);
  const redraw = useRef(0);
  const [snap, setSnap] = useState<Snapshot>(() => snapshotAt(trace, 0, roster));

  const monitor = useMemo(() => new ScreenTexture(512, 256), []);
  useEffect(() => () => monitor.dispose(), [monitor]);

  useEffect(() => {
    const errors = validateTrace(trace, roster);
    if (errors.length) console.error("[noctis] unplayable trace", trace.id, errors);
    flightRef.current = null;
    lastStep.current = -1;
    setSnap(snapshotAt(trace, playbackClock.ms, roster));
  }, [trace, roster]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    if (playing) playbackClock.ms += dt * 1000 * speed;

    const snapshot = snapshotAt(trace, playbackClock.ms, roster);
    flightRef.current = snapshot.flight;

    if (snapshot.finished && playing) usePlayback.setState({ playing: false });

    // React updates only on discrete milestones — never per frame (AD-12, AD-16).
    if (snapshot.stepIndex !== lastStep.current) {
      lastStep.current = snapshot.stepIndex;
      setSnap(snapshot);
    }

    redraw.current += dt;
    if (redraw.current >= SCREEN_INTERVAL) {
      redraw.current = 0;
      monitor.update(
        [
          "NOCTIS AGENT OPS",
          `REPLAY  ${trace.id}`,
          ...snapshot.log.slice(-6),
          snapshot.finished ? "RUN COMPLETE" : playing ? `PLAYING ${speed}x` : "PAUSED",
        ],
        accent,
      );
    }
  });

  return (
    <group>
      {/* the glowing log surface, 2 cm proud of the wall frame from Step 1 */}
      <mesh position={[9, 1.8, 0.62]}>
        <planeGeometry args={[4.4, 2.2]} />
        <meshBasicMaterial map={monitor.texture} />
      </mesh>
      {noctisStations.map((station) => (
        <AgentStation key={station.id} station={station} status={snap.statuses[station.id] ?? "idle"} accent={accent} wall={wall} />
      ))}
      <ArtifactBox flightRef={flightRef} stations={noctisStationMap} accent={accent} />
    </group>
  );
}
```

Two deliberate details, both of which will look like mistakes to whoever reviews the diff: the `TraceDirector` props have defaults **and** are always passed explicitly by `Scene.tsx` (the defaults exist so the component is playable in isolation); and `traceById(traceId) ?? traces[0]` means a stale id in the store can never blank the room. No constants file is created — accent and wall come from the room palette.

- [ ] **Step 3: Mount it.** In `Scene.tsx`, next to the existing nightfall branch:

```tsx
{room.id === "noctis" && <TraceDirector accent={room.palette.accent} wall={room.palette.wall} />}
```

- [ ] **Step 4: Verify (dev server, the part that cannot be unit-tested).** `/world?room=noctis`:
  - four desks with role signs, a black monitor on the north wall scrolling a real log, an `REPLAY OF REAL RUNS` badge under it
  - nothing moves until Task 4.6 gives you controls — for now run `usePlayback.setState({ playing: true })` in the browser console: lamps go green/amber, a labelled box slides station-to-station along the floor rails, the log grows a line per milestone, and the tester goes **red** at 22.8 s before the box travels back to the coder
  - the box rests on the receiving desk (never hovers mid-air at the end of a step) and the monitor reads `RUN COMPLETE` at 41 s
  - walk behind a desk: blocked. Stand in front: `[E] ASK ABOUT THE CODE AGENT` opens the Noctis panel
  - `usePlayback.setState({ speed: 4 })` stays smooth; `performance.measure`-free FPS ≥ 60 with the log redrawing
- [ ] **Step 5: Verify the no-per-frame rule mechanically.** In devtools, add a `console.count("render")` inside `AgentStation`'s render body and play a whole trace at 4×: the count must be ≈ once per milestone (single digits), not once per frame. Remove the counter.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat: noctis agent lab driven by recorded traces"`

---

### Task 4.6: The replay console — controls, roster, and an honest refusal

**Files:**
- Create: `site/src/components/noctis/NoctisConsole.tsx`
- Modify: `site/src/components/hud/PanelHost.tsx` (the `kind: "demo"` branch now has two slugs), `site/src/components/project/ProjectSections.tsx`

**Interfaces:**
- Consumes: `usePlayback`, `playbackClock`, `SPEEDS`, `snapshotAt`, `traces`, `traceById`, `noctisStations`, `PROJECT` content, §4 recipes.
- Produces: `NoctisConsole({ facilityHref }: { facilityHref?: string })`.

Spec §12.5 asks for a task box; AD-05 forbids public execution. This task satisfies both: the box exists, accepts text, and refuses — in one sentence that teaches the visitor something about the system's safety model (spec §12.7) instead of hiding the limitation.

- [ ] **Step 1: Create `site/src/components/noctis/NoctisConsole.tsx`:**

```tsx
"use client";

import { useEffect, useState } from "react";
import { noctisStations } from "@/world/rooms/noctis";
import { snapshotAt } from "@/world/noctis/trace-player";
import { traceById, traces } from "@/world/noctis/traces";
import { playbackClock, SPEEDS, usePlayback } from "@/world/noctis/store";

const POLL_MS = 200; // ≤ 5 Hz: the clock itself never enters React state (AD-16)

const CHIP: Record<string, string> = {
  idle: "border-facility-border text-facility-muted",
  working: "border-ok text-ok",
  handoff: "border-warn text-warn",
  done: "border-accent text-accent",
  error: "border-anomaly text-anomaly",
};

export function NoctisConsole({ facilityHref }: { facilityHref?: string }) {
  const { traceId, playing, speed, setTrace, toggle, cycleSpeed, rewind } = usePlayback();
  const [nowMs, setNowMs] = useState(playbackClock.ms);
  const [task, setTask] = useState("");
  const [refused, setRefused] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(playbackClock.ms), POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  const trace = traceById(traceId) ?? traces[0];
  const roster = noctisStations.map((s) => s.id);
  const snap = snapshotAt(trace, nowMs, roster);
  const progress = Math.min(100, Math.round((nowMs / trace.durationMs) * 100));

  return (
    <div className="space-y-5">
      <div className="rounded border border-warn px-3 py-2 font-mono text-xs text-warn">
        REPLAY MODE — these are recorded runs, not live execution. Public task execution is disabled by
        design.
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">// Recorded runs</p>
        <div className="mt-2 space-y-2">
          {traces.map((t) => (
            <button
              key={t.id}
              onClick={() => setTrace(t.id)}
              aria-pressed={t.id === traceId}
              className={`block w-full rounded-md border p-3 text-left font-mono text-xs hover:border-accent ${
                t.id === traceId ? "border-accent" : "border-facility-border"
              }`}
            >
              <span className="text-facility-text">{t.task}</span>
              <span className="mt-1 block text-facility-muted">
                {t.outcome} · {(t.durationMs / 1000).toFixed(0)}s · {t.events.length} steps
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <button onClick={toggle} className="rounded-md bg-accent px-4 py-2 font-bold text-facility-bg">
          {playing ? "PAUSE" : snap.finished ? "REPLAY" : "PLAY"}
        </button>
        <button onClick={rewind} className="rounded-md border border-facility-border px-4 py-2 hover:border-accent">
          RESET
        </button>
        <button onClick={cycleSpeed} className="rounded-md border border-facility-border px-4 py-2 hover:border-accent">
          {speed}x
        </button>
        <span className="ml-auto text-facility-muted">
          {progress}% · {trace.provenance}
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded bg-facility-border">
        <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">// Agents</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {noctisStations.map((s) => (
            <li key={s.id} title={s.about}>
              <span
                className={`rounded border px-2 py-1 font-mono text-xs ${CHIP[snap.statuses[s.id] ?? "idle"] ?? CHIP.idle}`}
              >
                {s.id} · {(snap.statuses[s.id] ?? "idle").toUpperCase()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-facility-muted">// Ops log</p>
        <ol className="mt-2 max-h-40 overflow-y-auto rounded-md border border-facility-border bg-facility-bg p-3 font-mono text-xs text-facility-muted" aria-live="polite">
          {snap.log.map((line, i) => (
            <li key={`${trace.id}-${i}`} className={line.includes("[FAILED]") ? "text-anomaly" : undefined}>
              {line}
            </li>
          ))}
          {snap.flight && (
            <li className="text-warn">
              … {snap.flight.label} → {snap.flight.to}
            </li>
          )}
        </ol>
        {snap.finished && <p className="mt-2 font-mono text-xs text-ok">{trace.outcome}</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setRefused(true);
        }}
      >
        <label htmlFor="nx-task" className="font-mono text-xs uppercase tracking-widest text-facility-muted">
          Give Noctis a task
        </label>
        <textarea
          id="nx-task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={3}
          placeholder="Describe an engineering task, or paste a small snippet…"
          className="mt-2 w-full rounded-md border border-facility-border bg-facility-bg p-3 font-mono text-sm"
        />
        <button type="submit" className="mt-2 rounded-md border border-facility-border px-4 py-2 font-mono text-xs hover:border-accent">
          SUBMIT
        </button>
        {refused && (
          <p role="status" className="mt-2 font-mono text-xs text-warn">
            {task.trim()
              ? "Noctis does not run visitor code on this site — unbounded execution, spend and prompt injection are the reasons, and they are part of what the system was designed around. Pick a recorded run above to watch the same shape of work."
              : "Type a task first."}
          </p>
        )}
      </form>

      {facilityHref && (
        <p className="font-mono text-xs text-facility-muted">
          <a href={facilityHref} className="text-accent underline">
            Watch this run in the agent lab
          </a>{" "}
          — the boxes travel across the floor.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire both demo slugs.** In `PanelHost.tsx` the `kind: "demo"` branch becomes:

```tsx
if (panel.kind === "demo") {
  const project = projects.find((p) => p.slug === panel.slug);
  if (!project) return null;
  if (project.slug === "noctis") {
    return (
      <ProjectPanel title="NOCTIS — AGENT OPS CONSOLE" onClose={closePanel}>
        <NoctisConsole />
      </ProjectPanel>
    );
  }
  return (
    <ProjectPanel title={`${project.name} — INSPECTION STATION`} onClose={closePanel}>
      <InspectDemo projectHref={`/projects/${project.slug}`} />
    </ProjectPanel>
  );
}
```

In `ProjectSections.tsx`, next to the nightfall block from Task 3.7:

```tsx
{project.demo === "noctis" && (
  <Section title="Watch a run">
    <NoctisConsole facilityHref="/world?room=noctis" />
  </Section>
)}
```

- [ ] **Step 3: Verify the shared-clock behaviour.** Open `/world?room=noctis`, press `[E]` at the intake terminal, hit PLAY: the panel's log and chips animate **and** the 3D room moves — one clock, two views. Close the panel: playback continues in the room. Walk to the hub and back: the clock is where you left it (paused, since the director unmounts). Press PLAY again: it resumes.
- [ ] **Step 4: Verify the standard page.** `/projects/noctis` shows the console with a working PLAY/RESET/speed, the refusal message appears on submit with text and with an empty box, the `?room=noctis` link lands in the lab, and there is no claim anywhere that this is live.

Then check the bundle, because this component imports from `@/world/…`: `npm run build` and confirm the `/projects/noctis` route's First Load JS did **not** grow by anything close to three.js's size. It should not — `rooms/noctis.ts`, `trace-player.ts`, `traces.ts` and `store.ts` are data and pure functions with no `three` import, which is the real reason AD-11 and the roster-as-data design are worth defending. If three.js has leaked in, find the import that dragged it (a `textures` or `.tsx` world component reached from this chain) and break that link rather than adding a dynamic import to hide it.

`npm run test` green.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: noctis replay console"`

---

### Task 4.7: Phase 4 exit gate

- [ ] Re-read the gate at the top of Phase 4 and tick every box, including the two that are easy to fake:
  - `npm run test` still passes with the new player/validator suites, and the render-count check from Task 4.5 Step 5 was actually performed (say so in the commit message of the next task, or in the PR body).
  - A recruiter who never presses `E` still learns what Noctis does: the room's signs, the ops monitor and the north-wall `REPLAY OF REAL RUNS` badge must be readable from the doorway.
- [ ] Draw-call sanity: `gl.info.render.calls` (see Appendix C.4) in the noctis room ≤ 120. If it is over, the first suspect is a texture created inside a render — check every `makeSignTexture` call is inside `useMemo`.
- [ ] `npm run build` + `npm run test` green, tree clean.

**Deferred on purpose** (do not build now): live execution behind auth (Appendix B.5), agent streaming over a socket, more than two traces, per-agent 3D animation rigs. Each is a v2 candidate, recorded in Appendix E.

---

# Phase 5 — The rest of the facility, then the seasoning

**Goal:** the last two rooms (Research, About + comms), a per-room atmosphere pass, and the optional garnish the spec asks for (sound, one easter egg) — without letting any of it grow into a game.

**Exit gate:**

- [ ] All five rooms are registered, reachable, and pass the Task 3.3 validator; hub shows no "under construction" prompt anywhere
- [ ] Research opens the four `site.research` stations; About opens the About panel and the comms terminal reaches email / GitHub / LinkedIn / resume in ≤ 2 interactions
- [ ] Every room is distinguishable with the HUD covered — floor colour, light temperature and prop silhouette, not signage alone
- [ ] Sound is **off** on first visit, one toggle, zero audio files
- [ ] The one easter egg rewards full-tour exploration and blocks nothing
- [ ] `npm run build` + `npm run test` green; `/world?room=research` and `?room=about` work

### Task 5.1: Research room

**Files:**
- Create: `site/src/world/rooms/research.ts`
- Modify: `site/src/world/rooms.ts` (register it), `site/src/world/rooms/hub.ts` (add the west door, delete the `door-w` construction interactable), `site/src/world/Scene.tsx` (research-only props if any)

- [ ] **Step 1: Room data.** 15 tiles wide × 11 deep, palette from §4 (floor `#262b33`, wall `#38414e`, accent `#7f9cf5`, trim `#a0aec0`). Map rows — the west door of the hub is at `(0,7)`, so research's door sits on its **east** wall at `(14,5)`:

```text
row 0   "###############"     15 '#'
row 1   "#.............#"
row 2   "#.............#"
row 3   "#.............#"
row 4   "#.............#"
row 5   "#.............D"     14 chars of '#'+'.' then the door at x=14
row 6   "#.............#"
row 7   "#.............#"
row 8   "#.............#"
row 9   "#.............#"
row 10  "###############"
```

`spawn: { x: 13, z: 5, facing: "w" }` · `doors: { "14,5": { targetRoom: "hub", spawn: { x: 1, z: 7 }, facing: "e" } }` · `name: "RESEARCH LAB"`, `subtitle: "What I am reading, building and measuring"`.

**Props (exact):**

| Element | Props |
|---|---|
| Station desks ×4 (tiles `(4,3)`, `(10,3)`, `(4,8)`, `(10,8)`) | per station: `box [x, 0.45, z]` size `[1.8, 0.9, 1.2]` color `#38414e`; `box [x, 1.2, z-0.4]` size `[1.2, 0.7, 0.1]` color `#7f9cf5`; blocked `{ x, z, w: 1, d: 1 }` |
| Reading board (north wall) | `box [7, 1.8, 0.5]` size `[5.2, 2.6, 0.14]` color `#0b0e14`; `screen [7, 1.8, 0.6]` size `[4.6, 2.1, 0.06]` color `#7f9cf5` face `s` |
| Signs | `sign [7, 3.1, 0.5]` size `[3.6, 0.5, 0.12]` text `RESEARCH STATIONS` face `s`; `sign [0.45, 2.4, 5]` size `[2.6, 0.6, 0.12]` text `← CORE HUB` face `e`; one `sign [x, 2.3, z]` size `[2.8, 0.55, 0.12]` per desk, face `s`, text = the four `site.research` titles in order (Computer Vision, Machine Learning, 3D Vision, Systems) |
| Ambient | two `crate` props `[1.6, 0.4, 9.4]` and `[12.4, 0.4, 1.6]` size `[0.8, 0.8, 0.8]` color `#38414e` (book boxes, not obstacles — leave them walkable) |

The four desk sign texts are the **only** content duplicated between `src/content/` and world data, because a canvas texture cannot read the content module at map-authoring time. Task 6.1 asserts they still match; if AJ renames a station, both places change.

**Interactables:** `rs-<n>` for n = 0..3 at the tile in front of each desk — `[4,4]`, `[10,4]`, `[4,9]`, `[10,9]` — radius 1.5, prompt `READ {STATION TITLE}` (uppercase), action `panel` → `{ kind: "research" }`. Plus `rs-board` at `[7,2]` radius 1.6, prompt `RESEARCH OVERVIEW`, action `panel` `{ kind: "research" }`.

- [ ] **Step 2: Wire the hub.** In `rooms/hub.ts`: add `"0,7": { targetRoom: "research", spawn: { x: 13, z: 5 }, facing: "w" }` to `doors` and delete the `door-w` interactable. In `rooms.ts` register `research`.

- [ ] **Step 3: Verify.** `npm run test` — the Task 3.3 validator must pass for a brand-new map (this is the moment it earns its keep; fix the map, not the test). Dev server: hub west door → research, `[E]` at each desk opens the research panel with all four stations from `site.research`, the door back lands you beside the hub doorway. `npm run build` green.

- [ ] **Step 4: Commit.** `git add -A && git commit -m "feat: research room"`

---

### Task 5.2: About room + comms terminal (AD-15)

**Files:**
- Create: `site/src/world/rooms/about.ts`
- Modify: `site/src/world/rooms.ts`, `site/src/world/rooms/hub.ts` (south door + delete `door-s`), `site/src/components/hud/PanelHost.tsx` (add a `contact` view to the About panel — see Step 3)

- [ ] **Step 1: Room data.** 15 × 11, palette floor `#2f2c33`, wall `#443f4a`, accent `#cbd5e1`, trim `#9aa2b1`. The hub's south door is at `(9,14)`, so about's door is on its **north** wall at `(7,0)`:

```text
row 0   "#######D#######"     7 '#' + D + 7 '#'
rows 1–10 "#.............#"   (ten identical rows: '#' + 13 '.' + '#')
```

`spawn: { x: 7, z: 1, facing: "s" }` · `doors: { "7,0": { targetRoom: "hub", spawn: { x: 9, z: 13 }, facing: "n" } }` · `name: "WORKSTATION"`, `subtitle: "Who builds the facility"`.

**Props (exact):**

| Element | Props |
|---|---|
| Desk (the personal workstation, spec §14) | `box [7, 0.45, 4]` size `[2.4, 0.9, 1.4]` color `#443f4a`; `screen [7, 1.35, 3.55]` size `[1.5, 0.9, 0.1]` color `#cbd5e1` face `n`; blocked `{ x: 7, z: 4, w: 1, d: 1 }` and `{ x: 7, z: 3, w: 1, d: 1 }`. No chair: a seat you walk through is worse than no seat, and AD-09 gives us no avatar-on-avatar collision. |
| Comms terminal (east wall) | `box [13.6, 0.55, 5]` size `[1, 1.1, 1.4]` color `#443f4a`; `screen [13.05, 1.5, 5]` size `[0.1, 0.9, 1.1]` color `#7f9cf5`; blocked `{ x: 13, z: 5, w: 1, d: 1 }` |
| Timeline wall (west) | `box [1.5, 1.6, 6]` size `[0.12, 2.2, 4.6]` color `#443f4a`; `sign [1.62, 2.9, 6]` size `[2.8, 0.5, 0.12]` text `TIMELINE` face `e` |
| Shelf / awards | `crate [11, 0.5, 9]` size `[1, 1, 1]` color `#38414e`; `crate [12.4, 0.3, 9.4]` size `[0.6, 0.6, 0.6]` color `#9aa2b1`; blocked `{ x: 11, z: 9, w: 1, d: 1 }` and `{ x: 12, z: 9, w: 1, d: 1 }` |
| Signs | `sign [7, 2.6, 0.5]` size `[3.2, 0.6, 0.12]` text `AJ — WORKSTATION` face `s`; `sign [0.45, 2.4, 8]` size `[2.6, 0.6, 0.12]` text `← CORE HUB` face `e` |

**Interactables:**

| id | pos | radius | prompt | action |
|---|---|---|---|---|
| `ab-desk` | `[7, 5]` | 1.6 | `WHO IS AJ` | panel `about` |
| `ab-timeline` | `[2, 6]` | 1.6 | `READ THE TIMELINE` | panel `about` |
| `ab-comms` | `[12, 5]` | 1.6 | `OPEN COMMS CHANNEL` | panel `contact` |
| `ab-resume` | `[11, 10]` | 1.5 | `TAKE THE RESUME` | link `/resume.pdf` |

`ab-resume` is the first `{ type: "link" }` action in the facility — `runAction` already handles it (Task 1.7), and spec §8 wants the resume reachable from inside the world.

- [ ] **Step 2: Register and open the hub.** `rooms.ts` += `about`. `hub.ts`: add `"9,14": { targetRoom: "about", spawn: { x: 7, z: 1 }, facing: "s" }`, delete the `door-s` construction interactable, and change the south door sign text from `ABOUT` to `ABOUT · COMMS`.

- [ ] **Step 3: `panel: "contact"` needs a type.** Extend `PanelTarget` in `world/types.ts` with `| { kind: "contact" }` and render it in `PanelHost`: the four `site.owner` channels (email `mailto:`, GitHub, LinkedIn, `/resume.pdf`) as a full-height list of large buttons, each `target="_blank" rel="noopener"` except `mailto:` and the resume, plus one line of text — *"No forms, no cookies, no analytics. The shortest path between you and AJ."* Nothing else. Spec §15 is a two-second job, not a puzzle.

- [ ] **Step 4: Verify.** `npm run test` (validator covers the two new maps automatically), `npm run build`. Dev server: hub → south door → desk `[E]` → About panel; east terminal `[E]` → comms panel; every channel actually opens; `[E]` at the shelf opens the resume PDF in a new tab; both doors return to the hub beside their doorways; `?room=about` and `?room=research` deep-link correctly.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: about room, comms terminal, resume pickup"`

Re-read Step 1's blocked lists against the validator rule "an interactable must stand on a walkable tile": `ab-desk` at `(7,5)` is clear of the desk blocks at `(7,3)`/`(7,4)`, and `ab-resume` at `(11,10)` is clear of the crate blocks at `(11,9)`/`(12,9)`. That is why those numbers are what they are — do not tidy them back onto the furniture.

---

### Task 5.3: Atmosphere pass — lighting, doors, transitions

**Files:**
- Modify: `site/src/world/Scene.tsx`, `site/src/world/types.ts` (`RoomAtmosphere`), `site/src/world/rooms/*.ts` (one `atmosphere` block each), `site/src/world/WorldCanvas.tsx` (fog), `site/src/world/InteractionSystem.tsx` (nothing — do not touch it)

Spec §19 makes lighting a first-class part of the experience; spec §21 wants transitions to feel physical. This is the whole of both, and it is deliberately cheap: two lights, a fog distance, and a per-room tint. No shadow maps (cut list), no post-processing, no extra draw calls worth mentioning.

- [ ] **Step 1: Add the data type** to `world/types.ts`:

```ts
export interface RoomAtmosphere {
  /** scene.fog colour + canvas clear colour */
  fog: string;
  /** how soon the fog closes in; smaller = more claustrophobic */
  fogNear: number;
  fogFar: number;
  ambient: number;
  key: number;
  /** warm for the workshop, cool for the labs */
  keyColor: string;
  /** accent point light height and reach */
  rimHeight: number;
  rimDistance: number;
}
```
and add `atmosphere: RoomAtmosphere;` to `RoomDef`.

- [ ] **Step 2: Fill it in per room** (all five; these are the locked values, tuned to spec §19's one-line briefs):

| Room | fog | fogNear | fogFar | ambient | key | keyColor | rimHeight | rimDistance |
|---|---|---|---|---|---|---|---|---|
| hub | `#0b0e14` | 14 | 34 | 0.78 | 1.0 | `#ffffff` | 3.0 | 22 |
| nightfall | `#120d08` | 8 | 24 | 0.52 | 0.85 | `#ffd7a8` | 2.6 | 14 |
| noctis | `#071109` | 10 | 28 | 0.6 | 0.8 | `#c9f5d5` | 2.8 | 18 |
| research | `#0a0d12` | 10 | 26 | 0.7 | 0.9 | `#dbe6ff` | 3.0 | 16 |
| about | `#0d0b10` | 9 | 26 | 0.72 | 0.95 | `#ffffff` | 3.0 | 16 |

- [ ] **Step 3: Drive the scene from it.** In `Scene.tsx` replace the three hard-coded lights with values read from `room.atmosphere` (same light types, same positions, new intensities/colours), and in `WorldCanvas.tsx` set the canvas background and fog from it:

```tsx
<fog attach="fog" args={[room.atmosphere.fog, room.atmosphere.fogNear, room.atmosphere.fogFar]} />
```

plus `gl={{ antialias: true }}` and `scene.background` via `<color attach="background" args={[room.atmosphere.fog]} />`. Both must remount per room — they already do, because `<Scene key={roomId}>` is keyed.

- [ ] **Step 4: Door frames (spec §21, the physical half).** Add a `doorframe` prop type to `PropType` and render it in `Props.tsx` as two jambs + a lintel in the room's trim colour, then place one per doorway in all five rooms' `props`. It is 6 lines of geometry and it is what makes a doorway read as a doorway from across the room.

- [ ] **Step 5: Verify (dev server, in this order).** Walk hub → nightfall: the light goes warm and the fog closes in before you pass the jamb. Nightfall → hub: it opens up. Noctis reads green and dimmer than the hub from the spawn tile. Every doorway has a frame; you can never mistake a wall for an exit. Take screenshots of all five rooms for the record (Appendix C.5) — this is a human judgement task, not an assertion.
- [ ] **Step 6: Guard the budget.** Confirm the light count per room is still 3 (`ambientLight`, `directionalLight`, `pointLight`) — more lights means more shader recompiles on room change and a measurable hitch. Confirm `npm run build` + `npm run test` green.
- [ ] **Step 7: Commit.** `git add -A && git commit -m "feat: per-room atmosphere and door frames"`

---

### Task 5.4: Sound — optional, muted by default, no files (OPTIONAL TASK)

**Files:**
- Create: `site/src/world/sound.ts`
- Modify: `site/src/world/actions.ts` (one call), `site/src/world/PlayerController.tsx` (footstep tick), `site/src/components/hud/Hud.tsx` + `PauseMenu.tsx` (toggle)

Skip this task entirely if time is short; the exit gate does not require it. It is specified anyway so that "we'll do sound later" does not turn into a 4 MB asset folder.

- [ ] **Step 1: Create `site/src/world/sound.ts`** — one `AudioContext`, three oscillator recipes, no assets:

```ts
type Voice = "blip" | "door" | "step";

const TONES: Record<Voice, { f: number; type: OscillatorType; ms: number; gain: number }> = {
  blip: { f: 660, type: "square", ms: 70, gain: 0.05 },
  door: { f: 180, type: "sawtooth", ms: 220, gain: 0.04 },
  step: { f: 90, type: "sine", ms: 45, gain: 0.02 },
};

let ctx: AudioContext | null = null;
let enabled = false;

export function setSoundEnabled(next: boolean) {
  enabled = next;
  if (next && !ctx) ctx = new AudioContext();
  if (next) void ctx?.resume();
}
export function isSoundEnabled() {
  return enabled;
}

export function play(voice: Voice) {
  if (!enabled || !ctx) return; // never autoplay, never construct a context unasked
  const { f, type, ms, gain } = TONES[voice];
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = f;
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
  osc.connect(amp).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + ms / 1000);
}
```

- [ ] **Step 2: Use it in three places.** `runAction`: `play("blip")` before the switch. `goThroughDoor`: `play("door")` at the top. `PlayerController`: a footstep tick — a ref accumulator that calls `play("step")` every 0.32 s while `movingRef.current` is true (do **not** add React state, and do not put it in `useFrame` at per-pixel precision).
- [ ] **Step 3: Expose the toggle.** Add `soundOn` to `useWorldStore` (default `false`) and a `[ SOUND ON ]` / `[ SOUND OFF ]` row in `PauseMenu` that calls `setSoundEnabled`. Persist nothing: a portfolio visitor who wants silence again can press the button; a returning visitor must not get audio they never asked for.
- [ ] **Step 4: Verify.** Default = silent, confirmed by an interaction with no toggle pressed. Enable it: blip on every `[E]`, door whoosh on transitions, quiet step tick while walking that stops when you stop. Nothing plays while a panel is open. Mute the tab in the browser and confirm no errors. `npm run build` green.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: optional synthesized facility sound"`

---

### Task 5.5: The one easter egg — the maintenance door (OPTIONAL TASK)

**Files:**
- Create: `site/src/world/rooms/closet.ts`
- Modify: `site/src/world/types.ts` (`DoorTarget.requires`), `site/src/world/rooms.ts`, `site/src/world/rooms/hub.ts`, `site/src/world/actions.ts`, `site/src/world/store.ts`, `site/src/world/PlayerController.tsx`, `site/src/components/hud/Hud.tsx`, `site/src/content/site.ts` + `types.ts` (`secrets`)

Spec §17 wants something hidden that rewards curiosity and blocks nothing. One, not eleven. The whole mechanism is **a lock check and a toast** — no new rooms system, no inventory, no achievements (still cut).

- [ ] **Step 1: Track the tour and add a notice channel.** In `store.ts`: `visited: Record<string, true>` merged by `enterRoom` (`{ ...get().visited, [roomId]: true }` — doors are rare, so a `set` per transition is fine), plus `notice: string | null` and `setNotice(notice)`. In `Hud.tsx` render `notice` in the same visual slot as `PromptBar` but with `role="status"` and no `[E]` prefix.
- [ ] **Step 2: A locked door is a door.** Add `requires?: string[]` to `DoorTarget` (types.ts). In `PlayerController`'s door branch, before calling `goThroughDoor`, check the requirements against `useWorldStore.getState().visited`; if any is missing, call `setPrompt` + `setNotice("MAINTENANCE ACCESS — VISIT EVERY LAB FIRST")` instead of entering and set `doorLock.current = true` so the notice does not spam every frame. `runAction` is not involved: this stays a step-on door.
- [ ] **Step 3: Hub edit.** Change hub row 14 from `"#########D#########"` to `"#########D#######D#"` — 9 `#`, the existing ABOUT door at x=9, 7 `#`, the new doorway at x=17, 1 `#`. Count it: 9+1+7+1+1 = 19. Add `doors["17,14"] = { targetRoom: "closet", spawn: { x: 2, z: 3 }, facing: "n", requires: ["nightfall", "noctis", "research", "about"] }`. No sign prop, no interactable, no glow: a visitor who has not finished the tour sees a blank alcove; one who has will try the second doorway. That is the entire hiding mechanism.
- [ ] **Step 4: The closet.** 5 wide × 5 deep, `#` border, door tiles `D` at `(2,4)` (south, back to hub) and nothing else:

```text
row 0 "#####"
row 1 "#...#"
row 2 "#...#"
row 3 "#...#"
row 4 "##D##"
```

You enter through the hub's doorway at `(17,14)` and land on tile `(2,3)`, looking at the terminal on the far wall — so `facing: "n"`. Both door records, spelled out:

```ts
// closet.ts
spawn: { x: 2, z: 3, facing: "n" },
doors: { "2,4": { targetRoom: "hub", spawn: { x: 16, z: 13 }, facing: "n" } },
```

`id: "closet"`, `name: "MAINTENANCE CLOSET"`, `subtitle: "You found the utility room"`, palette = hub dimmed by hand (floor `#20272f`, wall `#2c3543`, accent `#8b94a7`, trim `#4a5568`), atmosphere copied from hub with `fogNear: 6, fogFar: 16, ambient: 0.45, key: 0.7, keyColor: "#cbd5e1", rimHeight: 2.2, rimDistance: 8`.

Props: `box [2, 0.4, 1]` size `[1.6, 0.8, 1]` color `#2c3543`; `screen [2, 1.15, 1.05]` size `[1.1, 0.55, 0.1]` color `#8b94a7` face `s`; `crate [0.8, 0.35, 3.4]` and `crate [3.2, 0.35, 3.4]` size `[0.7, 0.7, 0.7]` color `#2c3543`. Blocked: `{ x: 2, z: 1, w: 1, d: 1 }`. Interactable: `cl-terminal` at `[2, 2]`, radius 1.4, prompt `READ THE LOG`, action `panel` `{ kind: "closet" }`.

- [ ] **Step 5: The payoff is text, not a mechanic.** Add `secrets: string[]` to `SiteContent` (`content/types.ts`) and 5–7 short lines in `content/site.ts` (EDIT-ME, Appendix D.4): hours spent, the three things deliberately cut and why, the one bug that took longest, and a last line — *"If you found this, you explored. That is the whole point of the building."* Extend `PanelTarget` with `| { kind: "closet" }` and render it in `PanelHost` as a plain list in the About-panel style. Content first (AD-01), so this never becomes component copy.

- [ ] **Step 6: Verify.** With three labs visited, stepping on `(17,14)` shows the notice and does not move you; the notice clears and does not repeat while you stand there. Complete the tour, return, step through: the closet, its terminal, `[E]` → the log. Walk back out: the door returns you beside `(17,14)` in the hub. `npm run test` — the validator must pass for all six maps with **no** exemptions (the closet's return door and hub's locked door satisfy the symmetry rule at 1.41 tiles). `npm run build` green.
- [ ] **Step 7: Commit.** `git add -A && git commit -m "feat: maintenance door easter egg"`

---

### Task 5.6: Phase 5 exit gate

- [ ] Walk the whole facility with the HUD hidden (`?room=` deep links + all doors): five rooms plus a locked closet, each recognisable by colour and light alone.
- [ ] `npm run test` — the room validator now guards six maps. `npm run build` green.
- [ ] Nothing in this phase added a dependency, an asset file, a shader, or a light. If any of those is true, revert and record why in the amendment log (§2a).
- [ ] Confirm the cut list still holds: no achievements, no second easter egg, no audio files, no chairs.

---

# Phase 6 — Accessibility, evidence, and the launch gate

**Goal:** make spec §24 true with evidence rather than intention. The world must be an enhancement, never a barrier: every fact in the facility is reachable without WebGL, without a mouse, without audio, and without motion. Then measure everything §1 promised and prove the content is real.

**Exit gate:**

- [ ] A keyboard-only visitor can complete the entire facility tour and every demo, and can always see where focus is
- [ ] A screen-reader visitor on `/world` hears: what the facility is, which room they are in, the same facts every panel shows, and links to the standard pages
- [ ] `prefers-reduced-motion` removes camera damping, the fade, the walk bob and the conveyor — while every interactable still works
- [ ] A no-WebGL device reaches the Nightfall demo and the Noctis replay through `/projects/*` with zero loss of *information*, only of spatial novelty
- [ ] Lighthouse accessibility ≥ 95 on `/`, `/projects/nightfall`, `/world`; performance ≥ 90 on the standard pages
- [ ] Every §1 budget has a recorded number (Appendix C.5), and `npm run check:content` exits 0 with no `EDIT-ME` left
- [ ] `npm run e2e` green locally and in CI; `npm run build` + `npm run test` green

### Task 6.1: Accessibility pass — the world as a document

**Files:**
- Create: `site/src/components/a11y/SkipLink.tsx`, `site/src/components/hud/WorldReading.tsx`
- Modify: `site/src/app/layout.tsx`, `site/src/app/(site)/layout.tsx`, `site/src/app/globals.css`, `site/src/components/project/ProjectPanel.tsx`, `site/src/components/hud/Hud.tsx`, `site/src/components/hud/PromptBar.tsx`, `site/src/components/hud/WorldFallback.tsx`, `site/src/world/store.ts`, `site/src/world/WorldCanvas.tsx`, `site/src/world/CameraRig.tsx`, `site/src/world/Character.tsx`, `site/src/world/nightfall/Conveyor.tsx`, `site/src/world/noctis/AgentStation.tsx`

- [ ] **Step 1: Landmarks and a skip link.** `app/layout.tsx`: `<main id="main">{children}</main>`. New `SkipLink.tsx`:

```tsx
export function SkipLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:font-bold focus:text-facility-bg"
    >
      {label}
    </a>
  );
}
```

Render `<SkipLink href="#main" label="Skip to content" />` first inside `(site)/layout.tsx`, and `<SkipLink href="#facility-reading" label="Skip the 3D facility — read it instead" />` first inside `/world`. Both targets must exist by the end of this task; a skip link that goes nowhere is worse than none.

- [ ] **Step 2: A reading of the facility that is always in the DOM.** Create `WorldReading.tsx`, mounted by `WorldCanvas` next to `<Hud />`. This is the document face of the room you are standing in — not a hidden fallback, so a screen-reader visitor gets what the walls say:

```tsx
"use client";

import Link from "next/link";
import { useWorldStore } from "@/world/store";
import { rooms } from "@/world/rooms";
import { projects } from "@/content/projects";

export function WorldReading() {
  const roomId = useWorldStore((s) => s.roomId);
  const room = rooms[roomId] ?? rooms.hub;
  const related = projects.filter((p) => room.name.toUpperCase().includes(p.name.toUpperCase()));
  const prompts = room.interactables.map((i) => i.prompt);

  return (
    <section id="facility-reading" className="sr-only">
      <h1>{`${room.name} — ${room.subtitle}`}</h1>
      <p>
        {`You are inside the interactive portfolio of ${projects.length ? "AJ" : "AJ"}. `}
        {prompts.length ? `Things you can inspect here: ${prompts.join("; ")}. ` : ""}
        {Object.keys(room.doors).length ? `There are doorways you can walk through.` : "This room has no exit door; use the menu."}
      </p>
      {related.map((p) => (
        <div key={p.slug}>
          <h2>{p.name}</h2>
          <p>{p.summary}</p>
          <Link href={`/projects/${p.slug}`}>Read {p.name} as a page</Link>
        </div>
      ))}
      <nav aria-label="Facility rooms">
        {Object.values(rooms).map((r) => (
          <Link key={r.id} href={`/world?room=${r.id}`}>{r.name}</Link>
        ))}
      </nav>
      <nav aria-label="Standard portfolio">
        <Link href="/projects">Projects</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </section>
  );
}
```

Clean up that first template literal into plain prose — it is spelled out to show the shape, not to ship `projects.length ? "AJ" : "AJ"`. Then set `aria-hidden="true"` on the canvas wrapper **in the same commit** as this component, and verify with a real screen reader that the world is not simply silenced. `aria-hidden` without the reading is the single worst failure mode available to this codebase.

- [ ] **Step 3: Panels are dialogs, honestly.** In `ProjectPanel.tsx` add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the panel's heading id, and this hook:

```tsx
const FOCUSABLE =
  'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

function useDialogFocus(cardRef: React.RefObject<HTMLElement | null>, onClose: () => void) {
  const returned = useRef<Element | null>(null);
  useEffect(() => {
    returned.current = document.activeElement;
    const card = cardRef.current;
    card?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !card) return;
      const items = Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      (returned.current as HTMLElement | null)?.focus?.();
    };
  }, [cardRef, onClose]);
}
```

`PauseMenu` is modal too and gets the same treatment. Note the ESC collision you are about to create: `useKeyboard` (Task 1.7) already closes panels on ESC. The dialog's own listener runs first and calls `closePanel`; `useKeyboard`'s handler then sees `panel === null` and would open the pause menu — so guard the pause branch with `if (closedPanelJustNow) return;` using a one-shot ref, or (preferred, simpler) have `useKeyboard`'s `onPause` no-op when a dialog is open by checking `document.querySelector('[role="dialog"]')` first. Verify the exact behaviour in Step 7.4 either way.

- [ ] **Step 4: Announce what changes.** `PromptBar` wraps its text in `<p role="status">`; the Task 5.5 notice slot likewise. Put `aria-live="polite"` on the HUD's room-name span only — never around the whole HUD. Confirm `InspectDemo`'s `role="status"` result block, its `aria-busy` on the run button, and `NoctisConsole`'s log region all still fire after the dialog refactor.
- [ ] **Step 5: Reduced motion.** Add `reducedMotion: boolean` to `useWorldStore` (default `false`), set once from `window.matchMedia("(prefers-reduced-motion: reduce)").matches` when `WorldCanvas` mounts (a mid-session OS flip is not worth a listener — mark that `ponytail:` in the code). Consume it in four places: `CameraRig` (damp → assign), `TransitionOverlay` (`duration-200` → none), `Character` + `AgentStation` (no bob), `Conveyor` (belt parked, monitor still refreshing so the room still reads as alive). Plus the CSS guard in `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

That rule does not touch the canvas — which is exactly why the store flag exists. Do not add a second motion toggle to the UI; the OS setting is the toggle.
- [ ] **Step 6: Keyboard and contrast.** Add `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }`. Verify `useKeyboard` ignores Tab/Shift+Tab (it only maps WASD/arrows/E/ESC — check the code, do not trust this sentence), and that ESC closes a panel without also opening the pause menu. Check the two risky small-text pairs by hand: `text-anomaly` `#e5534b` on `#131826` ≈ 4.3:1 and `text-warn` `#f6ad55` on `#0b0e14` ≈ 9:1. Where 4.3:1 fails at `text-xs`, raise the size or weight of that one string — do **not** lighten the palette (§4 is locked) and do not add a colour.
- [ ] **Step 7: Verify — this is the task's whole point.** Perform all five, then write what you observed into the commit body. These are human checks; no test substitutes for them:
  1. **Keyboard only, no mouse:** `/` → skip link (Tab, visible) → `/world` → walk to the terminal → `[E]` → Tab through the dialog (cyclic, focus visible, never escapes) → ESC closes exactly one layer → `[E]` at the intake terminal → Play/RESET/speed reachable by keyboard → submit the Noctis task box and read the refusal.
  2. **Screen reader** (NVDA or VoiceOver): on `/world`, announce the room heading, the inspectable list, the room links; open a panel and confirm it is announced as a dialog and its contents read; confirm the canvas is silent but the page is not.
  3. **Reduced motion:** emulate `prefers-reduced-motion: reduce` in devtools → Rendering panel. Camera snaps, no fade, belt still, conveyor monitor still updates, and every `[E]` still works.
  4. **ESC layering:** panel open → ESC closes the panel only. Panel closed → ESC opens the pause menu. Pause menu open → ESC closes it.
  5. **No WebGL:** launch `/world` with hardware acceleration disabled (or `about:config` equivalent) → `WorldFallback` renders, its three links work, and `/projects/nightfall` still runs the full demo in sample mode.
- [ ] **Step 8: Lighthouse.** Run accessibility on `/`, `/projects/nightfall`, `/about`, `/world?room=nightfall`; every score ≥ 95 with **no** Critical items. Paste the four numbers into Appendix C.5.
- [ ] **Step 9: Commit.** `git add -A && git commit -m "fix: accessibility across standard pages and the facility"`

---

### Task 6.2: Playwright — the tests v1.0 promised but never wrote

**Files:**
- Create: `site/playwright.config.ts`, `site/tests/e2e/smoke.spec.ts`, `site/tests/e2e/world.spec.ts`
- Modify: `site/src/world/WorldCanvas.tsx` (the `data-ready` hook from AD-18)

- [ ] **Step 1: Publish the E2E hook.** In `WorldCanvas.tsx`, on the `<Canvas>`:

```tsx
onCreated={({ gl }) => {
  gl.domElement.dataset.ready = "1";
}}
```

One attribute, set once, after the first frame exists. This is the only thing Playwright is allowed to assert about the 3D scene (AD-13, AD-18).

- [ ] **Step 2: Create `site/playwright.config.ts`:**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // the rate limiter and the shared dev server do not like interleaving
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      // WebGL in headless needs software rendering; without these the /world
      // specs fail with "Error creating WebGL context" and look like app bugs.
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--disable-dev-shm-usage"] },
      },
    },
    {
      name: "mobile-standard-ui",
      // AD-04: coarse pointers get the standard pages. This project must never
      // touch /world except to assert the fallback.
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] **Step 3: Create `site/tests/e2e/smoke.spec.ts`:**

```ts
import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/projects", "/projects/nightfall", "/projects/noctis", "/research", "/about", "/resume", "/contact"];

test.describe("standard pages", () => {
  for (const path of ROUTES) {
    test(`${path} renders its heading`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(page.url()).toContain(path);
    });
  }

  test("unknown project slug 404s", async ({ page }) => {
    await page.goto("/projects/definitely-not-real");
    await expect(page.getByText(/not found|404/i)).toBeVisible();
  });

  test("nightfall page carries the live demo, noctis page carries the console", async ({ page }) => {
    await page.goto("/projects/nightfall");
    await expect(page.getByRole("button", { name: /run inspection/i })).toBeVisible();
    await page.goto("/projects/noctis");
    await expect(page.getByRole("button", { name: /^play$|^replay$/i })).toBeVisible();
    await expect(page.getByText(/replay mode/i)).toBeVisible();
  });

  test("sitemap and robots exist", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).ok()).toBeTruthy();
    expect((await request.get("/robots.txt")).ok()).toBeTruthy();
  });
});
```

- [ ] **Step 4: Create `site/tests/e2e/world.spec.ts`:**

```ts
import { expect, test } from "@playwright/test";

test.describe("the facility", () => {
  test("canvas boots and the HUD names the room", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/world");
    await expect(page.locator("canvas[data-ready='1']")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("CORE MAIN HUB")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("deep links drop you in the right lab", async ({ page }) => {
    for (const [room, label] of [
      ["nightfall", "NIGHTFALL — VISION LAB"],
      ["noctis", "NOCTIS — AGENT LAB"],
      ["research", "RESEARCH LAB"],
      ["about", "WORKSTATION"],
    ] as const) {
      await page.goto(`/world?room=${room}`);
      await expect(page.locator("canvas[data-ready='1']")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(label)).toBeVisible();
    }
  });

  test("keyboard walk reaches a terminal and opens a dialog", async ({ page }) => {
    await page.goto("/world");
    await expect(page.locator("canvas[data-ready='1']")).toBeVisible({ timeout: 20_000 });

    // hub spawns at (9,8); the terminal sits at (9,6) with a 1.6 radius.
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(700);
    await page.keyboard.up("KeyW");
    await expect(page.getByText("[E] ACCESS TERMINAL")).toBeVisible({ timeout: 4_000 });

    await page.keyboard.press("KeyE");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 }).first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  test("the world makes no network request on its own", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (u.pathname.startsWith("/api/")) hits.push(u.pathname);
    });
    await page.goto("/world?room=nightfall");
    await expect(page.locator("canvas[data-ready='1']")).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(2_000); // conveyor + monitor run for two seconds
    expect(hits).toEqual([]);
  });

  test("coarse pointers get the standard UI, never a broken canvas", async ({ page }) => {
    await page.goto("/world");
    await expect(page.getByText(/standard facility is open/i)).toBeVisible();
  });
});

test.describe("/api/inspect contract", () => {
  test("rejects a missing field, a wrong type, and the sixth request", async ({ request }) => {
    const missing = await request.post("/api/inspect", { data: {} });
    expect(missing.status()).toBe(400);

    const form = new FormData();
    form.append("file", new Blob([new Uint8Array([1, 2, 3])], { type: "text/plain" }), "x.txt");
    const wrongType = await request.post("/api/inspect", { data: form });
    expect(wrongType.status()).toBe(415);

    let last = 0;
    for (let i = 0; i < 7; i++) {
      const good = new FormData();
      good.append("file", new Blob([new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70])], { type: "image/jpeg" }), `p${i}.jpg`);
      last = (await request.post("/api/inspect", { data: good })).status();
    }
    expect(last).toBe(429);
  });

  test("GET is not allowed", async ({ request }) => {
    expect((await request.get("/api/inspect")).status()).toBe(405);
  });
});
```

The `mobile-standard-ui` project runs these same files with a coarse pointer, which is why the last two tests are written as a pair — `canvas[data-ready='1']` must appear on desktop and the fallback copy must appear on mobile. If a test is ambiguous about which it means, split it rather than branching on `testInfo.project.name`.

- [ ] **Step 5: Verify.** `npx playwright install chromium` then `npm run e2e` → all green, both projects. Then **break something on purpose**: change the hub terminal's `pos` in `rooms/hub.ts` so the keyboard walk misses it, confirm the walk test fails, revert. A test that cannot fail is not a gate.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "test: e2e gates for pages, facility and the inspect contract"`

---

### Task 6.3: Performance audit against §1

**Files:**
- Modify: `site/src/world/textures.ts` (sign texture cache), anything the measurements prove slow

- [ ] **Step 1: Measure before touching anything.** Record the six numbers in Appendix C.5: First Load JS per route (from `npm run build` output), `/world` lazy chunk gz size, draw calls in the busiest room (Appendix C.4), FPS at 4× CPU throttle while the Noctis trace plays, Lighthouse performance on `/`, and time-to-first-frame on `/world` over Fast 3G.

Add the dev-only probe hook first, exactly as Appendix C.4 spells it (`window.__gl = gl` inside `onCreated`, guarded by `NODE_ENV === "development"`), or every number in Step 1 will be a guess.

- [ ] **Step 2: Sign-texture cache** (the one fix that is already justified — 6 rooms × ~5 signs ≈ 30 separate 512×128 canvas textures, and hub's `VISION LAB`/`AGENT LAB` style strings repeat across rooms):

```ts
const signCache = new Map<string, THREE.CanvasTexture>();

export function makeSignTexture(
  text: string,
  opts: { bg?: string; fg?: string; accent?: string } = {},
): THREE.CanvasTexture {
  const key = `${text}|${opts.bg ?? ""}|${opts.fg ?? ""}|${opts.accent ?? ""}`;
  const hit = signCache.get(key);
  if (hit) return hit;
  // ...existing drawing code unchanged...
  signCache.set(key, tex);
  return tex;
}
```
Because the texture is now shared, **delete every `sign.dispose()`** that a component added in Tasks 4.4/5.x for sign textures (keep disposing `ScreenTexture`s — those are per-instance and still disposed). Note it in the commit body; a shared texture disposed by one unmounting component is the bug this creates, and deleting the dispose calls is the fix.

- [ ] **Step 3: Only if the numbers from Step 1 missed a budget**, apply these in order and stop at the first one that clears it: (a) reduce `dpr` from `[1, 1.5]` to `[1, 1.25]`; (b) drop the per-room `pointLight` to ambient + directional only; (c) merge static `box` props of the same colour into one `InstancedMesh` per room. Do not do (c) speculatively — it is the only one that costs a real refactor, and 120 draw calls is not a tight budget for ~90.
- [ ] **Step 4: Confirm nothing regressed the standard pages.** First Load JS ≤ 150 KB gz and Lighthouse ≥ 90 on `/`; the `/world` chunk stays out of the landing page (check `npm run build` output: `/` must not list the world chunk).
- [ ] **Step 5: Commit.** `git add -A && git commit -m "perf: shared sign textures and measured budgets"`

---

### Task 6.4: Security and abuse review

**Files:** modify nothing unless a check fails; record the results in Appendix C.5.

- [ ] **No secret reaches the client.** `npm run build`, then `findstr /S /M /C:"NIGHTFALL_API_KEY" .next\static\*` → zero hits, and the same for `NIGHTFALL_API_URL`'s value. Only `NEXT_PUBLIC_*` may appear in client chunks.
- [ ] **Uploads are transient.** Confirm by reading the code, not by trusting it: nothing in `src/app/api/**` writes to disk, opens a stream, or stores a filename. The route validates, forwards, and forgets. If a future task adds persistence, that is a new decision, not a detail.
- [ ] **No user-controlled URLs.** The only outbound fetch target is `process.env.NIGHTFALL_API_URL`, set by the operator. A visitor cannot influence it — that is what keeps this proxy from being an SSRF primitive. Re-check after any change to Task 3.5.
- [ ] **Timeouts exist on every wait.** Upstream fetch has `AbortSignal.timeout(15_000)`; the client's own `fetch` has none, so a hung proxy must not hang the demo forever — add `AbortSignal.timeout(20_000)` in `InspectDemo.run()` and let it fall into sample mode.
- [ ] **Rate limit ceiling is understood, not admired.** Read Appendix D.5 and confirm AJ knows the counter is per warm instance, so a determined visitor can exceed 5/min. For a portfolio demo that is the accepted trade; for anything with a cost attached, upgrade it.
- [ ] **Response headers carry no stack traces or upstream bodies.** `502`/`503`/`504` bodies are the fixed strings from Task 3.5; the upstream error text is never echoed.
- [ ] **Dependency audit.** `npm audit --omit=dev` → report what is there. Fix nothing by reflex; write down why each remaining high-severity advisory does not apply (or fix it). A pinned, audited list is the deliverable.
- [ ] **Robots and indexability are not lying to anyone.** `/api/*` is disallowed in `robots.ts`; `/world` is deliberately indexable (it is a real page with a real title) and that choice is recorded in Appendix D.8.
- [ ] Commit nothing unless code changed. If code changed: `git add -A && git commit -m "fix: demo client timeout and api hardening"`.

---

### Task 6.5: The content gate — `npm run check:content`

**Files:**
- Create: `site/scripts/check-content.mjs`
- Modify: `site/package.json` (add the script), root `AGENTS.md` (add it to the commands list)

Task 0.2 says the Phase 6 launch gate fails if any `EDIT-ME` remains. That needs a machine, not a promise.

- [ ] **Step 1: Create `site/scripts/check-content.mjs`:**

```js
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (relative) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const files = ["src/content/site.ts", "src/content/projects.ts", "src/world/noctis/traces.ts"];
const problems = [];

for (const f of files) {
  const text = read(f);
  text.split("\n").forEach((line, i) => {
    if (line.includes("EDIT-ME")) problems.push(`${f}:${i + 1}: ${line.trim().slice(0, 90)}`);
  });
}

// Anything that is still an obviously-unedited placeholder value.
const suspects = [/@example\.com/, /github\.com\/EDIT/, /linkedin\.com\/in\/EDIT/, /e\.g\./];
for (const f of files) {
  const text = read(f);
  for (const pattern of suspects) {
    if (pattern.test(text)) problems.push(`${f}: still contains a placeholder matching ${pattern}`);
  }
}

if (problems.length) {
  console.error("check:content — portfolio content is not launch-ready:\n");
  for (const p of problems) console.error(`  ${p}`);
  console.error(`\n${problems.length} problem(s). Fill them in, or delete the field if it is genuinely not yours.`);
  process.exit(1);
}
console.log("check:content — clean.");
```

- [ ] **Step 2: Add the script** to `site/package.json`: `"check:content": "node scripts/check-content.mjs"`. Add one line to root `AGENTS.md` under Commands: `npm run check:content — fails while placeholder content remains; must pass before a launch`.
- [ ] **Step 3: Verify it fails now** (it must — `site.ts` is full of `EDIT-ME`): `npm run check:content` exits 1 and lists the lines. Then verify it can pass: comment out nothing, just confirm the line numbers it reports match the real `EDIT-ME` markers, and that `e.g.` inside prose is flagged (it is — AJ rewrites the sentence rather than relaxing the script).
- [ ] **Step 4: Commit.** `git add -A && git commit -m "chore: content launch gate"`

---

### Task 6.6: Phase 6 exit gate — this is the launch gate

- [ ] Every box at the top of this phase is ticked **with a number or an observation next to it**, recorded in Appendix C.5. "Seems fine" is not a gate result.
- [ ] `npm run test` + `npm run build` + `npm run e2e` + `npm run check:content` all exit 0. The last one is allowed to fail *only* before AJ has supplied content — and then Phase 7 cannot proceed.
- [ ] The five human checks from Task 6.1 Step 7 were actually performed by a human or a screen reader, and their results are in the commit body of `fix: accessibility…`.
- [ ] Re-read spec §29 (success criteria 1–8). For each one, name the task that makes it true. If any criterion has no owner, Phase 6 is not finished — add the task, do not lower the criterion.

---

# Phase 7 — Ship it

**Goal:** production on a domain AJ owns, with the demo honest about what it is, and a launch that has been walked by a human pretending to be a recruiter with 90 seconds.

**Exit gate:**

- [ ] `https://<domain>` serves the site over TLS with the canonical host, correct OG preview, and `/world` working from the production build
- [ ] `/api/inspect` works in production in **either** live or mock mode, and the mode is visible in the UI either way
- [ ] Security headers shipped; `NIGHTFALL_API_KEY` exists only as a Vercel **Environment Variable (Sensitive)**
- [ ] The 90-second recruiter walkthrough below was performed on the production URL by a human, on a phone, and on a laptop
- [ ] Rollback is a known action, not a rumour

### Task 7.1: Production deploy and headers

**Files:**
- Create: `site/vercel.json`
- Modify: `site/.env.example` (document the production-only keys), root `AGENTS.md` (deploy note)

- [ ] **Step 1 (human):** Import the GitHub repo into Vercel and set **Root Directory = `site`**. If the root directory is wrong, the build fails in a way that looks like a Next bug. Deploy the staging build from Task 0.8's project (or a fresh one) and attach the custom domain; add `NEXT_PUBLIC_SITE_URL=https://<domain>` **before** the first production build, because `sitemap.ts`, `robots.ts` and `opengraph-image.tsx` (Task 0.7) read it at build time.

- [ ] **Step 2: Create `site/vercel.json`:**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(self), microphone=(), geolocation=()" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" }
      ]
    },
    {
      "source": "/samples/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400, stale-while-revalidate=604800" }]
    },
    {
      "source": "/api/inspect",
      "headers": [{ "key": "Cache-Control", "value": "no-store" }]
    }
  ]
}
```

`camera=(self)` is load-bearing: the default `Permissions-Policy` on some hosts blocks `getUserMedia`, which would silently kill spec §11.7 Option B. `microphone=()` stays closed — the demo never needs it. Do not add a `Content-Security-Policy` here: with inline Tailwind/font styles and a WebGL canvas, a CSP that actually helps is a day of work, and a half-hearted one only breaks the site. Recorded as a v2 candidate (Appendix E).

- [ ] **Step 3: Environment variables** in the Vercel dashboard (never commit these): `NEXT_PUBLIC_SITE_URL`, and for Phase 7 Step 7.2 either `NIGHTFALL_MOCK=1` **or** `NIGHTFALL_API_URL` + `NIGHTFALL_API_KEY` (Sensitive, Production scope only). Update `site/.env.example` with a comment naming the two launch modes.

- [ ] **Step 4: Verify production, not staging.**
  - `curl -sI https://<domain>/` → 200, `x-content-type-options`, `permissions-policy`, TLS
  - `curl -s https://<domain>/sitemap.xml` → every URL on the canonical host, no `localhost:3000`
  - Paste the URL into a social preview checker: the OG image renders (it is generated at build time, so if `NEXT_PUBLIC_SITE_URL` was missing when the build ran, rebuild rather than "fixing" the file)
  - `/world` on the production build: boots, 60 fps, room labels correct; `/world?room=research` deep-links; mobile browser shows the fallback, not a black rectangle
  - `npm run check:content` green locally before the tag; the deploy is a commit that passes it
- [ ] **Step 5: Commit.** `git add -A && git commit -m "chore: production headers and deploy notes"`

---

### Task 7.2: Choose the demo's launch mode — live backend or mock

**Files:** none. This is a decision with a verification, not a code change.

Either answer is shippable; the plan is written so that mock mode is a complete, honest experience rather than an error state. Record the choice and the date in Appendix D.6.

- [ ] **Option A — launch in mock mode.** Set `NIGHTFALL_MOCK=1`. Verification: the demo runs, every result is badged `MOCK MODE`, and the badge text says the backend is not connected. Then Nightfall's *page* carries the real benchmarks (no `EDIT-ME`), because the demo is not carrying them.
- [ ] **Option B — launch live.** Stand the backend up per **Appendix A**, set `NIGHTFALL_API_URL` + `NIGHTFALL_API_KEY`, and verify in this order:
  1. `curl` the backend directly → valid anomalib-shaped JSON
  2. `curl` `/api/inspect` on a preview deployment → 200, `"source":"live"`
  3. Upload a photo from a phone over LTE → result in < 5 s, heatmap over the right region
  4. Wrong path in `NIGHTFALL_API_URL` → 503 and the UI falls back to sample mode with a visible reason
  5. Kill the backend mid-request → 504, sample mode, no console stack trace in the UI
  6. Six uploads in ten seconds → 429 with the retry window stated in plain English
- [ ] **In both options:** record the chosen mode and its date in Appendix D.9, and confirm a visitor cannot tell which is true from the marketing copy — only from the badge. Nothing in `src/content/` may claim the demo is live unless Option B is deployed.

---

### Task 7.3: Monitoring, and the things deliberately not installed

**Files:** modify only if a decision in Appendix D says so.

- [ ] `error.tsx` and `not-found.tsx` exist (Task 0.7). Trigger both in production: a route that throws (temporarily throw in a page on a branch, deploy the preview, confirm the boundary renders and the Nav still works), and a bogus URL.
- [ ] **Errors:** per Appendix D.6, either "no third-party monitoring; Vercel function logs + `error.tsx`" (the default, and the one that keeps §1's dependency list true) or an explicit amendment that names the package, its cost, and its privacy posture. No silent choice.
- [ ] **Analytics:** same treatment (Appendix D.7). Absence of analytics is a portfolio *feature* here — say so on `/contact`, where the copy already promises no cookies, so the claim is checkable.
- [ ] **Uptime, cheaply:** schedule nothing. Check the deployment URL and `/api/inspect` manually once a week for the first month, and let Vercel's own deployment failure notifications be the alert. Recorded as a v2 candidate if AJ wants more.
- [ ] **Rollback:** confirm the exact action — Vercel → Deployments → promote the previous production deployment (instant), plus `git revert` for the code. Write the two steps in `AGENTS.md` so a future executor is not guessing at 01:00.

---

### Task 7.4: The 90-second walkthrough (the actual launch gate)

Do this on the production URL, on a laptop **and** a phone, and do not help the visitor if you can find one.

- [ ] Landing: name, what AJ builds, and two projects, in under 30 seconds (spec §29.1). The `Enter the facility` button is obvious without being explained.
- [ ] `/world`: you understand you are walking, without instructions (spec §29.2). One prompt appears within 10 seconds of arrival. Nobody reads a tutorial.
- [ ] You find Nightfall **by walking**, upload or sample-inspect one image, and can say out loud what the model did and how you know (spec §29.3–6).
- [ ] You open Noctis, press PLAY, and can explain in one sentence why boxes moving between desks is a better explanation than a diagram (spec §29.4, §31).
- [ ] From anywhere in the facility: `[ESC]` → Projects → Contact → email works. A recruiter spends ≤ 15 seconds getting from "who is this" to "I can email them" (spec §29.7–8).
- [ ] On the phone: nothing is broken, the standard UI is fast, and the demo still runs.
- [ ] The two reactions the spec asks for (§29) come from a real person: *"I've never seen a portfolio like this"* and then *"the projects are actually serious."* If the second one does not come, the problem is not the world — it is `src/content/`. Fix the content and re-run this task.
- [ ] Tag it: `git tag v1.0.0 && git push origin v1.0.0`.

---

# Appendix A — Nightfall inference backend contract

The site never talks to a model. It talks to `/api/inspect`, which talks to a backend that answers **exactly** this. `NIGHTFALL_API_URL` is the only coupling, so Nightfall stays independently deployable (spec §26, AD-14) and can be moved, versioned, or switched off without touching the portfolio.

## A.1 Request the proxy sends

`POST $NIGHTFALL_API_URL`, forwarded from the browser's own `multipart/form-data`:

| Part | Contents |
|---|---|
| `file` | the image, already resized to ≤ 1024 px on the long edge, JPEG/PNG/WebP, ≤ 2 MB |

Header: `authorization: Bearer $NIGHTFALL_API_KEY` when that variable is set, otherwise no auth header (a private network or an IP allowlist is an acceptable substitute for a hobby-scale demo).

## A.2 Response the proxy accepts

Field names are anomalib's own (`pred_score`, `pred_label`, `anomaly_map`) so the backend is a thin wrapper over an `Engine.predict()` result rather than a translation layer. Anything else is a 502 by `parseBackendResponse` (Task 3.4), **including** an out-of-range score, a non-square map, or a map larger than 64×64:

```json
{
  "pred_label": 1,
  "pred_score": 0.87,
  "latency_ms": 118,
  "anomaly_map": [[0.02, 0.03, "... 32 floats"], "... 32 rows"]
}
```

| Field | Constraint | Why |
|---|---|---|
| `pred_score` | number, 0..1 | the number the visitor reads; a 0..255 raw score would silently break the status line |
| `pred_label` | `0` or `1` | anomalib's image-level decision; the proxy derives `status` from `label` **or** the threshold, so a mismatch shows up as a live verdict, not a crash |
| `latency_ms` | number ≥ 0 | the proxy overwrites it with its own wall-clock measurement, so the visitor's number is always real |
| `anomaly_map` | square `number[][]`, 2..64 per side, every value 0..1 | `gridSize` becomes the map's side; 32×32 is the recommended downsample and keeps the JSON at ~7 KB |

HTTP status matters: anything other than 2xx is treated as `backend_unreachable` (503). The backend should return **422** for a corrupt image and **503** when the model is loading, so the proxy can at least report the right class of failure.

## A.3 Mapping anomalib → this contract

```python
# sketch — Nightfall's repo, not this one; nothing here ships in site/
from anomalib.engine import Engine
from anomalib.models import Patchcore
from PIL import Image
import io, numpy as np, time

engine = Engine()
model = Patchcore.load_from_checkpoint(CKPT)

def to_contract(image_bytes: bytes) -> dict:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    started = time.perf_counter()
    batch = engine.predict(model=model, ...)[0]          # one image in, one prediction out
    latency_ms = int((time.perf_counter() - started) * 1000)
    amap = np.asarray(batch.anomaly_map[0].squeeze(), dtype=np.float32)
    amap = np.clip(amap, 0.0, 1.0)
    if max(amap.shape) > 32:                              # cheap, deterministic downsample
        h = w = 32
        ys = np.linspace(0, amap.shape[0] - 1, h).astype(int)
        xs = np.linspace(0, amap.shape[1] - 1, w).astype(int)
        amap = amap[np.ix_(ys, xs)]
    return {
        "pred_label": int(batch.pred_label[0]),
        "pred_score": float(batch.pred_score[0]),
        "latency_ms": latency_ms,
        "anomaly_map": [[round(float(v), 3) for v in row] for row in amap],
    }
```

Three notes that save a day of debugging: anomalib's raw `anomaly_map` is **not** guaranteed to be 0..1 (it depends on the post-processing config), so clip it — the proxy rejects values outside that range on purpose; `pred_score` may be a `Tensor`, and `float()` on a batch element with a lingering batch dimension raises, so index it; and if `Engine.predict` is awkward for a single image, use the exported ONNX/OpenVINO inferencer instead and keep the same four fields.

## A.4 Local run and proof

```powershell
# in Nightfall's repo
uvicorn serve:app --host 127.0.0.1 --port 8000

# in site/.env.local
NIGHTFALL_API_URL=http://127.0.0.1:8000/inspect
NIGHTFALL_API_KEY=
NIGHTFALL_MOCK=0
```

Proof it is wired: `curl.exe -s -X POST http://localhost:3000/api/inspect -F "file=@public\samples\gear-01.jpg"` returns `"source":"live"` with a `gridSize` of 32. Then check the honest-latency rule: kill uvicorn and re-run → 503 and the browser drops to sample mode with a reason.

## A.5 Where it can live

Anything reachable over HTTPS with the contract above: a home machine behind a tunnel (fine for a demo, not for a résumé link that has to work during an interview), a small VPS, a container on Fly.io / Render / Railway with a GPU only if latency demands one, or a Hugging Face inference endpoint. Nothing in the site cares which. **Do not** put model weights in the Next.js bundle or in `/public`.

## A.6 What the proxy guarantees to the backend

≤ 5 requests/minute/IP (best-effort per instance), ≤ 2 MB bodies, an allowlisted MIME type, a 15 s client-side abort on the upstream call, and no query strings or visitor identifiers. It does **not** guarantee queuing, retries, or fairness — if the backend needs protection from a traffic spike, that is Appendix E, not a detail to fix in passing.

---

# Appendix B — Noctis trace format

AD-05 says the Noctis room replays **real** runs. That only means something if the data has a format, a producer, and a rule for what may be claimed. This is all three.

## B.1 The format (normative)

```ts
interface NoctisTrace {
  id: string;            // kebab-case, unique — the deep-link handle
  task: string;          // the operator's request, verbatim
  outcome: string;       // one line: what actually came out
  provenance: string;    // repo + commit + date. Required. A replay must say so.
  recordedAt: string;    // ISO-parseable date
  durationMs: number;    // real wall-clock length of the run
  events: TraceEvent[];  // ≥ 1, chronologically non-decreasing
}

interface TraceEvent {
  t: number;             // ms since run start; ≤ durationMs
  agent: string;         // must exist in the room roster (rooms/noctis.ts)
  artifact: string;      // TASK, PLAN, RESEARCH, PATCH, TEST RESULT, REPORT…
  next: string | null;   // receiving agent; null = terminal step (last event only)
  ok: boolean;           // false = this step reported failure; it still travels
}
```

Enforced by `validateTrace` (Task 4.2), which the director runs in dev on every trace it mounts. Rules worth knowing even though the validator prints them: one terminal event and it must be last; no self-handoff except the opening `TASK`; unknown agent ids are rejected because they would silently render nothing in a room that has no desk for them.

## B.2 Worked example — how a run becomes 8 events

A real 41-second run, `fix-off-by-one` (Task 4.1). The `t` column is **measured**, not chosen for a nice animation:

| t (ms) | agent | artifact | next | ok | what the room shows |
|---|---|---|---|---|---|
| 0 | planner | TASK | planner | ✓ | planner lamp green, no box (self-handoff = "working on it") |
| 3 200 | planner | PLAN | researcher | ✓ | box slides east along the north rail |
| 6 400 | researcher | RESEARCH | coder | ✓ | researcher working → box travels south down the east rail |
| 15 100 | coder | PATCH | tester | ✓ | box west along the south rail |
| 22 800 | tester | TEST RESULT | coder | ✗ | tester lamp **red**, box returns east — the retry loop, visible |
| 26 500 | coder | PATCH | tester | ✓ | second trip west |
| 34 900 | tester | TEST RESULT | planner | ✓ | box north |
| 40 100 | planner | REPORT | — | ✓ | planner `done`, monitor reads RUN COMPLETE at 41 s |

Nothing in the schema is animation-specific: `HANDOFF_MS` and the L-shaped path live in the renderer (Task 4.3/4.4), so a v2 visualisation could reuse the same traces unchanged.

## B.3 Honesty rules

1. A trace is only a trace if it came from a run that happened. Regenerate, do not embellish; if a run did nothing interesting, run something interesting and record *that*.
2. `provenance` and `recordedAt` must survive into the UI (they do — the console prints `trace.provenance`, the north wall reads `REPLAY OF REAL RUNS`).
3. Never label the room "live", "in real time", or "interactive agent". The refusal copy in `NoctisConsole` (Task 4.6) is the correct sentence: it says what is not happening and why.
4. Failure states stay in. A trace with no `ok: false` is a marketing video; the tester's red lamp at 22.8 s is the most credible thing in the building.

## B.4 Recorder adapter

Lives in **Noctis's repo**, not `site/` — nothing here is a build dependency. LangGraph's `stream(stream_mode="updates")` yields one chunk per executed node, keyed by node name, which is exactly an event: node → `agent`, elapsed wall time → `t`, the state key it wrote → `artifact`.

```python
# recorder.py — in the Noctis repo. Emits JSON for src/world/noctis/traces.ts
import json, time, uuid

ARTIFACT_BY_STATE_KEY = {
    "plan": "PLAN", "context": "RESEARCH", "findings": "RESEARCH",
    "patch": "PATCH", "test_result": "TEST RESULT", "report": "REPORT",
}

def record(graph, task: str, config=None) -> dict:
    events, started, last_artifact = [], time.monotonic(), None
    for chunk in graph.stream({"task": task, "messages": []}, stream_mode="updates", config=config):
        for node, update in (chunk.get("data", chunk) or {}).items():
            key = next((k for k in ARTIFACT_BY_STATE_KEY if isinstance(update, dict) and k in update), None)
            artifact = ARTIFACT_BY_STATE_KEY.get(key, node.upper())
            events.append({
                "t": int((time.monotonic() - started) * 1000),
                "agent": node,
                "artifact": artifact,
                "next": None,           # filled in below: 'next' is the *following* agent
                "ok": not (isinstance(update, dict) and update.get("error")),
            })
            last_artifact = artifact
    for i, e in enumerate(events):
        e["next"] = events[i + 1]["agent"] if i + 1 < len(events) else None
    if events and events[0]["next"] == events[0]["agent"]:
        events[0]["artifact"] = "TASK"   # opening self-handoff, per B.1
    return {
        "id": f"run-{uuid.uuid4().hex[:8]}",
        "task": task,
        "outcome": last_artifact or "no output",
        "provenance": "noctis@REPLACE_WITH_GIT_SHA",
        "recordedAt": time.strftime("%Y-%m-%d"),
        "durationMs": events[-1]["t"] if events else 0,
        "events": events,
    }

if __name__ == "__main__":
    from graph import build_graph          # the real graph
    print(json.dumps(record(build_graph(), input("task> ")), indent=2))
```

Two honest caveats about this adapter: `updates` gives no per-node timing inside a step, so a long-running agent reports its milestone only when it finishes (accurate, just not granular); and `outcome` from the last artifact is a stub — a human writes the one-line summary, because the sentence a recruiter reads should not be generated from a key name. Paste the JSON into `traces.ts` as a `NoctisTrace`, run `npm run test`, and the validator tells you immediately if you pasted something the room cannot play.

If Noctis is **not** LangGraph, keep the format and change the producer: anything that can emit `(timestamp, node_name, state_key)` per step produces a valid trace.

## B.5 The gate before any public execution

AD-05 defers live execution; it does not forbid it. Before it ships, all six must be answered in writing, and the answer is a separate plan, not an addition to this one:

1. **Sandbox** — where does generated code run, and what can it touch if it is wrong? (gVisor/Firecracker class isolation, or no execution at all)
2. **Budget** — per-visitor and global spend ceiling, and what happens when the queue is full
3. **Input** — prompt-injection surface: visitor text enters an agent's context next to tool access
4. **Egress** — can a run reach the network, the filesystem, a git remote, or a credential?
5. **Abuse** — rate limiting that is not per-warm-instance (Appendix D.5), plus a kill switch that does not need a deploy
6. **Retention** — what is stored, for how long, and who can read a stranger's submitted task

---

# Appendix C — Verification recipes

Commands and observation sheets for the checks the plan's Verify steps refer to. Run from `site/` unless stated.

## C.1 The manual facility tour (dev server, every phase that touches the world)

1. `/world` → hub: HUD reads `AJ // RESEARCH FACILITY — CORE MAIN HUB`; WASD moves; walls, terminal and pillars block; wall-slide along the north wall.
2. North door → Nightfall: fade, then warm light and closed fog (Task 5.3). Conveyor flows; monitor updates as products pass the gantry; anomaly products redden **after** the gantry.
3. `[E]` at the sign → demo panel; run a sample; close with the × and with ESC (one layer each time).
4. Back through the south door → hub → east door → Noctis: four desks, role signs, `REPLAY OF REAL RUNS`. `[E]` at the intake → PLAY → lamps, box, log; at 4× it stays smooth.
5. West door → Research, south door → About (`[E]` desk, terminal, resume crate).
6. Every interactable prompt disappears when you walk away, and none shows while a panel or the pause menu is open.
7. Terminal-only pass: repeat 1–6 without the mouse (Task 6.1 Step 7.1).
8. Reduced-motion pass: repeat 1–6 with `prefers-reduced-motion: reduce` emulated.
9. Note anything that took more than one attempt to find. That is a discoverability bug, not a user problem — spec §29.2.

## C.2 `/api/inspect` rejection matrix

Dev server with `NIGHTFALL_MOCK=0` and a bogus `NIGHTFALL_API_URL=http://127.0.0.1:9/` for the 5xx rows. Restart `next dev` between rate-limit cycles so the counters are empty.

| # | Command (PowerShell) | Expected |
|---|---|---|
| 1 | `curl.exe -s -o nul -w "%{http_code}\n" -X POST localhost:3000/api/inspect` | `400` |
| 2 | `curl.exe -s -w "\n%{http_code}\n" -X POST localhost:3000/api/inspect -F "file=@README.md"` | `415` (non-image MIME) |
| 3 | `curl.exe -s -w "\n%{http_code}\n" -X POST localhost:3000/api/inspect -F "file=@big.jpg"` where `big.jpg` is > 2 MB — a request the browser UI cannot generate, which is the point | `413` |
| 4 | loop 6× with a valid small JPEG | `200` × 5, then `429` with `retry-after` |
| 5 | with `NIGHTFALL_API_URL` unreachable | `503` |
| 6 | with the URL pointing at a slow endpoint (`sleep 20`) | `504` after 15 s |
| 7 | `curl.exe -s localhost:3000/api/inspect` | `405` with `allow: POST` |
| 8 | with `NIGHTFALL_MOCK=1` | `200`, `"source":"mock"`, note starts `MOCK RESULT` |

Row 3's caveat is the point: the browser cannot produce that request, so reaching 413 through `curl` proves the guard is the last line of defence and the downscale is the first.

## C.3 Device and browser matrix (Phase 6/7)

| Device / browser | Check |
|---|---|
| Windows laptop, Chrome (the target: integrated graphics) | 60 fps in every room, demos work |
| Same, Firefox | canvas boots, `AbortSignal.timeout` and `createImageBitmap` behave, no console errors |
| Same, Edge | navigation + demo (recruiters use Outlook links) |
| macOS Safari | fonts, canvas, and `getUserMedia` prompt |
| Android Chrome (real device) | standard UI only; `/world` shows the fallback; Lighthouse mobile ≥ 90 on `/` |
| iPhone Safari | same, plus the camera sheet for Option B if enabled |
| Laptop with hardware acceleration **off** | fallback, never a black canvas (Task 6.1 Step 7.5) |
| throttled Slow 3G + 4× CPU | LCP < 2.5 s on `/`; `/world` still boots under 5 s on broadband |

## C.4 Probes

**Renderer stats.** Task 6.3 Step 1 adds one dev-only line to `WorldCanvas.tsx`, next to the `data-ready` hook:

```tsx
onCreated={({ gl }) => {
  gl.domElement.dataset.ready = "1";
  if (process.env.NODE_ENV === "development") window.__gl = gl; // probe hook, Appendix C.4
}}
```

Then, in the browser console on `/world` (dev server, 4× CPU throttle for realism), walk into a room, let it settle for two seconds, and read:

```js
const i = window.__gl.info;
console.log("calls", i.render.calls, "tris", i.render.triangles, "geometries", i.memory.geometries, "textures", i.memory.textures);
```

Budgets: ≤ 120 calls, ≤ 35 textures after the Task 6.3 sign cache. `render.calls` resets each frame, so read it while the loop is running, not after a pause. Add `/* global window */`-style ignore comments only if ESLint complains about the assignment; do not disable the rule file-wide.

**Frame time:** `performance.measure` is overkill — in devtools, Performance panel → record 5 s of the Noctis room playing at 4× → longest frame must be < 33 ms, and there must be no `Recalculate Style` storm (that would mean React state at frame rate; see AD-12).

**Chunk size:** `npm run build` then

```powershell
Get-ChildItem .next\static\chunks -Recurse -Filter *.js |
  Sort-Object Length -Descending | Select-Object -First 12 Name, @{n='KB';e={[math]::Round($_.Length/1KB)}}
```

The `/world` route's chunk set (three + fiber + world code) must total ≤ 1.2 MB **gzipped**; raw size is ~3× that, so compare gzipped (`curl --compressed` or the Network panel's transferred column), not bytes on disk.

**Lighthouse:** `npx lighthouse http://127.0.0.1:3000 --only-categories=performance,accessibility,seo --output=json --output-path=./lh.json` — repeat per route (npx pulls the package without touching `package.json`; §1's "no new dependencies" is about the app, not the tooling you run once, and it is not added to the repo).

## C.5 The record sheet (fill it in; do not delete the blanks)

| Measurement | Budget | Observed | Date / build |
|---|---|---|---|
| First Load JS `/` | ≤ 150 KB gz | | |
| `/world` chunk set | ≤ 1.2 MB gz | | |
| `/world` first frame (broadband) | < 5 s | | |
| Draw calls, busiest room | ≤ 120 | | |
| Textures after sign cache | ≤ 35 | | |
| Longest frame, Noctis 4× @4× CPU | < 33 ms | | |
| Lighthouse perf `/` (desktop) | ≥ 90 | | |
| Lighthouse a11y `/`, `/projects/nightfall`, `/world` | ≥ 95 | | |
| `/api/inspect` p50 latency (mock) | — record it | | |
| `npm run e2e` | all pass | | |
| `npm run check:content` | exit 0 | | |
| Human tour (C.1) + five a11y checks (6.1.7) | performed | | |

## C.6 Recruiter smoke test (before sending a link)

Open the production URL in a fresh profile, logged out. From a Google search result: can you tell within five seconds who this is? Send `/projects/nightfall` to a non-engineer and ask what the site says the person does. Email `mailto:` from your own mail client, not the browser. Check `og:image` in the sharing debugger. Then read the resume PDF once, because it is the last unreviewed artefact in the launch.

---

# Appendix D — Human decision points

§0.10 says: hit an `EDIT-ME`, keep moving, AJ fills it in later. This is the register of what "later" means, plus the decisions an executor must not make alone.

## D.1 How to use the `EDIT-ME` markers

`EDIT-ME` is the **only** placeholder allowed in this repo (Task 0.2). It marks a fact only AJ can supply — never a hole in the design. Structure, field names, colours, file paths and copy patterns are final. `npm run check:content` (Task 6.5) fails the build while any remain, and Phase 6 cannot close until it passes.

## D.2 The catalogue

Refreshed 2026-09-15 (A24, A28) and 2026-09-16 (A31-A33). The plan originally listed these as unknowns;
the ones marked DONE came from AJ or from the repositories themselves.

| Status | Where | Marker | Note |
|---|---|---|---|
the ones marked DONE came from AJ or from the repositories themselves.

| Status | Where | Marker | Note |
|---|---|---|---|
| DONE | `site.ts` `owner.title` | "Machine Learning Engineer" | AJ, 2026-09-15 |
| DONE | `site.ts` `owner.tagline` | the "I'm AJ. I build ML systems..." sentence | AJ, verbatim |
| DONE | `site.ts` `owner.email`, `github`, `linkedin`, `x` | real addresses; X added by A28 | AJ |
| DONE | `site.ts` `owner.location` | **removed by A31** (2026-09-16). The field is gone from the schema, the content, `/about` and the world's About panel | AJ's call |
| DONE | `site.ts` `timeline[*]` | transcribed from AJ's resume, 2026-09-16: UniK Connect, OpenGov Africa, University of Ilorin. Three real rows render on `/about`, `/resume` and the world's About panel. CGPA omitted on AJ's request (A33) | |
| **OPEN** | `site.ts` `research[3]` (3D Vision) | either write it or delete the station. Left as `EDIT-ME` rather than invented, because neither repo supports a claim about it | blocks launch |
| DONE | `projects.ts` Nightfall metrics, links, limitations | transcribed from the repo README (0.938 image AUROC, 0.651 PRO, 99.6->25.0 MB, 293 ms fp32 vs 1304 ms INT8) | |
| **OPEN** | `projects.ts` Nightfall pixel AUROC | the one metric the README does not state; currently shown as `(pixel AUROC: EDIT-ME)` inside the PRO tile | blocks launch |
| DONE | `projects.ts` Noctis everything | from graph.py / schemas.py / litellm config | |
| OPEN | `samples.ts` 5 x `caption` | what each sample actually is | Task 3.7 |
| OPEN | `noctis/traces.ts` `provenance`, `recordedAt` | real run provenance (B.3); needs AJ to run Noctis and record | blocks launch |
| DONE | `rooms/noctis.ts` roster | the eight real graph nodes, A25 | |
| OPEN | `closet` `secrets[]` | hours spent, what was cut, worst bug | easter egg, not launch |
| DONE | `public/samples/*` | AJ's three photos ship as `bottle.png`, `cable.png`, `wood.png` (Task 4's belt). D.3's five-sample upload set is superseded by the animated-demos plan - there is no upload path any more | |
| DONE | `public/resume.pdf` | shipped 2026-09-16 (A32); `/resume.pdf` returns 200 `application/pdf`. Note the PDF still says "Third Year" - AJ is in his final year now, so it wants regenerating | |
## D.3 Sample images (`public/samples/`)

Five files matching the ids in `content/samples.ts`: `gear-01`, `gear-02`, `seal-01`, `seal-02`, `belt-01` — three nominal, two defective, JPEG at 800–1600 px on the long edge, < 1 MB each. Requirements, in order of how often they are forgotten: (1) they must be from **the same distribution the model was trained on**, or the demo's verdicts are theatre; (2) no proprietary or client imagery — a public dataset (MVTec AD's licence permits derivative demonstration use, check the terms as they stand when you read this) or your own photographs; (3) label each file's truth in `samples.ts` and nowhere else on disk, so the UI can compare verdict against label (Task 3.8 Step 3). If the truth is "I have no images yet", ship the upload path only and delete the samples tab — do not ship stock photos of gears.

## D.4 The Noctis roster and the traces

Task 4.5's `noctisStations` and Task 4.1's traces are the two places where this portfolio could become fiction. Spec §12.1: *"Do not invent agents solely for visual effect."* If Noctis has three agents, delete a station and its rail segment. If the fourth "tester" is really a pytest invocation and not an agent, either call it `TEST HARNESS` or drop the desk. A room that under-claims is more impressive than one that over-claims, because the person reading it has seen the difference.

## D.5 Rate limiting is best-effort — accept it or upgrade it

The 5/min counter lives in a module-level `Map` inside one warm function instance (Task 3.4/3.5). On Vercel, a burst of traffic or a cold start gives an attacker a fresh counter, and different regions hold different counts. That is sufficient for a demo whose worst case is someone burning your inference hours, and insufficient for anything with real cost behind it. Upgrade path if the risk changes: Vercel's `@vercel/blob`/Upstash-backed limiter in middleware, or the platform's own WAF rate rules — each of which adds a dependency and therefore needs a §1 amendment. Decision: **accept**, recorded here so it is a choice rather than an oversight.

## D.6 Error monitoring

Default: none. `error.tsx`/`not-found.tsx` (Task 0.7) plus Vercel's function logs cover a portfolio, and §1's "no other runtime dependencies" is why. Choosing Sentry means an amendment naming the package, its price, its data-processing implications, and which events it is allowed to see (a Nightfall upload is somebody's photo — do not attach request bodies).

## D.7 Analytics

Default: none, and `/contact` says so. Vercel's Analytics/Speed Insights are one package and a first-party script each; the honest trade is "AJ learns how the site performs" against "visitors are tracked on a page whose copy promises they are not". If AJ wants the numbers, that is a decision to make in the open (Appendix E lists it), not a line to add quietly.

## D.8 Domain, resume, and what gets indexed

`NEXT_PUBLIC_SITE_URL`, the apex-vs-www choice, and the resume PDF are all AJ-only. One design decision hidden in Task 0.7 that deserves a signature: `/world` **is** indexable, so a search result can land someone inside the 3D facility rather than on the landing page — that is the ambition of this project, and it is also a recruiter's worst-case click. Keeping it indexed is the plan's default; add `robots: { index: false }` to `app/world/page.tsx` if AJ prefers the boring version. Either is fine; silent is not.

## D.9 Nightfall demo launch mode

| Field | Value |
|---|---|
| Chosen mode (Task 7.2: A mock / B live) | |
| Date + who decided | |
| If B: backend URL host, auth present?, model checkpoint version | |
| Measured p50 / p95 inference latency from production logs | |
| Review date to revisit D.5/D.6/D.7 | |

## D.10 When the plan is wrong

It will be. Three rules that keep a wrong plan from becoming a wrong product: (1) if a Verify step cannot pass as written, fix the code or the plan — never the check; (2) any deviation that changes a §2 decision gets a new row in §2a with a reason and a date, because the next reader needs the amendment, not an apology in the commit message; (3) if the spec and this plan disagree, the plan wins (§header) **unless** the disagreement is about accessibility, performance, or not executing visitor code — those three are load-bearing, and winning against them means losing the thing the spec was actually for.

---

# Appendix E — Post-MVP roadmap (v2 candidates)

Recorded so that "deferred" is a list rather than a feeling. Ordered by what a visitor would notice per hour of work.

| Candidate | Effort | Why it is here and not in v1 |
|---|---|---|
| Achievements + a subtle tour progress hint in the HUD | S | Spec §16 says subtle; the facility already rewards discovery through the closet (5.5). Add it only if analytics-style evidence says visitors stop early (which needs D.7 first). |
| More Noctis traces + a `?trace=` deep link | S | Pure content work once Appendix B.4 is wired. The highest-value/lowest-risk growth in the whole project. |
| Live Noctis behind auth | XL | Gate: all six questions in Appendix B.5, in a separate plan. |
| A real anomaly heatmap from the backend's own map instead of a 32×32 grid | S | Appendix A.2 already carries a grid; a PNG overlay would need a second body format and a size budget. |
| Instanced static props (one draw call per colour) | M | Task 6.3 Step 3(c). Only if measured calls pass 120. |
| WebGPU (`three` TSL / `t3d`) | L | The scene is ~90 boxes. WebGPU buys nothing a visitor can see today; revisit if the facility grows a room with real geometry. |
| Virtual joystick for mobile 3D | M | AD-04 sends coarse pointers to the standard UI, which is where the demo already works. A joystick is the second-most-likely thing on this list to make the site feel like a game and the least likely to make the work look serious. |
| Shared multiplayer hub ("who else is in the facility") | XL | Spec §30 explicitly forbids multiplayer. Listed so nobody proposes it twice. |
| A CSP worth having | M | Task 7.1 Step 2. Needs the font/inline-style audit first. |
| Cross-instance rate limiting + spend ceiling | M | Appendix D.5; becomes required the day the demo stops being free to run. |
| More rooms | S each | Spec §2.3 and Phase 5's rule: only when the underlying work justifies a place to stand. |

---

*End of plan v1.1. Phases 0–7 and Appendices A–E are complete and internally consistent; §2a lists every v1.0 decision that changed during this revision and why.*
