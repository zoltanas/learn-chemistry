"use client";

import { useEffect, useRef } from "react";
import { useAnimation, motion } from "framer-motion";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    type: "A" | "B";
}

interface ParticleSimulationProps {
    temperature: number; // 0-100
    concentrationA: number; // 1-50
    concentrationB: number; // 1-50
}

export default function ParticleSimulation({
    temperature,
    concentrationA,
    concentrationB,
}: ParticleSimulationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationField: number;
        let particles: Particle[] = [];

        const initParticles = () => {
            particles = [];
            const width = canvas.width;
            const height = canvas.height;

            const speedMultiplier = 0.5 + (temperature / 100) * 2; // Speed based on temp

            // Add A particles
            for (let i = 0; i < concentrationA; i++) {
                particles.push({
                    x: Math.random() * (width - 20) + 10,
                    y: Math.random() * (height - 20) + 10,
                    vx: (Math.random() - 0.5) * 3 * speedMultiplier,
                    vy: (Math.random() - 0.5) * 3 * speedMultiplier,
                    radius: 6,
                    color: "#06b6d4", // cyan
                    type: "A",
                });
            }

            // Add B particles
            for (let i = 0; i < concentrationB; i++) {
                particles.push({
                    x: Math.random() * (width - 20) + 10,
                    y: Math.random() * (height - 20) + 10,
                    vx: (Math.random() - 0.5) * 3 * speedMultiplier,
                    vy: (Math.random() - 0.5) * 3 * speedMultiplier,
                    radius: 8,
                    color: "#a855f7", // purple
                    type: "B",
                });
            }
        };

        const draw = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Add trail effect for higher temps
            if (temperature > 50) {
                ctx.fillStyle = `rgba(17, 24, 39, ${0.4 - (temperature / 100) * 0.2})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            const speedMultiplier = 0.5 + (temperature / 100) * 2;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Update position (adjust speed if temp changed since init)
                const currentSpeedTemp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                const wantedSpeedTemp = 1.5 * speedMultiplier;

                p.x += p.vx;
                p.y += p.vy;

                // Bounce off walls
                if (p.x - p.radius < 0) {
                    p.x = p.radius;
                    p.vx *= -1;
                } else if (p.x + p.radius > canvas.width) {
                    p.x = canvas.width - p.radius;
                    p.vx *= -1;
                }

                if (p.y - p.radius < 0) {
                    p.y = p.radius;
                    p.vy *= -1;
                } else if (p.y + p.radius > canvas.height) {
                    p.y = canvas.height - p.radius;
                    p.vy *= -1;
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;

                // Glow effect for higher temps
                if (temperature > 50) {
                    ctx.shadowBlur = (temperature / 100) * 15;
                    ctx.shadowColor = p.color;
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.fill();
                ctx.closePath();
            }

            // Check collisions for visual flashes (simplified)
            ctx.shadowBlur = 0; // reset for flashes
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < particles[i].radius + particles[j].radius) {
                        // Flash on collision
                        if (particles[i].type !== particles[j].type) {
                            ctx.beginPath();
                            ctx.arc((particles[i].x + particles[j].x) / 2, (particles[i].y + particles[j].y) / 2, 12, 0, Math.PI * 2);
                            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                            ctx.fill();
                            ctx.closePath();
                        }

                        // Simple elastic collision response
                        const nx = dx / dist;
                        const ny = dy / dist;

                        // standard 1D collision along normal
                        const kx = particles[i].vx - particles[j].vx;
                        const ky = particles[i].vy - particles[j].vy;
                        const p = 2 * (nx * kx + ny * ky) / 2; // Assuming equal mass

                        particles[i].vx -= p * nx;
                        particles[i].vy -= p * ny;
                        particles[j].vx += p * nx;
                        particles[j].vy += p * ny;

                        // Push apart to prevent sticking
                        const overlap = (particles[i].radius + particles[j].radius) - dist;
                        particles[i].x += nx * overlap / 2;
                        particles[i].y += ny * overlap / 2;
                        particles[j].x -= nx * overlap / 2;
                        particles[j].y -= ny * overlap / 2;
                    }
                }
            }

            animationField = requestAnimationFrame(draw);
        };

        initParticles();
        draw();

        return () => {
            cancelAnimationFrame(animationField);
        };
    }, [temperature, concentrationA, concentrationB]);

    return (
        <div className="w-full aspect-video md:aspect-[2/1] rounded-xl overflow-hidden bg-brand-dark relative border border-white/10 shadow-inner">
            <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="w-full h-full object-cover mix-blend-screen"
                style={{ width: "100%", height: "100%" }}
            />
            <div className="absolute top-3 left-3 flex gap-2">
                <div className="flex items-center gap-1.5 bg-brand-card/80 backdrop-blur px-2.5 py-1 rounded-md text-xs border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-brand-cyan"></span>
                    <span className="text-slate-300">Medžiaga A ({concentrationA})</span>
                </div>
                <div className="flex items-center gap-1.5 bg-brand-card/80 backdrop-blur px-2.5 py-1 rounded-md text-xs border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-brand-purple"></span>
                    <span className="text-slate-300">Medžiaga B ({concentrationB})</span>
                </div>
            </div>
            <div className="absolute bottom-3 right-3 bg-brand-card/80 backdrop-blur px-2.5 py-1 rounded-md text-xs border border-white/5 flex items-center gap-2">
                <span className="text-slate-400">Temp:</span>
                <span className={`font-mono font-bold ${temperature > 70 ? 'text-brand-orange' : temperature > 40 ? 'text-brand-green' : 'text-brand-cyan'}`}>
                    {temperature}°C
                </span>
            </div>
        </div>
    );
}
