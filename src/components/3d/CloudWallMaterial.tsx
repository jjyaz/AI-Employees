import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BeamState } from '../BedroomScene';

const cloudVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const cloudFragmentShader = `
  uniform float uTime;
  uniform float uBeamIntensity;
  uniform vec3 uBeamColor;
  uniform float uDriftDirection; // 1.0 or -1.0 for variety
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  // Simplex-style noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float f = 0.0;
    f += 0.5000 * snoise(p); p *= 2.02;
    f += 0.2500 * snoise(p); p *= 2.03;
    f += 0.1250 * snoise(p); p *= 2.01;
    f += 0.0625 * snoise(p);
    return f / 0.9375;
  }

  void main() {
    vec2 uv = vUv;
    
    // Very slow drift
    float drift = uTime * 0.008 * uDriftDirection;
    
    // Sky blue base
    vec3 skyBase = vec3(0.53, 0.72, 0.88);
    vec3 skyTop = vec3(0.42, 0.62, 0.82);
    vec3 sky = mix(skyBase, skyTop, uv.y);
    
    // Cloud layers at different scales and speeds
    vec2 cloudUv1 = uv * vec2(3.0, 1.5) + vec2(drift, 0.0);
    vec2 cloudUv2 = uv * vec2(2.0, 1.0) + vec2(drift * 0.7, 0.02);
    vec2 cloudUv3 = uv * vec2(5.0, 2.5) + vec2(drift * 1.3, -0.01);
    
    float cloud1 = fbm(cloudUv1);
    float cloud2 = fbm(cloudUv2 + 3.7);
    float cloud3 = fbm(cloudUv3 + 7.1);
    
    // Combine clouds with soft thresholds
    float clouds = smoothstep(0.05, 0.55, cloud1) * 0.6;
    clouds += smoothstep(0.1, 0.6, cloud2) * 0.3;
    clouds += smoothstep(0.15, 0.65, cloud3) * 0.15;
    clouds = clamp(clouds, 0.0, 0.85);
    
    // Cloud color - soft white with slight warmth
    vec3 cloudColor = vec3(0.92, 0.94, 0.97);
    
    // Mix sky and clouds
    vec3 color = mix(sky, cloudColor, clouds);
    
    // Beam / neural light reaction
    float beamGlow = uBeamIntensity * 0.15;
    color += uBeamColor * beamGlow * (0.5 + clouds * 0.5);
    
    // Subtle vignette darken at edges for depth
    float vignette = 1.0 - 0.15 * pow(length(uv - 0.5) * 1.4, 2.0);
    color *= vignette;
    
    // Slight night-time darkening to maintain atmosphere
    color *= 0.85;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

interface CloudWallMaterialProps {
  beamState?: BeamState;
  driftDirection?: number;
}

export function useCloudWallMaterial({ beamState = 'idle', driftDirection = 1.0 }: CloudWallMaterialProps = {}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBeamIntensity: { value: 0 },
    uBeamColor: { value: new THREE.Color('#3b82f6') },
    uDriftDirection: { value: driftDirection },
  }), [driftDirection]);

  const beamColors: Record<BeamState, string> = {
    idle: '#3b82f6',
    collaboration: '#8b5cf6',
    processing: '#ef4444',
    success: '#10b981',
  };

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    
    const targetIntensity = beamState === 'idle' ? 0 : beamState === 'collaboration' ? 0.8 : beamState === 'processing' ? 0.6 : 1.0;
    matRef.current.uniforms.uBeamIntensity.value = THREE.MathUtils.lerp(
      matRef.current.uniforms.uBeamIntensity.value, targetIntensity, 0.03
    );
    matRef.current.uniforms.uBeamColor.value.set(beamColors[beamState]);
  });

  const material = useMemo(() => (
    <shaderMaterial
      ref={matRef}
      vertexShader={cloudVertexShader}
      fragmentShader={cloudFragmentShader}
      uniforms={uniforms}
    />
  ), [uniforms]);

  return { material, matRef };
}
