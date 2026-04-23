"use client";

import { useEffect, useRef } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useCubeStore } from "./store";

// Suppress noisy Three r183 deprecation warning emitted by @react-three/fiber's
// internal `new THREE.Clock()`. Remove once R3F migrates to THREE.Timer.
if (typeof window !== "undefined") {
  const w = window as unknown as { __r3fClockWarnPatched?: boolean };
  if (!w.__r3fClockWarnPatched) {
    w.__r3fClockWarnPatched = true;
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("THREE.Clock: This module has been deprecated")) return;
      origWarn(...args);
    };
  }
}

function CubeMesh({
  x, y, z, color,
}: { x: number; y: number; z: number; color: string }) {
  const xray = useCubeStore((s) => s.xray);
  const tool = useCubeStore((s) => s.tool);
  const mode = useCubeStore((s) => s.mode);
  const addCube = useCubeStore((s) => s.addCube);
  const removeCube = useCubeStore((s) => s.removeCube);
  const paintCube = useCubeStore((s) => s.paintCube);

  function onClick(e: ThreeEvent<MouseEvent>) {
    if (mode !== "build" || tool === "rotateView") return;
    e.stopPropagation();
    if (tool === "erase") { removeCube(x, y, z); return; }
    if (tool === "paint") { paintCube(x, y, z); return; }
    if (tool === "place" && e.face) {
      const n = e.face.normal.clone();
      // face.normal is in object space; cube has identity rotation so it's world-aligned
      const nx = Math.round(n.x);
      const ny = Math.round(n.y);
      const nz = Math.round(n.z);
      addCube(x + nx, y + ny, z + nz);
    }
  }

  return (
    <group position={[x + 0.5, y + 0.5, z + 0.5]}>
      <mesh onClick={onClick}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={color}
          transparent={xray}
          opacity={xray ? 0.45 : 1}
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color="#111827" transparent opacity={xray ? 0.6 : 0.85} />
      </lineSegments>
    </group>
  );
}

function Ground() {
  const tool = useCubeStore((s) => s.tool);
  const mode = useCubeStore((s) => s.mode);
  const addCube = useCubeStore((s) => s.addCube);

  function onClick(e: ThreeEvent<MouseEvent>) {
    if (mode !== "build" || tool !== "place") return;
    e.stopPropagation();
    const p = e.point;
    const x = Math.floor(p.x);
    const z = Math.floor(p.z);
    addCube(x, 0, z);
  }

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={onClick}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Container() {
  const show = useCubeStore((s) => s.showContainer);
  const { w, h, d } = useCubeStore((s) => s.containerSize);
  if (!show) return null;
  return (
    <lineSegments position={[0, h / 2, 0]}>
      <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
      <lineBasicMaterial color="#146ef5" transparent opacity={0.5} />
    </lineSegments>
  );
}

function CameraRotator() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const nonce = useCubeStore((s) => s.rotateNonce);
  const dir = useCubeStore((s) => s.rotateDir);
  const lastNonce = useRef(0);

  useEffect(() => {
    if (nonce === lastNonce.current) return;
    lastNonce.current = nonce;
    const target = controlsRef.current?.target ?? new THREE.Vector3();
    const offset = new THREE.Vector3().subVectors(camera.position, target);
    const r = Math.hypot(offset.x, offset.z);
    const theta = Math.atan2(offset.z, offset.x) + dir * (Math.PI / 8);
    offset.x = r * Math.cos(theta);
    offset.z = r * Math.sin(theta);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
  }, [nonce, dir, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.1}
      target={[0, 0, 0]}
    />
  );
}

export function VolumeScene() {
  const cubes = useCubeStore((s) => s.cubes);

  return (
    <Canvas
      camera={{ position: [14, 14, 14], fov: 45, near: 0.1, far: 200 }}
      gl={{ antialias: true }}
      style={{ background: "#ffffff" }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[8, 12, 6]} intensity={0.8} />
      <Grid
        args={[20, 20]}
        cellColor="#e5ecf5"
        sectionColor="#c7d2e0"
        sectionSize={1}
        fadeDistance={50}
        infiniteGrid={false}
      />
      <Ground />
      <Container />
      {Object.values(cubes).map((c) => (
        <CubeMesh key={`${c.x},${c.y},${c.z}`} {...c} />
      ))}
      <CameraRotator />
    </Canvas>
  );
}
