"use client";

import { Package, ChartLineUp, BellRinging, Flask, UploadSimple, ShieldCheck } from "@phosphor-icons/react";

const FEATURES = [
  {
    icon: Package,
    title: "Inventory that stays in sync",
    body: "Track stock, categories, and suppliers in one place, updated the moment a sale comes in.",
  },
  {
    icon: UploadSimple,
    title: "Bring your own sales history",
    body: "Upload a CSV or start from seeded demo data — the pipeline that feeds every forecast.",
  },
  {
    icon: ChartLineUp,
    title: "Per-SKU demand forecasts",
    body: "Holt-Winters trend + seasonality, 7 and 30 days out, for every product you sell.",
  },
  {
    icon: BellRinging,
    title: "Alerts before you run out",
    body: "Low-stock, stockout-imminent, and overstock flags — surfaced, not buried in a table.",
  },
  {
    icon: Flask,
    title: "What-if scenario testing",
    body: "\"What if there's a 20% spike next month?\" — see the impact before it happens.",
  },
  {
    icon: ShieldCheck,
    title: "Private by account",
    body: "Every product, sale, and forecast is scoped to your business — never shared across accounts.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="font-display text-3xl font-black text-ink sm:text-4xl">
          Everything a restocking decision needs
        </h2>
        <p className="mt-4 text-slate-500">
          Built for the moment you're staring at a stock level, wondering whether to order more.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="h-full flex flex-col justify-between rounded-2xl border border-slate-100 bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div>
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon size={22} weight="bold" />
                </div>
                <h3 className="font-display text-base font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
