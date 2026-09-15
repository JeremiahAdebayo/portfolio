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
