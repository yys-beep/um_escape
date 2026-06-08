import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// 🛏️ STAGE 1: Kolej Kediaman Ke-1 (Dorm Room) — fully decorated
export default function DormRoom({ inventory, onObjectClick, handleDoorClick }) {
  const ceilingLightRef = useRef();
  const lightMaterialRef = useRef();

  // HORROR EVENT: Realistic fluorescent tube flicker
  useFrame((state) => {
    if (ceilingLightRef.current && lightMaterialRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Base humming flicker combined with sudden violent drops
      let intensity = 0.5 + Math.sin(time * 10) * 0.1 + Math.cos(time * 23) * 0.15;
      
      // 8% chance per frame group to experience a severe brownout spike
      if (Math.random() > 0.92) {
        intensity = Math.random() > 0.5 ? 0.05 : 1.4;
      }
      
      ceilingLightRef.current.intensity = intensity * 4;
      lightMaterialRef.current.emissiveIntensity = intensity * 1.5;
    }
  });

  return (
    <group>
      {/* === ENVIRONMENTAL LIGHTING === */}
      <ambientLight intensity={0.04} />
      <pointLight 
        ref={ceilingLightRef} 
        position={[0, 3.0, 0]} 
        distance={12} 
        decay={2} 
        color="#e6f2ff" // Cold, sterile hospital white
        castShadow
      />


      {/* === ROOM SHELL === */}
      {/* Floor — worn concrete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#2d2d32" roughness={0.98} metalness={0.1} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#28282e" roughness={0.9} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 0.35, -4.9]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#26262e" roughness={0.95} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-4.9, 0.35, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#22222a" roughness={0.95} />
      </mesh>
      {/* Right wall */}
      <mesh position={[4.9, 0.35, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#22222a" roughness={0.95} />
      </mesh>
      {/* Front wall sections with door gap */}
      <mesh position={[-2.8, 0.35, 4.9]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[4.5, 8]} />
        <meshStandardMaterial color="#26262e" roughness={0.95} />
      </mesh>
      <mesh position={[3.2, 0.35, 4.9]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3, 8]} />
        <meshStandardMaterial color="#26262e" roughness={0.95} />
      </mesh>
      <mesh position={[0.2, 2.2, 4.9]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.6, 2]} />
        <meshStandardMaterial color="#26262e" roughness={0.95} />
      </mesh>

    {/* === EXPOSED ELECTRICAL PVC CONDUITS (Tingkap/Dinding Realism) === */}
      {/* Surface-mounted orange electrical piping common in old residential colleges */}
      <group position={[-4.85, 2.0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 9.8, 6]} />
          <meshStandardMaterial color="#cc5522" roughness={0.6} /> {/* Aged orange PVC */}
        </mesh>
        {/* Junction Box */}
        <mesh position={[0, 0.5, -2.0]}>
          <boxGeometry args={[0.04, 0.12, 0.12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </group>

{/* === RETRO TOGGLE LIGHT SWITCH (Near Door) === */}
      <group position={[-1.2, 0.2, 4.82]} rotation={[0, Math.PI, 0]}>
        {/* Yellowed plastic faceplate */}
        <mesh>
          <boxGeometry args={[0.12, 0.16, 0.02]} />
          <meshStandardMaterial color="#dfded0" roughness={0.7} />
        </mesh>
        {/* Tiny toggle rocker */}
        <mesh position={[0, 0, 0.015]}>
          <boxGeometry args={[0.02, 0.04, 0.02]} />
          <meshStandardMaterial color="#ccccc0" roughness={0.5} />
        </mesh>
      </group>


      {/* === FLUORESCENT FIXTURE WITH CASING === */}
      <group position={[0, 3.12, 0]}>
        {/* Industrial gray metal fixture backer */}
        <mesh>
          <boxGeometry args={[2.6, 0.08, 0.24]} />
          <meshStandardMaterial color="#55555c" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Glow glass element */}
        <mesh position={[0, -0.04, 0]}>
          <boxGeometry args={[2.4, 0.04, 0.09]} />
          <meshStandardMaterial 
            ref={lightMaterialRef} 
            color="#dffff5" 
            emissive="#bdf7e7" 
            emissiveIntensity={1.2} 
          />
        </mesh>
      </group>



{/* === DOOR (front wall, clickable) === */}
<group 
  position={[0.2, -0.15, 4.85]} 
  onClick={(e) => {
    e.stopPropagation(); // 1. Stops the click from passing through the door
    if (handleDoorClick) {
      handleDoorClick(e); // 2. Calls the function passed down from App.jsx
    }
  }}
>
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
