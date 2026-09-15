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

  it("rejects an over-long wall body and a github link that is not github", () => {
    const bad = structuredClone(projects[0]);
    bad.room.frame.body = "x".repeat(221);
    bad.room.github.href = "https://example.com/repo";
    const errors = validateContent({ ...site, projects: [bad] });
    expect(errors.some((e) => e.includes("frame.body"))).toBe(true);
    expect(errors.some((e) => e.includes("github href"))).toBe(true);
  });

  it("gives every belt card a source line and 1-4 numbers", () => {
    const belt = projects.find((p) => p.slug === "nightfall")!.room.belt ?? [];
    expect(belt.length).toBeGreaterThan(0);
    for (const card of belt) {
      expect(card.rows.length).toBeGreaterThan(0);
      expect(card.rows.length).toBeLessThanOrEqual(4);
      expect(card.source.trim().length).toBeGreaterThan(0);
      expect(card.category.trim().length).toBeGreaterThan(0);
      expect(card.id.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps the Noctis cycle honest: long enough, captions short, one failure", () => {
    const pipeline = projects.find((p) => p.slug === "noctis")!.room.pipeline ?? [];
    expect(pipeline.length).toBeGreaterThanOrEqual(6);
    expect(pipeline.some((s) => s.ok === false)).toBe(true);
    for (const step of pipeline) {
      expect(step.caption.trim().length).toBeGreaterThan(0);
      expect(step.caption.length).toBeLessThanOrEqual(28);
      expect(step.artifact.trim().length).toBeGreaterThan(0);
      expect(step.agent.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps each belt card self-consistent, so numbers cannot drift from the photo", () => {
    const belt = projects.find((p) => p.slug === "nightfall")!.room.belt ?? [];
    for (const card of belt) {
      // id, category and label all name the same MVTec category; the numbers on
      // the card only make sense for that category.
      expect(card.label.toLowerCase()).toBe(card.category);
      if (card.image) expect(card.image).toContain(card.category);
    }
  });
});
