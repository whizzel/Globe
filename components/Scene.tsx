"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import NeonGlobe from "./NeonGlobe";
import { useState, useEffect } from "react";
import * as THREE from "three";

function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
}

// Cinematic Auto-focus hook
function CameraAnimator({ focusCoord }: { focusCoord?: {lat: number, lon: number} | null }) {
  const { camera } = useThree();
  const [target, setTarget] = useState<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (focusCoord) {
      // Calculate destination vector at radius 7 to maintain standard camera distance
      setTarget(latLongToVector3(focusCoord.lat, focusCoord.lon, 7));
    }
  }, [focusCoord]);

  useFrame((state, delta) => {
    if (target) {
      // Smoothly swing camera position to look right at the new city
      camera.position.lerp(target, delta * 2.5);
      
      // Stop tracking once destination is reached so user can spin manually again
      if (camera.position.distanceTo(target) < 0.1) {
        setTarget(null);
      }
    }
  });

  return null;
}

export default function Scene({ 
  customNodes = [], 
  focusCoord = null 
}: { 
  customNodes?: {name: string, lat: number, lon: number, timestamp?: number}[], 
  focusCoord?: {lat: number, lon: number} | null 
}) {
  return (
    <div className="w-full h-full absolute inset-0 bg-transparent pointer-events-auto">
      <Canvas camera={{ position: [0, 0, -7], fov: 45 }}>
        <color attach="background" args={["#020202"]} />
        
        {/* Illumination */}
        <ambientLight intensity={0.1} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        
        {/* Deep Space Atmosphere */}
        <Stars radius={100} depth={50} count={3000} factor={4} fade speed={1} />
        <Sparkles count={150} scale={10} size={2} speed={0.4} opacity={0.3} color="#00e5ff" />

        <CameraAnimator focusCoord={focusCoord} />

        {/* The Digital Brain Globe */}
        <NeonGlobe 
          radius={3} 
          color="#00e5ff" 
          connectionDistance={1.3} 
          customNodes={customNodes}
        />
        
        {/* Postprocessing for Neon glow (Bloom) */}
        <EffectComposer>
          <Bloom 
            luminanceThreshold={0.05} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.8}
            levels={8}
          />
        </EffectComposer>
        
        {/* View Controls */}
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          autoRotate={false}
          makeDefault // Ensures the CameraAnimator can hand control back
        />
      </Canvas>
    </div>
  );
}
