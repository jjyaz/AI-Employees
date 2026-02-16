import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { BeamState } from '../BedroomScene';

const BEAM_COLORS: Record<BeamState, string> = {
  idle: '#3b82f6',
  collaboration: '#8b5cf6',
  processing: '#ef4444',
  success: '#10b981',
};

export function CenterHub({ beamState, onClick }: { beamState: BeamState; onClick: () => void }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const { scene } = useGLTF('/models/center-item.glb');

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.y = t * 0.2;
    }
    if (innerRef.current) {
      (innerRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        beamState === 'idle' ? 0.3 + Math.sin(t) * 0.1 : 1 + Math.sin(t * 3) * 0.5;
    }
    if (glowRef.current) {
      glowRef.current.intensity = beamState === 'idle' ? 0.5 : 2 + Math.sin(t * 3) * 0.5;
      glowRef.current.color.set(BEAM_COLORS[beamState]);
    }
  });

  const color = BEAM_COLORS[beamState];

  return (
    <group position={[0, 0, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Circular rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <circleGeometry args={[1.2, 64]} />
        <meshStandardMaterial color="#151d30" roughness={0.9} />
      </mesh>

      {/* Rug ring accent */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.0, 1.15, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Inner hub glow */}
      <mesh ref={innerRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* 3D model in center */}
      <primitive object={scene} position={[0, 0.3, 0]} scale={0.5} />

      <pointLight ref={glowRef} position={[0, 0.5, 0]} color={color} intensity={0.5} distance={5} />
    </group>
  );
}
