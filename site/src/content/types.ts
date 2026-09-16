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
    /** wall frame copy, required: every project room explains itself */
    frame: FrameCopy;
    /** the repository link, rendered on the plaque under the frame */
    github: Link;
    /** Nightfall's belt. Absent = no belt. */
    belt?: BeltCard[];
    /** Noctis's cycle. Absent = no walking agents. */
    pipeline?: PipelineStep[];
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

/**
 * The "painting" on a project room's wall: a frame with a brief explanation.
 * Passive on purpose - a visitor who never presses [E] still learns what the
 * room is (spec section 10).
 */
export interface FrameCopy {
  /** at most 28 chars. A headline, not a sentence. */
  title: string;
  /** at most 220 chars, enforced. Longer text is unreadable from across a room. */
  body: string;
}

/**
 * One product on Nightfall's pulley, and the flashcard it produces.
 * The numbers are PUBLISHED results for that MVTec AD category, not a verdict
 * on the pixels of the photo: this build does no inference at all.
 */
export interface BeltCard {
  id: string;
  /** MVTec AD category, lowercase, spelled as the repository spells it */
  category: string;
  /** card headline, e.g. "BOTTLE" */
  label: string;
  /** /public path, or null until AJ supplies the photo */
  image: string | null;
  /** 1-4 rows, verbatim from the repository */
  rows: Metric[];
  /** rendered on the card. A number with no source is a claim. */
  source: string;
}

/** One beat of Noctis's animated cycle. */
export interface PipelineStep {
  /** station id; world/rooms.test.ts checks it names a real desk */
  agent: string;
  /** at most 28 chars, floats over the agent's head while it works */
  caption: string;
  /** what it carries to the next station, e.g. "PATCH" */
  artifact: string;
  /** false = this step's verdict failed. The retry hop is the honest part. */
  ok: boolean;
}

export interface SiteContent {
  owner: {
    name: string;
    title: string;
    tagline: string;
    email: string;
    github: string;
    linkedin: string;
    /** X/Twitter. Plan A28: added when AJ supplied the handle - the plan's
     *  schema predated it, and validateContent requires every owner field. */
    x: string;
    resumeUrl: string;
  };
  research: ResearchStation[];
  timeline: TimelineEntry[];
}
