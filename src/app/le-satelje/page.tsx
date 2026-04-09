"use client";

import { useState } from "react";
import { Scale, SplitSquareHorizontal, Square } from "lucide-react";
import PageShell from "@/components/PageShell";
import EquilibriumSimulation from "@/components/EquilibriumSimulation";

export default function LeSateljePage() {
  const [isSplitMode, setIsSplitMode] = useState(false);

  return (
    <PageShell
      title="Le Šateljė principas"
      subtitle="Tyrinėkite, kaip sistema reaguoja į išorinius temperatūros, slėgio ir koncentracijos pokyčius."
      icon={Scale}
      color="purple"
    >
      <div className="flex justify-end mb-6">
        <div className="inline-flex bg-brand-dark rounded-xl p-1 border border-white/10 shadow-inner">
          <button
            onClick={() => setIsSplitMode(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              !isSplitMode
                ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Square size={16} /> Vienas reaktorius
          </button>
          <button
            onClick={() => setIsSplitMode(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              isSplitMode
                ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <SplitSquareHorizontal size={16} /> Palyginimas
          </button>
        </div>
      </div>

      {isSplitMode ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="bg-brand-dark/50 p-2 rounded-xl border border-white/5 text-center font-bold text-slate-300">
              Reaktorius A
            </div>
            <EquilibriumSimulation key="split-a" />
          </div>
          <div className="space-y-4">
            <div className="bg-brand-dark/50 p-2 rounded-xl border border-white/5 text-center font-bold text-slate-300">
              Reaktorius B
            </div>
            <EquilibriumSimulation key="split-b" />
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <EquilibriumSimulation key="single" />
        </div>
      )}
    </PageShell>
  );
}
