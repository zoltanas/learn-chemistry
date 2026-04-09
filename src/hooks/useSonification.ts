"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useSonification() {
    const [enabled, setEnabled] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const pressureOscRef = useRef<OscillatorNode | null>(null);
    const pressureGainRef = useRef<GainNode | null>(null);

    // Initialize Audio Context on demand (requires user gesture)
    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Continuous Pressure Hum Setup
            const osc = audioCtxRef.current.createOscillator();
            const gainNode = audioCtxRef.current.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(120, audioCtxRef.current.currentTime);

            gainNode.gain.setValueAtTime(0, audioCtxRef.current.currentTime);

            osc.connect(gainNode);
            gainNode.connect(audioCtxRef.current.destination);

            osc.start();

            pressureOscRef.current = osc;
            pressureGainRef.current = gainNode;
        }

        // Resume if suspended
        if (audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume();
        }

        setEnabled(true);
        if (pressureGainRef.current && audioCtxRef.current) {
            pressureGainRef.current.gain.setTargetAtTime(0.05, audioCtxRef.current.currentTime, 0.1);
        }
    }, []);

    const toggleAudio = () => {
        if (!enabled) {
            initAudio();
        } else {
            setEnabled(false);
            if (pressureGainRef.current && audioCtxRef.current) {
                pressureGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
            }
            if (audioCtxRef.current?.state === "running") {
                audioCtxRef.current.suspend();
            }
        }
    };

    // Modulate pressure hum: 1atm = 120Hz, 50atm = 1212Hz
    const setPressureFreq = useCallback((pressureAtm: number) => {
        if (!enabled || !audioCtxRef.current || !pressureOscRef.current) return;

        const minP = 1;
        const maxP = 50;
        const minF = 120;
        const maxF = 1212;

        // Logarithmic scaling for pitch perception
        const logP = Math.log(pressureAtm) / Math.log(maxP);
        const targetFreq = minF + (maxF - minF) * logP;

        pressureOscRef.current.frequency.setTargetAtTime(
            Math.max(minF, Math.min(maxF, targetFreq)),
            audioCtxRef.current.currentTime,
            0.1
        );
    }, [enabled]);

    // ADSR Chime for NH3 formation
    const playChime = useCallback(() => {
        if (!enabled || !audioCtxRef.current) return;

        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Harmonious chord root (e.g., A5)
        osc.type = "triangle";
        osc.frequency.setValueAtTime(880, ctx.currentTime);

        // Filter for softer chime
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1500;

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        // ADSR Envelope
        const now = ctx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.02, now + 0.3); // Decay
        gainNode.gain.linearRampToValueAtTime(0, now + 1.0); // Release

        osc.start(now);
        osc.stop(now + 1.2);
    }, [enabled]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (pressureOscRef.current) {
                pressureOscRef.current.stop();
                pressureOscRef.current.disconnect();
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
                audioCtxRef.current.close().catch(() => { });
            }
        };
    }, []);

    return {
        enabled,
        toggleAudio,
        setPressureFreq,
        playChime
    };
}
