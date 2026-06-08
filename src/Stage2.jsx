import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// 🏛️ STAGE 2: The Haunted Lecture Hall
export function LectureHall({ onObjectClick }) {
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

export const PROJECTOR_FILES = [
  { id: 'coverup', label: 'Cover-up Authorized', corrupt: 'C0v3r-up Auth0riz3d' },
  { id: 'experiment', label: 'Experiment 313 Started', corrupt: 'Exp3rim3nt 313 St@rted' },
  { id: 'missing', label: 'Subject Maya Missing', corrupt: 'Subj3ct M@ya M1ssing' },
];

export const PROJECTOR_CORRECT_ORDER = ['experiment', 'missing', 'coverup'];

export const CINEMATIC_LINES = [
  'Files uploaded to University database.',
  'PROJECT 313: SUBJECT M.R. — LEAD RESEARCHER: [YOUR PARENT\'S NAME REDACTED]',
  'The hallucinations... the missing students... it was them.',
  'Maya\'s spirit guided you here to expose the truth.',
  'Campus emergency alarms echo in the distance. As you escape, Maya smiles and fades away.',
  'Some truths refuse to stay buried.',
];

export function EndingCinematic({ onPlayAgain }) {
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
