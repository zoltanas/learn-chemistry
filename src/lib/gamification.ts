"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Badge definitions ───
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    condition: (progress: ProgressData) => boolean;
}

export const BADGES: Badge[] = [
    {
        id: "kinetikos_ekspertas",
        name: "Kinetikos ekspertas",
        description: "Atlikti visus kinetikos modulio pratimus",
        icon: "⚡",
        color: "cyan",
        condition: (p) => (p.modulesCompleted?.kinetika ?? 0) >= 3,
    },
    {
        id: "pusiausvyros_meistras",
        name: "Pusiausvyros meistras",
        description: "Išspręsti 5 pusiausvyros uždavinius",
        icon: "⚖️",
        color: "purple",
        condition: (p) => (p.modulesCompleted?.pusiausvyra ?? 0) >= 5,
    },
    {
        id: "organines_chemijos_guru",
        name: "Organinės chemijos guru",
        description: "Atpažinti 10 funkcinių grupių",
        icon: "🧬",
        color: "green",
        condition: (p) => (p.modulesCompleted?.organine ?? 0) >= 10,
    },
    {
        id: "elektrochemijos_ziniovas",
        name: "Elektrochemijos žinovas",
        description: "Sukurti 3 galvaninius elementus",
        icon: "🔋",
        color: "orange",
        condition: (p) => (p.modulesCompleted?.elektrochemija ?? 0) >= 3,
    },
    {
        id: "laboratorijos_virtuozas",
        name: "Laboratorijos virtuozas",
        description: "Atlikti 5 virtualias reakcijas",
        icon: "🧪",
        color: "pink",
        condition: (p) => (p.modulesCompleted?.laboratorija ?? 0) >= 5,
    },
    {
        id: "egzaminu_nugaletojas",
        name: "Egzaminų nugalėtojas",
        description: "Gauti 90%+ egzamino treneryje",
        icon: "🏆",
        color: "cyan",
        condition: (p) => (p.quizHighScore ?? 0) >= 90,
    },
];

// ─── Progress data shape ───
export interface ProgressData {
    xp: number;
    level: number;
    modulesCompleted: Record<string, number>;
    unlockedBadges: string[];
    dailyStreak: number;
    lastActiveDate: string;
    quizHighScore: number;
}

const DEFAULT_PROGRESS: ProgressData = {
    xp: 0,
    level: 1,
    modulesCompleted: {},
    unlockedBadges: [],
    dailyStreak: 0,
    lastActiveDate: "",
    quizHighScore: 0,
};

const STORAGE_KEY = "chemija12_progress";

const XP_PER_LEVEL = 100;

export function useProgress() {
    const [progress, setProgress] = useState<ProgressData>(DEFAULT_PROGRESS);
    const [loaded, setLoaded] = useState(false);

    // Load from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setProgress({ ...DEFAULT_PROGRESS, ...JSON.parse(saved) });
            }
        } catch {
            // ignore
        }
        setLoaded(true);
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (loaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        }
    }, [progress, loaded]);

    // Update daily streak
    useEffect(() => {
        if (!loaded) return;
        const today = new Date().toISOString().split("T")[0];
        if (progress.lastActiveDate !== today) {
            const yesterday = new Date(Date.now() - 86400000)
                .toISOString()
                .split("T")[0];
            setProgress((prev) => ({
                ...prev,
                lastActiveDate: today,
                dailyStreak:
                    prev.lastActiveDate === yesterday ? prev.dailyStreak + 1 : 1,
            }));
        }
    }, [loaded]);

    const addXP = useCallback((amount: number) => {
        setProgress((prev) => {
            const newXP = prev.xp + amount;
            const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
            return { ...prev, xp: newXP, level: newLevel };
        });
    }, []);

    const completeActivity = useCallback(
        (moduleId: string, xpReward: number = 10) => {
            setProgress((prev) => {
                const newXP = prev.xp + xpReward;
                const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
                const newModules = {
                    ...prev.modulesCompleted,
                    [moduleId]: (prev.modulesCompleted[moduleId] ?? 0) + 1,
                };
                // Check new badges
                const updatedProgress = {
                    ...prev,
                    xp: newXP,
                    level: newLevel,
                    modulesCompleted: newModules,
                };
                const newBadges = BADGES.filter(
                    (b) =>
                        !prev.unlockedBadges.includes(b.id) && b.condition(updatedProgress)
                ).map((b) => b.id);

                return {
                    ...updatedProgress,
                    unlockedBadges: [...prev.unlockedBadges, ...newBadges],
                };
            });
        },
        []
    );

    const setQuizScore = useCallback((score: number) => {
        setProgress((prev) => ({
            ...prev,
            quizHighScore: Math.max(prev.quizHighScore, score),
        }));
    }, []);

    return {
        progress,
        loaded,
        addXP,
        completeActivity,
        setQuizScore,
        xpToNextLevel: XP_PER_LEVEL - (progress.xp % XP_PER_LEVEL),
        levelProgress: (progress.xp % XP_PER_LEVEL) / XP_PER_LEVEL,
    };
}
