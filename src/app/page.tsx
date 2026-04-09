"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, Scale, Atom, ArrowRight, Sparkles } from "lucide-react";

const MODULES = [
  {
    href: "/kinetika",
    title: "Reakcijos kinetika",
    desc: "Dalelių susidūrimų simuliacija, greičio skaičiuoklė",
    icon: Zap,
    color: "cyan",
    gradient: "from-brand-cyan/20 to-brand-cyan/5",
    border: "border-brand-cyan/20",
    glow: "glow-cyan",
  },
  {
    href: "/le-satelje",
    title: "Le Šateljė principas",
    desc: "Interaktyvus pusiausvyros slankiklis",
    icon: Scale,
    color: "purple",
    gradient: "from-brand-purple/20 to-brand-purple/5",
    border: "border-brand-purple/20",
    glow: "glow-purple",
  },
  {
    href: "/pusiausvyra",
    title: "Cheminė pusiausvyra",
    desc: (
      <>
        K<sub>c</sub> konstantos skaičiavimai su paaiškinimais
      </>
    ),
    icon: Atom,
    color: "green",
    gradient: "from-brand-green/20 to-brand-green/5",
    border: "border-brand-green/20",
    glow: "glow-green",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-card via-brand-dark to-brand-card border border-white/5 p-8 md:p-10"
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 right-10 w-64 h-64 bg-brand-cyan/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-20 w-48 h-48 bg-brand-purple/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-brand-cyan" />
            <span className="text-xs uppercase tracking-widest text-brand-cyan font-semibold">
              Chemija
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
            Sveiki atvykę į <span className="gradient-text-cyan">Chemiją</span>!
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mb-6">
            Interaktyvus mokymasis su simuliacijomis. Pasirinkite modulį ir
            pradėkite!
          </p>
        </div>
      </motion.div>

      {/* Module Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Atom size={20} className="text-brand-cyan" />
          Mokymosi moduliai
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.div key={mod.href} variants={item}>
                <Link href={mod.href} className="block group">
                  <div
                    className={`glass-card rounded-2xl p-5 border ${mod.border}
                      hover:${mod.glow} transition-all duration-300 h-full
                      group-hover:border-white/10 group-hover:bg-white/[0.04]`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center mb-3`}
                    >
                      <Icon
                        size={22}
                        className={`text-${mod.color === "amber" ? "amber-400" : mod.color === "emerald" ? "emerald-400" : `brand-${mod.color}`}`}
                      />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1 group-hover:text-brand-cyan transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      {mod.desc as React.ReactNode}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-brand-cyan font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Pradėti</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
