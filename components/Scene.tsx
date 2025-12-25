import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import Foliage from './Foliage.tsx';
import Ornaments from './Ornaments.tsx';
import StarTopper from './StarTopper.tsx';
import GiftBoxes from './GiftBoxes.tsx';
import Snow from './Snow.tsx';
import { AppState } from '../types.ts';

interface SceneProps {
  appState: AppState;
}

const Scene: React.FC<SceneProps> = ({ 
  appState, 
}) => {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, toneMapping: 3 }} // NoAA for Bloom perf, customized tonemapping
      shadows
    >
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

      {/* Lighting - Cinematic Pink Mood */}
      <ambientLight intensity={0.3} color="#220011" />
      <spotLight
        position={[15, 20, 10]}
        angle={0.4}
        penumbra={1}
        intensity={200}
        color="#ffe6f2" // Light pink tint
        castShadow
        shadow-bias={-0.0001}
      />
      <spotLight
        position={[-15, 5, -10]}
        angle={0.4}
        penumbra={1}
        intensity={100}
        color="#ff69b4" // Hot pink
      />
      <pointLight position={[0, -5, 5]} intensity={20} color="#ffb6c1" distance={15} />

      {/* Environment for Reflections */}
      <Environment preset="city" background={false} />
      
      {/* Background Ambience: Snow + Stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Snow />

      {/* 3D Content */}
      <group position={[0, -2, 0]}>
        {/* Render Opaque Objects First */}
        <Ornaments appState={appState} />
        <StarTopper appState={appState} />
        <GiftBoxes appState={appState} />
        
        {/* Render Transparent Foliage Last */}
        <Foliage appState={appState} />
      </group>

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.7} 
          luminanceSmoothing={0.9} 
          height={300} 
          intensity={1.2} 
        />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};

export default Scene;