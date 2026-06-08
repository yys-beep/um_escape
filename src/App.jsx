import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import './App.css';

const WALK_SPEED = 4.5;
const DORM_BOUNDS = 4.5;
const LECTURE_BOUNDS = 19;
const LIBRARY_BOUNDS_X = 9;
const LIBRARY_BOUNDS_Z = 26;

function usePlayerControls() {
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const keyMap = {
      KeyW: 'forward',
      KeyS: 'backward',
      KeyA: 'left',
<<<<<<< HEAD
      KeyD: 'right',
    };

    const onKeyDown = (e) => {
      const action = keyMap[e.code];
      if (action) keys.current[action] = true;
    };

    const onKeyUp = (e) => {
      const action = keyMap[e.code];
      if (action) keys.current[action] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return keys;
}

function normalizeLibraryPosition(x, z) {
  return {
    x: (x + LIBRARY_BOUNDS_X) / (2 * LIBRARY_BOUNDS_X),
    z: (z + LIBRARY_BOUNDS_Z) / (2 * LIBRARY_BOUNDS_Z),
  };
}

const LIBRARY_BOOKSHELF_DIMENSIONS = { width: 2, height: 8, depth: 10 };

const LIBRARY_BOOKSHELVES = [
  { id: 'shelf-1', x: -7, z: 14 },
  { id: 'shelf-2', x: 7, z: 14 },
  { id: 'shelf-3', x: -7, z: 8 },
  { id: 'shelf-4', x: 5, z: 8 },
  { id: 'shelf-5', x: 7, z: 2 },
  { id: 'shelf-6', x: -5, z: 2 },
  { id: 'shelf-7', x: -7, z: -4 },
  { id: 'shelf-8', x: 6, z: -4 },
  { id: 'shelf-9', x: -7, z: -10 },
  { id: 'shelf-10', x: 7, z: -10 },
  { id: 'shelf-11', x: -7, z: -16 },
  { id: 'shelf-12', x: 7, z: -16 },
  { id: 'shelf-13', x: -4, z: -20 },
  { id: 'shelf-14', x: 4, z: -20 },
];

function getBookshelfMinimapStyle(shelf) {
  const center = normalizeLibraryPosition(shelf.x, shelf.z);
  const widthPct = (LIBRARY_BOOKSHELF_DIMENSIONS.width / (2 * LIBRARY_BOUNDS_X)) * 100;
  const heightPct = (LIBRARY_BOOKSHELF_DIMENSIONS.depth / (2 * LIBRARY_BOUNDS_Z)) * 100;

  return {
    left: `${center.x * 100 - widthPct / 2}%`,
    top: `${center.z * 100 - heightPct / 2}%`,
    width: `${widthPct}%`,
    height: `${heightPct}%`,
  };
}

const STAFF_PATROL_X = 3.5;
const STAFF_PATROL_DISTANCE = 18;
const STAFF_CATCH_DISTANCE = 2.5;

const LIBRARY_ARCHIVE_CODE = '0313';

// 📚 Book Data
const LIBRARY_HIDDEN_BOOKS = [
  {
    id: 'book_1',
    title: 'Volume I: Cover-up',
    position: [-2.45, -1, -9],
    geometry: [0.1, 0.6, 0.4],
    color: '#552222',
    emissive: '#552222',
    callNumber: '099.00',
    lore: 'The spine is warm. A name is scratched out beneath the dust jacket.',
  },
  {
    id: 'book_2',
    title: 'Volume II: Logs',
    position: [2.45, -1, -13],
    geometry: [0.1, 0.6, 0.4],
    color: '#223355',
    emissive: '#223355',
    callNumber: '312.00',
    lore: 'Experiment logs reference a subject who stopped attending lectures.',
  },
  {
    id: 'book_3',
    title: 'Volume III: Notes',
    position: [1, -1, -9.45],
    geometry: [0.4, 0.6, 0.1],
    color: '#225522',
    emissive: '#225522',
    callNumber: '150.00',
    lore: 'A bookmark reads: "She asked too many questions about Project 313."',
  },
  {
    id: 'book_4',
    title: 'Volume IV: Terminated',
    position: [-1, -1, -14.45],
    geometry: [0.4, 0.6, 0.1],
    color: '#554422',
    emissive: '#554422',
    callNumber: '399.00',
    lore: 'The final page is stamped: TERMINATED. The ink is still wet.',
  },
];

function Player({ stage, onPositionUpdate, resetNonce = 0 }) {
  const { camera } = useThree();
  const keys = usePlayerControls();
  const direction = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const positionThrottleRef = useRef(0);
  const lastReportedRef = useRef({ x: 0, z: 0 });

  useEffect(() => {
    if (stage === 2) {
      camera.position.set(0, 0, 12);
    } else if (stage === 3) {
      camera.position.set(0, 0, 14);
      lastReportedRef.current = { x: 0, z: 14 };
      positionThrottleRef.current = 0;
      onPositionUpdate?.(0, 14);
    } else {
      camera.position.set(0, 0, 0);
    }
  }, [stage, camera, onPositionUpdate, resetNonce]);

  useFrame((_, delta) => {
    camera.getWorldDirection(direction);
    direction.y = 0;

    if (direction.lengthSq() > 0.0001) {
      direction.normalize();
    } else {
      direction.set(0, 0, -1);
    }

    right.crossVectors(direction, up).normalize();

    const move = WALK_SPEED * delta;

    if (keys.current.forward) camera.position.addScaledVector(direction, move);
    if (keys.current.backward) camera.position.addScaledVector(direction, -move);
    if (keys.current.left) camera.position.addScaledVector(right, -move);
    if (keys.current.right) camera.position.addScaledVector(right, move);

    if (stage === 1) {
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -DORM_BOUNDS, DORM_BOUNDS);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -DORM_BOUNDS, DORM_BOUNDS);
    } else if (stage === 2) {
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -LECTURE_BOUNDS, LECTURE_BOUNDS);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -LECTURE_BOUNDS, LECTURE_BOUNDS);
    } else {
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -LIBRARY_BOUNDS_X, LIBRARY_BOUNDS_X);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -LIBRARY_BOUNDS_Z, LIBRARY_BOUNDS_Z);
    }
    camera.position.y = 0;

    if (stage === 3 && onPositionUpdate) {
      const now = performance.now();
      if (now - positionThrottleRef.current < 100) return;

      const { x, z } = camera.position;
      const dx = Math.abs(x - lastReportedRef.current.x);
      const dz = Math.abs(z - lastReportedRef.current.z);

      if (dx > 0.08 || dz > 0.08) {
        positionThrottleRef.current = now;
        lastReportedRef.current = { x, z };
        onPositionUpdate(x, z);
      }
    }
  });

  return null;
}

// 🔦 Flashlight (Now supports total blackout)
function Flashlight({ isBlackout }) {
  const lightRigRef = useRef(null);
  const spotRef = useRef(null);
  const { camera, scene } = useThree();

  useEffect(() => {
    if (spotRef.current) {
      scene.add(spotRef.current.target);
    }
  }, [scene]);

  useFrame(() => {
    if (!lightRigRef.current || !spotRef.current) return;
    lightRigRef.current.position.copy(camera.position);
    camera.getWorldDirection(spotRef.current.target.position);
    spotRef.current.target.position.multiplyScalar(10).add(camera.position);
    spotRef.current.target.updateMatrixWorld();
  });

  return (
    <group ref={lightRigRef}>
      <spotLight
        ref={spotRef}
        color="#f8f8ff"
        intensity={isBlackout ? 0 : 500}
        angle={Math.PI / 8}
        penumbra={0.4}
        distance={150}
        decay={2}
      />
      <pointLight intensity={isBlackout ? 0 : 30} distance={5} color="#ffffff" />
    </group>
  );
}

// 🛏️ STAGE 1: Kolej Kediaman Ke-1 (Dorm Room) — fully decorated
function DormRoom({ onObjectClick, inventory, onEscape }) {
  const ambientRef = useRef();
  const fluorescentRef = useRef();
  const flickerRef = useRef(0);

  // HORROR EVENT: Realistic fluorescent tube flicker
  useFrame((_, delta) => {
    flickerRef.current += delta;
    if (ambientRef.current) {
      // Rare deep flicker
      const flicker = Math.random() > 0.985 ? 0.005 : 0.055;
      ambientRef.current.intensity = flicker;
    }
    if (fluorescentRef.current) {
      // Occasional hum-flicker on the tube
      fluorescentRef.current.intensity = Math.random() > 0.97 ? 0.2 : 1.4;
    }
  });

  const handleDoorClick = (e) => {
    e.stopPropagation();
    if (inventory.includes('Keycard')) {
      onEscape();
    } else {
      onObjectClick('door_locked');
    }
  };

  return (
    <group>
      <ambientLight ref={ambientRef} intensity={0.055} color="#c8c8e8" />

      {/* Fluorescent tube ceiling light — typical KK1 */}
      <pointLight ref={fluorescentRef} position={[0, 2.8, 0]} intensity={1.4} color="#d8deff" distance={12} decay={2} />
      <pointLight position={[0, 2.8, 0]} intensity={0.3} color="#8888cc" distance={6} decay={2} />




      {/* === ROOM SHELL === */}
      {/* Floor — worn concrete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.98} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#22222a" roughness={0.9} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 0.35, -4.9]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#1e1e28" roughness={0.95} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-4.9, 0.35, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#1c1c26" roughness={0.95} />
      </mesh>
      {/* Right wall */}
      <mesh position={[4.9, 0.35, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#1c1c26" roughness={0.95} />
      </mesh>
      {/* Front wall (with door gap) */}
      <mesh position={[-2.8, 0.35, 4.9]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[4.5, 8]} />
        <meshStandardMaterial color="#1e1e28" roughness={0.95} />
      </mesh>
      <mesh position={[3.2, 0.35, 4.9]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3, 8]} />
        <meshStandardMaterial color="#1e1e28" roughness={0.95} />
      </mesh>
      {/* Door lintel above door */}
      <mesh position={[0.2, 2.2, 4.9]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.6, 2]} />
        <meshStandardMaterial color="#1e1e28" roughness={0.95} />
      </mesh>

      {/* Fluorescent tube fixture on ceiling */}
      <mesh position={[0, 3.15, 0]}>
        <boxGeometry args={[2.5, 0.06, 0.12]} />
        <meshStandardMaterial color="#ccccdd" emissive="#aaaacc" emissiveIntensity={1.2} />
      </mesh>
      {/* Fixture casing */}
      <mesh position={[0, 3.12, 0]}>
        <boxGeometry args={[2.6, 0.08, 0.22]} />
        <meshStandardMaterial color="#444450" metalness={0.6} roughness={0.4} />
      </mesh>




      {/* === DOOR (front wall, clickable) === */}
      <group position={[0.2, -0.15, 4.85]} onClick={handleDoorClick}>
        {/* Door panel */}
        <mesh>
          <boxGeometry args={[2.3, 4.5, 0.12]} />
          <meshStandardMaterial color="#2a1f18" roughness={0.88} />
        </mesh>
        {/* Door frame */}
        <mesh position={[0, 0, -0.07]}>
          <boxGeometry args={[2.55, 4.75, 0.06]} />
          <meshStandardMaterial color="#3a2e28" roughness={0.85} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.9, 0, 0.1]}>
          <boxGeometry args={[0.08, 0.35, 0.08]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Keycard reader glow */}
        <mesh position={[1.0, -0.5, 0.08]}>
          <boxGeometry args={[0.15, 0.25, 0.05]} />
          <meshStandardMaterial
            color={inventory.includes('Keycard') ? '#003300' : '#330000'}
            emissive={inventory.includes('Keycard') ? '#00ff44' : '#ff0000'}
            emissiveIntensity={0.9}
          />
        </mesh>
      </group>




      {/* === LONG BUILT-IN STUDY DESK (left wall) === */}
      <group position={[-3.2, -1.55, 0.5]}>
        {/* Desk surface */}
        <mesh>
          <boxGeometry args={[1.5, 0.08, 3.5]} />
          <meshStandardMaterial color="#5a3a28" roughness={0.85} />
        </mesh>
        {/* Desk legs */}
        <mesh position={[-0.65, -0.55, -1.5]}>
          <boxGeometry args={[0.08, 1.0, 0.08]} />
          <meshStandardMaterial color="#3a2518" />
        </mesh>
        <mesh position={[0.65, -0.55, -1.5]}>
          <boxGeometry args={[0.08, 1.0, 0.08]} />
          <meshStandardMaterial color="#3a2518" />
        </mesh>
        <mesh position={[-0.65, -0.55, 1.5]}>
          <boxGeometry args={[0.08, 1.0, 0.08]} />
          <meshStandardMaterial color="#3a2518" />
        </mesh>
        <mesh position={[0.65, -0.55, 1.5]}>
          <boxGeometry args={[0.08, 1.0, 0.08]} />
          <meshStandardMaterial color="#3a2518" />
        </mesh>
        {/* Overhead shelf unit */}
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1.5, 0.06, 3.5]} />
          <meshStandardMaterial color="#4a3020" roughness={0.88} />
        </mesh>
        {/* Shelf back panel */}
        <mesh position={[-0.6, 0.45, 0]}>
          <boxGeometry args={[0.06, 0.6, 3.5]} />
          <meshStandardMaterial color="#3a2418" roughness={0.9} />
        </mesh>
      </group>



      {/* === LAPTOP ON DESK (interactive — timetable puzzle) === */}
      <group position={[-3.1, -1.42, -0.2]} onClick={(e) => { e.stopPropagation(); onObjectClick('desk'); }}>
        {/* Base */}
        <mesh>
          <boxGeometry args={[0.7, 0.04, 0.5]} />
          <meshStandardMaterial color="#222228" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Screen hinge open ~110deg */}
        <mesh position={[0, 0.22, -0.2]} rotation={[-0.55, 0, 0]}>
          <boxGeometry args={[0.7, 0.42, 0.025]} />
          <meshStandardMaterial color="#111118" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Screen glow */}
        <mesh position={[0, 0.23, -0.19]} rotation={[-0.55, 0, 0]}>
          <boxGeometry args={[0.64, 0.38, 0.01]} />
          <meshStandardMaterial color="#334" emissive="#2244aa" emissiveIntensity={0.6} />
        </mesh>
        <pointLight position={[0, 0.3, -0.1]} intensity={4} distance={1.2} color="#2244aa" decay={2} />
      </group>



      {/* === STACKS OF TEXTBOOKS on desk shelf === */}
      {[
        { pos: [-3.15, -1.22, 1.2], color: '#882222', w: 0.22, h: 0.32, d: 0.16 },
        { pos: [-3.15, -1.22, 0.9], color: '#224488', w: 0.22, h: 0.38, d: 0.16 },
        { pos: [-3.15, -1.22, 0.6], color: '#226622', w: 0.22, h: 0.28, d: 0.16 },
        { pos: [-3.15, -1.0, 1.2], color: '#664422', w: 0.22, h: 0.22, d: 0.16 },
      ].map((b, i) => (
        <mesh key={i} position={b.pos}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.color} roughness={0.85} />
        </mesh>
      ))}



      {/* === EMPTY INDOMIE CUPS on desk === */}
      {[[-3.0, -1.38, -0.8], [-2.8, -1.38, -1.1]].map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.08, 0.07, 0.12, 8]} />
          <meshStandardMaterial color="#cc6622" roughness={0.7} />
        </mesh>
      ))}



      {/* === MILO TIN on shelf === */}
      <mesh position={[-3.15, -0.95, -0.5]}>
        <cylinderGeometry args={[0.09, 0.09, 0.28, 12]} />
        <meshStandardMaterial color="#3a2200" roughness={0.6} metalness={0.3} />
      </mesh>



      {/* === STICKY NOTES on wall above desk === */}
      {[
        { pos: [-4.7, 0.4, -0.5], rot: [0, Math.PI / 2, 0.05], color: '#eecc44' },
        { pos: [-4.7, 0.1, 0.1], rot: [0, Math.PI / 2, -0.04], color: '#ee8888' },
        { pos: [-4.7, 0.5, 0.6], rot: [0, Math.PI / 2, 0.02], color: '#44aaee' },
      ].map((n, i) => (
        <mesh key={i} position={n.pos} rotation={n.rot}>
          <planeGeometry args={[0.28, 0.28]} />
          <meshStandardMaterial color={n.color} roughness={0.9} />
        </mesh>
      ))}



      {/* === CORKBOARD on back wall === */}
      <mesh position={[1.5, 0.6, -4.82]}>
        <boxGeometry args={[1.8, 1.1, 0.04]} />
        <meshStandardMaterial color="#7a5c3a" roughness={0.95} />
      </mesh>
      {/* Papers pinned to corkboard */}
      {[
        { pos: [1.2, 0.7, -4.79], color: '#f2e8cc' },
        { pos: [1.7, 0.5, -4.79], color: '#e8ddc8' },
        { pos: [1.4, 0.9, -4.79], color: '#f5f0e0' },
      ].map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[0, 0, (i - 1) * 0.08]}>
          <planeGeometry args={[0.5, 0.38]} />
          <meshStandardMaterial color={p.color} roughness={0.95} />
        </mesh>
      ))}



      {/* === BUNK BED (right side) === */}
      <group position={[3.5, -0.9, -1.0]}>
        {/* Lower bed frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.6, 0.1, 3.2]} />
          <meshStandardMaterial color="#303038" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* Lower mattress */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[1.55, 0.18, 3.1]} />
          <meshStandardMaterial color="#2a2a40" roughness={0.9} />
        </mesh>
        {/* Lower pillow */}
        <mesh position={[0, 0.22, -1.35]}>
          <boxGeometry args={[1.0, 0.1, 0.5]} />
          <meshStandardMaterial color="#3a3a5a" roughness={0.85} />
        </mesh>
        {/* Patterned bolster */}
        <mesh position={[0.55, 0.22, -0.8]}>
          <cylinderGeometry args={[0.07, 0.07, 0.9, 8]} />
          <meshStandardMaterial color="#223355" roughness={0.85} />
        </mesh>
        {/* Upper bed frame */}
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[1.6, 0.1, 3.2]} />
          <meshStandardMaterial color="#303038" metalness={0.85} roughness={0.3} />
        </mesh>
        {/* Upper mattress */}
        <mesh position={[0, 1.7, 0]}>
          <boxGeometry args={[1.55, 0.18, 3.1]} />
          <meshStandardMaterial color="#22223a" roughness={0.9} />
        </mesh>
        {/* Upper pillow */}
        <mesh position={[0, 1.82, -1.35]}>
          <boxGeometry args={[1.0, 0.1, 0.5]} />
          <meshStandardMaterial color="#2a2a44" roughness={0.85} />
        </mesh>
        {/* Bed corner posts */}
        {[[-0.75, -1.35], [0.75, -1.35], [-0.75, 1.35], [0.75, 1.35]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.85, z]}>
            <boxGeometry args={[0.07, 3.5, 0.07]} />
            <meshStandardMaterial color="#404048" metalness={0.85} roughness={0.3} />
          </mesh>
        ))}
        {/* Ladder */}
        <mesh position={[0.82, 0.8, 1.4]}>
          <boxGeometry args={[0.05, 1.6, 0.05]} />
          <meshStandardMaterial color="#404048" metalness={0.8} />
        </mesh>
        {[0.2, 0.7, 1.2].map((y, i) => (
          <mesh key={i} position={[0.82, y, 1.4]}>
            <boxGeometry args={[0.05, 0.05, 0.28]} />
            <meshStandardMaterial color="#505058" metalness={0.8} />
          </mesh>
        ))}
      </group>



      {/* === WARDROBE (back-right corner) === */}
      <group position={[3.4, 0.1, -3.8]}>
        <mesh>
          <boxGeometry args={[1.5, 5.8, 0.8]} />
          <meshStandardMaterial color="#2e2a24" roughness={0.88} />
        </mesh>
        {/* Wardrobe door seam */}
        <mesh position={[0, 0, 0.41]}>
          <boxGeometry args={[0.04, 5.8, 0.02]} />
          <meshStandardMaterial color="#1a1612" />
        </mesh>
        {/* Handles */}
        <mesh position={[-0.2, 0.2, 0.43]}>
          <boxGeometry args={[0.06, 0.22, 0.06]} />
          <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.2, 0.2, 0.43]}>
          <boxGeometry args={[0.06, 0.22, 0.06]} />
          <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>



      {/* === METAL LOCKER — interactive === */}
      <group position={[-3.5, -0.3, -3.5]} onClick={(e) => { e.stopPropagation(); onObjectClick('locker'); }}>
        <mesh>
          <boxGeometry args={[1.1, 4.5, 1.0]} />
          <meshStandardMaterial color="#2a2e38" metalness={0.92} roughness={0.35} />
        </mesh>
        {/* Locker door vent slats */}
        {[-1.2, -0.6, 0.0, 0.6, 1.2].map((y, i) => (
          <mesh key={i} position={[0, y, 0.51]}>
            <boxGeometry args={[0.7, 0.06, 0.02]} />
            <meshStandardMaterial color="#222230" metalness={0.9} />
          </mesh>
        ))}
        {/* Padlock */}
        <mesh position={[0.3, -0.1, 0.52]}>
          <boxGeometry args={[0.18, 0.22, 0.08]} />
          <meshStandardMaterial color="#888888" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Subtle red glow to signal interactivity */}
        <pointLight position={[0, 0, 0.6]} intensity={2} distance={1.5} color="#ff2200" decay={2} />
      </group>



      {/* === DIARY ON DESK — interactive === */}
      <mesh position={[-3.1, -1.38, 0.35]} rotation={[0, 0.15, 0]} onClick={(e) => { e.stopPropagation(); onObjectClick('diary'); }}>
        <boxGeometry args={[0.38, 0.04, 0.28]} />
        <meshStandardMaterial color="#882222" roughness={0.85} emissive="#440000" emissiveIntensity={0.3} />
      </mesh>
      {/* Diary pages edge */}
      <mesh position={[-3.1, -1.35, 0.35]} rotation={[0, 0.15, 0]}>
        <boxGeometry args={[0.34, 0.04, 0.26]} />
        <meshStandardMaterial color="#f0e8d8" roughness={0.95} />
      </mesh>



      {/* === TANGLED CABLES on desk === */}
      <mesh position={[-2.9, -1.47, -0.4]}>
        <torusGeometry args={[0.12, 0.02, 4, 8]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      <mesh position={[-2.8, -1.47, -0.5]} rotation={[0, 0.8, 0]}>
        <torusGeometry args={[0.09, 0.015, 4, 8]} />
        <meshStandardMaterial color="#333322" roughness={0.9} />
      </mesh>



      {/* === POWER STRIP on floor near desk === */}
      <mesh position={[-4.0, -2.42, 0.2]} rotation={[0, 0.1, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.12]} />
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </mesh>
      {/* Power strip LED */}
      <mesh position={[-3.72, -2.38, 0.2]}>
        <boxGeometry args={[0.03, 0.03, 0.03]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
      </mesh>



      {/* === LAUNDRY BASKET under lower bunk === */}
      <mesh position={[3.2, -2.2, 0.8]}>
        <cylinderGeometry args={[0.35, 0.3, 0.5, 10]} />
        <meshStandardMaterial color="#3344aa" roughness={0.9} />
      </mesh>



      {/* === FLIP FLOPS near bed === */}
      {[0.15, -0.15].map((x, i) => (
        <mesh key={i} position={[2.6 + x, -2.45, 1.4]} rotation={[-Math.PI / 2, 0, i * 0.3]}>
          <boxGeometry args={[0.12, 0.28, 0.04]} />
          <meshStandardMaterial color="#cc8822" roughness={0.9} />
        </mesh>
      ))}



      {/* === HANGING CLOTHES on wardrobe door === */}
      {[0, 0.25].map((x, i) => (
        <mesh key={i} position={[2.7 + x, 0.6, -3.42]}>
          <boxGeometry args={[0.06, 1.1, 0.4]} />
          <meshStandardMaterial color={i === 0 ? '#334466' : '#442233'} roughness={0.9} />
        </mesh>
      ))}



      {/* === ORBITAL FAN on wall === */}
      <group position={[4.82, 1.8, -2.5]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.06, 16]} />
          <meshStandardMaterial color="#555560" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.35, 0.025, 8, 16]} />
          <meshStandardMaterial color="#444450" metalness={0.6} />
        </mesh>
      </group>



      {/* === WINDOW (louvered glass, left wall) === */}
      <group position={[-4.82, 0.8, -2.5]}>
        {/* Window frame */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[1.6, 1.2, 0.06]} />
          <meshStandardMaterial color="#3a3028" roughness={0.8} />
        </mesh>
        {/* Louvered glass panes */}
        {[-0.4, -0.16, 0.08, 0.32].map((y, i) => (
          <mesh key={i} position={[0.04, y, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[1.4, 0.14, 0.04]} />
            <meshStandardMaterial color="#334466" transparent opacity={0.35} metalness={0.1} />
          </mesh>
        ))}
        {/* Rain light — cold blue tint from outside */}
        <pointLight position={[1.2, 0, 0]} intensity={8} distance={4} color="#223366" decay={2} />
      </group>



      {/* === CORK BOARD above bunk bed === */}
      <mesh position={[3.5, 1.8, -4.82]}>
        <boxGeometry args={[1.6, 0.9, 0.04]} />
        <meshStandardMaterial color="#7a5c3a" roughness={0.95} />
      </mesh>
      {/* Papers on corkboard */}
      <mesh position={[3.3, 1.85, -4.79]}>
        <planeGeometry args={[0.5, 0.4]} />
        <meshStandardMaterial color="#f2e8d8" roughness={0.95} />
      </mesh>



      {/* === STUDENT LANYARD on desk === */}
      <mesh position={[-2.7, -1.43, -0.2]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.06, 0.22, 0.01]} />
        <meshStandardMaterial color="#1144aa" roughness={0.8} />
      </mesh>



      {/* === SNACK WRAPPERS crumpled on floor === */}
      {[[-1.5, -2.45, 2.5], [0.5, -2.45, 3.5], [2.0, -2.45, 3.2]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, i * 0.8, 0]}>
          <boxGeometry args={[0.15, 0.04, 0.12]} />
          <meshStandardMaterial color={['#cc6600', '#4488cc', '#cc4422'][i]} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}






// 📚 STAGE 3: Perpustakaan Utama (Main Library)
function StaffPatrol({ onCaught, onEnemyPositionUpdate }) {
  const staffRef = useRef(null);
  const { camera } = useThree();
  const hasCaughtRef = useRef(false);

  useFrame((state) => {
    if (!staffRef.current || hasCaughtRef.current) return;
    const patrolZ = Math.sin(state.clock.elapsedTime) * STAFF_PATROL_DISTANCE;
    staffRef.current.position.set(STAFF_PATROL_X, 0, patrolZ);
    onEnemyPositionUpdate?.(staffRef.current.position.x, staffRef.current.position.z);
    const distance = staffRef.current.position.distanceTo(camera.position);
    if (distance < STAFF_CATCH_DISTANCE) {
      hasCaughtRef.current = true;
      onCaught();
    }
  });

  return (
    <group ref={staffRef} position={[STAFF_PATROL_X, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.75, 2.9, 0.45]} />
        <meshStandardMaterial color="#000000" roughness={0.9} />
      </mesh>
      <pointLight intensity={20} distance={10} color="#ff0000" decay={2} />
    </group>
  );
}

// 📚 STAGE 3 Main Layout
function MainLibrary({ onObjectClick, onCaught, onEnemyPositionUpdate, inventory, onBookCollect, isBlackout }) {
  const [bookPlacements, setBookPlacements] = useState(null);

  useEffect(() => {
    const shuffledShelves = [...LIBRARY_BOOKSHELVES].sort(() => Math.random() - 0.5);
    const chosenShelves = shuffledShelves.slice(0, 4);

    const placements = LIBRARY_HIDDEN_BOOKS.map((book, i) => {
      const shelf = chosenShelves[i];
      const isLeftFace = Math.random() > 0.5;
      
      const bookX = isLeftFace ? shelf.x - 1.05 : shelf.x + 1.05;
      const bookY = (Math.random() * 2) - 1.5; 
      const bookZ = shelf.z + (Math.random() * 8 - 4);

      return {
        ...book,
        position: [bookX, bookY, bookZ],
        geometry: [0.1, 0.6, 0.4] 
      };
    });
    setBookPlacements(placements);
  }, []);

  return (
    <group>
      <ambientLight intensity={isBlackout ? 0 : 0.03} />
      <StaffPatrol onCaught={onCaught} onEnemyPositionUpdate={onEnemyPositionUpdate} />

      <mesh scale={[-28, -16, -56]} position={[0, 4, -4]}>
        <boxGeometry />
        <meshStandardMaterial color="#060608" side={2} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, -4]}>
        <planeGeometry args={[28, 52]} />
        <meshStandardMaterial color="#0a0a0e" roughness={0.95} />
      </mesh>

      {/* Towering bookshelves */}
      {LIBRARY_BOOKSHELVES.map((shelf) => (
        <mesh key={shelf.id} position={[shelf.x, 0, shelf.z]}>
          <boxGeometry args={[ LIBRARY_BOOKSHELF_DIMENSIONS.width, LIBRARY_BOOKSHELF_DIMENSIONS.height, LIBRARY_BOOKSHELF_DIMENSIONS.depth ]} />
          <meshStandardMaterial color="#12141a" roughness={0.92} metalness={0.05} />
        </mesh>
      ))}

      {/* Librarian desk & terminal */}
      <mesh position={[0, -2, -4]}>
        <boxGeometry args={[3, 1, 1.5]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[0, -1.1, -4.2]} rotation={[-0.1, 0, 0]} onClick={(e) => { e.stopPropagation(); onObjectClick('library_terminal'); }}>
        <boxGeometry args={[1.2, 0.8, 0.1]} />
        <meshStandardMaterial color="#111111" emissive="#00ff00" emissiveIntensity={isBlackout ? 0 : 1.5} />
      </mesh>

      {/* Hidden books */}
      {bookPlacements && bookPlacements.map((book) => {
        if (inventory.includes(book.title)) return null; 
        return (
          <mesh key={book.id} position={book.position} onClick={(e) => { e.stopPropagation(); onObjectClick(book.id); onBookCollect(book.title); }}>
            <boxGeometry args={book.geometry} />
            <meshStandardMaterial color={book.color} emissive={book.emissive} emissiveIntensity={isBlackout ? 0 : 0.8} />
          </mesh>
        );
      })}

      {/* Archive door */}
      <group position={[0, -1, -19.5]}>
        <mesh onClick={(e) => { e.stopPropagation(); onObjectClick('archive_keypad'); }}>
          <boxGeometry args={[3.2, 5.5, 0.35]} />
          <meshStandardMaterial color="#3d4248" metalness={0.92} roughness={0.38} />
        </mesh>
        <mesh position={[1.1, -0.8, 0.2]}>
          <boxGeometry args={[0.15, 0.5, 0.15]} />
          <meshStandardMaterial color="#8a9098" metalness={0.95} roughness={0.25} />
        </mesh>
        <mesh position={[0, 2.2, 0.22]}>
          <boxGeometry args={[2.4, 0.5, 0.08]} />
          <meshStandardMaterial color="#1a1a1e" emissive="#440000" emissiveIntensity={isBlackout ? 0 : 0.4} metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// 🏛️ STAGE 2: The Haunted Lecture Hall
function LectureHall({ onObjectClick }) {
  const chairsGroupRef = useRef();

  // HORROR EVENT: Chairs moving by themselves
  useFrame(({ clock }) => {
    if (chairsGroupRef.current) {
      chairsGroupRef.current.children.forEach((chair, i) => {
        if (i % 3 === 0) { // Only animate some chairs to make it creepy
          chair.position.y = -3.5 + Math.floor(i / 7) * 0.5 + Math.sin(clock.elapsedTime * 2 + i) * 0.1;
        }
      });
    }
  });

  const seats = [];
  for (let row = 0; row < 5; row++) {
    for (let col = -3; col <= 3; col++) {
      seats.push(
        <mesh key={`${row}-${col}`} position={[col * 2, -3.5 + row * 0.5, -5 + row * 3]}>
          <boxGeometry args={[1.2, 1.5, 1]} />
          <meshStandardMaterial color="#1a1c23" roughness={0.9} />
        </mesh>
      );
    }
  }

  return (
    <group>
      <ambientLight intensity={0.15} />

      <mesh scale={[-40, -20, -40]} position={[0, 5, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="#0a0a0d" side={2} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0d0d12" />
      </mesh>

      <group ref={chairsGroupRef}>
        {seats}
      </group>

      <mesh position={[0, 2, -19]} onClick={(e) => { e.stopPropagation(); onObjectClick('projector'); }}>
        <planeGeometry args={[16, 9]} />
        <meshStandardMaterial color="#ffffff" emissive="#222222" />
      </mesh>
    </group>
  );
}

const PROJECTOR_FILES = [
  { id: 'coverup', label: 'Cover-up Authorized', corrupt: 'C0v3r-up Auth0riz3d' },
  { id: 'experiment', label: 'Experiment 313 Started', corrupt: 'Exp3rim3nt 313 St@rted' },
  { id: 'missing', label: 'Subject Maya Missing', corrupt: 'Subj3ct M@ya M1ssing' },
];

const PROJECTOR_CORRECT_ORDER = ['experiment', 'missing', 'coverup'];

const CINEMATIC_LINES = [
  'Files uploaded to University database.',
  'PROJECT 313: SUBJECT M.R. — LEAD RESEARCHER: [YOUR PARENT\'S NAME REDACTED]',
  'The hallucinations... the missing students... it was them.',
  'Maya\'s spirit guided you here to expose the truth.',
  'Campus emergency alarms echo in the distance. As you escape, Maya smiles and fades away.',
  'Some truths refuse to stay buried.',
];

function EndingCinematic({ onPlayAgain }) {
  return (
    <div className="ending-cinematic">
      <div className="ending-cinematic-text">
        {CINEMATIC_LINES.map((line, index) => (
          <p key={line} className={`ending-cinematic-line ending-cinematic-line--${index + 1}`}>
            {line}
          </p>
        ))}
      </div>
      <button type="button" className="ending-cinematic-play" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  );
}

// 🎮 Main Application Controller
export default function App() {
  const [currentStage, setCurrentStage] = useState(1);
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [isLockerUnlocked, setIsLockerUnlocked] = useState(false);
  const [showWhisper, setShowWhisper] = useState(false);
  const [fileSequence, setFileSequence] = useState([]);
  const [sequenceError, setSequenceError] = useState(false);
  const [archiveCodeInput, setArchiveCodeInput] = useState('');
  const [isGameBeaten, setIsGameBeaten] = useState(false);
  const [objectiveText, setObjectiveText] = useState('');
  const [playerPosition, setPlayerPosition] = useState(() => normalizeLibraryPosition(0, 14));
  const [enemyPosition, setEnemyPosition] = useState(() => normalizeLibraryPosition(STAFF_PATROL_X, 0));
  const [isGameOver, setIsGameOver] = useState(false);
  const [libraryResetNonce, setLibraryResetNonce] = useState(0);
  
  // New States for Lore & Horror
  const [transitionState, setTransitionState] = useState(null); // 'toStage2', 'toStage3'
  const [showKnock, setShowKnock] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);

  const sequenceErrorTimerRef = useRef(null);
  const objectiveTimerRef = useRef(null);

  const clearSequenceErrorTimer = () => {
    if (sequenceErrorTimerRef.current) {
      clearTimeout(sequenceErrorTimerRef.current);
      sequenceErrorTimerRef.current = null;
    }
  };

  useEffect(() => () => clearSequenceErrorTimer(), []);

  useEffect(() => {
    const stageObjectives = {
      1: 'Find a way out. The timetable holds the key.',
      2: 'Restore the corrupted projector sequence.',
      3: 'Find the 4 hidden books. Avoid the patrolling staff.',
    };

    setObjectiveText(stageObjectives[currentStage] || '');

    if (objectiveTimerRef.current) {
      clearTimeout(objectiveTimerRef.current);
    }
    objectiveTimerRef.current = setTimeout(() => {
      setObjectiveText('');
      objectiveTimerRef.current = null;
    }, 5000);

    // HORROR EVENT: Door Knocks (Stage 1)
    if (currentStage === 1) {
      const knockTimer = setTimeout(() => {
        setShowKnock(true);
        setTimeout(() => setShowKnock(false), 2000);
      }, 12000);
      return () => clearTimeout(knockTimer);
    }

    // HORROR EVENT: Library Blackout (Stage 3)
    if (currentStage === 3) {
      const blackoutTimer = setTimeout(() => {
        setIsBlackout(true);
        setTimeout(() => setIsBlackout(false), 3000);
      }, 15000); // 15 seconds after entering
      return () => clearTimeout(blackoutTimer);
    }
  }, [currentStage]);

  const handlePlayerPositionUpdate = useCallback((x, z) => {
    setPlayerPosition(normalizeLibraryPosition(x, z));
  }, []);

  const handleEnemyPositionUpdate = useCallback((x, z) => {
    setEnemyPosition(normalizeLibraryPosition(x, z));
  }, []);

  const handleStaffCaught = useCallback(() => {
    setIsGameOver(true);
    setActiveOverlay(null);
  }, []);

  const handleRestartStage = () => {
    setIsGameOver(false);
    setActiveOverlay(null);
    setArchiveCodeInput('');
    setLibraryResetNonce((n) => n + 1);
    setPlayerPosition(normalizeLibraryPosition(0, 14));
    setEnemyPosition(normalizeLibraryPosition(STAFF_PATROL_X, 0));
    setInventory((prev) => prev.filter((item) => item === 'Keycard'));
  };

  const handlePlayAgain = () => {
    setCurrentStage(1);
    setActiveOverlay(null);
    setInventory([]);
    setPasscodeInput('');
    setIsLockerUnlocked(false);
    setLockerError(false);
    setShowWhisper(false);
    setFileSequence([]);
    setSequenceError(false);
    setIsGameBeaten(false);
    setArchiveCodeInput('');
    setObjectiveText('');
    setPlayerPosition(normalizeLibraryPosition(0, 14));
    setIsGameOver(false);
    setLibraryResetNonce((n) => n + 1);
    setEnemyPosition(normalizeLibraryPosition(STAFF_PATROL_X, 0));
  };

  // Whisper Effect Logic
  useEffect(() => {
    if (isGameBeaten || isGameOver) return;
    let showTimer, hideTimer;
    const scheduleWhisper = () => {
      const nextDelay = 15000 + Math.random() * 15000;
      showTimer = setTimeout(() => {
        setShowWhisper(true);
        hideTimer = setTimeout(() => {
          setShowWhisper(false);
          scheduleWhisper();
        }, 2000);
      }, nextDelay);
    };
    scheduleWhisper();
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [isGameBeaten, isGameOver]);

  const [lockerError, setLockerError] = useState(false);

  const handleLockerDigit = (digit) => {
    if (isLockerUnlocked) return;
    const next = (passcodeInput + digit).slice(0, 3);
    setPasscodeInput(next);
    if (next.length === 3) {
      if (next === '313') {
        setIsLockerUnlocked(true);
        setLockerError(false);
        if (!inventory.includes('Keycard')) {
          setInventory(prev => [...prev, 'Keycard']);
        }
      } else {
        setLockerError(true);
        setTimeout(() => {
          setPasscodeInput('');
          setLockerError(false);
        }, 900);
      }
    }
  };

  const handleLockerClear = () => {
    setPasscodeInput('');
    setLockerError(false);
  };

  const resetProjectorPuzzle = () => {
    clearSequenceErrorTimer();
    setFileSequence([]);
    setSequenceError(false);
  };

  const handleProjectorFileClick = (fileId) => {
    if (sequenceError || fileSequence.includes(fileId)) return;

    const nextIndex = fileSequence.length;
    const expectedId = PROJECTOR_CORRECT_ORDER[nextIndex];

    if (fileId !== expectedId) {
      setSequenceError(true);
      setFileSequence([]);
      clearSequenceErrorTimer();
      sequenceErrorTimerRef.current = setTimeout(() => {
        setSequenceError(false);
        setFileSequence([]);
        sequenceErrorTimerRef.current = null;
      }, 1500);
      return;
    }

    const nextSequence = [...fileSequence, fileId];
    setFileSequence(nextSequence);

    if (nextSequence.length === PROJECTOR_CORRECT_ORDER.length) {
      // TRANSITION to Stage 3
      setActiveOverlay(null);
      resetProjectorPuzzle();
      setTransitionState('toStage3');
      setTimeout(() => {
        setCurrentStage(3);
        setTransitionState(null);
      }, 5000);
    }
  };

  const handleArchiveKeypadSubmit = (e) => {
    e.preventDefault();
    if (archiveCodeInput === LIBRARY_ARCHIVE_CODE) {
      setIsGameBeaten(true);
      setActiveOverlay(null);
      setArchiveCodeInput('');
    } else {
      alert('ACCESS DENIED. THE SHADOW GROWS CLOSER.');
      setArchiveCodeInput('');
    }
  };

  const closeOverlay = () => {
    setActiveOverlay(null);
    if (activeOverlay === 'projector') resetProjectorPuzzle();
    if (activeOverlay === 'archive_keypad') setArchiveCodeInput('');
  };

  if (isGameBeaten) {
    return (
      <div className="game-container game-container--ending">
        <EndingCinematic onPlayAgain={handlePlayAgain} />
      </div>
    );
  }

  return (
    <div className="game-container">
      
      {/* 🎬 CINEMATIC TRANSITIONS OVERLAY */}
      {transitionState === 'toStage2' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: '"Courier New", monospace', fontSize: '1.2rem', animation: 'lightningFlash 4s forwards', padding: '2rem', textAlign: 'center' }}>
          <style>{`@keyframes lightningFlash { 0% { background: white; color: black; } 10% { background: black; color: white; } 15% { background: white; color: black; } 25% { background: black; color: white; } 100% { background: black; color: white; opacity: 1; } }`}</style>
          <div>
            <p>You swipe the keycard and the door clicks open.</p>
            <p style={{ marginTop: '20px', color: '#ff4444', fontStyle: 'italic' }}>As lightning flashes, a girl stands silently at the end of the hallway...</p>
            <p style={{ marginTop: '20px' }}>When the darkness returns, she is gone.</p>
          </div>
        </div>
      )}
      
      {transitionState === 'toStage3' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: '"Courier New", monospace', fontSize: '1.2rem', animation: 'fadeInOut 5s forwards', padding: '2rem', textAlign: 'center' }}>
          <style>{`@keyframes fadeInOut { 0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }`}</style>
          <div>
            <p style={{ color: '#ff4444' }}>"THE LIBRARY KNOWS."</p>
            <p style={{ marginTop: '20px' }}>A heavy mechanical grinding echoes behind the lecture hall stage.</p>
            <p style={{ marginTop: '20px', fontStyle: 'italic' }}>A hidden staircase reveals itself, descending into the dark...</p>
=======
      KeyD: 'right',import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import { Player, Flashlight } from './SharedComponents';
import './App.css';

const STORY_INTRO = [
  { speaker: 'System', text: 'One rainy exam week night, after finishing an assignment, you receive an anonymous email...' [cite: 348] },
  { speaker: 'Email Fragment', text: '"If you want the truth behind the missing campus files, follow the trail." [cite: 348, 350]' },
  { speaker: 'System', text: 'Suddenly, the campus Wi-Fi drops dead. Your phone loses bars. The doors click locked. [cite: 349]' },
  { speaker: 'Eerie Voice', text: '"Find what they buried..." [cite: 349]' }
];

export default function App() {
  const [gameState, setGameState] = useState('MENU'); // MENU -> INTRO -> PLAYING -> FINISHED
  const [stage, setStage] = useState(1);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [activeOverlay, setActiveOverlay] = useState(null);

  const bounds = useMemo(() => {
    if (stage === 1) return { x: 4.5, z: 4.5 };
    if (stage === 2) return { x: 19, z: 19 };
    return { x: 9, z: 26 };
  }, [stage]);

  const handleNextDialogue = () => {
    if (dialogueIndex < STORY_INTRO.length - 1) {
      setDialogueIndex(dialogueIndex + 1);
    } else {
      setGameState('PLAYING');
    }
  };

  const handleObjectClick = (type) => {
    setActiveOverlay(type);
  };

  return (
    <div className="game-container">
      {/* 1. Main Menu Overlay  */}
      {gameState === 'MENU' && (
        <div className="ui-screen menu-bg">
          <h1 className="glitch-title">PROJECT 313</h1>
          <p className="subtitle">The Universiti Malaya Campus Mysteries</p> [cite: 347]
          <button className="start-btn" onClick={() => setGameState('INTRO')}>ENTER CAMPUS</button>
        </div>
      )}

      {/* 2. Short Interactive Storyline Dialogue [cite: 348] */}
      {gameState === 'INTRO' && (
        <div className="ui-screen dialogue-bg" onClick={handleNextDialogue}>
          <div className="dialogue-box">
            <span className="speaker-tag">{STORY_INTRO[dialogueIndex].speaker}</span>
            <p className="dialogue-text">{STORY_INTRO[dialogueIndex].text}</p>
            <span className="prompt-blink">Click to advance...</span>
>>>>>>> e3799e985c6dfb9904d60010298f082dcb404b1d
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* HORROR UI EVENT */}
      {showKnock && (
        <div style={{ position: 'fixed', top: '20%', width: '100%', textAlign: 'center', zIndex: 200, color: 'white', fontSize: '2rem', fontWeight: 'bold', textShadow: '0 0 20px red', fontFamily: '"Courier New", monospace', pointerEvents: 'none', animation: 'glitchFade 2s forwards' }}>
          * KNOCK ... KNOCK ... KNOCK *
        </div>
      )}

      {!isGameOver && (
        <div className="canvas-container">
          <Canvas camera={{ position: [0, 0, 0], fov: 75 }}>
            <PointerLockControls />
            <Player stage={currentStage} resetNonce={libraryResetNonce} onPositionUpdate={currentStage === 3 ? handlePlayerPositionUpdate : undefined} />
            <Flashlight isBlackout={isBlackout} />

            {currentStage === 1 && (
              <DormRoom inventory={inventory} onObjectClick={setActiveOverlay} onEscape={() => {
                setTransitionState('toStage2');
                setTimeout(() => {
                  setCurrentStage(2);
                  setTransitionState(null);
                }, 4000);
              }} />
            )}
            {currentStage === 2 && <LectureHall onObjectClick={setActiveOverlay} />}
            {currentStage === 3 && (
              <MainLibrary key={libraryResetNonce} inventory={inventory} onObjectClick={setActiveOverlay} onCaught={handleStaffCaught} onEnemyPositionUpdate={handleEnemyPositionUpdate} isBlackout={isBlackout} onBookCollect={(title) => {
                if (!inventory.includes(title)) setInventory([...inventory, title]);
              }} />
            )}
          </Canvas>
        </div>
      )}

      {isGameOver && (
        <div className="game-over-overlay">
          <p className="game-over-text">CAUGHT. YOU BECOME ANOTHER MISSING STUDENT.</p>
          <button type="button" className="game-over-restart" onClick={handleRestartStage}>Restart Stage</button>
        </div>
      )}

      {!isGameOver && (
      <div className="hud-layer">
        <h2>
          {currentStage === 1 && 'Kolej Kediaman Ke-1'}
          {currentStage === 2 && 'Dewan Kuliah (Abandoned)'}
          {currentStage === 3 && 'Perpustakaan Utama'}
        </h2>
        
        <div className="inventory-box">
          <p style={{ margin: '0 0 10px 0' }}>Inventory:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
            {inventory.length === 0 ? (
              <span>Empty</span>
            ) : (
              inventory.map((item) => {
                const book = LIBRARY_HIDDEN_BOOKS.find(b => b.title === item);
                return (
                  <button key={item} className="item-tag" onClick={() => { if (book) setActiveOverlay(book.id); }} style={{ border: 'none', color: 'white', fontFamily: 'inherit', textAlign: 'left', cursor: book ? 'pointer' : 'default', width: '100%' }}>
                    {item}
                  </button>
                );
              })
            )}
          </div>
        </div>
        
        <p className="hint-text">Click screen to lock mouse. Press ESC to unlock.</p>
        <p className="hint-text">WASD to walk. Click objects to inspect.</p>

        {currentStage === 3 && (
          <div className="minimap-container" aria-label="Library survival radar">
            {LIBRARY_BOOKSHELVES.map((shelf) => (
              <div key={shelf.id} className="minimap-shelf" style={getBookshelfMinimapStyle(shelf)} />
            ))}
            <div className="enemy-blip" style={{ left: `${enemyPosition.x * 100}%`, top: `${enemyPosition.z * 100}%` }} />
            <div className="player-blip" style={{ left: `${playerPosition.x * 100}%`, top: `${playerPosition.z * 100}%` }} />
          </div>
        )}
      </div>
      )}

      {!isGameOver && <div className="crosshair" aria-hidden="true" />}
      {objectiveText && <p key={objectiveText} className="objective-banner">{objectiveText}</p>}
      {!isGameOver && <div className={`whisper-overlay ${showWhisper ? 'visible' : ''}`}>Maya is watching...</div>}

      {!isGameOver && activeOverlay && (
        <div className="overlay-screen">
          <div className="overlay-content">
            <button className="close-btn" onClick={closeOverlay}>✕ Close</button>
            
            {/* NEW LORE OVERLAY */}
            {/* === STAGE 1: DIARY OVERLAY === */}
            {activeOverlay === 'diary' && (
              <div className="diary-overlay">
                <div className="diary-header">
                  <span className="diary-title-tag">ROOMMATE'S DIARY</span>
                  <span className="diary-date-tag">Entry — Week 13</span>
                </div>
                <div className="diary-body">
                  <p className="diary-line">3:13 AM. Can't sleep again.</p>
                  <p className="diary-line">I keep hearing whispers coming from the <strong>Dewan Kuliah</strong> late at night. Maya said she was going to check it out last week.</p>
                  <p className="diary-line diary-line--warn">She never came back to the room.</p>
                  <p className="diary-line">The admin said she "dropped out". But her things are still here. Her laptop is still running.</p>
                  <p className="diary-line diary-line--red"><strong>DON'T TRUST THE RECORDS.</strong></p>
                  <p className="diary-line">If you're reading this — the answer is in the timetable. Look at the red corrections. Read them <em>in order, top to bottom</em>.</p>
                  <p className="diary-line diary-line--faint">— I think someone's been in our room. —</p>
                </div>
              </div>
            )}

            {/* === STAGE 1: LOCKER OVERLAY — click-pad, no form === */}
            {activeOverlay === 'locker' && (
              <div className="locker-ui">
                <p className="locker-label">OLD STUDENT LOCKER</p>
                <p className="locker-sublabel">3-digit combination lock</p>

                {!isLockerUnlocked ? (
                  <>
                    <div className={`locker-display ${lockerError ? 'locker-display--error' : ''}`}>
                      {[0, 1, 2].map(i => (
                        <span key={i} className="locker-digit">
                          {passcodeInput[i] ? '●' : '—'}
                        </span>
                      ))}
                    </div>
                    {lockerError && <p className="locker-error-msg">WRONG CODE. WHISPERS GROW LOUDER.</p>}
                    <div className="locker-pad">
                      {['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map(k => (
                        <button
                          key={k}
                          className={`locker-key ${k === '✓' ? 'locker-key--confirm' : ''} ${k === '⌫' ? 'locker-key--clear' : ''}`}
                          onClick={() => k === '⌫' ? handleLockerClear() : k !== '✓' ? handleLockerDigit(k) : null}
                          disabled={isLockerUnlocked}
                        >{k}</button>
                      ))}
                    </div>
                    <p className="locker-hint">Hint: Check the timetable on the laptop.</p>
                  </>
                ) : (
                  <div className="locker-unlocked">
                    <p className="locker-unlocked-text">✓ CLICK</p>
                    <p>The locker swings open. Inside:</p>
                    <ul className="locker-contents">
                      <li>📷 A photograph — a girl in front of the Main Library</li>
                      <li>🪪 Maya Rahman — Student ID Card</li>
                      <li>💳 <strong style={{color:'#44ff88'}}>Campus Keycard — added to inventory</strong></li>
                    </ul>
                    <p className="locker-note">"Her name is on the card. M. Rahman. CS Year 2."</p>
                  </div>
                )}
              </div>
            )}

            {/* === STAGE 1: DESK / TIMETABLE OVERLAY === */}
            {activeOverlay === 'desk' && (
              <div className="desk-overlay">
                <div className="desk-header">
                  <span className="desk-title">STUDY TABLE</span>
                  <span className="desk-sub">Laptop screen still on — 3:13 AM</span>
                </div>
                <p className="desk-note">A printed UM timetable is folded under the laptop. Some slots have faint red corrections pencilled in. <em>Read the red numbers top to bottom.</em></p>
                <div className="timetable-paper">
                  <table className="timetable">
                    <thead>
                      <tr><th>Time</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th>08:00</th>
                        <td>MPU3123</td>
                        <td className="clue-slot"><span className="clue-digit">3</span>QTK1013</td>
                        <td>—</td>
                        <td>WIA1001</td>
                        <td>—</td>
                      </tr>
                      <tr>
                        <th>10:00</th>
                        <td>SECJ2013</td>
                        <td>—</td>
                        <td className="clue-slot"><span className="clue-digit">1</span>WIX2002</td>
                        <td>SECJ2013</td>
                        <td>—</td>
                      </tr>
                      <tr>
                        <th>14:00</th>
                        <td>Lab</td>
                        <td>—</td>
                        <td>Tutorial</td>
                        <td>—</td>
                        <td className="clue-slot"><span className="clue-digit">3</span>Consultation</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="desk-laptop-note">💻 Browser tab open: <em>"UM Exam Timetable Week 13 — 3 subjects flagged"</em></p>
              </div>
            )}

            {/* === STAGE 1: LOCKED DOOR === */}
            {activeOverlay === 'door_locked' && (
              <div className="door-locked-ui">
                <p className="door-locked-title">DOOR LOCKED</p>
                <div className="door-reader">
                  <div className="door-reader-light" />
                  <p className="door-reader-label">KEYCARD REQUIRED</p>
                </div>
                <p className="door-locked-sub">The keypad blinks red. It won't open without a Campus Keycard.</p>
                <p className="door-locked-hint">Find the locker combination first.</p>
              </div>
            )}

            {activeOverlay === 'library_terminal' && (
              <div className="library-terminal-ui">
                <div className="library-terminal-screen">
                  <p className="library-terminal-header">PERPUSTAKAAN UTAMA // CATALOGUE</p>
                  <p className="library-terminal-prompt">&gt; RECENT_SEARCH_HISTORY.log</p>
                  <div className="library-terminal-history">
                    <p>RECENT SEARCHES: Four restricted volumes were accessed tonight. Find Volumes I through IV hidden on the shelves. Read their Call Numbers in order to construct the passcode.</p>
                  </div>
                  <p className="library-terminal-footer">// End of log. Four volumes flagged as MISSING.</p>
                </div>
              </div>
            )}

            {LIBRARY_HIDDEN_BOOKS.map(
              (book) =>
                activeOverlay === book.id && (
                  <div key={book.id} className="lore-book-card">
                    <h4 style={{ textAlign: 'center', color: '#ff6666', margin: '0 0 10px 0', fontFamily: '"Courier New", monospace' }}>{book.title}</h4>
                    <p className="lore-book-call">Call Number: {book.callNumber}</p>
                    <p className="lore-book-note">{book.lore}</p>
                  </div>
                ),
            )}

            {activeOverlay === 'archive_keypad' && (
              <div className="archive-door-keypad-ui">
                <form className="archive-door-keypad-form" onSubmit={handleArchiveKeypadSubmit}>
                  <h3 className="archive-door-title">Hidden Archive</h3>
                  <p className="archive-door-prompt">Enter 4-digit clearance code.</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={archiveCodeInput}
                    onChange={(e) => setArchiveCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    autoFocus
                  />
                  <button type="submit">Unlock Archive</button>
                </form>
              </div>
            )}

            {activeOverlay === 'projector' && (
              <div className="terminal-ui">
                <div className="terminal-screen">
                  <div className="terminal-header">
                    <span className="terminal-blink">█</span>
                    <span>UM_SECURE_ARCHIVE // RECOVERY_MODE</span>
                  </div>
                  <p className="terminal-prompt">&gt; REBUILD_TIMELINE.exe --corrupted</p>
                  <p className="terminal-subtext">Three fragments detected. Reconstruct chronological sequence to decrypt.</p>
                  <div className="terminal-sequence">
                    SEQUENCE: [{fileSequence.map((id) => id.toUpperCase()).join(' → ') || 'AWAITING INPUT'}]
                  </div>
                  <ul className="terminal-files">
                    {PROJECTOR_FILES.map((file) => {
                      const orderIndex = fileSequence.indexOf(file.id);
                      return (
                        <li key={file.id}>
                          <button
                            type="button"
                            className={`terminal-file ${orderIndex >= 0 ? 'selected' : ''}`}
                            onClick={() => handleProjectorFileClick(file.id)}
                            disabled={sequenceError || orderIndex >= 0}
                          >
                            <span className="terminal-file-id">[{file.id.toUpperCase()}]</span>
                            <span className="terminal-file-corrupt">{file.corrupt}</span>
                            <span className="terminal-file-label">{file.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {sequenceError && <p className="terminal-error" role="alert">ACCESS DENIED - SEQUENCE ERROR</p>}
                </div>
              </div>
            )}
          </div>
=======
      {/* 3. Operational Active 3D Gameplay Loop */}
      {gameState === 'PLAYING' && (
        <>
          <Canvas shadows camera={{ fov: 60, near: 0.1, far: 1000 }}>
            <Player stage={stage} bounds={bounds} />
            <Flashlight isBlackout={false} />

            {stage === 1 && (
              <Stage1 
                inventory={inventory} 
                onObjectClick={handleObjectClick} 
                onEscape={() => { setStage(2); setInventory([]); }} 
              />
            )}
            {stage === 2 && (
              <Stage2 
                inventory={inventory} 
                onObjectClick={handleObjectClick} 
                onEscape={() => setStage(3)} 
              />
            )}
            {stage === 3 && (
              <Stage3 
                hiddenBooks={[]} 
                collectedBooks={[]} 
                onBookClick={() => {}} 
                onTerminalClick={() => setGameState('FINISHED')} 
              />
            )}

            <PointerLockControls />
          </Canvas>

          {/* UI Minimap & Inventory HUD */}
          <div className="game-hud">
            <div className="stage-indicator">LOCATION: STAGE {stage}</div>
            <div className="inventory-bag">
              INVENTORY: {inventory.length === 0 ? 'Empty' : inventory.join(', ')}
            </div>
          </div>
        </>
      )}

      {/* 4. Overlay Modals Interface Panel */}
      {activeOverlay && (
        <div className="modal-popup" onClick={() => setActiveOverlay(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {activeOverlay === 'desk' && <p>Your laptop screen flashes: Timetable arrangement needed. [cite: 351, 355]</p>}
            {activeOverlay === 'locker' && <p>The metal locker is secured by a combo padlock. [cite: 355]</p>}
            {activeOverlay === 'door_locked' && <p>The access control requires a functional magnetic keycard. [cite: 352, 355]</p>}
            <button onClick={() => {
              if (activeOverlay === 'locker') setInventory([...inventory, 'Keycard']); // Simulate finding item [cite: 356]
              setActiveOverlay(null);
            }}>Close & Interact</button>
          </div>
        </div>
      )}

      {/* 5. End Game Screen */}
      {gameState === 'FINISHED' && (
        <div className="ui-screen win-bg">
          <h2>TRUTH UNCOVERED</h2>
          <p>Maya's logs have been fully uploaded. The project records are exposed.</p> [cite: 372, 374]
          <button onClick={() => { setGameState('MENU'); setStage(1); setInventory([]); }}>Return to Menu</button>
>>>>>>> e3799e985c6dfb9904d60010298f082dcb404b1d
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
}
=======
}
    </div>
  );
}
>>>>>>> e3799e985c6dfb9904d60010298f082dcb404b1d
