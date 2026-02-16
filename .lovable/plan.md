

# Write a Comprehensive README for AI Employees

## Overview
Create a detailed, professional `README.md` file for the GitHub repository that showcases the AI Employees - Neural Bedroom Lab project. The README will include the uploaded hero image and document every feature of the project.

## What Will Be Created

A single `README.md` file replacement with the following sections:

### 1. Hero Section
- Project title: **AI Employees -- Neural Bedroom Lab**
- The uploaded image (copied to `public/images/hero.jpg` and referenced via relative path)
- The 160-character professional bio as subtitle
- Badges for key technologies (React, Three.js, TypeScript, Tailwind CSS)

### 2. Table of Contents
Linked navigation to all major sections.

### 3. About the Project
- High-level description of the cinematic 3D neural command center concept
- What makes it unique: real AI agents, real streaming responses, immersive 3D environment

### 4. The AI Agents (Employees)
Detailed profiles for each of the four agents:
- **Kimi CLI** -- Planner: Task decomposition, routing, tool calling, orchestration
- **OpenClaw** -- Creative: Ideation, copywriting, UX thinking, product strategy
- **Mac Mini** -- Coder: Clean code, architecture, debugging, documentation
- **Raspberry Pi** -- Edge Automator: Webhooks, automation, monitoring, IoT patterns

### 5. Features
Document every implemented feature:

**3D Environment**
- Immersive bedroom lab rendered with React Three Fiber
- Four desk stations with GLB character models
- Neural TV with per-agent visualizations (terminal, mind map, CPU bars, IoT network)
- Neural beams connecting desks to center hub
- Cloud wall material with dynamic state-reactive shading
- Floor lamps with ambient reactive lighting
- Star field background with intensity tied to beam state
- Camera controller with multiple modes (overview, desk focus, neural, overhead, TV)

**Agent System**
- Real AI streaming via backend edge function
- Multi-model support (Gemini 2.5/3 Pro/Flash/Lite, GPT-5/5-mini/5-nano/5.2)
- Agent event timeline (planning, research, tool call, generating, reviewing, complete, error)
- Task console with chat interface and model selector

**CEO Task Mode**
- Premium multi-agent swarm orchestration
- Executive Directive modal with depth selector (Fast / Balanced / Deep)
- Token cap and tool call limit budget controls
- Four-phase execution pipeline: Strategic Breakdown, Parallel Work, Internal Review, Final Consolidation
- Real-time execution panel with per-agent status tracking
- Pause, Resume, and Abort controls
- Structured executive output (Summary, Key Decisions, Deliverables, Next Steps)

**Connection Dock (MCP Integrations)**
- 3D hardware rack labeled "External Systems" near the TV
- Five integration modules: GitHub, Slack, Google Drive, Webhook Bridge, Local Workspace
- Per-integration status LEDs (connected, needs-reauth, error, disconnected)
- Per-agent integration permission toggles
- Integrations panel with glass-morphism UI
- Dynamic glow and pulse animations based on activity state

**Onboarding**
- Agent selection overlay on first visit
- Ability to switch primary agent from top bar

**Camera System**
- Camera control pad with preset modes
- Smooth interpolated transitions between views
- Desk focus, overview, neural, overhead, and TV angles

### 6. Tech Stack
- React 18 + TypeScript
- Vite (build tool)
- Three.js / React Three Fiber / Drei
- Tailwind CSS + shadcn/ui
- Lovable Cloud (backend)
- Recharts (data visualization)
- Zod (validation)
- React Router DOM
- TanStack React Query

### 7. Getting Started
- Prerequisites (Node.js, npm)
- Clone, install, and run instructions
- Environment variables setup

### 8. Project Structure
Key directories and files overview.

### 9. Architecture
Text description of the data flow:
- User selects agent via onboarding
- Task console sends messages to backend edge function
- Edge function streams responses back via SSE
- Agent events drive beam state, TV visualization, and room ambient effects
- CEO Task Mode coordinates all four agents through the CEOSwarmEngine class

### 10. License & Credits

## Technical Details

- Copy the uploaded image to `public/images/hero.jpg`
- Reference it in README as `![AI Employees](public/images/hero.jpg)`
- Write the entire README.md as a single file replacement
- Use professional markdown formatting with clean section hierarchy

