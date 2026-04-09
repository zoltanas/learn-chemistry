"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

export default function KcCalculator() {
  const [coeffA, setCoeffA] = useState(1);
  const [concA, setConcA] = useState(1.0);
  const [coeffB, setCoeffB] = useState(1);
  const [concB, setConcB] = useState(1.0);
  const [coeffC, setCoeffC] = useState(2);
  const [concC, setConcC] = useState(1.0);
  const [result, setResult] = useState<number | null>(null);

  const calculateKc = () => {
    if (concA <= 0 || concB <= 0) {
      setResult(NaN);
      return;
    }
    const numerator = Math.pow(concC, coeffC);
    const denominator = Math.pow(concA, coeffA) * Math.pow(concB, coeffB);
    setResult(numerator / denominator);
  };

  return (
    <div className="glass-card p-6 border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <Calculator size={20} className="text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Kc skaičiuoklė</h3>
          <p className="text-xs text-slate-400">aA + bB ⇌ cC</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Reagentas A */}
        <div>
          <label className="block text-sm font-semibold text-blue-400 mb-1.5">
            Reagentas A koeficientas (a)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={coeffA}
            onChange={(e) => setCoeffA(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white font-mono font-bold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-blue-400 mb-1.5">
            [A] koncentracija
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={concA}
            onChange={(e) => setConcA(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white font-mono font-bold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Reagentas B */}
        <div>
          <label className="block text-sm font-semibold text-purple-400 mb-1.5">
            Reagentas B koeficientas (b)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={coeffB}
            onChange={(e) => setCoeffB(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white font-mono font-bold focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-purple-400 mb-1.5">
            [B] koncentracija
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={concB}
            onChange={(e) => setConcB(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white font-mono font-bold focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
          />
        </div>

        {/* Produktas C */}
        <div className="sm:col-span-1">
          <label className="block text-sm font-semibold text-green-400 mb-1.5">
            Produktas C koeficientas (c)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={coeffC}
            onChange={(e) => setCoeffC(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white font-mono font-bold focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm font-semibold text-green-400 mb-1.5">
            [C] koncentracija
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={concC}
            onChange={(e) => setConcC(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white font-mono font-bold focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors"
          />
        </div>
      </div>

      <button
        onClick={calculateKc}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/20 active:scale-[0.98]"
      >
        Skaičiuoti Kc
      </button>

      {result !== null && (
        <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-white/10">
          <p className="text-sm text-slate-400 mb-1">Rezultatas:</p>
          {isNaN(result) ? (
            <p className="text-lg font-mono font-bold text-red-400">
              Negalima skaičiuoti: reagentų koncentracijos turi būti &gt; 0
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-lg font-mono font-bold text-white">
                K<sub className="text-brand-green">c</sub> ={" "}
                <span className="text-brand-green">
                  {result.toFixed(4)}
                </span>
              </p>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  result > 1
                    ? "bg-green-500/10 text-green-400 border border-green-500/30"
                    : result < 1
                      ? "bg-red-500/10 text-red-400 border border-red-500/30"
                      : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                }`}
              >
                {result > 1
                  ? "→ Produktų pusė"
                  : result < 1
                    ? "← Reagentų pusė"
                    : "Pusiausvyra"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
