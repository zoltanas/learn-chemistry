"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface PlaceholderSectionProps {
    title: string;
    description: string;
    icon: LucideIcon;
    color?: string;
}

export default function PlaceholderSection({
    title,
    description,
    icon: Icon,
    color = "brand-cyan",
}: PlaceholderSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="glass-card rounded-2xl p-8 text-center"
        >
            <div
                className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-${color}/10 flex items-center justify-center`}
            >
                <Icon size={32} className={`text-${color}`} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
                {description}
            </p>
            <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-cyan/50 animate-pulse" />
                <span className="text-xs text-slate-500">Kuriama...</span>
            </div>
        </motion.div>
    );
}
