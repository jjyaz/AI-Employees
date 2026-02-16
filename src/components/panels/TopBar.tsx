import { AGENTS, AVAILABLE_MODELS, type AgentId } from '@/lib/agents';
import type { BeamState } from '../BedroomScene';
import type { CameraMode } from '../3d/CameraController';

interface TopBarProps {
  primaryAgent: AgentId;
  beamState: BeamState;
  onOpenConsole: () => void;
  onOpenConnections: () => void;
  onChangeAgent: () => void;
  consoleOpen: boolean;
}

const STATE_LABELS: Record<BeamState, { label: string; className: string }> = {
  idle: { label: 'IDLE', className: 'neural-badge-blue' },
  collaboration: { label: 'COLLABORATING', className: 'neural-badge-purple' },
  processing: { label: 'PROCESSING', className: 'neural-badge-red' },
  success: { label: 'TASK COMPLETE', className: 'neural-badge-green' },
};

export function TopBar({
  primaryAgent, beamState, onOpenConsole, onOpenConnections, onChangeAgent, consoleOpen
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
        <button onClick={onOpenConnections} className="top-bar-btn">
          Connections
        </button>
      </div>

      {/* Right: Status */}
      <div className="flex items-center gap-2">
        <span className={`${stateInfo.className} animate-pulse-glow`}>
          {stateInfo.label}
        </span>
      </div>
    </div>
  );
}
