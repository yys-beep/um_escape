import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function Stage1({ 
  inventory, onObjectClick, onEscape, lockerUnlocked, keycardCollected, onUnlockLocker, onCollectKeycard 
}) {
  const ceilingLightRef = useRef();
  const lightMaterialRef = useRef();

  useFrame((state) => {
    if (ceilingLightRef.current && lightMaterialRef.current) {
      const time = state.clock.getElapsedTime();
      let intensity = 0.6 + Math.sin(time * 12) * 0.08;
      if (Math.random() > 0.95) intensity = Math.random() > 0.5 ? 0.1 : 1.3; // Flicker
      ceilingLightRef.current.intensity = intensity * 4;
      lightMaterialRef.current.emissiveIntensity = intensity * 1.5;
    }
  });

  return (
    <group>
      {/* Lighting Architecture */}
      <ambientLight intensity={0.05} />
      <pointLight ref={ceilingLightRef} position={[0, 3, 0]} distance={14} decay={2} color="#eaf4ff" castShadow />

      {/* Detailed Room Structure */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#222225" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.5, -5.9]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#2d2e35" roughness={0.8} />
      </mesh>

      {/* Interactive Exit Door */}
      <group position={[0, -0.25, 5.9]} onClick={(e) => {
        e.stopPropagation();
        inventory.includes('Keycard') ? onEscape() : onObjectClick('door_locked');
      }}>
        <mesh><boxGeometry args={[2.2, 4.5, 0.15]} /><meshStandardMaterial color="#1f1a14" roughness={0.7} /></mesh>
        <mesh position={[0.9, -0.2, 0.1]}><boxGeometry args={[0.12, 0.22, 0.06]} /><meshStandardMaterial color={inventory.includes('Keycard') ? '#00ff33' : '#ff1111'} emissive={inventory.includes('Keycard') ? '#00ff33' : '#ff1111'} /></mesh>
      </group>

      {/* UPGRADED REALISTIC LAPTOP AND DESK ASSEMBLY */}
      <group position={[-3.5, -1.2, -2.5]}>
        {/* Main Desk Frame */}
        <mesh position={[0, -0.6, 0]} castShadow receiveShadow><boxGeometry args={[2.2, 0.08, 1.2]} /><meshStandardMaterial color="#3a3025" roughness={0.5} /></mesh>
        <mesh position={[-1.0, -1.25, 0]}><boxGeometry args={[0.08, 1.3, 1.1]} /><meshStandardMaterial color="#26211a" /></mesh>
        <mesh position={[1.0, -1.25, 0]}><boxGeometry args={[0.08, 1.3, 1.1]} /><meshStandardMaterial color="#26211a" /></mesh>

        {/* 3D Realistic Modular Laptop Computer */}
        <group position={[0, -0.52, 0]} rotation={[0, 0.2, 0]} onClick={(e) => { e.stopPropagation(); onObjectClick('desk'); }}>
          {/* Laptop Base Lower Chassis */}
          <mesh castShadow><boxGeometry args={[0.5, 0.02, 0.36]} /><meshStandardMaterial color="#7a7a7a" metalness={0.8} roughness={0.2} /></mesh>
          {/* Inset Keyboard Bed Depth */}
          <mesh position={[0, 0.011, 0.05]}><boxGeometry args={[0.44, 0.005, 0.16]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
          {/* Trackpad Plate Accent */}
          <mesh position={[0, 0.011, -0.12]}><boxGeometry args={[0.12, 0.002, 0.07]} /><meshStandardMaterial color="#666666" /></mesh>
          {/* Raised Angled Screen Display Hinge */}
          <group position={[0, 0.01, 0.17]} rotation={[-0.4, 0, 0]}>
            <mesh position={[0, 0.16, -0.012]} castShadow><boxGeometry args={[0.5, 0.32, 0.018]} /><meshStandardMaterial color="#7a7a7a" metalness={0.8} /></mesh>
            {/* Glowing Emissive LCD Screen Surface */}
            <mesh position={[0, 0.16, 0.001]}><planeGeometry args={[0.47, 0.29]} /><meshStandardMaterial color="#ffffff" emissive="#7cd2ff" emissiveIntensity={1.8} /></mesh>
          </group>
        </group>
      </group>

      {/* PHYSICAL LOCKER INTERIOR ENVIROMENT */}
      <group position={[3.8, -0.25, -2.0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Outer Metal Storage Shell Layout */}
        <mesh><boxGeometry args={[1.5, 4.5, 1.2]} /><meshStandardMaterial color="#252a30" metalness={0.7} roughness={0.4} /></mesh>

        {/* Dynamic Locker Door Assembly */}
        {!lockerUnlocked ? (
          // Closed & Locked Door Layer
          <mesh position={[0, 0, 0.61]} onClick={(e) => { e.stopPropagation(); onUnlockLocker(); }}>
            <boxGeometry args={[1.46, 4.4, 0.04]} />
            <meshStandardMaterial color="#1c2024" metalness={0.8} />
          </mesh>
        ) : (
          // Swung Open Locker Door Layer
          <group position={[-0.73, 0, 0.61]} rotation={[0, -2.1, 0]}>
            <mesh position={[0.73, 0, 0]}><boxGeometry args={[1.46, 4.4, 0.04]} /><meshStandardMaterial color="#1c2024" metalness={0.8} /></mesh>
            {/* Clue Item 1: Taped Photo of Maya inside the open door panel */}
            <mesh position={[0.4, 0.5, 0.022]} rotation={[0, 0, 0.05]} onClick={(e) => { e.stopPropagation(); onObjectClick('maya_photo'); }}>
              <planeGeometry args={[0.3, 0.4]} />
              <meshStandardMaterial color="#eee" roughness={0.9} />
            </mesh>
          </group>
        )}

        {/* PHYSICAL ITEMS INSIDE SHELF CAVITY (Only accessible if cabinet is open) */}
        {lockerUnlocked && (
          <group position={[0, -0.4, 0]}>
            {/* Internal Storage Divider Grid Ledge */}
            <mesh position={[0, -0.1, 0]}><boxGeometry args={[1.4, 0.03, 1.1]} /><meshStandardMaterial color="#1c2024" /></mesh>

            {/* Clue Item 2: Interactive Matrix Student Identification Card */}
            <mesh position={[-0.3, -0.08, 0.2]} rotation={[0, 0.4, 0]} onClick={(e) => { e.stopPropagation(); onObjectClick('student_card'); }}>
              <boxGeometry args={[0.24, 0.01, 0.15]} />
              <meshStandardMaterial color="#990000" roughness={0.5} />
            </mesh>

            {/* Critical Progression Item 3: Physical Magnetic Keycard */}
            {!keycardCollected && (
              <mesh position={[0.2, -0.08, 0.25]} rotation={[0, -0.2, 0]} onClick={(e) => { e.stopPropagation(); onCollectKeycard(); }}>
                <boxGeometry args={[0.22, 0.015, 0.14]} />
                <meshStandardMaterial color="#00ff66" emissive="#00aa33" emissiveIntensity={0.6} />
              </mesh>
            )}
          </group>
        )}
      </group>
    </group>
  );
}