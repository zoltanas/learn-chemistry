"use client";

import { motion } from "framer-motion";
import { Factory, Factory as FactoryIcon } from "lucide-react";

interface IndustrialDashboardProps {
  temperature: number;
  pressure: number;
  yieldPercentage?: number;
}

export default function IndustrialDashboard({
  temperature,
  pressure,
  yieldPercentage: externalYield,
}: IndustrialDashboardProps) {
  // Economics Model
  // Base cost: 100 EUR/h
  // Temp: Exponent scales after 400C
  // Pressure: Compressing gas is very expensive

  // Simulate exponential cost
  const tempCost =
    temperature > 400
      ? Math.pow(1.01, temperature - 400) * 50
      : (temperature / 400) * 50;
  const pressureCost = Math.pow(pressure, 1.2) * 20;

  const totalCostPerHour = 100 + tempCost + pressureCost;

  // Simulate Carbon Footprint (kg CO2/h)
  // Heating and compressing requires energy (often fossil fuels)
  const carbonFootprint = tempCost * 0.5 + pressureCost * 0.8 + 50;

  // Yield Efficiency (Ideal Haber process is ~450C and ~200atm, here we scale pressure from 0-50atm for simplicity)
  const yieldPercentage =
    externalYield !== undefined
      ? externalYield
      : Math.min(
          100,
          Math.max(5, (pressure / 50) * 100 - (temperature - 400) * 0.1),
        );

  return (
    <div className="glass-card p-5 border-brand-orange/20 mt-6 relative overflow-hidden">
      <div className="absolute -right-4 -bottom-4 text-brand-orange/5 font-bold">
        <Factory size={120} />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-orange/20 flex items-center justify-center text-brand-orange">
          <FactoryIcon size={16} />
        </div>
        <div>
          <h4 className="font-bold text-white text-md">Pramoninė ekonomika</h4>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">
            Haberio-Bošo proceso realybė
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
        <div className="bg-brand-dark/50 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs text-brand-cyan font-bold">
              Eksploatacijos kaina
            </span>
            <span className="text-lg font-mono font-bold text-white">
              {totalCostPerHour.toLocaleString("lt-LT", {
                maximumFractionDigits: 0,
              })}{" "}
              <span className="text-sm font-normal text-slate-500">€/val.</span>
            </span>
          </div>
          <div className="w-full bg-brand-darker h-2 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-brand-cyan"
              animate={{
                width: `${Math.min(100, (totalCostPerHour / 500) * 100)}%`,
              }}
              transition={{ type: "spring", bounce: 0 }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-tight">
            Aukštas slėgis ir temperatūra eksponentiškai didina įrangos ir
            energijos kaštus.
          </p>
        </div>

        <div className="bg-brand-dark/50 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs text-amber-500 font-bold">
              Anglies Pėdsakas
            </span>
            <span className="text-lg font-mono font-bold text-white">
              {carbonFootprint.toLocaleString("lt-LT", {
                maximumFractionDigits: 0,
              })}{" "}
              <span className="text-sm font-normal text-slate-500">
                kg CO₂/val.
              </span>
            </span>
          </div>
          <div className="w-full bg-brand-darker h-2 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-amber-500"
              animate={{
                width: `${Math.min(100, (carbonFootprint / 400) * 100)}%`,
              }}
              transition={{ type: "spring", bounce: 0 }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-tight">
            Tinkamiausių sąlygų palaikymas reikalauja didelio elektros ir
            iškastinio kuro kiekio.
          </p>
        </div>

        <div className="bg-brand-dark/50 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs text-brand-purple font-bold">
              Sintezės išeiga
            </span>
            <span className="text-lg font-mono font-bold text-white">
              ~{yieldPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-brand-darker h-2 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-brand-purple"
              animate={{ width: `${yieldPercentage}%` }}
              transition={{ type: "spring", bounce: 0 }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-tight">
            Pramoninis kompromisas: ~450°C ir žymiai didesnis slėgis (200 atm),
            naudojant geležies katalizatorių.
          </p>
        </div>
      </div>
    </div>
  );
}
