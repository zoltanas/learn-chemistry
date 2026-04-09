"use client";

import { useState, useMemo } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface KineticsGraphProps {
    initialA0?: number;
    initialK?: number;
}

// Custom legend with shape indicators for accessibility
function AccessibleLegend() {
    return (
        <div className="flex items-center justify-center gap-6 pt-3">
            <div className="flex items-center gap-2">
                <svg width="20" height="12">
                    <line x1="0" y1="6" x2="20" y2="6" stroke="#06b6d4" strokeWidth="3" />
                    <circle cx="10" cy="6" r="3" fill="#06b6d4" />
                </svg>
                <span className="text-xs text-slate-300">● [Reagentas A]</span>
            </div>
            <div className="flex items-center gap-2">
                <svg width="20" height="12">
                    <line x1="0" y1="6" x2="20" y2="6" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" />
                    <rect x="7" y="3" width="6" height="6" fill="#f59e0b" />
                </svg>
                <span className="text-xs text-slate-300">■ [Produktas]</span>
            </div>
        </div>
    );
}

// Custom dot renderers for accessibility
function CircleDot(props: { cx?: number; cy?: number; stroke?: string; fill?: string }) {
    const { cx = 0, cy = 0 } = props;
    return <circle cx={cx} cy={cy} r={4} fill="#06b6d4" stroke="#fff" strokeWidth={1.5} />;
}

function SquareDot(props: { cx?: number; cy?: number; stroke?: string; fill?: string }) {
    const { cx = 0, cy = 0 } = props;
    return <rect x={cx - 4} y={cy - 4} width={8} height={8} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />;
}

export default function KineticsGraph({ initialA0 = 5.0, initialK = 0.1 }: KineticsGraphProps) {
    const [order, setOrder] = useState<0 | 1 | 2>(1);
    const [A0, setA0] = useState(initialA0);
    const [k, setK] = useState(initialK);

    const data = useMemo(() => {
        const points = [];
        const maxTime = 20;
        const steps = 40;

        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * maxTime;
            let At = 0;

            switch (order) {
                case 0:
                    At = Math.max(0, A0 - k * t);
                    break;
                case 1:
                    At = A0 * Math.exp(-k * t);
                    break;
                case 2:
                    At = 1 / ((1 / A0) + k * t);
                    break;
            }

            points.push({
                time: Number(t.toFixed(1)),
                A: Number(At.toFixed(3)),
                Product: Number((A0 - At).toFixed(3)),
            });
        }
        return points;
    }, [order, A0, k]);

    return (
        <div className="glass-card p-6 border-brand-purple/20" role="region" aria-label="Koncentracijos grafikas">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">Koncentracijos grafikas</h3>
                    <p className="text-xs text-slate-400">Reakcijos tvarkos vizualizacija ([A] vs laikas)</p>
                </div>

                <div className="flex bg-brand-dark rounded-lg p-1 border border-white/10">
                    {[0, 1, 2].map((ord) => (
                        <button
                            key={ord}
                            onClick={() => setOrder(ord as 0 | 1 | 2)}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${order === ord
                                ? "bg-brand-purple/20 text-brand-purple font-semibold shadow-sm"
                                : "text-slate-400 hover:text-white"
                                }`}
                        >
                            {ord}-iojo laipsnio
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <label className="block">
                    <span className="text-xs text-brand-cyan mb-1 block">Pradinė conc. [A]₀</span>
                    <input
                        type="range" min="1" max="10" step="0.5" value={A0}
                        onChange={(e) => setA0(parseFloat(e.target.value))}
                        className="w-full accent-brand-cyan"
                    />
                    <div className="text-right text-xs text-white font-mono mt-1">{A0} mol/l</div>
                </label>
                <label className="block">
                    <span className="text-xs text-brand-cyan mb-1 block">Greičio konstanta (k)</span>
                    <input
                        type="range" min="0.01" max="0.5" step="0.01" value={k}
                        onChange={(e) => setK(parseFloat(e.target.value))}
                        className="w-full accent-brand-cyan"
                    />
                    <div className="text-right text-xs text-white font-mono mt-1">{k}</div>
                </label>
            </div>

            <div className="h-[300px] w-full" aria-label={`Grafikas: ${order}-osios tvarkos reakcijos kinetika`}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickMargin={10} name="Laikas (s)" />
                        <YAxis stroke="#64748b" fontSize={12} domain={[0, "dataMax"]} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#111827",
                                borderColor: "#1e293b",
                                borderRadius: "8px",
                            }}
                            itemStyle={{ fontSize: "14px", fontWeight: "bold" }}
                        />
                        <Legend content={() => null} />
                        <Line
                            type="monotone"
                            dataKey="A"
                            name="[Reagentas A]"
                            stroke="#06b6d4"
                            strokeWidth={3}
                            dot={false}
                            activeDot={<CircleDot />}
                        />
                        <Line
                            type="monotone"
                            dataKey="Product"
                            name="[Produktas]"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            dot={false}
                            activeDot={<SquareDot />}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Accessible custom legend */}
            <AccessibleLegend />

            <div className="mt-4 pt-4 border-t border-white/5 text-center">
                <p className="text-xs text-slate-400 font-mono">
                    {order === 0 && "[A] = [A]₀ - kt (Tiesinė priklausomybė)"}
                    {order === 1 && "ln[A] = ln[A]₀ - kt (Eksponentinis mažėjimas)"}
                    {order === 2 && "1/[A] = 1/[A]₀ + kt (Atvirkštinis ryšys)"}
                </p>
            </div>
        </div>
    );
}
