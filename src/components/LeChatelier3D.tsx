"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Sphere,
  OrbitControls,
  Environment,
  Instance,
  Instances,
} from "@react-three/drei";
import * as THREE from "three";

interface MoleculeConfig {
  count: number;
  color: string;
  radius: number;
  speed: number;
  pairs?: boolean;
  tetrahedral?: boolean;
}

interface ParticleProps {
  temperature: number; // For speed scaling
  volume: number; // For container size scaling (pressure inverse)
  n2Count: number;
  h2Count: number;
  nh3Count: number;
}

// Reusable molecular instances for performance
const PAIR_DISTANCE = 0.4;
const N2_COLOR = "#3b82f6"; // Blue
const H2_COLOR = "#f8fafc"; // White
const NH3_COLOR = "#8b5cf6"; // Purple (Nitrogen center)
const NH3_H_COLOR = "#f8fafc"; // Hydrogen nodes

// Helper: merge two sphere geometries into one BufferGeometry
function mergeTwoSpheres(radius: number, offset: number): THREE.BufferGeometry {
  const s1 = new THREE.SphereGeometry(radius, 16, 16);
  s1.translate(-offset, 0, 0);
  const s2 = new THREE.SphereGeometry(radius, 16, 16);
  s2.translate(offset, 0, 0);

  const pos1 = s1.attributes.position.array;
  const pos2 = s2.attributes.position.array;
  const norm1 = s1.attributes.normal.array;
  const norm2 = s2.attributes.normal.array;
  const uv1 = s1.attributes.uv.array;
  const uv2 = s2.attributes.uv.array;
  const idx1 = s1.index!.array;
  const idx2 = s2.index!.array;

  const pos = new Float32Array(pos1.length + pos2.length);
  pos.set(pos1);
  pos.set(pos2, pos1.length);

  const norm = new Float32Array(norm1.length + norm2.length);
  norm.set(norm1);
  norm.set(norm2, norm1.length);

  const uv = new Float32Array(uv1.length + uv2.length);
  uv.set(uv1);
  uv.set(uv2, uv1.length);

  const idx = new Uint16Array(idx1.length + idx2.length);
  idx.set(idx1);
  for (let i = 0; i < idx2.length; i++) {
    idx[idx1.length + i] = idx2[i] + s1.attributes.position.count;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(norm, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(new THREE.BufferAttribute(idx, 1));

  // Note: Don't dispose source geometries here - let the caller handle it
  s1.dispose();
  s2.dispose();

  return geometry;
}

// Helper: build NH₃ trigonal pyramidal geometry with vertex colors
function buildNH3Geometry(): THREE.BufferGeometry {
  const center = new THREE.SphereGeometry(0.25, 16, 16);
  const h1 = new THREE.SphereGeometry(0.12, 16, 16);
  h1.translate(0, -0.15, 0.2);
  const h2 = new THREE.SphereGeometry(0.12, 16, 16);
  h2.translate(-0.17, -0.15, -0.1);
  const h3 = new THREE.SphereGeometry(0.12, 16, 16);
  h3.translate(0.17, -0.15, -0.1);

  const geos = [center, h1, h2, h3];
  const colors = [
    new THREE.Color("#3b82f6"),
    new THREE.Color("#f8fafc"),
    new THREE.Color("#f8fafc"),
    new THREE.Color("#f8fafc"),
  ];

  const posArray: number[] = [],
    normArray: number[] = [],
    colorArray: number[] = [],
    idxArray: number[] = [];
  let offset = 0;

  for (let j = 0; j < geos.length; j++) {
    const geo = geos[j];
    const p = geo.attributes.position.array;
    const n = geo.attributes.normal.array;
    const idx = geo.index!.array;
    const col = colors[j];

    for (let i = 0; i < p.length; i++) posArray.push(p[i]);
    for (let i = 0; i < n.length; i++) normArray.push(n[i]);
    for (let i = 0; i < p.length / 3; i++) {
      colorArray.push(col.r, col.g, col.b);
    }
    for (let i = 0; i < idx.length; i++) {
      idxArray.push(idx[i] + offset);
    }
    offset += p.length / 3;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(posArray), 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(new Float32Array(normArray), 3),
  );
  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(colorArray), 3),
  );
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(idxArray), 1));

  // Dispose source geometries
  geos.forEach((g) => g.dispose());

  return geometry;
}

const MoleculeInstances = ({
  count,
  type,
  volume,
  temp,
}: {
  count: number;
  type: "n2" | "h2" | "nh3";
  volume: number;
  temp: number;
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const boxSize = 10 * volume; // 10 is default box
  const halfBox = boxSize / 2;

  // Pre-allocate clamp bounds to avoid per-frame Vector3 allocations
  const clampMin = useMemo(
    () => new THREE.Vector3(-halfBox, -halfBox, -halfBox),
    [halfBox],
  );
  const clampMax = useMemo(
    () => new THREE.Vector3(halfBox, halfBox, halfBox),
    [halfBox],
  );

  // Store positions and velocities
  const particles = useMemo(() => {
    return Array.from({ length: Math.max(0, count) }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * boxSize,
        (Math.random() - 0.5) * boxSize,
        (Math.random() - 0.5) * boxSize,
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ).normalize(),
      rotationAxes: new THREE.Vector3(
        Math.random(),
        Math.random(),
        Math.random(),
      ).normalize(),
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      angle: Math.random() * Math.PI * 2,
    }));
  }, [count, boxSize]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Speed scaling: base + temp dependency
    const speed =
      (0.5 + (temp / 100) * 1.5) *
      (type === "h2" ? 1.5 : type === "nh3" ? 0.7 : 1.0);

    particles.forEach((p, i) => {
      // Move
      p.position.addScaledVector(p.velocity, speed * delta * 5);

      // Bounce
      if (p.position.x > halfBox || p.position.x < -halfBox) p.velocity.x *= -1;
      if (p.position.y > halfBox || p.position.y < -halfBox) p.velocity.y *= -1;
      if (p.position.z > halfBox || p.position.z < -halfBox) p.velocity.z *= -1;

      p.position.clamp(clampMin, clampMax);

      // Rotate
      p.angle += p.rotationSpeed;

      dummy.position.copy(p.position);
      dummy.setRotationFromAxisAngle(p.rotationAxes, p.angle);
      dummy.updateMatrix();

      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Memoize geometry creation — prevents re-building buffers on every render
  const geometry = useMemo(() => {
    if (type === "n2") return mergeTwoSpheres(0.2, 0.15);
    if (type === "h2") return mergeTwoSpheres(0.12, 0.1);
    return buildNH3Geometry();
  }, [type]);

  // Cleanup geometry on unmount or type change
  useEffect(() => {
    return () => {
      if (geometry) geometry.dispose();
    };
  }, [geometry]);

  const useVertexColors = type === "nh3";

  const materialConfig = {
    n2: { color: "#1e3a8a", roughness: 0.2, metalness: 0.8 },
    h2: { color: "#e2e8f0", roughness: 0.5, metalness: 0.2 },
    nh3: { vertexColors: true as const, roughness: 0.3, metalness: 0.5 },
  };

  if (count <= 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[geometry as any, undefined, count]}>
      <meshStandardMaterial {...materialConfig[type]} />
    </instancedMesh>
  );
};

export default function LeChatelier3D({
  temperature,
  volume,
  n2Count,
  h2Count,
  nh3Count,
}: ParticleProps) {
  // volume is inverse to pressure (higher pressure = smaller volume multiplier)
  const normalizedVol = Math.max(0.5, Math.min(2.0, volume));
  const boxSize = 10 * normalizedVol;
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const remountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [remountKey, setRemountKey] = useState(0);

  // Delay Canvas mount to prevent WebGL context loss during initial page load
  useEffect(() => {
    // Use requestAnimationFrame to ensure we mount after the initial paint
    const rafId = requestAnimationFrame(() => {
      // Additional small delay to ensure browser is ready
      const timeoutId = setTimeout(() => {
        setIsReady(true);
      }, 100);

      return () => clearTimeout(timeoutId);
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  // Force re-mount if WebGL context is lost (with debounce to prevent rapid remounts)
  const handleContextLost = useCallback((event: WebGLContextEvent) => {
    event.preventDefault();
    console.warn("WebGL context lost, scheduling remount...");

    // Clear any existing timeout
    if (remountTimeoutRef.current) {
      clearTimeout(remountTimeoutRef.current);
    }

    // Wait 500ms before remounting to give browser time to recover
    remountTimeoutRef.current = setTimeout(() => {
      console.log("Remounting Canvas component...");
      setRemountKey((prev) => prev + 1);
    }, 500);
  }, []);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      // Clear any pending remount timeout
      if (remountTimeoutRef.current) {
        clearTimeout(remountTimeoutRef.current);
      }

      if (containerRef.current) {
        const canvas = containerRef.current.querySelector("canvas");
        if (canvas) {
          canvas.removeEventListener(
            "webglcontextlost",
            handleContextLost as EventListener,
          );
        }
      }
    };
  }, [handleContextLost]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[400px] rounded-xl overflow-hidden bg-brand-darker border border-brand-purple/20 relative shadow-inner"
    >
      {/* Energy Profile Overlay */}
      <div className="absolute top-4 right-4 z-10 bg-brand-dark/80 backdrop-blur-md p-3 rounded-lg border border-white/10 pointer-events-none">
        <h4 className="text-[10px] uppercase text-slate-400 font-bold mb-2">
          Energijos profilis
        </h4>
        <svg width="120" height="60" className="opacity-80">
          <path
            d="M 10 40 Q 40 40, 60 10 T 110 50"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
          />
          <circle cx="10" cy="40" r="3" fill="#3b82f6" />
          <circle cx="110" cy="50" r="3" fill="#8b5cf6" />
          <text x="60" y="25" fill="#f59e0b" fontSize="8" textAnchor="middle">
            Ea
          </text>
          <text x="110" y="45" fill="#8b5cf6" fontSize="8" textAnchor="end">
            ΔH &lt; 0
          </text>
        </svg>
      </div>

      {/* Canvas */}
      {isReady ? (
        <Canvas
          key={remountKey}
          camera={{ position: [0, 0, 15], fov: 60 }}
          style={{ width: "100%", height: "100%" }}
          gl={{
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
          }}
          color="#0c0e14"
          frameloop="always"
          dpr={[1, 2]}
          onCreated={(state) => {
            // Ensure the renderer is always active
            state.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            // Listen for context lost events
            const canvas = state.gl.domElement;
            const handleContextRestored = () => {
              console.log("WebGL context restored");
            };

            canvas.addEventListener(
              "webglcontextlost",
              handleContextLost as EventListener,
            );
            canvas.addEventListener(
              "webglcontextrestored",
              handleContextRestored,
            );

            // Store references for cleanup
            (state.gl as any)._contextLostHandler = handleContextLost;
            (state.gl as any)._contextRestoredHandler = handleContextRestored;
          }}
          onPointerMissed={() => {}}
        >
          <color attach="background" args={["#0c0e14"]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />

          {/* Containment Box (Wireframe) */}
          <mesh>
            <boxGeometry args={[boxSize, boxSize, boxSize]} />
            <meshBasicMaterial
              color="#a855f7"
              wireframe
              transparent
              opacity={0.1}
            />
          </mesh>

          {/* Particles */}
          <MoleculeInstances
            type="n2"
            count={n2Count}
            volume={normalizedVol}
            temp={temperature}
          />
          <MoleculeInstances
            type="h2"
            count={h2Count}
            volume={normalizedVol}
            temp={temperature}
          />
          <MoleculeInstances
            type="nh3"
            count={nh3Count}
            volume={normalizedVol}
            temp={temperature}
          />

          <OrbitControls
            enableZoom={true}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
          <Environment preset="city" />
        </Canvas>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-brand-darker">
          <span className="animate-pulse text-slate-500">
            Kraunama 3D vizualizacija...
          </span>
        </div>
      )}

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-4 text-xs font-medium bg-brand-dark/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg items-center">
        <div className="flex items-center gap-2">
          <svg
            width="24"
            height="12"
            viewBox="0 0 24 12"
            className="drop-shadow-md"
          >
            <circle cx="8" cy="6" r="5" fill="#3b82f6" />
            <circle cx="16" cy="6" r="5" fill="#2563eb" />
          </svg>
          <span className="text-blue-300">N₂ ({n2Count})</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="8"
            viewBox="0 0 16 8"
            className="drop-shadow-sm"
          >
            <circle cx="5.5" cy="4" r="3" fill="#e2e8f0" />
            <circle cx="10.5" cy="4" r="3" fill="#cbd5e1" />
          </svg>
          <span className="text-slate-300">H₂ ({h2Count})</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            width="24"
            height="20"
            viewBox="0 0 24 20"
            className="drop-shadow-md"
          >
            <circle
              cx="6.5"
              cy="14"
              r="3"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="0.5"
            />
            <circle
              cx="17.5"
              cy="14"
              r="3"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="0.5"
            />
            <circle
              cx="12"
              cy="16"
              r="3"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="0.5"
            />
            <circle cx="12" cy="8" r="6" fill="#3b82f6" />
          </svg>
          <span className="text-blue-300">NH₃ ({nh3Count})</span>
        </div>
      </div>
    </div>
  );
}
