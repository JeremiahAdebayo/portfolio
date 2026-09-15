# Animated Demos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two planned *live* project demos with two self-running animated demonstrations - a Noctis room where voxel agents physically walk work packages to each other, and a Nightfall room where a product rides an industrial pulley and a flashcard presents its published metrics - then give both rooms a wall frame carrying a short explanation and a GitHub link.

**Architecture:** Both rooms stay content-driven (AD-01): the choreography is data in `src/content/projects.ts` (an ordered pipeline for Noctis, a set of belt cards for Nightfall), and world code only plays that data back. Nothing in these rooms talks to a backend, accepts an upload, or executes anything. The wall frames, the belt products, and the agent caption bubbles all render through the existing `CanvasTexture` helpers, so there are no new dependencies, no asset loaders beyond `three`'s own `TextureLoader`, and no font workers.

**Tech Stack:** unchanged from the master plan: Next.js 16.3.5, React 19.2.x, TypeScript strict, Tailwind v4, three 0.186.0, @react-three/fiber 9.7.0, zustand 5.0.15, vitest 5. No new packages.

**Spec:** `Portfolio Experience Design Specification.md` (sections 10, 11, 12) plus the master plan `docs/superpowers/plans/2026-09-14-portfolio-revised-plan.md`.

**Supersedes:** this plan *replaces* master-plan Phase 3's demo stack (Tasks 3.4-3.8: `/api/inspect`, rate limiter, mock inference, heatmap, upload downscale, `InspectDemo`, camera capture) and Phase 4's trace machinery (Tasks 4.1-4.4, 4.6: trace format, validator, player, playback store, console panel), plus Appendices A and B and the backend/sample-image decisions. See "Deleted work" at the end. Where this plan and the master plan conflict, **this plan wins**.

## Global constraints

- No dependencies beyond the master plan's pinned list (AGENTS.md, plan section 1).
- Green gate for *every* commit: `npx tsc --noEmit` exit 0, `npm run lint` exit 0, `npm run build` green, `npm run test` all pass (plan A18).
- Content first: any string a visitor reads lives in `src/content/`, never in a world component (AD-01, AGENTS.md).
- No React state at frame rate. Positions, walk phases and caption timers live in refs (AD-12, AD-16).
- Player position never enters React state.
- Walls stay one `InstancedMesh`; never one mesh per tile (AD-08).
- In JSX a `// Label` must be a string expression (`{"// Label"}`), never a bare text node (A19).
- Every file UTF-8. Deliberate ceilings marked with a `ponytail:` comment.
- **Honesty rule (new, from the decision below):** no on-screen element may imply the animation is real inference or a live agent run. Numbers shown are *published* results, labelled with their dataset and source. A failure beat stays in the Noctis loop.

---

## The decision, recorded

On 2026-09-15 AJ cancelled live execution for both projects. Rationale, in his words: he does not want the portfolio expanding too much in scope and complexity. Consequences worth stating out loud, because they are the reason this is a *good* cut and not a compromise:

1. The privacy surface disappears. No visitor uploads an image, so there is no stranger's photo transiting a server (master-plan A1, Appendix A, and the whole 2 MB / 4.5 MB body-limit question, all evaporate).
2. The security and abuse review (Task 6.4) shrinks to "no API exists" - the strongest possible answer.
3. Noctis no longer needs *traces*, which means no recorder, no JSON schema, no provenance field to keep honest, and no way for the room to be mistaken for a live system. The room depicts an architecture; the wall frame and the page carry the real numbers.
4. Neither project has a deployed endpoint, so "live demo" was always going to be a mock wearing a live costume. Deleting it removes the temptation to over-claim.

**Two objections I raised and the ruling on each:**

- *Nightfall's flashcard could read as a verdict on the image on the belt.* It must not. Cards are labelled with the dataset, the run configuration and the phrase "published results"; each product carries **its own category's** numbers so a reader who knows MVTec can check them.
- *A loop where every step succeeds is a sales video.* Ruled out: the Noctis cycle contains a failing verdict and a retry, because `agent/graph.py` really has a critic-to-planner retry edge capped at five iterations.

---

## File map for this plan

```text
site/
[markdown:]+-- src/content/
|   +-- types.ts                        # Task 2: FrameCopy, BeltCard, PipelineStep
|   +-- projects.ts                     # Task 2: frame/github/belt/pipeline data for both rooms
|   +-- validate.ts                     # Task 2: shape + length rules for the new fields
|   `-- validate.test.ts                # Task 2: tests for those rules
`-- src/world/
    +-- rooms.test.ts                   # Task 1 (NEW): every hand-written map is checked
    +-- textures.ts                     # Task 3: makeFrameTexture, makeCaptionTexture, makeCardTexture
    +-- types.ts                        # Task 3: "frame" | "plaque" | "flashcard" PropType
    +-- Props.tsx                       # Task 3: render the new prop kinds
    +-- rooms/nightfall.ts              # Tasks 3-4: frame, plaque, belt, card; github action
    +-- rooms/noctis.ts                  # Tasks 3, 5: frame, plaque, stations, walkable floor
    +-- noctis/agents.ts                # Task 5 (NEW): cast, cast colours, cycle builder
    +-- noctis/AgentFigure.tsx          # Task 5 (NEW): one voxel agent + caption bubble
    +-- noctis/PlayDirector.tsx         # Task 5 (NEW): walks the active agent, hands the box over
    `-- nightfall/BeltDirector.tsx      # Task 4 (NEW): products, pulley, flashcard reveal
```

Files created by a *later* master-plan phase that this plan must not duplicate: `WorldReading.tsx`, `SkipLink.tsx` (6.1), `playwright.config.ts` (6.2), atmosphere data (5.3).

---

## Task 1: Room-data validator, before hand-authored geometry

**Files:**
- Create: `site/src/world/rooms.test.ts`

**Interfaces:**
- Consumes: `rooms` registry, `RoomDef`.
- Produces: a permanent `npm run test` guard over every ASCII map. Task 3 and Task 5 add props, blocked rects and station tiles by hand, so this comes first.

**Why now:** six maps of hand-drawn ASCII with door-symmetry and walkability constraints were previously verified only by walking around hoping. The animation work multiplies that surface.

- [x] **Step 1: Write the failing test** - `site/src/world/rooms.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { rooms } from "./rooms";
import { noctisStations } from "./rooms/noctis";
import { projects } from "@/content/projects";
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
    for (const row of room.map) {
      expect(row.length, `${id}: ragged row "${row}"`).toBe(width);
      for (const ch of row) expect(LEGAL.has(ch), `${id}: illegal tile "${ch}"`).toBe(true);
    }
  });

  it("is sealed: border is wall or door, interior is floor", () => {
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
    expect(walkable(room, room.spawn.x, room.spawn.z), `${id}: spawn inside a wall`).toBe(true);
  });

  it("points every door at a real room, onto a walkable tile", () => {
    for (const [key, door] of Object.entries(room.doors)) {
      const [x, z] = key.split(",").map(Number);
      expect(charAt(room, x, z), `${id}: door key ${key} is not a 'D' tile`).toBe("D");
      const target = rooms[door.targetRoom];
      expect(target, `${id}: door ${key} targets unknown room "${door.targetRoom}"`).toBeDefined();
      expect(walkable(target, door.spawn.x, door.spawn.z), `${id}: door ${key} lands in a wall`).toBe(true);
    }
  });

  it("pairs each door with a return door beside the doorway it came from", () => {
    for (const [key, door] of Object.entries(room.doors)) {
      const [dx, dz] = key.split(",").map(Number);
      const target = rooms[door.targetRoom];
      const backs = Object.values(target.doors).filter((d) => d.targetRoom === id);
      expect(backs.length, `${id}: ${target.id} has no door back`).toBeGreaterThan(0);
      const min = Math.min(...backs.map((d) => Math.hypot(d.spawn.x - dx, d.spawn.z - dz)));
      expect(min, `${id}: return from ${target.id} drops you ${min} tiles away`).toBeLessThanOrEqual(2);
    }
  });

  it("keeps interactables unique, on floor, and in range", () => {
    const seen = new Set<string>();
    for (const item of room.interactables) {
      expect(seen.has(item.id), `${id}: duplicate interactable "${item.id}"`).toBe(false);
      seen.add(item.id);
      expect(walkable(room, item.pos[0], item.pos[1]), `${id}: "${item.id}" not on floor`).toBe(true);
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

describe("animated rooms", () => {
  const noctis = rooms.noctis;
  const pipeline = projects.find((p) => p.slug === "noctis")!.room.pipeline ?? [];

  it("names a real station for every pipeline step", () => {
    const roster = new Set(noctisStations.map((s) => s.id));
    for (const [i, step] of pipeline.entries()) {
      expect(roster.has(step.agent), `pipeline[${i}] names unknown agent "${step.agent}"`).toBe(true);
    }
  });

  it("gives every station a walkable, unblocked, non-overlapping tile", () => {
    const seen = new Set<string>();
    for (const s of noctisStations) {
      const key = `${s.tile[0]},${s.tile[1]}`;
      expect(seen.has(key), `two stations share tile ${key}`).toBe(false);
      seen.add(key);
      expect(walkable(noctis, s.tile[0], s.tile[1]), `station ${s.id} is not on floor`).toBe(true);
    }
  });

  it("leaves room to stand in front of each station", () => {
    for (const s of noctisStations) {
      const approach = [
        [s.tile[0] + 1, s.tile[1]],
        [s.tile[0] - 1, s.tile[1]],
        [s.tile[0], s.tile[1] + 1],
        [s.tile[0], s.tile[1] - 1],
      ].some(([x, z]) => walkable(noctis, x, z));
      expect(approach, `station ${s.id} at ${s.tile} has no standable neighbour`).toBe(true);
    }
  });
});
```

Note: the `animated rooms` block is written **before** Task 5 exists. Land it with `noctisStations` returning `[]` and `pipeline` absent, so the first run passes vacuously, then let Tasks 2 and 5 make it real. That is the one place this plan is deliberately weak: a suite with an empty roster proves nothing until Task 5. Task 5's Step 6 closes it.

- [x] **Step 2: Run it.** `npm run test` - if a room-data bug surfaces, **fix the room, not the test.**
- [x] **Step 3: Prove it bites.** Temporarily set one hub map row to a shorter length, run, expect a failure naming a ragged row, revert.
- [x] **Step 4: Gates.** `npx tsc --noEmit` 0, `npm run lint` 0, `npm run build` green, `npm run test` green.
- [x] **Step 5: Commit.**

```powershell
git add site/src/world/rooms.test.ts
git commit -m "test: guard every hand-written room map"
```

---

## Task 2: Choreography as content

**Files:**
- Modify: `site/src/content/types.ts`, `site/src/content/projects.ts`, `site/src/content/validate.ts`, `site/src/content/validate.test.ts`

**Interfaces:**
- Produces: `FrameCopy`, `BeltCard`, `PipelineStep` types; `Project.room.frame`, `.github`, `.belt?`, `.pipeline?`; `validateContent` rejects an over-long wall body, a non-GitHub GitHub link, and a pipeline step with no caption.
- Consumed by: Task 3 (frames), Task 4 (belt), Task 5 (agents), and the standard pages (unchanged).

**Rule this task enforces:** a room's wall text and its flashcard numbers are content, so `/projects/<slug>` and the world can never disagree, and AJ edits copy in one file.

- [x] **Step 1: Write the failing tests** - append to `site/src/content/validate.test.ts`:

```ts
import { projects } from "./projects";

describe("room display data", () => {
  it("ships a wall frame and a real GitHub link for every project", () => {
    for (const p of projects) {
      expect(p.room.frame.title.trim().length, `${p.slug} frame title`).toBeGreaterThan(0);
      expect(p.room.frame.body.trim().length, `${p.slug} frame body`).toBeGreaterThan(0);
      expect(p.room.github.href).toMatch(/^https:\/\/github\.com\/[^/]+\/[^/]+$/);
    }
  });

  it("keeps wall copy short enough to read from across a room", () => {
    for (const p of projects) {
      expect(
        p.room.frame.body.length,
        `${p.slug} frame body is ${p.room.frame.body.length} chars, max 220`,
      ).toBeLessThanOrEqual(220);
      expect(p.room.frame.title.length).toBeLessThanOrEqual(28);
    }
  });

  it("rejects a frame body that is too long, and a github link that is not github", () => {
    const bad = structuredClone(projects[0]);
    bad.room.frame.body = "x".repeat(221);
    bad.room.github.href = "https://example.com/repo";
    const errors = validateContent({ ...site, projects: [bad] });
    expect(errors.some((e) => e.includes("frame.body"))).toBe(true);
    expect(errors.some((e) => e.includes("github href"))).toBe(true);
  });

  it("gives every belt card a source line and at least one number", () => {
    const nightfall = projects.find((p) => p.slug === "nightfall")!;
    expect(nightfall.room.belt?.length).toBeGreaterThan(0);
    for (const card of nightfall.room.belt ?? []) {
      expect(card.rows.length).toBeGreaterThan(0);
      expect(card.rows.length).toBeLessThanOrEqual(4);
      expect(card.source.trim().length).toBeGreaterThan(0);
      expect(card.category.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps the Noctis cycle honest: it contains a failing verdict", () => {
    const pipeline = projects.find((p) => p.slug === "noctis")!.room.pipeline ?? [];
    expect(pipeline.length).toBeGreaterThanOrEqual(6);
    expect(pipeline.some((s) => s.ok === false)).toBe(true);
    for (const step of pipeline) {
      expect(step.caption.trim().length).toBeGreaterThan(0);
      expect(step.caption.length).toBeLessThanOrEqual(28);
      expect(step.artifact.trim().length).toBeGreaterThan(0);
    }
  });
});
```

- [x] **Step 2: Run it.** `npm run test` - FAIL: `room.frame` does not exist on the type / `validateContent` reports nothing.

- [x] **Step 3: Add the types** to `site/src/content/types.ts`:

```ts
/** The "painting" on a project room's wall: a frame with a brief explanation. */
export interface FrameCopy {
  /** <= 28 chars. It is a headline, not a sentence. */
  title: string;
  /** <= 220 chars, hard limit. Longer text is unreadable from across a voxel room. */
  body: string;
}

/**
 * One product on Nightfall's pulley, and the flashcard it produces.
 * The numbers are PUBLISHED results for that MVTec category, not a verdict on
 * the pixel data of the photo - there is no inference in this build.
 */
export interface BeltCard {
  id: string;
  /** MVTec AD category, lowercase, as the README names it. */
  category: string;
  /** what the card is titled, e.g. "BOTTLE" */
  label: string;
  /** /public path, or null until AJ supplies the photo */
  image: string | null;
  /** 1-4 rows of label/value, verbatim from the repository */
  rows: Metric[];
  /** provenance. Rendered. A number without a source is a claim. */
  source: string;
}

/** One beat of Noctis's animated cycle. */
export interface PipelineStep {
  /** station id, validated against the room roster by world/rooms.test.ts */
  agent: string;
  /** <= 28 chars, floats over the agent's head while it works */
  caption: string;
  /** what it carries to the next station, e.g. "PATCH" */
  artifact: string;
  /** false = this step's verdict failed; the retry hop is the honest part */
  ok: boolean;
}
```

and extend the `room` field of `Project`:

```ts
  room: {
    title: string;
    subtitle: string;
    accent: string;
    /** wall frame copy, required: every project room explains itself */
    frame: FrameCopy;
    /** the repository link rendered in-room, required */
    github: Link;
    /** Nightfall's belt. Absent = no belt. */
    belt?: BeltCard[];
    /** Noctis's cycle. Absent = no agents. */
    pipeline?: PipelineStep[];
  };
```

- [x] **Step 4: Validation rules** - inside `validateProject` in `site/src/content/validate.ts`, after the existing checks:

```ts
  const frame = p.room?.frame;
  if (!frame?.title?.trim()) errors.push(`${at}.room.frame.title: required`);
  if (!frame?.body?.trim()) errors.push(`${at}.room.frame.body: required`);
  if (frame?.body && frame.body.length > 220) {
    errors.push(`${at}.room.frame.body: ${frame.body.length} chars, max 220 (wall copy must read from across a room)`);
  }
  if (frame?.title && frame.title.length > 28) {
    errors.push(`${at}.room.frame.title: ${frame.title.length} chars, max 28`);
  }
  if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(p.room?.github?.href ?? "")) {
    errors.push(`${at}.room.github href: must be an https://github.com/<owner>/<repo> URL`);
  }
  p.room?.belt?.forEach((c, i) => {
    const atc = `${at}.room.belt[${i}]`;
    if (!c.category?.trim()) errors.push(`${atc}.category: required`);
    if (!c.source?.trim()) errors.push(`${atc}.source: required - a number with no source is a claim`);
    if (c.rows.length < 1 || c.rows.length > 4) errors.push(`${atc}.rows: 1-4 required`);
  });
  p.room?.pipeline?.forEach((s, i) => {
    const ats = `${at}.room.pipeline[${i}]`;
    if (!s.agent?.trim()) errors.push(`${ats}.agent: required`);
    if (!s.caption?.trim()) errors.push(`${ats}.caption: required`);
    if (s.caption && s.caption.length > 28) errors.push(`${ats}.caption: ${s.caption.length} chars, max 28`);
    if (!s.artifact?.trim()) errors.push(`${ats}.artifact: required`);
    if (typeof s.ok !== "boolean") errors.push(`${ats}.ok: required boolean`);
  });
```

- [x] **Step 5: Fill in the real data** in `site/src/content/projects.ts`. Both `frame` bodies below are transcribed from the repositories (Nightfall README's quantization findings; Noctis `agent/graph.py`'s node list and retry edge), and every belt number is a published result, not a paraphrase.

Nightfall `room` becomes:

```ts
    room: {
      title: "VISION LAB",
      subtitle: "Visual Anomaly Detection",
      accent: "#f6ad55",
      frame: {
        title: "THE IDEA",
        body:
          "Anomaly detection rebuilt from scratch: learn what a normal part looks like, then flag any deviation. No labelled defects, no per-failure training. 15 MVTec AD categories, ONNX export, INT8 quantization, gRPC serving and an ESP32 client.",
      },
      github: {
        label: "GitHub",
        href: "https://github.com/JeremiahAdebayo/Nightfall",
      },
      belt: [
        {
          id: "bottle",
          category: "bottle",
          label: "BOTTLE",
          image: null, // set to "/samples/bottle.jpg" when AJ supplies the photo
          rows: [
            { label: "Image AUROC", value: "0.997" },
            { label: "PRO", value: "0.701" },
          ],
          source: "Published results - Nightfall README, MVTec AD, WideResNet50 fp32",
        },
        {
          id: "cable",
          category: "cable",
          label: "CABLE",
          image: null,
          rows: [
            { label: "Image AUROC", value: "0.927" },
            { label: "PRO", value: "0.497" },
            { label: "Reads as", value: "flags it, localises it badly" },
          ],
          source: "Published results - Nightfall README, MVTec AD, WideResNet50 fp32",
        },
        {
          id: "grid",
          category: "grid",
          label: "GRID",
          image: null,
          rows: [
            { label: "Image AUROC", value: "0.799" },
            { label: "PRO", value: "0.558" },
            { label: "Note", value: "hard category in the literature" },
          ],
          source: "Published results - Nightfall README, MVTec AD, WideResNet50 fp32",
        },
      ],
    },
```

Noctis `room` becomes (the 13-step cycle contains one failing verdict and the retry hop back to the planner, which is what the real graph does):

```ts
    room: {
      title: "AGENT LAB",
      subtitle: "Autonomous Multi-Agent Software Engineering",
      accent: "#48bb78",
      frame: {
        title: "THE LOOP",
        body:
          "A written bug report goes in, a verified patch comes out. Eight agents share one LangGraph state: index the repo, plan per file, write the failing test, patch one AST node at a time, run pytest, judge - and loop back if it fails, up to five times.",
      },
      github: {
        label: "GitHub",
        href: "https://github.com/JeremiahAdebayo/Noctis",
      },
      pipeline: [
        { agent: "reset", caption: "restoring workspace", artifact: "SNAPSHOT", ok: true },
        { agent: "indexer", caption: "mapping the repo", artifact: "CODE MAP", ok: true },
        { agent: "planner", caption: "planning the fix", artifact: "WORK PACKAGES", ok: true },
        { agent: "test_generator", caption: "writing failing test", artifact: "PYTEST FILE", ok: true },
        { agent: "engineer", caption: "patching one node", artifact: "PATCH", ok: true },
        { agent: "reassembler", caption: "applying the patch", artifact: "PATCHED SOURCE", ok: true },
        { agent: "executor", caption: "running the suite", artifact: "TEST RESULT", ok: true },
        { agent: "critic", caption: "test failed - looping", artifact: "FEEDBACK", ok: false },
        { agent: "planner", caption: "re-planning file", artifact: "WORK PACKAGES", ok: true },
        { agent: "engineer", caption: "patching one node", artifact: "PATCH", ok: true },
        { agent: "reassembler", caption: "applying the patch", artifact: "PATCHED SOURCE", ok: true },
        { agent: "executor", caption: "running the suite", artifact: "TEST RESULT", ok: true },
        { agent: "critic", caption: "suite green", artifact: "VERIFIED", ok: true },
      ],
    },
```

- [x] **Step 6: Verify.** `npm run test` - all pass, including the two original content tests. `npx tsc --noEmit` 0 (every `Project` literal now needs `frame`/`github`, and the compiler will tell you if one is missing). `npm run lint` 0. `npm run build` green - and check `/projects/nightfall` still renders: `ProjectSections` does not read the new fields, so the pages are unchanged.
- [x] **Step 7: Commit.**

```powershell
git add site/src/content
git commit -m "feat: wall copy, belt cards and the noctis cycle as content"
```

---

## Task 3: Wall frames and the GitHub plaque, in both rooms

**Files:**
- Modify: `site/src/world/types.ts`, `site/src/world/textures.ts`, `site/src/world/Props.tsx`, `site/src/world/rooms/nightfall.ts`, `site/src/world/rooms/noctis.ts`

**Interfaces:**
- Consumes: `project.room.frame`, `project.room.github`.
- Produces: `PropType` gains `"frame" | "plaque"`; `makeFrameTexture(title, body, accent)`, `makePlaqueTexture(text)`; a `link`-action interactable per room.

**Design constraint:** the frame is *passive*. A visitor who never presses `[E]` still reads the explanation, which is spec section 10 ("communicate the project through its environment") and the reason this task is worth doing at all. The plaque beneath it is the `[E]` target, because the world's only outbound links must be deliberate interactions.

- [ ] **Step 1: Prop kinds.** In `types.ts` extend `PropType`:

```ts
export type PropType =
  | "box"
  | "sign"
  | "screen"
  | "terminal"
  | "crate"
  | "conveyor"
  | "cameraGantry"
  | "frame"
  | "plaque";
```

- [ ] **Step 2: Two textures** appended to `site/src/world/textures.ts`. `frame` wraps text to the canvas so long bodies cannot overflow, and `plaque` is a single line with a link-arrow glyph:

```ts
/** Wall "painting": a bordered frame with wrapped body text. No drei (AD-11). */
export function makeFrameTexture(
  title: string,
  body: string,
  opts: { accent?: string; bg?: string; fg?: string } = {},
): THREE.CanvasTexture {
  const { accent = "#4fd1c5", bg = "#131826", fg = "#e6eaf2" } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 640);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 1010, 626);
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 4;
  ctx.strokeRect(34, 34, 956, 572);
  ctx.globalAlpha = 1;
  ctx.fillStyle = accent;
  ctx.font = "bold 52px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(title.slice(0, 28), 64, 74);
  ctx.fillStyle = fg;
  ctx.font = "38px ui-monospace, monospace";
  // Greedy word wrap. 38px monospace is ~23px per glyph, so ~38 chars fit inside
  // the 64px margins. Body is capped at 220 chars by validateProject, so this is
  // at most 6 lines and always fits the 640px canvas.
  const words = body.split(/\s+/);
  let line = "";
  let y = 170;
  for (const w of words) {
    if ((line + " " + w).trim().length > 38) {
      ctx.fillText(line.trim(), 64, y);
      line = w;
      y += 52;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) ctx.fillText(line, 64, y);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Small caption plate under a frame: the thing you press E on. */
export function makePlaqueTexture(
  text: string,
  opts: { accent?: string; bg?: string } = {},
): THREE.CanvasTexture {
  const { accent = "#4fd1c5", bg = "#0b0e14" } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 92);
  ctx.fillStyle = accent;
  ctx.font = "bold 34px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${text.slice(0, 18)} /`, 256, 50);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
```

The `/` suffix is the arrow: `ASCII` on a canvas with no font-loading is safer than a Unicode arrow, and `[E] OPEN GITHUB /` reads fine. `makePlaqueTexture` is used for the frame's own title too, so keep the signature.

- [ ] **Step 3: Render them.** In `Props.tsx`, extend the material choice so `frame`/`plaque` get their canvas textures, and dispose is handled by the existing sign path. Replace the body of `Prop`:

```tsx
function Prop({ def, accent }: { def: PropDef; accent: string }) {
  const texture = useMemo(() => {
    if (def.type === "sign" && def.text) {
      return makeSignTexture(def.text, { accent });
    }
    if (def.type === "frame" && def.text && def.body) {
      return makeFrameTexture(def.text, def.body, { accent });
    }
    if (def.type === "plaque" && def.text) {
      return makePlaqueTexture(def.text, { accent });
    }
    return null;
  }, [def.type, def.text, def.body, accent]);

  useEffect(() => () => texture?.dispose(), [texture]);

  return (
    <mesh position={def.pos} rotation={[0, FACING_ROT[def.face ?? "s"], 0]}>
      <boxGeometry args={def.size} />
      {texture ? (
        <meshBasicMaterial map={texture} />
      ) : (
        <meshLambertMaterial color={def.color ?? "#3b465c"} />
      )}
    </mesh>
  );
}
```

`useEffect` must be added to the react import line, and `makeFrameTexture` / `makePlaqueTexture` to the textures import. Then add to `PropDef` in `types.ts`, next to `text`:

```ts
  /** wrapped body text, only read by the "frame" prop */
  body?: string;
```

- [ ] **Step 4: Place them.** Both rooms get the same composition: a `frame` prop on a side wall at eye height (`y = 1.9`, size `[3.6, 2.25, 0.14]` - the 1024x640 canvas aspect is 1.6, and 3.6/2.25 is 1.6, so text is never stretched), a `plaque` directly under it (`y = 0.72`, size `[1.7, 0.32, 0.1]`), and one interactable on the plaque.

`rooms/nightfall.ts`: read `frame`/`github` from content rather than repeating strings, and mount on the **west** wall so the east wall keeps the doorway clear:

```ts
import { projects } from "@/content/projects";

const project = projects.find((p) => p.slug === "nightfall")!;
```

push into `props`:

```ts
    {
      type: "frame",
      pos: [0.55, 1.9, 3],
      size: [0.14, 2.25, 3.6],
      text: project.room.frame.title,
      body: project.room.frame.body,
      face: "e",
    },
    {
      type: "plaque",
      pos: [0.58, 0.72, 3],
      size: [0.1, 0.32, 1.7],
      text: "OPEN GITHUB",
      face: "e",
    },
```

and into `interactables`:

```ts
    {
      id: "nf-github",
      pos: [2, 3],
      radius: 1.6,
      prompt: "OPEN NIGHTFALL REPO",
      action: { type: "link", href: project.room.github.href },
    },
```

`rooms/noctis.ts`: same three entries on its **east** wall (`pos: [18.45, 1.9, 3]` / `[18.42, 0.72, 3]`, `face: "w"`, plaque text `"OPEN GITHUB"`) with interactable `nx-github` at `[16, 3]`, radius 1.6, prompt `OPEN NOCTIS REPO`, and `project` resolved from slug `noctis`. Note the plaque's x must sit *inside* the wall plane (`18.42` against a wall tile at x=18 whose inner face is 18.44), so it does not z-fight.

- [ ] **Step 5: Verify.** Dev server, both rooms: the frame is readable from the doorway without moving (if it is not, the size is wrong - do not shrink the font, grow the frame); standing at the plaque shows `[E] OPEN NIGHTFALL REPO`; pressing `[E]` opens the repo in a new tab (`runAction` already does `window.open(href, "_blank", "noopener")` - confirm no `rel` regression); the belt/plaza still works; no prompt while paused. `npm run test` (Task 1's validator must pass with the new props), `npx tsc --noEmit` 0, `npm run lint` 0, `npm run build` green.
- [ ] **Step 6: Commit.**

```powershell
git add site/src/world
git commit -m "feat: wall frames and github plaques in both project rooms"
```

---

## Task 4: Nightfall - the pulley and the flashcard

**Files:**
- Create: `site/src/world/nightfall/BeltDirector.tsx`
- Modify: `site/src/world/rooms/nightfall.ts`, `site/src/world/Scene.tsx`, `site/src/world/types.ts`

**Interfaces:**
- Consumes: `project.room.belt` (Task 2), `rooms.noctis`-style `RoomDef.palette`, `ScreenTexture`, three's `TextureLoader`.
- Produces: `BeltDirector({ room })` mounted when `room.id === "nightfall"`; `makeCardTexture(card)` in `textures.ts`.

**The sequence, one cycle (about 18s, then it repeats):**
1. Card N is presented *flat to the camera* at a display easel beside the line for ~3.2 s - this is the "display each picture briefly" beat. If `image` is null it renders a labelled swatch in the room's accent, so a missing photo is visible and never faked.
2. The product drops onto the pulley at x=3 and travels `+x` to the gantry at x=9, then to x=15.
3. At the gantry the inspection head's lamp blinks amber; the monitor's line changes to `INSPECTING`.
4. At x=15 a **flashcard pops out of the chute**, scales up from 0.2 to 1, faces the camera, and holds with the published numbers for ~4 s.
5. Card fades, product despawns, next card, loop.

**Why a flashcard rather than a HUD:** the metrics must belong to the machine that produced them. A card coming *out of the end of the line* is the claim; a card overlaid on screen is decoration.

- [ ] **Step 1: Card texture** appended to `site/src/world/textures.ts`:

```ts
import type { BeltCard } from "@/content/types";

/** The printed flashcard: numbers only, plus the line that says where they came from. */
export function makeCardTexture(card: BeltCard, accent = "#f6ad55"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(0, 0, 512, 384);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 376);
  ctx.fillStyle = accent;
  ctx.font = "bold 44px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(card.label.slice(0, 16), 28, 28);
  card.rows.slice(0, 4).forEach((row, i) => {
    const y = 108 + i * 56;
    ctx.fillStyle = "#8b94a7";
    ctx.font = "26px ui-monospace, monospace";
    ctx.fillText(row.label.slice(0, 14).toUpperCase(), 28, y);
    ctx.fillStyle = "#e6eaf2";
    ctx.font = "bold 30px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText(row.value.slice(0, 26), 484, y - 2);
    ctx.textAlign = "left";
  });
  // The honesty line. Small, but present on every card.
  ctx.fillStyle = "#8b94a7";
  ctx.font = "17px ui-monospace, monospace";
  ctx.fillText("PUBLISHED RESULTS", 28, 340);
  ctx.fillText(card.source.slice(0, 58), 28, 362);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
```

- [ ] **Step 2: Photo loading without a dependency.** In `BeltDirector`, one texture per card, created lazily and cached in a `useRef(new Map())`:

```ts
const TEXTURE_EDGE = 256;

/**
 * AJ's photos arrive at any size. We downsample once, on load, into a 256px
 * CanvasTexture: fixed texture memory regardless of what he supplies, and no
 * build-time image toolchain (plan section 1 pins the dependency list).
 */
function usePhoto(src: string | null): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!src) return;
    let alive = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      src,
      (loaded) => {
        if (!alive) { loaded.dispose(); return; }
        const img = loaded.image as HTMLImageElement;
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, TEXTURE_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        loaded.dispose();
        const down = new THREE.CanvasTexture(canvas);
        down.colorSpace = THREE.SRGBColorSpace;
        setTex(down);
      },
      undefined,
      () => {}, // a missing photo must fall back to the swatch, never crash the room
    );
    return () => { alive = false; };
  }, [src]);
  return tex;
}
```

`ponytail:` one hook call per card means the hooks must live in a child component (`<ProductFace card={...} />`), not in a loop inside `BeltDirector`. That is the correct shape anyway: each product owns its own texture and disposes it on unmount.

- [ ] **Step 3: The director.** `site/src/world/nightfall/BeltDirector.tsx` - a single `useFrame` driving a phase machine held in refs. No React state per frame (AD-12):

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { projects } from "@/content/projects";
import type { BeltCard } from "@/content/types";
import { ScreenTexture, makeCardTexture } from "../textures";
import type { RoomDef } from "../types";

const PRESENT_S = 3.2;   // picture faces the camera
const TRAVEL_S = 4.6;    // pulley run
const REVEAL_S = 4.4;    // flashcard holds
const START_X = 3;
const GANTRY_X = 9;
const END_X = 15;
const BELT_Z = 4;
const BELT_Y = 0.62;

const cards = projects.find((p) => p.slug === "nightfall")!.room.belt ?? [];

type Phase = "present" | "travel" | "reveal";

export function BeltDirector({ room }: { room: RoomDef }) {
  const [index, setIndex] = useState(0);
  const phase = useRef<Phase>("present");
  const clock = useRef(0);
  const product = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Group>(null);
  const monitor = useMemo(() => new ScreenTexture(), []);

  useEffect(() => () => monitor.dispose(), [monitor]);

  const card: BeltCard | undefined = cards[index];

  useEffect(() => {
    if (!card) return;
    monitor.update(
      [
        "NIGHTFALL VISION SYSTEM",
        `CATEGORY: ${card.category.toUpperCase()}`,
        "SOURCE: MVTec AD (PUBLISHED)",
        "STATUS: DISPLAYING",
      ],
      room.palette.accent,
    );
  }, [card, monitor, room.palette.accent]);

  useFrame((_, dtRaw) => {
    if (cards.length === 0 || !card) return;
    const dt = Math.min(dtRaw, 0.05);
    clock.current += dt;

    const p = product.current;
    const f = flash.current;
    const t = clock.current;

    if (phase.current === "present") {
      if (p) p.visible = false;
      if (f) f.visible = false;
      if (t >= PRESENT_S) { phase.current = "travel"; clock.current = 0; if (p) p.visible = true; }
      return;
    }

    if (phase.current === "travel") {
      const k = Math.min(1, t / TRAVEL_S);
      if (p) p.position.set(START_X + (END_X - START_X) * k, BELT_Y, BELT_Z);
      if (p && f) f.visible = false;
      const atGantry = START_X + (END_X - START_X) * k >= GANTRY_X;
      monitor.update(
        [
          "NIGHTFALL VISION SYSTEM",
          `CATEGORY: ${card.category.toUpperCase()}`,
          atGantry ? "STATUS: SCANNED" : "STATUS: ON BELT",
          "SOURCE: PUBLISHED RESULTS",
        ],
        room.palette.accent,
      );
      if (k >= 1) { phase.current = "reveal"; clock.current = 0; if (p) p.visible = false; }
      return;
    }

    // reveal: the card grows out of the chute and holds
    if (f) {
      f.visible = true;
      const k = Math.min(1, t / 0.6);
      f.scale.setScalar(0.2 + 0.8 * k);
    }
    if (t >= REVEAL_S) {
      clock.current = 0;
      phase.current = "present";
      setIndex((i) => (i + 1) % cards.length); // discrete, once per cycle: allowed
    }
  });

  return (
    <group>
      <ProductEasel card={card} accent={room.palette.accent} />
      <group ref={product} visible={false}>
        <mesh>
          <boxGeometry args={[0.7, 0.5, 0.7]} />
          <meshLambertMaterial color={room.palette.trim} />
        </mesh>
        <ProductFace card={card} />
      </group>
      <group ref={flash} visible={false} position={[END_X + 1.4, 1.5, BELT_Z]}>
        <FlashCard card={card} accent={room.palette.accent} />
      </group>
    </group>
  );
}
```

Supporting components in the same file (each owns and disposes exactly one texture, which is why they are components):

```tsx
function useCardPhoto(src: string | null): THREE.Texture | null { /* Step 2 */ }

function ProductFace({ card }: { card: BeltCard }) {
  const photo = useCardPhoto(card.image);
  if (photo) {
    return (
      <mesh position={[0, 0.02, 0.36]}>
        <planeGeometry args={[0.62, 0.46]} />
        <meshBasicMaterial map={photo} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, 0.02, 0.36]}>
      <planeGeometry args={[0.62, 0.46]} />
      <meshBasicMaterial color="#8b94a7" />
    </mesh>
  );
}

function FlashCard({ card, accent }: { card?: BeltCard; accent: string }) {
  const tex = useMemo(() => (card ? makeCardTexture(card, accent) : null), [card, accent]);
  useEffect(() => () => tex?.dispose(), [tex]);
  if (!tex) return null;
  return (
    <mesh>
      <planeGeometry args={[2.6, 1.95]} />
      <meshBasicMaterial map={tex} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** The "display each picture briefly" beat, parked beside the line. */
function ProductEasel({ card, accent }: { card?: BeltCard; accent: string }) {
  const tex = useMemo(() => (card ? makeCardTexture(card, accent) : null), [card, accent]);
  useEffect(() => () => tex?.dispose(), [tex]);
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = phaseOf(card) === "present";
  });
  ...
}
```

`phaseOf` above is a placeholder for the real rule and must not ship: the easel shows the *card being presented*, so it needs the same phase ref as the director. Pass `phase` down as a prop (`MutableRefObject<Phase>`) and let the easel read it in its own `useFrame`. Simpler and one fewer texture: give `ProductEasel` the photo and a label plaque, and reuse `FlashCard`'s texture for the reveal by keeping **one** card mesh that the director moves between two poses (easel pose = upright at `[START_X - 1.6, 1.5, BELT_Z + 1.6]`, reveal pose = at the chute). Decide in Step 3; do not build two card systems.

- [ ] **Step 4: The physical line.** Add to `rooms/nightfall.ts` props, replacing the two shell crates: rails as two long `box` props at `[9, 0.34, 3.4]` and `[9, 0.34, 4.6]` size `[13, 0.14, 0.12]`; a belt deck `box [9, 0.28, 4]` size `[13, 0.1, 1.2]` color `#3a332c`; a gantry post `box [9, 1.2, 3.3]` size `[0.2, 2.4, 0.2]` and head `box [9, 2.2, 4]` size `[0.5, 0.4, 0.5]` with a `screen` lens at `[9, 2.2, 4.28]` size `[0.2, 0.2, 0.06]` accent-coloured; a chute `box [16.2, 0.9, 4]` size `[0.9, 1.8, 1.4]` colour `#4a4038`. Blocked: `{ x: 3, z: 4, w: 14, d: 1 }` and `{ x: 9, z: 3, w: 1, d: 1 }` and `{ x: 16, z: 4, w: 1, d: 1 }`.
- [ ] **Step 5: Mount it.** `Scene.tsx`: `{room.id === "nightfall" && <BeltDirector room={room} />}`.
- [ ] **Step 6: Verify (dev server, and this is the part tests cannot prove).** Watch a full cycle: picture presented, product appears on the belt at x=3, travels, monitor flips to `SCANNED` as it passes under the head, card pops at the chute with the right numbers, holds, and the next picture follows. Confirm: the belt never overlaps a wall or the doorway; walking into the belt is blocked at every tile in the blocked rect; the card is legible from the spawn point (if not, grow `planeGeometry`, do not shrink the font); with `image: null` all three products show grey swatches and the room still reads as a line, so the animation is shippable before the photos arrive; leaving the room and coming back restarts the cycle cleanly with no console errors and no growing texture count.
- [ ] **Step 7: Gates.** `npx tsc --noEmit` 0, `npm run lint` 0, `npm run test` green, `npm run build` green. Then a `verify-*.mjs` probe: navigate `/world?room=nightfall`, wait 20 s, assert zero console errors and that the canvas is still attached, and sample `gl.info.memory.textures` twice to prove no texture leak.
- [ ] **Step 8: Commit.**

```powershell
git add site/src/world
git commit -m "feat: nightfall pulley with published-result flashcards"
```

---

## Task 5: Noctis - agents that walk the work over

**Files:**
- Create: `site/src/world/noctis/agents.ts`, `site/src/world/noctis/AgentFigure.tsx`, `site/src/world/noctis/PlayDirector.tsx`
- Modify: `site/src/world/rooms/noctis.ts`, `site/src/world/Scene.tsx`, `site/src/world/textures.ts`

**Interfaces:**
- Consumes: `project.room.pipeline` (Task 2), `RoomDef.palette`, `makeCaptionTexture` (new), `makeSignTexture`.
- Produces: `noctisStations: StationDef[]` + `noctisStationMap`, `StationDef { id, role, tile, color, pack }`, `AgentFigure`, `PlayDirector`.

**The choreography AJ described, made concrete:** every agent stands at its own desk. The agent that currently holds the package *walks to the next agent's desk, hands the box over, then walks home*. The receiver's caption appears above its head while it works. Then it is the walker. The cycle contains the failing verdict and the retry hop, and at the end of the cycle the `reset` agent takes the floor first, which is both real and a natural "and again" beat.

**Why walk-and-return rather than drift-forward:** positions stay invariant, so the loop is exactly repeatable and the state machine is a two-phase lerp instead of a bookkeeping system. `ponytail:` if the walk-back ever reads as busywork, the upgrade is to let the walker stay put and have each agent's home tile be the next step's desk.

- [ ] **Step 1: Cast** - `site/src/world/noctis/agents.ts`. Colours are the design system's, chosen so no two adjacent stations share a hue and every body still reads against `#1f2b26`:

```ts
import { projects } from "@/content/projects";
import type { PipelineStep } from "@/content/types";

export interface StationDef {
  id: string;
  /** sign above the desk */
  role: string;
  /** desk tile [x, z] */
  tile: [number, number];
  /** body colour */
  color: string;
  /** pack/visor accent */
  pack: string;
  /** one-line description for the panel copy */
  about: string;
}

/** The eight real nodes of agent/graph.py, minus the plumbing. */
export const noctisStations: StationDef[] = [
  { id: "reset",        role: "REPO RESET",  tile: [3, 3],  color: "#8b94a7", pack: "#cbd5e1", about: "Restores the workspace before anything is touched." },
  { id: "indexer",      role: "LOCALIZER",   tile: [6, 3],  color: "#7f9cf5", pack: "#4fd1c5", about: "AST code map plus lexical and vector indexes, fused into one ranking." },
  { id: "planner",      role: "PLANNER",     tile: [9, 3],  color: "#f6ad55", pack: "#4fd1c5", about: "Emits typed per-file work packages: file, plan, exact target functions." },
  { id: "test_generator", role: "TEST GEN",  tile: [12, 3], color: "#e5534b", pack: "#f6ad55", about: "Writes the pytest file that should have caught the bug." },
  { id: "engineer",     role: "ENGINEER",    tile: [15, 3], color: "#48bb78", pack: "#e6eaf2", about: "One instance per work package, in parallel. Returns node-level edits." },
  { id: "reassembler",  role: "REASSEMBLER", tile: [15, 9], color: "#cbd5e1", pack: "#48bb78", about: "Applies each edit to the syntax tree with libcst." },
  { id: "executor",     role: "EXECUTOR",    tile: [12, 9], color: "#b08968", pack: "#f6ad55", about: "Runs the suite and captures real output." },
  { id: "critic",       role: "CRITIC",      tile: [9, 9],  color: "#4fd1c5", pack: "#e5534b", about: "Verdict plus the files that failed. The loop back to the planner is capped at five." },
];

export const noctisStationMap: Record<string, StationDef> = Object.fromEntries(
  noctisStations.map((s) => [s.id, s]),
);

export const noctisPipeline: PipelineStep[] =
  projects.find((p) => p.slug === "noctis")!.room.pipeline ?? [];
```

- [ ] **Step 2: Caption texture** appended to `textures.ts`:

```ts
/** Speech-plate over an agent. Fixed camera, so no billboarding maths. */
export function makeCaptionTexture(
  text: string,
  opts: { accent?: string; fg?: string } = {},
): THREE.CanvasTexture {
  const { accent = "#48bb78", fg = "#e6eaf2" } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, 506, 90);
  ctx.fillStyle = fg;
  ctx.font = "bold 34px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.slice(0, 28), 256, 44);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
```

- [ ] **Step 3: Figure** - `AgentFigure.tsx`. A variant of `Character.tsx` (same proportions, no cyan visor monopoly, plus a held box) with these rules: it takes a `pose` ref it reads each frame (`idle | walking | handing`), a `caption` texture prop that is `null` when the agent is not working, and it owns/disposes its own caption plane:

```tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeCaptionTexture } from "../textures";
import type { StationDef } from "./agents";

export type Pose = "idle" | "working" | "handing";

export function AgentFigure({
  station,
  position,
  heading,
  pose,
  caption,
  boxInHands,
  accent,
}: {
  station: StationDef;
  position: MutableRefObject<{ x: number; z: number }>;
  heading: MutableRefObject<number>;
  pose: MutableRefObject<Pose>;
  caption: string | null;
  boxInHands: boolean;
  accent: string;
}) {
  const group = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  const bubble = useRef<THREE.Group>(null);
  const t = useRef(0);

  const tex = useMemo(
    () => (caption ? makeCaptionTexture(caption, { accent }) : null),
    [caption, accent],
  );
  useEffect(() => () => tex?.dispose(), [tex]);

  useFrame((_, dt) => {
    t.current += dt;
    const g = group.current;
    if (!g) return;
    g.position.set(position.current.x, 0, position.current.z);
    g.rotation.y = heading.current;
    const walking = pose.current === "working" ? false : pose.current === "handing";
    const swing = walking ? Math.sin(t.current * 9) * 0.55 : 0;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.6;
    if (armR.current) armR.current.rotation.x = swing * 0.6;
    if (bubble.current) bubble.current.visible = Boolean(tex);
  });

  return (
    <group ref={group}>
      ... legs / torso / pack / arms / head in station.color and station.pack ...
      {boxInHands && (
        <mesh position={[0, 0.95, 0.34]}>
          <boxGeometry args={[0.3, 0.24, 0.3]} />
          <meshLambertMaterial color={accent} />
        </mesh>
      )}
      <group ref={bubble} position={[0, 2.35, 0]}>
        {tex && (
          <mesh>
            <planeGeometry args={[2.1, 0.394]} />
            <meshBasicMaterial map={tex} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </group>
  );
}
```

Fill the `...` with the eight meshes copied structurally from `Character.tsx`, recoloured. The caption plane's aspect must match the 512x96 canvas (2.1 / 0.394 = 5.33) or the text is stretched.

- [ ] **Step 4: Director** - `PlayDirector.tsx`. Phase machine over `noctisPipeline`, all timing in refs, only the *step index* in React state (it changes 13 times per ~40 s cycle, and every consumer of it is a texture swap):

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ScreenTexture } from "../textures";
import { noctisPipeline, noctisStationMap, noctisStations } from "./agents";
import { AgentFigure, type Pose } from "./AgentFigure";
import { useReducedMotion } from "../reducedMotion";
import type { RoomDef } from "../types";

const WALK_S = 2.2;      // desk to desk
const HAND_S = 0.9;      // stand together, box transfers
const WORK_S = 3.0;      // caption is up, agent "does" the step
const RETURN_S = 2.2;    // walker goes home

const STEP_T = WALK_S + HAND_S + WORK_S + RETURN_S;

export function PlayDirector({ room }: { room: RoomDef }) {
  const [step, setStep] = useState(0);
  const phase = useRef<"walk" | "hand" | "work" | "return">("work");
  const clock = useRef(0);
  const walker = useRef({ x: 9, z: 8 });
  const heading = useRef(Math.PI);
  const pose = useRef<Pose>("working");
  const monitor = useMemo(() => new ScreenTexture(), []);
  const reduced = useReducedMotion();

  useEffect(() => () => monitor.dispose(), [monitor]);

  const cur = noctisPipeline[step % Math.max(1, noctisPipeline.length)];
  const next = noctisPipeline[(step + 1) % Math.max(1, noctisPipeline.length)];
  const fromTile = noctisStationMap[cur?.agent]?.tile ?? [9, 8];
  const toTile = noctisStationMap[next?.agent]?.tile ?? [9, 8];

  useFrame((_, dtRaw) => {
    const dt = reduced ? 0 : Math.min(dtRaw, 0.05);
    clock.current += dt;
    const t = clock.current;
    const advance = () => { clock.current = 0; setStep((s) => s + 1); };

    if (phase.current === "walk") {
      const k = Math.min(1, t / WALK_S);
      lerpTo(fromTile, toTile, k);
      pose.current = "handing";
      if (k >= 1) { phase.current = "hand"; }
      return;
    }
    if (phase.current === "hand") {
      pose.current = "idle";
      if (t >= HAND_S) { phase.current = "work"; advance(); }
      return;
    }
    if (phase.current === "work") {
      pose.current = "working";
      if (t >= WORK_S) { phase.current = "return"; }
      return;
    }
    // return: the walker walks home; the box stays with the next agent
    const k = Math.min(1, t / RETURN_S);
    lerpTo(toTile, fromTile, k);
    pose.current = "handing";
    if (k >= 1) { phase.current = "work"; pose.current = "working"; }
  });

  function lerpTo(a: number[], b: number[], k: number) {
    walker.current.x = a[0] + (b[0] - a[0]) * k;
    walker.current.z = a[1] + (b[1] - a[1]) * k;
    heading.current = Math.atan2(b[0] - a[0], b[1] - a[1]);
  }

  useEffect(() => {
    if (!cur) return;
    monitor.update(
      [
        "NOCTIS AGENT OPS",
        `STEP ${(step % Math.max(1, noctisPipeline.length)) + 1}/${noctisPipeline.length}: ${cur.agent}`,
        cur.caption.toUpperCase(),
        cur.ok ? "STATUS: OK" : "STATUS: FAILED - RETRY",
        `CARRYING: ${cur.artifact}`,
        "ANIMATION OF THE PIPELINE - NOT A LIVE RUN",
      ],
      room.palette.accent,
    );
  }, [cur, monitor, step, room.palette.accent]);

  return (
    <group>
      {noctisStations.map((s) => {
        const isWalker = s.id === cur?.agent && phase.current !== "return";
        return (
          <AgentFigure
            key={s.id}
            station={s}
            accent={room.palette.accent}
            position={isWalker ? walker : { current: { x: s.tile[0], z: s.tile[1] } }}
            heading={isWalker ? heading : { current: Math.PI }}
            pose={isWalker ? pose : { current: "idle" }}
            caption={cur?.agent === s.id && phase.current === "work" ? cur.caption : null}
            boxInHands={cur?.agent === s.id}
          />
        );
      })}
    </group>
  );
}
```

Two things the implementer must fix rather than copy blindly, both flagged here so they are not "discovered" later: `isWalker` comparing by agent id breaks when the same agent appears twice in one cycle (planner and engineer do), so key the walker by **step index**, not id; and mutating a ref inside `useFrame` then reading it in the same render is fine, but `phase.current` read during render is stale by a frame - acceptable for who-is-walking, and `ponytail:` comment that.

- [ ] **Step 5: Room data.** Replace `rooms/noctis.ts` props with: an ops monitor on the north wall (frame `box [9, 1.8, 0.5]` size `[4.8, 2.6, 0.14]` colour `#0b0e14` plus a `screen` mesh the director does **not** own - keep the monitor `ScreenTexture` inside `PlayDirector` and put its plane in `Scene.tsx`'s noctis branch), a role sign above each desk via `makeSignTexture(station.role, { accent })` as a `sign` prop at `[x, 2.9, z]`, desk boxes at `[x, 0.45, z]` size `[1.8, 0.9, 1.2]` with `blocked` on their tile, the wall frame and GitHub plaque from Task 3, and floor rails marking the walk path. Interactables: keep `nx-display`, add one `nx-agent-<id>` per station at the tile in front of the desk (radius 1.5, prompt `WHAT DOES {ROLE} DO`, action `panel` project `noctis`).
- [ ] **Step 6: Verify.** Dev server `/world?room=noctis`: agents walk desk to desk, the box changes hands, captions appear over the *right* head, the failing verdict visibly loops the box back toward the planner, and the cycle restarts with `REPO RESET` taking the floor. `npm run test` - Task 1's animated-room block now has a real roster and must pass (that is the closing of Step 1's deliberate weakness). Frame budget: 8 agents x ~11 boxes is the largest scene in the project, so measure draw calls in a `verify-*.mjs` probe against the master plan's 120 ceiling and, if over, merge desk boxes into one instanced mesh before touching the agents. `npx tsc --noEmit` 0, `npm run lint` 0, `npm run build` green.
- [ ] **Step 7: Commit.**

```powershell
git add site/src/world
git commit -m "feat: noctis agents walk the package through the real pipeline"
```

---

## Task 6: Reduced motion, and deleting what is no longer built

**Files:**
- Create: `site/src/world/reducedMotion.ts`
- Modify: master plan `docs/superpowers/plans/2026-09-14-portfolio-revised-plan.md`

- [ ] **Step 1:** `reducedMotion.ts`: one `useSyncExternalStore` over `matchMedia("(prefers-reduced-motion: reduce)")` - a hook, not a store field, so both directors and `CameraRig` can read it without the world store gaining state. When true: belt parks at the gantry, cards hold on the frame with their numbers visible, agents stand still at their desks with every caption hidden except the current step's, and the monitor reads `MOTION REDUCED`. The information must survive; only the movement goes.
- [ ] **Step 2:** amend the master plan: cut-list rows for the deleted work, `A29` (no live execution by choice, not by unavailability), Phase 3 and Phase 4 headers marked `SUPERSEDED BY docs/superpowers/plans/2026-09-15-animated-demos.md`, Appendices A and B marked as archived, D.2/D.3/D.9 rows updated (no sample licensing question, no launch-mode decision, no trace provenance), and Task 6.4 shrunk to "there is no API".
- [ ] **Step 3:** verify with a probe using Playwright's `reducedMotion: "reduce"` emulation, and confirm `[E]` still works everywhere. Commit `feat: reduced motion for the animated rooms` + `docs: supersede live-demo phases with the animated plan`.

---

## Deleted work (do not build any of this)

| Master plan | Now |
|---|---|
| Tasks 3.4-3.8: `/api/inspect`, rate limiter, `demo-results`, mock inference, heatmap, `downscale`, `InspectDemo`, camera capture | Deleted. Task 4 replaces the experience. Appendix A deleted. |
| Tasks 4.1-4.4, 4.6: trace format, `validate-trace`, `trace-player`, playback store, `NoctisConsole` | Deleted. `noctisPipeline` data + Task 5 replace them. Appendix B deleted, including the recorder adapter. |
| Task 6.4's upload/SSRF/abuse review, amendments A1-A4 (body size, IP key, per-instance limits) | Reduced to "the site has no API and accepts no user data". AGENTS.md keeps the rule that any future endpoint gets the trust-boundary review. |
| D.3 sample-image licensing question | Gone. Photos appear only as wall/belt textures AJ owns or has licence to publish; that is a content question, not an API one. |
| Task 7.2 "live or mock at launch" | No decision to make. Mock, permanently, labelled as published results. |
| The `panel: "demo"` kind | Kept as a type, rendered nowhere. Do not delete the variant: Task 3's panels still route `project`/`about`/`research`. |

**Kept, unchanged, and now load-bearing:** the room validator (Task 1), content layer and its tests, wall frames, the standard pages (they are where the real numbers are argued in prose), and every accessibility task in Phase 6 - which got *easier*, because there is no upload flow to make keyboard-operable.

---

## Self-review against the spec

- Section 10 (rooms communicate through environment): frames + belts + walking agents, all readable with zero input. Covered.
- Section 11 (conveyor, camera, monitor, samples, TRY IT YOURSELF): conveyor, gantry, monitor, products all present. "TRY IT YOURSELF" is **cut** - there is no trying-it-yourself any more, and a sign promising a demo that is not there would be the worst kind of lie. Replace with a sign reading `SEE THE NUMBERS`.
- Section 12.1-12.4 (agent nodes, roles, work handoff, status): the strongest match in this plan - real node names, real artefact labels, real retry.
- Section 12.5 (user gives a task): cut with live execution, per the decision.
- Section 12.7 (safety/resource constraints): satisfied by having no execution path at all, which is the best available answer.
- Sections 23-24 (performance, accessibility): Task 6 plus the draw-call measurement in Task 5 Step 6. The honest failure mode to watch is 8 characters x 11 meshes; measure, do not hope.
- Section 30 (non-goals: not a game, no decorative animation): the animations encode real architecture and real results, which is the distinction the spec asks for.

**Open questions for AJ (none block Tasks 1-3):** which three categories the belt photos are; whether the 8-agent cast is too crowded for the room and should drop `reset` and `reassembler` to 6; and whether `precision`/`recall` exist anywhere he can point at (the README has none, so nothing shows until he gives a measurement).
