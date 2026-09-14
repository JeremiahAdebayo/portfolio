# Portfolio Experience Design Specification

**Project:** AJ Interactive Portfolio  
**Working Concept:** Interactive Voxel Research Facility  
**Status:** Concept / Pre-development  
**Version:** 1.0  
**Purpose:** Design specification and implementation blueprint

---

# 1. Vision

The portfolio should not feel like a conventional personal website.

It should feel like the visitor has entered a small interactive world representing AJ's technical work, projects, research interests, and capabilities.

The central experience is a **voxel-based research facility** containing separate rooms for major projects.

The visitor controls a voxel character and physically explores the facility.

Each project is represented by a physical room. Entering a room transitions the visitor from simply *reading about a project* to actually *experiencing and interacting with it*.

The guiding principle is:

> **Don't tell the visitor what I built. Let them interact with it.**

The site should combine:

- Voxel game aesthetics
- Interactive exploration
- Real technical demonstrations
- Subtle gamification
- Strong visual identity
- Conventional portfolio accessibility

The experience should be memorable without sacrificing usability or performance.

---

# 2. Design Philosophy

## 2.1 Experience over presentation

A conventional portfolio presents information.

This portfolio presents an environment in which the information exists.

Instead of:

> Projects → Nightfall → Read More

the experience becomes:

> Enter facility → find Nightfall room → enter laboratory → operate inspection system → run inference → inspect result.

---

## 2.2 The gimmick must serve the work

The interactive world is not the primary achievement.

It is the interface through which the actual technical work is demonstrated.

The visitor should leave thinking:

> "The website is unusual."

but more importantly:

> "This person actually builds technically interesting systems."

---

## 2.3 Small world, high detail

The facility should initially contain approximately **4–6 meaningful areas**.

Do not create dozens of rooms simply to make the world feel large.

Every room should have a reason to exist.

---

# 3. Overall World

The portfolio takes place inside a compact voxel research facility.

The facility acts as the website's primary navigation system.

Possible initial layout:

```text
                         ┌──────────────────┐
                         │    NIGHTFALL     │
                         │   VISION LAB     │
                         └────────┬─────────┘
                                  │
                                  │
┌─────────────────┐       ┌───────▼────────┐       ┌─────────────────┐
│     ABOUT       │───────│      CORE      │───────│     NOCTIS      │
│                 │       │   MAIN HUB     │       │   AGENT LAB     │
└─────────────────┘       └───────┬────────┘       └─────────────────┘
                                  │
                         ┌────────▼────────┐
                         │    RESEARCH     │
                         │      LAB        │
                         └─────────────────┘
```

The exact architecture can change during implementation.

The important concept is that the **world itself is the navigation system**.

---

# 4. Camera

## Decision

Use a **third-person, slightly elevated/isometric camera**.

Do not use first-person as the default.

The visitor should always be able to see their character.

### Reasons

- Makes the voxel environment immediately understandable.
- Makes character movement visually satisfying.
- Allows the character to become part of the personal brand.
- Makes rooms easier to understand spatially.
- Avoids requiring the visitor to learn FPS-style controls.
- Works well with keyboard and virtual joystick controls.

The camera should smoothly follow the character.

Avoid excessive camera movement, motion blur, or cinematic effects that make navigation uncomfortable.

---

# 5. Player Character

The visitor controls a custom voxel character.

The character should **not directly copy Minecraft's Steve/Alex characters**.

It should have its own design and eventually become part of AJ's visual identity.

Working concept:

> **AJ.exe**

Possible characteristics:

- Minimal voxel humanoid
- Distinctive clothing/accessory
- Technical/scientific aesthetic
- Small enough to navigate rooms comfortably
- Simple idle/walking animations

The character should have:

- idle animation
- walking animation
- directional movement
- interaction state
- optional interaction animation

The character does not need combat, inventory, health, or conventional game mechanics.

---

# 6. Controls

## Desktop

Primary controls:

- `WASD` — movement
- `Arrow Keys` — optional movement
- `E` — interact
- `ESC` — pause/menu
- Mouse — UI interaction

## Mobile / Touch

Display a virtual analogue joystick.

The joystick should appear only where appropriate rather than permanently occupying a large portion of the screen.

Interaction prompts should remain large enough for touch input.

---

# 7. HUD

HUD = **Heads-Up Display**.

The HUD is the persistent interface layered over the game world.

It should be intentionally minimal.

Possible elements:

```text
┌────────────────────────────────────────────────────┐
│ AJ // RESEARCH FACILITY                 MENU [≡]  │
│                                                    │
│                                                    │
│                                                    │
│                                                    │
│                                                    │
│                                      WASD / 🕹     │
└────────────────────────────────────────────────────┘
```

Possible HUD information:

- Portfolio/brand name
- Current room
- Menu button
- Interaction prompt
- Controls
- Optional system status

The HUD should never dominate the world.

---

# 8. Conventional Navigation

The world should be the primary navigation mechanism, but it must **not be the only navigation mechanism**.

The persistent menu should provide direct access to:

- Home
- Projects
- About
- Experience
- Research
- Resume
- Contact

A recruiter should be able to reach the information they need without walking through the entire building.

The interactive world is the preferred experience.

The conventional navigation is the escape hatch.

---

# 9. Core / Spawn Room

The visitor begins in the central facility.

The room should immediately communicate:

> "You are inside AJ's technical world."

Possible elements:

- AJ.exe character
- Central terminal
- Project doors
- Facility signage
- Ambient machinery
- Small screens showing project activity
- Interactive map or directory
- Welcome message

The central room should provide enough visual information to make the visitor curious without requiring a tutorial.

---

# 10. Room System

Every major project receives a dedicated environment.

A room should have:

1. Strong visual identity
2. Project name
3. Project description
4. Interactive demonstration
5. Technical information
6. Relevant metrics
7. Source/demo links
8. A clear exit

Each room should communicate the project **through its environment**.

---

# 11. NIGHTFALL — Visual Anomaly Detection Lab

## Concept

Nightfall becomes an industrial visual inspection laboratory.

The visitor enters a small factory-style inspection room.

### Environment

The room contains:

1. Conveyor belt
2. Products moving along the conveyor
3. Industrial inspection camera above the conveyor
4. Large monitor
5. Anomaly samples
6. Technical terminals
7. Industrial lighting
8. Model status indicators
9. Large "TRY IT YOURSELF" sign

The room should feel like an actual computer-vision inspection station.

---

## 11.1 Conveyor System

Products move continuously along the conveyor.

Possible states:

```text
PRODUCT → CAMERA → INSPECTION → PASS / ANOMALY
```

Some products can contain intentionally visible or subtle defects.

The conveyor does not necessarily need to run continuously if doing so harms performance.

---

# 11.2 Inspection Camera

A physical camera should be positioned above the conveyor.

It visually establishes what the model is doing:

> Camera observes product → model analyzes image.

The camera could periodically capture simulated frames.

Those frames can appear on the monitor.

---

# 11.3 Main Monitor

The monitor displays the inspection system.

Possible information:

```text
NIGHTFALL VISION SYSTEM

STATUS: ONLINE

MODEL
PatchCore

INPUT
Industrial Product

INFERENCE
112 ms

STATUS
NORMAL
```

When an anomaly is detected, the monitor changes state.

---

# 11.4 Anomaly Samples

The room should contain physical examples of:

- normal products
- anomalous products
- defective samples

These can be displayed on shelves or inspection tables.

Some should be interactive.

Interacting with a sample could display its classification/inference information.

---

# 11.5 Technical Terminals

Terminals can communicate the real technical details of Nightfall.

Possible information:

- Model architecture
- Feature extractor
- Dataset
- Training approach
- Inference latency
- Hardware
- Benchmark results
- Quantization experiments
- Accuracy / anomaly detection metrics

The information should be concise.

Visitors interested in technical depth can open a detailed view.

---

# 11.6 "TRY IT YOURSELF" Sign

A large Las Vegas-style illuminated sign should be one of the room's visual focal points.

Text:

> **TRY IT YOURSELF**

The sign should use animated LED-style lighting.

Its purpose is not merely decoration.

It communicates the room's primary interaction.

When the visitor approaches the sign, an interaction prompt appears.

Example:

```text
[E] TRY NIGHTFALL
```

Interacting opens the live inference interface.

---

# 11.7 Nightfall Live Demo

The visitor can choose:

### Option A — Upload Image

Upload a product image from their device.

### Option B — Use Camera

Request browser camera access and allow the visitor to capture a product image.

The system sends the image to the Nightfall inference backend.

The result is returned to the browser.

---

# 11.8 Inference Result

The result should be presented as part of the environment rather than as a generic webpage.

Possible output:

```text
NIGHTFALL INSPECTION RESULT

STATUS
ANOMALY DETECTED

CONFIDENCE
97.4%

INFERENCE TIME
112 ms

ANOMALY MAP
[visualization]
```

Where possible, display:

- original image
- anomaly heatmap
- anomaly score
- classification
- inference latency

The demo should make the underlying ML system tangible.

---

# 12. NOCTIS — Multi-Agent AI Laboratory

## Concept

Noctis becomes an AI-agent operations room.

Instead of showing a conventional architecture diagram, the architecture becomes a physical environment.

Each agent is represented by a voxel character/entity.

---

# 12.1 Agent Nodes

Each agent has:

- Voxel representation
- Name
- Role
- Status
- Workspace/terminal
- Visual indicator

Example:

```text
        ┌──────────────┐
        │    PLANNER   │
        └──────────────┘
              [VOXEL]

        "Task Planning Agent"
```

Potential agents can correspond to actual Noctis components.

Do not invent agents solely for visual effect.

The room should reflect the real architecture.

---

# 12.2 Agent Roles

Every agent has a sign above or beside it.

Example:

```text
┌──────────────────┐
│ RESEARCH AGENT   │
└──────────────────┘
        [VOXEL]
```

The sign communicates the role immediately.

Hovering/interacting can reveal additional information.

---

# 12.3 Work Handoff System

This is one of the room's signature interactions.

When work moves between agents, an actual object physically travels between them.

Example:

```text
PLANNER
   │
   │
   └──── 📦 "TASK" ─────►
                          RESEARCHER
                              │
                              │
                              └──── 📦 "FINDINGS" ─────►
                                                        CODER
```

The box represents the current work artifact.

It should physically animate from one agent to another.

The label changes according to the actual workflow.

Examples:

- TASK
- CONTEXT
- RESEARCH
- CODE
- PATCH
- TEST RESULT

This animation visually explains the agent architecture without requiring the visitor to understand a technical diagram.

---

# 12.4 Agent Status

Agents can visually communicate their state.

Possible states:

**IDLE**

```text
STATUS: IDLE
```

**WORKING**

```text
STATUS: PROCESSING
```

**HANDOFF**

```text
STATUS: HANDOFF
```

**ERROR**

```text
STATUS: ERROR
```

The visualization should correspond to actual system activity when the live demo is running.

---

# 12.5 User Input

The visitor should be able to submit a task to Noctis.

Possible interface:

```text
┌──────────────────────────────────────────────┐
│ GIVE NOCTIS A TASK                           │
│                                              │
│ [ Paste code or describe a task...         ] │
│                                              │
│                  [ RUN NOCTIS ]              │
└──────────────────────────────────────────────┘
```

The input becomes the initial work package.

The visitor then watches it travel through the agent system.

---

# 12.6 Code Interaction

A visitor should be able to paste a small code snippet or task.

Example:

```python
def calculate_average(values):
    return sum(values) / len(values)
```

Noctis processes the request.

The resulting workflow is visualized in the room.

The final result can be displayed on the terminal or central monitor.

---

# 12.7 Noctis Safety / Resource Constraints

The public demo should not expose unrestricted access to expensive or dangerous operations.

The system should use:

- sandboxed execution where necessary
- strict timeouts
- request limits
- input-size limits
- restricted tools
- controlled API access

The visitor should experience the system without being given unrestricted infrastructure access.

---

# 13. Research Room

A dedicated research room can represent AJ's broader technical work.

Possible contents:

- Research papers
- Experiments
- Benchmarks
- Computer vision work
- ML experiments
- Technical notes
- Future areas of interest

The room could contain physical research stations rather than conventional cards.

For example:

> **COMPUTER VISION**

> **MACHINE LEARNING**

> **3D VISION**

> **SYSTEMS**

Each station opens deeper information.

This room can evolve as the portfolio grows.

---

# 14. About Room

The About section should remain simple.

Possible environment:

A personal workstation containing:

- Character/avatar
- Terminal
- Timeline
- Education
- Experience
- Current interests

The visitor can interact with the terminal to discover information about AJ.

Do not turn basic biography into an unnecessarily complicated puzzle.

---

# 15. Contact Room

The contact area should be extremely easy to use.

Possible environment:

A communications terminal.

Interactions:

- Email
- LinkedIn
- GitHub
- Resume

The user should not have to solve a puzzle to contact AJ.

---

# 16. Gamification

Gamification should be subtle.

The portfolio is **not a game**.

It is an interactive portfolio with game-like mechanics.

Possible features:

### Exploration

Visitors naturally discover rooms.

### Discovery

Hidden details can reward exploration.

### Achievements

Optional achievements can be unlocked.

Examples:

- First Contact
- Lab Explorer
- Vision Specialist
- Agent Observer
- Researcher
- Full Tour

Achievements should never prevent access to portfolio information.

---

# 17. Easter Eggs

A small number of hidden interactions can reward curious visitors.

Examples:

- Secret terminal
- Hidden room
- Developer joke
- Alternate character interaction
- Hidden technical note
- Console command

These should be optional.

The main portfolio must remain straightforward.

---

# 18. Visual Identity

## Style

Primary visual language:

> **Voxel research facility + futuristic technical laboratory**

Avoid making the site look like a generic cyberpunk template.

Avoid:

- excessive neon
- excessive gradients
- giant glowing text everywhere
- generic hacker imagery
- unnecessary particle effects
- excessive glassmorphism

The environment should feel designed rather than decorated.

---

# 19. Lighting

Lighting should be an important part of the experience.

Different rooms should have different atmospheres.

### Core

Neutral, welcoming.

### Nightfall

Industrial, slightly darker, machinery-focused.

### Noctis

Computer-lab atmosphere with active terminals and agent stations.

### Research

Quiet, analytical environment.

Lighting should remain performant on typical laptops and mobile devices.

---

# 20. Sound

Sound should be optional and subtle.

Possible effects:

- footsteps
- machinery
- conveyor belt
- terminal interaction
- door opening
- UI confirmation
- agent handoff
- ambient facility noise

The site should never autoplay loud music.

Provide a mute control.

---

# 21. Transitions

Room transitions should feel physical.

Possible:

- Opening doors
- Walking through doorways
- Short environmental transition
- Lighting change
- Camera movement

Avoid long loading animations.

The visitor should feel that they are moving through one connected facility.

---

# 22. Project Information Architecture

Every project room should have two layers.

## Layer 1 — Experience

The visitor interacts with the project.

## Layer 2 — Technical Details

The visitor can inspect:

- Problem
- Approach
- Architecture
- Technologies
- Dataset
- Results
- Benchmarks
- Limitations
- GitHub
- Demo

This allows both recruiters and technical visitors to get value.

---

# 23. Performance Requirements

Performance is a first-class requirement.

Target:

- Fast initial load
- Lightweight environment
- Efficient assets
- Lazy-load heavy demos
- Lazy-load project backends
- Avoid unnecessary WebGL complexity
- Mobile-compatible experience
- Graceful fallback on unsupported devices

The portfolio must not become a 500 MB game disguised as a website.

---

# 24. Accessibility

The interactive world should have an accessible alternative.

Users should be able to access all important portfolio content without requiring:

- keyboard controls
- WebGL
- audio
- precise mouse movement
- game experience

Possible fallback:

**MENU → PROJECTS → NIGHTFALL**

This opens the same project information and demo directly.

The interactive environment is the enhanced experience, not an accessibility barrier.

---

# 25. Technical Architecture

High-level architecture:

```text
                         PORTFOLIO
                             │
              ┌──────────────┴──────────────┐
              │                             │
         WORLD CLIENT                  STANDARD UI
              │                             │
       ┌──────┼──────┐                      │
       │      │      │                      │
    Player  Rooms   HUD                Navigation
       │      │      │                      │
       └──────┴──────┴──────────┬───────────┘
                                │
                         Project Interfaces
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
            NIGHTFALL                       NOCTIS
              API                             API
                 │                             │
          ML inference                  Agent system
```

The exact technology stack will be decided during implementation.

The architecture should keep:

- frontend
- visual world
- UI
- project demos
- backend services

reasonably decoupled.

---

# 26. Suggested Development Stack

Initial candidate:

### Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS

### 3D / World

Evaluate:

- Three.js
- React Three Fiber
- Drei

The simplest technology capable of producing the desired visual quality should win.

Do not choose an unnecessarily complex game engine merely because the portfolio looks like a game.

### Animation

Possible:

- Framer Motion for UI
- Three.js/R3F animation for the world

### Backend

Project-specific APIs.

Nightfall and Noctis should remain independently deployable where practical.

---

# 27. Development Phases

## Phase 1 — World Prototype

Build:

- Basic voxel environment
- Character
- Camera
- WASD movement
- Collision
- Doors
- Basic room layout

No project integrations yet.

### Goal

Walking around should already feel good.

---

## Phase 2 — Portfolio Framework

Build:

- HUD
- Menu
- Room detection
- Interaction system
- Responsive/mobile controls
- Accessibility fallback
- Basic project information system

---

## Phase 3 — Nightfall Room

Build:

- Industrial room
- Conveyor
- Products
- Camera
- Monitor
- Terminals
- Anomaly samples
- TRY IT YOURSELF sign

Then integrate:

- Image upload
- Camera capture
- Inference API
- Result visualization

Nightfall becomes the first fully functional showcase room.

---

## Phase 4 — Noctis Room

Build:

- Agent voxel entities
- Agent labels
- Agent workspaces
- Status states
- Work package objects
- Animated handoffs
- User input
- Noctis execution/integration
- Workflow visualization

---

## Phase 5 — Remaining Rooms

Build:

- Research
- About
- Contact
- Additional projects

Only create rooms when the underlying content justifies them.

---

## Phase 6 — Polish

Add:

- Lighting
- Animations
- Sound
- Environmental details
- Easter eggs
- Micro-interactions
- Improved transitions

---

## Phase 7 — Performance

Test:

- Desktop
- Low-end laptop
- Mobile
- Different browsers
- Slow network
- WebGL-disabled environments

Optimize assets and loading.

---

## Phase 8 — Deployment

Deploy production version.

Add:

- Custom domain
- Analytics
- Error monitoring
- API security
- Rate limiting
- SEO metadata
- Social preview
- Resume
- Contact functionality

---

# 28. MVP Definition

The first release does **not** need the entire vision.

The MVP should contain:

### World

- One central room
- Custom voxel character
- Third-person camera
- WASD controls
- Mobile joystick
- Basic HUD

### Nightfall

- Complete industrial room
- Interactive inspection station
- Image upload
- Real inference
- Result visualization

### Noctis

- Agent room
- Agent representations
- Handoff animation
- Basic interactive task input

### Standard UI

- Menu
- About
- Projects
- Resume
- Contact

If these elements work extremely well, the portfolio is already successful.

---

# 29. Success Criteria

The portfolio succeeds if a visitor can:

1. Understand who AJ is within approximately 30 seconds.
2. Navigate the world without instructions.
3. Discover at least one project naturally.
4. Run a real technical demonstration.
5. Understand what the project does.
6. Inspect technical details if desired.
7. Reach GitHub or the resume easily.
8. Contact AJ without friction.

The portfolio should produce the reaction:

> **"I've never seen a portfolio like this."**

followed by:

> **"And the projects are actually serious."**

---

# 30. Non-Goals

The project is **not** intended to become:

- A full video game
- A Minecraft clone
- A massive open world
- A multiplayer environment
- A physics sandbox
- A collection of decorative animations
- A replacement for a conventional resume

Every feature should justify itself by improving:

**discoverability, demonstration, storytelling, technical credibility, or memorability.**

---

# 31. Guiding Principle

The final experience should feel like:

> **A small interactive world built around the things I actually build.**

The visitor should not simply read about Nightfall.

They should enter the factory.

They should see the conveyor.

They should see the camera.

They should approach the glowing sign.

They should submit an image.

They should watch the model inspect it.

They should see the anomaly.

Then they should walk into another room and watch Noctis pass a task from one agent to another.

At that point, the portfolio has stopped being a webpage.

It has become a demonstration of the engineer behind it.