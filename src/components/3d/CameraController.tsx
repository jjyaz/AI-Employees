import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { FocusTarget } from '../BedroomScene';

export type CameraMode = 'overview' | 'desk' | 'tv' | 'neural' | 'overhead';

interface CameraControllerProps {
  focusTarget: FocusTarget;
  cameraMode: CameraMode;
  deskPositions: [number, number, number][];
}

const PRESETS: Record<string, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  overview: { pos: new THREE.Vector3(5, 4.5, 5), target: new THREE.Vector3(0, 0.5, 0) },
  tv: { pos: new THREE.Vector3(0, 3.2, 3.5), target: new THREE.Vector3(0, 3.2, -5.5) },
  neural: { pos: new THREE.Vector3(4, 5.5, 4), target: new THREE.Vector3(0, 1, 0) },
  overhead: { pos: new THREE.Vector3(0, 9, 0.01), target: new THREE.Vector3(0, 0, 0) },
};

export function CameraController({ focusTarget, cameraMode, deskPositions }: CameraControllerProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const targetPos = useRef(PRESETS.overview.pos.clone());
  const targetLookAt = useRef(PRESETS.overview.target.clone());

  useEffect(() => {
    if (cameraMode === 'tv') {
      targetPos.current.copy(PRESETS.tv.pos);
      targetLookAt.current.copy(PRESETS.tv.target);
      return;
    }
    if (cameraMode === 'neural') {
      targetPos.current.copy(PRESETS.neural.pos);
      targetLookAt.current.copy(PRESETS.neural.target);
      return;
    }
    if (cameraMode === 'overhead') {
      targetPos.current.copy(PRESETS.overhead.pos);
      targetLookAt.current.copy(PRESETS.overhead.target);
      return;
    }

    if (focusTarget === 'overview') {
      targetPos.current.copy(PRESETS.overview.pos);
      targetLookAt.current.copy(PRESETS.overview.target);
    } else {
      const index = parseInt(focusTarget.replace('desk', '')) - 1;
      const deskPos = deskPositions[index];
      const dir = new THREE.Vector3(deskPos[0], 0, deskPos[2]).normalize();
      targetPos.current.set(deskPos[0] + dir.x * 2, 2.2, deskPos[2] + dir.z * 2);
      targetLookAt.current.set(deskPos[0], 1, deskPos[2]);
    }
  }, [focusTarget, cameraMode, deskPositions]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.03);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.03);
      controlsRef.current.update();
    }
  });

  const isAutoRotate = cameraMode === 'overview' && focusTarget === 'overview';

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={14}
      maxPolarAngle={Math.PI / 2.1}
      autoRotate={isAutoRotate}
      autoRotateSpeed={0.3}
    />
  );
}
