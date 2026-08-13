"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  PackageIcon,
  BellRingingIcon,
  TrendUpIcon,
  CurrencyInrIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import { Topbar } from "@/components/layout/Topbar";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { Button } from "@/components/ui/Button";
import {
  getDashboardSummary,
  listProducts,
  regenerateAllForecasts,
  resolveAlert,
} from "@/lib/endpoints";
import { formatCurrency } from "@/lib/format";
import type { DashboardSummary, Product } from "@/lib/types";

// Dynamic imports using { default: m.Component } to cleanly handle named exports without TS errors
const CategoryDistribution = dynamic(
  () =>
    import("@/components/dashboard/CategoryDistribution").then((m) => ({
      default: m.CategoryDistribution,
    })),
  { ssr: false, loading: () => <ChartSkeleton height="h-44" /> }
);

const DemandTrendChart = dynamic(
  () =>
    import("@/components/dashboard/DemandTrendChart").then((m) => ({
      default: m.DemandTrendChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D");

  async function load() {
    const [s, p] = await Promise.all([getDashboardSummary(), listProducts()]);
    setSummary(s);
    setProducts(p);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function handleRefreshForecasts() {
    setRefreshing(true);
    try {
      await regenerateAllForecasts();
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleResolve(id: number) {
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            recentAlerts: prev.recentAlerts.filter((a) => a.id !== id),
            totalActiveAlerts: Math.max(0, prev.totalActiveAlerts - 1),
          }
        : prev
    );
    await resolveAlert(id);
  }

  if (loading || !summary) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-secondary/20 border-t-secondary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Topbar
        title="Obstocker Intelligence"
        subtitle="Real-time demand forecasting & inventory health overview."
        actions={
          <div className="flex items-center gap-3">
            {/* Time Filter Pills */}
            <div className="flex items-center bg-surface-low p-1 rounded-xl border border-outline text-xs font-medium">
              {(["7D", "30D", "90D"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    timeRange === range
                      ? "bg-surface text-on-surface font-semibold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshForecasts}
              loading={refreshing}
              className="bg-secondary text-white hover:bg-secondary/90 rounded-xl"
            >
              <ArrowsClockwiseIcon size={16} weight="bold" />
              <span>Refresh forecasts</span>
            </Button>
          </div>
        }
      />

      <main className="px-4 py-6 lg:px-8 space-y-6 max-w-[1440px] mx-auto">
        {/* KPI Stat Cards Grid */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <KPICard
              title="Active Products"
              value={summary.totalProducts.toString()}
              sub={`Across ${Object.keys(summary.categoryValueDistribution).length} categories`}
              icon={<PackageIcon size={22} weight="duotone" className="text-secondary" />}
            />
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <KPICard
              title="Active Alerts"
              value={summary.totalActiveAlerts.toString()}
              sub={`${summary.lowStockCount} low · ${summary.overstockCount} overstocked`}
              icon={<BellRingingIcon size={22} weight="duotone" className="text-red-500" />}
              isAlert={summary.totalActiveAlerts > 0}
            />
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <KPICard
              title="Inventory Value"
              value={formatCurrency(summary.totalInventoryValue)}
              sub="Total capital allocation"
              icon={<CurrencyInrIcon size={22} weight="duotone" className="text-tertiary" />}
            />
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <KPICard
              title="Predicted Revenue (30d)"
              value={formatCurrency(summary.predictedRevenueNext30)}
              sub="Holt-Winters projected sales"
              icon={<TrendUpIcon size={22} weight="duotone" className="text-secondary" />}
            />
          </motion.div>
        </motion.div>

        {/* Primary Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Demand Trend Chart */}
          <div className="lg:col-span-7 bg-surface border border-outline rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-on-surface">
                  Demand Trend & Forecast
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Actual historical sales stitched to AI projected demand
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Actual
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Forecast
                </span>
              </div>
            </div>
            <div className="w-full">
              <DemandTrendChart data={summary.demandTrend} />
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="lg:col-span-5 bg-surface border border-outline rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h2 className="text-base font-bold text-on-surface">
                Category Distribution
              </h2>
              <p className="text-xs text-on-surface-variant">
                Volume and SKU proportion across product categories
              </p>
            </div>
            <div className="w-full">
              <CategoryDistribution
                categoryDistribution={summary.categoryDistribution}
                products={products}
              />
            </div>
          </div>
        </div>

        {/* Secondary Section: Recent Alerts & Category Capital Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Alert Feed */}
          <div className="lg:col-span-7">
            <Card className="bg-surface border border-outline rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold text-on-surface">
                  Recent Inventory Alerts
                </CardTitle>
                <a
                  href="/alerts"
                  className="text-xs font-semibold text-secondary hover:underline"
                >
                  View all
                </a>
              </CardHeader>
              <CardBody>
                <AlertFeed
                  alerts={summary.recentAlerts}
                  onResolve={handleResolve}
                />
              </CardBody>
            </Card>
          </div>

          {/* Category Value Progress Bars */}
          <div className="lg:col-span-5">
            <Card className="bg-surface border border-outline rounded-2xl shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-base font-bold text-on-surface">
                  Category Value Breakdown
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                {Object.entries(summary.categoryValueDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, value]) => {
                    const max = Math.max(
                      ...Object.values(summary.categoryValueDistribution)
                    );
                    const pct = max > 0 ? (value / max) * 100 : 0;
                    return (
                      <div key={category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-on-surface">
                            {category}
                          </span>
                          <span className="font-mono font-semibold text-on-surface-variant">
                            {formatCurrency(value)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-surface-low overflow-hidden border border-outline/40">
                          <div
                            className="h-full rounded-full bg-secondary transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function KPICard({
  title,
  value,
  sub,
  icon,
  isAlert,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  isAlert?: boolean;
}) {
  return (
    <div className="bg-surface border border-outline rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-secondary/30 transition-all h-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-mono">
          {title}
        </span>
        <div
          className={`p-2.5 rounded-xl border ${
            isAlert
              ? "bg-red-500/10 border-red-500/20"
              : "bg-surface-low border-outline"
          }`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-on-surface font-heading">
          {value}
        </div>
        <p className="text-xs text-on-surface-variant mt-1.5 font-sans">{sub}</p>
      </div>
    </div>
  );
}