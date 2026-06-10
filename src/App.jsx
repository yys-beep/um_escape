import React, { useCallback, useEffect, useMemo, useRef, useState, useReducer } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import './App.css';
import MainMenuController from './Mainmenu';

// ─── Stage imports ────────────────────────────────────────────────────────────
import DormRoom from './Stage1';
import { LectureHall, ProjectorPuzzleOverlay, EndingCinematic } from './Stage2';
import { MainLibrary } from './Stage3';
import OutroCinematic from './Outrocinematic';

// ─── Data imports (This fixes the Fast Refresh error!) ────────────────────────
import {
  LIBRARY_BOOKSHELVES,
  LIBRARY_HIDDEN_BOOKS,
  LIBRARY_ARCHIVE_CODE,
  normalizeLibraryPosition,
  getBookshelfMinimapStyle,
} from './libraryData';

// Import from your new constants file!
import { PROJECTOR_FILES, PROJECTOR_CORRECT_ORDER, INITIAL_PUZZLE_STATE, lectureHallReducer } from './Stage2.constants';

// ─── Shared constants ─────────────────────────────────────────────────────────
const WALK_SPEED = 4.5;
const DORM_BOUNDS = 4.5;
const LECTURE_BOUNDS = 19;
const LIBRARY_BOUNDS_X = 9;
const LIBRARY_BOUNDS_Z = 26;

const STAFF_PATROL_X = 3.5;

// ─── Global SFX Helper ────────────────────────────────────────────────────────
const playSFX = (fileName, volume = 1.0) => {
  const audio = new Audio(`/${fileName}`);
  audio.volume = volume;
  audio.play().catch((e) => console.log('Audio blocked by browser:', e));
};

// ─── Player Controls Hook ─────────────────────────────────────────────────────
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

/// ─── Player (Collision & Stair Climbing Math Fixed) ───────────────────────────
function Player({ stage, onPositionUpdate, resetNonce = 0 }) {
  const { camera: hookCamera } = useThree(); 
  const keys = usePlayerControls();
  const direction = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const positionThrottleRef = useRef(0);
  const lastReportedRef = useRef({ x: 0, z: 0 });

  useEffect(() => {
    if (stage === 2) {
      hookCamera.position.set(0, 0, 12);
    } else if (stage === 3) {
      hookCamera.position.set(0, 0, 14);
      lastReportedRef.current = { x: 0, z: 14 };
      positionThrottleRef.current = 0;
      onPositionUpdate?.(0, 14);
    } else {
      hookCamera.position.set(0, 0, 0);
    }
  }, [stage, hookCamera, onPositionUpdate, resetNonce]);

  useFrame(({ camera: frameCamera }, delta) => {
    frameCamera.getWorldDirection(direction);
    direction.y = 0;

    if (direction.lengthSq() > 0.0001) direction.normalize();
    else direction.set(0, 0, -1);

    right.crossVectors(direction, up).normalize();
    const move = WALK_SPEED * delta;
    
    // Calculate where the player WANTS to move
    const nextPosition = frameCamera.position.clone();
    if (keys.current.forward) nextPosition.addScaledVector(direction, move);
    if (keys.current.backward) nextPosition.addScaledVector(direction, -move);
    if (keys.current.left) nextPosition.addScaledVector(right, -move);
    if (keys.current.right) nextPosition.addScaledVector(right, move);

    // --- COLLISION DETECTION ---
    let canMoveX = true;
    let canMoveZ = true;
    const playerRadius = 0.3; // FIX: Made the player "thinner" to squeeze through gaps

    // STAGE 2 Collision
    if (stage === 2) {
      if (nextPosition.z < -12.0 && nextPosition.z > -14.5 && nextPosition.x > -2.5 && nextPosition.x < 2.5) {
        canMoveZ = false;
        canMoveX = false;
      }
    }

    // STAGE 3 Collision
    if (stage === 3) {
      for (const shelf of LIBRARY_BOOKSHELVES) {
        // FIX: Tightened the shelf hitboxes to perfectly match the 3D models (1.4 width, 9.8 depth)
        const minX = shelf.x - 0.75 - playerRadius;
        const maxX = shelf.x + 0.75 + playerRadius;
        const minZ = shelf.z - 4.9 - playerRadius;
        const maxZ = shelf.z + 4.9 + playerRadius;

        if (nextPosition.x > minX && nextPosition.x < maxX && frameCamera.position.z > minZ && frameCamera.position.z < maxZ) canMoveX = false;
        if (frameCamera.position.x > minX && frameCamera.position.x < maxX && nextPosition.z > minZ && nextPosition.z < maxZ) canMoveZ = false;
      }
    }

    // Apply movement
    if (canMoveX) frameCamera.position.x = nextPosition.x;
    if (canMoveZ) frameCamera.position.z = nextPosition.z;

    // Apply Room Boundaries
    if (stage === 1) {
      frameCamera.position.x = THREE.MathUtils.clamp(frameCamera.position.x, -DORM_BOUNDS, DORM_BOUNDS);
      frameCamera.position.z = THREE.MathUtils.clamp(frameCamera.position.z, -DORM_BOUNDS, DORM_BOUNDS);
    } else if (stage === 2) {
      frameCamera.position.x = THREE.MathUtils.clamp(frameCamera.position.x, -LECTURE_BOUNDS, LECTURE_BOUNDS);
      frameCamera.position.z = THREE.MathUtils.clamp(frameCamera.position.z, -LECTURE_BOUNDS, LECTURE_BOUNDS);
    } else {
      frameCamera.position.x = THREE.MathUtils.clamp(frameCamera.position.x, -LIBRARY_BOUNDS_X, LIBRARY_BOUNDS_X);
      frameCamera.position.z = THREE.MathUtils.clamp(frameCamera.position.z, -LIBRARY_BOUNDS_Z, LIBRARY_BOUNDS_Z);
    }

    // ── HEIGHT & STAIR CLIMBING LOGIC (STAGE 2) ──
    let targetY = 0;
    if (stage === 2) {
      if (nextPosition.z > 13.0) {
        // Climbing UP the seating tiers
        const row = Math.floor((nextPosition.z - 13.0) / 1.1);
        const clampedRow = Math.max(0, Math.min(4, row)); 
        targetY = clampedRow * 0.4;
      } else if (nextPosition.z < -9.5) {
        // Stepping DOWN into the sunken stage area
        targetY = -1.2; 
      }
    }
    // Smooth interpolation so you "step up" and "step down" smoothly
    frameCamera.position.y = THREE.MathUtils.lerp(frameCamera.position.y, targetY, 0.15);

    // Update Minimap
    if (stage === 3 && onPositionUpdate) {
      const now = performance.now();
      if (now - positionThrottleRef.current < 100) return;
      const { x, z } = frameCamera.position;
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

// ─── Flashlight ───────────────────────────────────────────────────────────────
export function Flashlight({ isBlackout, isOn }) {
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
        color="#fafff0"
        intensity={(!isOn || isBlackout) ? 0 : 800} // Respects T toggle
        angle={Math.PI / 6}
        penumbra={0.5}
        distance={400} 
        decay={1.2} 
      />
      <pointLight intensity={isBlackout ? 0 : 60} distance={15} color="#ffffff" decay={1.5} />
    </group>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [gamePhase, setGamePhase] = useState('menu'); // 'menu' | 'game'
  const [currentStage, setCurrentStage] = useState(1);
  const [activeOverlay, setActiveOverlay] = useState(null);
  
  const [inventory, setInventory] = useState([]);
  const [isInventoryVisible, setIsInventoryVisible] = useState(true);
  
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
  
  const [transitionState, setTransitionState] = useState(null); 
  const [showKnock, setShowKnock] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(true);

  // Connect state to your custom stage 2 reducer pattern
  const [stage2State, dispatchStage2] = useReducer(lectureHallReducer, INITIAL_PUZZLE_STATE);

  const sequenceErrorTimerRef = useRef(null);
  const objectiveTimerRef = useRef(null);
  const ambientAudioRef = useRef(null);

  const clearSequenceErrorTimer = () => {
    if (sequenceErrorTimerRef.current) {
      clearTimeout(sequenceErrorTimerRef.current);
      sequenceErrorTimerRef.current = null;
    }
  };

  useEffect(() => () => clearSequenceErrorTimer(), []);

  // 🎵 Key Binds (T for Flashlight, I for Inventory)
  useEffect(() => {
    const handleKeyBinds = (e) => {
      if (gamePhase === 'game') {
        if (e.code === 'KeyT') {
          setIsFlashlightOn((prev) => !prev);
          playSFX('click.wav', 0.8);
        }
        if (e.code === 'KeyI') {
          setIsInventoryVisible((prev) => !prev);
          playSFX('slide.wav', 0.5);
        }
      }
    };
    window.addEventListener('keydown', handleKeyBinds);
    return () => window.removeEventListener('keydown', handleKeyBinds);
  }, [gamePhase]);

  // 🎵 Ambient Audio Controller
  useEffect(() => {
    if (gamePhase !== 'game') return;

    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current = null;
    }

    let track = '';
    if (currentStage === 1) track = 'atmospheric_rain_wind.wav';
    if (currentStage === 2) track = 'machine_hum.wav';
    if (currentStage === 3) track = 'low_frequency_room_tone.flac';

    if (track) {
      ambientAudioRef.current = new Audio(`/${track}`);
      ambientAudioRef.current.loop = true;
      ambientAudioRef.current.volume = 0.3;
      ambientAudioRef.current.play().catch(e => console.log('Autoplay blocked:', e));
    }

    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }
    };
  }, [currentStage, gamePhase, isGameOver, isGameBeaten]);

  // 🎵 Objectives & Horror Events
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
        playSFX('rattle_metal_lockers.wav', 1.0);
        
        // Audio Ducking: Lower rain volume
        if (ambientAudioRef.current) ambientAudioRef.current.volume = 0.1;

        setTimeout(() => {
          setShowKnock(false);
          if (ambientAudioRef.current) ambientAudioRef.current.volume = 0.3;
        }, 2000);
      }, 12000);
      return () => clearTimeout(knockTimer);
    }

    // HORROR EVENT: Library Blackout (Stage 3)
    if (currentStage === 3) {
      const blackoutTimer = setTimeout(() => {
        setIsBlackout(true);
        playSFX('bass_drop.wav', 1.0);
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
    playSFX('bass_drop.wav', 1.0);
    setTimeout(() => playSFX('metallic_screeches.mp3', 0.8), 500);
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
    setGamePhase('menu');
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
    
    // FIX: Completely reset the Stage 2 puzzle state
    dispatchStage2({ type: 'RESET' });
  };

  // 🎵 Whisper Effect Logic
  useEffect(() => {
    if (isGameBeaten || isGameOver || gamePhase !== 'game') return;
    let showTimer, hideTimer;
    const scheduleWhisper = () => {
      const nextDelay = 15000 + Math.random() * 15000;
      showTimer = setTimeout(() => {
        setShowWhisper(true);
        playSFX('distorted_reversed_whispers.mp3', 0.8);
        
        // Audio Ducking
        if (ambientAudioRef.current) ambientAudioRef.current.volume = 0.1;

        hideTimer = setTimeout(() => {
          setShowWhisper(false);
          if (ambientAudioRef.current) ambientAudioRef.current.volume = 0.3;
          scheduleWhisper();
        }, 3000);
      }, nextDelay);
    };
    scheduleWhisper();
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [isGameBeaten, isGameOver, gamePhase]);

  const [lockerError, setLockerError] = useState(false);

  const handleLockerDigit = (digit) => {
    if (isLockerUnlocked) return;
    playSFX('beep.wav', 0.5);

    const next = (passcodeInput + digit).slice(0, 3);
    setPasscodeInput(next);
    if (next.length === 3) {
      if (next === '313') {
        playSFX('slide.wav', 1.0);
        setIsLockerUnlocked(true);
        setLockerError(false);
        if (!inventory.includes('Keycard')) {
          setInventory(prev => [...prev, 'Keycard']);
        }
      } else {
        playSFX('error.wav', 0.6);
        setLockerError(true);
        setTimeout(() => {
          setPasscodeInput('');
          setLockerError(false);
        }, 900);
      }
    }
  };

  const handleLockerClear = () => {
    playSFX('beep.wav', 0.5);
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
    playSFX('click.wav', 0.7);

    const nextIndex = fileSequence.length;
    const expectedId = PROJECTOR_CORRECT_ORDER[nextIndex];

    if (fileId !== expectedId) {
      playSFX('error.wav', 0.8);
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
      playSFX('old_church_door_open.wav', 1.0);
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
      playSFX('slide.wav', 1.0);
      setTimeout(() => playSFX('metallic_screeches.mp3', 0.8), 1500);

      setIsGameBeaten(true);
      setActiveOverlay(null);
      setArchiveCodeInput('');
    } else {
      playSFX('error.wav', 0.8);
      alert('ACCESS DENIED. THE SHADOW GROWS CLOSER.');
      setArchiveCodeInput('');
    }
  };

  const closeOverlay = () => {
    playSFX('click.wav', 0.5);
    setActiveOverlay(null);
    if (activeOverlay === 'projector') resetProjectorPuzzle();
    if (activeOverlay === 'archive_keypad') setArchiveCodeInput('');
  };

  if (gamePhase === 'menu') {
    return <MainMenuController onStartGame={() => setGamePhase('game')} />;
  }

  if (isGameBeaten) {
    return (
      <div className="game-container game-container--ending">
        {/* Changed to use your imported OutroCinematic! */}
        <OutroCinematic onPlayAgain={handlePlayAgain} />
      </div>
    );
  }

  // 🎵 Keep the core stage-progression engine here
  const handleStage1Escape = () => {
    playSFX('creaky_door_open.wav', 1.0);
    setTimeout(() => playSFX('bass_drop.wav', 1.0), 1000);

    setTransitionState('toStage2');
    setTimeout(() => {
      setCurrentStage(2);
      setTransitionState(null);
    }, 4000);
  };

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
            {/* FIX: Only try to lock the mouse when 2D overlays are closed to avoid pointer lock exceptions */}
            {activeOverlay === null && <PointerLockControls />}
            <Player stage={currentStage} resetNonce={libraryResetNonce} onPositionUpdate={currentStage === 3 ? handlePlayerPositionUpdate : undefined} />
            <Flashlight isBlackout={isBlackout} isOn={isFlashlightOn} />

          {/* STAGE 1 */}
            {currentStage === 1 && (
              <DormRoom 
              inventory={inventory} 
              onObjectClick={(obj) => { playSFX('click.wav', 0.5); setActiveOverlay(obj); }} 
              onEscape={handleStage1Escape}
              />
            )}
          {/* STAGE 2 */}
            {currentStage === 2 && 
            <LectureHall 
              puzzleState={stage2State}
              onPuzzleUpdate={dispatchStage2}
              onObjectClick={(obj) => { 
                if (obj === 'stage2_complete') {
                  playSFX('old_church_door_open.wav', 1.0);
                  setTransitionState('toStage3');
                  setTimeout(() => { setCurrentStage(3); setTransitionState(null); }, 5000);
                  return;
                }
                playSFX('click.wav', 0.5); 
                setActiveOverlay(obj); 
              }} 
            />}

            {/* STAGE 3 */}
            {currentStage === 3 && (
              <MainLibrary 
              key={libraryResetNonce} 
              inventory={inventory} 
              onObjectClick={(obj) => { playSFX('click.wav', 0.5); setActiveOverlay(obj); }} 
              onCaught={handleStaffCaught} 
              onEnemyPositionUpdate={handleEnemyPositionUpdate} 
              isBlackout={isBlackout} 
              onBookCollect={(title) => {
                if (!inventory.includes(title)) {
                  playSFX('thud_falling_book.wav', 0.8);
                  setInventory([...inventory, title]);
                }
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
        
        {isInventoryVisible && (
        <div className="inventory-box">
          <p style={{ margin: '0 0 10px 0' }}>Inventory:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
            {inventory.length === 0 ? (
              <span>Empty</span>
            ) : (
              inventory.map((item) => {
                const book = LIBRARY_HIDDEN_BOOKS.find(b => b.title === item);
                return (
                  <button key={item} className="item-tag" onClick={() => { 
                    if (book) {
                      playSFX('slide.wav', 0.3);
                      setActiveOverlay(book.id); 
                    }
                  }} style={{ border: 'none', color: 'white', fontFamily: 'inherit', textAlign: 'left', cursor: book ? 'pointer' : 'default', width: '100%' }}>
                    {item}
                  </button>
                );
              })
            )}
          </div>
        </div>
        )}
        
        <p className="hint-text">Click screen to lock mouse. Press ESC to unlock.</p>
        <p className="hint-text">WASD to walk. Click objects to inspect.</p>
        <p className="hint-text" style={{color: '#ffcc00'}}>Press 'T' to toggle Flashlight.</p>
        <p className="hint-text" style={{color: '#ffcc00'}}>Press 'I' to toggle Inventory.</p>

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

            {/* === STAGE 2: PROJECTOR SYSTEM OVERLAY === */}
            {activeOverlay === 'projector' && (
              <ProjectorPuzzleOverlay 
                isOpen={true} 
                puzzleState={stage2State} 
                onDispatch={(action) => {
                  playSFX('beep.wav', 0.5);
                  dispatchStage2(action);
                }} 
                onClose={closeOverlay} 
              />
            )}

            {/* === STAGE 3: TERMINAL === */}
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

          </div>
        </div>
      )}
    </div>
  );
}