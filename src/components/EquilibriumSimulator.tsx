"use client";

import { Flame } from "lucide-react";

/* Inline SVG molecule components - realistic proportions & CPK colors
 *
 * CPK color convention:
 *   N = blue (#2563eb)
 *   H = white/light gray (#f1f5f9)
 *
 * Van der Waals radii (relative, Å):
 *   N ≈ 1.55, H ≈ 1.20  →  rN : rH ≈ 1.3 : 1
 * Bond lengths (Å):
 *   N≡N  1.10
 *   H–H  0.74
 *   N–H  1.01
 */

function N2Molecule({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size * 1.1}
      height={size * 0.55}
      viewBox="0 0 36 22"
      className="shrink-0"
    >
      {/* Two N atoms - blue (CPK), overlapping */}
      <circle cx="13" cy="11" r="9" fill="#1e3a8a" />
      <circle cx="10" cy="9" r="3" fill="#60a5fa" opacity="0.4" />
      <circle cx="23" cy="11" r="9" fill="#1e3a8a" />
      <circle cx="20" cy="9" r="3" fill="#60a5fa" opacity="0.4" />
    </svg>
  );
}

function H2Molecule({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size * 0.9}
      height={size * 0.7}
      viewBox="0 0 16 14"
      className="shrink-0"
    >
      {/* Two H atoms - white/light (CPK), overlapping */}
      <circle cx="5" cy="7" r="5" fill="#f1f5f9" />
      <circle cx="3.5" cy="5.5" r="1.5" fill="#fff" opacity="0.5" />
      <circle cx="11" cy="7" r="5" fill="#f1f5f9" />
      <circle cx="9.5" cy="5.5" r="1.5" fill="#fff" opacity="0.5" />
    </svg>
  );
}

function NH3Molecule({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size * 1.0}
      height={size * 1.0}
      viewBox="0 0 36 36"
      className="shrink-0"
    >
      {/* H atoms - small, white (CPK), closer to N */}
      <circle cx="18" cy="22" r="5" fill="#f1f5f9" />
      <circle cx="17" cy="20.5" r="2" fill="#fff" opacity="0.5" />
      <circle cx="10" cy="20" r="5" fill="#f1f5f9" />
      <circle cx="9" cy="18.5" r="2" fill="#fff" opacity="0.5" />
      <circle cx="26" cy="20" r="5" fill="#f1f5f9" />
      <circle cx="25" cy="18.5" r="2" fill="#fff" opacity="0.5" />
      {/* N atom - blue (CPK), larger */}
      <circle cx="18" cy="9" r="9" fill="#1e3a8a" />
      <circle cx="15" cy="6" r="3.5" fill="#60a5fa" opacity="0.4" />
    </svg>
  );
}

interface EquilibriumSimulatorProps {
  temperature: number;
  setTemperature: (v: number) => void;
  initialN2: number;
  setInitialN2: (v: number) => void;
  initialH2: number;
  setInitialH2: (v: number) => void;
  initialNH3: number;
  setInitialNH3: (v: number) => void;
}

export default function EquilibriumSimulator({
  temperature,
  setTemperature,
  initialN2,
  setInitialN2,
  initialH2,
  setInitialH2,
  initialNH3,
  setInitialNH3,
}: EquilibriumSimulatorProps) {
  return (
    <div className="glass-card p-4 border-white/10">
      <h3 className="text-lg font-bold text-white mb-4">Pradinės sąlygos</h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Flame size={14} className="text-brand-orange" /> Temperatūra
            </label>
            <span className="text-brand-orange font-mono text-xs">
              {temperature}°C
            </span>
          </div>
          <input
            type="range"
            min="200"
            max="800"
            step="10"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full accent-brand-orange"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <N2Molecule /> Pradinis [N₂]
            </label>
            <span className="text-blue-400 font-mono text-xs">
              {initialN2.toFixed(1)} M
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={initialN2}
            onChange={(e) => setInitialN2(Number(e.target.value))}
            className="w-full accent-blue-400"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <H2Molecule /> Pradinis [H₂]
            </label>
            <span className="text-slate-300 font-mono text-xs">
              {initialH2.toFixed(1)} M
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={initialH2}
            onChange={(e) => setInitialH2(Number(e.target.value))}
            className="w-full accent-slate-300"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <NH3Molecule /> Pradinis [NH₃]
            </label>
            <span className="text-brand-purple font-mono text-xs">
              {initialNH3.toFixed(1)} M
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={initialNH3}
            onChange={(e) => setInitialNH3(Number(e.target.value))}
            className="w-full accent-brand-purple"
          />
        </div>
      </div>
    </div>
  );
}
