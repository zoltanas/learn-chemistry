"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";
import { useProgress } from "@/lib/gamification";

const PRACTICE_PROBLEMS = [
  {
    id: 1,
    equation: "N₂(d) + 3H₂(d) ⇌ 2NH₃(d)",
    kc_expression: "[NH₃]² / ([N₂] · [H₂]³)",
    given: [
      { label: "[N₂]", value: 0.5 },
      { label: "[H₂]", value: 1.5 },
      { label: "[NH₃]", value: 2.0 },
    ],
    answer: 2.37, // (2.0^2) / (0.5 * 1.5^3) = 4 / (0.5 * 3.375) = 4 / 1.6875 = 2.370...
    hints: [
      "Pusiausvyros konstanta Kc = [Produktų koncentracijos]^moliai / [Reagentų koncentracijos]^moliai",
      "Formulė atitinkamais stechiometriniais koeficientais: Kc = [NH₃]² / ([N₂] · [H₂]³)",
      "Įstatykite reikšmes: Kc = 2.0² / (0.5 · 1.5³)",
    ],
  },
  {
    id: 2,
    equation: "2SO₂(d) + O₂(d) ⇌ 2SO₃(d)",
    kc_expression: "[SO₃]² / ([SO₂]² · [O₂])",
    given: [
      { label: "[SO₂]", value: 0.2 },
      { label: "[O₂]", value: 0.1 },
      { label: "[SO₃]", value: 0.4 },
    ],
    answer: 40.0, // (0.4^2) / (0.2^2 * 0.1) = 0.16 / (0.04 * 0.1) = 0.16 / 0.004 = 40
    hints: [
      "Kc išraiška formulėje rašoma pakeliant koncentracijas stechiometriniais koeficientais.",
      "Formulė atitinkamais stechiometriniais koeficientais: Kc = [SO₃]² / ([SO₂]² · [O₂])",
      "Įstatykite reikšmes: Kc = 0.4² / (0.2² · 0.1)",
    ],
  },
];

export default function EquilibriumCalculator() {
  const { addXP, completeActivity } = useProgress();

  // Custom calculator state
  const [customA, setCustomA] = useState("1.0");
  const [customB, setCustomB] = useState("1.0");
  const [customC, setCustomC] = useState("1.0");
  const [customCoefA, setCustomCoefA] = useState("1");
  const [customCoefB, setCustomCoefB] = useState("1");
  const [customCoefC, setCustomCoefC] = useState("2");
  const [showStepByStep, setShowStepByStep] = useState(false);

  // Practice state
  const [activeProblem, setActiveProblem] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<"none" | "correct" | "incorrect">(
    "none",
  );
  const [hintLevel, setHintLevel] = useState(0);

  const calculateCustomKc = () => {
    const a = parseFloat(customA) || 0;
    const b = parseFloat(customB) || 0;
    const c = parseFloat(customC) || 0;
    const cA = parseInt(customCoefA) || 1;
    const cB = parseInt(customCoefB) || 1;
    const cC = parseInt(customCoefC) || 1;

    // aA + bB <=> cC
    const num = Math.pow(c, cC);
    const den = Math.pow(a, cA) * Math.pow(b, cB);

    if (den === 0) return "Dalyba iš nulio!";
    return (num / den).toFixed(3);
  };

  const handleCustomCalculate = () => {
    setShowStepByStep(true);
    addXP(1); // Small reward for using tool
  };

  const checkPracticeAnswer = () => {
    const prob = PRACTICE_PROBLEMS[activeProblem];
    const parsedAns = parseFloat(userAnswer);

    if (!isNaN(parsedAns) && Math.abs(parsedAns - prob.answer) < 0.1) {
      setFeedback("correct");
      // calculate xp reward based on hints
      const xp = 20 - hintLevel * 5;
      addXP(xp);
      completeActivity("pusiausvyra", xp);
    } else {
      setFeedback("incorrect");
    }
  };

  const nextProblem = () => {
    setFeedback("none");
    setUserAnswer("");
    setHintLevel(0);
    setActiveProblem((p) => (p + 1) % PRACTICE_PROBLEMS.length);
  };

  const problem = PRACTICE_PROBLEMS[activeProblem];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Tool: Custom KC Calculator */}
      <div className="glass-card p-6 border-brand-green/20 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <Calculator size={20} className="text-brand-green" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Laisva Kc Skaičiuoklė
            </h3>
            <p className="text-xs text-slate-400">aA + bB ⇌ cC</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-brand-cyan mb-1 block">
                Reagentas A koeficientas (a)
              </span>
              <input
                type="number"
                min="1"
                max="5"
                value={customCoefA}
                onChange={(e) => {
                  setCustomCoefA(e.target.value);
                  setShowStepByStep(false);
                }}
                className="w-full bg-brand-dark border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-brand-cyan mb-1 block">
                [A] koncentracija
              </span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={customA}
                onChange={(e) => {
                  setCustomA(e.target.value);
                  setShowStepByStep(false);
                }}
                className="w-full bg-brand-dark border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-brand-purple mb-1 block">
                Reagentas B koeficientas (b)
              </span>
              <input
                type="number"
                min="1"
                max="5"
                value={customCoefB}
                onChange={(e) => {
                  setCustomCoefB(e.target.value);
                  setShowStepByStep(false);
                }}
                className="w-full bg-brand-dark border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-brand-purple mb-1 block">
                [B] koncentracija
              </span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={customB}
                onChange={(e) => {
                  setCustomB(e.target.value);
                  setShowStepByStep(false);
                }}
                className="w-full bg-brand-dark border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <label className="block">
              <span className="text-xs text-brand-green mb-1 block">
                Produktas C koeficientas (c)
              </span>
              <input
                type="number"
                min="1"
                max="5"
                value={customCoefC}
                onChange={(e) => {
                  setCustomCoefC(e.target.value);
                  setShowStepByStep(false);
                }}
                className="w-full bg-brand-dark border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-brand-green mb-1 block">
                [C] koncentracija
              </span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={customC}
                onChange={(e) => {
                  setCustomC(e.target.value);
                  setShowStepByStep(false);
                }}
                className="w-full bg-brand-dark border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm"
              />
            </label>
          </div>
        </div>

        <button
          onClick={handleCustomCalculate}
          className="w-full py-3 rounded-xl bg-brand-green/20 text-brand-green font-bold hover:bg-brand-green/30 transition-colors border border-brand-green/30"
        >
          Skaičiuoti Kc
        </button>

        <AnimatePresence>
          {showStepByStep && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6 p-4 rounded-xl bg-brand-darker border border-brand-green/20 overflow-hidden"
            >
              <h4 className="text-sm font-bold text-white mb-3">Žingsniai:</h4>
              <div className="space-y-3 font-mono text-sm text-slate-300">
                <p>
                  1. <span className="text-slate-500">Formulė:</span> Kc = [C]
                  <sup className="text-xs">{customCoefC}</sup> / ([A]
                  <sup className="text-xs">{customCoefA}</sup> · [B]
                  <sup className="text-xs">{customCoefB}</sup>)
                </p>
                <p>
                  2. <span className="text-slate-500">Įstatymas:</span> Kc = (
                  {customC})<sup className="text-xs">{customCoefC}</sup> / ((
                  {customA})<sup className="text-xs">{customCoefA}</sup> · (
                  {customB})<sup className="text-xs">{customCoefB}</sup>)
                </p>
                <p>
                  3. <span className="text-slate-500">Rezultatas:</span> Kc ={" "}
                  <strong className="text-brand-green text-lg">
                    {calculateCustomKc()}
                  </strong>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Practice Problems */}
      <div className="glass-card p-6 border-white/10 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Praktikos uždaviniai</h3>
          <div className="text-xs bg-white/5 px-3 py-1 rounded-full text-slate-400">
            {activeProblem + 1} iš {PRACTICE_PROBLEMS.length}
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-brand-darker rounded-xl p-5 border border-white/5 mb-6 text-center">
            <p className="text-lg text-brand-cyan font-mono mb-6">
              {problem.equation}
            </p>
            <div className="flex justify-center gap-6 text-sm font-mono text-slate-300">
              {problem.given.map((g, i) => (
                <div key={i}>
                  <span className="text-slate-500">{g.label} =</span> {g.value}{" "}
                  M
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm text-slate-300">
              Apskaičiuokite Kc:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="pvz: 2.37"
                disabled={feedback === "correct"}
                className={`flex-1 bg-brand-dark border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-brand-cyan transition-colors
                           ${feedback === "incorrect" ? "border-red-500/50 focus:border-red-500" : ""}
                           ${feedback === "correct" ? "border-brand-green/50 opacity-70" : ""}
                        `}
              />
              <button
                onClick={checkPracticeAnswer}
                disabled={feedback === "correct"}
                className="px-6 rounded-xl bg-white text-brand-darker font-bold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Tikrinti
              </button>
            </div>
          </div>

          {/* Feedback */}
          <AnimatePresence mode="wait">
            {feedback === "correct" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-brand-green/20 border border-brand-green/30 text-brand-green flex flex-col items-center mb-6"
              >
                <CheckCircle2 size={32} className="mb-2" />
                <p className="font-bold">Teisingai!</p>
                <button
                  onClick={nextProblem}
                  className="mt-3 px-4 py-1.5 bg-brand-green text-brand-darker rounded-lg text-sm font-bold shadow-lg shadow-brand-green/20"
                >
                  Kitas uždavinys
                </button>
              </motion.div>
            )}
            {feedback === "incorrect" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 mb-6"
              >
                <AlertCircle size={20} />
                <p className="text-sm">
                  Neteisingai, bandykite dar kartą arba naudokite užuominą.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hints */}
          {feedback !== "correct" && (
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-3 border-t border-white/5 pt-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                  <Lightbulb size={16} /> Užuominos (-5 XP)
                </h4>
                <button
                  onClick={() =>
                    setHintLevel((h) => Math.min(h + 1, problem.hints.length))
                  }
                  disabled={hintLevel === problem.hints.length}
                  className="text-xs bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Gauti užuominą
                </button>
              </div>
              <div className="space-y-2">
                {problem.hints.slice(0, hintLevel).map((hint, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx}
                    className="text-sm bg-brand-darker rounded-lg p-3 text-slate-300 border-l-2 border-amber-400"
                  >
                    {hint}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
