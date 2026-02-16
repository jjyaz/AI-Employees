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
  uniform float uDriftDirection;
  uniform float uState; // 0=idle, 1=planning, 2=processing, 3=collaboration, 4=error, 5=success
  uniform float uStarIntensity;
  uniform vec3 uBeamCenter; // normalized beam convergence point on wall
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
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

  // Hash for star positions
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float stars(vec2 uv, float density, float time) {
    float star = 0.0;
    // Multiple grid layers for depth
    for (float i = 0.0; i < 3.0; i++) {
      float scale = 30.0 + i * 25.0;
      vec2 gridUv = uv * scale;
      vec2 cell = floor(gridUv);
      vec2 local = fract(gridUv) - 0.5;
      
      float h = hash(cell + i * 100.0);
      if (h > (1.0 - density * 0.15)) {
        vec2 offset = vec2(hash(cell + 0.1) - 0.5, hash(cell + 0.2) - 0.5) * 0.6;
        float d = length(local - offset);
        float brightness = (1.0 - i * 0.3); // farther layers dimmer
        float twinkle = 0.7 + 0.3 * sin(time * (0.3 + h * 0.4) + h * 6.28);
        float glow = smoothstep(0.08 - i * 0.015, 0.0, d) * brightness * twinkle;
        // Bloom halo
        glow += smoothstep(0.15 - i * 0.02, 0.04, d) * 0.15 * brightness * twinkle;
        star += glow;
      }
    }
    return star;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime;
    
    // --- State-driven parameters ---
    // Drift speed: idle=1, planning=1.4, processing=0.7, collab=1.2, error=0.4, success=1
    float driftMul = 1.0;
    if (uState < 0.5) driftMul = 1.0;        // idle
    else if (uState < 1.5) driftMul = 1.4;   // planning
    else if (uState < 2.5) driftMul = 0.7;   // processing
    else if (uState < 3.5) driftMul = 1.2;   // collaboration
    else if (uState < 4.5) driftMul = 0.4;   // error
    else driftMul = 1.0;                      // success

    float drift = t * 0.008 * uDriftDirection * driftMul;
    
    // --- Sky base color by state ---
    vec3 skyIdle = vec3(0.53, 0.72, 0.88);
    vec3 skyPlanning = vec3(0.55, 0.62, 0.85);    // soft lavender
    vec3 skyProcessing = vec3(0.38, 0.42, 0.72);  // deep violet/indigo
    vec3 skyCollab = vec3(0.48, 0.65, 0.88);       // brighter blue
    vec3 skyError = vec3(0.55, 0.62, 0.68);        // desaturated
    vec3 skySuccess = vec3(0.58, 0.78, 0.88);      // warm cyan
    
    vec3 skyBase;
    if (uState < 0.5) skyBase = skyIdle;
    else if (uState < 1.5) skyBase = skyPlanning;
    else if (uState < 2.5) skyBase = skyProcessing;
    else if (uState < 3.5) skyBase = skyCollab;
    else if (uState < 4.5) skyBase = skyError;
    else skyBase = skySuccess;
    
    vec3 skyTop = skyBase * 0.85;
    vec3 sky = mix(skyBase, skyTop, uv.y);
    
    // --- Clouds ---
    vec2 cloudUv1 = uv * vec2(3.0, 1.5) + vec2(drift, 0.0);
    vec2 cloudUv2 = uv * vec2(2.0, 1.0) + vec2(drift * 0.7, 0.02);
    vec2 cloudUv3 = uv * vec2(5.0, 2.5) + vec2(drift * 1.3, -0.01);
    
    float cloud1 = fbm(cloudUv1);
    float cloud2 = fbm(cloudUv2 + 3.7);
    float cloud3 = fbm(cloudUv3 + 7.1);
    
    float clouds = smoothstep(0.05, 0.55, cloud1) * 0.6;
    clouds += smoothstep(0.1, 0.6, cloud2) * 0.3;
    clouds += smoothstep(0.15, 0.65, cloud3) * 0.15;
    clouds = clamp(clouds, 0.0, 0.85);
    
    // Processing: compress clouds toward center
    if (uState > 1.5 && uState < 2.5) {
      vec2 center = vec2(0.5);
      vec2 toCenter = center - uv;
      float compressFactor = 0.03;
      clouds *= 1.0 + length(toCenter) * compressFactor * 2.0;
    }
    
    vec3 cloudColor = vec3(0.92, 0.94, 0.97);
    
    // Planning: internal glow pulses
    if (uState > 0.5 && uState < 1.5) {
      float pulse = 0.5 + 0.5 * sin(t * 1.5);
      cloudColor += vec3(0.06, 0.04, 0.1) * pulse * clouds;
    }
    
    // Success: warm shimmer
    if (uState > 4.5) {
      float shimmer = 0.5 + 0.5 * sin(t * 3.0);
      cloudColor += vec3(0.1, 0.08, 0.02) * shimmer;
      // Expand effect: brighten edges
      float edgeDist = length(uv - 0.5);
      clouds *= 1.0 - 0.1 * (1.0 - edgeDist);
    }
    
    vec3 color = mix(sky, cloudColor, clouds);
    
    // --- Beam light reflections ripple ---
    if (uBeamIntensity > 0.01) {
      float ripple = sin(length(uv - uBeamCenter) * 20.0 - t * 3.0) * 0.5 + 0.5;
      ripple *= smoothstep(0.8, 0.0, length(uv - uBeamCenter));
      color += uBeamColor * ripple * uBeamIntensity * 0.12 * (0.5 + clouds * 0.5);
      
      // Collaboration: radial light expansion behind beam convergence
      if (uState > 2.5 && uState < 3.5) {
        float radial = smoothstep(0.6, 0.0, length(uv - uBeamCenter));
        float pulse = 0.7 + 0.3 * sin(t * 2.0);
        color += uBeamColor * radial * 0.08 * pulse;
      }
    }
    
    // General beam glow
    float beamGlow = uBeamIntensity * 0.12;
    color += uBeamColor * beamGlow * (0.5 + clouds * 0.5);
    
    // --- Stars (only during heavy collaboration) ---
    if (uStarIntensity > 0.01) {
      // More stars near beam center
      float centerBoost = 1.0 + smoothstep(0.5, 0.0, length(uv - uBeamCenter)) * 0.5;
      float starField = stars(uv, uStarIntensity * centerBoost, t);
      // Stars show through gaps in clouds more
      float cloudMask = 1.0 - clouds * 0.6;
      color += vec3(0.9, 0.92, 1.0) * starField * uStarIntensity * cloudMask;
    }
    
    // Vignette
    float vignette = 1.0 - 0.15 * pow(length(uv - 0.5) * 1.4, 2.0);
    color *= vignette;
    
    // Night-time darkening
    color *= 0.85;
    
    // Processing: slight data ripple on cloud surface
    if (uState > 1.5 && uState < 2.5 && uBeamIntensity > 0.01) {
      float dataRipple = sin(uv.x * 40.0 + t * 5.0) * sin(uv.y * 30.0 - t * 3.0);
      dataRipple = smoothstep(0.7, 1.0, dataRipple);
      color += vec3(0.3, 0.2, 0.5) * dataRipple * 0.04;
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export type CloudState = 'idle' | 'planning' | 'processing' | 'collaboration' | 'error' | 'success';

interface CloudWallMaterialProps {
  beamState?: BeamState;
  cloudState?: CloudState;
  driftDirection?: number;
  starIntensity?: number;
}

const STATE_MAP: Record<CloudState, number> = {
  idle: 0,
  planning: 1,
  processing: 2,
  collaboration: 3,
  error: 4,
  success: 5,
};

const BEAM_COLORS: Record<BeamState, string> = {
  idle: '#3b82f6',
  collaboration: '#8b5cf6',
  processing: '#ef4444',
  success: '#10b981',
};

export function useCloudWallMaterial({
  beamState = 'idle',
  cloudState = 'idle',
  driftDirection = 1.0,
  starIntensity = 0,
}: CloudWallMaterialProps = {}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBeamIntensity: { value: 0 },
    uBeamColor: { value: new THREE.Color('#3b82f6') },
    uDriftDirection: { value: driftDirection },
    uState: { value: 0 },
    uStarIntensity: { value: 0 },
    uBeamCenter: { value: new THREE.Vector2(0.5, 0.4) },
  }), [driftDirection]);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms;
    u.uTime.value = clock.getElapsedTime();

    // Smooth state transition
    const targetState = STATE_MAP[cloudState];
    u.uState.value = THREE.MathUtils.lerp(u.uState.value, targetState, 0.04);

    // Smooth beam intensity
    const targetBeam = beamState === 'idle' ? 0 : beamState === 'collaboration' ? 0.8 : beamState === 'processing' ? 0.6 : 1.0;
    u.uBeamIntensity.value = THREE.MathUtils.lerp(u.uBeamIntensity.value, targetBeam, 0.03);
    u.uBeamColor.value.set(BEAM_COLORS[beamState]);

    // Smooth star intensity (fade in/out over ~1-2s)
    u.uStarIntensity.value = THREE.MathUtils.lerp(u.uStarIntensity.value, starIntensity, 0.02);
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
