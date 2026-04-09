"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Activity,
  ArrowLeftRight,
  Play,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useProgress } from "@/lib/gamification";
import dynamic from "next/dynamic";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import PredictiveCheckpoint, { ShiftDirection } from "./PredictiveCheckpoint";
import IndustrialDashboard from "./IndustrialDashboard";

const LeChatelier3D = dynamic(() => import("./LeChatelier3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center bg-brand-darker rounded-xl border border-white/5">
      <span className="animate-pulse text-slate-500">
        Kraunama 3D simuliacija...
      </span>
    </div>
  ),
});

interface Params {
  temperature: number;
  pressure: number;
  n2: number;
  h2: number;
  nh3: number;
}

export default function EquilibriumSimulation() {
  const { completeActivity } = useProgress();

  const [activeParams, setActiveParams] = useState<Params>({
    temperature: 25,
    pressure: 1.0,
    n2: 0,
    h2: 0,
    nh3: 0,
  });

  const [pendingParams, setPendingParams] = useState<Params>({
    temperature: 25,
    pressure: 1.0,
    n2: 0,
    h2: 0,
    nh3: 0,
  });

  const [currentConcentrations, setCurrentConcentrations] = useState({
    n2: 0,
    h2: 0,
    nh3: 0,
  });
  const [targetConcentrations, setTargetConcentrations] = useState({
    n2: 0,
    h2: 0,
    nh3: 0,
  });

  const [particles, setParticles] = useState({ n2: 0, h2: 0, nh3: 0 });
  const [particleTargets, setParticleTargets] = useState({
    n2: 0,
    h2: 0,
    nh3: 0,
  });

  const [isAtEquilibrium, setIsAtEquilibrium] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) => {
        const lerp = (a: number, b: number) => a + (b - a) * 0.15;
        const n2 = lerp(prev.n2, particleTargets.n2);
        const h2 = lerp(prev.h2, particleTargets.h2);
        const nh3 = lerp(prev.nh3, particleTargets.nh3);
        if (
          Math.abs(n2 - particleTargets.n2) < 0.5 &&
          Math.abs(h2 - particleTargets.h2) < 0.5 &&
          Math.abs(nh3 - particleTargets.nh3) < 0.5
        ) {
          return particleTargets;
        }
        return { n2: Math.round(n2), h2: Math.round(h2), nh3: Math.round(nh3) };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [particleTargets]);

  const [isPredicting, setIsPredicting] = useState(false);
  const [shiftState, setShiftState] = useState<ShiftDirection>(0);
  const [explanation, setExplanation] = useState(
    "Sistema yra pradinėje pusiausvyroje.",
  );

  const [predictionFeedback, setPredictionFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  const shiftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [shiftSettled, setShiftSettled] = useState(false);

  const hasChanged =
    activeParams.temperature !== pendingParams.temperature ||
    activeParams.pressure !== pendingParams.pressure ||
    activeParams.n2 !== pendingParams.n2 ||
    activeParams.h2 !== pendingParams.h2 ||
    activeParams.nh3 !== pendingParams.nh3;

  const [graphData, setGraphData] = useState<
    { time: number; nh3: number; n2: number; h2: number }[]
  >([]);
  const [annotations, setAnnotations] = useState<
    { time: number; text: string }[]
  >([]);
  const [timeStepper, setTimeStepper] = useState(0);
  const [firstApplyTime, setFirstApplyTime] = useState<number | null>(null);
  const [challengeLevel, setChallengeLevel] = useState(0);
  const [showChallenges, setShowChallenges] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const [visibleLines, setVisibleLines] = useState({
    n2: true,
    h2: true,
    nh3: true,
  });

  const getYAxisMax = () => {
    const minYAxisMax = 14;
    const allValues = graphData.flatMap((d) => [d.nh3, d.n2, d.h2]);
    const maxConcentration = Math.max(
      pendingParams.nh3,
      pendingParams.n2,
      pendingParams.h2,
      ...allValues,
    );
    const roundedMax =
      maxConcentration > 0
        ? Math.ceil((maxConcentration * 1.1) / 2) * 2
        : minYAxisMax;
    return Math.max(minYAxisMax, roundedMax);
  };

  const yAxisMax = getYAxisMax();

  const getYAxisTicks = (max: number) => {
    const ticks: number[] = [];
    const step = max <= 14 ? 2 : max > 30 ? 5 : 2;
    for (let i = 0; i <= max; i += step) {
      ticks.push(i);
    }
    return ticks;
  };

  const yAxisTicks = getYAxisTicks(yAxisMax);

  const calculateYield = (params: Params): number => {
    const pressureEffect = 1 - Math.exp(-params.pressure * 0.06);
    const tempK = params.temperature + 273.15;
    const tempEffect = Math.exp(-0.003 * (tempK - 573));
    const totalReagent = params.n2 + params.h2;
    const concEffect = 1 - Math.exp(-totalReagent * 0.15);
    const productPenalty = Math.exp(-params.nh3 * 0.2);
    const rawYield =
      pressureEffect * tempEffect * concEffect * productPenalty * 100;
    return Math.min(100, Math.max(0, rawYield));
  };

  const currentYield = calculateYield(pendingParams);

  const targetConcRef = useRef(targetConcentrations);
  targetConcRef.current = targetConcentrations;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStepper((t) => t + 1);
      setCurrentConcentrations((prev) => {
        const target = targetConcRef.current;
        const lerp = (a: number, b: number) => {
          const diff = b - a;
          if (Math.abs(diff) < 0.01) return b;
          return a + diff * 0.15;
        };
        const next = {
          n2: lerp(prev.n2, target.n2),
          h2: lerp(prev.h2, target.h2),
          nh3: lerp(prev.nh3, target.nh3),
        };
        const converged =
          Math.abs(next.n2 - target.n2) < 0.05 &&
          Math.abs(next.h2 - target.h2) < 0.05 &&
          Math.abs(next.nh3 - target.nh3) < 0.05;
        if (converged) {
          setShiftState(0);
          setIsAtEquilibrium(true);
        } else {
          setIsAtEquilibrium(false);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentYieldRef = useRef(currentYield);
  currentYieldRef.current = currentYield;
  const currentConcRef = useRef(currentConcentrations);
  currentConcRef.current = currentConcentrations;
  const targetConcRef2 = useRef(targetConcentrations);
  targetConcRef2.current = targetConcentrations;

  useEffect(() => {
    const target = targetConcRef2.current;
    const cur = currentConcentrations;
    const converged =
      Math.abs(cur.n2 - target.n2) < 0.05 &&
      Math.abs(cur.h2 - target.h2) < 0.05 &&
      Math.abs(cur.nh3 - target.nh3) < 0.05;
    if (converged && hasApplied) {
      setShiftSettled(true);
    } else {
      setShiftSettled(false);
    }
  }, [currentConcentrations, hasApplied]);

  useEffect(() => {
    setGraphData((prev) => {
      const newData = [
        ...prev,
        {
          time: timeStepper,
          nh3: currentConcRef.current.nh3,
          n2: currentConcRef.current.n2,
          h2: currentConcRef.current.h2,
        },
      ];
      return newData;
    });
  }, [timeStepper]);

  const calculateShift = (
    oldP: Params,
    newP: Params,
  ): { shift: ShiftDirection; expl: string } => {
    const dT = newP.temperature - oldP.temperature;
    const dP = newP.pressure - oldP.pressure;
    const dN2 = newP.n2 - oldP.n2;
    const dH2 = newP.h2 - oldP.h2;
    const dNH3 = newP.nh3 - oldP.nh3;

    type Factor = { score: number; expl: string };
    const factors: Factor[] = [];

    if (Math.abs(dT) > 0.1) {
      factors.push({
        score: dT > 0 ? -Math.abs(dT) / 100 : Math.abs(dT) / 100,
        expl:
          dT > 0
            ? "Temperatūros padidinimas: egzoterminė reakcija — sistema siekia absorbuoti šilumą, pusiausvyra slenkasi į kairę (reagentus)."
            : "Temperatūros sumažinimas: sistema siekia išskirti šilumą, pusiausvyra slenkasi į dešinę (produktus – NH₃).",
      });
    }

    if (Math.abs(dP) > 0.05) {
      factors.push({
        score: dP > 0 ? Math.abs(dP) / 10 : -Math.abs(dP) / 10,
        expl:
          dP > 0
            ? "Slėgio padidinimas: sistema siekia sumažinti tūrį, pusiausvyra slenkasi į mažiau molių pusę — į dešinę (NH₃)."
            : "Slėgio sumažinimas: sistema siekia padidinti tūrį, pusiausvyra slenkasi į daugiau molių pusę — į kairę (N₂, H₂).",
      });
    }

    if (Math.abs(dN2) > 0.05) {
      factors.push({
        score: dN2 > 0 ? Math.abs(dN2) : -Math.abs(dN2),
        expl:
          dN2 > 0
            ? "Pridėjus N₂ (reagento), sistema stengiasi jį sunaudoti — pusiausvyra slenkasi į dešinę (NH₃)."
            : "Sumažinus N₂, sistema stengiasi jį atstatyti — pusiausvyra slenkasi į kairę.",
      });
    }
    if (Math.abs(dH2) > 0.05) {
      factors.push({
        score: dH2 > 0 ? Math.abs(dH2) : -Math.abs(dH2),
        expl:
          dH2 > 0
            ? "Pridėjus H₂ (reagento), sistema stengiasi jį sunaudoti — pusiausvyra slenkasi į dešinę (NH₃)."
            : "Sumažinus H₂, sistema stengiasi jį atstatyti — pusiausvyra slenkasi į kairę.",
      });
    }
    if (Math.abs(dNH3) > 0.05) {
      factors.push({
        score: dNH3 > 0 ? -Math.abs(dNH3) : Math.abs(dNH3),
        expl:
          dNH3 > 0
            ? "Pridėjus NH₃ (produkto), sistema stengiasi jį sunaudoti — pusiausvyra slenkasi į kairę (reagentus)."
            : "Sumažinus NH₃, sistema stengiasi jį atstatyti — pusiausvyra slenkasi į dešinę.",
      });
    }

    if (factors.length === 0) {
      return { shift: 0, expl: "Nežymūs pokyčiai nepažeidžia pusiausvyros." };
    }

    const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
    const dominant = factors.reduce((best, f) =>
      Math.abs(f.score) > Math.abs(best.score) ? f : best,
    );

    if (Math.abs(totalScore) < 0.01) {
      return {
        shift: 0,
        expl: "Pokyčiai kompensuoja vienas kitą — pusiausvyra lieka nepakitusi.",
      };
    }

    const shift: ShiftDirection = totalScore > 0 ? 1 : -1;
    const multiChangeNote =
      factors.length > 1
        ? ` (Įvertinti ${factors.length} veiksniai; dominuojantis efektas apsprendžia kryptį.)`
        : "";

    return { shift, expl: dominant.expl + multiChangeNote };
  };

  const handleApplyClick = () => {
    setIsPredicting(true);
  };

  const handlePredict = (predictedDirection: ShiftDirection) => {
    setIsPredicting(false);
    setPredictionFeedback(null);

    const { shift, expl } = calculateShift(activeParams, pendingParams);

    const correct = predictedDirection === shift;
    setPredictionFeedback({
      correct,
      message: correct
        ? "Teisingai! Jūs sėkmingai pritaikėte Le Šateljė principą."
        : `Neteisingai. Tikrasis poslinkis buvo ${shift === 1 ? "į produktus" : shift === -1 ? "į reagentus" : "nepakitęs"}.`,
    });

    if (correct && shift !== 0) {
      completeActivity("pusiausvyra", 15);
    }

    if (correct) {
      setChallengeLevel((prev) => {
        const newYield = calculateYield(pendingParams);
        if (prev === 0 && newYield >= 90 && pendingParams.temperature <= 25)
          return 1;
        if (prev === 1 && newYield >= 95) return 2;
        if (prev === 2 && pendingParams.temperature >= 500) return 3;
        return prev;
      });
    }

    setShiftState(shift);
    setIsAtEquilibrium(false);
    setHasApplied(true);
    setFirstApplyTime((prev) => (prev === null ? timeStepper : prev));

    setCurrentConcentrations({
      n2: pendingParams.n2,
      h2: pendingParams.h2,
      nh3: pendingParams.nh3,
    });

    let targetN2 = pendingParams.n2;
    let targetH2 = pendingParams.h2;
    let targetNH3 = pendingParams.nh3;

    if (shift === 1) {
      const x_max = Math.min(pendingParams.n2, pendingParams.h2 / 3);
      const x = x_max * 0.4;
      targetN2 = Math.max(0, pendingParams.n2 - x);
      targetH2 = Math.max(0, pendingParams.h2 - 3 * x);
      targetNH3 = pendingParams.nh3 + 2 * x + 0.1;
    } else if (shift === -1) {
      const y_max = pendingParams.nh3 / 2;
      const y = y_max * 0.4;
      targetN2 = pendingParams.n2 + y + 0.1;
      targetH2 = pendingParams.h2 + 3 * y + 0.3;
      targetNH3 = Math.max(0, pendingParams.nh3 - 2 * y);
    }

    setTargetConcentrations({ n2: targetN2, h2: targetH2, nh3: targetNH3 });

    setPendingParams((p) => ({
      ...p,
      n2: parseFloat(targetN2.toFixed(1)),
      h2: parseFloat(targetH2.toFixed(1)),
      nh3: parseFloat(targetNH3.toFixed(1)),
    }));

    setActiveParams({
      ...pendingParams,
      n2: parseFloat(targetN2.toFixed(1)),
      h2: parseFloat(targetH2.toFixed(1)),
      nh3: parseFloat(targetNH3.toFixed(1)),
    });

    setExplanation(expl);

    setParticleTargets(() => {
      const scale = 40;
      if (shift === 1) {
        const nh3Boost = pendingParams.nh3 < activeParams.nh3 ? 30 : 0;
        return {
          n2: Math.max(10, Math.round(pendingParams.n2 * scale * 0.6)),
          h2: Math.max(20, Math.round(pendingParams.h2 * scale * 0.6)),
          nh3: Math.max(
            15,
            Math.min(150, Math.round(pendingParams.nh3 * scale * 2) + nh3Boost),
          ),
        };
      }
      if (shift === -1) {
        const nh3Penalty = pendingParams.nh3 > activeParams.nh3 ? -20 : 0;
        return {
          n2: Math.min(120, Math.round(pendingParams.n2 * scale * 1.5)),
          h2: Math.min(300, Math.round(pendingParams.h2 * scale * 1.5)),
          nh3: Math.max(
            5,
            Math.round(pendingParams.nh3 * scale * 0.4) + nh3Penalty,
          ),
        };
      }
      return {
        n2: Math.max(10, Math.round(pendingParams.n2 * scale)),
        h2: Math.max(20, Math.round(pendingParams.h2 * scale)),
        nh3: Math.max(5, Math.round(pendingParams.nh3 * scale)),
      };
    });

    {
      const dT = pendingParams.temperature - activeParams.temperature;
      const dP = pendingParams.pressure - activeParams.pressure;
      const dN2 = pendingParams.n2 - activeParams.n2;
      const dH2 = pendingParams.h2 - activeParams.h2;
      const dNH3 = pendingParams.nh3 - activeParams.nh3;

      const allAnnotations: { time: number; text: string }[] = [];

      if (Math.abs(dT) > 0)
        allAnnotations.push({
          time: timeStepper,
          text:
            dT > 0 ? `Padidinta temp. (+${dT}°C)` : `Sumažinta temp. (${dT}°C)`,
        });
      if (Math.abs(dP) > 0)
        allAnnotations.push({
          time: timeStepper,
          text:
            dP > 0
              ? `Padidintas slėgis (+${dP.toFixed(1)} atm)`
              : `Sumažintas slėgis (${dP.toFixed(1)} atm)`,
        });
      if (Math.abs(dN2) > 0)
        allAnnotations.push({
          time: timeStepper,
          text:
            dN2 > 0
              ? `Pridėta N₂ (+${dN2.toFixed(1)} M)`
              : `Sumažinta N₂ (${dN2.toFixed(1)} M)`,
        });
      if (Math.abs(dH2) > 0)
        allAnnotations.push({
          time: timeStepper,
          text:
            dH2 > 0
              ? `Pridėta H₂ (+${dH2.toFixed(1)} M)`
              : `Sumažinta H₂ (${dH2.toFixed(1)} M)`,
        });
      if (Math.abs(dNH3) > 0)
        allAnnotations.push({
          time: timeStepper,
          text:
            dNH3 > 0
              ? `Pridėta NH₃ (+${dNH3.toFixed(1)} M)`
              : `Sumažinta NH₃ (${dNH3.toFixed(1)} M)`,
        });

      if (allAnnotations.length > 0) {
        setAnnotations((prev) => [...prev, ...allAnnotations]);
      }
    }

    if (shiftTimeoutRef.current) clearTimeout(shiftTimeoutRef.current);
    shiftTimeoutRef.current = setTimeout(() => setShiftState(0), 4000);
  };

  useEffect(() => {
    return () => {
      if (shiftTimeoutRef.current) clearTimeout(shiftTimeoutRef.current);
    };
  }, []);

  const annotatedPoints = annotations.filter(
    (e) => firstApplyTime === null || e.time >= firstApplyTime,
  );

  return (
    <div className="space-y-6">
      <PredictiveCheckpoint
        isOpen={isPredicting}
        onCancel={() => setIsPredicting(false)}
        onPredict={handlePredict}
        temperatureChange={pendingParams.temperature - activeParams.temperature}
        pressureChange={pendingParams.pressure - activeParams.pressure}
        n2Change={pendingParams.n2 - activeParams.n2}
        h2Change={pendingParams.h2 - activeParams.h2}
        nh3Change={pendingParams.nh3 - activeParams.nh3}
      />

      <div className="glass-card p-6 border-blue-500/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-white">Amoniako sintezė</h3>
            </div>
            <p className="text-sm text-slate-400">
              Trimatė 3D kinetinė molekulių vizualizacija
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!shiftSettled && !hasApplied ? (
              <motion.div
                key="equilibrium"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 font-bold px-4 py-2 rounded-full border shadow-lg bg-green-500/10 text-green-400 border-green-500/30"
              >
                <ArrowLeftRight size={18} /> SISTEMA PUSIAUSVYROJE
              </motion.div>
            ) : shiftSettled ? (
              <motion.div
                key="new-equilibrium"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 font-bold px-4 py-2 rounded-full border shadow-lg bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30"
              >
                <CheckCircle size={18} /> NAUJA PUSIAUSVYRA PASIEKTA
              </motion.div>
            ) : (
              <motion.div
                key="shifting"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 font-bold px-4 py-2 rounded-full border shadow-lg bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              >
                <Activity size={18} className="animate-pulse" />
                {shiftState > 0 && <>VYKSTA POSLINKIS → Į PRODUKTUS (NH₃)</>}
                {shiftState < 0 && (
                  <>VYKSTA POSLINKIS ← Į REAGENTUS (N₂ + H₂)</>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <LeChatelier3D
          temperature={activeParams.temperature}
          volume={1 / activeParams.pressure}
          n2Count={particles.n2}
          h2Count={particles.h2}
          nh3Count={particles.nh3}
        />

        <div className="mt-4 p-4 rounded-xl bg-brand-darker border border-blue-500/10">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
            <span className="text-brand-cyan">Reagentai (N₂ + H₂)</span>
            <span className="text-slate-400">Pusiausvyros balansas</span>
            <span className="text-blue-400">Produktai (NH₃)</span>
          </div>
          <div className="relative w-full h-5 rounded-full overflow-hidden bg-brand-dark border border-white/10">
            {(() => {
              const total =
                currentConcentrations.n2 +
                currentConcentrations.h2 +
                currentConcentrations.nh3;
              const reagentPct =
                total > 0
                  ? ((currentConcentrations.n2 + currentConcentrations.h2) /
                      total) *
                    100
                  : 50;
              return (
                <>
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-brand-cyan to-brand-cyan/60"
                    animate={{ width: `${reagentPct}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 0.8 }}
                  />
                  <motion.div
                    className="absolute right-0 top-0 h-full bg-gradient-to-l from-blue-500 to-blue-500/60"
                    animate={{ width: `${100 - reagentPct}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 0.8 }}
                  />
                </>
              );
            })()}
            <div className="absolute left-1/2 top-0 h-full w-px bg-white/30" />
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
            <span>
              N₂: {currentConcentrations.n2.toFixed(1)} M &nbsp; H₂:{" "}
              {currentConcentrations.h2.toFixed(1)} M
            </span>
            <span>NH₃: {currentConcentrations.nh3.toFixed(1)} M</span>
          </div>
        </div>

        <div className="mt-3 p-4 rounded-xl bg-brand-darker border border-blue-500/10 flex flex-col items-center justify-center text-center gap-2">
          {predictionFeedback && (
            <div
              className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-full ${predictionFeedback.correct ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
            >
              {predictionFeedback.correct ? (
                <CheckCircle size={14} />
              ) : (
                <XCircle size={14} />
              )}
              {predictionFeedback.message}
            </div>
          )}
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            {explanation}
          </p>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="glass-card p-3 border-brand-orange/20 relative group">
          <div className="flex flex-col gap-1.5 mb-1">
            <div className="flex justify-between items-center">
              <h4 className="text-[9px] font-bold text-white uppercase tracking-wide">
                TEMP. (°C)
              </h4>
              <span className="text-xs font-mono text-brand-orange">
                {pendingParams.temperature}
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="700"
            step="25"
            value={pendingParams.temperature}
            onChange={(e) =>
              setPendingParams((p) => ({
                ...p,
                temperature: parseInt(e.target.value),
              }))
            }
            className="w-full relative z-20 accent-brand-orange"
          />
          <div className="flex justify-between w-full px-1 mt-1">
            <span className="text-[9px] text-slate-500 font-mono">0</span>
            <span className="text-[9px] text-slate-500 font-mono">350</span>
            <span className="text-[9px] text-slate-500 font-mono">700</span>
          </div>
        </div>

        <div className="glass-card p-3 border-emerald-500/20 relative group">
          <div className="flex flex-col gap-1.5 mb-1">
            <div className="flex justify-between items-center">
              <h4 className="text-[9px] font-bold text-white uppercase tracking-wide">
                SLĖGIS (atm)
              </h4>
              <span className="text-xs font-mono text-emerald-400">
                {pendingParams.pressure.toFixed(1)}
              </span>
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={pendingParams.pressure}
            onChange={(e) =>
              setPendingParams((p) => ({
                ...p,
                pressure: parseFloat(e.target.value),
              }))
            }
            className="w-full relative z-20 accent-emerald-500"
          />
          <div className="flex justify-between w-full px-1 mt-1">
            <span className="text-[9px] text-slate-500 font-mono">1</span>
            <span className="text-[9px] text-slate-500 font-mono">25.5</span>
            <span className="text-[9px] text-slate-500 font-mono">50</span>
          </div>
        </div>

        <div className="glass-card p-3 border-blue-500/20 relative group">
          <div className="flex flex-col gap-1.5 mb-1">
            <div className="flex justify-between items-center">
              <h4 className="text-[9px] font-bold text-white uppercase tracking-wide">
                AZOTAS [N₂]
              </h4>
              <span className="text-xs font-mono text-blue-400">
                {pendingParams.n2.toFixed(1)}
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max={Math.max(20, Math.ceil(pendingParams.n2 / 5) * 5 + 5)}
            step="0.5"
            value={pendingParams.n2}
            onChange={(e) =>
              setPendingParams((p) => ({
                ...p,
                n2: parseFloat(e.target.value),
              }))
            }
            className="w-full relative z-20 accent-blue-500"
          />
          {(() => {
            const sliderMax = Math.max(
              20,
              Math.ceil(pendingParams.n2 / 5) * 5 + 5,
            );
            return (
              <div className="flex justify-between w-full px-1 mt-1">
                <span className="text-[9px] text-slate-500 font-mono">0</span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {sliderMax / 2}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {sliderMax}
                </span>
              </div>
            );
          })()}
        </div>

        <div className="glass-card p-3 border-slate-400/20 relative group">
          <div className="flex flex-col gap-1.5 mb-1">
            <div className="flex justify-between items-center">
              <h4 className="text-[9px] font-bold text-white uppercase tracking-wide">
                VANDENILIS [H₂]
              </h4>
              <span className="text-xs font-mono text-slate-300">
                {pendingParams.h2.toFixed(1)}
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max={Math.max(20, Math.ceil(pendingParams.h2 / 5) * 5 + 5)}
            step="0.5"
            value={pendingParams.h2}
            onChange={(e) =>
              setPendingParams((p) => ({
                ...p,
                h2: parseFloat(e.target.value),
              }))
            }
            className="w-full relative z-20 accent-slate-400"
          />
          {(() => {
            const sliderMax = Math.max(
              20,
              Math.ceil(pendingParams.h2 / 5) * 5 + 5,
            );
            return (
              <div className="flex justify-between w-full px-1 mt-1">
                <span className="text-[9px] text-slate-500 font-mono">0</span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {sliderMax / 2}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {sliderMax}
                </span>
              </div>
            );
          })()}
        </div>

        <div className="glass-card p-3 border-[#8b5cf6]/20 relative group">
          <div className="flex flex-col gap-1.5 mb-1">
            <div className="flex justify-between items-center">
              <h4 className="text-[9px] font-bold text-white uppercase tracking-wide">
                AMONIAKAS [NH₃]
              </h4>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setPendingParams((p) => ({ ...p, nh3: 0 }))}
                className="px-2 py-0.5 text-[8px] font-bold uppercase rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0 whitespace-nowrap"
              >
                Pašalinti
              </button>
              <span className="text-xs font-mono text-[#8b5cf6]">
                {pendingParams.nh3.toFixed(1)}
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max={Math.max(20, Math.ceil(pendingParams.nh3 / 5) * 5 + 5)}
            step="0.5"
            value={pendingParams.nh3}
            onChange={(e) =>
              setPendingParams((p) => ({
                ...p,
                nh3: parseFloat(e.target.value),
              }))
            }
            className="w-full relative z-20 accent-[#8b5cf6]"
          />
          {(() => {
            const sliderMax = Math.max(
              20,
              Math.ceil(pendingParams.nh3 / 5) * 5 + 5,
            );
            return (
              <div className="flex justify-between w-full px-1 mt-1">
                <span className="text-[9px] text-slate-500 font-mono">0</span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {sliderMax / 2}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {sliderMax}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6">
        <div className="glass-card p-4 border-brand-orange/20 flex flex-col h-[520px] w-full">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="text-brand-orange" />
            <div>
              <h3 className="text-lg font-bold text-white">
                Proceso eigos grafikas
              </h3>
              <p className="text-[10px] text-slate-400">
                Reagentų ir produkto koncentracijų kitimai amoniako sintezės
                metu
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-3 justify-center">
            <button
              onClick={() =>
                setVisibleLines((prev) => ({ ...prev, n2: !prev.n2 }))
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                visibleLines.n2
                  ? "bg-[#3b82f6]/10 border-[#3b82f6]/50 text-[#3b82f6]"
                  : "bg-transparent border-slate-700/50 text-slate-500 hover:border-slate-500"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-sm ${
                  visibleLines.n2 ? "bg-[#3b82f6]" : "bg-slate-600"
                }`}
              />
              N₂
            </button>
            <button
              onClick={() =>
                setVisibleLines((prev) => ({ ...prev, h2: !prev.h2 }))
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                visibleLines.h2
                  ? "bg-[#cbd5e1]/10 border-[#cbd5e1]/50 text-[#cbd5e1]"
                  : "bg-transparent border-slate-700/50 text-slate-500 hover:border-slate-500"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-sm ${
                  visibleLines.h2 ? "bg-[#cbd5e1]" : "bg-slate-600"
                }`}
              />
              H₂
            </button>
            <button
              onClick={() =>
                setVisibleLines((prev) => ({ ...prev, nh3: !prev.nh3 }))
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                visibleLines.nh3
                  ? "bg-[#8b5cf6]/10 border-[#8b5cf6]/50 text-[#8b5cf6]"
                  : "bg-transparent border-slate-700/50 text-slate-500 hover:border-slate-500"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-sm ${
                  visibleLines.nh3 ? "bg-[#8b5cf6]" : "bg-slate-600"
                }`}
              />
              NH₃
            </button>
          </div>

          <div className="flex-1 w-full relative min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={
                  firstApplyTime !== null
                    ? graphData
                        .filter((d) => d.time >= firstApplyTime)
                        .map((d) => ({
                          ...d,
                          relativeTime: d.time - firstApplyTime,
                        }))
                    : [{ relativeTime: 0, time: 0, n2: 0, h2: 0, nh3: 0 }]
                }
                margin={{ top: 30, right: 20, bottom: 25, left: 60 }}
              >
                <defs>
                  <marker
                    id="arrowXEnd"
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                  </marker>
                  <marker
                    id="arrowYEnd"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="0"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 10 L 5 0 L 10 10 z" fill="#cbd5e1" />
                  </marker>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.15)"
                  vertical={false}
                />
                <XAxis
                  dataKey="relativeTime"
                  stroke="#94a3b8"
                  type="number"
                  domain={[0, "auto"]}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{
                    stroke: "#94a3b8",
                    markerEnd: "url(#arrowXEnd)",
                  }}
                  tickLine={false}
                  allowDecimals={false}
                  tickFormatter={(val) => (val === 0 ? "" : val)}
                  label={{
                    value: "Laikas, s",
                    position: "insideBottomRight",
                    offset: -5,
                    fill: "#94a3b8",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  stroke="#cbd5e1"
                  domain={[0, yAxisMax]}
                  ticks={yAxisTicks}
                  type="number"
                  allowDecimals={true}
                  tick={{ fill: "#cbd5e1", fontSize: 11 }}
                  axisLine={{
                    stroke: "#cbd5e1",
                    markerEnd: "url(#arrowYEnd)",
                  }}
                  tickLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                  tickFormatter={(val) => val.toFixed(1)}
                  label={{
                    value: "Koncentracija, M",
                    angle: -90,
                    position: "insideLeft",
                    offset: 5,
                    fill: "#cbd5e1",
                    fontSize: 12,
                    dx: -8,
                    dy: -10,
                  }}
                />
                {firstApplyTime !== null && (
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === "nh3")
                        return [
                          Number(value).toFixed(1) + " M",
                          "NH₃ koncentracija",
                        ];
                      if (name === "n2")
                        return [
                          Number(value).toFixed(1) + " M",
                          "N₂ koncentracija",
                        ];
                      if (name === "h2")
                        return [
                          Number(value).toFixed(1) + " M",
                          "H₂ koncentracija",
                        ];
                      return [value, String(name)];
                    }}
                    labelFormatter={(val) => "Laikas: " + val + " s"}
                  />
                )}

                {visibleLines.n2 && (
                  <Line
                    type="monotone"
                    dataKey="n2"
                    stroke={firstApplyTime !== null ? "#3b82f6" : "transparent"}
                    strokeWidth={firstApplyTime !== null ? 1.5 : 0}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                )}
                {visibleLines.h2 && (
                  <Line
                    type="monotone"
                    dataKey="h2"
                    stroke={firstApplyTime !== null ? "#cbd5e1" : "transparent"}
                    strokeWidth={firstApplyTime !== null ? 1.5 : 0}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                )}
                {visibleLines.nh3 && (
                  <Line
                    type="monotone"
                    dataKey="nh3"
                    stroke={firstApplyTime !== null ? "#8b5cf6" : "transparent"}
                    strokeWidth={firstApplyTime !== null ? 2 : 0}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                )}

                {/* Orange annotation lines for each applied change */}
                {firstApplyTime !== null &&
                  (() => {
                    const groups = new Map<
                      number,
                      { time: number; text: string }[]
                    >();
                    annotations.forEach((entry) => {
                      const key = entry.time - firstApplyTime;
                      if (!groups.has(key)) groups.set(key, []);
                      groups.get(key)!.push(entry);
                    });

                    return Array.from(groups.entries()).flatMap(
                      ([relTime, group]) =>
                        group.map((entry, groupIndex) => (
                          <ReferenceLine
                            key={`annotation-${entry.time}-${groupIndex}`}
                            x={relTime}
                            stroke="#f59e0b"
                            strokeDasharray="4 3"
                            strokeWidth={1.5}
                            label={{
                              value: entry.text,
                              position: "insideTopLeft",
                              fill: "#f59e0b",
                              fontSize: 10,
                              fontWeight: 600,
                              offset: 5,
                              dy: groupIndex * 16,
                            }}
                          />
                        )),
                    );
                  })()}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {hasApplied && (
        <IndustrialDashboard
          temperature={pendingParams.temperature}
          pressure={pendingParams.pressure}
          yieldPercentage={calculateYield(pendingParams)}
        />
      )}

      <AnimatePresence>
        {hasChanged && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex justify-center mt-6"
          >
            <button
              onClick={handleApplyClick}
              className="group relative flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              <Play size={20} className="relative z-10" />
              <span className="relative z-10 tracking-wider uppercase text-sm">
                Pritaikyti pokytį
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-card p-6 border-brand-cyan/20 h-auto w-full mt-6">
        <button
          onClick={() => setShowChallenges(!showChallenges)}
          className="flex w-full items-center gap-2 hover:bg-white/5 p-2 rounded-lg transition-colors text-left focus:outline-none"
          title="Spustelėkite norėdami atidaryti / uždaryti iššūkius"
        >
          <Target className="text-brand-cyan" />
          <h3 className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
            Iššūkiai
          </h3>
          <div className="ml-auto text-slate-400">
            {showChallenges ? "▲" : "▼"}
          </div>
        </button>
        <AnimatePresence>
          {showChallenges && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 pt-4 overflow-hidden"
            >
              {challengeLevel >= 0 && (
                <div
                  className={`p-4 rounded-xl border transition-colors ${
                    challengeLevel > 0
                      ? "bg-green-500/10 border-green-500/50"
                      : "bg-brand-dark/50 border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {challengeLevel > 0 ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        challengeLevel > 0 ? "text-green-400" : "text-slate-200"
                      }`}
                    >
                      1. Padidink amoniako išeigą iki 90%, nekeisdamas
                      temperatūros.
                    </span>
                  </div>
                </div>
              )}
              {challengeLevel >= 1 && (
                <div
                  className={`p-4 rounded-xl border transition-colors ${
                    challengeLevel > 1
                      ? "bg-green-500/10 border-green-500/50"
                      : "bg-brand-dark/50 border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {challengeLevel > 1 ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        challengeLevel > 1 ? "text-green-400" : "text-slate-200"
                      }`}
                    >
                      2. Rask optimaliausią slėgio ir temperatūros santykį
                      maksimaliai gamybai.
                    </span>
                  </div>
                </div>
              )}
              {challengeLevel >= 2 && (
                <div
                  className={`p-4 rounded-xl border transition-colors ${
                    challengeLevel > 2
                      ? "bg-green-500/10 border-green-500/50"
                      : "bg-brand-dark/50 border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {challengeLevel > 2 ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        challengeLevel > 2 ? "text-green-400" : "text-slate-200"
                      }`}
                    >
                      3. Stebėk, kas nutinka išeigai, kai staigiai pakeli
                      temperatūrą. Kodėl grafikas krenta?
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
