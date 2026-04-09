"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface PageShellProps {
  title: string;
  subtitle?: React.ReactNode;
  icon: LucideIcon;
  color: string;
  children: React.ReactNode;
}

export default function PageShell({
  title,
  subtitle,
  icon: Icon,
  color,
  children,
}: PageShellProps) {
  const gradientMap: Record<string, string> = {
    cyan: "from-brand-cyan to-cyan-300",
    purple: "from-brand-purple to-purple-300",
    green: "from-brand-green to-emerald-300",
    orange: "from-brand-orange to-amber-300",
    pink: "from-brand-pink to-pink-300",
    emerald: "from-emerald-400 to-teal-300",
    amber: "from-amber-400 to-yellow-300",
  };

  const glowMap: Record<string, string> = {
    cyan: "glow-cyan",
    purple: "glow-purple",
    green: "glow-green",
    orange: "glow-orange",
    pink: "glow-pink",
    emerald: "glow-green",
    amber: "glow-orange",
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-2">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
              gradientMap[color] ?? gradientMap.cyan
            } flex items-center justify-center shadow-lg ${
              glowMap[color] ?? ""
            }`}
          >
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
