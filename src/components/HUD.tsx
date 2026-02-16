import type { BeamState, FocusTarget } from './BedroomScene';

interface HUDProps {
  focusTarget: FocusTarget;
  beamState: BeamState;
  hoveredDesk: number | null;
  aiNames: string[];
  taskRunning: boolean;
  onTriggerTask: () => void;
  onResetView: () => void;
}

const STATE_LABELS: Record<BeamState, { label: string; className: string }> = {
  idle: { label: 'IDLE', className: 'neural-badge-blue' },
  collaboration: { label: 'COLLABORATING', className: 'neural-badge-purple' },
  processing: { label: 'PROCESSING', className: 'neural-badge-red' },
  success: { label: 'TASK COMPLETE', className: 'neural-badge-green' },
};

export function HUD({
  focusTarget, beamState, hoveredDesk, aiNames,
  taskRunning, onTriggerTask, onResetView
}: HUDProps) {
  const stateInfo = STATE_LABELS[beamState];

  return (
    <>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between pointer-events-none">
        <div>
          <h1 className="neural-title text-xl md:text-2xl">AI Employees</h1>
          <p className="neural-subtitle mt-1">Neural Bedroom Lab</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`${stateInfo.className} animate-pulse-glow`}>
            {stateInfo.label}
          </span>
        </div>
      </div>

      {/* Hovered desk label */}
      {hoveredDesk !== null && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120px] pointer-events-none">
          <div className="hud-panel px-4 py-2 text-center">
            <p className="neural-subtitle text-xs">{aiNames[hoveredDesk]}</p>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <button
          onClick={onTriggerTask}
          disabled={taskRunning}
          className="hud-panel px-5 py-2.5 neural-subtitle text-xs cursor-pointer 
                     hover:border-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {taskRunning ? 'TASK RUNNING...' : 'TRIGGER NEURAL TASK'}
        </button>
        {focusTarget !== 'overview' && (
          <button
            onClick={onResetView}
            className="hud-panel px-4 py-2.5 neural-subtitle text-xs cursor-pointer hover:border-primary/50 transition-colors"
          >
            OVERVIEW
          </button>
        )}
      </div>

      {/* Bottom-left instructions */}
      <div className="absolute bottom-6 left-6 pointer-events-none">
        <p className="text-muted-foreground/50 text-[10px] font-mono tracking-wider">
          CLICK DESK TO FOCUS • DRAG TO ROTATE • SCROLL TO ZOOM
        </p>
      </div>
    </>
  );
}
