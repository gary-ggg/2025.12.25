import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, TREE_CONFIG, FrameData } from '../types.ts';

// Generate fixed positions for frames spiraling up the tree
const generateFrameData = (count: number): FrameData[] => {
  const data: FrameData[] = [];
  
  for (let i = 0; i < count; i++) {
    // Scatter Pos (Random)
    const r = TREE_CONFIG.scatterRadius * 0.5;
    const theta = Math.random() * 2 * Math.PI;
    const sx = r * Math.cos(theta);
    const sy = -5 + Math.random() * 5; 
    const sz = r * Math.sin(theta);

    // Tree Pos (Spiral)
    const h = TREE_CONFIG.height;
    const yRatio = (i + 0.5) / count; 
    const y = (yRatio - 0.5) * h;
    
    // Calculate radius at this height
    const coneR = TREE_CONFIG.radius * (1 - yRatio);
    // Push slightly out so it sits on foliage
    const rTree = coneR + 1.2; 
    
    // Spiral angle
    const angle = i * (Math.PI * 0.8);

    const tx = rTree * Math.cos(angle);
    const tz = rTree * Math.sin(angle);

    // Look at target (outwards)
    const lookAtPos = new THREE.Vector3(tx * 2, y, tz * 2);
    
    const dummy = new THREE.Object3D();
    dummy.position.set(tx, y, tz);
    dummy.lookAt(lookAtPos);
    
    data.push({
      id: i,
      scatterPos: [sx, sy, sz],
      scatterRot: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      treePos: [tx, y, tz],
      treeRot: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z],
    });
  }
  return data;
};

interface SingleFrameProps {
  data: FrameData;
  appState: AppState;
  isActive: boolean;
  onFrameClick: (id: number) => void;
  onClose: () => void;
  imageUrl?: string;
}

const SingleFrame: React.FC<SingleFrameProps> = ({ 
  data, 
  appState, 
  isActive,
  onFrameClick, 
  onClose,
  imageUrl 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useMemo(() => imageUrl ? new THREE.TextureLoader().load(imageUrl) : null, [imageUrl]);

  if (texture) {
    texture.center.set(0.5, 0.5);
    if ('colorSpace' in texture) {
      (texture as any).colorSpace = THREE.SRGBColorSpace;
    } else {
      (texture as any).encoding = 3001; 
    }
  }

  // Pre-calculate vector for "Camera Facing" position
  // Scene group is at [0, -2, 0], Camera is at [0, 0, 22]
  // We want the frame to be roughly at World [0, 0, 18]
  // Local Pos = World Pos - Group Pos = [0, 2, 18]
  const activePos = useMemo(() => new THREE.Vector3(0, 2, 18), []);
  const activeRot = useMemo(() => new THREE.Euler(0, 0, 0), []);
  const activeScale = 2.5; // Scale up when active

  useFrame(() => {
    if (!groupRef.current) return;

    const isTree = appState === AppState.TREE_SHAPE;
    // Smoother/Slower lerp for cinematic feel
    const lerpFactor = 0.04;

    let targetPos: THREE.Vector3 | number[];
    let targetRot: THREE.Euler | number[];
    let targetScale = 1;

    if (isActive) {
      // Fly to camera
      targetPos = activePos;
      targetRot = activeRot;
      targetScale = activeScale;
    } else {
      // Normal behavior
      targetPos = isTree ? data.treePos : data.scatterPos;
      targetRot = isTree ? data.treeRot : data.scatterRot;
      targetScale = 1;
    }

    // Interpolate Position
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, (targetPos as any)[0] || (targetPos as THREE.Vector3).x, lerpFactor);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, (targetPos as any)[1] || (targetPos as THREE.Vector3).y, lerpFactor);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, (targetPos as any)[2] || (targetPos as THREE.Vector3).z, lerpFactor);

    // Interpolate Rotation
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, (targetRot as any)[0] || (targetRot as THREE.Euler).x, lerpFactor);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, (targetRot as any)[1] || (targetRot as THREE.Euler).y, lerpFactor);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, (targetRot as any)[2] || (targetRot as THREE.Euler).z, lerpFactor);

    // Interpolate Scale
    const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, lerpFactor);
    groupRef.current.scale.setScalar(s);
  });

  const frameWidth = 1.2;
  const frameHeight = 1.5;
  const border = 0.1;

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (isActive) {
      onClose(); // Close if already active
    } else {
      onFrameClick(data.id); // Open/Fly up
    }
  };

  return (
    <group ref={groupRef} onClick={handleClick}>
      {/* Gold Frame Border */}
      <mesh>
        <boxGeometry args={[frameWidth + border, frameHeight + border, 0.1]} />
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
      </mesh>
      
      {/* Backing */}
      <mesh position={[0, 0, -0.06]}>
         <planeGeometry args={[frameWidth + border, frameHeight + border]} />
         <meshStandardMaterial color="#331122" />
      </mesh>
      
      {/* Photo Area */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[frameWidth - 0.1, frameHeight - 0.1]} />
        {texture ? (
           <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
           <meshStandardMaterial 
             color="#2d0a16" 
             emissive="#1a000d"
             roughness={0.2}
             metalness={0.8}
           />
        )}
      </mesh>

      {/* "Add" Hint Text */}
      {!texture && (
        <mesh position={[0, 0, 0.07]}>
           <planeGeometry args={[0.3, 0.3]} />
           <meshBasicMaterial color="#FFD700" transparent opacity={0.6} map={new THREE.TextureLoader().load('https://img.icons8.com/ios-filled/50/FFFFFF/plus-math.png')} />
        </mesh>
      )}
    </group>
  );
};

interface PhotoFramesProps {
  appState: AppState;
  activeFrameId: number | null;
  onFrameClick: (id: number) => void;
  onCloseFrame: () => void;
  images: Record<number, string>;
}

const PhotoFrames: React.FC<PhotoFramesProps> = ({ 
  appState, 
  activeFrameId,
  onFrameClick, 
  onCloseFrame,
  images 
}) => {
  const frameData = useMemo(() => generateFrameData(TREE_CONFIG.frameCount), []);

  return (
    <group>
      {frameData.map((data) => (
        <SingleFrame 
          key={data.id} 
          data={data} 
          appState={appState} 
          isActive={activeFrameId === data.id}
          onFrameClick={onFrameClick}
          onClose={onCloseFrame}
          imageUrl={images[data.id]}
        />
      ))}
    </group>
  );
};

export default PhotoFrames;