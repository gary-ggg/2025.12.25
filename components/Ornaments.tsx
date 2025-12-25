import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, TREE_CONFIG, OrnamentData } from '../types.ts';
import HelloKittyDoll, { HelloKittyData } from './HelloKittyDolls.tsx';

// Utility to create random data for Ornaments
const generateOrnamentData = (count: number): OrnamentData[] => {
  const data: OrnamentData[] = [];
  const colors = ['#FF69B4', '#FFB6C1', '#FFFFFF', '#FF0000', '#E5E4E2'];

  for (let i = 0; i < count; i++) {
    const type = Math.random() > 0.7 ? 'box' : 'sphere';
    const scale = 0.15 + Math.random() * 0.25;
    
    // Scatter Pos
    const r = TREE_CONFIG.scatterRadius * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const sx = r * Math.sin(phi) * Math.cos(theta);
    const sy = r * Math.sin(phi) * Math.sin(theta);
    const sz = r * Math.cos(phi);

    // Tree Pos
    const h = TREE_CONFIG.height;
    const yNorm = Math.random();
    const y = (yNorm - 0.5) * h;
    const coneR = TREE_CONFIG.radius * (1 - yNorm);
    const rTree = coneR * 0.9 + (Math.random() * 0.2); 
    const thetaTree = Math.random() * 2 * Math.PI;
    const tx = rTree * Math.cos(thetaTree);
    const tz = rTree * Math.sin(thetaTree);

    data.push({
      id: i,
      type,
      scale,
      color: colors[Math.floor(Math.random() * colors.length)],
      scatterPos: [sx, sy, sz],
      scatterRot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      treePos: [tx, y, tz],
      treeRot: [Math.random() * 0.5, thetaTree, 0],
    });
  }
  return data;
};

// Utility to create data for Hello Kitty Dolls
// Uses Golden Spiral on a Cone for uniform distribution
const generateKittyData = (count: number): HelloKittyData[] => {
  const arr: HelloKittyData[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const startTheta = Math.random() * Math.PI * 2; 

  for (let i = 0; i < count; i++) {
     const h = TREE_CONFIG.height;
     
     // Normalized index from 0 to 1
     // We map this to the area of the cone from the tip.
     // Area from tip is proportional to dist_from_tip^2.
     // So dist_from_tip should be proportional to sqrt(index).
     // index 0 = tip, index 1 = base.
     const k = (i + 0.5) / count; 
     const distFromTip = Math.sqrt(k); // 0 near tip, 1 near base

     // yNorm: 0 is bottom, 1 is top.
     // distFromTip 0 => yNorm 1
     // distFromTip 1 => yNorm 0
     const yNorm = 1 - distFromTip;

     const y = (yNorm - 0.5) * h;
     const coneR = TREE_CONFIG.radius * (1 - yNorm);
     
     // Sit them nicely on the branches
     // Add a little buffer so they hang 'on' the leaves
     const rTree = coneR + 0.8; 
     
     // Golden Angle distribution for Theta
     const thetaTree = startTheta + i * goldenAngle;
     const tx = rTree * Math.cos(thetaTree);
     const tz = rTree * Math.sin(thetaTree);

     // Scatter Pos (Random sphere)
     const r = TREE_CONFIG.scatterRadius * Math.cbrt(Math.random());
     const theta = Math.random() * 2 * Math.PI;
     const phi = Math.acos(2 * Math.random() - 1);
     const sx = r * Math.sin(phi) * Math.cos(theta);
     const sy = r * Math.sin(phi) * Math.sin(theta);
     const sz = r * Math.cos(phi);

     // Rotation to face outward from center
     const dummy = new THREE.Object3D();
     dummy.position.set(tx, y, tz);
     dummy.lookAt(tx * 2, y, tz * 2);

     const styleType = Math.random();
     let style: HelloKittyData['style'] = 'classic';
     if (styleType > 0.6) style = 'princess';
     if (styleType > 0.9) style = 'gold';

     arr.push({
       id: i,
       treePos: new THREE.Vector3(tx, y, tz),
       scatterPos: new THREE.Vector3(sx, sy, sz),
       rotation: dummy.rotation,
       style: style,
       scale: 0.35 
     });
  }
  return arr;
};

interface OrnamentsProps {
  appState: AppState;
}

const Ornaments: React.FC<OrnamentsProps> = ({ appState }) => {
  // 1. Instanced Ornaments
  const ornamentCount = TREE_CONFIG.ornamentCount;
  const ornamentData = useMemo(() => generateOrnamentData(ornamentCount), [ornamentCount]);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const currentPositions = useMemo(() => new Float32Array(ornamentCount * 3), [ornamentCount]);
  const currentRotations = useMemo(() => new Float32Array(ornamentCount * 3), [ornamentCount]);

  useLayoutEffect(() => {
    ornamentData.forEach((d, i) => {
      currentPositions[i * 3] = d.scatterPos[0];
      currentPositions[i * 3 + 1] = d.scatterPos[1];
      currentPositions[i * 3 + 2] = d.scatterPos[2];
      currentRotations[i * 3] = d.scatterRot[0];
      currentRotations[i * 3 + 1] = d.scatterRot[1];
      currentRotations[i * 3 + 2] = d.scatterRot[2];
      
      if (meshRef.current) {
        meshRef.current.setColorAt(i, new THREE.Color(d.color));
      }
    });
    if (meshRef.current) meshRef.current.instanceColor!.needsUpdate = true;
  }, [ornamentData, ornamentCount, currentPositions, currentRotations]);

  useFrame(() => {
    // Animate Instanced Ornaments
    if (meshRef.current) {
      const isTree = appState === AppState.TREE_SHAPE;
      const lerpFactor = 0.04; 

      ornamentData.forEach((d, i) => {
        const targetPos = isTree ? d.treePos : d.scatterPos;
        const targetRot = isTree ? d.treeRot : d.scatterRot;

        currentPositions[i * 3] = THREE.MathUtils.lerp(currentPositions[i * 3], targetPos[0], lerpFactor);
        currentPositions[i * 3 + 1] = THREE.MathUtils.lerp(currentPositions[i * 3 + 1], targetPos[1], lerpFactor);
        currentPositions[i * 3 + 2] = THREE.MathUtils.lerp(currentPositions[i * 3 + 2], targetPos[2], lerpFactor);

        currentRotations[i * 3] = THREE.MathUtils.lerp(currentRotations[i * 3], targetRot[0], lerpFactor);
        currentRotations[i * 3 + 1] = THREE.MathUtils.lerp(currentRotations[i * 3 + 1], targetRot[1], lerpFactor);
        currentRotations[i * 3 + 2] = THREE.MathUtils.lerp(currentRotations[i * 3 + 2], targetRot[2], lerpFactor);

        dummy.position.set(currentPositions[i * 3], currentPositions[i * 3 + 1], currentPositions[i * 3 + 2]);
        dummy.rotation.set(currentRotations[i * 3], currentRotations[i * 3 + 1], currentRotations[i * 3 + 2]);
        dummy.scale.setScalar(d.scale);
        dummy.updateMatrix();

        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  // 2. Hello Kitty Ornaments
  // Increased count to 15 for better coverage
  const kittyData = useMemo(() => generateKittyData(15), []);

  return (
    <group>
      {/* Standard Ornaments */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, ornamentCount]} castShadow receiveShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          roughness={0.15} 
          metalness={0.9} 
          envMapIntensity={2.5}
        />
      </instancedMesh>

      {/* Special Hello Kitty Ornaments */}
      {kittyData.map((d) => (
        <HelloKittyDoll 
          key={`kitty-${d.id}`}
          {...d}
          appState={appState}
        />
      ))}
    </group>
  );
};

export default Ornaments;