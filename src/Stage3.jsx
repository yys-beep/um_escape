import React from 'react';

export default function Stage3({ onTerminalClick }) {
  // Complex localized relative coordinate grid defining bookshelf maze walls
  const customShelves = [
    { x: -5, z: 8, w: 1.8, d: 6.5 }, { x: 5, z: 12, w: 1.8, d: 8.0 },
    { x: -5, z: -4, w: 1.8, d: 9.0 }, { x: 4, z: -2, w: 1.8, d: 6.0 },
    { x: 0, z: -12, w: 7.0, d: 1.8 }, { x: -6, z: -18, w: 1.8, d: 7.0 }
  ];

  return (
    <group>
      <ambientLight intensity={0.01} />
      
      {/* Foundation Flooring System */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[24, 60]} />
        <meshStandardMaterial color="#121214" roughness={0.95} />
      </mesh>

      {/* Structural Pillars creating architectural scale split */}
      <mesh position={[-9, 3.5, 0]} castShadow><cylinderGeometry args={[0.4, 0.4, 12, 8]} /><meshStandardMaterial color="#22252b" /></mesh>
      <mesh position={[9, 3.5, 0]} castShadow><cylinderGeometry args={[0.4, 0.4, 12, 8]} /><meshStandardMaterial color="#22252b" /></mesh>
      <mesh position={[0, 9.3, 0]}><boxGeometry args={[18.4, 0.5, 0.8]} /><meshStandardMaterial color="#1a1c20" /></mesh>

      {/* Geometric High-Depth Bookshelves with Shelving Slots */}
      {customShelves.map((sh, idx) => (
        <group key={idx} position={[sh.x, 1.5, sh.z]}>
          {/* Outermost Hardwood Casing Block */}
          <mesh castShadow receiveShadow><boxGeometry args={[sh.w, 8, sh.d]} /><meshStandardMaterial color="#301f13" roughness={0.8} /></mesh>
          {/* Recessed shadow backing texture layer simulating book arrays */}
          <mesh position={[0, 0, sh.d/2 + 0.01]}><planeGeometry args={[sh.w - 0.2, 7.4]} /><meshStandardMaterial color="#120d0a" /></mesh>
          <mesh position={[0, 0, -sh.d/2 - 0.01]}><planeGeometry args={[sh.w - 0.2, 7.4]} /><meshStandardMaterial color="#120d0a" /></mesh>
        </group>
      ))}

      {/* Peripheral Wire Safety Fences bounding the archive zone */}
      <mesh position={[-11.9, 1.5, 0]}><boxGeometry args={[0.1, 8, 60]} /><meshStandardMaterial color="#222" wireframe /></mesh>
      <mesh position={[11.9, 1.5, 0]}><boxGeometry args={[0.1, 8, 60]} /><meshStandardMaterial color="#222" wireframe /></mesh>

      {/* Deep Central Main Archive Database Terminal Pedestal */}
      <group position={[0, -1.3, -26.0]} onClick={(e) => { e.stopPropagation(); onTerminalClick(); }}>
        {/* Multi-layered custom geometry base setup */}
        <mesh position={[0, -0.4, 0]} castShadow><boxGeometry args={[1.4, 0.4, 1.4]} /><meshStandardMaterial color="#1b1e22" metalness={0.5} /></mesh>
        <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.6, 1.1, 0.6]} /><meshStandardMaterial color="#2c313a" metalness={0.7} /></mesh>
        {/* Slanted Display Monitor Top Frame */}
        <group position={[0, 0.9, -0.1]} rotation={[-0.4, 0, 0]}>
          <mesh castShadow><boxGeometry args={[1.1, 0.7, 0.15]} /><meshStandardMaterial color="#15171c" /></mesh>
          {/* CRT Terminal Screen Material Target Glow */}
          <mesh position={[0, 0, 0.08]}><planeGeometry args={[0.98, 0.58]} /><meshStandardMaterial color="#002200" emissive="#33ff33" emissiveIntensity={1.2} /></mesh>
        </group>
      </group>
    </group>
  );
}
