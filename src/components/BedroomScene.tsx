import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useCallback, useRef } from 'react';
import { Room } from './3d/Room';
import { DeskStation } from './3d/DeskStation';
import { NeuralBeams } from './3d/NeuralBeams';
import { CenterHub } from './3d/CenterHub';
import { CameraController, type CameraMode } from './3d/CameraController';
import { NeuralTV } from './3d/NeuralTV';
import { CameraControlPad } from './CameraControlPad';
import { OnboardingOverlay } from './panels/OnboardingOverlay';
import { TopBar } from './panels/TopBar';
import { TaskConsole } from './panels/TaskConsole';
import { ConnectionsPanel } from './panels/ConnectionsPanel';
import { Stars } from '@react-three/drei';
import type { AgentId, AgentEvent } from '@/lib/agents';

export type BeamState = 'idle' | 'collaboration' | 'processing' | 'success';
export type FocusTarget = 'overview' | 'desk1' | 'desk2' | 'desk3' | 'desk4';

const DESK_POSITIONS: [number, number, number][] = [
  [0, 0, -2.5],
  [2.5, 0, 0],
  [0, 0, 2.5],
  [-2.5, 0, 0],
];

const DESK_ROTATIONS: [number, number, number][] = [
  [0, 0, 0],
  [0, -Math.PI / 2, 0],
  [0, Math.PI, 0],
  [0, Math.PI / 2, 0],
];

const AI_NAMES = ['Kimi CLI', 'OpenClaw', 'Mac Mini', 'Raspberry Pi'];
const MODEL_PATHS = ['/models/kimi.glb', '/models/clawd.glb', '/models/macmini.glb', '/models/raspberrypi.glb'];

const AGENT_DESK_MAP: Record<AgentId, number> = {
  'kimi-cli': 0,
  'openclaw': 1,
  'mac-mini': 2,
  'raspberry-pi': 3,
};

export default function BedroomScene() {
  const [focusTarget, setFocusTarget] = useState<FocusTarget>('overview');
  const [beamState, setBeamState] = useState<BeamState>('idle');
  const [hoveredDesk, setHoveredDesk] = useState<number | null>(null);
  const [taskRunning, setTaskRunning] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('overview');

  // New state for panels
  const [primaryAgent, setPrimaryAgent] = useState<AgentId | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [tvStreamContent, setTvStreamContent] = useState('');
  const [tvStreamDone, setTvStreamDone] = useState(true);

  const handleSelectAgent = useCallback((agentId: AgentId) => {
    setPrimaryAgent(agentId);
    setShowOnboarding(false);
    const deskIdx = AGENT_DESK_MAP[agentId];
    setFocusTarget(`desk${deskIdx + 1}` as FocusTarget);
    setCameraMode('desk');
    // Auto-open console after a brief camera transition
    setTimeout(() => setConsoleOpen(true), 800);
  }, []);

  const handleAgentEvent = useCallback((event: AgentEvent) => {
    setAgentEvents(prev => [...prev.slice(-50), event]);
    // Update beam state based on events
    if (event.type === 'planning') setBeamState('collaboration');
    else if (event.type === 'generating') setBeamState('processing');
    else if (event.type === 'complete') {
      setBeamState('success');
      setTimeout(() => setBeamState('idle'), 2000);
    }
    else if (event.type === 'error') setBeamState('idle');
  }, []);

  const handleStreamUpdate = useCallback((agentId: AgentId, content: string, done: boolean) => {
    setTvStreamContent(content);
    setTvStreamDone(done);
  }, []);

  const handleDeskClick = useCallback((index: number) => {
    const target = `desk${index + 1}` as FocusTarget;
    setFocusTarget(prev => prev === target ? 'overview' : target);
    setCameraMode('desk');
  }, []);

  const handleSetMode = useCallback((mode: CameraMode) => {
    setCameraMode(mode);
    if (mode === 'overview' || mode === 'neural' || mode === 'overhead' || mode === 'tv') {
      setFocusTarget('overview');
    }
  }, []);

  const triggerTask = useCallback(() => {
    if (taskRunning) return;
    setTaskRunning(true);
    setBeamState('collaboration');
    setTimeout(() => setBeamState('processing'), 2000);
    setTimeout(() => {
      setBeamState('success');
      setTimeout(() => { setBeamState('idle'); setTaskRunning(false); }, 2000);
    }, 4000);
  }, [taskRunning]);

  return (
    <div className="w-screen h-screen relative">
      <Canvas
        shadows
        camera={{ position: [6, 5, 6], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#b8d4f0']} />
        <fog attach="fog" args={['#b8d4f0', 12, 30]} />
        
        <Suspense fallback={null}>
          <ambientLight intensity={0.8} color="#fffaf0" />
          <directionalLight position={[4, 8, 3]} intensity={1.5} color="#fff8e7" castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-4, 6, 2]} intensity={0.6} color="#e0e8ff" />
          <hemisphereLight args={['#87ceeb', '#c4a882', 0.4]} />

          <Room />
          <NeuralTV
            focusTarget={focusTarget}
            beamState={beamState}
            streamContent={tvStreamContent}
            streamDone={tvStreamDone}
            agentEvents={agentEvents}
            primaryAgent={primaryAgent}
          />

          {DESK_POSITIONS.map((pos, i) => (
            <DeskStation
              key={i}
              position={pos}
              rotation={DESK_ROTATIONS[i]}
              modelPath={MODEL_PATHS[i]}
              name={AI_NAMES[i]}
              index={i}
              isHovered={hoveredDesk === i}
              isFocused={focusTarget === `desk${i + 1}`}
              beamState={beamState}
              onHover={(h) => setHoveredDesk(h ? i : null)}
              onClick={() => handleDeskClick(i)}
            />
          ))}

          <CenterHub
            beamState={beamState}
            onClick={() => {
              if (focusTarget !== 'overview') {
                setFocusTarget('overview');
                setCameraMode('overview');
              } else {
                triggerTask();
              }
            }}
          />

          <NeuralBeams deskPositions={DESK_POSITIONS} beamState={beamState} />
          <Stars radius={50} depth={30} count={500} factor={2} fade speed={0.5} />
          <CameraController focusTarget={focusTarget} cameraMode={cameraMode} deskPositions={DESK_POSITIONS} />
        </Suspense>
      </Canvas>

      {/* Onboarding */}
      {showOnboarding && <OnboardingOverlay onSelect={handleSelectAgent} />}

      {/* Top Bar */}
      {primaryAgent && !showOnboarding && (
        <TopBar
          primaryAgent={primaryAgent}
          beamState={beamState}
          onOpenConsole={() => setConsoleOpen(!consoleOpen)}
          onOpenConnections={() => setConnectionsOpen(true)}
          onChangeAgent={() => setShowOnboarding(true)}
          consoleOpen={consoleOpen}
        />
      )}

      {/* Task Console */}
      {primaryAgent && (
        <TaskConsole
          primaryAgent={primaryAgent}
          onAgentEvent={handleAgentEvent}
          onStreamUpdate={handleStreamUpdate}
          isOpen={consoleOpen}
          onClose={() => setConsoleOpen(false)}
        />
      )}

      {/* Connections */}
      <ConnectionsPanel isOpen={connectionsOpen} onClose={() => setConnectionsOpen(false)} />

      {/* Camera Controls */}
      {!showOnboarding && <CameraControlPad onSetMode={handleSetMode} currentMode={cameraMode} />}

      {/* Bottom instructions */}
      {!showOnboarding && (
        <div className="absolute bottom-4 left-4 pointer-events-none z-10">
          <p className="text-muted-foreground/40 text-[9px] font-mono tracking-wider">
            CLICK DESK TO FOCUS • DRAG TO ROTATE • SCROLL TO ZOOM
          </p>
        </div>
      )}
    </div>
  );
}
