import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useCallback } from 'react';
import { Room } from './3d/Room';
import { DeskStation } from './3d/DeskStation';
import { NeuralBeams } from './3d/NeuralBeams';
import { CenterHub } from './3d/CenterHub';
import { CameraController, type CameraMode } from './3d/CameraController';
import { NeuralTV } from './3d/NeuralTV';
import { HUD } from './HUD';
import { CameraControlPad } from './CameraControlPad';
import { Stars } from '@react-three/drei';

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

const AI_NAMES = ['Kimi CLI', 'Clawd', 'Mac Mini', 'Raspberry Pi'];
const MODEL_PATHS = ['/models/kimi.glb', '/models/clawd.glb', '/models/macmini.glb', '/models/raspberrypi.glb'];

export default function BedroomScene() {
  const [focusTarget, setFocusTarget] = useState<FocusTarget>('overview');
  const [beamState, setBeamState] = useState<BeamState>('idle');
  const [hoveredDesk, setHoveredDesk] = useState<number | null>(null);
  const [taskRunning, setTaskRunning] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('overview');

  const triggerTask = useCallback(() => {
    if (taskRunning) return;
    setTaskRunning(true);
    setBeamState('collaboration');
    setTimeout(() => setBeamState('processing'), 2000);
    setTimeout(() => {
      setBeamState('success');
      setTimeout(() => {
        setBeamState('idle');
        setTaskRunning(false);
      }, 2000);
    }, 4000);
  }, [taskRunning]);

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
          <directionalLight
            position={[4, 8, 3]}
            intensity={1.5}
            color="#fff8e7"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-4, 6, 2]} intensity={0.6} color="#e0e8ff" />
          <hemisphereLight args={['#87ceeb', '#c4a882', 0.4]} />

          <Room />

          <NeuralTV focusTarget={focusTarget} beamState={beamState} />

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
          
          <CameraController
            focusTarget={focusTarget}
            cameraMode={cameraMode}
            deskPositions={DESK_POSITIONS}
          />
        </Suspense>
      </Canvas>

      <HUD
        focusTarget={focusTarget}
        beamState={beamState}
        hoveredDesk={hoveredDesk}
        aiNames={AI_NAMES}
        taskRunning={taskRunning}
        onTriggerTask={triggerTask}
        onResetView={() => { setFocusTarget('overview'); setCameraMode('overview'); }}
      />

      <CameraControlPad onSetMode={handleSetMode} currentMode={cameraMode} />
    </div>
  );
}
