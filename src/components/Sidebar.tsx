"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Atom,
    FlaskConical,
    Scale,
    Hexagon,
    Battery,
    TestTubes,
    GraduationCap,
    Menu,
    X,
    Home,
    Zap,
} from "lucide-react";

const NAV_ITEMS = [
    {
        href: "/",
        label: "Pradžia",
        icon: Home,
        color: "text-brand-cyan",
        bg: "bg-brand-cyan/10",
    },
    {
        href: "/kinetika",
        label: "Reakcijos kinetika",
        icon: Zap,
        color: "text-brand-cyan",
        bg: "bg-brand-cyan/10",
    },
    {
        href: "/le-satelje",
        label: "Le Šateljė principas",
        icon: Scale,
        color: "text-brand-purple",
        bg: "bg-brand-purple/10",
    },
    {
        href: "/pusiausvyra",
        label: "Cheminė pusiausvyra",
        icon: Atom,
        color: "text-brand-green",
        bg: "bg-brand-green/10",
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setOpen(!open)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl glass-card text-white"
                aria-label="Toggle menu"
            >
                {open ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Overlay for mobile */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 bg-black/60 z-30"
                        onClick={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-72 z-40 flex flex-col
          bg-brand-darker/95 backdrop-blur-xl border-r border-white/5
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
            >
                {/* Logo */}
                <div className="p-6 pb-4">
                    <Link href="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center shadow-lg shadow-brand-cyan/20">
                            <FlaskConical size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight">
                                Chemija
                            </h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                Interaktyvus mokymasis
                            </p>
                        </div>
                    </Link>
                </div>

                <div className="px-4 mb-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${isActive
                                        ? `${item.bg} ${item.color} shadow-lg`
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }
                `}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-current"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <Icon size={18} className={isActive ? item.color : "text-slate-500 group-hover:text-slate-300"} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/5">
                    <div className="glass-card rounded-xl p-3 text-center">
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
                            Chemija
                        </p>
                        <p className="text-xs text-slate-400">
                            © 2026 Chemija
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
