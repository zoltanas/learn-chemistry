"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Zap, Activity } from "lucide-react";
import PageShell from "@/components/PageShell";
import RateLawCalculator from "@/components/RateLawCalculator";
import KineticsGraph from "@/components/KineticsGraph";
import ScenarioChallenge from "@/components/ScenarioChallenge";

// Dynamic imports to avoid SSR issues with Three.js and React Flow
const ParticleSimulation3D = dynamic(
  () => import("@/components/ParticleSimulation3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-video rounded-xl bg-brand-dark border border-white/10 flex items-center justify-center">
        <div className="text-slate-500 text-sm animate-pulse">
          Kraunama 3D simuliacija...
        </div>
      </div>
    ),
  },
);

export default function KinetikaPage() {
  const [temperature, setTemperature] = useState(25);
  const [concA, setConcA] = useState(20);
  const [concB, setConcB] = useState(20);
  const [activationEnergy, setActivationEnergy] = useState(50);

  return (
    <PageShell
      title="Reakcijos kinetika"
      subtitle="Sužinokite, kas lemia cheminių reakcijų greitį ir kaip jį apskaičiuoti."
      icon={Zap}
      color="cyan"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: 3D Simulation + Calculator */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6 border-brand-cyan/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
                <Activity size={20} className="text-brand-cyan" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  3D dalelių susidūrimų simuliacija
                </h3>
                <p className="text-xs text-slate-400">
                  Keiskite sąlygas ir stebėkite molekulių judėjimą trimatėje
                  erdvėje
                </p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label className="block">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-400">Temperatūra</span>
                  <span className="text-xs text-brand-cyan font-mono">
                    {temperature}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={temperature}
                  onChange={(e) => setTemperature(parseInt(e.target.value))}
                  className="w-full accent-brand-cyan"
                />
              </label>
              <label className="block">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-400">[A] kiekis</span>
                  <span className="text-xs text-brand-cyan font-mono">
                    {concA}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={concA}
                  onChange={(e) => setConcA(parseInt(e.target.value))}
                  className="w-full accent-brand-cyan"
                />
              </label>
              <label className="block">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-400">[B] kiekis</span>
                  <span className="text-xs text-brand-purple font-mono">
                    {concB}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={concB}
                  onChange={(e) => setConcB(parseInt(e.target.value))}
                  className="w-full accent-brand-purple"
                />
              </label>
              <label className="block">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-400">Ea</span>
                  <span className="text-xs text-amber-400 font-mono">
                    {activationEnergy} kJ/mol
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activationEnergy}
                  onChange={(e) =>
                    setActivationEnergy(parseInt(e.target.value))
                  }
                  className="w-full accent-amber-400"
                />
              </label>
            </div>

            <ParticleSimulation3D
              temperature={temperature}
              concentrationA={concA}
              concentrationB={concB}
              activationEnergy={activationEnergy}
            />

            <div className="mt-4 text-sm text-slate-400 bg-brand-dark rounded-lg p-4 border border-white/5">
              <strong className="text-white block mb-1">
                Susidūrimų teorija:
              </strong>
              Cheminė reakcija įvyksta, kai molekulės susiduria turėdamos
              pakankamai energijos (aktyvacijos energiją Ea). Keliant
              temperatūrą, molekulės juda greičiau ir susiduria dažniau.
              Aukštesnė Ea reiškia, kad reikia stipresnio susidūrimo – mažiau
              reakcijų vyksta. Stebėkite{" "}
              <span className="text-amber-400 font-semibold">
                auksinius blyksnius
              </span>{" "}
              – tai sėkmingi susidūrimai!
            </div>
          </div>

          <RateLawCalculator />
        </div>

        {/* Right column: Graph */}
        <div className="lg:col-span-5 space-y-6">
          <KineticsGraph initialA0={5.0} initialK={0.1} />
        </div>
      </div>

      {/* Full width: Scenarios */}
      <div className="mt-6">
        <ScenarioChallenge />
      </div>
    </PageShell>
  );
}
