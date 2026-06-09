import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import './App.css';

// ─── Stage imports ────────────────────────────────────────────────────────────
import DormRoom from './Stage1';
import { LectureHall, PROJECTOR_FILES, PROJECTOR_CORRECT_ORDER, EndingCinematic } from './Stage2';
import { MainLibrary } from './Stage3';

// ─── Data imports (This fixes the Fast Refresh error!) ────────────────────────
import {
  LIBRARY_BOOKSHELVES,
  LIBRARY_HIDDEN_BOOKS,
  LIBRARY_ARCHIVE_CODE,
  normalizeLibraryPosition,
  getBookshelfMinimapStyle,
} from './libraryData';

// ─── Shared constants ─────────────────────────────────────────────────────────
const WALK_SPEED = 4.5;
const DORM_BOUNDS = 4.5;
const LECTURE_BOUNDS = 19;
const LIBRARY_BOUNDS_X = 9;
const LIBRARY_BOUNDS_Z = 26;

const STAFF_PATROL_X = 3.5;

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

/// ─── Player (Now with Collision Detection) ────────────────────────────────────
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
    
    // Calculate where the player WANTS to move
    const nextPosition = camera.position.clone();
    if (keys.current.forward) nextPosition.addScaledVector(direction, move);
    if (keys.current.backward) nextPosition.addScaledVector(direction, -move);
    if (keys.current.left) nextPosition.addScaledVector(right, -move);
    if (keys.current.right) nextPosition.addScaledVector(right, move);

    // --- COLLISION DETECTION ---
    let canMoveX = true;
    let canMoveZ = true;
    const playerRadius = 0.6; // Acts as a bumper around the camera

    if (stage === 3) {
      for (const shelf of LIBRARY_BOOKSHELVES) {
        // Calculate the boundaries of the current bookshelf
        const minX = shelf.x - 1 - playerRadius;
        const maxX = shelf.x + 1 + playerRadius;
        const minZ = shelf.z - 5 - playerRadius;
        const maxZ = shelf.z + 5 - playerRadius;

        // If stepping horizontally puts us inside a shelf, block X movement
        if (nextPosition.x > minX && nextPosition.x < maxX && camera.position.z > minZ && camera.position.z < maxZ) {
          canMoveX = false;
        }
        // If stepping vertically puts us inside a shelf, block Z movement
        if (camera.position.x > minX && camera.position.x < maxX && nextPosition.z > minZ && nextPosition.z < maxZ) {
          canMoveZ = false;
        }
      }
    }

    // Apply movement only if the path is clear
    if (canMoveX) camera.position.x = nextPosition.x;
    if (canMoveZ) camera.position.z = nextPosition.z;

    // Apply outer room boundaries
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

    // Update Minimap
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

// ─── Flashlight ───────────────────────────────────────────────────────────────
export function Flashlight({ isBlackout }) {
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
        intensity={isBlackout ? 0 : 800} // Much brighter core
        angle={Math.PI / 6} // Wider beam
        penumbra={0.5}
        distance={400} // Increased distance to hit far walls!
        decay={1.2} // Lower decay so light travels further
      />
      {/* Increased ambient glow around the player so you are never in pitch black */}
      <pointLight intensity={isBlackout ? 0 : 60} distance={15} color="#ffffff" decay={1.5} />
    </group>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
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

  // Keep the core stage-progression engine here
  const handleStage1Escape = () => {
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
            <PointerLockControls />
            <Player stage={currentStage} resetNonce={libraryResetNonce} onPositionUpdate={currentStage === 3 ? handlePlayerPositionUpdate : undefined} />
            <Flashlight isBlackout={isBlackout} />

          {/* STAGE 1 */}
            {currentStage === 1 && (
              <DormRoom 
              inventory={inventory} 
              onObjectClick={setActiveOverlay} 
              onEscape={handleStage1Escape}
              />
      )}
          {/* STAGE 2 */}
            {currentStage === 2 && 
            <LectureHall 
            onObjectClick={setActiveOverlay
            } />}

            {/* STAGE 3 */}
            {currentStage === 3 && (
              <MainLibrary 
              key={libraryResetNonce} 
              inventory={inventory} 
              onObjectClick={setActiveOverlay} 
              onCaught={handleStaffCaught} 
              onEnemyPositionUpdate={handleEnemyPositionUpdate} 
              isBlackout={isBlackout} 
              onBookCollect={(title) => {
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
        </div>
      )}
    </div>
  );
}