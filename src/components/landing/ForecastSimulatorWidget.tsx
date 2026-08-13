"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendUp } from "@phosphor-icons/react";

/**
 * Illustrative only: this runs a small client-side weighted-average +
 * seasonality formula directly in the browser so visitors can play with
 * it before signing up. It's deliberately NOT calling the real backend
 * (this page is public/unauthenticated) — the actual product's forecast
 * engine is the Holt-Winters + fallback model documented in
 * api-documentation.md, not this simplified demo.
 */
function simulateForecast(baseline: number, spikePercent: number, leadTimeDays: number) {
  const adjustedDaily = baseline * (1 + spikePercent / 100);
  const next30 = Math.round(adjustedDaily * 30);
  const reorderQty = Math.round(adjustedDaily * (leadTimeDays + 7));
  return { next30, reorderQty };
}

export function ForecastSimulatorWidget() {
  const [baseline, setBaseline] = useState(12);
  const [spike, setSpike] = useState(20);
  const [leadTime, setLeadTime] = useState(7);

  const result = useMemo(() => simulateForecast(baseline, spike, leadTime), [baseline, spike, leadTime]);

  return (
    <div id="simulator" className="mx-auto max-w-4xl rounded-3xl border border-slate-100 bg-surface p-8 shadow-card sm:p-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <TrendUp size={20} weight="bold" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-ink">Try the forecast simulator</h3>
          <p className="text-sm text-slate-500">A simplified taste of what the real dashboard computes per product.</p>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-6">
          <SliderField
            label="Current daily sales"
            value={baseline}
            min={1}
            max={100}
            unit=" units/day"
            onChange={setBaseline}
          />
          <SliderField
            label="Expected demand spike"
            value={spike}
            min={-50}
            max={150}
            unit="%"
            signed
            onChange={setSpike}
          />
          <SliderField
            label="Supplier lead time"
            value={leadTime}
            min={1}
            max={30}
            unit=" days"
            onChange={setLeadTime}
          />
        </div>

        <div className="flex flex-col justify-center gap-4 rounded-2xl bg-brand-primary p-6 text-white">
          <ResultRow label="Predicted units (30d)" value={result.next30.toLocaleString()} />
          <ResultRow label="Suggested reorder qty" value={result.reorderQty.toLocaleString()} highlight />
          <ResultRow label="Forecast window" value="30 days" />
        </div>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  unit,
  signed,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  signed?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <label className="font-medium text-slate-600">{label}</label>
        <span className="font-mono text-indigo-600">
          {signed && value > 0 ? "+" : ""}
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500"
      />
    </div>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0.4, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0"
    >
      <span className="text-sm text-white/60">{label}</span>
      <span className={`font-display text-xl font-bold ${highlight ? "text-emerald-400" : "text-white"}`}>{value}</span>
    </motion.div>
  );
}
