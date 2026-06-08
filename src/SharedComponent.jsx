import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

export function usePlayerControls() {
  const keys = useRef({ forward: false, backward: false, left: false, right: false });
  useEffect(() => {
    const keyMap = { KeyW: 'forward', KeyS: 'backward', KeyA: 'left', KeyD: 'right' };
    const onKeyDown = (e) => { const action = keyMap[e.code]; if (action) keys.current[action] = true; };
    const onKeyUp = (e) => { const action = keyMap[e.code]; if (action) keys.current[action] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);
  return keys;
}

export function Player({ stage, bounds, walkSpeed = 4.5 }) {
  const { camera } = useThree();
  const keys = usePlayerControls();
  const direction = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    if (stage === 1) camera.position.set(0, 0, 0);
    else if (stage === 2) camera.position.set(0, -1.2, 14);
    else if (stage === 3) camera.position.set(0, 0, 26);
  }, [stage, camera]);

  useFrame((_, delta) => {
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    right.crossVectors(direction, up).normalize();

    const move = walkSpeed * delta;
    if (keys.current.forward) camera.position.addScaledVector(direction, move);
    if (keys.current.backward) camera.position.addScaledVector(direction, -move);
    if (keys.current.left) camera.position.addScaledVector(right, -move);
    if (keys.current.right) camera.position.addScaledVector(right, move);

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -bounds.x, bounds.x);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -bounds.z, bounds.z);
    camera.position.y = stage === 2 ? THREE.MathUtils.clamp((camera.position.z * -0.2) - 0.8, -1.8, 1.5) : 0;
  });
  return null;
}

export function Flashlight({ isBlackout }) {
  const lightRigRef = useRef(null);
  const spotRef = useRef(null);
  const { camera, scene } = useThree();

  useEffect(() => { if (spotRef.current) scene.add(spotRef.current.target); }, [scene]);

  useFrame(() => {
    if (!lightRigRef.current || !spotRef.current) return;
    lightRigRef.current.position.copy(camera.position);
    camera.getWorldDirection(spotRef.current.target.position);
    spotRef.current.target.position.multiplyScalar(10).add(camera.position);
    spotRef.current.target.updateMatrixWorld();
  });

  return (
    <group ref={lightRigRef}>
      <spotLight ref={spotRef} color="#fcf8f0" intensity={isBlackout ? 0 : 450} angle={Math.PI / 7} penumbra={0.5} distance={120} decay={2} castShadow />
      <pointLight intensity={isBlackout ? 0 : 20} distance={4} color="#ffffff" />
    </group>
  );
}