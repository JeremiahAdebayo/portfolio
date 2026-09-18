import type { SiteContent } from "./types";

/**
 * Facts AJ owns. `EDIT-ME` is the only placeholder allowed in this repo and
 * `npm run check:content` (Task 6.5) fails the launch while any remains.
 * The research summaries below are descriptions of the two shipped projects;
 * The research stations below only describe work AJ has actually done.
 */
export const site: SiteContent = {
  owner: {
    name: "AJ",
    title: "Machine Learning Engineer",
    tagline:
      "I'm AJ. I build ML systems from scratch and ship them, on the path toward founding something of my own.",
    email: "jrmhadebayo@gmail.com",
    github: "https://github.com/JeremiahAdebayo",
    linkedin: "https://linkedin.com/in/jadebayo24",
    x: "https://x.com/AJololade",
    resumeUrl: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/resume.pdf?v=20260918`,
  },
  research: [
    {
      title: "Computer Vision",
      summary:
        "Unsupervised anomaly detection for industrial inspection. Rebuilt PatchCore by hand — WideResNet50 multi-scale features, k-center coreset, kNN scoring — across all 15 MVTec AD categories, with pixel heatmaps and per-category threshold calibration.",
      links: [
        { label: "Nightfall", href: "https://github.com/JeremiahAdebayo/Nightfall" },
      ],
    },
    {
      title: "Machine Learning Systems",
      summary:
        "What changes between a notebook and a deployment: quantization that silently breaks confidence reweighting, memory banks that must be refit in the same feature space as inference, and choosing metrics (PRO beside image AUROC) that expose localisation the headline number hides.",
      links: [
        {
          label: "Quantization findings",
          href: "https://github.com/JeremiahAdebayo/Nightfall#quantization-phase-3",
        },
      ],
    },
    {
      title: "Agents and Orchestration",
      summary:
        "Multi-agent software engineering as a systems problem: LangGraph state graphs with parallel fan-out, libcst node-level patching so untouched code stays stable, hybrid lexical-plus-vector retrieval for localisation, and per-role model pools with rate limits and fallback chains.",
      links: [
        { label: "Noctis", href: "https://github.com/JeremiahAdebayo/Noctis" },
      ],
    },
  ],
  /**
   * Transcribed from AJ's resume (2026-09-16). There is deliberately no
   * `owner.location`: AJ asked for it to be left out, so the field is gone
   * from the schema rather than left as a placeholder nobody will fill.
   */
  timeline: [
    {
      period: "March 2026 – August 2026",
      title: "Software Engineering Intern",
      org: "UniK Connect",
      note: "PHP backend for an SME inventory system: auth flows, database work, and the deployment and networking it runs on.",
    },
    {
      period: "August 2025 – Present",
      title: "Research & Data Analyst (Volunteer)",
      org: "OpenGov Africa",
      note: "Led data collection and pandas analysis of Freedom of Information law implementation across African countries.",
    },
    {
      period: "Expected 2027",
      title: "B.Sc. Information Technology",
      org: "University of Ilorin",
      note: "Final year.",
    },
  ],
};
