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

// 🛏️ STAGE 1: Kolej Kediaman Ke-1 (Dorm Room)
function DormRoom({ onObjectClick, inventory, onEscape }) {
  const ambientRef = useRef();

  // HORROR EVENT: Flickering Lights
  useFrame(() => {
    if (ambientRef.current) {
      ambientRef.current.intensity = Math.random() > 0.95 ? 0.01 : 0.06;
    }
  });

  const handleDoorClick = (e) => {
    e.stopPropagation();
    if (inventory.includes('Keycard')) {
      onEscape(); // Trigger Transition!
    } else {
      alert("The door is locked tight. The keypad requires a Campus Keycard.");
    }
  };

  return (
    <group>
      <ambientLight ref={ambientRef} intensity={0.06} />
      
      {/* The Room Shell */}
      <mesh scale={[-10, -10, -10]}>
        <boxGeometry />
        <meshStandardMaterial color="#1a1a24" side={2} />
      </mesh>

      {/* The Escape Door */}
      <mesh position={[0, -0.5, 4.9]} onClick={handleDoorClick}>
        <boxGeometry args={[2.5, 4, 0.2]} />
        <meshStandardMaterial color="#2a1f1a" roughness={0.9} />
      </mesh>
      <mesh position={[0.8, -0.5, 4.8]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>

      {/* Interactive Object: The Locker */}
      <mesh position={[-3, -1, -2]} onClick={(e) => { e.stopPropagation(); onObjectClick('locker'); }}>
        <boxGeometry args={[1.2, 3, 1.2]} />
        <meshStandardMaterial color="#2a2e38" metalness={0.92} roughness={0.82} />
      </mesh>

      {/* Interactive Object: The Desk/Laptop */}
      <group position={[2, -1.5, -3]} onClick={(e) => { e.stopPropagation(); onObjectClick('desk'); }}>
        <mesh>
          <boxGeometry args={[2.5, 0.92, 1.5]} />
          <meshStandardMaterial color="#4a2f22" metalness={0.02} roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2.48, 0.08, 1.48]} />
          <meshStandardMaterial color="#6b4a36" metalness={0.01} roughness={0.62} />
        </mesh>
      </group>

      {/* LORE: Roommate's Diary */}
      <mesh position={[1.2, -1.0, -2.6]} onClick={(e) => { e.stopPropagation(); onObjectClick('diary'); }}>
        <boxGeometry args={[0.4, 0.05, 0.6]} />
        <meshStandardMaterial color="#882222" />
      </mesh>

      {/* Decorative Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#111116" />
      </mesh>
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

  const handleLockerSubmit = (e) => {
    e.preventDefault();
    if (passcodeInput === '313') {
      setIsLockerUnlocked(true);
      if (!inventory.includes('Keycard')) {
        setInventory([...inventory, 'Keycard']);
      }
    } else {
      alert('Wrong passcode. The whispers grow louder...');
    }
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
          </div>
        </div>
      )}

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
            {activeOverlay === 'diary' && (
              <div className="puzzle-box">
                <h3 style={{ color: '#ff6666' }}>Roommate's Diary</h3>
                <blockquote className="diary-clue" style={{ fontSize: '1.1rem', marginTop: '20px' }}>
                  "I keep hearing whispers from the Dewan Kuliah... Maya went there last week and never came back."
                </blockquote>
                <blockquote className="diary-clue" style={{ fontSize: '1.1rem' }}>
                  "If you are reading this, <strong style={{ color: 'red' }}>DON'T TRUST THE RECORDS.</strong> The answers are hidden in the timetable subjects. Look at the numbers."
                </blockquote>
              </div>
            )}

            {activeOverlay === 'locker' && (
              <div className="puzzle-box">
                <h3>Old Student Locker</h3>
                {!isLockerUnlocked ? (
                  <form onSubmit={handleLockerSubmit}>
                    <p>It requires a 3-digit combination code.</p>
                    <input type="text" maxLength={3} value={passcodeInput} onChange={(e) => setPasscodeInput(e.target.value)} placeholder="???" />
                    <button type="submit">Unlock</button>
                  </form>
                ) : (
                  <div className="unlocked-reward">
                    <p>The locker clicks open. Inside, you find Maya's photograph and a Campus Keycard!</p>
                    <p className="acquired-text">🎉 [Keycard added to inventory]</p>
                  </div>
                )}
              </div>
            )}

            {activeOverlay === 'desk' && (
              <div className="puzzle-box timetable-container">
                <h3>Messy Study Table</h3>
                <p>A printed class timetable from Universiti Malaya is pinned under the laptop.</p>
                <blockquote className="diary-clue">"Some classes were 'corrected' in red. Read those marks in order."</blockquote>
                <div className="timetable-paper">
                  <table className="timetable">
                    <thead>
                      <tr><th>Time</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th>08:00 - 09:00</th><td>MPU3123</td><td className="clue-slot"><span className="clue-digit">3</span>QTK1013</td><td>---</td><td>WIA1001</td><td>---</td>
                      </tr>
                      <tr>
                        <th>10:00 - 11:00</th><td>SECJ2013</td><td>---</td><td className="clue-slot"><span className="clue-digit">1</span>WIX2002</td><td>SECJ2013</td><td>---</td>
                      </tr>
                      <tr>
                        <th>14:00 - 15:00</th><td>Lab</td><td>---</td><td>Tutorial</td><td>---</td><td className="clue-slot"><span className="clue-digit">3</span>Consultation</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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
        </div>
      )}
    </div>
  );
}