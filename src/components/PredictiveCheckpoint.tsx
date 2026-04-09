"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";

export type ShiftDirection = -1 | 0 | 1;

interface PredictiveCheckpointProps {
  isOpen: boolean;
  onPredict: (prediction: ShiftDirection) => void;
  onCancel: () => void;
  temperatureChange: number;
  pressureChange: number;
  n2Change: number;
  h2Change: number;
  nh3Change: number;
}

export default function PredictiveCheckpoint({
  isOpen,
  onPredict,
  onCancel,
  temperatureChange,
  pressureChange,
  n2Change,
  h2Change,
  nh3Change,
}: PredictiveCheckpointProps) {
  const [selected, setSelected] = useState<ShiftDirection | null>(null);

  // Determine ALL changes for the prompt description
  const changes: string[] = [];
  if (Math.abs(temperatureChange) > 0) {
    changes.push(
      temperatureChange > 0
        ? `Padidinta temperatūra (+${temperatureChange}°C)`
        : `Sumažinta temperatūra (${temperatureChange}°C)`,
    );
  }
  if (Math.abs(pressureChange) > 0) {
    changes.push(
      pressureChange > 0
        ? `Padidintas slėgis (+${pressureChange.toFixed(1)} atm)`
        : `Sumažintas slėgis (${pressureChange.toFixed(1)} atm)`,
    );
  }
  if (Math.abs(n2Change) > 0) {
    changes.push(
      n2Change > 0
        ? `Padidinta N₂ koncentracija (+${n2Change.toFixed(1)} M)`
        : `Sumažinta N₂ koncentracija (${n2Change.toFixed(1)} M)`,
    );
  }
  if (Math.abs(h2Change) > 0) {
    changes.push(
      h2Change > 0
        ? `Padidinta H₂ koncentracija (+${h2Change.toFixed(1)} M)`
        : `Sumažinta H₂ koncentracija (${h2Change.toFixed(1)} M)`,
    );
  }
  if (Math.abs(nh3Change) > 0) {
    changes.push(
      nh3Change > 0
        ? `Padidinta NH₃ koncentracija (+${nh3Change.toFixed(1)} M)`
        : `Sumažinta NH₃ koncentracija (${nh3Change.toFixed(1)} M)`,
    );
  }

  const changeText =
    changes.length > 0 ? changes.join(" • ") : "Jokie parametrai nepakeisti.";

  const handleSubmit = () => {
    if (selected !== null) {
      onPredict(selected);
      setSelected(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-darker/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card max-w-lg w-full p-6 border-brand-purple/30 shadow-2xl relative overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-brand-purple/10 blur-3xl pointer-events-none rounded-full" />

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-purple/20 flex items-center justify-center text-brand-purple">
                <HelpCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Užduotis</h3>
                <p className="text-xs text-slate-400">
                  Pritaikykite Le Šateljė principą
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-center mb-3">
                <p className="text-sm text-slate-400 mb-2">
                  Atlikti pakeitimai:
                </p>
                <ul className="space-y-1">
                  {changes.map((change, idx) => (
                    <li
                      key={idx}
                      className="text-base font-semibold text-white flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-purple flex-shrink-0" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-brand-purple text-center border-t border-white/10 pt-3">
                Kur link pasislinks sistemos N₂ + 3H₂ ⇌ 2NH₃ pusiausvyra?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button
                onClick={() => setSelected(-1)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all
                                    ${
                                      selected === -1
                                        ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-lg shadow-brand-cyan/20"
                                        : "bg-brand-dark/50 border-white/10 text-slate-400 hover:bg-white/5"
                                    }`}
              >
                <ArrowLeft size={24} />
                <span className="font-bold text-sm">
                  Į kairę
                  <br />
                  <span className="text-xs font-normal opacity-70">
                    (Reagentus)
                  </span>
                </span>
              </button>

              <button
                onClick={() => setSelected(0)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all
                                    ${
                                      selected === 0
                                        ? "bg-slate-700/50 border-slate-400 text-white shadow-lg shadow-slate-500/20"
                                        : "bg-brand-dark/50 border-white/10 text-slate-400 hover:bg-white/5"
                                    }`}
              >
                <ArrowLeftRight size={24} />
                <span className="font-bold text-sm">
                  Nesikeis
                  <br />
                  <span className="text-xs font-normal opacity-70">
                    (Pusiausvyra)
                  </span>
                </span>
              </button>

              <button
                onClick={() => setSelected(1)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all
                                    ${
                                      selected === 1
                                        ? "bg-brand-purple/20 border-brand-purple text-brand-purple shadow-lg shadow-brand-purple/20"
                                        : "bg-brand-dark/50 border-white/10 text-slate-400 hover:bg-white/5"
                                    }`}
              >
                <ArrowRight size={24} />
                <span className="font-bold text-sm">
                  Į dešinę
                  <br />
                  <span className="text-xs font-normal opacity-70">
                    (Produktus)
                  </span>
                </span>
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Atšaukti
              </button>
              <button
                onClick={handleSubmit}
                disabled={selected === null}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-brand-purple text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors shadow-lg shadow-brand-purple/20"
              >
                Patvirtinti
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
