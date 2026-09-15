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

  // Every project room must explain itself on the wall, and must link its repo.
  const frame = p.room?.frame;
  if (!frame?.title?.trim()) errors.push(`${at}.room.frame.title: required`);
  if (!frame?.body?.trim()) errors.push(`${at}.room.frame.body: required`);
  if (frame?.body && frame.body.length > 220) {
    errors.push(
      `${at}.room.frame.body: ${frame.body.length} chars, max 220 (wall copy must read from across a room)`,
    );
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
    if (c.label.toLowerCase() !== c.category) {
      errors.push(`${atc}: label "${c.label}" and category "${c.category}" disagree`);
    }
    if (c.image && !c.image.includes(c.category)) {
      errors.push(`${atc}.image "${c.image}" is not a photo of ${c.category}`);
    }
  });

  p.room?.pipeline?.forEach((s, i) => {
    const ats = `${at}.room.pipeline[${i}]`;
    if (!s.agent?.trim()) errors.push(`${ats}.agent: required`);
    if (!s.caption?.trim()) errors.push(`${ats}.caption: required`);
    if (s.caption && s.caption.length > 28) {
      errors.push(`${ats}.caption: ${s.caption.length} chars, max 28`);
    }
    if (!s.artifact?.trim()) errors.push(`${ats}.artifact: required`);
    if (typeof s.ok !== "boolean") errors.push(`${ats}.ok: required boolean`);
  });

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
