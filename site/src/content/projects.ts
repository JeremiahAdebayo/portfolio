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
      "Unsupervised anomaly detection: learn the distribution of normal products only, then flag deviations. PatchCore with a pretrained feature extractor, a memory bank of normal patch features, and nearest-neighbour scoring at inference time.",
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
