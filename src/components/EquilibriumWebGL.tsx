"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { IceResult } from "@/lib/thermodynamics";
import { Microscope } from "lucide-react";

interface WebGLProps {
    temperature: number;
    iceResult: IceResult | null;
}

// Reusable instanced meshes
const N2_COLOR = "#3b82f6"; // Blue
const H2_COLOR = "#f8fafc"; // White
const NH3_COLOR = "#8b5cf6"; // Purple

// Scales concentrations to a visibly pleasing particle count
const SCALE_FACTOR = 40;

const DynamicMolecules = ({ count, type, temp }: { count: number; type: "n2" | "h2" | "nh3"; temp: number }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const boxSize = 12;
    const halfBox = boxSize / 2;

    // Stabilized array to prevent full re-renders, just updating active count
    const MAX_PARTICLES = 500;
    const activeCount = Math.min(MAX_PARTICLES, Math.max(0, Math.floor(count)));
    const prevActiveCountRef = useRef(activeCount);

    // Pre-allocate clamp bounds to avoid per-frame Vector3 allocations
    const clampMin = useMemo(() => new THREE.Vector3(-halfBox, -halfBox, -halfBox), []);
    const clampMax = useMemo(() => new THREE.Vector3(halfBox, halfBox, halfBox), []);

    const particles = useMemo(() => {
        return Array.from({ length: MAX_PARTICLES }, () => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * boxSize,
                (Math.random() - 0.5) * boxSize,
                (Math.random() - 0.5) * boxSize
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize(),
            rotationAxes: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            angle: Math.random() * Math.PI * 2
        }));
    }, []); // Only init once, we just render `activeCount` of them

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Speed relates to kinetic energy = temp
        const speed = (0.5 + (temp / 300)) * (type === "h2" ? 1.5 : type === "nh3" ? 0.7 : 1.0);

        for (let i = 0; i < activeCount; i++) {
            const p = particles[i];

            p.position.addScaledVector(p.velocity, speed * delta * 5);

            // Bounce
            if (p.position.x > halfBox || p.position.x < -halfBox) p.velocity.x *= -1;
            if (p.position.y > halfBox || p.position.y < -halfBox) p.velocity.y *= -1;
            if (p.position.z > halfBox || p.position.z < -halfBox) p.velocity.z *= -1;

            p.position.clamp(clampMin, clampMax);

            p.angle += p.rotationSpeed;

            dummy.position.copy(p.position);
            dummy.scale.set(1, 1, 1); // Reset scale for active particles
            dummy.setRotationFromAxisAngle(p.rotationAxes, p.angle);
            dummy.updateMatrix();

            meshRef.current.setMatrixAt(i, dummy.matrix);
        }

        // Hide unused instances — only update when count changes
        if (prevActiveCountRef.current !== activeCount) {
            for (let i = activeCount; i < MAX_PARTICLES; i++) {
                dummy.position.set(0, 0, 0);
                dummy.scale.set(0, 0, 0); // Compress to nothing
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }
            prevActiveCountRef.current = activeCount;
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    // Memoize geometry — prevents re-creation on every render
    const geometry = useMemo(() => {
        if (type === "n2") return new THREE.SphereGeometry(0.3, 16, 16);
        if (type === "h2") return new THREE.SphereGeometry(0.15, 16, 16);
        return new THREE.ConeGeometry(0.35, 0.35, 4); // Tetra for NH3
    }, [type]);

    const materialConfig = {
        n2: { color: N2_COLOR, roughness: 0.2, metalness: 0.8 },
        h2: { color: H2_COLOR, roughness: 0.5, metalness: 0.2 },
        nh3: { color: NH3_COLOR, roughness: 0.3, metalness: 0.5 }
    };

    return (
        <instancedMesh ref={meshRef} args={[geometry as any, undefined, MAX_PARTICLES]}>
            <meshStandardMaterial {...materialConfig[type]} />
        </instancedMesh>
    );
};

export default function EquilibriumWebGL({ temperature, iceResult }: WebGLProps) {
    if (!iceResult) return null;

    const nCount = iceResult.finalA * SCALE_FACTOR;
    const hCount = iceResult.finalB * SCALE_FACTOR;
    const nhCount = iceResult.finalC * SCALE_FACTOR;

    return (
        <div className="glass-card flex flex-col h-full border-brand-purple/20 overflow-hidden relative">
            <div className="absolute top-6 left-6 z-10 flex items-center gap-3 pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                    <Microscope size={20} className="text-brand-purple" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Mikroskopinis lygmuo</h3>
                    <p className="text-xs text-brand-purple font-mono bg-brand-dark/50 px-2 py-0.5 rounded-md mt-1 shadow-lg">T = {(temperature + 273.15).toFixed(0)} K</p>
                </div>
            </div>

            <div className="absolute bottom-6 right-6 z-10 flex gap-2 pointer-events-none">
                <div className="bg-brand-dark/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 text-xs font-mono text-white">
                    <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> N₂: {Math.round(nCount)}
                </div>
                <div className="bg-brand-dark/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 text-xs font-mono text-white">
                    <span className="w-2 h-2 rounded-full bg-[#f8fafc]"></span> H₂: {Math.round(hCount)}
                </div>
                <div className="bg-brand-dark/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 text-xs font-mono text-white">
                    <span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span> NH₃: {Math.round(nhCount)}
                </div>
            </div>

            <div className="w-full min-h-[400px] flex-1">
                <Canvas camera={{ position: [0, 0, 18], fov: 60 }}>
                    <ambientLight intensity={0.6} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} color="#e2e8f0" />
                    <pointLight position={[-10, -10, -10]} intensity={0.8} color="#8b5cf6" />

                    <mesh>
                        <boxGeometry args={[12, 12, 12]} />
                        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.05} />
                    </mesh>

                    <DynamicMolecules type="n2" count={nCount} temp={temperature} />
                    <DynamicMolecules type="h2" count={hCount} temp={temperature} />
                    <DynamicMolecules type="nh3" count={nhCount} temp={temperature} />

                    <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
                    <Environment preset="night" />
                </Canvas>
            </div>
        </div>
    );
}
