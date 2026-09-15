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
