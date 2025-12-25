import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Snow = () => {
  const count = 2000;
  const meshRef = useRef<THREE.Points>(null);

  // Generate snow data
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;     // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60; // z
      
      vel[i * 3] = (Math.random() - 0.5) * 0.05;   // sway x
      vel[i * 3 + 1] = -0.05 - Math.random() * 0.1; // fall y speed
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.05; // sway z
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    const geom = meshRef.current.geometry;
    const pos = geom.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      // Update Y (Fall)
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      
      // Update X/Z (Sway)
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 2] += velocities[i * 3 + 2];

      // Reset if below bottom
      if (pos[i * 3 + 1] < -30) {
        pos[i * 3 + 1] = 30;
        pos[i * 3] = (Math.random() - 0.5) * 60;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      }
    }
    
    geom.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FFFFFF"
        size={0.15}
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

export default Snow;
