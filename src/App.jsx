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
          </div>
        </div>
      )}

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
        </div>
      )}
    </div>
  );
}
    </div>
  );
}
