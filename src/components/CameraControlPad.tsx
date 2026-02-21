import {
  RotateCcw, RotateCw, ChevronUp, ChevronDown,
  ZoomIn, ZoomOut, Home, Crosshair, Monitor, Eye, Frame
} from 'lucide-react';
import type { CameraMode } from './3d/CameraController';

interface CameraControlPadProps {
  onSetMode: (mode: CameraMode) => void;
  currentMode: CameraMode;
}

const controls = [
  { icon: Home, label: 'Reset View', mode: 'overview' as CameraMode },
  { icon: Crosshair, label: 'Focus Center', mode: 'neural' as CameraMode },
  { icon: Monitor, label: 'Focus TV', mode: 'tv' as CameraMode },
  { icon: Eye, label: 'Overhead', mode: 'overhead' as CameraMode },
  { icon: Frame, label: 'Wall Art', mode: 'wallart' as CameraMode },
];

export function CameraControlPad({ onSetMode, currentMode }: CameraControlPadProps) {
  return (
    <div className="absolute top-1/2 right-5 -translate-y-1/2 flex flex-col gap-1.5 z-10">
      {controls.map(({ icon: Icon, label, mode }) => (
        <button
          key={mode}
          onClick={() => onSetMode(mode)}
          title={label}
          className={`cam-control-btn ${currentMode === mode ? 'cam-control-btn-active' : ''}`}
        >
          <Icon size={14} />
        </button>
      ))}
      <div className="h-px bg-border/20 my-1" />
      <span className="cam-control-label">CAM</span>
    </div>
  );
}
