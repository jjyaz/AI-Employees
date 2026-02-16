import { AGENTS } from '@/lib/agents';
import { PHASE_LABELS, type CEOState, type CEOPhase, type CEOEvent } from '@/lib/ceoSwarm';
import { Pause, Play, Square, RotateCcw, History } from 'lucide-react';

interface CEOExecutionPanelProps {
  state: CEOState;
  onPause?: () => void;
  onResume?: () => void;
  onAbort: () => void;
  onClose: () => void;
}

const PHASE_ORDER: CEOPhase[] = ['strategic-breakdown', 'parallel-work', 'internal-review', 'consolidation', 'complete'];

function PhaseTimeline({ current }: { current: CEOPhase }) {
  const currentIdx = PHASE_ORDER.indexOf(current);
  const labels = ['A', 'B', 'C', 'D'];
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      {PHASE_ORDER.slice(0, 4).map((phase, i) => {
        const done = i < currentIdx || current === 'complete';
        const active = phase === current;
        return (
          <div key={phase} className="flex items-center gap-1 flex-1">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              done ? 'bg-accent' : active ? 'ceo-phase-bar-active' : 'bg-muted/30'
            }`} />
            <span className={`text-[7px] tracking-wider uppercase font-mono ${
              done ? 'text-accent' : active ? 'ceo-title-glow text-foreground' : 'text-muted-foreground/40'
            }`}>
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function CEOExecutionPanel({ state, onPause, onResume, onAbort, onClose }: CEOExecutionPanelProps) {
  const isRunning = !['idle', 'complete', 'aborted'].includes(state.phase);

  return (
    <div className="fixed right-4 top-16 bottom-20 z-40 w-[380px] flex flex-col ceo-execution-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ceo-gold/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-ceo-gold animate-pulse" />
          <span className="neural-subtitle text-[10px] ceo-title-glow">KIMICLAW CEO TASK</span>
          <span className="text-muted-foreground/50 text-[9px] font-mono">
            {PHASE_LABELS[state.phase]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isRunning && (
            <button onClick={onAbort} className="cam-control-btn w-6 h-6 !rounded text-destructive" title="Abort">
              <Square size={10} />
            </button>
          )}
          {!isRunning && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          )}
        </div>
      </div>

      {/* Phase Timeline */}
      <PhaseTimeline current={state.phase} />

      {/* KimiClaw CEO Panel */}
      <div className="mx-3 mb-1 p-2 rounded-lg border border-ceo-gold/20 bg-ceo-gold/5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">⚡</span>
          <span className="text-[8px] font-mono tracking-wider uppercase ceo-title-glow">KimiClaw — CEO</span>
        </div>
        <span className={`text-[7px] uppercase tracking-wider font-mono ${
          isRunning ? 'ceo-title-glow' : state.phase === 'complete' ? 'text-accent' : 'text-muted-foreground/40'
        }`}>
          {isRunning ? '● Orchestrating...' : state.phase === 'complete' ? '✓ Delivered' : '○ Idle'}
        </span>
      </div>

      {/* Agent Worker Panels */}
      <div className="grid grid-cols-2 gap-2 px-3 py-2">
        {state.tasks.map(task => {
          const agent = AGENTS.find(a => a.id === task.agentId);
          if (!agent) return null;
          return (
            <div key={task.agentId} className={`ceo-agent-card ${task.status === 'running' ? 'ceo-agent-active' : ''}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.color }} />
                <span className="text-[8px] font-mono tracking-wider uppercase text-foreground/80">{agent.name}</span>
              </div>
              <span className={`text-[7px] uppercase tracking-wider font-mono ${
                task.status === 'done' ? 'text-accent' :
                task.status === 'running' ? 'ceo-title-glow' :
                task.status === 'error' ? 'text-destructive' :
                'text-muted-foreground/40'
              }`}>
                {task.status === 'running' ? '● Working...' : task.status === 'done' ? '✓ Complete' : task.status === 'error' ? '✗ Error' : '○ Pending'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Event Log (safeTrace telemetry) */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 min-h-0">
        <p className="text-[8px] text-muted-foreground/40 tracking-wider uppercase font-mono mb-1">Telemetry Stream</p>
        {state.ceoEvents.slice(-25).map((ev, idx) => (
          <div key={idx} className="flex items-start gap-2 text-[9px] font-mono">
            <div className={`w-1 h-1 rounded-full mt-1 flex-shrink-0 ${
              ev.type === 'phase' ? 'bg-ceo-gold' :
              ev.type === 'error' ? 'bg-destructive' :
              ev.type === 'final' ? 'bg-accent' :
              'bg-muted-foreground/40'
            }`} style={ev.type === 'agent_message' ? { background: AGENTS.find(a => a.id === (ev.actor === 'KimiClaw' ? 'kimi-cli' : ev.actor))?.color } : undefined} />
            <div>
              <span className="text-muted-foreground/30 mr-1">{ev.actor}</span>
              <span className="text-muted-foreground/60">{ev.safeTrace}</span>
            </div>
          </div>
        ))}
        {/* Fallback to old events */}
        {state.ceoEvents.length === 0 && state.events.slice(-20).map(ev => {
          const agent = AGENTS.find(a => a.id === ev.agentId);
          return (
            <div key={ev.id} className="flex items-start gap-2 text-[9px] font-mono">
              <div className="w-1 h-1 rounded-full mt-1 flex-shrink-0" style={{ background: agent?.color || '#666' }} />
              <span className="text-muted-foreground/60">{ev.label}</span>
            </div>
          );
        })}
      </div>

      {/* Final Output */}
      {state.phase === 'complete' && state.finalOutput && (
        <div className="border-t border-ceo-gold/20 px-4 py-3 max-h-[200px] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-mono tracking-wider uppercase text-accent">✓ Executive Output</p>
            {state.runId && (
              <span className="text-[7px] font-mono text-muted-foreground/30" title="Run ID for replay">
                <History size={8} className="inline mr-0.5" />
                {state.runId.slice(0, 8)}
              </span>
            )}
          </div>
          <div className="text-[10px] text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {state.finalOutput.slice(0, 2000)}
          </div>
        </div>
      )}

      {state.error && (
        <div className="border-t border-destructive/30 px-4 py-3">
          <p className="text-[9px] font-mono text-destructive">Error: {state.error}</p>
        </div>
      )}
    </div>
  );
}
