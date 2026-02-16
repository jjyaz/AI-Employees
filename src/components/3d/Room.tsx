import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCloudWallMaterial, type CloudState } from './CloudWallMaterial';
import type { BeamState } from '../BedroomScene';

interface RoomProps {
  beamState?: BeamState;
  cloudState?: CloudState;
  starIntensity?: number;
}

export function Room({ beamState = 'idle', cloudState = 'idle', starIntensity = 0 }: RoomProps) {
  const ledRef = useRef<THREE.PointLight>(null);
  const ledRef2 = useRef<THREE.PointLight>(null);

  const wallProps = { beamState, cloudState, starIntensity };
  const { material: backWall } = useCloudWallMaterial({ ...wallProps, driftDirection: 1.0 });
  const { material: leftWall } = useCloudWallMaterial({ ...wallProps, driftDirection: -0.8 });
  const { material: rightWall } = useCloudWallMaterial({ ...wallProps, driftDirection: 1.2 });
  const { material: frontWall } = useCloudWallMaterial({ ...wallProps, driftDirection: -1.0 });

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ledRef.current) ledRef.current.intensity = 0.8 + Math.sin(t * 0.5) * 0.2;
    if (ledRef2.current) ledRef2.current.intensity = 0.7 + Math.sin(t * 0.7 + 1) * 0.2;
  });

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#c4a882" roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 3, -5.5]} receiveShadow>
        <planeGeometry args={[12, 6]} />
        {backWall}
      </mesh>

      {/* Left wall */}
      <mesh position={[-5.5, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 6]} />
        {leftWall}
      </mesh>

      {/* Right wall */}
      <mesh position={[5.5, 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 6]} />
        {rightWall}
      </mesh>

      {/* Front wall */}
      <mesh position={[0, 3, 5.5]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[12, 6]} />
        {frontWall}
      </mesh>

      {/* Window */}
      <group position={[5.49, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[3, 2.2]} />
          <meshStandardMaterial color="#87ceeb" emissive="#87ceeb" emissiveIntensity={0.8} />
        </mesh>
        <pointLight position={[0, 0, 0.5]} color="#fff5e0" intensity={4} distance={12} decay={2} />
      </group>

      {/* Ceiling */}
      <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#e8ecf0" roughness={1} />
      </mesh>

      {/* RGB LED strips */}
      <pointLight ref={ledRef} position={[-5, 5.8, -5]} color="#3b82f6" intensity={0.8} distance={8} />
      <pointLight ref={ledRef2} position={[5, 5.8, 5]} color="#8b5cf6" intensity={0.7} distance={8} />
      <pointLight position={[-5, 5.8, 5]} color="#06b6d4" intensity={0.5} distance={8} />
      <pointLight position={[5, 5.8, -5]} color="#3b82f6" intensity={0.5} distance={8} />

      {[[-5.4, 5.9, 0], [5.4, 5.9, 0]].map((pos, i) => (
        <mesh key={`led-h-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[0.05, 0.05, 11]} />
          <meshStandardMaterial emissive={i === 0 ? '#3b82f6' : '#8b5cf6'} emissiveIntensity={2} color="#000" />
        </mesh>
      ))}
      {[[0, 5.9, -5.4], [0, 5.9, 5.4]].map((pos, i) => (
        <mesh key={`led-v-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[11, 0.05, 0.05]} />
          <meshStandardMaterial emissive={i === 0 ? '#06b6d4' : '#3b82f6'} emissiveIntensity={2} color="#000" />
        </mesh>
      ))}
    </group>
  );
}
