import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BeamState } from '../BedroomScene';

interface FloorLampProps {
  position: [number, number, number];
  beamState?: BeamState;
}

export function FloorLamp({ position, beamState = 'idle' }: FloorLampProps) {
  const lightRef = useRef<THREE.PointLight>(null);
  const shadeMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const targetIntensity = useMemo(() => {
    switch (beamState) {
      case 'collaboration': return 1.8;
      case 'processing': return 2.0;
      case 'success': return 2.4;
      default: return 1.4;
    }
  }, [beamState]);

  const targetEmissive = useMemo(() => {
    switch (beamState) {
      case 'collaboration': return 0.6;
      case 'processing': return 0.7;
      case 'success': return 0.9;
      default: return 0.4;
    }
  }, [beamState]);

  useFrame(({ clock }) => {
    if (!lightRef.current || !shadeMatRef.current) return;
    const t = clock.getElapsedTime();

    let intensity = targetIntensity;
    // Very faint pulse during processing (premium, barely noticeable)
    if (beamState === 'processing') {
      intensity += Math.sin(t * 1.5) * 0.15;
    }

    lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, intensity, 0.04);
    shadeMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      shadeMatRef.current.emissiveIntensity, targetEmissive, 0.04
    );
  });

  return (
    <group position={position}>
      {/* Base disc */}
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.04, 16]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Stand pole */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 3.16, 8]} />
        <meshStandardMaterial color="#333" roughness={0.35} metalness={0.8} />
      </mesh>

      {/* Neck bend */}
      <mesh position={[0, 3.15, 0]} castShadow>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#333" roughness={0.35} metalness={0.8} />
      </mesh>

      {/* Lampshade - tapered cylinder */}
      <mesh position={[0, 3.4, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.28, 0.45, 16, 1, true]} />
        <meshStandardMaterial
          ref={shadeMatRef}
          color="#f5edd6"
          emissive="#ffebc8"
          emissiveIntensity={0.4}
          roughness={0.9}
          metalness={0}
          side={THREE.DoubleSide}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Shade top cap */}
      <mesh position={[0, 3.625, 0]}>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial color="#f5edd6" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Warm point light inside shade */}
      <pointLight
        ref={lightRef}
        position={[0, 3.35, 0]}
        color="#ffe4b5"
        intensity={1.4}
        distance={7}
        decay={2}
        castShadow={false}
      />
    </group>
  );
}
