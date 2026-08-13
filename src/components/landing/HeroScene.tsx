"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CUBE_COUNT = 60;
const BRAND_SECONDARY = "#4F46E5"; // indigo
const BRAND_TERTIARY = "#10B981"; // emerald

interface CubeFieldProps {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
}

/**
 * The floating "inventory cubes" field — stands in for stock units moving
 * through a warehouse. Each cube drifts on its own slow, offset orbit and
 * the whole group gently parallaxes toward the pointer position.
 */
function CubeField({ pointer }: CubeFieldProps) {
  const groupRef = useRef<THREE.Group>(null);

  const cubes = useMemo(() => {
    return Array.from({ length: CUBE_COUNT }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8 - 2,
      ] as [number, number, number],
      scale: 0.15 + Math.random() * 0.35,
      speed: 0.15 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
      color: i % 4 === 0 ? BRAND_TERTIARY : BRAND_SECONDARY,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Gentle parallax toward the pointer, eased rather than snapping.
    groupRef.current.rotation.y += (pointer.current.x * 0.4 - groupRef.current.rotation.y) * 0.02;
    groupRef.current.rotation.x += (pointer.current.y * 0.2 - groupRef.current.rotation.x) * 0.02;

    groupRef.current.children.forEach((child, i) => {
      const cube = cubes[i];
      child.position.y = cube.position[1] + Math.sin(t * cube.speed + cube.offset) * 0.4;
      child.rotation.x = t * cube.speed * 0.5;
      child.rotation.y = t * cube.speed * 0.3;
    });
  });

  return (
    <group ref={groupRef}>
      {cubes.map((cube, i) => (
        <mesh key={i} position={cube.position} scale={cube.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={cube.color} roughness={0.3} metalness={0.1} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  const pointer = useRef({ x: 0, y: 0 });

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    pointer.current = {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: (e.clientY / window.innerHeight) * 2 - 1,
    };
  }

  return (
    <div className="absolute inset-0" onPointerMove={handlePointerMove}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={60} color={BRAND_SECONDARY} />
        <pointLight position={[-5, -3, 3]} intensity={40} color={BRAND_TERTIARY} />
        <CubeField pointer={pointer} />
      </Canvas>
    </div>
  );
}

export default Scene;
