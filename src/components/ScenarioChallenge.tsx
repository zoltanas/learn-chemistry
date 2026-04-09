"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Clock,
  Star,
  Trophy,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { useProgress } from "@/lib/gamification";

interface Scenario {
  id: string;
  title: string;
  description: string;
  context?: string; // educational explanation
  targetRate: number;
  targetComparison: "above" | "below" | "exact";
  tolerance: number; // for "exact" mode, ±%
  timeLimitSeconds: number;
  constraints: {
    maxConc?: number;
  };
  initialValues: {
    k: number;
    A: number;
    B: number;
    m: number;
    n: number;
    temp: number;
  };
  color: string;
  icon: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "catalytic",
    title: "Išmetamųjų dujų katalizatorius",
    description:
      "Padidinkite reakcijos greitį virš 2.5 mol/(l·s), optimizuodami koncentracijas ir reakcijos eilę. Tikslas — kuo greičiau!",
    context:
      "Katalizinis keitiklis (angl. Catalytic converter) — tai automobilio išmetimo sistemos dalis, kuri katalizatoriaus pagalba pagreitina kenksmingų dujų (CO, NOₓ) skaidymą į saugesnes medžiagas.",
    targetRate: 2.5,
    targetComparison: "above",
    tolerance: 0,
    timeLimitSeconds: 45,
    constraints: { maxConc: 5 },
    initialValues: { k: 0.1, A: 1.0, B: 1.0, m: 1, n: 2, temp: 25 },
    color: "brand-cyan",
    icon: "🚗",
  },
  {
    id: "pharma",
    title: "Vaistų galiojimas",
    description:
      "Sumažinkite reakcijos greitį žemiau 0.01 mol/(l·s), kad vaistas lėčiau skiltų. Mažinkite koncentracijas ir greičio konstantą!",
    context:
      "Vaistų stabilumas priklauso nuo cheminio skilimo greičio. Mažinant temperatūrą ir koncentracijas, galima sulėtinti reakciją ir prailginti vaisto tinkamumo laiką.",
    targetRate: 0.01,
    targetComparison: "below",
    tolerance: 0,
    timeLimitSeconds: 30,
    constraints: {},
    initialValues: { k: 0.5, A: 3.0, B: 2.0, m: 1, n: 1, temp: 50 },
    color: "brand-green",
    icon: "💊",
  },
  {
    id: "industrial",
    title: "Pramoninė sintezė",
    description:
      "Tiksliai pasiekite reakcijos greitį 1.50 ± 5% mol/(l·s). Reikia precizikos — nei per daug, nei per mažai!",
    context:
      "Pramoninėje chemijoje tikslus reakcijos greičio valdymas yra kritiškai svarbus. Per greita reakcija gali sukelti perkaitimą ar sprogimą, o per lėta — sumažinti gamybos efektyvumą.",
    targetRate: 1.5,
    targetComparison: "exact",
    tolerance: 5,
    timeLimitSeconds: 60,
    constraints: {},
    initialValues: { k: 0.2, A: 2.0, B: 1.5, m: 1, n: 1, temp: 40 },
    color: "brand-orange",
    icon: "🏭",
  },
];

function ScenarioCard({
  scenario,
  onStart,
  completed,
}: {
  scenario: Scenario;
  onStart: () => void;
  completed: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onStart}
      className={`glass-card p-5 text-left border transition-all hover:bg-white/5 w-full
                ${completed ? `border-${scenario.color}/30 bg-${scenario.color}/5` : "border-white/10"}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-2xl mb-2 block">{scenario.icon}</span>
          <h4 className="text-lg font-bold text-white">{scenario.title}</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {scenario.description}
          </p>
          <div className="flex gap-3 mt-3">
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">
              <Clock size={10} className="inline mr-1" />
              {scenario.timeLimitSeconds}s
            </span>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">
              <Target size={10} className="inline mr-1" />
              {scenario.targetComparison === "above"
                ? ">"
                : scenario.targetComparison === "below"
                  ? "<"
                  : "≈"}{" "}
              {scenario.targetRate}
            </span>
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-500 mt-2" />
      </div>
      {completed && (
        <div className="mt-2 text-xs text-brand-green font-bold">✓ Atlikta</div>
      )}
    </motion.button>
  );
}

export default function ScenarioChallenge() {
  const { completeActivity } = useProgress();
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<Set<string>>(
    new Set(),
  );
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Adjustable values
  const [k, setK] = useState(0.1);
  const [A, setA] = useState(1.0);
  const [B, setB] = useState(1.0);
  const [m, setM] = useState(1);
  const [n, setN] = useState(1);

  const v = k * Math.pow(A, m) * Math.pow(B, n);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const checkWin = useCallback(() => {
    if (!activeScenario) return false;
    const s = activeScenario;
    if (s.targetComparison === "above") return v > s.targetRate;
    if (s.targetComparison === "below") return v < s.targetRate;
    if (s.targetComparison === "exact") {
      const tolerance = s.targetRate * (s.tolerance / 100);
      return Math.abs(v - s.targetRate) <= tolerance;
    }
    return false;
  }, [activeScenario, v]);

  const startScenario = (scenario: Scenario) => {
    setActiveScenario(scenario);
    setFailedAttempts(0);
    setK(scenario.initialValues.k);
    setA(scenario.initialValues.A);
    setB(scenario.initialValues.B);
    setM(scenario.initialValues.m);
    setN(scenario.initialValues.n);
    setTimeLeft(scenario.timeLimitSeconds);
    setIsRunning(true);
    setWon(false);
    setLost(false);
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setIsRunning(false);
          setLost(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleSubmit = () => {
    if (checkWin()) {
      clearInterval(timerRef.current!);
      setIsRunning(false);
      setWon(true);
      setCompletedScenarios(
        (prev) => new Set([...Array.from(prev), activeScenario!.id]),
      );
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const ratio = elapsed / activeScenario!.timeLimitSeconds;
      const bonusXP = ratio < 0.5 ? 50 : ratio < 0.75 ? 30 : 20;
      completeActivity("kinetika", bonusXP);
    } else {
      setFailedAttempts((prev) => prev + 1);
    }
  };

  const getStars = (): number => {
    if (!activeScenario || !won) return 0;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const ratio = elapsed / activeScenario.timeLimitSeconds;
    if (ratio < 0.4) return 3;
    if (ratio < 0.7) return 2;
    return 1;
  };

  const exitScenario = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveScenario(null);
    setIsRunning(false);
    setWon(false);
    setLost(false);
    setFailedAttempts(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const timerProgress = activeScenario
    ? timeLeft / activeScenario.timeLimitSeconds
    : 1;
  const stars = getStars();

  // Scenario selection
  if (!activeScenario) {
    return (
      <div className="glass-card p-6 border-amber-400/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
            <Target size={20} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Scenarijai ir iššūkiai
            </h3>
            <p className="text-xs text-slate-400">
              Pritaikykite kinetikos žinias realiose situacijose
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIOS.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              onStart={() => startScenario(s)}
              completed={completedScenarios.has(s.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Active scenario
  return (
    <div className="glass-card p-6 border-amber-400/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{activeScenario.icon}</span>
          <div>
            <h3 className="text-xl font-bold text-white">
              {activeScenario.title}
            </h3>
            <p className="text-xs text-slate-400">
              {activeScenario.description}
            </p>
          </div>
        </div>
        <button
          onClick={exitScenario}
          className="text-xs text-slate-500 hover:text-white transition-colors"
        >
          ✕ Išeiti
        </button>
      </div>

      {/* Context / educational explanation (shown after 10 failed attempts) */}
      {activeScenario.context && failedAttempts >= 10 && (
        <div className="bg-slate-800/40 border border-white/5 rounded-xl p-3 mb-6 text-xs text-slate-300 leading-relaxed">
          <span className="text-amber-400 font-semibold mr-1">ℹ️</span>
          {activeScenario.context}
        </div>
      )}

      {/* Timer ring */}
      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="#1e293b"
              strokeWidth="4"
            />
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke={timerProgress > 0.3 ? "#f59e0b" : "#ef4444"}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 35}`}
              strokeDashoffset={`${2 * Math.PI * 35 * (1 - timerProgress)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-lg font-mono font-bold ${timerProgress > 0.3 ? "text-amber-400" : "text-red-400"}`}
            >
              {timeLeft}
            </span>
            <span className="text-[8px] text-slate-500 uppercase">
              sekundės
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Dabartinis greitis
          </div>
          <div
            className={`text-3xl font-mono font-black ${checkWin() ? "text-brand-green" : "text-white"}`}
          >
            {v.toFixed(4)}
          </div>
          <div className="text-xs text-slate-400">
            Tikslas:{" "}
            {activeScenario.targetComparison === "above"
              ? ">"
              : activeScenario.targetComparison === "below"
                ? "<"
                : "≈"}{" "}
            {activeScenario.targetRate} mol/(l·s)
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Won */}
        {won && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-6"
          >
            <Trophy size={48} className="text-amber-400 mx-auto mb-3" />
            <h4 className="text-2xl font-bold text-white mb-2">Sėkmė!</h4>
            <div className="flex justify-center gap-1 mb-3">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  size={24}
                  className={
                    s <= stars
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-600"
                  }
                />
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => startScenario(activeScenario)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-sm border border-white/10 hover:bg-white/10 flex items-center gap-2"
              >
                <RotateCcw size={14} /> Kartoti
              </button>
              <button
                onClick={exitScenario}
                className="px-4 py-2 rounded-xl bg-amber-400 text-brand-darker text-sm font-bold hover:bg-amber-300 shadow-lg shadow-amber-400/20"
              >
                Kiti iššūkiai
              </button>
            </div>
          </motion.div>
        )}

        {/* Lost */}
        {lost && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-6"
          >
            <Clock size={48} className="text-red-400 mx-auto mb-3" />
            <h4 className="text-2xl font-bold text-red-400 mb-2">
              Laikas baigėsi!
            </h4>
            <p className="text-sm text-slate-400 mb-4">
              Bandykite dar kartą — optimizuokite greičiau!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => startScenario(activeScenario)}
                className="px-4 py-2 rounded-xl bg-amber-400 text-brand-darker text-sm font-bold hover:bg-amber-300 flex items-center gap-2 shadow-lg shadow-amber-400/20"
              >
                <RotateCcw size={14} /> Bandyti dar kartą
              </button>
              <button
                onClick={exitScenario}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-sm border border-white/10 hover:bg-white/10"
              >
                Grįžti
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls - only when running */}
      {isRunning && !won && !lost && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <label>
              <span className="text-[10px] text-slate-400 block mb-1">k</span>
              <input
                type="range"
                min="0.01"
                max="2"
                step="0.01"
                value={k}
                onChange={(e) => setK(parseFloat(e.target.value))}
                className="w-full accent-slate-400"
              />
              <span className="text-xs font-mono text-white block text-right">
                {k}
              </span>
            </label>
            <label>
              <span className="text-[10px] text-brand-cyan uppercase block mb-1">
                [A]
              </span>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={A}
                onChange={(e) =>
                  setA(
                    Math.min(
                      parseFloat(e.target.value),
                      activeScenario.constraints.maxConc ?? 10,
                    ),
                  )
                }
                className="w-full accent-brand-cyan"
              />
              <span className="text-xs font-mono text-white block text-right">
                {A}
              </span>
            </label>
            <label>
              <span className="text-[10px] text-brand-purple uppercase block mb-1">
                [B]
              </span>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={B}
                onChange={(e) =>
                  setB(
                    Math.min(
                      parseFloat(e.target.value),
                      activeScenario.constraints.maxConc ?? 10,
                    ),
                  )
                }
                className="w-full accent-brand-purple"
              />
              <span className="text-xs font-mono text-white block text-right">
                {B}
              </span>
            </label>
            <label>
              <span className="text-[10px] text-slate-400 block mb-1">m</span>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={m}
                onChange={(e) => setM(parseInt(e.target.value))}
                className="w-full accent-slate-400"
              />
              <span className="text-xs font-mono text-white block text-right">
                {m}
              </span>
            </label>
            <label>
              <span className="text-[10px] text-slate-400 block mb-1">n</span>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={n}
                onChange={(e) => setN(parseInt(e.target.value))}
                className="w-full accent-slate-400"
              />
              <span className="text-xs font-mono text-white block text-right">
                {n}
              </span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            className={`w-full py-3 rounded-xl font-bold text-lg transition-all shadow-lg
                            ${
                              checkWin()
                                ? "bg-brand-green text-white shadow-brand-green/30 hover:bg-green-500 animate-pulse"
                                : "bg-white/10 text-slate-400 cursor-not-allowed"
                            }`}
          >
            {checkWin() ? "✓ Pateikti atsakymą!" : "Dar nepasiekta tikslo..."}
          </button>
        </div>
      )}
    </div>
  );
}
