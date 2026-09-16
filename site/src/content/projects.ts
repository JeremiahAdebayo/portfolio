import type { Project } from "./types";

/**
 * Every fact here is transcribed from the repository it describes, checked
 * 2026-09-15: Nightfall's README (results, quantization findings, serving and
 * ESP32 sections) and Noctis's agent/graph.py, agent/state.py, agent/schemas.py,
 * config/litellm_config.yaml and scripts/run.py.
 *
 * Where the source does not state a number it is marked EDIT-ME rather than
 * estimated. Provenance rule (Appendix D.2): nothing here that AJ cannot point
 * at in the repo.
 */
export const projects: Project[] = [
  {
    slug: "nightfall",
    name: "Nightfall",
    tagline:
      "A from-scratch PatchCore reimplementation, carried all the way to INT8 and an ESP32.",
    summary:
      "Nightfall is a visual anomaly detection system that reimplements PatchCore from scratch instead of wrapping a library, covers all 15 MVTec AD categories, and ships a deployment stack: ONNX export, INT8 dynamic quantization, a multi-category gRPC server, an async REST gateway and an ESP32 client. It is v2 of an earlier anomalib-based project (tagged v1.0) that handled a single category.",
    problem:
      "Running anomalib's PatchCore on MVTec AD proves very little: the paper is public and so is the reference implementation. The harder, rarer claims are understanding the algorithm well enough to rebuild and debug it, knowing what changes when you compress and serve a model rather than only training one, and being honest about what breaks along the way.",
    approach:
      "Unsupervised detection: learn the distribution of normal patches only, then flag deviations. WideResNet50 features hooked at layer2/layer3, locally-aware 3x3 average pooling and multi-scale channel fusion; a greedy k-center coreset (farthest-point sampling) made affordable by a Johnson-Lindenstrauss projection; kNN scoring against the memory bank, with softmax confidence reweighting at image level and raw distances for pixel heatmaps. Per-category thresholds are calibrated as mean + 3 sigma of each category's own training scores, so no test data leaks into the decision boundary. Image AUROC, pixel AUROC and PRO are all reported.",
    technologies: [
      "PyTorch",
      "WideResNet50",
      "PatchCore (hand-rolled)",
      "ONNX Runtime",
      "INT8 dynamic quantization",
      "gRPC",
      "FastAPI",
      "ESP32",
      "MVTec AD",
    ],
    metrics: [
      { label: "Image AUROC", value: "0.938 mean over 15 MVTec categories" },
      { label: "PRO", value: "0.651 mean (pixel AUROC: EDIT-ME)" },
      { label: "Quantized size", value: "99.6 MB to 25.0 MB, 3.98x" },
      { label: "CPU latency", value: "293 ms p50 fp32 vs 1304 ms INT8" },
    ],
    limitations:
      "Quantization is a memory win, not a guaranteed latency win: on CPU without VNNI the INT8 path was slower than ONNX fp32. The paper's confidence reweighting collapsed under INT8 (0.997 to 0.518 on bottle) and is disabled there. Scoring INT8 test features against an fp32-built memory bank broke per-category until the bank was refit in the same feature space. Mean image AUROC sits about five points under the published PatchCore figure, which is a plausible reimplementation delta rather than evidence of a broken build. PRO exposes categories where the model flags a defect reliably but localises it poorly (cable 0.927 AUROC, 0.497 PRO). And kNN scoring cannot infer a part category from an image: the client must name it.",
    links: [
      { label: "GitHub", href: "https://github.com/JeremiahAdebayo/Nightfall" },
      {
        label: "README: what actually broke",
        href: "https://github.com/JeremiahAdebayo/Nightfall#quantization-phase-3",
      },
    ],
    demo: "nightfall",
    room: {
      title: "VISION LAB",
      subtitle: "Visual Anomaly Detection",
      accent: "#f6ad55",
      frame: {
        title: "THE IDEA",
        body: "Anomaly detection rebuilt from scratch: learn what normal looks like, then flag any deviation. No labelled defects. 15 MVTec AD categories, ONNX export, INT8 quantization, gRPC serving and an ESP32 client.",
      },
      github: { label: "GitHub", href: "https://github.com/JeremiahAdebayo/Nightfall" },
      belt: [
        {
          id: "bottle",
          category: "bottle",
          label: "BOTTLE",
          image: "/samples/bottle.png",
          rows: [
            { label: "Image AUROC", value: "0.997" },
            { label: "PRO", value: "0.701" },
          ],
          source: "Nightfall README, MVTec AD, WideResNet50 fp32",
        },
        {
          id: "cable",
          category: "cable",
          label: "CABLE",
          image: "/samples/cable.png",
          rows: [
            { label: "Image AUROC", value: "0.927" },
            { label: "PRO", value: "0.497" },
            { label: "Reads as", value: "flags it, localises it badly" },
          ],
          source: "Nightfall README, MVTec AD, WideResNet50 fp32",
        },
        {
          // AJ's third photo is wood, not grid, and the two are different
          // MVTec categories with different published numbers (grid 0.799/0.558
          // vs wood 0.954/0.779). The card follows the photo, and the numbers
          // follow the category: attaching the grid row to a wood photo would
          // have been a quiet lie about a published result.
          id: "wood",
          category: "wood",
          label: "WOOD",
          image: "/samples/wood.png",
          rows: [
            { label: "Image AUROC", value: "0.954" },
            { label: "PRO", value: "0.779" },
            { label: "Note", value: "2nd-best PRO of the 15" },
          ],
          source: "Nightfall README, MVTec AD, WideResNet50 fp32",
        },
      ],
    },
  },
  {
    slug: "noctis",
    name: "Noctis",
    tagline:
      "Multi-agent bug fixing that patches one AST node at a time and proves it with pytest.",
    summary:
      "Noctis takes a written issue report against a Python repository and returns a verified patch. A LangGraph state graph resets the workspace, indexes it, plans per-file work packages, generates tests, fans out to parallel engineer agents, reassembles the edits, runs pytest, and lets a critic decide whether to loop or stop. Every handoff is an explicit, typed state update on a shared blackboard.",
    problem:
      "Whole-file rewrites by an LLM are untrustworthy in a real codebase: they lose code nobody asked about, they cannot be reviewed node by node, and a model that has not located the failing function is guessing. The hard parts are finding the right nodes, limiting what each agent may write, and closing the loop against an actual test run instead of a confident claim.",
    approach:
      "A localiser indexes the repository two ways at once - an AST code map of functions, classes and methods with line ranges, plus a lexical index and a Qdrant vector collection fused into one ranking - and parses pytest tracebacks back into candidate locations. The planner emits typed EngineerTasks (file, plan, exact target functions, related files each with a stated reason). A LangGraph Send fan-out runs engineers in parallel, one per file. Each engineer returns surgical Edit records (function, class or method node, new implementation, added imports, rationale) that libcst applies to the syntax tree, so untouched code stays byte-stable. Edits accumulate on an append-or-reset reducer; the critic's failed-file list narrows the next iteration to what actually broke, enriched with the files a parallel engineer changed.",
    technologies: [
      "Python",
      "LangGraph",
      "Send fan-out",
      "libcst",
      "Pydantic",
      "LiteLLM",
      "Qdrant",
      "pytest",
      "AST code map",
    ],
    metrics: [
      {
        label: "Graph",
        value: "reset, indexer, planner, test generator, engineer, reassembler, executor, critic",
      },
      { label: "Retry budget", value: "5 iterations, enforced in the routing gate" },
      { label: "Patch unit", value: "one function, class or method node" },
      {
        label: "Model pools",
        value: "planner, coder and critic, each with fallbacks at 30 rpm",
      },
    ],
    limitations:
      "The target must be a Python project with a runnable pytest command, and the flow is demonstrated on a small multi-module app rather than arbitrary codebases. Write scope is a per-task manifest of allowed paths, not an OS-level sandbox. The fan-out deliberately filters the critic's failed-file list against known source paths, because a critic once returned pytest node IDs instead. A rate-limited pool of hosted models is not a throughput guarantee, and the five-iteration cap means some issues exit unresolved by design.",
    links: [
      { label: "GitHub", href: "https://github.com/JeremiahAdebayo/Noctis" },
      {
        label: "graph.py: the whole orchestration",
        href: "https://github.com/JeremiahAdebayo/Noctis/blob/main/agent/graph.py",
      },
    ],
    demo: "noctis",
    room: {
      title: "AGENT LAB",
      subtitle: "Autonomous Multi-Agent Software Engineering",
      accent: "#48bb78",
      frame: {
        title: "THE LOOP",
        body: "A bug report goes in, a verified patch comes out. Agents share one state graph: index the repo, plan per file, write the failing test, patch one AST node, run pytest, judge - and loop back if it fails.",
      },
      github: { label: "GitHub", href: "https://github.com/JeremiahAdebayo/Noctis" },
      // Mirrors agent/graph.py. The failing verdict and the hop back to the
      // planner are not decoration: that retry edge is what makes a multi-agent
      // system worth building, so the cycle shows it on every lap.
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
  },
];
