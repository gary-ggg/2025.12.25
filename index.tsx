import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- TYPES & CONFIG ---

enum AppState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

interface OrnamentData {
  id: number;
  type: 'sphere' | 'box' | 'star';
  scale: number;
  color: string;
  scatterPos: [number, number, number];
  scatterRot: [number, number, number];
  treePos: [number, number, number];
  treeRot: [number, number, number];
}

interface HelloKittyData {
  id: number;
  scatterPos: THREE.Vector3;
  treePos: THREE.Vector3;
  rotation: THREE.Euler; 
  style: 'classic' | 'princess' | 'gold';
  scale: number;
}

const TREE_CONFIG = {
  height: 12,
  radius: 5,
  foliageCount: 15000,
  ornamentCount: 250,
  scatterRadius: 25,
};

// --- COMPONENTS ---

// 1. SNOW
const Snow = () => {
  const count = 2000;
  const meshRef = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      
      vel[i * 3] = (Math.random() - 0.5) * 0.05;
      vel[i * 3 + 1] = -0.05 - Math.random() * 0.1;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    const geom = meshRef.current.geometry;
    const pos = geom.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 2] += velocities[i * 3 + 2];

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
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#FFFFFF" size={0.15} transparent opacity={0.8} sizeAttenuation depthWrite={false} />
    </points>
  );
};

// 2. HELLO KITTY
const Whiskers = () => (
  <group>
    {[0.1, 0, -0.1].map((rot, i) => (
      <mesh key={`r${i}`} position={[0.45, -0.05 - i*0.1, 0.85]} rotation={[0, 0, rot]}>
        <boxGeometry args={[0.3, 0.02, 0.02]} />
        <meshStandardMaterial color="black" />
      </mesh>
    ))}
    {[-0.1, 0, 0.1].map((rot, i) => (
      <mesh key={`l${i}`} position={[-0.45, -0.05 - i*0.1, 0.85]} rotation={[0, 0, rot]}>
        <boxGeometry args={[0.3, 0.02, 0.02]} />
        <meshStandardMaterial color="black" />
      </mesh>
    ))}
  </group>
);

const HelloKittyDoll: React.FC<HelloKittyData & { appState: AppState }> = ({ 
  appState, scatterPos, treePos, rotation, style, scale 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const bowColor = style === 'classic' ? '#FF0000' : style === 'princess' ? '#FF69B4' : '#FFD700';
  const headColor = style === 'gold' ? '#FFF8E7' : '#FFFFFF';
  const dressColor = style === 'classic' ? '#0000FF' : style === 'princess' ? '#FFB6C1' : '#C5A000';

  useFrame(() => {
    if (!groupRef.current) return;
    const isTree = appState === AppState.TREE_SHAPE;
    const lerpFactor = 0.04;
    const targetPos = isTree ? treePos : scatterPos;
    
    groupRef.current.position.lerp(targetPos, lerpFactor);

    if (isTree) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, rotation.x, lerpFactor);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotation.y, lerpFactor);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, rotation.z, lerpFactor);
    } else {
      groupRef.current.rotation.x += 0.01;
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef} position={scatterPos} scale={scale}>
      <group position={[0, 0.5, 0]}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={headColor} roughness={0.3} metalness={0.1} />
          <group scale={[1.2, 0.9, 1]}></group>
        </mesh>
        <mesh position={[-0.8, 0.7, 0]} rotation={[0, 0, 0.5]}>
           <coneGeometry args={[0.3, 0.5, 32]} />
           <meshStandardMaterial color={headColor} roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0.8, 0.7, 0]} rotation={[0, 0, -0.5]}>
           <coneGeometry args={[0.3, 0.5, 32]} />
           <meshStandardMaterial color={headColor} roughness={0.3} metalness={0.1} />
        </mesh>
        <group position={[-0.8, 0.4, 0.6]} rotation={[0, -0.2, -0.2]} scale={0.8}>
           <mesh><sphereGeometry args={[0.3, 16, 16]} /><meshStandardMaterial color={bowColor} roughness={0.2} metalness={0.3} /></mesh>
           <mesh position={[-0.35, 0, 0]} scale={[1, 1.2, 0.6]}><sphereGeometry args={[0.35, 16, 16]} /><meshStandardMaterial color={bowColor} roughness={0.2} metalness={0.3} /></mesh>
           <mesh position={[0.35, 0, 0]} scale={[1, 1.2, 0.6]}><sphereGeometry args={[0.35, 16, 16]} /><meshStandardMaterial color={bowColor} roughness={0.2} metalness={0.3} /></mesh>
        </group>
        <mesh position={[-0.4, -0.1, 0.88]} scale={[1, 1.4, 0.3]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#111111" roughness={0.1} /></mesh>
        <mesh position={[0.4, -0.1, 0.88]} scale={[1, 1.4, 0.3]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="#111111" roughness={0.1} /></mesh>
        <mesh position={[0, -0.25, 0.92]} scale={[1, 0.6, 0.4]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#FFD700" roughness={0.2} /></mesh>
        <Whiskers />
      </group>
      <group position={[0, -0.8, 0]}>
         <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.5, 0.9, 1.4, 32]} /><meshStandardMaterial color={dressColor} roughness={0.4} /></mesh>
         <mesh position={[-0.7, 0.3, 0]} rotation={[0, 0, 0.5]}><capsuleGeometry args={[0.2, 0.6, 4, 8]} /><meshStandardMaterial color={headColor} /></mesh>
         <mesh position={[0.7, 0.3, 0]} rotation={[0, 0, -0.5]}><capsuleGeometry args={[0.2, 0.6, 4, 8]} /><meshStandardMaterial color={headColor} /></mesh>
         <mesh position={[-0.4, -0.8, 0.2]} rotation={[0.2, 0, 0]}><capsuleGeometry args={[0.22, 0.5, 4, 8]} /><meshStandardMaterial color={headColor} /></mesh>
         <mesh position={[0.4, -0.8, 0.2]} rotation={[0.2, 0, 0]}><capsuleGeometry args={[0.22, 0.5, 4, 8]} /><meshStandardMaterial color={headColor} /></mesh>
      </group>
    </group>
  );
};

// 3. STAR TOPPER
const StarTopper: React.FC<{ appState: AppState }> = ({ appState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const scatterPos = new THREE.Vector3(10, 20, -10);
  const treePos = new THREE.Vector3(0, TREE_CONFIG.height / 2 + 0.5, 0);

  useFrame((state) => {
    if (!groupRef.current) return;
    const targetPos = appState === AppState.TREE_SHAPE ? treePos : scatterPos;
    groupRef.current.position.lerp(targetPos, 0.05);
    groupRef.current.rotation.y += 0.01;
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} roughness={0.2} metalness={1} />
      </mesh>
      <mesh scale={1.5}>
         <sphereGeometry args={[1, 16, 16]} />
         <meshBasicMaterial color="#FFD700" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
};

// 4. GIFT BOXES
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
  const count = 30;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const arr: GiftData[] = [];
    const colors = ['#FF69B4', '#FFB6C1', '#FFFFFF', '#FFD700', '#C71585', '#E5E4E2'];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const rBase = 2.5 + Math.random() * 4.0; 
        const h = 0.8 + Math.random() * 0.8;
        const y = -TREE_CONFIG.height / 2 + h / 2;
        const rScatter = TREE_CONFIG.scatterRadius * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);

        arr.push({
            id: i,
            scale: new THREE.Vector3(0.8+Math.random()*0.8, h, 0.8+Math.random()*0.8),
            color: colors[Math.floor(Math.random() * colors.length)],
            treePos: new THREE.Vector3(rBase * Math.cos(angle), y, rBase * Math.sin(angle)),
            treeRot: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
            scatterPos: new THREE.Vector3(rScatter*Math.sin(phi)*Math.cos(theta), rScatter*Math.sin(phi)*Math.sin(theta), rScatter*Math.cos(phi)),
            scatterRot: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI)
        });
    }
    return arr;
  }, []);

  const currentPositions = useMemo(() => new Float32Array(count * 3), [count]);
  const currentRotations = useMemo(() => new Float32Array(count * 3), [count]);

  useLayoutEffect(() => {
      if (meshRef.current) {
          data.forEach((d, i) => {
              meshRef.current?.setColorAt(i, new THREE.Color(d.color));
              currentPositions[i*3] = d.scatterPos.x;
              currentPositions[i*3+1] = d.scatterPos.y;
              currentPositions[i*3+2] = d.scatterPos.z;
              currentRotations[i*3] = d.scatterRot.x;
              currentRotations[i*3+1] = d.scatterRot.y;
              currentRotations[i*3+2] = d.scatterRot.z;
          });
          meshRef.current.instanceColor!.needsUpdate = true;
      }
  }, [data]);

  useFrame(() => {
      if (!meshRef.current) return;
      const isTree = appState === AppState.TREE_SHAPE;
      const lerpFactor = 0.05;

      data.forEach((d, i) => {
          const targetPos = isTree ? d.treePos : d.scatterPos;
          const targetRot = isTree ? d.treeRot : d.scatterRot;

          currentPositions[i*3] = THREE.MathUtils.lerp(currentPositions[i*3], targetPos.x, lerpFactor);
          currentPositions[i*3+1] = THREE.MathUtils.lerp(currentPositions[i*3+1], targetPos.y, lerpFactor);
          currentPositions[i*3+2] = THREE.MathUtils.lerp(currentPositions[i*3+2], targetPos.z, lerpFactor);
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

// 5. FOLIAGE
const foliageVertexShader = `
  uniform float uTime;
  uniform float uMorphFactor;
  uniform float uPixelRatio;
  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  attribute float aRandom;
  varying float vAlpha;
  varying vec3 vColor;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    float t = uMorphFactor;
    float ease = t * t * (3.0 - 2.0 * t);
    vec3 pos = mix(aScatterPos, aTreePos, ease);
    float noiseFreq = 0.5;
    float noiseAmp = 0.15 * (0.5 + 0.5 * ease); 
    vec3 noiseOffset = vec3(
      snoise(vec3(pos.x * noiseFreq, pos.y * noiseFreq, uTime * 0.5)),
      snoise(vec3(pos.x * noiseFreq, pos.y * noiseFreq, uTime * 0.5 + 10.0)),
      snoise(vec3(pos.x * noiseFreq, pos.y * noiseFreq, uTime * 0.5 + 20.0))
    );
    pos += noiseOffset * noiseAmp;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (40.0 * uPixelRatio * (0.5 + 0.5 * aRandom)) / -mvPosition.z;
    float heightMix = (pos.y + 6.0) / 12.0;
    vec3 colorBottom = vec3(1.0, 0.08, 0.58); 
    vec3 colorTop = vec3(1.0, 0.9, 0.95);    
    vColor = mix(colorBottom, colorTop, heightMix);
    float glimmer = sin(uTime * 3.0 + aRandom * 10.0);
    if (glimmer > 0.9) { vColor = vec3(1.0, 1.0, 1.0); } 
    else if (glimmer < -0.9) { vColor = vec3(1.0, 0.84, 0.0); }
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const foliageFragmentShader = `
  varying vec3 vColor;
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.3, dist);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const Foliage: React.FC<{ appState: AppState }> = ({ appState }) => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, scatterPos, treePos, randoms } = useMemo(() => {
    const count = TREE_CONFIG.foliageCount;
    const positions = new Float32Array(count * 3);
    const scatterPos = new Float32Array(count * 3);
    const treePos = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = TREE_CONFIG.scatterRadius * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      scatterPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      scatterPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      scatterPos[i * 3 + 2] = r * Math.cos(phi);

      const h = TREE_CONFIG.height;
      const yNorm = Math.random();
      const y = (yNorm - 0.5) * h;
      const coneR = TREE_CONFIG.radius * (1 - yNorm);
      const rTree = coneR * Math.sqrt(Math.random()); 
      const thetaTree = Math.random() * 2 * Math.PI;

      treePos[i * 3] = rTree * Math.cos(thetaTree);
      treePos[i * 3 + 1] = y;
      treePos[i * 3 + 2] = rTree * Math.sin(thetaTree);

      positions[i * 3] = scatterPos[i*3];
      positions[i * 3 + 1] = scatterPos[i*3+1];
      positions[i * 3 + 2] = scatterPos[i*3+2];
      randoms[i] = Math.random();
    }
    return { positions, scatterPos, treePos, randoms };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMorphFactor: { value: 0 },
    uPixelRatio: { value: 1 },
  }), []);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.uniforms) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
      const targetMorph = appState === AppState.TREE_SHAPE ? 1.0 : 0.0;
      materialRef.current.uniforms.uMorphFactor.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uMorphFactor.value,
        targetMorph,
        0.03
      );
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aScatterPos" count={scatterPos.length / 3} array={scatterPos} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={treePos.length / 3} array={treePos} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={randoms.length} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial ref={materialRef} vertexShader={foliageVertexShader} fragmentShader={foliageFragmentShader} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

// 6. ORNAMENTS
const Ornaments: React.FC<{ appState: AppState }> = ({ appState }) => {
  const ornamentCount = TREE_CONFIG.ornamentCount;
  
  const ornamentData = useMemo(() => {
    const data: OrnamentData[] = [];
    const colors = ['#FF69B4', '#FFB6C1', '#FFFFFF', '#FF0000', '#E5E4E2'];
    for (let i = 0; i < ornamentCount; i++) {
        const type = Math.random() > 0.7 ? 'box' : 'sphere';
        const h = TREE_CONFIG.height;
        const yNorm = Math.random();
        const y = (yNorm - 0.5) * h;
        const coneR = TREE_CONFIG.radius * (1 - yNorm);
        const rTree = coneR * 0.9 + (Math.random() * 0.2); 
        const thetaTree = Math.random() * 2 * Math.PI;

        const r = TREE_CONFIG.scatterRadius * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);

        data.push({
        id: i, type, scale: 0.15 + Math.random() * 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
        scatterPos: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)],
        scatterRot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        treePos: [rTree * Math.cos(thetaTree), y, rTree * Math.sin(thetaTree)],
        treeRot: [Math.random() * 0.5, thetaTree, 0],
        });
    }
    return data;
  }, [ornamentCount]);

  const kittyData = useMemo(() => {
      const arr: HelloKittyData[] = [];
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const startTheta = Math.random() * Math.PI * 2; 
      for (let i = 0; i < 15; i++) {
          const k = (i + 0.5) / 15; 
          const distFromTip = Math.sqrt(k); 
          const yNorm = 1 - distFromTip;
          const y = (yNorm - 0.5) * TREE_CONFIG.height;
          const coneR = TREE_CONFIG.radius * (1 - yNorm);
          const rTree = coneR + 0.8; 
          const thetaTree = startTheta + i * goldenAngle;
          
          const r = TREE_CONFIG.scatterRadius * Math.cbrt(Math.random());
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.acos(2 * Math.random() - 1);
          
          const dummy = new THREE.Object3D();
          dummy.position.set(rTree * Math.cos(thetaTree), y, rTree * Math.sin(thetaTree));
          dummy.lookAt(rTree * Math.cos(thetaTree) * 2, y, rTree * Math.sin(thetaTree) * 2);

          let style: HelloKittyData['style'] = 'classic';
          const styleType = Math.random();
          if (styleType > 0.6) style = 'princess';
          if (styleType > 0.9) style = 'gold';

          arr.push({
            id: i,
            treePos: new THREE.Vector3(rTree * Math.cos(thetaTree), y, rTree * Math.sin(thetaTree)),
            scatterPos: new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)),
            rotation: dummy.rotation,
            style,
            scale: 0.35 
          });
      }
      return arr;
  }, []);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const currentPositions = useMemo(() => new Float32Array(ornamentCount * 3), [ornamentCount]);
  const currentRotations = useMemo(() => new Float32Array(ornamentCount * 3), [ornamentCount]);

  useLayoutEffect(() => {
    ornamentData.forEach((d, i) => {
      currentPositions[i * 3] = d.scatterPos[0]; currentPositions[i * 3 + 1] = d.scatterPos[1]; currentPositions[i * 3 + 2] = d.scatterPos[2];
      currentRotations[i * 3] = d.scatterRot[0]; currentRotations[i * 3 + 1] = d.scatterRot[1]; currentRotations[i * 3 + 2] = d.scatterRot[2];
      if (meshRef.current) meshRef.current.setColorAt(i, new THREE.Color(d.color));
    });
    if (meshRef.current) meshRef.current.instanceColor!.needsUpdate = true;
  }, [ornamentData, ornamentCount]);

  useFrame(() => {
    if (meshRef.current) {
      const isTree = appState === AppState.TREE_SHAPE;
      const lerpFactor = 0.04; 
      ornamentData.forEach((d, i) => {
        const targetPos = isTree ? d.treePos : d.scatterPos;
        const targetRot = isTree ? d.treeRot : d.scatterRot;
        currentPositions[i*3] = THREE.MathUtils.lerp(currentPositions[i*3], targetPos[0], lerpFactor);
        currentPositions[i*3+1] = THREE.MathUtils.lerp(currentPositions[i*3+1], targetPos[1], lerpFactor);
        currentPositions[i*3+2] = THREE.MathUtils.lerp(currentPositions[i*3+2], targetPos[2], lerpFactor);
        currentRotations[i*3] = THREE.MathUtils.lerp(currentRotations[i*3], targetRot[0], lerpFactor);
        currentRotations[i*3+1] = THREE.MathUtils.lerp(currentRotations[i*3+1], targetRot[1], lerpFactor);
        currentRotations[i*3+2] = THREE.MathUtils.lerp(currentRotations[i*3+2], targetRot[2], lerpFactor);
        dummy.position.set(currentPositions[i*3], currentPositions[i*3+1], currentPositions[i*3+2]);
        dummy.rotation.set(currentRotations[i*3], currentRotations[i*3+1], currentRotations[i*3+2]);
        dummy.scale.setScalar(d.scale);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, ornamentCount]} castShadow receiveShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial roughness={0.15} metalness={0.9} envMapIntensity={2.5} />
      </instancedMesh>
      {kittyData.map((d) => <HelloKittyDoll key={`kitty-${d.id}`} {...d} appState={appState} />)}
    </group>
  );
};

// 7. SCENE
const Scene = ({ appState }) => {
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: false, toneMapping: 3 }} shadows>
      <PerspectiveCamera makeDefault position={[0, 0, 22]} fov={50} />
      <OrbitControls 
        enablePan={false} 
        minDistance={10} 
        maxDistance={40} 
        autoRotate={appState === AppState.TREE_SHAPE} 
        autoRotateSpeed={0.5} 
        enableRotate={true} 
        enableDamping={true} 
        dampingFactor={0.05} 
      />

      <ambientLight intensity={0.3} color="#220011" />
      <spotLight position={[15, 20, 10]} angle={0.4} penumbra={1} intensity={200} color="#ffe6f2" castShadow shadow-bias={-0.0001} />
      <spotLight position={[-15, 5, -10]} angle={0.4} penumbra={1} intensity={100} color="#ff69b4" />
      <pointLight position={[0, -5, 5]} intensity={20} color="#ffb6c1" distance={15} />

      <Environment preset="city" background={false} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Snow />

      <group position={[0, -2, 0]}>
        <Ornaments appState={appState} />
        <StarTopper appState={appState} />
        <GiftBoxes appState={appState} />
        <Foliage appState={appState} />
      </group>

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.9} height={300} intensity={1.2} />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};

// 8. APP
function App() {
  const [appState, setAppState] = useState(AppState.SCATTERED);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    const removeListeners = () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
    const attemptPlay = () => {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => removeListeners()).catch((err) => console.log("Autoplay blocked"));
      }
    };
    const handleInteraction = () => {
      if (audio.paused) audio.play().catch(console.error);
      removeListeners();
    };
    attemptPlay();
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    return () => removeListeners();
  }, []);

  const toggleState = () => setAppState(prev => prev === AppState.SCATTERED ? AppState.TREE_SHAPE : AppState.SCATTERED);
  
  const toggleAudio = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (!audioRef.current.paused) audioRef.current.pause();
    else audioRef.current.play().catch(e => console.error(e));
  };

  return (
    <div className="relative w-full h-screen bg-[#1a050f] text-white overflow-hidden selection:bg-arix-pinkDeep selection:text-white">
      <audio ref={audioRef} loop onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}>
        <source src="https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c5/We_wish_you_a_merry_Christmas_-_US_Marine_Band.ogg/We_wish_you_a_merry_Christmas_-_US_Marine_Band.ogg.mp3" type="audio/mpeg" />
      </audio>

      <div className="absolute inset-0 z-0">
        <Scene appState={appState} />
      </div>

      <main className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8 md:p-12">
        <header className="flex w-full items-start justify-between pointer-events-auto">
          <div className="flex flex-col space-y-2">
            <h1 className="font-vintage text-5xl md:text-8xl text-arix-pinkDeep drop-shadow-[0_2px_15px_rgba(255,20,147,0.6)]">Merry Christmas</h1>
          </div>
          <button onClick={toggleAudio} className="group flex items-center justify-center w-12 h-12 rounded-full border border-arix-pinkDeep/50 bg-black/20 backdrop-blur-sm hover:bg-arix-pinkDeep/20 transition-all duration-300 active:scale-95 cursor-pointer">
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-arix-pinkDeep"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-arix-pinkDeep/70"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L15.75 12m0 0l-1.5 1.5M15.75 12l1.5 1.5M15.75 12l-1.5-1.5m-11.5 0h1.75l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25z" /></svg>
            )}
          </button>
        </header>

        <footer className="w-full flex flex-col md:flex-row items-center justify-between gap-6 pointer-events-auto">
          <div className="flex flex-col max-w-md text-center md:text-left"></div>
          <button onClick={toggleState} className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-sm transition-all duration-500 ease-out hover:scale-105 active:scale-95 cursor-pointer">
            <div className="absolute inset-0 border border-arix-pinkDeep/30 group-hover:border-arix-pinkDeep transition-colors duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-arix-pinkDeep to-arix-pinkLight opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="relative z-10 font-sans font-bold tracking-[0.15em] text-sm text-white group-hover:text-black transition-colors duration-300">
              {appState === AppState.SCATTERED ? 'ASSEMBLE TREE' : 'SCATTER MAGIC'}
            </span>
          </button>
        </footer>
      </main>
      <div className="absolute inset-0 z-[5] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,#1a050f_100%)] opacity-60"></div>
    </div>
  );
}

// 9. RENDER
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);