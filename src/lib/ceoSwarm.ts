import type { AgentId, AgentEvent } from './agents';

export type CEOPhase = 'idle' | 'strategic-breakdown' | 'parallel-work' | 'internal-review' | 'consolidation' | 'complete' | 'paused' | 'aborted';
export type DepthMode = 'fast' | 'balanced' | 'deep';

export interface CEOConfig {
  directive: string;
  depth: DepthMode;
  model: string;
  tokenCap: number;
  toolCallLimit: number;
  integrations: { github: boolean; slack: boolean; docs: boolean };
  browserAutomation?: boolean;
  autoApprove?: boolean;
}

export interface AgentTask {
  agentId: AgentId;
  label: string;
  status: 'pending' | 'running' | 'reviewing' | 'done' | 'error';
  output: string;
}

export interface CEOEvent {
  type: 'phase' | 'agent_message' | 'tool_call' | 'tool_result' | 'error' | 'final';
  actor: string;
  ts: number;
  severity: 'info' | 'warn' | 'error';
  safeTrace: string;
  payload?: Record<string, unknown>;
}

export interface CEOState {
  phase: CEOPhase;
  runId: string | null;
  tasks: AgentTask[];
  events: AgentEvent[];
  ceoEvents: CEOEvent[];
  finalOutput: string;
  error: string | null;
}

export const PHASE_LABELS: Record<CEOPhase, string> = {
  'idle': 'Idle',
  'strategic-breakdown': 'Phase A — Strategy',
  'parallel-work': 'Phase B — Execution',
  'internal-review': 'Phase C — Review',
  'consolidation': 'Phase D — Consolidation',
  'complete': 'Executive Output Ready',
  'paused': 'Paused',
  'aborted': 'Aborted',
};

const ACTOR_TO_AGENT: Record<string, AgentId> = {
  'KimiClaw': 'kimi-cli',
  'kimi-cli': 'kimi-cli',
  'openclaw': 'openclaw',
  'mac-mini': 'mac-mini',
  'raspberry-pi': 'raspberry-pi',
};

const CEO_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ceo-orchestrator`;

type StateCallback = (state: CEOState) => void;

export class CEOSwarmEngine {
  private state: CEOState = {
    phase: 'idle',
    runId: null,
    tasks: [],
    events: [],
    ceoEvents: [],
    finalOutput: '',
    error: null,
  };
  private abortController: AbortController | null = null;
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

  private notify() {
    this.onStateChange({ ...this.state });
  }

  private emitAgentEvent(agentId: AgentId, type: AgentEvent['type'], label: string) {
    const event: AgentEvent = { id: crypto.randomUUID(), timestamp: Date.now(), agentId, type, label };
    this.state.events = [...this.state.events.slice(-80), event];
    this.onAgentEvent(event);
  }

  abort() {
    this.abortController?.abort();
    this.state.phase = 'aborted';
    this.onBeamState('idle');
    this.notify();
  }

  async run(config: CEOConfig) {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.state = {
      phase: 'strategic-breakdown',
      runId: null,
      tasks: [],
      events: [],
      ceoEvents: [],
      finalOutput: '',
      error: null,
    };
    this.onBeamState('collaboration');
    this.notify();

    // Initialize tasks
    const agentIds: AgentId[] = ['kimi-cli', 'openclaw', 'mac-mini', 'raspberry-pi'];
    const agentLabels = ['Orchestration & Planning', 'Creative & UX Strategy', 'Technical Implementation', 'Automation & Integration'];
    this.state.tasks = agentIds.map((id, i) => ({
      agentId: id,
      label: agentLabels[i],
      status: 'pending' as const,
      output: '',
    }));
    this.notify();

    try {
      const resp = await fetch(`${CEO_URL}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          goal: config.directive,
          mode: config.depth,
          model: config.model,
          agents: agentIds,
          budgets: { maxTokens: config.tokenCap, maxToolCalls: config.toolCallLimit },
          toolPermissions: {
            github: config.integrations.github,
            slack: config.integrations.slack,
            docs: config.integrations.docs,
            browserAutomation: config.browserAutomation || false,
          },
        }),
        signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(err.error || `CEO run failed (${resp.status})`);
      }

      if (!resp.body) throw new Error('No response stream');

      // Parse SSE stream
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const event: CEOEvent = JSON.parse(jsonStr);
            this.state.ceoEvents = [...this.state.ceoEvents.slice(-100), event];
            this.processCEOEvent(event);
          } catch {
            // Skip unparseable
          }
        }
      }

      // If we reached here without error, ensure complete state
      if (this.state.phase !== 'complete' && this.state.phase !== 'aborted') {
        this.state.phase = 'complete';
        this.onBeamState('success');
        this.notify();
        setTimeout(() => this.onBeamState('idle'), 5000);
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      this.state.error = (e as Error).message;
      this.state.phase = 'aborted';
      this.onBeamState('idle');
      this.notify();
    }
  }

  private processCEOEvent(event: CEOEvent) {
    const agentId = ACTOR_TO_AGENT[event.actor] || 'kimi-cli';

    switch (event.type) {
      case 'phase': {
        const trace = event.safeTrace.toLowerCase();
        if (trace.includes('phase a') || trace.includes('strategic')) {
          this.state.phase = 'strategic-breakdown';
          this.onBeamState('collaboration');
          this.emitAgentEvent('kimi-cli', 'planning', event.safeTrace);
        } else if (trace.includes('phase b') || trace.includes('parallel')) {
          this.state.phase = 'parallel-work';
          this.onBeamState('processing');
          this.emitAgentEvent('kimi-cli', 'planning', event.safeTrace);
        } else if (trace.includes('phase c') || trace.includes('review')) {
          this.state.phase = 'internal-review';
          this.onBeamState('collaboration');
          this.emitAgentEvent('kimi-cli', 'reviewing', event.safeTrace);
        } else if (trace.includes('phase d') || trace.includes('consolidation')) {
          this.state.phase = 'consolidation';
          this.onBeamState('processing');
          this.emitAgentEvent('kimi-cli', 'generating', event.safeTrace);
        }
        break;
      }

      case 'agent_message': {
        const trace = event.safeTrace.toLowerCase();
        if (trace.includes('starting')) {
          const task = this.state.tasks.find(t => t.agentId === agentId);
          if (task) task.status = 'running';
          this.emitAgentEvent(agentId, 'generating', event.safeTrace);
        } else if (trace.includes('completed') || trace.includes('complete')) {
          const task = this.state.tasks.find(t => t.agentId === agentId);
          if (task) {
            task.status = 'done';
            task.output = (event.payload?.outputPreview as string) || (event.payload?.reviewPreview as string) || '';
          }
          this.emitAgentEvent(agentId, 'complete', event.safeTrace);
        } else {
          this.emitAgentEvent(agentId, 'generating', event.safeTrace);
        }
        break;
      }

      case 'tool_call':
        this.emitAgentEvent(agentId, 'tool_call', event.safeTrace);
        break;

      case 'error':
        this.state.error = event.safeTrace;
        this.state.phase = 'aborted';
        this.onBeamState('idle');
        this.emitAgentEvent(agentId, 'error', event.safeTrace);
        break;

      case 'final': {
        this.state.phase = 'complete';
        this.state.finalOutput = (event.payload?.finalOutput as string) || '';
        this.state.runId = (event.payload?.runId as string) || null;
        this.onBeamState('success');
        this.emitAgentEvent('kimi-cli', 'complete', 'Executive output ready');
        setTimeout(() => this.onBeamState('idle'), 5000);
        break;
      }
    }

    this.notify();
  }
}
