import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

// ─── Import Data ──────────────────────────────────────────────────────────────
import {
  LIBRARY_BOOKSHELVES,
  LIBRARY_HIDDEN_BOOKS,
  LIBRARY_BOOKSHELF_DIMENSIONS,
  STAFF_PATROL_X,
  STAFF_PATROL_DISTANCE,
  STAFF_CATCH_DISTANCE
} from './libraryData';

// ─── PROCEDURAL MODEL: The Shadow Staff Patrol ───────────────────────────────
function CreepyHumanoid({ onCaught, onEnemyPositionUpdate }) {
  const groupRef = useRef(null);
  const bodyRef = useRef(null);
  const { camera } = useThree();
  const hasCaughtRef = useRef(false);

  useFrame((state) => {
    if (!groupRef.current || hasCaughtRef.current) return;
    const patrolZ = Math.sin(state.clock.elapsedTime * 0.8) * STAFF_PATROL_DISTANCE;
    groupRef.current.position.set(STAFF_PATROL_X, -4, patrolZ); 
    onEnemyPositionUpdate?.(groupRef.current.position.x, groupRef.current.position.z);
    
    const distance = groupRef.current.position.distanceTo(camera.position);
    if (distance < STAFF_CATCH_DISTANCE) {
      hasCaughtRef.current = true;
      onCaught();
    }
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>
        <mesh position={[-0.25, 1.2, 0]}><boxGeometry args={[0.15, 2.4, 0.15]} /><meshStandardMaterial color="#050505" roughness={1} /></mesh>
        <mesh position={[0.25, 1.2, 0]}><boxGeometry args={[0.15, 2.4, 0.15]} /><meshStandardMaterial color="#050505" roughness={1} /></mesh>
        <mesh position={[0, 3.2, 0]}><boxGeometry args={[0.8, 1.8, 0.3]} /><meshStandardMaterial color="#020202" roughness={1} /></mesh>
        <mesh position={[0, 4.4, 0.1]}><boxGeometry args={[0.45, 0.6, 0.45]} /><meshStandardMaterial color="#000000" roughness={1} /></mesh>
        <mesh position={[0, 4.45, 0.33]}><planeGeometry args={[0.3, 0.08]} /><meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={4} /></mesh>
        <mesh position={[-0.5, 2.5, 0]} rotation={[0, 0, 0.1]}><boxGeometry args={[0.12, 2.8, 0.12]} /><meshStandardMaterial color="#050505" roughness={1} /></mesh>
        <mesh position={[0.5, 2.5, 0]} rotation={[0, 0, -0.1]}><boxGeometry args={[0.12, 2.8, 0.12]} /><meshStandardMaterial color="#050505" roughness={1} /></mesh>
      </group>
      <pointLight intensity={30} distance={12} color="#ff0000" decay={2} position={[0, 3, 0]} />
    </group>
  );
}

// ─── PROCEDURAL MODEL: Fake Book Rows ─────────────────────────────────────────
const FAKE_BOOK_COLORS = ['#3e2723', '#2a0a0a', '#1a233a', '#1e2f23', '#4e342e', '#2c1e16', '#141414'];

function ShelfRow({ y, isLeft }) {
  // Generate random clustered books once per shelf so it doesn't lag
  const books = useMemo(() => {
    const items = [];
    let currentZ = -4.7; // Start at back of shelf
    while (currentZ < 4.7) {
      const width = 0.15 + Math.random() * 0.3; // Random thickness of book grouping
      if (currentZ + width > 4.7) break;
      
      const color = FAKE_BOOK_COLORS[Math.floor(Math.random() * FAKE_BOOK_COLORS.length)];
      const depthOffset = (Math.random() * 0.08); // Makes books look slightly uneven on the shelf
      
      items.push({ z: currentZ + width / 2, w: width, c: color, d: depthOffset });
      currentZ += width;
    }
    return items;
  }, []);

  const xPos = isLeft ? -0.8 : 0.8;
  
  return (
    <group position={[xPos, y + 0.4, 0]}>
      {books.map((b, i) => (
        <mesh key={i} position={[isLeft ? b.d : -b.d, 0, b.z]}>
          <boxGeometry args={[0.3, 0.75, b.w]} />
          <meshStandardMaterial color={b.c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─── PROCEDURAL MODEL: Detailed Wooden Bookshelves ───────────────────────────
function ProceduralBookshelf({ position }) {
  return (
    <group position={position}>
      {/* Main Wooden Core (The dark vertical board dividing the shelf) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.4, 8, 9.8]} />
        <meshStandardMaterial color="#1a0f0a" roughness={0.9} />
      </mesh>
      
      {/* 4 Wooden Planks with Rows of Books */}
      {[-3, -1, 1, 3].map((y) => (
        <group key={y}>
          {/* Horizontal Plank */}
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[2.0, 0.1, 9.9]} />
            <meshStandardMaterial color="#2d1b11" roughness={0.8} />
          </mesh>
          {/* Books */}
          <ShelfRow y={y} isLeft={true} />
          <ShelfRow y={y} isLeft={false} />
        </group>
      ))}
    </group>
  );
}

// ─── PROCEDURAL MODEL: Detailed Librarian Desk ───────────────────────────────
function LibrarianDesk({ onObjectClick, isBlackout }) {
  return (
    <group position={[0, -4, -4]}>
      <mesh position={[0, 1.25, 0]}><boxGeometry args={[3.2, 2.5, 1.5]} /><meshStandardMaterial color="#1c110a" roughness={0.9} /></mesh>
      <mesh position={[0, 2.55, 0]}><boxGeometry args={[3.4, 0.1, 1.7]} /><meshStandardMaterial color="#3a2315" roughness={0.8} /></mesh>
      
      <group position={[0, 3.2, -0.2]} rotation={[-0.1, 0, 0]} onClick={(e) => { e.stopPropagation(); onObjectClick('library_terminal'); }}>
        <mesh position={[0, 0, 0]}><boxGeometry args={[1.2, 0.9, 0.8]} /><meshStandardMaterial color="#8b8c89" roughness={0.6} /></mesh>
        <mesh position={[0, 0, 0.41]}><planeGeometry args={[1.0, 0.7]} /><meshStandardMaterial color="#111" emissive="#33ff66" emissiveIntensity={isBlackout ? 0 : 2} /></mesh>
      </group>
      <mesh position={[0, 2.65, 0.5]} rotation={[-0.05, 0, 0]}><boxGeometry args={[1.4, 0.05, 0.4]} /><meshStandardMaterial color="#8b8c89" roughness={0.8} /></mesh>
    </group>
  );
}

// ─── STAGE 3: Main Layout Assembly ────────────────────────────────────────────
export function MainLibrary({ onObjectClick, onCaught, onEnemyPositionUpdate, inventory, onBookCollect, isBlackout }) {
  const [bookPlacements, setBookPlacements] = useState(null);

  useEffect(() => {
    const shuffledShelves = [...LIBRARY_BOOKSHELVES].sort(() => Math.random() - 0.5);
    const chosenShelves = shuffledShelves.slice(0, 4);
    const shelfHeights = [-3, -1, 1, 3];

    const placements = LIBRARY_HIDDEN_BOOKS.map((book, i) => {
      const shelf = chosenShelves[i];
      const isLeftFace = Math.random() > 0.5;
      
      // Place precisely on the plank, jutting out slightly further than the fake books so it's clickable
      const bookX = isLeftFace ? shelf.x - 0.85 : shelf.x + 0.85;
      const bookY = shelfHeights[Math.floor(Math.random() * 4)] + 0.42; 
      const bookZ = shelf.z + (Math.random() * 8 - 4);

      return {
        ...book,
        position: [bookX, bookY, bookZ],
        geometry: [0.35, 0.8, 0.15] // Shaped like a real book facing outward!
      };
    });
    setBookPlacements(placements);
  }, []);

  return (
    <group>
      <ambientLight intensity={isBlackout ? 0 : 0.4} />
      <hemisphereLight skyColor="#aaccff" groundColor="#444455" intensity={isBlackout ? 0 : 0.5} position={[0, 10, 0]} />
      <pointLight color="#ccd8ff" intensity={isBlackout ? 0 : 0.8} position={[-5, 4, 10]} distance={40} decay={1.5} />
      <pointLight color="#d8d4c8" intensity={isBlackout ? 0 : 0.8} position={[5, 4, -10]} distance={40} decay={1.5} />
      
      <CreepyHumanoid onCaught={onCaught} onEnemyPositionUpdate={onEnemyPositionUpdate} />

      <mesh scale={[-28, -16, -56]} position={[0, 4, -4]}>
        <boxGeometry />
        <meshStandardMaterial color="#0a0c10" side={2} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, -4]}>
        <planeGeometry args={[28, 52]} />
        <meshStandardMaterial color="#0d1117" roughness={1} metalness={0} />
      </mesh>

      {LIBRARY_BOOKSHELVES.map((shelf) => (
        <ProceduralBookshelf key={shelf.id} position={[shelf.x, -4, shelf.z]} />
      ))}

      <LibrarianDesk onObjectClick={onObjectClick} isBlackout={isBlackout} />

      {/* Hidden Glowing Target Books (Now inserted onto the shelves) */}
      {bookPlacements && bookPlacements.map((book) => {
        if (inventory.includes(book.title)) return null; 
        return (
          <group key={book.id} position={book.position}>
            <mesh onClick={(e) => { e.stopPropagation(); onObjectClick(book.id); onBookCollect(book.title); }}>
              <boxGeometry args={book.geometry} />
              <meshStandardMaterial color={book.color} emissive={book.emissive} emissiveIntensity={isBlackout ? 0 : 3} />
            </mesh>
            {!isBlackout && (
              <pointLight color={book.emissive} intensity={5} distance={6} decay={2} />
            )}
          </group>
        );
      })}

      <group position={[0, -4, -19.5]}>
        <mesh position={[0, 2.75, 0]} onClick={(e) => { e.stopPropagation(); onObjectClick('archive_keypad'); }}>
          <boxGeometry args={[3.6, 5.5, 0.4]} />
          <meshStandardMaterial color="#2d3238" metalness={0.9} roughness={0.4} />
        </mesh>
        <mesh position={[1.2, 2.5, 0.22]}>
          <boxGeometry args={[0.2, 0.6, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 5.0, 0.22]}>
          <boxGeometry args={[1.5, 0.2, 0.1]} />
          <meshStandardMaterial color="#1a0000" emissive="#ff0000" emissiveIntensity={isBlackout ? 0 : 1} metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}