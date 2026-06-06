import React from 'react';

export default function Stage2({ inventory, onObjectClick, onEscape }) {
  // Array matrix maps multi-tiered elevated safety row seating steps
  const rowPositions = [
    { x: 0, y: -1.8, z: -2 }, { x: 0, y: -1.2, z: -5 },
    { x: 0, y: -0.6, z: -8 }, { x: 0, y: 0.0, z: -11 }
  ];

  return (
    <group>
      <ambientLight intensity={0.02} />
      {/* Structural Emergency Warning Point Light Emittance */}
      <pointLight position={[0, 4.5, -2]} intensity={50} color="#ff3333" distance={25} />

      {/* Main Classroom Flooring Shell Structure */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[26, 32]} />
        <meshStandardMaterial color="#151518" roughness={0.9} />
      </mesh>

      {/* Deep Side Concrete Structural Piers */}
      <mesh position={[-12.8, 1.5, 0]}><boxGeometry args={[0.4, 8, 32]} /><meshStandardMaterial color="#202025" roughness={0.9} /></mesh>
      <mesh position={[12.8, 1.5, 0]}><boxGeometry args={[0.4, 8, 32]} /><meshStandardMaterial color="#202025" roughness={0.9} /></mesh>

      {/* Multi-Tier Seating Deck Depth */}
      {rowPositions.map((row, i) => (
        <group key={i} position={[row.x, row.y, row.z]}>
          {/* Floor Elevation Step */}
          <mesh castShadow receiveShadow><boxGeometry args={[20, 0.6, 2.5]} /><meshStandardMaterial color="#1e1e24" /></mesh>
          {/* Continuous Desks and Seat Back Rests */}
          <mesh position={[0, 0.6, -0.8]} castShadow><boxGeometry args={[18, 0.8, 0.1]} /><meshStandardMaterial color="#111" /></mesh>
          <mesh position={[0, 0.7, 0.4]} castShadow><boxGeometry args={[18, 0.04, 0.4]} /><meshStandardMaterial color="#423525" roughness={0.6} /></mesh>
        </group>
      ))}

      {/* Front Speaker Podium Stage Presentation Desk */}
      <group position={[0, -2.0, 6.0]} onClick={(e) => { e.stopPropagation(); onObjectClick('projector'); }}>
        <mesh castShadow><boxGeometry args={[3.5, 1.1, 1.2]} /><meshStandardMaterial color="#2d2d35" /></mesh>
        {/* AV Interfacing Control System Panel Device */}
        <mesh position={[1.0, 0.56, 0.1]} rotation={[-0.3, 0, 0]}><boxGeometry args={[0.5, 0.05, 0.4]} /><meshStandardMaterial color="#111" /></mesh>
      </group>

      {/* Main Overhead Projection Screen Rig Attachment */}
      <group position={[0, 2.0, 14.5]}>
        <mesh><boxGeometry args={[14, 0.2, 0.2]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh position={[0, -3.1, 0]}><planeGeometry args={[13.2, 6.0]} /><meshStandardMaterial color="#dddddd" emissive="#334455" emissiveIntensity={0.2} /></mesh>
      </group>

      {/* Escape Threshold Passage Zone leading directly towards Main Library */}
      <mesh position={[11.5, -1.4, 15.6]} onClick={() => onEscape()}>
        <boxGeometry args={[2.0, 2.2, 0.1]} />
        <meshStandardMaterial color="#050505" emissive="#000" />
      </mesh>
    </group>
  );
}
