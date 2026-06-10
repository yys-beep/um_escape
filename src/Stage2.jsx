import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  PROJECTOR_FILES,
  PROJECTOR_CORRECT_ORDER,
  HIDDEN_MESSAGE,
  CINEMATIC_LINES,
} from './Stage2.constants';

// ─── WORLD LAYOUT CONSTANTS (Scaled to fit perfectly within Z: -19 to +19) ───
const EYE_LEVEL = 1.6;
const FLOOR_Y = -EYE_LEVEL;     // Floor is 1.6 units below camera
const STAGE_Y = FLOOR_Y - 1.2;  // Sunken stage is 1.2 units below floor
const ROW_RISE = 0.4;          
const ROW_DEPTH = 1.1;          // Compacted row depth so all tiers stay within Z <= 19
const NUM_ROWS = 5;             // 5 fully walkable tiers
const SEAT_SPACING = 1.5;
const NUM_COLS_HALF = 6;        

// ─── PROCEDURAL CHAIR ────────────────────────────────────────────────────────
function ProceduralChair() {
  return (
    // Added 180-degree rotation around Y axis so seats face forward towards the stage
    <group rotation={[0, Math.PI, 0]}>
      {/* Seat bottom */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.85, 0.12, 0.65]} />
        <meshStandardMaterial color="#5a1818" roughness={0.9} />
      </mesh>
      {/* Seat back */}
      <mesh position={[0, 0.82, -0.28]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[0.85, 1.0, 0.12]} />
        <meshStandardMaterial color="#4a1212" roughness={0.9} />
      </mesh>
      {/* Arm rests */}
      <mesh position={[-0.43, 0.52, 0]}><boxGeometry args={[0.08, 0.08, 0.65]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[0.43, 0.52, 0]}><boxGeometry args={[0.08, 0.08, 0.65]} /><meshStandardMaterial color="#111" /></mesh>
      {/* Central pedestal base */}
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.08, 0.15, 0.2, 8]} /><meshStandardMaterial color="#111" metalness={0.5} /></mesh>
    </group>
  );
}

// ─── SHADOW FIGURE ───────────────────────────────────────────────────────────
function ShadowFigure({ position }) {
  const groupRef = useRef();
  const { camera } = useThree();
  useFrame(() => {
    if (!groupRef.current) return;
    const dx = camera.position.x - position[0];
    const dz = camera.position.z - position[2];
    groupRef.current.rotation.y = Math.atan2(dx, dz);
  });
  return (
    <group position={position} ref={groupRef}>
      <mesh position={[0, 1.8, 0]}><boxGeometry args={[0.9, 3.6, 0.45]} /><meshStandardMaterial color="#000000" roughness={1} /></mesh>
      <mesh position={[0, 3.8, 0]}><boxGeometry args={[0.6, 0.65, 0.55]} /><meshStandardMaterial color="#000000" roughness={1} /></mesh>
      <mesh position={[-0.14, 3.88, 0.29]}><planeGeometry args={[0.06, 0.06]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} /></mesh>
      <mesh position={[0.14, 3.88, 0.29]}><planeGeometry args={[0.06, 0.06]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} /></mesh>
    </group>
  );
}

// ─── NIGHTMARE GHOST STUDENTS ─────────────────────────────────────────────────
const NIGHTMARE_STUDENT_POSITIONS = (() => {
  const arr = [];
  for (let row = 0; row < NUM_ROWS; row++) {
    const yPos = FLOOR_Y + row * ROW_RISE;
    const zPos = 13.5 + row * ROW_DEPTH; 
    let idx = 0;
    for (let col = -NUM_COLS_HALF; col <= NUM_COLS_HALF; col++) {
      if (col === 0) { idx++; continue; }
      if ((row * 15 + idx) % 4 !== 0) { idx++; continue; }
      arr.push({ key: `ns-${row}-${col}`, x: col * SEAT_SPACING, y: yPos + 0.9, z: zPos });
      idx++;
    }
  }
  return arr;
})();

function NightmareStudents({ visible }) {
  if (!visible) return null;
  return (
    <group>
      {NIGHTMARE_STUDENT_POSITIONS.map(({ key, x, y, z }) => (
        <group key={key} position={[x, y, z]}>
          <mesh><boxGeometry args={[0.45, 1.1, 0.28]} /><meshStandardMaterial color="#aaddff" transparent opacity={0.22} emissive="#aaddff" emissiveIntensity={0.6} /></mesh>
          <mesh position={[0, 0.8, 0]}><sphereGeometry args={[0.2, 8, 8]} /><meshStandardMaterial color="#aaddff" transparent opacity={0.28} emissive="#aaddff" emissiveIntensity={0.6} /></mesh>
        </group>
      ))}
    </group>
  );
}

// ─── SLIDE FRAGMENT (collectible) ─────────────────────────────────────────────
function SlideFragment({ position, slideId, isCollected, onCollect }) {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (!meshRef.current || isCollected) return;
    meshRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2.2 + slideId * 1.5) * 0.08;
    meshRef.current.rotation.y += 0.025;
  });
  if (isCollected) return null;
  return (
    <mesh ref={meshRef} position={position} onClick={(e) => { e.stopPropagation(); onCollect(slideId); }}>
      <boxGeometry args={[0.3, 0.06, 0.22]} />
      <meshStandardMaterial color="#33ff66" emissive="#33ff66" emissiveIntensity={2} />
      <pointLight color="#33ff66" intensity={1.2} distance={3} />
    </mesh>
  );
}

// ─── WIRE TERMINAL (Clickable Boxes) ──────────────────────────────────────────
function WireTerminal({ position, connected, onClick }) {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh position={[0, 0, 0]}><boxGeometry args={[0.3, 0.1, 0.3]}/><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial color={connected ? "#00ff44" : "#ff0000"} emissive={connected ? "#00ff44" : "#ff0000"} emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// ─── PROJECTOR SCREEN (Dynamic Lore & Flashing) ──────────────────────────────
const SLIDE_CONTENT = [
  { line1: 'EXPERIMENTS: 313, 088, 092', line2: 'Subjects: Lee, Ahmad, Maya R.', line3: 'they are... watching... cannot wake up...' },
  { line1: '⚠ MEMORY CORRUPTION ⚠', line2: 'Subject M.R. rejecting protocol', line3: 'fragmented sentences... cold walls...' },
  { line1: 'TRIAL 313-B STATUS', line2: 'Why is she standing in the corner?', line3: 'SUBJECT M.R. STATUS: UNKNOWN' },
  { line1: 'DELETED FILE', line2: 'Experiment 313 terminated.', line3: 'Cover-up initialized by Dean.' },
];

function ProjectorScreen({ puzzleState, onClick }) {
  const canvasRef = useRef();
  const textureRef = useRef();
  const meshRef = useRef();
  const slideIndexRef = useRef(0);
  const timerRef = useRef(0);
  const glitchRef = useRef(0);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 288;
    canvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    textureRef.current = tex;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    const canvas = canvasRef.current;
    const tex = textureRef.current;
    if (!canvas || !tex) return;

    const t = clock.elapsedTime;
    timerRef.current += 0.016;
    glitchRef.current = Math.random();

    if (timerRef.current > 2.5) {
      timerRef.current = 0;
      slideIndexRef.current = (slideIndexRef.current + 1) % SLIDE_CONTENT.length;
    }

    const ctx = canvas.getContext('2d');
    const slide = SLIDE_CONTENT[slideIndexRef.current];
    const solved = puzzleState.projectorPuzzleSolved;

    if (solved) {
      ctx.fillStyle = '#001100';
    } else if (puzzleState.nightmareActive) {
      ctx.fillStyle = `rgb(${Math.floor(60 + glitchRef.current * 40)},0,0)`;
    } else {
      ctx.fillStyle = glitchRef.current > 0.92 ? '#111122' : '#050514';
    }
    ctx.fillRect(0, 0, 512, 288);

    if (solved) {
      ctx.fillStyle = '#00ff44';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▓ SEQUENCE DECODED ▓', 256, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px monospace';
      ctx.fillText('"THE LIBRARY KNOWS."', 256, 150);
      ctx.fillStyle = '#00aa44';
      ctx.font = '14px monospace';
      ctx.fillText('Staircase unlocked behind the stage.', 256, 210);
    } else if (puzzleState.nightmareActive) {
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ SUBJECT M.R. ⚠', 256, 70);
      ctx.fillStyle = '#ffaaaa';
      ctx.font = '16px monospace';
      ctx.fillText('EXPERIMENT 313 — SESSION 14', 256, 120);
      ctx.fillStyle = glitchRef.current > 0.5 ? '#ff4444' : '#ff8888';
      ctx.font = `bold ${20 + Math.floor(glitchRef.current * 8)}px monospace`;
      ctx.fillText('SHE SCREAMED AND NO ONE CAME', 256 + (glitchRef.current > 0.7 ? 4 : 0), 170);
      ctx.fillStyle = '#aa0000';
      ctx.font = '13px monospace';
      ctx.fillText('THE HALLUCINATIONS ARE REAL', 256, 220);
      ctx.fillText('YOU ARE NEXT', 256, 245);
    } else {
      const offsetX = glitchRef.current > 0.88 ? (glitchRef.current > 0.94 ? -6 : 6) : 0;
      for (let y = 0; y < 288; y += 4) {
        ctx.fillStyle = `rgba(0,0,0,${0.08 + glitchRef.current * 0.04})`;
        ctx.fillRect(0, y, 512, 1);
      }
      ctx.fillStyle = glitchRef.current > 0.9 ? '#ff3333' : '#cc2222';
      ctx.font = `bold 24px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(slide.line1, 256 + offsetX, 70);
      ctx.strokeStyle = '#330000';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(40, 90); ctx.lineTo(472, 90); ctx.stroke();
      ctx.fillStyle = glitchRef.current > 0.92 ? '#ffaaaa' : '#bbbbbb';
      ctx.font = '18px monospace';
      ctx.fillText(slide.line2, 256 + (glitchRef.current > 0.91 ? -offsetX : 0), 140);
      ctx.fillStyle = '#888888';
      ctx.font = '14px monospace';
      ctx.fillText(slide.line3, 256, 185);

      if (glitchRef.current > 0.75) {
        ctx.fillStyle = `rgba(255, 0, 0, ${Math.random()})`;
        ctx.font = 'bold 60px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SUBJECT M.R.', 256 + (Math.random()*10 - 5), 160 + (Math.random()*10 - 5));
      }

      if (glitchRef.current > 0.93) {
        ctx.fillStyle = `rgba(${Math.floor(glitchRef.current * 255)},0,50,0.4)`;
        ctx.fillRect(0, Math.floor(glitchRef.current * 280), 512, 6);
      }
    }

    tex.needsUpdate = true;
    if (meshRef.current) {
      const allWired = puzzleState.wiresConnected.every(Boolean);
      meshRef.current.visible = !(!allWired && glitchRef.current > 0.88);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, STAGE_Y + 4.5, -19.3]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <planeGeometry args={[14, 8]} />
      <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={0.9} />
    </mesh>
  );
}

// ─── HAUNTED INSTRUCTION WHITEBOARD (Explains the Puzzle) ─────────────────────
function HauntedWhiteboard() {
  const canvasRef = useRef();
  const textureRef = useRef();

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    canvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    textureRef.current = tex;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const t = clock.elapsedTime;
    
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, 1024, 512);

    ctx.fillStyle = '#222';
    ctx.font = 'bold 38px "Courier New", monospace';
    ctx.fillText('FACULTY MAINTENANCE NOTICE:', 50, 80);
    
    ctx.font = '28px "Courier New", monospace';
    ctx.fillText('[ ] RECONNECT the 3 power terminals on the lecturer desk.', 80, 150);
    ctx.fillText('[ ] FIND the 3 missing slide fragments (Search the seats).', 80, 210);
    ctx.fillText('[ ] DECRYPT the corrupted sequence at the projector console.', 80, 270);

    ctx.fillStyle = `rgba(180, 0, 0, ${0.4 + Math.sin(t * 3) * 0.2})`;
    ctx.font = 'bold 60px "Courier New", monospace';
    ctx.save();
    ctx.translate(120, 390);
    ctx.rotate(-0.05);
    ctx.fillText('WHERE IS SUBJECT M.R.?', 0, 0);
    ctx.restore();

    ctx.fillStyle = 'rgba(80, 0, 0, 0.8)';
    ctx.fillRect(800, 50, 5, 200 + Math.sin(t) * 20);
    ctx.fillRect(820, 70, 3, 150 + Math.cos(t * 1.5) * 30);

    textureRef.current.needsUpdate = true;
  });

  return (
    <group position={[-8, STAGE_Y + 3.0, -19.3]}>
      <mesh>
        <planeGeometry args={[7, 3.5]} />
        <meshStandardMaterial map={texture} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─── HIDDEN STAIRCASE (Now a sliding heavy metal door!) ───────────────────────
function HiddenStaircase({ revealed, onEnterStaircase }) {
  const doorRef = useRef();
  
  useFrame(() => {
    if (!doorRef.current) return;
    // When revealed becomes true, the door smoothly slides UP into the ceiling
    const targetY = revealed ? 6.5 : 1.5;
    doorRef.current.position.y += (targetY - doorRef.current.position.y) * 0.05;
  });

  return (
    <group 
      position={[8, STAGE_Y, -19.0]} 
      onClick={(e) => { if(revealed) { e.stopPropagation(); onEnterStaircase(); } }}
    >
      {/* Archway Frame (The wall around the door) */}
      <mesh position={[-2.2, 1.5, 0]}><boxGeometry args={[0.4, 5, 4]} /><meshStandardMaterial color="#0a0a0c" /></mesh>
      <mesh position={[2.2, 1.5, 0]}><boxGeometry args={[0.4, 5, 4]} /><meshStandardMaterial color="#0a0a0c" /></mesh>
      <mesh position={[0, 4.2, 0]}><boxGeometry args={[4.8, 0.4, 4]} /><meshStandardMaterial color="#0a0a0c" /></mesh>

      {/* The Sliding Metal Door */}
      <group ref={doorRef} position={[0, 1.5, 1.8]}>
        <mesh>
          <boxGeometry args={[4, 5, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Status Light on the door (Red when locked, Green when open) */}
        <mesh position={[0, 1.0, 0.11]}>
          <planeGeometry args={[1.5, 0.2]} />
          <meshStandardMaterial 
            color={revealed ? "#00ff44" : "#ff0000"} 
            emissive={revealed ? "#00ff44" : "#ff0000"} 
            emissiveIntensity={2} 
          />
        </mesh>
      </group>

      {/* The Stairs (waiting inside the dark tunnel) */}
      {[0, 1, 2, 3].map((s) => (
        <mesh key={s} position={[0, s * -0.4 + 0.5, s * -0.9 - 0.5]}>
          <boxGeometry args={[3.6, 0.3, 0.9]} />
          <meshStandardMaterial color="#050505" />
        </mesh>
      ))}

      {/* Eerie green light flooding out from inside the tunnel when opened */}
      <pointLight 
        color="#00ff44" 
        intensity={revealed ? 5 : 0} 
        distance={15} 
        position={[0, 0, -2]} 
      />
    </group>
  );
}

// ─── SEATING TIER MATRIX DATA ─────────────────────────────────────────────────
const TIER_DATA = (() => {
  const tiers = [];
  const seats = [];
  for (let row = 0; row < NUM_ROWS; row++) {
    const tierTopY = FLOOR_Y + row * ROW_RISE;   
    const zPos = 13.0 + row * ROW_DEPTH;          // Adjusted depths dynamically to sit inside the Z index cap
    const stepHeight = ROW_RISE * (row + 1) + 0.3; 
    tiers.push({
      key: `tier-${row}`,
      position: [0, FLOOR_Y - stepHeight / 2 + (row * ROW_RISE), zPos],
      args: [30, stepHeight, ROW_DEPTH],
    });
    for (let col = -NUM_COLS_HALF; col <= NUM_COLS_HALF; col++) {
      if (col === 0) continue; 
      seats.push({
        key: `seat-${row}-${col}`,
        startY: tierTopY,
        position: [col * SEAT_SPACING, tierTopY, zPos],
      });
    }
  }
  return { tiers, seats };
})();

// Remapped accessible green data shards inside the modified grid boundary array
const FRAGMENT_POSITIONS = [
  [2.0, FLOOR_Y + ROW_RISE * 1 + 0.1, 14.1],
  [-3.0, FLOOR_Y + ROW_RISE * 3 + 0.1, 16.3],
  [4.0,  FLOOR_Y + ROW_RISE * 4 + 0.1, 17.4],
];

// ─── MAIN STAGE 2 COMPONENT ──────────────────────────────────────────────────
export function LectureHall({ onObjectClick, puzzleState, onPuzzleUpdate }) {
  const chairsGroupRef = useRef();
  const emergencyLightRef1 = useRef();
  const emergencyLightRef2 = useRef();
  const projectorLightRef = useRef();
  const projectorMeshRef = useRef();
  const micMeshRef = useRef();
  const { camera } = useThree();

  const {
    collectedFragments = [],
    wiresConnected = [false, false, false],
    projectorPuzzleSolved = false,
    nightmareActive = false,
    staircaseRevealed = false,
  } = puzzleState || {};

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;

    if (chairsGroupRef.current) {
      chairsGroupRef.current.children.forEach((chair, i) => {
        if (i % 7 === 0) {
          chair.position.y = (chair.userData.startY ?? FLOOR_Y) + Math.sin(time * 2 + i) * 0.06;
        }
      });
    }

    const blink = Math.sin(time * 6) > 0 ? 1 : 0.05;
    if (emergencyLightRef1.current) emergencyLightRef1.current.intensity = blink * 60;
    if (emergencyLightRef2.current) {
      emergencyLightRef2.current.intensity = blink * 60;
    }

    if (projectorLightRef.current) {
      const allWired = wiresConnected.every(Boolean);
      if (!allWired) {
        projectorLightRef.current.intensity = Math.random() > 0.85 ? 0 : 100 + Math.random() * 50;
      } else {
        projectorLightRef.current.intensity = projectorPuzzleSolved ? 250 : 180;
      }
    }

    if (projectorMeshRef.current) {
      projectorMeshRef.current.lookAt(camera.position.x, camera.position.y, camera.position.z);
    }

    if (micMeshRef.current) {
      micMeshRef.current.material.emissiveIntensity = Math.random() > 0.988 ? 5 : 0;
    }

    // 🚪 AUTOMATIC PROXIMITY DETECTION TO UNLOCK STAGE 3
    if (staircaseRevealed) {
      const staircasePos = new THREE.Vector3(8, STAGE_Y, -19.0);
      if (camera.position.distanceTo(staircasePos) < 2.5) {
        onObjectClick('stage2_complete');
      }
    }
  });

  const tierMeshes = useMemo(() =>
    TIER_DATA.tiers.map(({ key, position, args }) => (
      <mesh key={key} position={position}>
        <boxGeometry args={args} />
        <meshStandardMaterial color="#18181a" roughness={1} />
      </mesh>
    ))
  , []);

  const seatGroups = useMemo(() =>
    TIER_DATA.seats.map(({ key, startY, position }) => (
      <group key={key} userData={{ startY }} position={position}>
        <ProceduralChair />
      </group>
    ))
  , []);

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={nightmareActive ? 0.1 : 0.04} color={nightmareActive ? '#440000' : '#ffffff'} />
      <pointLight ref={emergencyLightRef1} color="#ff0000" distance={30} position={[-12, FLOOR_Y + 7, 0]} decay={2} />
      <pointLight ref={emergencyLightRef2} color="#ff0000" distance={30} position={[12, FLOOR_Y + 7, 0]} decay={2} />
      <pointLight color="#111133" intensity={2} distance={40} position={[0, FLOOR_Y + 8, 10]} />

      {/* Structural shell wrappers locked to system constraints */}
      <mesh position={[0, FLOOR_Y + 10, 0]}><boxGeometry args={[32, 0.2, 40]} /><meshStandardMaterial color="#050506" /></mesh>
      <mesh position={[0, 4, 19.5]}><boxGeometry args={[32, 12, 0.2]} /><meshStandardMaterial color="#060607" /></mesh>
      <mesh position={[0, 4, -19.5]}><boxGeometry args={[32, 12, 0.2]} /><meshStandardMaterial color="#050506" side={2} /></mesh>
      <mesh position={[-16, 4, 0]}><boxGeometry args={[0.2, 12, 40]} /><meshStandardMaterial color="#060607" /></mesh>
      <mesh position={[16, 4, 0]}><boxGeometry args={[0.2, 12, 40]} /><meshStandardMaterial color="#060607" /></mesh>

      {/* Primary Walkway Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]}>
        <planeGeometry args={[32, 40]} />
        <meshStandardMaterial color="#0a0a0c" roughness={1} />
      </mesh>

      {/* Sunken Stage Area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, STAGE_Y, -14.5]}>
        <planeGeometry args={[32, 10]} />
        <meshStandardMaterial color="#0d0d10" roughness={1} />
      </mesh>
      <mesh position={[0, STAGE_Y + 0.6, -9.5]}>
        <boxGeometry args={[32, 1.2, 0.2]} />
        <meshStandardMaterial color="#111114" roughness={0.9} />
      </mesh>

      {/* Environment Construction */}
      {tierMeshes}
      <group ref={chairsGroupRef}>{seatGroups}</group>
      <NightmareStudents visible={nightmareActive} />

      {/* Lecturer's Desk Platform */}
      <mesh position={[0, STAGE_Y + 0.15, -14]}>
        <boxGeometry args={[26, 0.3, 10]} />
        <meshStandardMaterial color="#14141a" roughness={0.9} />
      </mesh>
      <mesh position={[0, STAGE_Y + 1.05, -13]}>
        <boxGeometry args={[4.5, 1.2, 1.4]} />
        <meshStandardMaterial color="#1e1510" roughness={0.85} />
      </mesh>

      {/* Microphone interaction node */}
      <group position={[1.2, STAGE_Y + 1.65, -13]}>
        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.018, 0.018, 0.6, 8]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh>
        <mesh ref={micMeshRef} position={[0, 0.65, 0]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color="#111" emissive="#ff0000" emissiveIntensity={0} /></mesh>
      </group>

      <ShadowFigure position={[-3.2, STAGE_Y, -14]} />

      {/* Wiring calibration hubs on desk */}
      <WireTerminal position={[-1, STAGE_Y + 1.65, -12.5]} connected={wiresConnected[0]} onClick={() => onPuzzleUpdate({ type: 'CONNECT_WIRE', index: 0 })} />
      <WireTerminal position={[0, STAGE_Y + 1.65, -12.5]} connected={wiresConnected[1]} onClick={() => onPuzzleUpdate({ type: 'CONNECT_WIRE', index: 1 })} />
      <WireTerminal position={[1, STAGE_Y + 1.65, -12.5]} connected={wiresConnected[2]} onClick={() => onPuzzleUpdate({ type: 'CONNECT_WIRE', index: 2 })} />

      {/* Projector System Module */}
      <group position={[0, STAGE_Y + 1.65, -13.5]} ref={projectorMeshRef}>
        <mesh><boxGeometry args={[0.75, 0.35, 0.95]} /><meshStandardMaterial color="#2a2a2a" metalness={0.3} /></mesh>
        <mesh position={[0, 0, 0.52]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.13, 0.13, 0.09, 12]} /><meshStandardMaterial color="#111" emissive="#aaddff" emissiveIntensity={wiresConnected.every(Boolean) ? 4 : 0.5} /></mesh>
        <spotLight ref={projectorLightRef} position={[0, 0, 0.55]} target-position={[0, STAGE_Y + 4.5, -19.3]} intensity={180} angle={0.42} penumbra={0.25} color="#ddeeff" decay={1.1} castShadow={false} />
      </group>

      <ProjectorScreen puzzleState={puzzleState} onClick={() => onObjectClick('projector')} />

      {FRAGMENT_POSITIONS.map((pos, i) => (
        <SlideFragment key={`frag-${i}`} position={pos} slideId={i} isCollected={collectedFragments.includes(i)} onCollect={(fragId) => onPuzzleUpdate({ type: 'COLLECT_FRAGMENT', id: fragId })} />
      ))}

      <HauntedWhiteboard />
      <HiddenStaircase revealed={staircaseRevealed} />
    </group>
  );
}

// ─── PROJECTOR PUZZLE OVERLAY (2D HUD) ───────────────────────────────────────
export function ProjectorPuzzleOverlay({ isOpen, puzzleState, onDispatch, onClose }) {
  const [dragOrder, setDragOrder] = useState([...PROJECTOR_FILES]);
  const [solved, setSolved] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [nightmareTriggered, setNightmareTriggered] = useState(false);
  const [nightmareCountdown, setNightmareCountdown] = useState(0);
  const [wrongOrder, setWrongOrder] = useState(false);

  const allFragmentsCollected = puzzleState.collectedFragments.length === 3;
  const allWiresConnected = puzzleState.wiresConnected.every(Boolean);
  const canArrange = allFragmentsCollected && allWiresConnected;

  const moveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...dragOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setDragOrder(newOrder);
  };

  const moveDown = (index) => {
    if (index === dragOrder.length - 1) return;
    const newOrder = [...dragOrder];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setDragOrder(newOrder);
  };

  const checkOrder = useCallback(() => {
    const ids = dragOrder.map((f) => f.id);
    const correct = ids.every((id, i) => id === PROJECTOR_CORRECT_ORDER[i]);
    if (correct) {
      onDispatch({ type: 'SOLVE_PROJECTOR' });
      onDispatch({ type: 'TRIGGER_NIGHTMARE' });
      setSolved(true);
      setNightmareTriggered(true);
      setNightmareCountdown(6);
      setWrongOrder(false);
    } else {
      setWrongOrder(true);
      setTimeout(() => setWrongOrder(false), 1500);
    }
  }, [dragOrder, onDispatch]);

  useEffect(() => {
    if (nightmareCountdown <= 0) return;
    const timer = setTimeout(() => {
      setNightmareCountdown((c) => {
        if (c <= 1) {
          onDispatch({ type: 'END_NIGHTMARE' });
          onDispatch({ type: 'REVEAL_STAIRCASE' });
          setShowMessage(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [nightmareCountdown, onDispatch]);

  if (!isOpen) return null;

  const S = {
    overlay: { position:'fixed', inset:0, background:'rgba(5,10,5,0.95)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, fontFamily:'"Courier New", monospace' },
    panel: { background:'#000000', border:'2px solid #00ff44', padding:'2rem', width:'540px', color:'#00ff44', boxShadow:'0 0 20px rgba(0,255,68,0.2)' },
    header: { display:'flex', justifyContent:'space-between', borderBottom:'1px solid #00ff44', paddingBottom:'1rem', marginBottom:'1.5rem' },
    title: { margin:0, fontSize:18, letterSpacing:2 },
    closeBtn: { background:'none', border:'none', color:'#00ff44', cursor:'pointer', fontSize:20 },
    stepBox: { marginBottom:'1.5rem', borderLeft:'2px solid #00ff44', paddingLeft:'1rem' },
    label: { margin:'0 0 10px', fontSize:14, fontWeight:'bold' },
    status: (ok) => ({ color: ok ? '#00ff44' : '#ff0000', fontSize:12, marginBottom:4 }),
    slideRow: { padding:'10px', border:'1px solid #00ff44', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center', background:'#001100' },
    btnContainer: { display:'flex', flexDirection:'column', gap:'4px' },
    arrowBtn: { background:'none', border:'1px solid #00ff44', color:'#00ff44', cursor:'pointer', width:'30px', height:'24px' },
    playBtn: { width:'100%', padding:'12px', background:'#00ff44', color:'#000', border:'none', fontSize:16, fontWeight:'bold', cursor:'pointer', marginTop:'10px' },
    errorBtn: { width:'100%', padding:'12px', background:'#ff0000', color:'#fff', border:'none', fontSize:16, fontWeight:'bold', marginTop:'10px' }
  };

  return (
    <div style={S.overlay}>
      <div style={S.panel}>
        <div style={S.header}>
          <h2 style={S.title}>UM_SYS_TERMINAL v2.1</h2>
          <button style={S.closeBtn} onClick={onClose}>[X]</button>
        </div>

        <div style={S.stepBox}>
          <p style={S.label}>1. POWER CALIBRATION</p>
          {puzzleState.wiresConnected.map((ok, i) => (
            <p key={i} style={S.status(ok)}>{ok ? `[OK] Terminal ${i+1} Connected` : `[ERR] Terminal ${i+1} Offline`}</p>
          ))}
        </div>

        <div style={S.stepBox}>
          <p style={S.label}>2. MEMORY FRAGMENTS</p>
          {[0,1,2].map((i) => {
            const ok = puzzleState.collectedFragments.includes(i);
            return <p key={i} style={S.status(ok)}>{ok ? `[OK] Sector ${i+1} Recovered` : `[ERR] Sector ${i+1} Missing`}</p>;
          })}
        </div>

        <div style={S.stepBox}>
          <p style={S.label}>3. SEQUENCE DECRYPTION</p>
          {!canArrange && <p style={{color:'#ff0000', fontSize:12}}>STATUS: LOCKED. Complete steps 1 and 2.</p>}
          
          {canArrange && !solved && (
            <>
              <p style={{color:'#00ff44', fontSize:12, marginBottom:10}}>Arrange fragments chronologically to decrypt:</p>
              {dragOrder.map((file, idx) => (
                <div key={file.id} style={S.slideRow}>
                  <div>
                    <span style={{display:'block', fontSize:14}}>{file.corrupt}</span>
                    <span style={{fontSize:10, color:'#00aa44'}}>{file.hint}</span>
                  </div>
                  <div style={S.btnContainer}>
                    <button style={S.arrowBtn} onClick={() => moveUp(idx)}>▲</button>
                    <button style={S.arrowBtn} onClick={() => moveDown(idx)}>▼</button>
                  </div>
                </div>
              ))}
              <button style={wrongOrder ? S.errorBtn : S.playBtn} onClick={checkOrder}>
                {wrongOrder ? 'SEQUENCE INVALID' : 'EXECUTE DECRYPTION'}
              </button>
            </>
          )}

          {nightmareTriggered && nightmareCountdown > 0 && (
            <div style={{background:'#ff0000', color:'#fff', padding:'1rem', textAlign:'center', marginTop:'1rem'}}>
              <h3 style={{margin:0}}>SYSTEM OVERRIDE DETECTED</h3>
              <p>Purging unauthorized access... {nightmareCountdown}s</p>
            </div>
          )}

          {showMessage && (
            <div style={{background:'#004400', padding:'1rem', textAlign:'center', marginTop:'1rem', border:'1px solid #00ff44'}}>
              <h3 style={{margin:0, color:'#00ff44'}}>DECRYPTION SUCCESSFUL</h3>
              <p style={{fontSize:20, margin:'10px 0'}}>"{HIDDEN_MESSAGE}"</p>
              <p style={{fontSize:12}}>Access path opened behind stage.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ENDING CINEMATIC ────────────────────────────────────────────────────────
export function EndingCinematic({ onPlayAgain }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'#000', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'monospace' }}>
      <div style={{ maxWidth:580, width:'90%', textAlign:'center' }}>
        {CINEMATIC_LINES.map((line, i) => (
          <p key={i} style={{
            opacity:0, animation:`fadeIn 1s ease-in forwards ${i*2}s`,
            fontSize: i===1 ? 12 : 16,
            color: i===1 ? '#ff4444' : '#cccccc',
            marginBottom:'1.4rem', lineHeight:1.7,
          }}>
            {line}
          </p>
        ))}
        <button onClick={onPlayAgain} style={{
          marginTop:'1.5rem', padding:'10px 28px',
          background:'transparent', border:'1px solid #555',
          color:'#999', fontFamily:'monospace', fontSize:13,
          cursor:'pointer', borderRadius:3, opacity:0,
          animation:`fadeIn 1s ease-in forwards ${CINEMATIC_LINES.length*2+1}s`,
        }}>
          PLAY AGAIN
        </button>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}