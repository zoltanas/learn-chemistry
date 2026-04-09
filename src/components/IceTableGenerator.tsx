"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Lightbulb,
  Check,
  X,
  RotateCcw,
  Eye,
  EyeOff,
  Play,
} from "lucide-react";
import {
  solveHaberICE,
  calculateHaberKc,
  IceResult,
} from "@/lib/thermodynamics";

/* ──────────────────────────────────────────────
 *  Types
 * ────────────────────────────────────────────── */

interface IceTableProps {
  temperature: number;
  initialN2: number;
  initialH2: number;
  initialNH3: number;
  onEquilibriumCalculated?: (result: IceResult, kc: number) => void;
}

type Mode = "interactive" | "reference";

/* ──────────────────────────────────────────────
 *  Helper: parse a numeric string input
 * ────────────────────────────────────────────── */

function parseInput(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = parseFloat(raw.replace(",", "."));
  return isNaN(n) ? null : n;
}

/* ──────────────────────────────────────────────
 *  Helper: format a signed value with proper sign
 * ────────────────────────────────────────────── */

function formatSigned(val: number, decimals = 3): string {
  const abs = Math.abs(val).toFixed(decimals);
  return val >= 0 ? `+${abs}` : `−${abs}`;
}

/* ──────────────────────────────────────────────
 *  Helper: format for display
 * ────────────────────────────────────────────── */

const F = (v: number) => v.toFixed(3);

/* ──────────────────────────────────────────────
 *  Main Component
 * ────────────────────────────────────────────── */

export default function IceTableGenerator({
  temperature,
  initialN2,
  initialH2,
  initialNH3,
  onEquilibriumCalculated,
}: IceTableProps) {
  // ── Mode toggle ──
  const [mode, setMode] = useState<Mode>("interactive");

  // ── Reference (auto) computation ──
  const [refResult, setRefResult] = useState<IceResult | null>(null);
  const [refKc, setRefKc] = useState(0);

  useEffect(() => {
    const kc = calculateHaberKc(temperature);
    const res = solveHaberICE(initialN2, initialH2, initialNH3, kc);
    setRefKc(kc);
    setRefResult(res);
    if (onEquilibriumCalculated) onEquilibriumCalculated(res, kc);
  }, [temperature, initialN2, initialH2, initialNH3, onEquilibriumCalculated]);

  // ── Interactive state ──
  // User-entered values for each cell
  const [inputInitialN2, setInputInitialN2] = useState("");
  const [inputInitialH2, setInputInitialH2] = useState("");
  const [inputInitialNH3, setInputInitialNH3] = useState("");

  // x value — user tries to solve for it
  const [inputX, setInputX] = useState("");
  const [step, setStep] = useState<"initial" | "change" | "equilibrium">(
    "initial",
  );

  // ── Step 2 interactive Kc expression builder state ──
  const [kNumExpr, setKNumExpr] = useState(""); // numerator expression tile (e.g. "[NH₃]")
  const [kNumPow, setKNumPow] = useState(""); // numerator exponent
  const [kDen1Expr, setKDen1Expr] = useState(""); // denominator tile 1 (e.g. "[N₂]")
  const [kDen1Pow, setKDen1Pow] = useState(""); // denominator tile 1 exponent
  const [kDen2Expr, setKDen2Expr] = useState(""); // denominator tile 2 (e.g. "[H₂]")
  const [kDen2Pow, setKDen2Pow] = useState(""); // denominator tile 2 exponent
  const [kInputVal, setKInputVal] = useState(""); // student-entered Kc value

  const [step2Phase, setStep2Phase] = useState<
    "build" | "solve" | "changes" | "equation" | "x-solve"
  >("build");
  const [kValChecked, setKValChecked] = useState(false); // tracks if Kc value was checked

  // ── Table fill state: tracks which rows have been "earned" ──
  const [tableHasInitial, setTableHasInitial] = useState(false);
  const [tableHasChanges, setTableHasChanges] = useState(false);
  const [tableHasEquilibrium, setTableHasEquilibrium] = useState(false);

  // ── Step 2d: x value (auto-calculated) ──
  const [autoX, setAutoX] = useState<number | null>(null);
  const [showX, setShowX] = useState(false);

  // ── Step 2c: Change expressions for each substance ──
  const [changeN2, setChangeN2] = useState(""); // e.g. "-x"
  const [changeH2, setChangeH2] = useState(""); // e.g. "-3x"
  const [changeNH3, setChangeNH3] = useState(""); // e.g. "+2x"

  // ── Step 2d: Full Kc equation with values ──
  const [eqNumExpr, setEqNumExpr] = useState(""); // e.g. "0.0+2x"
  const [eqNumPow, setEqNumPow] = useState(""); // e.g. "2"
  const [eqDen1Expr, setEqDen1Expr] = useState(""); // e.g. "1.0-x"
  const [eqDen1Pow, setEqDen1Pow] = useState(""); // e.g. "1"
  const [eqDen2Expr, setEqDen2Expr] = useState(""); // e.g. "3.0-3x"
  const [eqDen2Pow, setEqDen2Pow] = useState(""); // e.g. "3"
  const [eqKcVal, setEqKcVal] = useState(""); // e.g. "0.040"

  // ── Step 3: Equilibrium concentration inputs ──
  const [inputEqN2, setInputEqN2] = useState("");
  const [inputEqH2, setInputEqH2] = useState("");
  const [inputEqNH3, setInputEqNH3] = useState("");

  // ── Step 3a: Concentration change inputs ──
  const [inputDeltaN2, setInputDeltaN2] = useState("");
  const [inputDeltaH2, setInputDeltaH2] = useState("");
  const [inputDeltaNH3, setInputDeltaNH3] = useState("");

  // ── Step 3 phase ──
  const [step3Phase, setStep3Phase] = useState<"changes" | "equilibrium">(
    "changes",
  );

  // Validation state
  type Validation = "idle" | "correct" | "wrong" | "hint";
  const [valInitial, setValInitial] = useState<Validation>("idle");
  const [valChange, setValChange] = useState<Validation>("idle");
  const [valEquilibrium, setValEquilibrium] = useState<Validation>("idle");

  // Student-specific ICE result based on their Step 1 inputs
  const studentInitialN2 = parseInput(inputInitialN2);
  const studentInitialH2 = parseInput(inputInitialH2);
  const studentInitialNH3 = parseInput(inputInitialNH3);
  const studentResult =
    studentInitialN2 !== null &&
    studentInitialH2 !== null &&
    studentInitialNH3 !== null
      ? solveHaberICE(
          studentInitialN2,
          studentInitialH2,
          studentInitialNH3,
          refKc,
        )
      : null;

  // Show/hide correct answer
  const [showAnswer, setShowAnswer] = useState(false);

  // ── Reset validation when parent sliders change ──
  useEffect(() => {
    setInputInitialN2("");
    setInputInitialH2("");
    setInputInitialNH3("");
    resetValidation();
  }, [initialN2, initialH2, initialNH3]);

  function resetValidation() {
    setInputX("");
    setStep("initial");
    setValInitial("idle");
    setValChange("idle");
    setValEquilibrium("idle");
    setShowAnswer(false);
    setKNumExpr("");
    setKNumPow("");
    setKDen1Expr("");
    setKDen1Pow("");
    setKDen2Expr("");
    setKDen2Pow("");
    setKInputVal("");
    setStep2Phase("build");
    setKValChecked(false);
    setChangeN2("");
    setChangeH2("");
    setChangeNH3("");
    setEqNumExpr("");
    setEqNumPow("");
    setEqDen1Expr("");
    setEqDen1Pow("");
    setEqDen2Expr("");
    setEqDen2Pow("");
    setEqKcVal("");
    setTableHasInitial(false);
    setTableHasChanges(false);
    setTableHasEquilibrium(false);
    setInputEqN2("");
    setInputEqH2("");
    setInputEqNH3("");
    setInputDeltaN2("");
    setInputDeltaH2("");
    setInputDeltaNH3("");
    setStep3Phase("changes");
    setValEquilibrium("idle");
    setAutoX(null);
    setShowX(false);
  }

  // Check Step 2a: Kc expression builder
  function checkKcExpression() {
    const numOk = kNumExpr === "[NH₃]" && kNumPow === "2";
    const denOk =
      (kDen1Expr === "[N₂]" && (kDen1Pow === "" || kDen1Pow === "1")) ||
      (kDen2Expr === "[N₂]" && (kDen2Pow === "" || kDen2Pow === "1"));
    const denOk2 =
      (kDen2Expr === "[H₂]" && kDen2Pow === "3") ||
      (kDen1Expr === "[H₂]" && kDen1Pow === "3");

    if (numOk && denOk && denOk2) {
      setStep2Phase("solve");
      setKValChecked(false);
      setValChange("idle");
    } else {
      setValChange("wrong");
    }
  }

  // Check Step 2b: Kc value entry
  function checkKcValue() {
    const kc = parseInput(kInputVal);
    if (kc === null) {
      setValChange("wrong");
      setKValChecked(true);
      return;
    }
    const tol = refKc * 0.1 + 0.001;
    if (Math.abs(kc - refKc) < tol) {
      setKValChecked(true);
      setStep2Phase("changes");
      setValChange("idle");
    } else {
      setValChange("wrong");
      setKValChecked(true);
    }
  }

  // Check Step 2c: Change expressions
  function checkChangeExpressions() {
    // Normalize: accept "-x", "-1x", "−x", "-  x", "+2x", "+ 2x"
    const norm = (s: string) =>
      s.replace("−", "-").replace(/\s+/g, "").toLowerCase();
    const n2 = norm(changeN2);
    const h2 = norm(changeH2);
    const nh3 = norm(changeNH3);

    // Accept "-x" or "-1x"
    const n2Ok = n2 === "-x" || n2 === "-1x";
    // Accept "-3x"
    const h2Ok = h2 === "-3x";
    // Accept "+2x"
    const nh3Ok = nh3 === "+2x";

    if (n2Ok && h2Ok && nh3Ok) {
      setStep2Phase("equation");
    } else {
      setValChange("wrong");
    }
  }

  // Check Step 2d: Full Kc equation with student's values
  function checkEquation() {
    const norm = (s: string) =>
      s.replace("−", "-").replace(/\s+/g, "").replace(",", ".");
    const num = norm(eqNumExpr);
    const den1 = norm(eqDen1Expr);
    const den2 = norm(eqDen2Expr);
    const numP = norm(eqNumPow);
    const den1P = norm(eqDen1Pow);
    const den2P = norm(eqDen2Pow);

    const numHasX = num.includes("x");
    const den1HasX = den1.includes("x");
    const den2HasX = den2.includes("x");
    const numPowOk = numP === "2";
    const denPowOk =
      ((den1P === "" || den1P === "1") && den2P === "3") ||
      (den1P === "3" && (den2P === "" || den2P === "1"));
    const kOk =
      parseInput(eqKcVal) !== null &&
      Math.abs(parseInput(eqKcVal)! - refKc) < 0.002;

    if (numHasX && den1HasX && den2HasX && numPowOk && denPowOk && kOk) {
      // Auto-calculate x and show it
      setAutoX(studentResult ? studentResult.x : null);
      setShowX(true);
      setValChange("idle");
    } else {
      setValChange("wrong");
    }
  }

  // ── Validation helpers ──

  const checkInitial = useCallback(() => {
    const iN2 = parseInput(inputInitialN2);
    const iH2 = parseInput(inputInitialH2);
    const iNH3 = parseInput(inputInitialNH3);
    if (iN2 === null || iH2 === null || iNH3 === null) {
      setValInitial("wrong");
      return;
    }
    const tol = 0.01;
    const ok =
      Math.abs(iN2 - initialN2) < tol &&
      Math.abs(iH2 - initialH2) < tol &&
      Math.abs(iNH3 - initialNH3) < tol;
    setValInitial(ok ? "correct" : "wrong");
    if (ok) {
      setStep("change");
      setTableHasInitial(true);
    }
  }, [
    inputInitialN2,
    inputInitialH2,
    inputInitialNH3,
    initialN2,
    initialH2,
    initialNH3,
  ]);

  const checkChange = useCallback(() => {
    if (!studentResult) return;
    const x = parseInput(inputX);
    if (x === null) {
      setValChange("wrong");
      return;
    }
    const tol = 0.02;
    const ok = Math.abs(x - studentResult.x) < tol;
    setValChange(ok ? "correct" : "wrong");
    if (ok) setStep("equilibrium");
  }, [studentResult, inputX]);

  // Check Step 3a: Concentration changes
  function checkConcentrationChanges() {
    if (!studentResult) return;
    const dN2 = parseInput(inputDeltaN2);
    const dH2 = parseInput(inputDeltaH2);
    const dNH3 = parseInput(inputDeltaNH3);
    if (dN2 === null || dH2 === null || dNH3 === null) {
      setValEquilibrium("wrong");
      return;
    }
    const tol = 0.02;
    const ok =
      Math.abs(dN2 - -studentResult.x) < tol &&
      Math.abs(dH2 - -3 * studentResult.x) < tol &&
      Math.abs(dNH3 - 2 * studentResult.x) < tol;
    if (ok) {
      setStep3Phase("equilibrium");
      setValEquilibrium("idle");
    } else {
      setValEquilibrium("wrong");
    }
  }

  const checkEquilibrium = useCallback(() => {
    if (!studentResult) {
      setValEquilibrium("idle");
      return;
    }
    const eqN2 = parseInput(inputEqN2);
    const eqH2 = parseInput(inputEqH2);
    const eqNH3 = parseInput(inputEqNH3);
    if (eqN2 === null || eqH2 === null || eqNH3 === null) {
      setValEquilibrium("wrong");
      return;
    }
    const tol = 0.05;
    const ok =
      Math.abs(eqN2 - studentResult.finalA) < tol &&
      Math.abs(eqH2 - studentResult.finalB) < tol &&
      Math.abs(eqNH3 - studentResult.finalC) < tol;
    setValEquilibrium(ok ? "correct" : "wrong");
    if (ok) {
      setTableHasEquilibrium(true);
      setTableHasChanges(true);
    }
  }, [studentResult, inputEqN2, inputEqH2, inputEqNH3]);

  // ── Color helpers ──
  function valBorder(v: Validation) {
    if (v === "correct")
      return "border-green-400/60 shadow-sm shadow-green-400/10";
    if (v === "wrong") return "border-red-400/60 shadow-sm shadow-red-400/10";
    return "border-white/10";
  }
  function valBadge(v: Validation) {
    if (v === "correct") return "text-green-400";
    if (v === "wrong") return "text-red-400";
    return "";
  }

  // ── Render ──

  return (
    <div className="glass-card p-6 border-white/10">
      {/* ── Header with mode toggle ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Calculator size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Koncentracijų lentelė
            </h3>
            <p className="text-xs text-slate-400">
              N₂ + 3H₂ ⇌ 2NH₃
              {mode === "interactive" && " — Interaktyvus sprendimas"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <button
            onClick={() => {
              if (mode === "interactive") {
                setMode("reference");
                setShowAnswer(false);
                resetValidation();
              } else {
                setMode("interactive");
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                       bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            {mode === "interactive" ? (
              <>
                <EyeOff size={13} /> Parodyti sprendimą
              </>
            ) : (
              <>
                <Play size={13} /> Spręsti pačiam
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Kc & Shift Info ── */}
      {refResult && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-800/40 p-3 rounded-xl border border-white/5">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">
              K<sub>c</sub> ({temperature}°C)
            </span>
            <span className="text-lg font-mono font-bold text-brand-purple">
              {refKc.toFixed(4)}
            </span>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-xl border border-white/5">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1">
              Poslinkis
            </span>
            <span
              className={`text-lg font-bold ${
                refResult.shiftContext.includes("Dešinėn")
                  ? "text-green-400"
                  : refResult.shiftContext.includes("Kairėn")
                    ? "text-red-400"
                    : "text-cyan-400"
              }`}
            >
              {refResult.shiftContext.split(" ")[0]}
            </span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
       *  INTERACTIVE MODE
       * ════════════════════════════════════════ */}
      {mode === "interactive" && (
        <div className="space-y-4">
          {/* ── Step indicators ── */}
          <div className="flex items-center gap-2 text-xs">
            {[
              { key: "initial" as const, label: "1. Pradinės" },
              { key: "change" as const, label: "2. Pokytis (x)" },
              { key: "equilibrium" as const, label: "3. Pusiausvyra" },
            ].map((s) => (
              <span
                key={s.key}
                className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                  step === s.key
                    ? "bg-brand-green/20 text-green-400"
                    : step === "change" && s.key === "initial"
                      ? "bg-green-400/10 text-green-400/60 line-through"
                      : step === "equilibrium" &&
                          (s.key === "initial" || s.key === "change")
                        ? "bg-green-400/10 text-green-400/60 line-through"
                        : "bg-white/5 text-slate-500"
                }`}
              >
                {s.label}
              </span>
            ))}
            <button
              onClick={resetValidation}
              className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Pradėti iš naujo"
            >
              <RotateCcw size={11} /> Iš naujo
            </button>
          </div>

          {/* ── Step 1: Initial concentrations ── */}
          {step === "initial" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/30 rounded-xl p-4 border border-white/10"
            >
              <p className="text-sm text-slate-300 mb-3 font-semibold">
                Žingsnis 1: Įveskite pradines koncentracijas (mol/L)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-blue-400 font-bold uppercase tracking-wider block mb-1">
                    [N₂]₀
                  </label>
                  <input
                    type="text"
                    value={inputInitialN2}
                    onChange={(e) => setInputInitialN2(e.target.value)}
                    className={`w-full bg-slate-900/80 text-white text-center font-mono py-2 px-3 rounded-lg border ${valBorder(valInitial)} focus:outline-none focus:ring-2 focus:ring-brand-green/40 transition-colors`}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-200 font-bold uppercase tracking-wider block mb-1">
                    [H₂]₀
                  </label>
                  <input
                    type="text"
                    value={inputInitialH2}
                    onChange={(e) => setInputInitialH2(e.target.value)}
                    className={`w-full bg-slate-900/80 text-white text-center font-mono py-2 px-3 rounded-lg border ${valBorder(valInitial)} focus:outline-none focus:ring-2 focus:ring-brand-green/40 transition-colors`}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-brand-purple font-bold uppercase tracking-wider block mb-1">
                    [NH₃]₀
                  </label>
                  <input
                    type="text"
                    value={inputInitialNH3}
                    onChange={(e) => setInputInitialNH3(e.target.value)}
                    className={`w-full bg-slate-900/80 text-white text-center font-mono py-2 px-3 rounded-lg border ${valBorder(valInitial)} focus:outline-none focus:ring-2 focus:ring-brand-green/40 transition-colors`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={checkInitial}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-green/20 text-green-400 hover:bg-brand-green/30 font-semibold text-sm transition-colors"
                >
                  <Check size={14} /> Tikrinti
                </button>
                {valInitial === "wrong" && (
                  <span className="text-red-400 text-xs">
                    ✗ Neteisinga — pasitikrinkite reikšmes iš slankiklių
                  </span>
                )}
                {valInitial === "correct" && (
                  <span className="text-green-400 text-xs">
                    ✓ Teisingai! Dabar apskaičiuokite pokytį x.
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Interactive Kc expression builder ── */}
          {step === "change" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/30 rounded-xl p-4 border border-white/10 space-y-5"
            >
              <p className="text-sm text-slate-300 font-semibold">
                Žingsnis 2: Sudarykite K<sub>c</sub> išraišką
              </p>

              {/* ── Phase "build": drag tiles into the fraction ── */}
              {step2Phase === "build" && (
                <>
                  {/* Available tiles */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
                      Turimos medžiagos (spustelėkite, tada spustelėkite vietą)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["[N₂]", "[H₂]", "[NH₃]"].map((t) => {
                        const used = [kNumExpr, kDen1Expr, kDen2Expr].includes(
                          t,
                        );
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              if (!kNumExpr) setKNumExpr(t);
                              else if (!kDen1Expr && t !== kNumExpr)
                                setKDen1Expr(t);
                              else if (
                                !kDen2Expr &&
                                t !== kNumExpr &&
                                t !== kDen1Expr
                              )
                                setKDen2Expr(t);
                            }}
                            disabled={used}
                            className={`px-4 py-2 rounded-lg font-mono font-bold text-sm transition-all ${
                              used
                                ? "bg-slate-800/30 text-slate-600 cursor-not-allowed opacity-30"
                                : "bg-brand-purple/15 text-brand-purple hover:bg-brand-purple/25 cursor-pointer"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                      {/* Clear buttons */}
                      <div className="flex gap-1.5 ml-auto">
                        {kNumExpr && (
                          <button
                            onClick={() => {
                              setKNumExpr("");
                              setKNumPow("");
                            }}
                            className="px-2 py-1 rounded bg-red-400/10 text-red-400 text-xs hover:bg-red-400/20"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fraction builder */}
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-lg font-bold text-slate-300 font-mono">
                      K<sub>c</sub> =
                    </span>
                    {/* Numerator */}
                    <div className="flex flex-col items-center">
                      <div className="relative inline-flex items-center">
                        <button
                          onClick={() => {
                            if (kNumExpr) setKNumExpr("");
                          }}
                          className={`min-w-[70px] text-center font-mono font-bold text-sm py-2 px-3 rounded-lg border-2 border-dashed transition-all ${
                            kNumExpr
                              ? "border-brand-purple/40 bg-brand-purple/10 text-brand-purple"
                              : "border-white/10 text-slate-600 hover:border-white/20"
                          }`}
                        >
                          {kNumExpr || "?"}
                        </button>
                        <input
                          type="text"
                          value={kNumPow}
                          onChange={(e) => setKNumPow(e.target.value)}
                          placeholder="n"
                          className="absolute -top-2 -right-2 w-7 h-7 text-center bg-slate-900 text-white font-mono text-[11px] rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 placeholder:text-slate-600"
                        />
                      </div>
                      <div className="h-px bg-brand-purple/50 w-full mt-1" />
                    </div>

                    <span className="text-slate-500 font-mono text-lg">÷</span>

                    {/* Denom 1 */}
                    <div className="flex flex-col items-center">
                      <div className="relative inline-flex items-center">
                        <button
                          onClick={() => {
                            if (kDen1Expr) setKDen1Expr("");
                          }}
                          className={`min-w-[70px] text-center font-mono font-bold text-sm py-2 px-3 rounded-lg border-2 border-dashed transition-all ${
                            kDen1Expr
                              ? "border-brand-purple/40 bg-brand-purple/10 text-brand-purple"
                              : "border-white/10 text-slate-600 hover:border-white/20"
                          }`}
                        >
                          {kDen1Expr || "?"}
                        </button>
                        <input
                          type="text"
                          value={kDen1Pow}
                          onChange={(e) => setKDen1Pow(e.target.value)}
                          placeholder="n"
                          className="absolute -top-2 -right-2 w-7 h-7 text-center bg-slate-900 text-white font-mono text-[11px] rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 placeholder:text-slate-600"
                        />
                      </div>
                      <div className="h-px bg-brand-purple/50 w-full mt-1" />
                    </div>

                    <span className="text-slate-500 font-mono text-lg">·</span>

                    {/* Denom 2 */}
                    <div className="flex flex-col items-center">
                      <div className="relative inline-flex items-center">
                        <button
                          onClick={() => {
                            if (kDen2Expr) setKDen2Expr("");
                          }}
                          className={`min-w-[70px] text-center font-mono font-bold text-sm py-2 px-3 rounded-lg border-2 border-dashed transition-all ${
                            kDen2Expr
                              ? "border-brand-purple/40 bg-brand-purple/10 text-brand-purple"
                              : "border-white/10 text-slate-600 hover:border-white/20"
                          }`}
                        >
                          {kDen2Expr || "?"}
                        </button>
                        <input
                          type="text"
                          value={kDen2Pow}
                          onChange={(e) => setKDen2Pow(e.target.value)}
                          placeholder="n"
                          className="absolute -top-2 -right-2 w-7 h-7 text-center bg-slate-900 text-white font-mono text-[11px] rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 placeholder:text-slate-600"
                        />
                      </div>
                      <div className="h-px bg-brand-purple/50 w-full mt-1" />
                    </div>
                  </div>

                  {/* Check expression */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={checkKcExpression}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-green/20 text-green-400 hover:bg-brand-green/30 font-semibold text-sm transition-colors"
                    >
                      <Check size={14} /> Tikrinti išraišką
                    </button>
                    {valChange === "wrong" && step2Phase === "build" && (
                      <span className="text-red-400 text-xs">
                        ✗ Neteisinga — peržiūrėkite Haberio reakciją: N₂ + 3H₂ ⇌
                        2NH₃
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* ── Phase "solve": enter Kc value ── */}
              {step2Phase === "solve" && (
                <>
                  {/* Show built expression as reference */}
                  <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-300 font-mono leading-relaxed">
                    <p className="text-slate-400 mb-1">
                      Jūsų sudaryta K<sub>c</sub> išraiška:
                    </p>
                    <p className="text-brand-purple font-bold text-sm">
                      K<sub>c</sub> = {kNumExpr}
                      {kNumPow && kNumPow !== "1" && <sup>{kNumPow}</sup>} / (
                      {kDen1Expr}
                      {kDen1Pow && kDen1Pow !== "1" && (
                        <sup>{kDen1Pow}</sup>
                      )} · {kDen2Expr}
                      {kDen2Pow && kDen2Pow !== "1" && <sup>{kDen2Pow}</sup>})
                    </p>
                  </div>

                  {/* Enter Kc value */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
                      Įveskite K<sub>c</sub> reikšmę (apskaičiuotą iš Van 't
                      Hoff lygties, {temperature}°C)
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-32">
                        <label className="text-[11px] text-brand-purple font-bold uppercase tracking-wider block mb-1">
                          K<sub>c</sub> = ?
                        </label>
                        <input
                          type="text"
                          value={kInputVal}
                          onChange={(e) => setKInputVal(e.target.value)}
                          placeholder="pvz. 0.040"
                          className={`w-full bg-slate-900/80 text-white font-mono text-center py-2 px-3 rounded-lg border ${valBorder(valChange)} focus:outline-none focus:ring-2 focus:ring-brand-purple/40 transition-colors placeholder:text-slate-600`}
                        />
                      </div>
                      <button
                        onClick={checkKcValue}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30 font-semibold text-sm transition-colors"
                      >
                        <Check size={14} /> Tikrinti K<sub>c</sub>
                      </button>
                    </div>
                    {kValChecked && valChange === "wrong" && kInputVal && (
                      <span className="text-red-400 text-xs mt-1 block">
                        ✗ Neteisinga — patikrinkite Van 't Hoff skaičiavimą
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* ── Phase "changes": enter change expressions ── */}
              {step2Phase === "changes" && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300 font-semibold">
                      Dabar įrašykite kiekvienos medžiagos pokyčio išraišką
                    </p>
                    {/* Hint icon for all 3 */}
                    <div className="group relative">
                      <button className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zM8.75 4.5v4a.75.75 0 01-1.5 0v-4a.75.75 0 011.5 0z" />
                        </svg>
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-800 border border-white/10 rounded-lg p-3 text-xs text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                        <p className="font-semibold text-slate-200 mb-1">
                          Formatas:
                        </p>
                        <p className="font-mono">Δ = ± koeficientas · x</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* N₂ change */}
                    <div>
                      <label className="text-[11px] text-blue-400 font-bold uppercase tracking-wider block mb-1">
                        Δ[N₂] = ?
                      </label>
                      <input
                        type="text"
                        value={changeN2}
                        onChange={(e) => setChangeN2(e.target.value)}
                        className="w-full bg-slate-900/80 text-white font-mono text-center py-2 px-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
                      />
                    </div>
                    {/* H₂ change */}
                    <div>
                      <label className="text-[11px] text-slate-200 font-bold uppercase tracking-wider block mb-1">
                        Δ[H₂] = ?
                      </label>
                      <input
                        type="text"
                        value={changeH2}
                        onChange={(e) => setChangeH2(e.target.value)}
                        className="w-full bg-slate-900/80 text-white font-mono text-center py-2 px-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
                      />
                    </div>
                    {/* NH₃ change */}
                    <div>
                      <label className="text-[11px] text-brand-purple font-bold uppercase tracking-wider block mb-1">
                        Δ[NH₃] = ?
                      </label>
                      <input
                        type="text"
                        value={changeNH3}
                        onChange={(e) => setChangeNH3(e.target.value)}
                        className="w-full bg-slate-900/80 text-white font-mono text-center py-2 px-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={checkChangeExpressions}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-green/20 text-green-400 hover:bg-brand-green/30 font-semibold text-sm transition-colors"
                    >
                      <Check size={14} /> Tikrinti pokyčius
                    </button>
                    {valChange === "wrong" &&
                      changeN2 &&
                      changeH2 &&
                      changeNH3 && (
                        <span className="text-red-400 text-xs">
                          ✗ Neteisinga — pagalvokite apie stechiometrinius
                          koeficientus: N₂ + 3H₂ ⇌ 2NH₃
                        </span>
                      )}
                    {valChange === "correct" && (
                      <span className="text-green-400 text-xs">
                        ✓ Teisingai! Dabar sprendžiame x.
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* ── Phase "equation": fill in full Kc equation with values ── */}
              {step2Phase === "equation" && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300 font-semibold">
                      Dabar užpildykite visą K<sub>c</sub> lygtį su jūsų
                      reikšmėmis
                    </p>
                    {/* Info icon */}
                    <div className="group relative">
                      <button className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zM8.75 4.5v4a.75.75 0 01-1.5 0v-4a.75.75 0 011.5 0z" />
                        </svg>
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 w-56 bg-slate-800 border border-white/10 rounded-lg p-3 text-xs text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                        <p className="font-semibold text-slate-200 mb-1">
                          Formatas:
                        </p>
                        <p className="font-mono">
                          (reikšmė ± išraiška)ⁿ / [(reikšmė ± išraiška)ⁿ ·
                          (reikšmė ± išraiška)ⁿ] = K<sub>c</sub>
                        </p>
                        <p className="text-slate-500 mt-1">
                          Laipsnio rodiklį rašykite atskirame mažame langelyje
                          virš skliaustų.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fraction-style equation builder */}
                  <div className="bg-slate-900/50 rounded-lg p-6 flex items-center justify-center gap-4">
                    {/* Kc = */}
                    <span className="text-lg font-bold text-slate-300 font-mono">
                      K<sub>c</sub> =
                    </span>

                    {/* Fraction: numerator over bar over denominator */}
                    <div className="flex flex-col items-center">
                      {/* Numerator row */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative inline-flex items-center">
                          <input
                            type="text"
                            value={eqNumExpr}
                            onChange={(e) => setEqNumExpr(e.target.value)}
                            className="min-w-[100px] text-center bg-slate-900/80 text-white font-mono text-sm py-2 px-4 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                          />
                          <input
                            type="text"
                            value={eqNumPow}
                            onChange={(e) => setEqNumPow(e.target.value)}
                            className="absolute -top-2 -right-2 w-7 h-7 text-center bg-slate-900 text-white font-mono text-[11px] rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                          />
                        </div>
                      </div>

                      {/* Fraction bar */}
                      <div className="h-0.5 bg-brand-purple/60 w-full" />

                      {/* Denominator row */}
                      <div className="flex items-center gap-2 mt-2">
                        {/* Denom 1 */}
                        <div className="relative inline-flex items-center">
                          <input
                            type="text"
                            value={eqDen1Expr}
                            onChange={(e) => setEqDen1Expr(e.target.value)}
                            className="min-w-[100px] text-center bg-slate-900/80 text-white font-mono text-sm py-2 px-4 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                          />
                          <input
                            type="text"
                            value={eqDen1Pow}
                            onChange={(e) => setEqDen1Pow(e.target.value)}
                            className="absolute -top-2 -right-2 w-7 h-7 text-center bg-slate-900 text-white font-mono text-[11px] rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                          />
                        </div>

                        <span className="text-slate-500 font-mono text-lg">
                          ·
                        </span>

                        {/* Denom 2 */}
                        <div className="relative inline-flex items-center">
                          <input
                            type="text"
                            value={eqDen2Expr}
                            onChange={(e) => setEqDen2Expr(e.target.value)}
                            className="min-w-[100px] text-center bg-slate-900/80 text-white font-mono text-sm py-2 px-4 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                          />
                          <input
                            type="text"
                            value={eqDen2Pow}
                            onChange={(e) => setEqDen2Pow(e.target.value)}
                            className="absolute -top-2 -right-2 w-7 h-7 text-center bg-slate-900 text-white font-mono text-[11px] rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                          />
                        </div>
                      </div>
                    </div>

                    {/* = Kc */}
                    <span className="text-slate-500 font-mono text-lg ml-4">
                      =
                    </span>
                    <input
                      type="text"
                      value={eqKcVal}
                      onChange={(e) => setEqKcVal(e.target.value)}
                      className="w-24 text-center bg-slate-900/80 text-white font-mono text-sm py-2 px-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {!showX && (
                      <button
                        onClick={checkEquation}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-green/20 text-green-400 hover:bg-brand-green/30 font-semibold text-sm transition-colors"
                      >
                        <Check size={14} /> Tikrinti lygtį
                      </button>
                    )}
                    {showX && autoX !== null && (
                      <>
                        <div className="bg-brand-green/10 border border-brand-green/30 rounded-lg px-4 py-2 text-center">
                          <p className="text-xs text-slate-400 mb-1">
                            Apskaičiuota x vertė:
                          </p>
                          <p className="text-xl font-bold text-brand-green font-mono">
                            x = {autoX.toFixed(4)} M
                          </p>
                        </div>
                        <button
                          onClick={() => setStep("equilibrium")}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-green/20 text-green-400 hover:bg-brand-green/30 font-semibold text-sm transition-colors"
                        >
                          Tęsti →
                        </button>
                      </>
                    )}
                    {valChange === "wrong" &&
                      eqNumExpr &&
                      eqDen1Expr &&
                      eqDen2Expr && (
                        <span className="text-red-400 text-xs">
                          ✗ Neteisinga — patikrinkite reikšmes ir laipsnius
                        </span>
                      )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── Step 3: Equilibrium ── */}
          {step === "equilibrium" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/30 rounded-xl p-4 border border-white/10"
            >
              {/* Phase 1: Calculate concentration changes */}
              {step3Phase === "changes" && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-300 font-semibold">
                      Žingsnis 3: Apskaičiuokite koncentracijų pokyčius
                    </p>
                    <div className="group relative">
                      <button className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zM8.75 4.5v4a.75.75 0 01-1.5 0v-4a.75.75 0 011.5 0z" />
                        </svg>
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 w-56 bg-slate-800 border border-white/10 rounded-lg p-3 text-xs text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                        <p className="font-semibold text-slate-200 mb-1">
                          Formulė:
                        </p>
                        <p className="font-mono text-[11px]">
                          Δ = ± koeficientas · x
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Show x value and expressions */}
                  <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
                      Žingsnyje 2 apskaičiuota x reikšmė:
                    </p>
                    <p className="text-center font-mono text-lg text-brand-green font-bold">
                      x = {studentResult ? studentResult.x.toFixed(4) : "—"} M
                    </p>
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/5">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                          Δ[N₂]
                        </p>
                        <p className="font-mono text-sm text-blue-400">
                          {changeN2 || "—x"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                          Δ[H₂]
                        </p>
                        <p className="font-mono text-sm text-slate-300">
                          {changeH2 || "—3x"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                          Δ[NH₃]
                        </p>
                        <p className="font-mono text-sm text-brand-purple">
                          {changeNH3 || "+2x"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-blue-400 font-bold uppercase tracking-wider block mb-1">
                        Δ[N₂] = ?
                      </label>
                      <input
                        type="text"
                        value={inputDeltaN2}
                        onChange={(e) => setInputDeltaN2(e.target.value)}
                        placeholder="pvz. −0.8717"
                        className="w-full bg-slate-900/80 text-white font-mono text-center py-2 px-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/40 placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-200 font-bold uppercase tracking-wider block mb-1">
                        Δ[H₂] = ?
                      </label>
                      <input
                        type="text"
                        value={inputDeltaH2}
                        onChange={(e) => setInputDeltaH2(e.target.value)}
                        placeholder="pvz. −2.6151"
                        className="w-full bg-slate-900/80 text-white font-mono text-center py-2 px-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/40 placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-brand-purple font-bold uppercase tracking-wider block mb-1">
                        Δ[NH₃] = ?
                      </label>
                      <input
                        type="text"
                        value={inputDeltaNH3}
                        onChange={(e) => setInputDeltaNH3(e.target.value)}
                        placeholder="pvz. +1.7434"
                        className="w-full bg-slate-900/80 text-white font-mono text-center py-2 px-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/40 placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={checkConcentrationChanges}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-green/20 text-green-400 hover:bg-brand-green/30 font-semibold text-sm transition-colors"
                    >
                      <Check size={14} /> Tikrinti pokyčius
                    </button>
                    {valEquilibrium === "wrong" &&
                      inputDeltaN2 &&
                      inputDeltaH2 &&
                      inputDeltaNH3 && (
                        <span className="text-red-400 text-xs">
                          ✗ Neteisinga — patikrinkite: Δ = ± koeficientas · x
                        </span>
                      )}
                  </div>
                </>
              )}

              {/* Phase 2: Calculate equilibrium concentrations */}
              {step3Phase === "equilibrium" && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-300 font-semibold">
                      Dabar apskaičiuokite pusiausvyrąsias koncentracijas
                    </p>
                    <div className="group relative">
                      <button className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zM8.75 4.5v4a.75.75 0 01-1.5 0v-4a.75.75 0 011.5 0z" />
                        </svg>
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 w-56 bg-slate-800 border border-white/10 rounded-lg p-3 text-xs text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                        <p className="font-semibold text-slate-200 mb-1">
                          Formulė:
                        </p>
                        <p className="font-mono text-[11px]">
                          [pusiausvyrinė] = [pradinė] + Δ
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-blue-400 font-bold uppercase tracking-wider block mb-1">
                        [N₂]
                      </label>
                      <input
                        type="text"
                        value={inputEqN2}
                        onChange={(e) => setInputEqN2(e.target.value)}
                        className="w-full bg-slate-900/80 text-white font-mono text-center py-2 px-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-200 font-bold uppercase tracking-wider block mb-1">
                        [H₂]
                      </label>
                      <input
                        type="text"
                        value={inputEqH2}
                        onChange={(e) => setInputEqH2(e.target.value)}
                        className="w-full bg-slate-900/80 text-white font-mono text-center py-2 px-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-brand-purple font-bold uppercase tracking-wider block mb-1">
                        [NH₃]
                      </label>
                      <input
                        type="text"
                        value={inputEqNH3}
                        onChange={(e) => setInputEqNH3(e.target.value)}
                        className="w-full bg-slate-900/80 text-white font-mono text-center py-2 px-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={checkEquilibrium}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-green/20 text-green-400 hover:bg-brand-green/30 font-semibold text-sm transition-colors"
                    >
                      <Check size={14} /> Tikrinti pusiausvyrą
                    </button>
                    {valEquilibrium === "wrong" &&
                      inputEqN2 &&
                      inputEqH2 &&
                      inputEqNH3 && (
                        <span className="text-red-400 text-xs">
                          ✗ Neteisinga — patikrinkite: [pusiausvyrinė] =
                          [pradinė] + Δ
                        </span>
                      )}
                    {valEquilibrium === "correct" && (
                      <span className="text-green-400 text-xs">
                        ✓ Sveikinu! Jūs sėkmingai apskaičiavote ir užpildėte
                        lentelę!
                      </span>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── Concentracijų lentelė (visada matoma, pildosi žingsnis po žingsnio) ── */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs tracking-wider">
                  <th className="p-2.5 text-center">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider">
                      žingsnis
                    </span>
                  </th>
                  <th className="p-2.5 text-center">N₂ (M)</th>
                  <th className="p-2.5 text-center">H₂ (M)</th>
                  <th className="p-2.5 text-center">NH₃ (M)</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {/* Initial row */}
                <tr className="border-b border-white/5 bg-white/[0.03]">
                  <td className="p-2.5 text-center">
                    <span className="text-brand-orange font-bold text-base">
                      c
                    </span>
                    <sub className="text-slate-500 text-[9px]">pradinė</sub>
                  </td>
                  <td className="p-2.5 text-center text-slate-300">
                    {tableHasInitial && inputInitialN2 ? inputInitialN2 : "—"}
                  </td>
                  <td className="p-2.5 text-center text-slate-300">
                    {tableHasInitial && inputInitialH2 ? inputInitialH2 : "—"}
                  </td>
                  <td className="p-2.5 text-center text-slate-300">
                    {tableHasInitial && inputInitialNH3 ? inputInitialNH3 : "—"}
                  </td>
                </tr>

                {/* Change row */}
                <tr className="border-b border-white/5">
                  <td className="p-2.5 text-center">
                    <span className="text-brand-green font-bold text-base">
                      c
                    </span>
                    <sub className="text-slate-500 text-[9px]">pokytis</sub>
                  </td>
                  <td className="p-2.5 text-center text-slate-400">
                    {step3Phase === "equilibrium" && inputDeltaN2
                      ? `${changeN2} = ${parseInput(inputDeltaN2)?.toFixed(3) ?? "—"}`
                      : tableHasChanges
                        ? changeN2
                        : "—"}
                  </td>
                  <td className="p-2.5 text-center text-slate-400">
                    {step3Phase === "equilibrium" && inputDeltaH2
                      ? `${changeH2} = ${parseInput(inputDeltaH2)?.toFixed(3) ?? "—"}`
                      : tableHasChanges
                        ? changeH2
                        : "—"}
                  </td>
                  <td className="p-2.5 text-center text-slate-400">
                    {step3Phase === "equilibrium" && inputDeltaNH3
                      ? `${changeNH3} = ${parseInput(inputDeltaNH3)?.toFixed(3) ?? "—"}`
                      : tableHasChanges
                        ? changeNH3
                        : "—"}
                  </td>
                </tr>

                {/* Equilibrium row */}
                <tr
                  className={`${tableHasEquilibrium ? "bg-green-400/[0.04] border border-green-400/20" : "border-b border-white/5"} rounded`}
                >
                  <td className="p-2.5 text-center">
                    <span className="text-green-400 font-bold text-base">
                      c
                    </span>
                    <sub className="text-slate-500 text-[9px]">
                      pusiausvyrinė
                    </sub>
                  </td>
                  <td
                    className={`p-2.5 text-center ${tableHasEquilibrium ? "font-bold text-green-400" : "text-slate-600"}`}
                  >
                    {tableHasEquilibrium && studentResult
                      ? studentResult.finalA.toFixed(3)
                      : "—"}
                  </td>
                  <td
                    className={`p-2.5 text-center ${tableHasEquilibrium ? "font-bold text-green-400" : "text-slate-600"}`}
                  >
                    {tableHasEquilibrium && studentResult
                      ? studentResult.finalB.toFixed(3)
                      : "—"}
                  </td>
                  <td
                    className={`p-2.5 text-center ${tableHasEquilibrium ? "font-bold text-green-400" : "text-slate-600"}`}
                  >
                    {tableHasEquilibrium && studentResult
                      ? studentResult.finalC.toFixed(3)
                      : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
       *  REFERENCE MODE (auto solution)
       * ════════════════════════════════════════ */}
      {mode === "reference" && refResult && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs tracking-wider">
                    <th className="p-2.5 text-center">
                      <span className="text-slate-500 text-[10px] uppercase tracking-wider">
                        žingsnis
                      </span>
                    </th>
                    <th className="p-2.5 text-center">N₂ (M)</th>
                    <th className="p-2.5 text-center">H₂ (M)</th>
                    <th className="p-2.5 text-center">NH₃ (M)</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-slate-300">
                  {/* Initial */}
                  <tr className="border-b border-white/5 bg-white/[0.03]">
                    <td className="p-2.5 text-center">
                      <span className="text-brand-orange font-bold text-base">
                        c
                      </span>
                      <sub className="text-slate-500 text-[9px]">pradinė</sub>
                    </td>
                    <td className="p-2.5 text-center">
                      {initialN2.toFixed(3)}
                    </td>
                    <td className="p-2.5 text-center">
                      {initialH2.toFixed(3)}
                    </td>
                    <td className="p-2.5 text-center">
                      {initialNH3.toFixed(3)}
                    </td>
                  </tr>

                  {/* Change */}
                  <tr className="border-b border-white/5">
                    <td className="p-2.5 text-center">
                      <span className="text-brand-green font-bold text-base">
                        c
                      </span>
                      <sub className="text-slate-500 text-[9px]">pokytis</sub>
                    </td>
                    <td className="p-2.5 text-center text-slate-400">
                      {formatSigned(-refResult.x)}{" "}
                      <span className="text-[10px] opacity-50">(−x)</span>
                    </td>
                    <td className="p-2.5 text-center text-slate-400">
                      {formatSigned(-3 * refResult.x)}{" "}
                      <span className="text-[10px] opacity-50">(−3x)</span>
                    </td>
                    <td className="p-2.5 text-center text-brand-green">
                      {formatSigned(2 * refResult.x)}{" "}
                      <span className="text-[10px] opacity-50">(+2x)</span>
                    </td>
                  </tr>

                  {/* Equilibrium */}
                  <tr className="bg-green-400/[0.04]">
                    <td className="p-2.5 text-center">
                      <span className="text-green-400 font-bold text-base">
                        c
                      </span>
                      <sub className="text-slate-500 text-[9px]">
                        pusiausvyrinė
                      </sub>
                    </td>
                    <td className="p-2.5 text-center font-bold text-green-400">
                      {refResult.finalA.toFixed(3)}
                    </td>
                    <td className="p-2.5 text-center font-bold text-green-400">
                      {refResult.finalB.toFixed(3)}
                    </td>
                    <td className="p-2.5 text-center font-bold text-green-400">
                      {refResult.finalC.toFixed(3)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
              <span>
                x ={" "}
                <span className="text-white font-mono">
                  {refResult.x.toFixed(4)}
                </span>{" "}
                M
              </span>
              <span>•</span>
              <span>
                K<sub>c</sub> ={" "}
                <span className="text-brand-purple font-mono font-bold">
                  {refKc.toFixed(4)}
                </span>
              </span>
            </div>

            {/* Show answer toggle for interactive comparison */}
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 text-xs font-semibold transition-colors"
            >
              {showAnswer ? (
                <>
                  <EyeOff size={12} /> Slėpti
                </>
              ) : (
                <>
                  <Eye size={12} /> Parodyti su formulėmis
                </>
              )}
            </button>

            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 bg-slate-800/30 rounded-lg p-4 text-xs text-slate-300 font-mono space-y-1.5 leading-relaxed border border-white/5"
              >
                <p className="text-slate-400 font-sans font-semibold text-sm mb-2">
                  Sprendimo žingsniai:
                </p>
                <p>
                  1. K<sub className="relative top-1.5">c</sub> ={" "}
                  {refKc.toFixed(4)} (Van 't Hoff lygtis, {temperature}°C)
                </p>
                <p>
                  2. ({initialNH3.toFixed(1)} + 2x)² / [({initialN2.toFixed(1)}{" "}
                  − x) · ({initialH2.toFixed(1)} − 3x)³] = {refKc.toFixed(4)}
                </p>
                <p className="text-brand-green font-bold">
                  3. x ≈ {refResult.x.toFixed(4)} M (skaitinis sprendimas)
                </p>
                <p>
                  4. [N₂] = {initialN2} − {refResult.x.toFixed(4)} ={" "}
                  <span className="text-green-400 font-bold">
                    {refResult.finalA.toFixed(3)} M
                  </span>
                </p>
                <p>
                  4. [H₂] = {initialH2} − 3({refResult.x.toFixed(4)}) ={" "}
                  <span className="text-green-400 font-bold">
                    {refResult.finalB.toFixed(3)} M
                  </span>
                </p>
                <p>
                  4. [NH₃] = {initialNH3} + 2({refResult.x.toFixed(4)}) ={" "}
                  <span className="text-green-400 font-bold">
                    {refResult.finalC.toFixed(3)} M
                  </span>
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
