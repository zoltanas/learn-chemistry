"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface DraggableNumberProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  color?: string;
  unit?: string;
}

function DraggableNumber({
  value,
  onChange,
  min,
  max,
  step,
  label,
  color = "brand-cyan",
  unit,
}: DraggableNumberProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef({ y: 0, startVal: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      startRef.current = { y: e.clientY, startVal: value };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [value],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const deltaY = startRef.current.y - e.clientY;
      const sensitivity = step < 0.1 ? 0.5 : step < 1 ? 1 : 2;
      const deltaValue = deltaY * sensitivity * step;
      const newVal = Math.min(
        max,
        Math.max(min, startRef.current.startVal + deltaValue),
      );
      onChange(Number(newVal.toFixed(step < 1 ? 2 : step < 0.1 ? 3 : 0)));
    },
    [isDragging, min, max, step, onChange],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1 : -1;
      const newVal = Math.min(max, Math.max(min, value + direction * step));
      onChange(Number(newVal.toFixed(step < 1 ? 2 : step < 0.1 ? 3 : 0)));
    },
    [value, min, max, step, onChange],
  );

  const colorMap: Record<
    string,
    { border: string; text: string; bg: string; glow: string }
  > = {
    "brand-cyan": {
      border: "border-brand-cyan/30",
      text: "text-brand-cyan",
      bg: "bg-brand-cyan/5",
      glow: "shadow-brand-cyan/20",
    },
    "brand-purple": {
      border: "border-brand-purple/30",
      text: "text-brand-purple",
      bg: "bg-brand-purple/5",
      glow: "shadow-brand-purple/20",
    },
    slate: {
      border: "border-slate-500/30",
      text: "text-slate-300",
      bg: "bg-white/5",
      glow: "",
    },
  };

  const c = colorMap[color] || colorMap["brand-cyan"];

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-[10px] tracking-wider font-semibold ${c.text}`}>
        {label}
      </span>
      <div
        className={`
                    relative px-4 py-2 rounded-xl border backdrop-blur-xl cursor-ns-resize select-none
                    transition-all duration-150
                    ${c.border} ${c.bg}
                    ${isDragging ? `scale-110 shadow-lg ${c.glow} ${c.border.replace("/30", "/60")}` : "hover:scale-105"}
                `}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        title="Vilkite aukštyn/žemyn arba naudokite scroll"
      >
        <span className={`font-mono text-lg font-bold ${c.text}`}>{value}</span>
        {unit && (
          <span className="text-[10px] text-slate-500 ml-1">{unit}</span>
        )}
        {isDragging && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 whitespace-nowrap">
            ↕ vilkite
          </div>
        )}
      </div>
    </div>
  );
}

interface RateLawCalculatorProps {
  onCalculate?: (v: number) => void;
}

export default function RateLawCalculator({
  onCalculate,
}: RateLawCalculatorProps) {
  const [k, setK] = useState(0.1);
  const [A, setA] = useState(2.0);
  const [B, setB] = useState(1.5);
  const [m, setM] = useState(1);
  const [n, setN] = useState(2);

  const v = k * Math.pow(A, m) * Math.pow(B, n);

  // Visual scaling: font size and glow based on magnitude
  const logV = v > 0 ? Math.log10(v) : -2;
  const scaledFontSize = Math.min(Math.max(1.5, 1.8 + logV * 0.3), 3); // rem, clamped 1.5-3
  const glowIntensity = Math.min(Math.max(0, (logV + 2) / 4), 1); // 0-1

  return (
    <div className="glass-card p-6 border-brand-cyan/20 backdrop-blur-xl bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          Reakcijos greičio skaičiuoklė
        </h3>
        <div className="bg-brand-cyan/10 text-brand-cyan px-3 py-1 rounded-lg font-mono text-sm border border-brand-cyan/20">
          v = k · [A]ᵐ · [B]ⁿ
        </div>
      </div>

      {/* Draggable inputs */}
      <div className="flex flex-wrap items-end justify-center gap-3 mb-8">
        <DraggableNumber
          value={k}
          onChange={setK}
          min={0.01}
          max={5}
          step={0.01}
          label="k"
          color="slate"
        />
        <span className="text-slate-500 text-lg pb-2">·</span>
        <DraggableNumber
          value={A}
          onChange={setA}
          min={0.1}
          max={10}
          step={0.1}
          label="[A]"
          color="brand-cyan"
          unit="mol/l"
        />
        <div className="flex flex-col items-center">
          <DraggableNumber
            value={m}
            onChange={setM}
            min={0}
            max={3}
            step={1}
            label="m"
            color="brand-cyan"
          />
        </div>
        <span className="text-slate-500 text-lg pb-2">·</span>
        <DraggableNumber
          value={B}
          onChange={setB}
          min={0.1}
          max={10}
          step={0.1}
          label="[B]"
          color="brand-purple"
          unit="mol/l"
        />
        <div className="flex flex-col items-center">
          <DraggableNumber
            value={n}
            onChange={setN}
            min={0}
            max={3}
            step={1}
            label="n"
            color="brand-purple"
          />
        </div>
      </div>

      {/* Result with visual scaling */}
      <div className="bg-gradient-to-r from-brand-dark to-brand-card py-6 px-5 rounded-xl border border-white/5 backdrop-blur-xl">
        <div className="text-center leading-relaxed">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
            Reakcijos greitis (v)
          </p>
          <p className="font-mono text-sm text-slate-300 inline-flex items-center flex-wrap justify-center gap-x-1">
            <span>{k}</span>
            <span>·</span>
            <span>
              ({A})<sup className="text-xs">{m}</sup>
            </span>
            <span>·</span>
            <span>
              ({B})<sup className="text-xs">{n}</sup>
            </span>
            <span>=</span>
            <motion.span
              key={v.toFixed(4)}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple font-black leading-tight"
              style={{
                fontSize: `${scaledFontSize}rem`,
                filter: `drop-shadow(0 0 ${glowIntensity * 20}px rgba(6, 182, 212, ${glowIntensity * 0.5}))`,
              }}
            >
              {v.toFixed(4)}
            </motion.span>
            <span className="text-sm text-slate-500 font-normal tracking-normal">
              mol/(l·s)
            </span>
          </p>
        </div>

        {/* Step-by-step breakdown */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">
            Skaičiavimo žingsniai:
          </p>
          <p className="text-xs font-mono text-slate-400">
            1. [A]<sup>{m}</sup> = {A}
            <sup>{m}</sup> ={" "}
            <span className="text-brand-cyan">{Math.pow(A, m).toFixed(4)}</span>
          </p>
          <p className="text-xs font-mono text-slate-400">
            2. [B]<sup>{n}</sup> = {B}
            <sup>{n}</sup> ={" "}
            <span className="text-brand-purple">
              {Math.pow(B, n).toFixed(4)}
            </span>
          </p>
          <p className="text-xs font-mono text-slate-400">
            3. v = {k} × {Math.pow(A, m).toFixed(4)} ×{" "}
            {Math.pow(B, n).toFixed(4)} ={" "}
            <span className="text-white font-bold">{v.toFixed(4)}</span>{" "}
            mol/(l·s)
          </p>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-slate-600 text-center">
        💡 Vilkite skaičius aukštyn/žemyn arba naudokite pelės ratą
      </p>
    </div>
  );
}
