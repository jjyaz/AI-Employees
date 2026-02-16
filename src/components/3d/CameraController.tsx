import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { FocusTarget } from '../BedroomScene';

interface CameraControllerProps {
  focusTarget: FocusTarget;
  deskPositions: [number, number, number][];
}

const OVERVIEW_POS = new THREE.Vector3(5, 4.5, 5);
const OVERVIEW_TARGET = new THREE.Vector3(0, 0.5, 0);

export function CameraController({ focusTarget, deskPositions }: CameraControllerProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const targetPos = useRef(OVERVIEW_POS.clone());
  const targetLookAt = useRef(OVERVIEW_TARGET.clone());

  useEffect(() => {
    if (focusTarget === 'overview') {
      targetPos.current.copy(OVERVIEW_POS);
      targetLookAt.current.copy(OVERVIEW_TARGET);
    } else {
      const index = parseInt(focusTarget.replace('desk', '')) - 1;
      const deskPos = deskPositions[index];
      // Camera position: offset from desk toward outside
      const dir = new THREE.Vector3(deskPos[0], 0, deskPos[2]).normalize();
      targetPos.current.set(
        deskPos[0] + dir.x * 2,
        2.2,
        deskPos[2] + dir.z * 2
      );
      targetLookAt.current.set(deskPos[0], 1, deskPos[2]);
    }
  }, [focusTarget, deskPositions]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.03);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.03);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={12}
      maxPolarAngle={Math.PI / 2.1}
      autoRotate={focusTarget === 'overview'}
      autoRotateSpeed={0.3}
    />
  );
}
