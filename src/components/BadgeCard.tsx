"use client";

import { motion } from "framer-motion";
import type { Badge } from "@/lib/gamification";

interface BadgeCardProps {
    badge: Badge;
    unlocked: boolean;
}

const colorMap: Record<string, string> = {
    cyan: "from-brand-cyan/20 to-brand-cyan/5 border-brand-cyan/30",
    purple: "from-brand-purple/20 to-brand-purple/5 border-brand-purple/30",
    green: "from-brand-green/20 to-brand-green/5 border-brand-green/30",
    orange: "from-brand-orange/20 to-brand-orange/5 border-brand-orange/30",
    pink: "from-brand-pink/20 to-brand-pink/5 border-brand-pink/30",
};

export default function BadgeCard({ badge, unlocked }: BadgeCardProps) {
    const colors = colorMap[badge.color] ?? colorMap.cyan;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: unlocked ? 1.05 : 1 }}
            className={`relative rounded-2xl border p-4 text-center transition-all duration-300
        ${unlocked
                    ? `bg-gradient-to-b ${colors}`
                    : "bg-white/[0.02] border-white/5 opacity-40 grayscale"
                }
      `}
        >
            <div className="text-3xl mb-2">{badge.icon}</div>
            <h4 className="text-sm font-semibold text-white mb-1">{badge.name}</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
                {badge.description}
            </p>
            {unlocked && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-brand-green rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-lg"
                >
                    ✓
                </motion.div>
            )}
        </motion.div>
    );
}
