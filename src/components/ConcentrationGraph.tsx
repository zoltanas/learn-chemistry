"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { solveHaberICE, calculateHaberKc } from "@/lib/thermodynamics";

/* ── Custom axis lines with arrowheads at BOTH ends ── */
function XAxisArrows(props: any) {
  const { x, y, width } = props;
  const arrowSize = 12;
  return (
    <g>
      <line
        x1={x - arrowSize}
        y1={y}
        x2={x + width + arrowSize}
        y2={y}
        stroke="#94a3b8"
        strokeWidth={2}
      />
      {/* Left arrow */}
      <polygon
        points={`${x},${y - arrowSize / 2} ${x - arrowSize},${y} ${x},${y + arrowSize / 2}`}
        fill="#94a3b8"
      />
      {/* Right arrow */}
      <polygon
        points={`${x + width},${y - arrowSize / 2} ${x + width + arrowSize},${y} ${x + width},${y + arrowSize / 2}`}
        fill="#94a3b8"
      />
      {/* Label at the right end */}
      <text
        x={x + width + arrowSize + 5}
        y={y + 18}
        textAnchor="end"
        fill="#cbd5e1"
        fontSize={13}
        fontWeight={600}
      >
        Laikas (s)
      </text>
    </g>
  );
}

function YAxisArrows(props: any) {
  const { x, y, height } = props;
  const arrowSize = 12;
  return (
    <g>
      <line
        x1={x}
        y1={y - arrowSize}
        x2={x}
        y2={y + height + arrowSize}
        stroke="#94a3b8"
        strokeWidth={2}
      />
      {/* Top arrow */}
      <polygon
        points={`${x - arrowSize / 2},${y} ${x},${y - arrowSize} ${x + arrowSize / 2},${y}`}
        fill="#94a3b8"
      />
      {/* Bottom arrow */}
      <polygon
        points={`${x - arrowSize / 2},${y + height} ${x},${y + height + arrowSize} ${x + arrowSize / 2},${y + height}`}
        fill="#94a3b8"
      />
    </g>
  );
}

/* ──────────────────────────────────────────────
 *  3D Ball-and-Stick Molecule SVG Models
 *  Realistic CPK colors with gradients & glow
 * ────────────────────────────────────────────── */

function H2Molecule() {
  return (
    <svg width="40" height="30" viewBox="0 0 16 14" className="shrink-0">
      {/* Two H atoms - white/light (CPK), overlapping */}
      <circle cx="5" cy="7" r="5" fill="#f1f5f9" />
      <circle cx="3.5" cy="5.5" r="1.5" fill="#fff" opacity="0.5" />
      <circle cx="11" cy="7" r="5" fill="#f1f5f9" />
      <circle cx="9.5" cy="5.5" r="1.5" fill="#fff" opacity="0.5" />
    </svg>
  );
}

function N2Molecule() {
  return (
    <svg width="36" height="26" viewBox="0 0 36 22" className="shrink-0">
      {/* Two N atoms - blue (CPK), overlapping */}
      <circle cx="13" cy="11" r="9" fill="#1e3a8a" />
      <circle cx="10" cy="9" r="3" fill="#60a5fa" opacity="0.4" />
      <circle cx="23" cy="11" r="9" fill="#1e3a8a" />
      <circle cx="20" cy="9" r="3" fill="#60a5fa" opacity="0.4" />
    </svg>
  );
}

function NH3Molecule() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
      {/* H atoms - small, white (CPK), closer to N */}
      <circle cx="18" cy="28" r="5" fill="#f1f5f9" />
      <circle cx="17" cy="26.5" r="2" fill="#fff" opacity="0.5" />
      <circle cx="7" cy="26" r="5" fill="#f1f5f9" />
      <circle cx="6" cy="24.5" r="2" fill="#fff" opacity="0.5" />
      <circle cx="29" cy="26" r="5" fill="#f1f5f9" />
      <circle cx="28" cy="24.5" r="2" fill="#fff" opacity="0.5" />
      {/* N atom - blue (CPK), larger */}
      <circle cx="18" cy="9" r="9" fill="#1e3a8a" />
      <circle cx="15" cy="6" r="3.5" fill="#60a5fa" opacity="0.4" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
 *  Custom Molecule Legend (vertical stack)
 *  Order: H₂ (top), N₂ (middle), NH₃ (bottom)
 * ────────────────────────────────────────────── */

function MoleculeLegend() {
  return (
    <div className="flex items-center justify-center gap-6 mt-4">
      <div className="flex flex-col items-center gap-3">
        {/* H2 row */}
        <div className="flex items-center gap-2.5">
          <H2Molecule />
          <span className="text-sm font-semibold text-slate-200 tracking-wide">
            H₂
          </span>
        </div>
        {/* N2 row */}
        <div className="flex items-center gap-2.5">
          <N2Molecule />
          <span className="text-sm font-semibold text-slate-200 tracking-wide">
            N₂
          </span>
        </div>
        {/* NH3 row */}
        <div className="flex items-center gap-2.5">
          <NH3Molecule />
          <span className="text-sm font-semibold text-slate-200 tracking-wide">
            NH₃
          </span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
 *  Main Component
 * ────────────────────────────────────────────── */

interface ConcentrationGraphProps {
  temperature?: number;
  initialN2?: number;
  initialH2?: number;
  initialNH3?: number;
}

export default function ConcentrationGraph({
  temperature = 400,
  initialN2 = 1.0,
  initialH2 = 3.0,
  initialNH3 = 0.0,
}: ConcentrationGraphProps) {
  const iceResult = useMemo(
    () =>
      solveHaberICE(
        initialN2,
        initialH2,
        initialNH3,
        calculateHaberKc(temperature),
      ),
    [temperature, initialN2, initialH2, initialNH3],
  );

  const graphData = useMemo(() => {
    const data = [];
    const k = 0.5;
    const points = 25;

    for (let t = 0; t <= points; t++) {
      const decay = Math.exp(-k * t);
      data.push({
        time: t,
        n2: iceResult.finalA + (initialN2 - iceResult.finalA) * decay,
        h2: iceResult.finalB + (initialH2 - iceResult.finalB) * decay,
        nh3: iceResult.finalC + (initialNH3 - iceResult.finalC) * decay,
      });
    }
    return data;
  }, [initialN2, initialH2, initialNH3, iceResult]);

  const lastPoint = graphData[graphData.length - 1];

  return (
    <div className="flex flex-col">
      {/* Title area */}
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Koncentracijos dinamika
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Asimptotinis artėjimas prie dinaminės pusiausvyros
          </p>
        </div>
      </div>

      {/* Graph */}
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={graphData}
            margin={{ top: 20, right: 30, bottom: 50, left: 80 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff10"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={<XAxisArrows />}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={<YAxisArrows />}
              domain={["auto", "auto"]}
              label={
                <text
                  x="0%"
                  y="0%"
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize={13}
                  fontWeight={600}
                  transform="rotate(-90)"
                  dx={-30}
                  dy={-10}
                >
                  Koncentracija (mol/L)
                </text>
              }
            />

            <RechartsTooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "8px",
                color: "#fff",
              }}
              itemStyle={{ fontWeight: "bold" }}
              labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
              formatter={(value: any) => [`${Number(value).toFixed(3)} M`]}
              labelFormatter={(label) => `Momentas: t=${label}`}
            />

            {/* H₂ — solid white */}
            <Line
              type="monotone"
              dataKey="h2"
              name="H₂"
              stroke="#f8fafc"
              strokeWidth={3}
              dot={false}
              isAnimationActive={true}
              animationDuration={800}
            />
            {/* N₂ — solid blue */}
            <Line
              type="monotone"
              dataKey="n2"
              name="N₂"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              isAnimationActive={true}
              animationDuration={800}
            />
            {/* NH₃ — dotted purple */}
            <Line
              type="monotone"
              dataKey="nh3"
              name="NH₃"
              stroke="#8b5cf6"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={true}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Concentration value labels at start & end */}
      <div className="flex justify-between items-center mt-2 px-4 text-xs text-slate-500 font-mono">
        <span>
          t=0: H₂={initialH2.toFixed(1)} N₂={initialN2.toFixed(1)} NH₃=
          {initialNH3.toFixed(1)}
        </span>
        {lastPoint && (
          <span>
            t=∞: H₂={lastPoint.h2.toFixed(3)} N₂={lastPoint.n2.toFixed(3)} NH₃=
            {lastPoint.nh3.toFixed(3)}
          </span>
        )}
      </div>

      {/* Custom molecule legend */}
      <MoleculeLegend />
    </div>
  );
}
