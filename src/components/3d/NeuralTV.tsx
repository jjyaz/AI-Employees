import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { BeamState, FocusTarget } from '../BedroomScene';

interface NeuralTVProps {
  focusTarget: FocusTarget;
  beamState: BeamState;
}

// AI-specific screen color schemes
const AI_COLORS: Record<string, { primary: string; secondary: string; bg: string }> = {
  desk1: { primary: '#3b82f6', secondary: '#60a5fa', bg: '#0c1929' }, // Kimi - blue terminal
  desk2: { primary: '#ef4444', secondary: '#f87171', bg: '#1c0c0c' }, // Clawd - red ideas
  desk3: { primary: '#10b981', secondary: '#34d399', bg: '#0c1c14' }, // Mac mini - green data
  desk4: { primary: '#8b5cf6', secondary: '#a78bfa', bg: '#140c1c' }, // Raspberry Pi - purple network
};

function TVVisualization({ focusTarget, beamState }: { focusTarget: FocusTarget; beamState: BeamState }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 288;
    canvasRef.current = c;
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    textureRef.current = tex;
    return c;
  }, []);

  useFrame(({ clock }) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !textureRef.current) return;
    const t = clock.getElapsedTime();
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const isCollective = focusTarget === 'overview';
    const isTask = beamState !== 'idle';

    if (isCollective && isTask) {
      // Collective Neural Mode
      drawCollectiveMode(ctx, w, h, t, beamState);
    } else if (!isCollective) {
      // Individual AI visualization
      drawIndividualMode(ctx, w, h, t, focusTarget);
    } else {
      // Idle overview - subtle ambient
      drawIdleMode(ctx, w, h, t);
    }

    textureRef.current.needsUpdate = true;
  });

  return textureRef.current ? (
    <meshStandardMaterial
      map={textureRef.current}
      emissive="#ffffff"
      emissiveMap={textureRef.current}
      emissiveIntensity={0.6}
      toneMapped={false}
    />
  ) : (
    <meshStandardMaterial color="#111" />
  );
}

function drawIdleMode(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#080c18';
  ctx.fillRect(0, 0, w, h);

  // Subtle grid
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Center logo text
  ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NEURAL OBSERVATION SYSTEM', w / 2, h / 2 - 10);
  ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
  ctx.font = '10px monospace';
  ctx.fillText('SELECT AN AI DESK TO BEGIN', w / 2, h / 2 + 10);

  // Breathing pulse circle
  const radius = 3 + Math.sin(t * 2) * 1.5;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 + 30, radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + Math.sin(t * 2) * 0.15})`;
  ctx.fill();
}

function drawIndividualMode(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, target: FocusTarget) {
  const colors = AI_COLORS[target] || AI_COLORS.desk1;
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, w, h);

  const deskIndex = parseInt(target.replace('desk', '')) - 1;

  if (deskIndex === 0) drawKimiVis(ctx, w, h, t, colors);
  else if (deskIndex === 1) drawClawdVis(ctx, w, h, t, colors);
  else if (deskIndex === 2) drawMacMiniVis(ctx, w, h, t, colors);
  else drawRaspberryPiVis(ctx, w, h, t, colors);
}

function drawKimiVis(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, colors: typeof AI_COLORS.desk1) {
  // Terminal code streams
  ctx.font = '9px monospace';
  const lines = [
    'const neural = await connect();',
    'processing data pipeline...',
    'for (let i = 0; i < nodes; i++)',
    '  await neural.sync(node[i]);',
    'export function analyze(data) {',
    '  return model.predict(data);',
    'neural.status: ACTIVE',
    'bandwidth: 1.2 TB/s',
    'latency: 0.003ms',
    'clusters: [A1, B2, C3, D4]',
    'compiling neural graph...',
    'optimization: 99.7%',
  ];
  
  const scrollOffset = Math.floor(t * 2) % lines.length;
  for (let i = 0; i < 10; i++) {
    const lineIdx = (scrollOffset + i) % lines.length;
    const alpha = 0.15 + (i / 10) * 0.5;
    ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`;
    const y = 20 + i * 22;
    ctx.fillText('> ' + lines[lineIdx], 15, y);
    
    // Cursor blink on last line
    if (i === 9) {
      const cursorAlpha = Math.sin(t * 5) > 0 ? 0.8 : 0;
      ctx.fillStyle = `rgba(96, 165, 250, ${cursorAlpha})`;
      ctx.fillRect(15 + ctx.measureText('> ' + lines[lineIdx]).width + 3, y - 8, 6, 10);
    }
  }

  // Network graph on right side
  const nodes = 6;
  for (let i = 0; i < nodes; i++) {
    const angle = (i / nodes) * Math.PI * 2 + t * 0.3;
    const nx = w - 80 + Math.cos(angle) * 40;
    const ny = h / 2 + Math.sin(angle) * 40;
    ctx.beginPath();
    ctx.arc(nx, ny, 4, 0, Math.PI * 2);
    ctx.fillStyle = colors.primary;
    ctx.fill();
    
    // Connect to next
    const nextAngle = ((i + 1) / nodes) * Math.PI * 2 + t * 0.3;
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(w - 80 + Math.cos(nextAngle) * 40, h / 2 + Math.sin(nextAngle) * 40);
    ctx.strokeStyle = `rgba(96, 165, 250, 0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawClawdVis(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, colors: typeof AI_COLORS.desk1) {
  // Branching idea trees / mind map
  const cx = w / 2;
  const cy = h / 2;

  // Central node
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fillStyle = colors.primary;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CORE', cx, cy + 3);

  // Branching nodes
  const branches = 5;
  for (let b = 0; b < branches; b++) {
    const angle = (b / branches) * Math.PI * 2 + t * 0.15;
    const dist = 60 + Math.sin(t + b) * 10;
    const bx = cx + Math.cos(angle) * dist;
    const by = cy + Math.sin(angle) * dist;

    // Connection line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const cpx = cx + Math.cos(angle) * dist * 0.5 + Math.sin(t + b) * 15;
    const cpy = cy + Math.sin(angle) * dist * 0.5 + Math.cos(t + b) * 15;
    ctx.quadraticCurveTo(cpx, cpy, bx, by);
    ctx.strokeStyle = `rgba(248, 113, 113, 0.4)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Branch node
    ctx.beginPath();
    ctx.arc(bx, by, 7 + Math.sin(t * 2 + b) * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(t + b) * 0.2})`;
    ctx.fill();

    // Sub-branches
    for (let s = 0; s < 2; s++) {
      const subAngle = angle + (s - 0.5) * 0.8 + Math.sin(t * 0.5) * 0.2;
      const subDist = 30 + Math.sin(t * 1.5 + b + s) * 8;
      const sx = bx + Math.cos(subAngle) * subDist;
      const sy = by + Math.sin(subAngle) * subDist;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(248, 113, 113, 0.4)';
      ctx.fill();
    }
  }
  ctx.textAlign = 'start';
}

function drawMacMiniVis(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, colors: typeof AI_COLORS.desk1) {
  // CPU load bars + data blocks + processing grid
  ctx.font = '8px monospace';
  ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.fillText('CPU UTILIZATION', 15, 18);

  // CPU bars
  const cores = 8;
  for (let i = 0; i < cores; i++) {
    const load = 0.3 + Math.sin(t * 2 + i * 0.7) * 0.3 + Math.cos(t * 1.3 + i) * 0.2;
    const barW = (w - 40) * Math.max(0.05, Math.min(1, load));
    const y = 28 + i * 16;

    // Bar bg
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(15, y, w - 40, 10);
    // Bar fill
    const gradient = ctx.createLinearGradient(15, 0, 15 + barW, 0);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.6)');
    gradient.addColorStop(1, `rgba(52, 211, 153, ${0.3 + load * 0.4})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(15, y, barW, 10);
    
    // Label
    ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.fillText(`C${i}`, w - 20, y + 8);
  }

  // Data blocks grid at bottom
  const blockSize = 8;
  const cols = Math.floor((w - 30) / (blockSize + 2));
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < 4; r++) {
      const active = Math.sin(t * 3 + c * 0.5 + r * 1.2) > 0;
      ctx.fillStyle = active ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.06)';
      ctx.fillRect(15 + c * (blockSize + 2), h - 55 + r * (blockSize + 2), blockSize, blockSize);
    }
  }

  // Memory label
  ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
  ctx.fillText('MEM BLOCKS', 15, h - 62);
}

function drawRaspberryPiVis(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, colors: typeof AI_COLORS.desk1) {
  // Network node map with IoT signals
  const nodePositions = [
    { x: w * 0.2, y: h * 0.3 }, { x: w * 0.5, y: h * 0.2 },
    { x: w * 0.8, y: h * 0.3 }, { x: w * 0.3, y: h * 0.6 },
    { x: w * 0.7, y: h * 0.6 }, { x: w * 0.5, y: h * 0.8 },
    { x: w * 0.15, y: h * 0.8 }, { x: w * 0.85, y: h * 0.8 },
  ];

  // Connections
  const connections = [[0,1],[1,2],[0,3],[2,4],[3,5],[4,5],[3,6],[4,7],[1,3],[1,4]];
  connections.forEach(([a, b]) => {
    const na = nodePositions[a];
    const nb = nodePositions[b];
    ctx.beginPath();
    ctx.moveTo(na.x, na.y);
    ctx.lineTo(nb.x, nb.y);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Traveling pulse
    const pulsePos = (t * 0.3 + a * 0.15) % 1;
    const px = na.x + (nb.x - na.x) * pulsePos;
    const py = na.y + (nb.y - na.y) * pulsePos;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(167, 139, 250, ${0.5 + Math.sin(t * 4) * 0.3})`;
    ctx.fill();
  });

  // Nodes
  nodePositions.forEach((n, i) => {
    const pulse = Math.sin(t * 2 + i) * 3;
    // Signal ring
    ctx.beginPath();
    ctx.arc(n.x, n.y, 10 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 + Math.sin(t + i) * 0.1})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    // Core
    ctx.beginPath();
    ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = i === 1 ? colors.primary : `rgba(139, 92, 246, 0.5)`;
    ctx.fill();
  });

  // Labels
  ctx.font = '7px monospace';
  ctx.fillStyle = 'rgba(167, 139, 250, 0.4)';
  ctx.textAlign = 'center';
  const labels = ['LED', 'HUB', 'CAM', 'TEMP', 'MOTOR', 'GPIO', 'IR', 'RELAY'];
  nodePositions.forEach((n, i) => {
    ctx.fillText(labels[i], n.x, n.y - 12);
  });
  ctx.textAlign = 'start';
}

function drawCollectiveMode(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, beamState: BeamState) {
  // Dark background with intensity based on state
  const bgIntensity = beamState === 'processing' ? 0.12 : 0.08;
  ctx.fillStyle = `rgb(${Math.floor(bgIntensity * 255)}, ${Math.floor(bgIntensity * 200)}, ${Math.floor(bgIntensity * 255)})`;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const aiPositions = [
    { x: cx, y: cy - 70, color: '#3b82f6', label: 'KIMI' },
    { x: cx + 100, y: cy, color: '#ef4444', label: 'CLAWD' },
    { x: cx, y: cy + 70, color: '#10b981', label: 'MAC' },
    { x: cx - 100, y: cy, color: '#8b5cf6', label: 'PI' },
  ];

  // Neural threads between all AIs
  for (let i = 0; i < aiPositions.length; i++) {
    for (let j = i + 1; j < aiPositions.length; j++) {
      const a = aiPositions[i];
      const b = aiPositions[j];
      
      // Wavy line
      ctx.beginPath();
      const steps = 30;
      for (let s = 0; s <= steps; s++) {
        const frac = s / steps;
        const px = a.x + (b.x - a.x) * frac;
        const py = a.y + (b.y - a.y) * frac + Math.sin(frac * Math.PI * 3 + t * 3 + i) * 5;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      const alpha = beamState === 'success' ? 0.6 : 0.3 + Math.sin(t * 2 + i + j) * 0.1;
      ctx.strokeStyle = `rgba(180, 160, 255, ${alpha})`;
      ctx.lineWidth = beamState === 'processing' ? 2 : 1;
      ctx.stroke();

      // Data packets
      const packetCount = beamState === 'processing' ? 3 : 1;
      for (let p = 0; p < packetCount; p++) {
        const pFrac = (t * 0.4 + p * 0.33 + i * 0.1) % 1;
        const ppx = a.x + (b.x - a.x) * pFrac;
        const ppy = a.y + (b.y - a.y) * pFrac + Math.sin(pFrac * Math.PI * 3 + t * 3 + i) * 5;
        ctx.beginPath();
        ctx.arc(ppx, ppy, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 200, 255, 0.7)`;
        ctx.fill();
      }
    }
  }

  // AI silhouettes
  aiPositions.forEach((ai, i) => {
    // Glow
    const glowR = beamState === 'processing' ? 22 : 18;
    ctx.beginPath();
    ctx.arc(ai.x, ai.y, glowR + Math.sin(t * 2 + i) * 3, 0, Math.PI * 2);
    ctx.fillStyle = ai.color + '20';
    ctx.fill();
    // Core
    ctx.beginPath();
    ctx.arc(ai.x, ai.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = ai.color;
    ctx.fill();
    // Label
    ctx.font = '8px monospace';
    ctx.fillStyle = ai.color;
    ctx.textAlign = 'center';
    ctx.fillText(ai.label, ai.x, ai.y + 24);
  });
  ctx.textAlign = 'start';

  // Success pulse
  if (beamState === 'success') {
    const pulseR = ((t * 30) % 120);
    ctx.beginPath();
    ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(16, 185, 129, ${Math.max(0, 0.5 - pulseR / 120)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Status text
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  const statusText = beamState === 'collaboration' ? 'NEURAL SYNC ACTIVE' :
    beamState === 'processing' ? 'PROCESSING COLLECTIVE TASK' :
    beamState === 'success' ? 'TASK COMPLETE — STABILIZED' : 'STANDBY';
  ctx.fillStyle = `rgba(200, 200, 255, ${0.5 + Math.sin(t * 3) * 0.15})`;
  ctx.fillText(statusText, cx, 18);
  ctx.textAlign = 'start';
}

export function NeuralTV({ focusTarget, beamState }: NeuralTVProps) {
  const backlightRef = useRef<THREE.PointLight>(null);
  const frameGlowRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (backlightRef.current) {
      const isActive = focusTarget !== 'overview' || beamState !== 'idle';
      const targetIntensity = isActive ? 2.5 + Math.sin(t * 2) * 0.5 : 1.2 + Math.sin(t) * 0.3;
      backlightRef.current.intensity += (targetIntensity - backlightRef.current.intensity) * 0.05;

      if (beamState === 'processing') backlightRef.current.color.set('#ef4444');
      else if (beamState === 'success') backlightRef.current.color.set('#10b981');
      else if (beamState === 'collaboration') backlightRef.current.color.set('#8b5cf6');
      else backlightRef.current.color.set('#3b82f6');
    }
    if (frameGlowRef.current) {
      frameGlowRef.current.emissiveIntensity = 0.3 + Math.sin(t * 1.5) * 0.1;
    }
  });

  return (
    <group position={[0, 3.2, -5.45]}>
      {/* TV Frame */}
      <mesh castShadow>
        <boxGeometry args={[4.5, 2.5, 0.08]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Bezel glow trim */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[4.55, 2.55, 0.01]} />
        <meshStandardMaterial
          ref={frameGlowRef}
          color="#111"
          emissive="#3b82f6"
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Screen */}
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[4.2, 2.3]} />
        <TVVisualization focusTarget={focusTarget} beamState={beamState} />
      </mesh>

      {/* LED backlight glow */}
      <pointLight
        ref={backlightRef}
        position={[0, 0, -0.2]}
        color="#3b82f6"
        intensity={1.2}
        distance={6}
        decay={2}
      />

      {/* Side LED strips */}
      {[[-2.3, 0, -0.03], [2.3, 0, -0.03]].map((pos, i) => (
        <mesh key={`tv-led-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[0.02, 2.2, 0.02]} />
          <meshStandardMaterial color="#000" emissive="#3b82f6" emissiveIntensity={1.5} />
        </mesh>
      ))}

      {/* TV stand / mount */}
      <mesh position={[0, -1.35, 0.02]}>
        <boxGeometry args={[0.15, 0.2, 0.05]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}
