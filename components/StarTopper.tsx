import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, TREE_CONFIG } from '../types.ts';

interface StarTopperProps {
  appState: AppState;
}

const StarTopper: React.FC<StarTopperProps> = ({ appState }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Start far away
  const scatterPos = new THREE.Vector3(10, 20, -10);
  const treePos = new THREE.Vector3(0, TREE_CONFIG.height / 2 + 0.5, 0);

  useFrame((state) => {
    if (!groupRef.current) return;

    const targetPos = appState === AppState.TREE_SHAPE ? treePos : scatterPos;
    
    // Position Lerp
    groupRef.current.position.lerp(targetPos, 0.05);

    // Rotation animation
    groupRef.current.rotation.y += 0.01;
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        {/* Simple octahedron as a star base */}
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial 
          color="#FFD700" 
          emissive="#FFD700" 
          emissiveIntensity={2} 
          roughness={0.2} 
          metalness={1}
        />
      </mesh>
      {/* Halo glow */}
      <mesh scale={1.5}>
         <sphereGeometry args={[1, 16, 16]} />
         <meshBasicMaterial color="#FFD700" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
};

export default StarTopper;