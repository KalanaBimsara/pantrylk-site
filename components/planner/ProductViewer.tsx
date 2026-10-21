"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { StudioScene, studioFraming } from "./three/Studio";

/** Interactive 3D view of one standard unit. Renders only while it is being turned or changed. */
export default function ProductViewer({ plannerId, width, front, open }: { plannerId: string; width: number; front: string; open: boolean }) {
  const f = studioFraming(plannerId, width);
  const key = `${plannerId}-${width}`;
  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      className="touch-none"
    >
      <PerspectiveCamera key={`c${key}`} makeDefault fov={f.fov} near={0.05} far={50} position={f.position.toArray()} />
      <OrbitControls
        key={`o${key}`}
        makeDefault
        target={f.target}
        enableDamping
        enablePan={false}
        minDistance={f.radius * 1.4}
        maxDistance={f.radius * 6}
        maxPolarAngle={Math.PI * 0.49}
      />
      <StudioScene productId={plannerId} width={width} front={front} open={open} background="#ece7de" />
    </Canvas>
  );
}
