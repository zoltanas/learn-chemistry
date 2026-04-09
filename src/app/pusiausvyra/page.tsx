"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Atom, ArrowRightLeft } from "lucide-react";
import PageShell from "@/components/PageShell";
import EquilibriumSimulator from "@/components/EquilibriumSimulator";
import IceTableGenerator from "@/components/IceTableGenerator";
import EquilibriumGraph from "@/components/EquilibriumGraph";
import KcCalculator from "@/components/KcCalculator";
import { IceResult } from "@/lib/thermodynamics";

export default function PusiausvyraPage() {
  const [temperature, setTemperature] = useState(400);
  const [initialN2, setInitialN2] = useState(1.0);
  const [initialH2, setInitialH2] = useState(3.0);
  const [initialNH3, setInitialNH3] = useState(0.0);
  const [iceResult, setIceResult] = useState<IceResult | null>(null);

  return (
    <PageShell
      title="Cheminė pusiausvyra"
      subtitle={
        <>
          Išmokite skaičiuoti pusiausvyrąją konstantą (K<sub>c</sub>) ir
          analizuoti amoniako sintezę.
        </>
      }
      icon={Atom}
      color="green"
    >
      <div className="space-y-8">
        {/* Teorijos blokas: kas yra Kc */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card p-6 border-white/10"
        >
          <h2 className="text-xl font-bold text-white mb-3">
            Kas yra pusiausvyros konstanta K<sub>c</sub>?
          </h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            <strong className="text-brand-green">
              Pusiausvyros konstanta K<sub>c</sub>
            </strong>{" "}
            — tai skaitinė reikšmė, kuri parodo cheminių reakcijų pusiausvyros
            būseną tam tikroje temperatūroje. Ji lygi produktų koncentracijų
            sandaugos ir reagentų koncentracijų sandaugos santykiui, pakeltų
            atitinkamais stechiometriniais koeficientais. Kai K<sub>c</sub> &gt;
            1 — pusiausvyra pasislinkusi į produktų pusę, kai K<sub>c</sub> &lt;
            1 — į reagentų pusę.
          </p>

          {/* Amoniako sintezės reakcijos lygtis */}
          <h3 className="text-lg font-bold text-white mb-3 mt-6">
            Amoniako sintezės reakcija
          </h3>

          <div className="bg-slate-800/50 rounded-xl p-5 mb-4">
            <p className="text-sm text-slate-400 mb-2">Reakcijos lygtis:</p>
            <div className="flex items-center justify-center gap-3 text-lg sm:text-xl font-mono text-white py-3">
              <span className="text-blue-400 font-bold">N₂</span>
              <span className="text-slate-400">+</span>
              <span className="text-slate-200 font-bold">3H₂</span>
              <ArrowRightLeft className="text-brand-green" size={24} />
              <span className="text-brand-purple font-bold">2NH₃</span>
            </div>
          </div>

          {/* Kc išraiška */}
          <div className="bg-slate-800/50 rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-2">
              Pusiausvyros konstantos K<sub>c</sub> išraiška:
            </p>
            <div className="flex items-center justify-center py-4">
              <div className="text-lg sm:text-xl font-mono text-white">
                <span className="text-brand-green font-bold">K</span>
                <sub className="text-brand-green">c</sub>
                <span className="mx-2">=</span>
                <div className="inline-flex flex-col items-center align-middle">
                  <div className="border-b-2 border-brand-purple pb-1 mb-1 px-2">
                    <span className="text-brand-purple font-bold">[NH₃]</span>
                    <sup className="text-brand-purple">2</sup>
                  </div>
                  <div className="flex items-center px-2">
                    <span className="text-blue-400 font-bold">[N₂]</span>
                    <span className="text-slate-400 mx-1">·</span>
                    <span className="text-slate-200 font-bold">[H₂]</span>
                    <sup className="text-slate-200">3</sup>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center mt-3">
              čia <span className="text-brand-purple">[NH₃]</span>,{" "}
              <span className="text-blue-400">[N₂]</span>,{" "}
              <span className="text-slate-200">[H₂]</span> — medžiagų
              pusiausvyros koncentracijos (mol/L)
            </p>
          </div>
        </motion.div>

        {/* Kc skaičiuoklė */}
        <KcCalculator />

        {/* Pavyzdys section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-4"
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            Pavyzdys: amoniako sintezė
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Naudokite parametrus žemiau, kad simuliuotumėte amoniako sintezės
            pusiausvyrą ir stebėtumėte koncentracijų kitimus.
          </p>
        </motion.div>

        {/* Pradinės sąlygos (left) + Koncentracijos dinamika (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pradinės sąlygos */}
          <div className="lg:col-span-5">
            <EquilibriumSimulator
              temperature={temperature}
              setTemperature={setTemperature}
              initialN2={initialN2}
              setInitialN2={setInitialN2}
              initialH2={initialH2}
              setInitialH2={setInitialH2}
              initialNH3={initialNH3}
              setInitialNH3={setInitialNH3}
            />
          </div>

          {/* Koncentracijos dinamika */}
          <div className="lg:col-span-7">
            <EquilibriumGraph
              initialN2={initialN2}
              initialH2={initialH2}
              initialNH3={initialNH3}
              iceResult={iceResult}
            />
          </div>
        </div>

        {/* Algoritminė lentelė — per visą plotį */}
        <IceTableGenerator
          temperature={temperature}
          initialN2={initialN2}
          initialH2={initialH2}
          initialNH3={initialNH3}
          onEquilibriumCalculated={setIceResult}
        />
      </div>
    </PageShell>
  );
}
