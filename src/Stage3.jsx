import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

// ─── Constants (used only by Stage 3) ───────────────────────────────────────

const LIBRARY_BOUNDS_X = 9;
const LIBRARY_BOUNDS_Z = 26;

const LIBRARY_BOOKSHELF_DIMENSIONS = { width: 2, height: 8, depth: 10 };

export const LIBRARY_BOOKSHELVES = [
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

export function getBookshelfMinimapStyle(shelf) {
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

export function normalizeLibraryPosition(x, z) {
  return {
    x: (x + LIBRARY_BOUNDS_X) / (2 * LIBRARY_BOUNDS_X),
    z: (z + LIBRARY_BOUNDS_Z) / (2 * LIBRARY_BOUNDS_Z),
  };
}

const STAFF_PATROL_X = 3.5;
const STAFF_PATROL_DISTANCE = 18;
const STAFF_CATCH_DISTANCE = 2.5;

export const LIBRARY_ARCHIVE_CODE = '0313';

// 📚 Book Data
export const LIBRARY_HIDDEN_BOOKS = [
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

// ─── Staff Patrol ─────────────────────────────────────────────────────────────

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
export function MainLibrary({ onObjectClick, onCaught, onEnemyPositionUpdate, inventory, onBookCollect, isBlackout }) {
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
