import type { SiteContent } from "./types";

/**
 * Facts AJ owns. `EDIT-ME` is the only placeholder allowed in this repo and
 * `npm run check:content` (Task 6.5) fails the launch while any remains.
 * The research summaries below are descriptions of the two shipped projects;
 * the 3D Vision station stays EDIT-ME because nothing in either repo supports
 * a claim about it.
 */
export const site: SiteContent = {
  owner: {
    name: "AJ",
    title: "EDIT-ME: e.g. Machine Learning Engineer",
    tagline: "EDIT-ME: one sentence — what you build and why it matters.",
    location: "EDIT-ME: City, Country",
    email: "EDIT-ME@example.com",
    github: "https://github.com/JeremiahAdebayo",
    linkedin: "https://www.linkedin.com/in/EDIT-ME",
    resumeUrl: "/resume.pdf",
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
    {
      title: "3D Vision",
      summary: "EDIT-ME: current focus, and what has actually been built here.",
      links: [],
    },
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
