"use client";

import { useMemo, useState } from "react";
import { Calculator } from "@phosphor-icons/react";
import { Input } from "@/components/ui/Input";

/**
 * Illustrative estimate, not a guarantee: recovered revenue = (monthly
 * revenue lost to stockouts) + (carrying cost saved on excess inventory
 * no longer sitting unsold), using rough, clearly-labeled assumption
 * rates rather than presenting a precise-looking but fabricated number.
 */
const STOCKOUT_RECOVERY_RATE = 0.6; // assume ~60% of stockout-driven lost sales become recoverable
const CARRYING_COST_RATE = 0.02; // ~2%/month carrying cost on excess inventory freed up

export function ROICalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(500000);
  const [stockoutRate, setStockoutRate] = useState(8);
  const [excessInventoryValue, setExcessInventoryValue] = useState(150000);

  const estimate = useMemo(() => {
    const lostToStockouts = monthlyRevenue * (stockoutRate / 100);
    const recoveredFromStockouts = lostToStockouts * STOCKOUT_RECOVERY_RATE;
    const carryingCostSaved = excessInventoryValue * CARRYING_COST_RATE;
    return Math.round(recoveredFromStockouts + carryingCostSaved);
  }, [monthlyRevenue, stockoutRate, excessInventoryValue]);

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-slate-100 bg-surface p-8 shadow-card sm:p-10 dark:border-slate-800/80">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <Calculator size={20} weight="bold" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-ink">Estimate your monthly recovery</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A rough, illustrative estimate — not a guarantee — based on typical stockout recovery and carrying-cost assumptions.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Input
          label="Monthly revenue (₹)"
          type="number"
          min={0}
          value={monthlyRevenue}
          onChange={(e) => setMonthlyRevenue(Number(e.target.value) || 0)}
        />
        <Input
          label="Est. % of sales lost to stockouts"
          type="number"
          min={0}
          max={100}
          value={stockoutRate}
          onChange={(e) => setStockoutRate(Number(e.target.value) || 0)}
        />
        <Input
          label="Excess inventory value (₹)"
          type="number"
          min={0}
          value={excessInventoryValue}
          onChange={(e) => setExcessInventoryValue(Number(e.target.value) || 0)}
        />
      </div>

      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-indigo-50 p-8 text-center border border-emerald-100/60 dark:from-emerald-950/40 dark:to-indigo-950/40 dark:border-slate-800/80">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Estimated monthly recovery</p>
        <p className="mt-2 font-display text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
          ₹{estimate.toLocaleString("en-IN")}
        </p>
        <p className="mt-2.5 max-w-md text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Based on {STOCKOUT_RECOVERY_RATE * 100}% stockout-loss recovery and a {CARRYING_COST_RATE * 100}%/month carrying-cost assumption — your results will vary by category and season.
        </p>
      </div>
    </div>
  );
}
