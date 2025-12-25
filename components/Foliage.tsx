import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, TREE_CONFIG } from '../types.ts';

// Custom Shader Material for the Foliage
// Handles the morphing logic on the GPU for high performance with thousands of particles
const foliageVertexShader = `
  uniform float uTime;
  uniform float uMorphFactor;
  uniform float uPixelRatio;

  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  attribute float aRandom;

  varying float vAlpha;
  varying vec3 vColor;

  // Classic Perlin noise 
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
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    // Cubic bezier easing for smoother morph
    float t = uMorphFactor;
    float ease = t * t * (3.0 - 2.0 * t);
    
    vec3 pos = mix(aScatterPos, aTreePos, ease);

    // Add breathing/wind effect based on noise
    float noiseFreq = 0.5;
    float noiseAmp = 0.15 * (0.5 + 0.5 * ease); // Less movement when scattered
    vec3 noiseOffset = vec3(
      snoise(vec3(pos.x * noiseFreq, pos.y * noiseFreq, uTime * 0.5)),
      snoise(vec3(pos.x * noiseFreq, pos.y * noiseFreq, uTime * 0.5 + 10.0)),
      snoise(vec3(pos.x * noiseFreq, pos.y * noiseFreq, uTime * 0.5 + 20.0))
    );
    pos += noiseOffset * noiseAmp;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    gl_PointSize = (40.0 * uPixelRatio * (0.5 + 0.5 * aRandom)) / -mvPosition.z;
    
    // Pass color to fragment
    // Mix between Deep Pink and Light Pink/White based on position
    float heightMix = (pos.y + 6.0) / 12.0;
    
    // Bottom: Deep Hot Pink (#FF1493), Top: Pastel Pink/White (#FFE4E1)
    vec3 colorBottom = vec3(1.0, 0.08, 0.58); // Deep Pink
    vec3 colorTop = vec3(1.0, 0.9, 0.95);     // Misty Rose/White
    
    vColor = mix(colorBottom, colorTop, heightMix);
    
    // Add glimmer based on time and random
    float glimmer = sin(uTime * 3.0 + aRandom * 10.0);
    if (glimmer > 0.9) {
      vColor = vec3(1.0, 1.0, 1.0); // White sparkle
    } else if (glimmer < -0.9) {
      vColor = vec3(1.0, 0.84, 0.0); // Gold sparkle occassionally
    }

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const foliageFragmentShader = `
  varying vec3 vColor;
  
  void main() {
    // Circular particle
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Soft edge
    float alpha = smoothstep(0.5, 0.3, dist);
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

interface FoliageProps {
  appState: AppState;
}

const Foliage: React.FC<FoliageProps> = ({ appState }) => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate Geometry Data once
  const { positions, scatterPos, treePos, randoms } = useMemo(() => {
    const count = TREE_CONFIG.foliageCount;
    const positions = new Float32Array(count * 3);
    const scatterPos = new Float32Array(count * 3);
    const treePos = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random (Scatter) Position - Sphere distribution
      const r = TREE_CONFIG.scatterRadius * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const sx = r * Math.sin(phi) * Math.cos(theta);
      const sy = r * Math.sin(phi) * Math.sin(theta);
      const sz = r * Math.cos(phi);

      scatterPos[i * 3] = sx;
      scatterPos[i * 3 + 1] = sy;
      scatterPos[i * 3 + 2] = sz;

      // Tree Position - Cone distribution
      // y goes from -height/2 to height/2
      const h = TREE_CONFIG.height;
      const yNorm = Math.random(); // 0 to 1
      const y = (yNorm - 0.5) * h;
      
      // Radius decreases as we go up
      // Bottom radius = baseRadius, Top radius = 0
      const coneR = TREE_CONFIG.radius * (1 - yNorm);
      // Add some volume thickness (particles are not just on surface)
      const rTree = coneR * Math.sqrt(Math.random()); 
      const thetaTree = Math.random() * 2 * Math.PI;

      const tx = rTree * Math.cos(thetaTree);
      const tz = rTree * Math.sin(thetaTree);

      treePos[i * 3] = tx;
      treePos[i * 3 + 1] = y;
      treePos[i * 3 + 2] = tz;

      // Initial positions (start scattered)
      positions[i * 3] = sx;
      positions[i * 3 + 1] = sy;
      positions[i * 3 + 2] = sz;

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
      if (materialRef.current.uniforms.uTime) {
        materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      }
      if (materialRef.current.uniforms.uPixelRatio) {
        materialRef.current.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
      }

      // Lerp morph factor
      if (materialRef.current.uniforms.uMorphFactor) {
        const targetMorph = appState === AppState.TREE_SHAPE ? 1.0 : 0.0;
        materialRef.current.uniforms.uMorphFactor.value = THREE.MathUtils.lerp(
          materialRef.current.uniforms.uMorphFactor.value,
          targetMorph,
          0.03 // Animation speed
        );
      }
    }
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
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={scatterPos.length / 3}
          array={scatterPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={treePos.length / 3}
          array={treePos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={foliageVertexShader}
        fragmentShader={foliageFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Foliage;