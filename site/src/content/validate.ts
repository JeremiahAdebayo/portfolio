import type { Project, SiteContent } from "./types";

/**
 * The validator checks the WHOLE bundle: owner/research/timeline plus projects.
 * `site` and `projects` stay separate modules (AD-01) so page code never imports
 * more than it needs; `site: SiteContent & { projects }` in the test assembles
 * the bundle purely for validation.
 */
export type ContentBundle = SiteContent & { projects: Project[] };

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

export function validateContent(content: ContentBundle): string[] {
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
