import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { BeamState } from '../BedroomScene';

interface DeskStationProps {
  position: [number, number, number];
  rotation: [number, number, number];
  modelPath: string;
  name: string;
  index: number;
  isHovered: boolean;
  isFocused: boolean;
  beamState: BeamState;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}

function Desk({ isHovered }: { isHovered: boolean }) {
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (glowRef.current) {
      glowRef.current.intensity = THREE.MathUtils.lerp(
        glowRef.current.intensity,
        isHovered ? 1.5 : 0,
        0.1
      );
    }
  });

  return (
    <group>
      {/* Desk top */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.06, 0.9]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Desk legs */}
      {[[-0.8, 0.375, -0.35], [0.8, 0.375, -0.35], [-0.8, 0.375, 0.35], [0.8, 0.375, 0.35]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.04, 0.75, 0.04]} />
          <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.7} />
        </mesh>
      ))}
      {/* Hover glow */}
      <pointLight ref={glowRef} position={[0, 1, 0]} color="#3b82f6" intensity={0} distance={3} />
    </group>
  );
}

function MonitorSetup({ index, beamState }: { index: number; beamState: BeamState }) {
  const screenRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (screenRef.current) {
      const t = clock.getElapsedTime();
      const pulse = 0.3 + Math.sin(t * 2 + index) * 0.1;
      screenRef.current.emissiveIntensity = beamState === 'processing' ? pulse + 0.3 : pulse;
    }
  });

  const screenColor = useMemo(() => {
    const colors = ['#1e3a5f', '#3a1f1f', '#1f3a2a', '#2a1f3a'];
    return colors[index];
  }, [index]);

  const emissiveColor = useMemo(() => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#8b5cf6'];
    return colors[index];
  }, [index]);

  return (
    <group position={[0, 1.1, -0.3]}>
      {/* Main monitor */}
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.5, 0.03]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[0.72, 0.42]} />
        <meshStandardMaterial
          ref={screenRef}
          color={screenColor}
          emissive={emissiveColor}
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[0.05, 0.12, 0.05]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Side monitor */}
      <mesh position={[0.5, 0, 0.1]} rotation={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.5, 0.35, 0.02]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.5, 0, 0.115]} rotation={[0, -0.3, 0]}>
        <planeGeometry args={[0.44, 0.28]} />
        <meshStandardMaterial color={screenColor} emissive={emissiveColor} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function AIModel({ modelPath, index }: { modelPath: string; index: number }) {
  const { scene } = useGLTF(modelPath);
  const modelRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (modelRef.current) {
      const t = clock.getElapsedTime();
      modelRef.current.position.y = 0.78 + Math.sin(t * 1.5 + index) * 0.02;
      modelRef.current.rotation.y = Math.sin(t * 0.3 + index * 2) * 0.1;
    }
  });

  return (
    <group ref={modelRef} position={[0, 0.78, 0.05]}>
      <primitive object={scene.clone()} scale={0.35} />
      {/* Ground shadow/glow */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 32]} />
        <meshStandardMaterial
          color="#000000"
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

export function DeskStation({
  position, rotation, modelPath, index,
  isHovered, isFocused, beamState,
  onHover, onClick
}: DeskStationProps) {
  return (
    <group position={position} rotation={rotation}>
      <group
        onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={() => onHover(false)}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <Desk isHovered={isHovered || isFocused} />
        <AIModel modelPath={modelPath} index={index} />
        <MonitorSetup index={index} beamState={beamState} />
      </group>
    </group>
  );
}

// Preload models
useGLTF.preload('/models/kimi.glb');
useGLTF.preload('/models/clawd.glb');
useGLTF.preload('/models/macmini.glb');
useGLTF.preload('/models/raspberrypi.glb');
