import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { TREE_CONFIG, AppState } from '../types.ts';
import { useFrame } from '@react-three/fiber';

interface Props {
  appState: AppState;
}

const Garland: React.FC<Props> = ({ appState }) => {
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    // Create a spiral down the cone
    const loops = 6;
    const pointsPerLoop = 20;
    const totalPoints = loops * pointsPerLoop;
    
    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints; // 0 to 1 (Top to Bottom)
      
      // Height: Start from top (h/2) to bottom (-h/2)
      // We start slightly below the star
      const h = TREE_CONFIG.height;
      const y = (0.5 - t) * h * 0.9; 
      
      // Radius: Cone shape
      // t=0 (top) -> r=small, t=1 (bottom) -> r=large
      const r = (t * TREE_CONFIG.radius) + 0.5; // +0.5 offset to sit on foliage
      
      // Spiral Angle
      const angle = t * loops * Math.PI * 2;
      
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);
      
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return new THREE.CatmullRomCurve3(points);
  }, []);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 128, 0.15, 8, false);
  }, [curve]);

  // Ref for animation
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
        // Subtle shimmer on the red ribbon
        const t = state.clock.elapsedTime;
        materialRef.current.emissiveIntensity = 0.2 + Math.sin(t * 2) * 0.1;
    }
  });

  return (
    <mesh geometry={geometry}>
        <meshStandardMaterial 
            ref={materialRef}
            color="#FF0000" 
            emissive="#880000"
            emissiveIntensity={0.2}
            roughness={0.2} 
            metalness={0.6} 
        />
    </mesh>
  );
};

export default Garland;