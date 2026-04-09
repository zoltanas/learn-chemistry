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
  Legend,
} from "recharts";
import { IceResult } from "@/lib/thermodynamics";
import { Activity } from "lucide-react";

interface GraphProps {
  initialN2: number;
  initialH2: number;
  initialNH3: number;
  iceResult: IceResult | null;
}

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

export default function EquilibriumGraph({
  initialN2,
  initialH2,
  initialNH3,
  iceResult,
}: GraphProps) {
  // Generate asymptotic curve data simulating kinetic approach to equilibrium
  const graphData = useMemo(() => {
    if (!iceResult) return [];

    const data = [];
    const k = 0.5; // arbitrary "rate constant" for visual smoothing
    const points = 25; // number of time steps

    for (let t = 0; t <= points; t++) {
      // C(t) = C_eq + (C_0 - C_eq) * e^(-kt)
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

  if (!iceResult) return null;

  return (
    <div className="glass-card p-6 border-white/10 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          <Activity size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">
            Koncentracijos dinamika
          </h3>
          <p className="text-xs text-slate-400">
            Asimptotinis artėjimas prie dinaminės pusiausvyros
          </p>
        </div>
      </div>

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={graphData}
            margin={{ top: 20, right: 30, bottom: 50, left: 70 }}
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
              label={{
                value: "Laikas (s)",
                position: "insideBottom",
                offset: 5,
                fill: "#cbd5e1",
                fontSize: 13,
                fontWeight: 600,
              }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={<YAxisArrows />}
              domain={["auto", "auto"]}
              label={{
                value: "Koncentracija (M)",
                angle: -90,
                position: "insideLeft",
                offset: 5,
                fill: "#cbd5e1",
                fontSize: 13,
                fontWeight: 600,
              }}
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
            <Legend
              wrapperStyle={{ paddingTop: "15px", fontSize: "13px" }}
              iconType="circle"
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />

            {/* N₂ */}
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
            {/* H₂ */}
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
            {/* NH₃ — last in legend */}
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
    </div>
  );
}
