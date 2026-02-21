import { AGENTS, AVAILABLE_MODELS, type AgentId } from '@/lib/agents';
import type { BeamState } from '../BedroomScene';

interface TopBarProps {
  primaryAgent: AgentId;
  beamState: BeamState;
  onOpenConsole: () => void;
  onOpenConnections: () => void;
  onOpenIntegrations: () => void;
  onOpenCEOTask: () => void;
  onOpenUseCases: () => void;
  onChangeAgent: () => void;
  consoleOpen: boolean;
  ceoActive: boolean;
}

const STATE_LABELS: Record<BeamState, { label: string; className: string }> = {
  idle: { label: 'IDLE', className: 'neural-badge-blue' },
  collaboration: { label: 'COLLABORATING', className: 'neural-badge-purple' },
  processing: { label: 'PROCESSING', className: 'neural-badge-red' },
  success: { label: 'TASK COMPLETE', className: 'neural-badge-green' },
};

export function TopBar({
  primaryAgent, beamState, onOpenConsole, onOpenConnections, onOpenIntegrations, onOpenCEOTask, onOpenUseCases, onChangeAgent, consoleOpen, ceoActive
}: TopBarProps) {
  const agent = AGENTS.find(a => a.id === primaryAgent)!;
  const stateInfo = STATE_LABELS[beamState];

  return (
    <div className="absolute top-0 left-0 right-0 z-30 px-5 py-4 flex items-center justify-between pointer-events-none">
      {/* Left: Title */}
      <div>
        <h1 className="neural-title text-lg md:text-xl">AI Employees</h1>
        <p className="neural-subtitle mt-0.5 text-[10px]">Neural Bedroom Lab</p>
      </div>

      {/* Center: Agent + controls */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button onClick={onChangeAgent} className="top-bar-btn" title="Change Employee">
          <div className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: agent.color }} />
          <span>{agent.name}</span>
        </button>
        <button
          onClick={onOpenConsole}
          className={`top-bar-btn ${consoleOpen ? 'top-bar-btn-active' : ''}`}
        >
          Task Console
        </button>
        <button onClick={onOpenUseCases} className="top-bar-btn top-bar-btn-usecase">
          📚 Use Cases
        </button>
        <button onClick={onOpenIntegrations} className="top-bar-btn">
          Integrations
        </button>
        <button onClick={onOpenConnections} className="top-bar-btn">
          Connections
        </button>
        <button
          onClick={onOpenCEOTask}
          className={`top-bar-btn top-bar-btn-ceo ${ceoActive ? 'top-bar-btn-active' : ''}`}
        >
          ⚡ CEO Task (KimiClaw)
        </button>
      </div>

      {/* Right: Status + GitHub */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <span className={`${stateInfo.className} animate-pulse-glow`}>
          {stateInfo.label}
        </span>
        <a
          href="https://github.com/jjyaz/AI-Employees"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/60 hover:text-white transition-colors"
          title="View on GitHub"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
