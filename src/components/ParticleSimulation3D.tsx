"use client";

import { useRef, useMemo, useCallback, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

// ─── Constants ───
const BOX_SIZE = 6;
const HALF = BOX_SIZE / 2;
const PARTICLE_RADIUS_A = 0.15;
const PARTICLE_RADIUS_B = 0.2;

// ─── Types ───
interface ParticleData {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    type: "A" | "B";
    radius: number;
}

interface ParticleSimulation3DProps {
    temperature: number;        // 0-100
    concentrationA: number;     // 5-50
    concentrationB: number;     // 5-50
    activationEnergy: number;   // 0-100 kJ/mol
}

// ─── Collision flash effect ───
function CollisionFlash({ position, onComplete }: { position: THREE.Vector3; onComplete: () => void }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshBasicMaterial>(null);
    const startTime = useRef(Date.now());

    useFrame(() => {
        const elapsed = (Date.now() - startTime.current) / 1000;
        if (meshRef.current && materialRef.current) {
            const scale = 1 + elapsed * 4;
            meshRef.current.scale.setScalar(scale);
            materialRef.current.opacity = Math.max(0, 1 - elapsed * 3);
            if (elapsed > 0.4) onComplete();
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial
                ref={materialRef}
                color="#fbbf24"
                transparent
                opacity={1}
                depthWrite={false}
            />
        </mesh>
    );
}

// ─── Bounding box wireframe ───
function BoundingBox() {
    return (
        <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE)]} />
            <lineBasicMaterial color="#334155" linewidth={1} />
        </lineSegments>
    );
}

// ─── Single Particle mesh ───
function ParticleMesh({ type }: { type: "A" | "B" }) {
    if (type === "A") {
        return (
            <>
                <sphereGeometry args={[PARTICLE_RADIUS_A, 16, 16]} />
                <meshStandardMaterial
                    color="#06b6d4"
                    emissive="#06b6d4"
                    emissiveIntensity={0.3}
                    roughness={0.3}
                    metalness={0.6}
                />
            </>
        );
    }
    return (
        <>
            <octahedronGeometry args={[PARTICLE_RADIUS_B]} />
            <meshStandardMaterial
                color="#a855f7"
                emissive="#a855f7"
                emissiveIntensity={0.3}
                roughness={0.3}
                metalness={0.6}
            />
        </>
    );
}

// ─── Simulation Scene ───
function SimulationScene({
    temperature,
    concentrationA,
    concentrationB,
    activationEnergy,
    onCollisionCount,
}: ParticleSimulation3DProps & { onCollisionCount: (count: number) => void }) {
    const particlesRef = useRef<ParticleData[]>([]);
    const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
    const [flashes, setFlashes] = useState<{ id: number; pos: THREE.Vector3 }[]>([]);
    const flashIdRef = useRef(0);
    const collisionCountRef = useRef(0);
    const lastConfigRef = useRef("");

    const speedMultiplier = useMemo(() => 0.3 + (temperature / 100) * 1.5, [temperature]);
    const eaThreshold = useMemo(() => 0.5 + (activationEnergy / 100) * 2.5, [activationEnergy]);

    // Reinitialize particles when counts change
    const configKey = `${concentrationA}-${concentrationB}`;
    if (configKey !== lastConfigRef.current) {
        lastConfigRef.current = configKey;
        collisionCountRef.current = 0;
        const newParticles: ParticleData[] = [];

        for (let i = 0; i < concentrationA; i++) {
            newParticles.push({
                pos: new THREE.Vector3(
                    (Math.random() - 0.5) * (BOX_SIZE - 0.5),
                    (Math.random() - 0.5) * (BOX_SIZE - 0.5),
                    (Math.random() - 0.5) * (BOX_SIZE - 0.5)
                ),
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 2 * speedMultiplier,
                    (Math.random() - 0.5) * 2 * speedMultiplier,
                    (Math.random() - 0.5) * 2 * speedMultiplier
                ),
                type: "A",
                radius: PARTICLE_RADIUS_A,
            });
        }

        for (let i = 0; i < concentrationB; i++) {
            newParticles.push({
                pos: new THREE.Vector3(
                    (Math.random() - 0.5) * (BOX_SIZE - 0.5),
                    (Math.random() - 0.5) * (BOX_SIZE - 0.5),
                    (Math.random() - 0.5) * (BOX_SIZE - 0.5)
                ),
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 2 * speedMultiplier,
                    (Math.random() - 0.5) * 2 * speedMultiplier,
                    (Math.random() - 0.5) * 2 * speedMultiplier
                ),
                type: "B",
                radius: PARTICLE_RADIUS_B,
            });
        }

        particlesRef.current = newParticles;
        meshRefs.current = new Array(newParticles.length).fill(null);
    }

    const addFlash = useCallback((pos: THREE.Vector3) => {
        const id = flashIdRef.current++;
        setFlashes((prev) => [...prev.slice(-8), { id, pos: pos.clone() }]);
    }, []);

    const removeFlash = useCallback((id: number) => {
        setFlashes((prev) => prev.filter((f) => f.id !== id));
    }, []);

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05); // Clamp delta
        const particles = particlesRef.current;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // Adjust speed toward target based on temperature
            const currentSpeed = p.vel.length();
            const targetSpeed = speedMultiplier * 1.5;
            if (currentSpeed > 0.01) {
                const factor = 1 + (targetSpeed / currentSpeed - 1) * dt * 2;
                p.vel.multiplyScalar(factor);
            }

            // Move
            p.pos.addScaledVector(p.vel, dt * 2);

            // Bounce off walls
            for (const axis of ["x", "y", "z"] as const) {
                if (p.pos[axis] - p.radius < -HALF) {
                    p.pos[axis] = -HALF + p.radius;
                    p.vel[axis] *= -1;
                } else if (p.pos[axis] + p.radius > HALF) {
                    p.pos[axis] = HALF - p.radius;
                    p.vel[axis] *= -1;
                }
            }

            // Update mesh
            const mesh = meshRefs.current[i];
            if (mesh) {
                mesh.position.copy(p.pos);
                if (p.type === "B") {
                    mesh.rotation.x += dt * 2;
                    mesh.rotation.y += dt * 1.5;
                }
            }
        }

        // Collision detection
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const pi = particles[i];
                const pj = particles[j];
                const diff = new THREE.Vector3().subVectors(pi.pos, pj.pos);
                const dist = diff.length();
                const minDist = pi.radius + pj.radius;

                if (dist < minDist && dist > 0.001) {
                    // Calculate relative speed
                    const relVel = new THREE.Vector3().subVectors(pi.vel, pj.vel);
                    const relSpeed = relVel.length();

                    // Transition state flash for A+B collisions above Ea threshold
                    if (pi.type !== pj.type && relSpeed > eaThreshold) {
                        const midPoint = new THREE.Vector3().addVectors(pi.pos, pj.pos).multiplyScalar(0.5);
                        addFlash(midPoint);
                        collisionCountRef.current++;
                        onCollisionCount(collisionCountRef.current);
                    }

                    // Elastic collision response
                    const normal = diff.normalize();
                    const relVelNormal = relVel.dot(normal);

                    if (relVelNormal > 0) {
                        pi.vel.addScaledVector(normal, -relVelNormal);
                        pj.vel.addScaledVector(normal, relVelNormal);
                    }

                    // Separate
                    const overlap = minDist - dist;
                    pi.pos.addScaledVector(normal, overlap * 0.5);
                    pj.pos.addScaledVector(normal, -overlap * 0.5);
                }
            }
        }
    });

    const particles = particlesRef.current;

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <pointLight position={[5, 5, 5]} intensity={1} color="#06b6d4" />
            <pointLight position={[-5, -3, 3]} intensity={0.6} color="#a855f7" />

            {/* Bounding box */}
            <BoundingBox />

            {/* Particles */}
            {particles.map((p, i) => (
                <mesh
                    key={`${configKey}-${i}`}
                    ref={(el) => { meshRefs.current[i] = el; }}
                    position={p.pos}
                >
                    <ParticleMesh type={p.type} />
                </mesh>
            ))}

            {/* Collision flashes */}
            {flashes.map((f) => (
                <CollisionFlash
                    key={f.id}
                    position={f.pos}
                    onComplete={() => removeFlash(f.id)}
                />
            ))}

            {/* Camera controls */}
            <OrbitControls
                enablePan={false}
                minDistance={4}
                maxDistance={14}
                autoRotate
                autoRotateSpeed={0.5}
            />
        </>
    );
}

// ─── Main Component ───
export default function ParticleSimulation3D({
    temperature,
    concentrationA,
    concentrationB,
    activationEnergy,
}: ParticleSimulation3DProps) {
    const [collisionCount, setCollisionCount] = useState(0);

    return (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-brand-dark relative border border-white/10 shadow-inner">
            <Canvas
                camera={{ position: [5, 4, 5], fov: 50 }}
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: true }}
                style={{ background: "transparent" }}
            >
                <SimulationScene
                    temperature={temperature}
                    concentrationA={concentrationA}
                    concentrationB={concentrationB}
                    activationEnergy={activationEnergy}
                    onCollisionCount={setCollisionCount}
                />
            </Canvas>

            {/* HUD Overlays */}
            <div className="absolute top-3 left-3 flex gap-2">
                <div className="flex items-center gap-1.5 bg-brand-card/80 backdrop-blur px-2.5 py-1 rounded-md text-xs border border-white/5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
                    <span className="text-slate-300">A – sfera ({concentrationA})</span>
                </div>
                <div className="flex items-center gap-1.5 bg-brand-card/80 backdrop-blur px-2.5 py-1 rounded-md text-xs border border-white/5">
                    <span className="w-2.5 h-2.5 bg-[#a855f7]" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                    <span className="text-slate-300">B – oktaedras ({concentrationB})</span>
                </div>
            </div>
            <div className="absolute bottom-3 left-3 bg-brand-card/80 backdrop-blur px-2.5 py-1 rounded-md text-xs border border-white/5 flex items-center gap-2">
                <span className="text-slate-400">Reakcijos:</span>
                <span className="font-mono font-bold text-amber-400">{collisionCount}</span>
            </div>
            <div className="absolute bottom-3 right-3 bg-brand-card/80 backdrop-blur px-2.5 py-1 rounded-md text-xs border border-white/5 flex items-center gap-2">
                <span className="text-slate-400">Temp:</span>
                <span className={`font-mono font-bold ${temperature > 70 ? "text-brand-orange" : temperature > 40 ? "text-brand-green" : "text-brand-cyan"}`}>
                    {temperature}°C
                </span>
            </div>
            <div className="absolute top-3 right-3 bg-brand-card/80 backdrop-blur px-2 py-1 rounded-md text-[10px] text-slate-500 border border-white/5">
                Vilkite pelę sukti • Scroll priartinti
            </div>
        </div>
    );
}
