"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
    value: number; // 0-1
    color?: string;
    height?: number;
    label?: string;
    showPercent?: boolean;
}

export default function ProgressBar({
    value,
    color = "from-brand-cyan to-brand-purple",
    height = 8,
    label,
    showPercent = false,
}: ProgressBarProps) {
    const clamped = Math.min(1, Math.max(0, value));

    return (
        <div className="w-full">
            {(label || showPercent) && (
                <div className="flex justify-between items-center mb-1.5">
                    {label && (
                        <span className="text-xs text-slate-400 font-medium">{label}</span>
                    )}
                    {showPercent && (
                        <span className="text-xs text-slate-500 font-mono">
                            {Math.round(clamped * 100)}%
                        </span>
                    )}
                </div>
            )}
            <div
                className="w-full bg-white/5 rounded-full overflow-hidden"
                style={{ height }}
            >
                <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${clamped * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
        </div>
    );
}
