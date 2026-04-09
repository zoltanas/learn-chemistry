"use client";

import { BarChart3 } from "lucide-react";
import PageShell from "@/components/PageShell";
import ConcentrationGraph from "@/components/ConcentrationGraph";

export default function GrafikasPage() {
  return (
    <PageShell
      title="Cheminė pusiausvyra"
      subtitle="Koncentracijos dinamikos grafikas — Haberio proceso vizualizacija"
      icon={BarChart3}
      color="green"
    >
      {/* Deep blue patterned background card with soft glow */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(30, 58, 138, 0.35) 0%, transparent 60%), " +
            "radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), " +
            "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(17, 24, 39, 0.9) 50%, rgba(15, 23, 42, 0.95) 100%)",
          boxShadow:
            "0 0 40px rgba(59, 130, 246, 0.08), 0 0 80px rgba(59, 130, 246, 0.04), " +
            "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-8">
          <ConcentrationGraph
            temperature={400}
            initialN2={1.0}
            initialH2={3.0}
            initialNH3={0.0}
          />
        </div>
      </div>
    </PageShell>
  );
}
