import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, TREE_CONFIG } from '../types.ts';

interface GiftData {
  id: number;
  scale: THREE.Vector3;
  color: string;
  scatterPos: THREE.Vector3;
  scatterRot: THREE.Euler;
  treePos: THREE.Vector3;
  treeRot: THREE.Euler;
}

const GiftBoxes: React.FC<{ appState: AppState }> = ({ appState }) => {
  const count = 30; // Number of gifts
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate Data for Gifts
  const data = useMemo(() => {
    const arr: GiftData[] = [];
    const colors = ['#FF69B4', '#FFB6C1', '#FFFFFF', '#FFD700', '#C71585', '#E5E4E2'];

    for (let i = 0; i < count; i++) {
        // Tree Position: Base of the tree
        const angle = Math.random() * Math.PI * 2;
        // Radius: Place them around the skirt of the tree (radius ~3 to 6)
        const rBase = 2.5 + Math.random() * 4.0; 
        const x = rBase * Math.cos(angle);
        const z = rBase * Math.sin(angle);
        
        // Dimensions
        const w = 0.8 + Math.random() * 0.8;
        const h = 0.8 + Math.random() * 0.8;
        const d = 0.8 + Math.random() * 0.8;

        // Y Position: Sit on the floor. Tree goes from -6 to +6.
        // Center of box should be at -6 + h/2
        const y = -TREE_CONFIG.height / 2 + h / 2;

        // Scatter Position (Random in space)
        const rScatter = TREE_CONFIG.scatterRadius * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const sx = rScatter * Math.sin(phi) * Math.cos(theta);
        const sy = rScatter * Math.sin(phi) * Math.sin(theta);
        const sz = rScatter * Math.cos(phi);

        arr.push({
            id: i,
            scale: new THREE.Vector3(w, h, d),
            color: colors[Math.floor(Math.random() * colors.length)],
            treePos: new THREE.Vector3(x, y, z),
            treeRot: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
            scatterPos: new THREE.Vector3(sx, sy, sz),
            scatterRot: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI)
        });
    }
    return arr;
  }, []);

  // Persistent arrays for animation state
  const currentPositions = useMemo(() => new Float32Array(count * 3), [count]);
  const currentRotations = useMemo(() => new Float32Array(count * 3), [count]);

  // Initialize Colors and Positions
  useLayoutEffect(() => {
      if (meshRef.current) {
          data.forEach((d, i) => {
              meshRef.current?.setColorAt(i, new THREE.Color(d.color));
              
              // Init start positions
              currentPositions[i*3] = d.scatterPos.x;
              currentPositions[i*3+1] = d.scatterPos.y;
              currentPositions[i*3+2] = d.scatterPos.z;
              currentRotations[i*3] = d.scatterRot.x;
              currentRotations[i*3+1] = d.scatterRot.y;
              currentRotations[i*3+2] = d.scatterRot.z;
          });
          meshRef.current.instanceColor!.needsUpdate = true;
      }
  }, [data, currentPositions, currentRotations]);

  useFrame(() => {
      if (!meshRef.current) return;
      const isTree = appState === AppState.TREE_SHAPE;
      const lerpFactor = 0.05;

      data.forEach((d, i) => {
          const targetPos = isTree ? d.treePos : d.scatterPos;
          const targetRot = isTree ? d.treeRot : d.scatterRot;

          // Lerp Position
          currentPositions[i*3] = THREE.MathUtils.lerp(currentPositions[i*3], targetPos.x, lerpFactor);
          currentPositions[i*3+1] = THREE.MathUtils.lerp(currentPositions[i*3+1], targetPos.y, lerpFactor);
          currentPositions[i*3+2] = THREE.MathUtils.lerp(currentPositions[i*3+2], targetPos.z, lerpFactor);

          // Lerp Rotation
          currentRotations[i*3] = THREE.MathUtils.lerp(currentRotations[i*3], targetRot.x, lerpFactor);
          currentRotations[i*3+1] = THREE.MathUtils.lerp(currentRotations[i*3+1], targetRot.y, lerpFactor);
          currentRotations[i*3+2] = THREE.MathUtils.lerp(currentRotations[i*3+2], targetRot.z, lerpFactor);

          dummy.position.set(currentPositions[i*3], currentPositions[i*3+1], currentPositions[i*3+2]);
          dummy.rotation.set(currentRotations[i*3], currentRotations[i*3+1], currentRotations[i*3+2]);
          dummy.scale.copy(d.scale);
          dummy.updateMatrix();
          meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.2} metalness={0.1} envMapIntensity={1.5} />
    </instancedMesh>
  );
};

export default GiftBoxes;