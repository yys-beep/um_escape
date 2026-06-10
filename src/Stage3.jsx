import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

import {
  LIBRARY_BOOKSHELVES,
  LIBRARY_HIDDEN_BOOKS,
  STAFF_PATROL_X,
  STAFF_PATROL_DISTANCE,
} from './libraryData';

const FAKE_BOOK_COLORS = ['#3e2723','#2a0a0a','#1a233a','#1e2f23','#4e342e','#2c1e16','#141414'];

// ─── AUDIO ENGINE (Web Audio API) ─────────────────────────────────────────────
function useHorrorAudio(postBlackout) {
  const audioCtxRef = useRef(null);
  
  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playDistortedBreath = useCallback(() => {
    try {
      const ctx = getCtx();
      const duration = 2.5;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t / duration) * 0.3;
      }
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 300;
      source.buffer = buffer;
      source.connect(filter); filter.connect(ctx.destination);
      source.start();
    } catch (_) {}
  }, [getCtx]);

  useEffect(() => {
    if (!postBlackout) return;
    const breathTimer = setInterval(() => {
      if (Math.random() > 0.4) playDistortedBreath();
    }, 12000 + Math.random() * 10000);
    return () => clearInterval(breathTimer);
  }, [postBlackout, playDistortedBreath]);
}

// ─── HORROR: The Shadow Staff Patrol ─────────────────────────────────────────
function CreepyHumanoid({ onCaught, onEnemyPositionUpdate, isBlackout }) {
  const groupRef = useRef(null);
  const bodyRef = useRef(null);
  const { camera } = useThree();
  const hasCaughtRef = useRef(false);

  useFrame((state) => {
    if (!groupRef.current || hasCaughtRef.current) return;
    
    const patrolZ = Math.sin(state.clock.elapsedTime * 0.8) * STAFF_PATROL_DISTANCE;
    groupRef.current.position.set(STAFF_PATROL_X, -4, patrolZ);
    onEnemyPositionUpdate?.(groupRef.current.position.x, groupRef.current.position.z);
    
    // Calculate 2D distance so height (Y) doesn't prevent you from getting caught
    const dx = groupRef.current.position.x - camera.position.x;
    const dz = groupRef.current.position.z - camera.position.z;
    const distance2D = Math.sqrt(dx * dx + dz * dz);

    if (distance2D < 2.5) {
      hasCaughtRef.current = true;
      onCaught();
    }
    
    if (bodyRef.current) bodyRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.15;
  });

  if (isBlackout) return null;

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>
        <mesh position={[-0.25, 1.2, 0]}><boxGeometry args={[0.2, 2.4, 0.2]} /><meshStandardMaterial color="#020202" roughness={1} /></mesh>
        <mesh position={[0.25, 1.2, 0]}><boxGeometry args={[0.2, 2.4, 0.2]} /><meshStandardMaterial color="#020202" roughness={1} /></mesh>
        <mesh position={[0, 3.4, 0]}><boxGeometry args={[0.9, 2.0, 0.35]} /><meshStandardMaterial color="#000000" roughness={1} /></mesh>
        <mesh position={[0, 4.8, 0.1]}><boxGeometry args={[0.5, 0.7, 0.5]} /><meshStandardMaterial color="#000000" roughness={1} /></mesh>
        <mesh position={[-0.12, 4.9, 0.36]}><planeGeometry args={[0.08, 0.08]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} /></mesh>
        <mesh position={[0.12, 4.9, 0.36]}><planeGeometry args={[0.08, 0.08]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} /></mesh>
      </group>
      <pointLight intensity={10} distance={10} color="#ff0000" decay={2} position={[0, 4, 0.5]} />
    </group>
  );
}

// ─── HORROR: Silently Falling Books ──────────────────────────────────────────
function FallingBook({ active }) {
  const bookRef = useRef();
  const [falling, setFalling] = useState(false);
  useFrame(() => {
    if (!active || !bookRef.current) return;
    if (!falling && Math.random() > 0.995) {
      setFalling(true);
      bookRef.current.position.set((Math.random() - 0.5) * 14, 8 + Math.random() * 2, (Math.random() - 0.5) * 20);
      bookRef.current.rotation.set(Math.random(), Math.random(), Math.random());
    }
    if (falling) {
      bookRef.current.position.y -= 0.15;
      if (bookRef.current.position.y < -3.8) setFalling(false);
    }
  });
  return <mesh ref={bookRef} visible={falling}><boxGeometry args={[0.3, 0.8, 0.15]} /><meshStandardMaterial color="#111" /></mesh>;
}

// ─── HORROR: Shadow Peeking from Aisle Gaps ───────────────────────────────────
function PeekingShadow({ postBlackout }) {
  const shadowRef = useRef();
  const { camera } = useThree();

  useFrame(({ clock }) => {
    if (!postBlackout || !shadowRef.current) return;
    const t = clock.elapsedTime * 0.18;
    shadowRef.current.position.set(Math.sin(t) * 9, -2, Math.cos(t) * 16);
    shadowRef.current.lookAt(camera.position);
    
    const dist = shadowRef.current.position.distanceTo(camera.position);
    shadowRef.current.visible = dist > 10 && dist < 28; 
  });

  if (!postBlackout) return null;

  return (
    <group ref={shadowRef}>
      <mesh position={[0, 2, 0]}><boxGeometry args={[1, 4, 0.1]} /><meshStandardMaterial color="#000000" roughness={1} /></mesh>
      <mesh position={[-0.2, 3.6, 0.06]}><planeGeometry args={[0.1, 0.1]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2.5} /></mesh>
      <mesh position={[0.2, 3.6, 0.06]}><planeGeometry args={[0.1, 0.1]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2.5} /></mesh>
    </group>
  );
}

// ─── PROCEDURAL: Shelf Row ────────────────────────────────────────────────────
function ShelfRow({ y, isLeft }) {
  const books = useMemo(() => {
    const items = [];
    let currentZ = -4.7;
    while (currentZ < 4.7) {
      const width = 0.15 + Math.random() * 0.3;
      if (currentZ + width > 4.7) break;
      items.push({ z: currentZ + width / 2, w: width, c: FAKE_BOOK_COLORS[Math.floor(Math.random() * FAKE_BOOK_COLORS.length)], d: Math.random() * 0.08 });
      currentZ += width;
    }
    return items;
  }, []);

  return (
    <group position={[isLeft ? -0.8 : 0.8, y + 0.4, 0]}>
      {books.map((b, i) => (
        <mesh key={i} position={[isLeft ? b.d : -b.d, 0, b.z]}><boxGeometry args={[0.3, 0.75, b.w]} /><meshStandardMaterial color={b.c} roughness={0.8} /></mesh>
      ))}
    </group>
  );
}

// ─── PROCEDURAL: Bookshelf (FIXED: Above ground, reaches ceiling) ─────────────
function ProceduralBookshelf({ position, postBlackout }) {
  const shelfRef = useRef();
  useFrame(() => {
    // REALITY WARP: Bookshelves twist to point at the archive door!
    if (postBlackout && shelfRef.current) {
      const targetAngle = Math.atan2(position[0] - 0, position[2] - (-19.5));
      shelfRef.current.rotation.y += (targetAngle - shelfRef.current.rotation.y) * 0.01;
    }
  });

  // FIX: Planks are correctly spaced ABOVE the shelf's local Y=0 base
  const tiers = [0.5, 2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5];

  return (
    <group ref={shelfRef} position={position}>
      {/* Wooden Frame - Centered to reach ceiling */}
      <mesh position={[0, 8.5, 0]}><boxGeometry args={[1.4, 18, 9.8]} /><meshStandardMaterial color="#1a0f0a" roughness={0.9} /></mesh>
      {tiers.map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0]}><boxGeometry args={[2.0, 0.1, 9.9]} /><meshStandardMaterial color="#2d1b11" roughness={0.8} /></mesh>
          <ShelfRow y={y} isLeft={true} />
          <ShelfRow y={y} isLeft={false} />
        </group>
      ))}
    </group>
  );
}

// ─── STAGE 3: MAIN LIBRARY ASSEMBLY ───────────────────────────────────────────
export function MainLibrary({ onObjectClick, onCaught, onEnemyPositionUpdate, inventory, onBookCollect, isBlackout }) {
  const [postBlackout, setPostBlackout] = useState(false);
  const wasBlackout = useRef(false);

  useHorrorAudio(postBlackout);

  useEffect(() => {
    if (isBlackout) wasBlackout.current = true;
    else if (wasBlackout.current && !isBlackout) setPostBlackout(true);
  }, [isBlackout]);

  const bookPlacements = useMemo(() => {
    const shuffledShelves = [...LIBRARY_BOOKSHELVES].sort(() => Math.random() - 0.5);
    
    // FIX: Using the exact local tier heights so books sit flawlessly on the shelves
    const reachableTiers = [0.5, 2.5, 4.5]; 
    
    return LIBRARY_HIDDEN_BOOKS.map((book, i) => {
      const shelf = shuffledShelves[i % shuffledShelves.length];
      const isLeft = Math.random() > 0.5;
      const localY = reachableTiers[Math.floor(Math.random() * reachableTiers.length)]; 
      return {
        ...book,
        position: [
          isLeft ? shelf.x - 0.85 : shelf.x + 0.85, 
          -4 + localY + 0.42, // -4 (Floor) + Shelf Tier Height + Half Book Height
          shelf.z + (Math.random() * 8 - 4)
        ],
        geometry: [0.35, 0.8, 0.15],
      };
    });
  }, []);

  return (
    <group>
      <ambientLight intensity={isBlackout ? 0 : postBlackout ? 0.15 : 0.28} />
      <hemisphereLight skyColor={postBlackout ? '#ffaaaa' : '#aaccff'} groundColor="#222233" intensity={isBlackout ? 0 : 0.25} position={[0, 10, 0]} />

      {postBlackout && (
        <>
          <pointLight color="#ff2200" intensity={3.5} position={[-5, 4, 10]} distance={25} decay={2} />
          <pointLight color="#ff2200" intensity={3.5} position={[5, 4, -10]} distance={25} decay={2} />
        </>
      )}

      <CreepyHumanoid onCaught={onCaught} onEnemyPositionUpdate={onEnemyPositionUpdate} isBlackout={isBlackout} />
      <FallingBook active={postBlackout} />
      <FallingBook active={postBlackout} />
      <PeekingShadow postBlackout={postBlackout} />

      <mesh scale={[-28, -16, -56]} position={[0, 4, -4]}><boxGeometry /><meshStandardMaterial color="#050608" side={2} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, -4]}><planeGeometry args={[28, 52]} /><meshStandardMaterial color="#080a0f" roughness={1} metalness={0} /></mesh>

      {LIBRARY_BOOKSHELVES.map((shelf) => (
        <ProceduralBookshelf key={shelf.id} position={[shelf.x, -4, shelf.z]} postBlackout={postBlackout} />
      ))}

      <group position={[0, -4, -4]}>
        <mesh position={[0, 1.25, 0]}><boxGeometry args={[3.2, 2.5, 1.5]} /><meshStandardMaterial color="#1c110a" roughness={0.9} /></mesh>
        <mesh position={[0, 2.55, 0]}><boxGeometry args={[3.4, 0.1, 1.7]} /><meshStandardMaterial color="#3a2315" roughness={0.8} /></mesh>
        <group position={[0, 3.2, -0.2]} rotation={[-0.1, 0, 0]} onClick={(e) => { e.stopPropagation(); onObjectClick('library_terminal'); }}>
          <mesh><boxGeometry args={[1.2, 0.9, 0.8]} /><meshStandardMaterial color="#8b8c89" roughness={0.6} /></mesh>
          <mesh position={[0, 0, 0.41]}><planeGeometry args={[1.0, 0.7]} /><meshStandardMaterial color="#111" emissive="#33ff66" emissiveIntensity={isBlackout ? 0 : 2} /></mesh>
        </group>
      </group>

      {/* ── THE 4 GLOWING TARGET BOOKS ── */}
      {bookPlacements.map((book) => {
        // If the book title is in the inventory, hide it from the 3D world
        if (inventory.includes(book.title)) return null; 
        
        return (
          <group key={book.id} position={book.position}>
            <mesh 
              visible={!isBlackout} 
              onClick={(e) => { 
                e.stopPropagation(); 
                // Adds book to the left-side inventory list
                onBookCollect(book.title); 
                // Triggers App.jsx to popup the lore & Call Number
                onObjectClick(book.id); 
              }}
            >
              <boxGeometry args={book.geometry} />
              <meshStandardMaterial color={book.color} emissive={book.emissive} emissiveIntensity={3} />
            </mesh>
            {!isBlackout && <pointLight color={book.emissive} intensity={5} distance={6} decay={2} />}
          </group>
        );
      })}

      <group position={[0, -4, -20.5]}>
        <mesh position={[0, 3.5, 0]}><boxGeometry args={[4.4, 7.0, 0.6]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0, 3.25, 0.1]} onClick={(e) => { e.stopPropagation(); onObjectClick('archive_keypad'); }}>
          <boxGeometry args={[3.6, 6.5, 0.4]} />
          <meshStandardMaterial color="#1a1c1e" metalness={0.9} roughness={0.4} />
        </mesh>
        <mesh position={[1.2, 3.0, 0.32]}><boxGeometry args={[0.3, 0.7, 0.1]} /><meshStandardMaterial color="#0a0a0a" roughness={0.9} /></mesh>
        <mesh position={[0, 6.0, 0.35]}><boxGeometry args={[1.5, 0.2, 0.1]} /><meshStandardMaterial color="#1a0000" emissive="#ff0000" emissiveIntensity={isBlackout ? 0 : 2} metalness={0.8} /></mesh>
      </group>
    </group>
  );
}