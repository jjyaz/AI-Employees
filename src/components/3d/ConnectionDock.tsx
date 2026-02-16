import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { IntegrationStatus } from '@/lib/integrations';

interface ConnectionDockProps {
  integrationStatuses: { id: string; status: IntegrationStatus; color: string }[];
  activeIntegrationId?: string | null;
}

const MODULE_SPACING = 0.35;
const RACK_Y = 1.8;
const RACK_Z = -5.35;
const RACK_X = 3.2;

function DockModule({ index, status, color, isActive }: {
  index: number; status: IntegrationStatus; color: string; isActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const y = RACK_Y + index * MODULE_SPACING;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (glowRef.current) {
      const baseIntensity = status === 'connected' ? 0.4 : status === 'active' ? 0.8 : status === 'error' ? 0.6 : 0.05;
      const pulse = isActive ? Math.sin(t * 4 + index) * 0.3 : Math.sin(t * 1.5 + index) * 0.1;
      glowRef.current.intensity = baseIntensity + pulse;
    }
    if (matRef.current) {
      const emissiveTarget = status === 'disconnected' ? 0.1 : status === 'error' ? 1.5 : isActive ? 2.0 : 0.6;
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(matRef.current.emissiveIntensity, emissiveTarget, 0.05);
    }
    if (meshRef.current && isActive) {
      meshRef.current.scale.x = 1 + Math.sin(t * 3) * 0.02;
    } else if (meshRef.current) {
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.1);
    }
  });

  const moduleColor = status === 'disconnected' ? '#333' : status === 'error' ? '#ef4444' : color;

  return (
    <group position={[RACK_X, y, RACK_Z]}>
      {/* Module body */}
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.25, 0.12, 0.08]} />
        <meshStandardMaterial
          ref={matRef}
          color={moduleColor}
          emissive={moduleColor}
          emissiveIntensity={0.3}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      {/* Status LED */}
      <mesh position={[0.1, 0.04, 0.04]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial
          color={status === 'connected' || status === 'active' ? '#10b981' : status === 'error' ? '#ef4444' : status === 'needs-reauth' ? '#f59e0b' : '#444'}
          emissive={status === 'connected' || status === 'active' ? '#10b981' : status === 'error' ? '#ef4444' : status === 'needs-reauth' ? '#f59e0b' : '#222'}
          emissiveIntensity={status === 'disconnected' ? 0.5 : 2}
        />
      </mesh>
      {/* Glow light */}
      <pointLight
        ref={glowRef}
        color={moduleColor}
        intensity={0.2}
        distance={1.5}
        decay={2}
      />
    </group>
  );
}

export function ConnectionDock({ integrationStatuses, activeIntegrationId }: ConnectionDockProps) {
  const labelRef = useRef<THREE.Mesh>(null);

  // Canvas texture for "EXTERNAL SYSTEMS" label
  const labelTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, 256, 32);
    ctx.fillStyle = '#3b82f6';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXTERNAL SYSTEMS', 128, 20);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }, []);

  return (
    <group>
      {/* Rack frame */}
      <mesh position={[RACK_X, RACK_Y + (integrationStatuses.length * MODULE_SPACING) / 2, RACK_Z]} castShadow>
        <boxGeometry args={[0.35, integrationStatuses.length * MODULE_SPACING + 0.3, 0.12]} />
        <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Rack side rails */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[RACK_X + side * 0.16, RACK_Y + (integrationStatuses.length * MODULE_SPACING) / 2, RACK_Z]} castShadow>
          <boxGeometry args={[0.02, integrationStatuses.length * MODULE_SPACING + 0.4, 0.14]} />
          <meshStandardMaterial color="#1e293b" emissive="#3b82f6" emissiveIntensity={0.1} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Label plate */}
      <mesh ref={labelRef} position={[RACK_X, RACK_Y + (integrationStatuses.length * MODULE_SPACING) / 2 + (integrationStatuses.length * MODULE_SPACING + 0.3) / 2 + 0.08, RACK_Z + 0.07]}>
        <planeGeometry args={[0.3, 0.06]} />
        <meshStandardMaterial map={labelTexture} emissive="#ffffff" emissiveMap={labelTexture} emissiveIntensity={0.3} transparent />
      </mesh>

      {/* Integration modules */}
      {integrationStatuses.map((integration, i) => (
        <DockModule
          key={integration.id}
          index={i}
          status={integration.status}
          color={integration.color}
          isActive={activeIntegrationId === integration.id}
        />
      ))}
    </group>
  );
}
