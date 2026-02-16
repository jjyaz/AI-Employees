import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BeamState } from '../BedroomScene';

interface NeuralBeamsProps {
  deskPositions: [number, number, number][];
  beamState: BeamState;
}

const BEAM_COLORS: Record<BeamState, string> = {
  idle: '#3b82f6',
  collaboration: '#8b5cf6',
  processing: '#ef4444',
  success: '#10b981',
};

function BeamLine({ start, end, beamState }: {
  start: [number, number, number];
  end: [number, number, number];
  beamState: BeamState;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (start[0] + end[0]) / 2,
      1.8 + Math.random() * 0.5,
      (start[2] + end[2]) / 2,
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...end)
    );
  }, [start, end]);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 32, 0.015, 8, false);
  }, [curve]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      const t = clock.getElapsedTime();
      const targetOpacity = beamState === 'idle' ? 0.15 : 0.7;
      matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetOpacity, 0.05);
      matRef.current.emissiveIntensity = beamState === 'idle'
        ? 0.3 + Math.sin(t * 2) * 0.1
        : 1.5 + Math.sin(t * 4) * 0.5;
    }
  });

  const color = BEAM_COLORS[beamState];

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        ref={matRef}
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function PulseParticle({ curve, beamState, offset }: {
  curve: THREE.QuadraticBezierCurve3;
  beamState: BeamState;
  offset: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current && beamState !== 'idle') {
      const t = ((clock.getElapsedTime() * 0.5 + offset) % 1);
      const pos = curve.getPoint(t);
      meshRef.current.position.copy(pos);
      meshRef.current.visible = true;
      const scale = 0.03 + Math.sin(t * Math.PI) * 0.02;
      meshRef.current.scale.setScalar(scale * 30);
    } else if (meshRef.current) {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshStandardMaterial
        color={BEAM_COLORS[beamState]}
        emissive={BEAM_COLORS[beamState]}
        emissiveIntensity={3}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

export function NeuralBeams({ deskPositions, beamState }: NeuralBeamsProps) {
  const center: [number, number, number] = [0, 1.2, 0];

  const beamData = useMemo(() => {
    return deskPositions.map((pos) => {
      const start: [number, number, number] = [pos[0], 1.2, pos[2]];
      const mid: [number, number, number] = [
        (start[0] + center[0]) / 2,
        1.8 + Math.random() * 0.3,
        (start[2] + center[2]) / 2,
      ];
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...start),
        new THREE.Vector3(...mid),
        new THREE.Vector3(...center)
      );
      return { start, curve };
    });
  }, [deskPositions]);

  return (
    <group>
      {beamData.map((data, i) => (
        <group key={i}>
          <BeamLine start={data.start} end={center} beamState={beamState} />
          <PulseParticle curve={data.curve} beamState={beamState} offset={i * 0.25} />
        </group>
      ))}
    </group>
  );
}
