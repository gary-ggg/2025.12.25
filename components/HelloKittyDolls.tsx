import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState } from '../types.ts';

export interface HelloKittyData {
  id: number;
  scatterPos: THREE.Vector3;
  treePos: THREE.Vector3;
  rotation: THREE.Euler; // Tree rotation
  style: 'classic' | 'princess' | 'gold';
  scale: number;
}

interface Props extends HelloKittyData {
  appState: AppState;
}

const Whiskers = () => (
  <group>
    {/* Right Cheeks */}
    <mesh position={[0.45, -0.05, 0.85]} rotation={[0, 0, 0.1]}>
      <boxGeometry args={[0.3, 0.02, 0.02]} />
      <meshStandardMaterial color="black" />
    </mesh>
    <mesh position={[0.45, -0.15, 0.85]} rotation={[0, 0, 0]}>
      <boxGeometry args={[0.3, 0.02, 0.02]} />
      <meshStandardMaterial color="black" />
    </mesh>
    <mesh position={[0.45, -0.25, 0.85]} rotation={[0, 0, -0.1]}>
      <boxGeometry args={[0.3, 0.02, 0.02]} />
      <meshStandardMaterial color="black" />
    </mesh>

    {/* Left Cheeks */}
    <mesh position={[-0.45, -0.05, 0.85]} rotation={[0, 0, -0.1]}>
      <boxGeometry args={[0.3, 0.02, 0.02]} />
      <meshStandardMaterial color="black" />
    </mesh>
    <mesh position={[-0.45, -0.15, 0.85]} rotation={[0, 0, 0]}>
      <boxGeometry args={[0.3, 0.02, 0.02]} />
      <meshStandardMaterial color="black" />
    </mesh>
    <mesh position={[-0.45, -0.25, 0.85]} rotation={[0, 0, 0.1]}>
      <boxGeometry args={[0.3, 0.02, 0.02]} />
      <meshStandardMaterial color="black" />
    </mesh>
  </group>
);

const HelloKittyDoll: React.FC<Props> = ({ 
  appState, scatterPos, treePos, rotation, style, scale 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Colors based on style
  const bowColor = style === 'classic' ? '#FF0000' : style === 'princess' ? '#FF69B4' : '#FFD700';
  const headColor = style === 'gold' ? '#FFF8E7' : '#FFFFFF';
  const dressColor = style === 'classic' ? '#0000FF' : style === 'princess' ? '#FFB6C1' : '#C5A000';

  useFrame(() => {
    if (!groupRef.current) return;
    const isTree = appState === AppState.TREE_SHAPE;
    const lerpFactor = 0.04;

    const targetPos = isTree ? treePos : scatterPos;
    
    // Position Lerp
    groupRef.current.position.lerp(targetPos, lerpFactor);

    if (isTree) {
      // Align to tree normal
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, rotation.x, lerpFactor);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotation.y, lerpFactor);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, rotation.z, lerpFactor);
    } else {
      // Float and rotate slowly in space when scattered
      groupRef.current.rotation.x += 0.01;
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef} position={scatterPos} scale={scale}>
      
      {/* --- HEAD GROUP --- */}
      <group position={[0, 0.5, 0]}>
        {/* Head Shape (Squashed Sphere) */}
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={headColor} roughness={0.3} metalness={0.1} />
          <group scale={[1.2, 0.9, 1]}></group>
        </mesh>
        
        {/* Ears */}
        <mesh position={[-0.8, 0.7, 0]} rotation={[0, 0, 0.5]}>
           <coneGeometry args={[0.3, 0.5, 32]} />
           <meshStandardMaterial color={headColor} roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0.8, 0.7, 0]} rotation={[0, 0, -0.5]}>
           <coneGeometry args={[0.3, 0.5, 32]} />
           <meshStandardMaterial color={headColor} roughness={0.3} metalness={0.1} />
        </mesh>

        {/* Bow */}
        <group position={[-0.8, 0.4, 0.6]} rotation={[0, -0.2, -0.2]} scale={0.8}>
           <mesh>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial color={bowColor} roughness={0.2} metalness={0.3} />
           </mesh>
           <mesh position={[-0.35, 0, 0]} scale={[1, 1.2, 0.6]}>
              <sphereGeometry args={[0.35, 16, 16]} />
              <meshStandardMaterial color={bowColor} roughness={0.2} metalness={0.3} />
           </mesh>
           <mesh position={[0.35, 0, 0]} scale={[1, 1.2, 0.6]}>
              <sphereGeometry args={[0.35, 16, 16]} />
              <meshStandardMaterial color={bowColor} roughness={0.2} metalness={0.3} />
           </mesh>
        </group>

        {/* Eyes */}
        <mesh position={[-0.4, -0.1, 0.88]} scale={[1, 1.4, 0.3]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#111111" roughness={0.1} />
        </mesh>
        <mesh position={[0.4, -0.1, 0.88]} scale={[1, 1.4, 0.3]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#111111" roughness={0.1} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.25, 0.92]} scale={[1, 0.6, 0.4]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#FFD700" roughness={0.2} />
        </mesh>

        {/* Whiskers */}
        <Whiskers />
      </group>

      {/* --- BODY GROUP --- */}
      <group position={[0, -0.8, 0]}>
         {/* Dress/Body */}
         <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.5, 0.9, 1.4, 32]} />
            <meshStandardMaterial color={dressColor} roughness={0.4} />
         </mesh>

         {/* Arms */}
         <mesh position={[-0.7, 0.3, 0]} rotation={[0, 0, 0.5]}>
            <capsuleGeometry args={[0.2, 0.6, 4, 8]} />
            <meshStandardMaterial color={headColor} />
         </mesh>
         <mesh position={[0.7, 0.3, 0]} rotation={[0, 0, -0.5]}>
            <capsuleGeometry args={[0.2, 0.6, 4, 8]} />
            <meshStandardMaterial color={headColor} />
         </mesh>

         {/* Feet */}
         <mesh position={[-0.4, -0.8, 0.2]} rotation={[0.2, 0, 0]}>
            <capsuleGeometry args={[0.22, 0.5, 4, 8]} />
            <meshStandardMaterial color={headColor} />
         </mesh>
         <mesh position={[0.4, -0.8, 0.2]} rotation={[0.2, 0, 0]}>
            <capsuleGeometry args={[0.22, 0.5, 4, 8]} />
            <meshStandardMaterial color={headColor} />
         </mesh>
      </group>

    </group>
  );
};

export default HelloKittyDoll;