import type { AgentId, AgentEvent, Message } from './agents';
import { streamAgentChat } from './agentStream';

export type CEOPhase = 'idle' | 'strategic-breakdown' | 'parallel-work' | 'internal-review' | 'consolidation' | 'complete' | 'paused' | 'aborted';
export type DepthMode = 'fast' | 'balanced' | 'deep';

export interface CEOConfig {
  directive: string;
  depth: DepthMode;
  model: string;
  tokenCap: number;
  toolCallLimit: number;
  integrations: { github: boolean; slack: boolean; docs: boolean };
}

export interface AgentTask {
  agentId: AgentId;
  label: string;
  status: 'pending' | 'running' | 'reviewing' | 'done' | 'error';
  output: string;
}

export interface CEOState {
  phase: CEOPhase;
  tasks: AgentTask[];
  events: AgentEvent[];
  finalOutput: string;
  error: string | null;
}

const PHASE_LABELS: Record<CEOPhase, string> = {
  'idle': 'Idle',
  'strategic-breakdown': 'Phase 1 — Strategic Breakdown',
  'parallel-work': 'Phase 2 — Parallel Execution',
  'internal-review': 'Phase 3 — Internal Review',
  'consolidation': 'Phase 4 — Final Consolidation',
  'complete': 'Executive Output Ready',
  'paused': 'Paused',
  'aborted': 'Aborted',
};

export { PHASE_LABELS };

type StateCallback = (state: CEOState) => void;

export class CEOSwarmEngine {
  private state: CEOState = {
    phase: 'idle',
    tasks: [],
    events: [],
    finalOutput: '',
    error: null,
  };
  private abortController: AbortController | null = null;
  private paused = false;
  private onStateChange: StateCallback;
  private onAgentEvent: (event: AgentEvent) => void;
  private onBeamState: (state: 'idle' | 'collaboration' | 'processing' | 'success') => void;

  constructor(
    onStateChange: StateCallback,
    onAgentEvent: (event: AgentEvent) => void,
    onBeamState: (state: 'idle' | 'collaboration' | 'processing' | 'success') => void,
  ) {
    this.onStateChange = onStateChange;
    this.onAgentEvent = onAgentEvent;
    this.onBeamState = onBeamState;
  }

  private emit(event: AgentEvent) {
    this.state.events = [...this.state.events.slice(-80), event];
    this.onAgentEvent(event);
    this.notify();
  }

  private notify() {
    this.onStateChange({ ...this.state });
  }

  private makeEvent(agentId: AgentId, type: AgentEvent['type'], label: string): AgentEvent {
    return { id: crypto.randomUUID(), timestamp: Date.now(), agentId, type, label };
  }

  pause() { this.paused = true; this.state.phase = 'paused'; this.notify(); }
  resume() { this.paused = false; this.notify(); }
  abort() {
    this.abortController?.abort();
    this.state.phase = 'aborted';
    this.onBeamState('idle');
    this.notify();
  }

  async run(config: CEOConfig) {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    this.state = { phase: 'idle', tasks: [], events: [], finalOutput: '', error: null };
    this.onBeamState('collaboration');

    try {
      // Phase 1: Strategic Breakdown (Kimi CLI)
      this.state.phase = 'strategic-breakdown';
      this.notify();
      this.emit(this.makeEvent('kimi-cli', 'planning', 'Decomposing executive directive...'));

      const breakdownPrompt = `You are the orchestrator. Break down this executive directive into exactly 4 subtasks, one for each team member:
1. Kimi CLI (yourself) - Planning & orchestration subtask
2. OpenClaw - Creative & UX subtask  
3. Mac Mini - Technical implementation subtask
4. Raspberry Pi - Automation & integration subtask

Directive: "${config.directive}"

Depth mode: ${config.depth}

Respond with a structured breakdown. Format each subtask as:
**[Agent Name]**: [specific subtask description]

Be specific and actionable.`;

      const breakdownOutput = await this.streamAgent('kimi-cli', breakdownPrompt, config.model, signal);
      if (signal.aborted) return;

      // Parse tasks from breakdown
      const agentIds: AgentId[] = ['kimi-cli', 'openclaw', 'mac-mini', 'raspberry-pi'];
      const agentLabels = ['Orchestration & Planning', 'Creative & UX Strategy', 'Technical Implementation', 'Automation & Integration'];
      this.state.tasks = agentIds.map((id, i) => ({
        agentId: id,
        label: agentLabels[i],
        status: 'pending' as const,
        output: '',
      }));
      this.notify();

      // Phase 2: Parallel Work
      this.state.phase = 'parallel-work';
      this.onBeamState('processing');
      this.notify();

      const workPrompts = [
        `Based on this strategic breakdown, execute YOUR orchestration subtask. The directive: "${config.directive}"\n\nBreakdown:\n${breakdownOutput}\n\nFocus on your planning & coordination role. Produce structured output.`,
        `Based on this strategic breakdown, execute YOUR creative subtask. The directive: "${config.directive}"\n\nBreakdown:\n${breakdownOutput}\n\nFocus on creative ideation, naming, copy, and UX strategy. Produce creative output.`,
        `Based on this strategic breakdown, execute YOUR technical subtask. The directive: "${config.directive}"\n\nBreakdown:\n${breakdownOutput}\n\nFocus on code, architecture, and implementation details. Produce technical output with code examples.`,
        `Based on this strategic breakdown, execute YOUR automation subtask. The directive: "${config.directive}"\n\nBreakdown:\n${breakdownOutput}\n\nFocus on automation scripts, integration hooks, and deployment steps. Produce actionable automation output.`,
      ];

      // Run agents sequentially but stream each (parallel would hit rate limits)
      for (let i = 0; i < agentIds.length; i++) {
        if (signal.aborted) return;
        while (this.paused) await new Promise(r => setTimeout(r, 300));

        this.state.tasks[i].status = 'running';
        this.emit(this.makeEvent(agentIds[i], 'generating', `${agentLabels[i]} in progress...`));
        this.notify();

        const output = await this.streamAgent(agentIds[i], workPrompts[i], config.model, signal);
        this.state.tasks[i].output = output;
        this.state.tasks[i].status = 'done';
        this.emit(this.makeEvent(agentIds[i], 'complete', `${agentLabels[i]} complete`));
        this.notify();
      }

      // Phase 3: Internal Review (Kimi CLI reviews all)
      this.state.phase = 'internal-review';
      this.onBeamState('collaboration');
      this.notify();
      this.emit(this.makeEvent('kimi-cli', 'reviewing', 'Reviewing all agent outputs...'));

      const allOutputs = this.state.tasks.map(t => `### ${t.label} (${t.agentId})\n${t.output}`).join('\n\n---\n\n');
      const reviewPrompt = `You are the coordinator. Review these outputs from all agents for the directive: "${config.directive}"

${allOutputs}

Identify any conflicts, gaps, or improvements. Provide a brief review summary with recommendations.`;

      const reviewOutput = await this.streamAgent('kimi-cli', reviewPrompt, config.model, signal);
      if (signal.aborted) return;

      // Phase 4: Final Consolidation
      this.state.phase = 'consolidation';
      this.onBeamState('processing');
      this.notify();
      this.emit(this.makeEvent('kimi-cli', 'generating', 'Producing executive output...'));

      const consolidationPrompt = `Produce the FINAL EXECUTIVE OUTPUT for: "${config.directive}"

Agent outputs:
${allOutputs}

Review notes:
${reviewOutput}

Format as:
## Executive Summary
[2-3 sentence summary]

## Key Decisions
[Bullet list]

## Deliverables
[Numbered deliverables with details]

## Next Steps
[Recommended follow-up actions]

Be comprehensive but concise. This is the final deliverable.`;

      const finalOutput = await this.streamAgent('kimi-cli', consolidationPrompt, config.model, signal);
      this.state.finalOutput = finalOutput;

      // Complete
      this.state.phase = 'complete';
      this.onBeamState('success');
      this.emit(this.makeEvent('kimi-cli', 'complete', 'Executive output ready'));
      this.notify();

      setTimeout(() => this.onBeamState('idle'), 5000);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      this.state.error = (e as Error).message;
      this.state.phase = 'aborted';
      this.onBeamState('idle');
      this.notify();
    }
  }

  private streamAgent(agentId: AgentId, prompt: string, model: string, signal: AbortSignal): Promise<string> {
    return new Promise((resolve, reject) => {
      let content = '';
      streamAgentChat({
        messages: [{ role: 'user', content: prompt }],
        agentId,
        model,
        maxTokens: 2048,
        temperature: 0.7,
        onDelta: (chunk) => { content += chunk; },
        onEvent: (ev) => { this.emit(ev); },
        onDone: () => resolve(content),
        onError: (err) => reject(new Error(err)),
        signal,
      });
    });
  }
}
