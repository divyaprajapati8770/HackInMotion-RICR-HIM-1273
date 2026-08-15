"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ArrowsClockwise,
  ChartLineUp,
  Package,
  Calendar,
  Sparkle,
  TrendUp,
  TrendDown,
  Minus,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { ForecastChart } from "@/components/forecasts/ForecastChart";
import {
  listProducts,
  getForecast,
  regenerateForecast,
  regenerateAllForecasts,
} from "@/lib/endpoints";
import { formatDate } from "@/lib/format";
import type { Forecast, Product } from "@/lib/types";

export default function ForecastsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load product list on mount
  useEffect(() => {
    async function load() {
      try {
        const productList = await listProducts();
        setProducts(productList);
        if (productList.length > 0) {
          setSelectedProductId(productList[0].id);
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoadingProducts(false);
      }
    }
    load();
  }, []);

  // Fetch forecast whenever selected product changes
  useEffect(() => {
    if (!selectedProductId) return;

    let active = true;
    setLoadingForecast(true);
    setFeedbackMessage(null);

    getForecast(selectedProductId)
      .then((data) => {
        if (active) setForecast(data);
      })
      .catch((err) => {
        console.error("Failed to fetch forecast:", err);
        if (active) setForecast(null);
      })
      .finally(() => {
        if (active) setLoadingForecast(false);
      });

    return () => {
      active = false;
    };
  }, [selectedProductId]);

  const handleRegenerateCurrent = () => {
    if (!selectedProductId) return;
    startTransition(async () => {
      try {
        const updated = await regenerateForecast(selectedProductId);
        setForecast(updated);
        setFeedbackMessage("Forecast refreshed successfully.");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to refresh forecast.";
        setFeedbackMessage(msg);
      }
    });
  };

  const handleRegenerateAll = async () => {
    setRegeneratingAll(true);
    setFeedbackMessage(null);
    try {
      const results = await regenerateAllForecasts();
      if (selectedProductId) {
        const current = results.find((f) => f.productId === selectedProductId);
        if (current) setForecast(current);
      }
      setFeedbackMessage(`Generated forecasts for ${results.length} products.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to regenerate all forecasts.";
      setFeedbackMessage(msg);
    } finally {
      setRegeneratingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Topbar
        title="AI Demand Forecasts"
        subtitle="Holt-Winters and statistical time-series demand models tailored to each SKU."
        actions={
          <Button
            onClick={handleRegenerateAll}
            disabled={regeneratingAll || products.length === 0}
            className="bg-secondary text-white hover:bg-secondary/90 rounded-xl"
          >
            <ArrowsClockwise
              size={16}
              weight="bold"
              className={regeneratingAll ? "animate-spin" : ""}
            />
            <span>{regeneratingAll ? "Recalculating..." : "Regenerate All"}</span>
          </Button>
        }
      />

      <main className="px-4 py-6 lg:px-8 max-w-[1440px] mx-auto space-y-6">
        {/* Notification feedback */}
        {feedbackMessage && (
          <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkle size={18} weight="fill" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Product selector card */}
        <div className="bg-surface border border-outline rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
              <Package size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface font-heading">Select Product</h2>
              <p className="text-xs text-on-surface-variant">
                Choose a product SKU to inspect daily predictions and replenishment targets.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedProductId || ""}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              disabled={loadingProducts || products.length === 0}
              className="px-3.5 py-2 rounded-xl bg-surface-low/50 border border-outline text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 font-medium"
            >
              {products.length === 0 ? (
                <option value="">No products available</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — {p.category}
                  </option>
                ))
              )}
            </select>

            <Button
              onClick={handleRegenerateCurrent}
              disabled={isPending || !selectedProductId}
              variant="secondary"
              className="rounded-xl"
            >
              <ArrowsClockwise size={16} className={isPending ? "animate-spin" : ""} />
              <span>{isPending ? "Updating..." : "Recalculate"}</span>
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {loadingForecast && (
          <div className="py-20 text-center space-y-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-secondary/20 border-t-secondary" />
            <p className="text-sm text-on-surface-variant">Analyzing historical demand trends...</p>
          </div>
        )}

        {/* Forecast Content */}
        {!loadingForecast && forecast && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 30-Day Demand */}
              <div className="bg-surface border border-outline rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    30-Day Demand
                  </span>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <ChartLineUp size={18} weight="bold" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-on-surface font-heading">
                    {forecast.predictedUnitsNext30.toLocaleString()}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">
                    ~{forecast.predictedUnitsNext7.toLocaleString()} units next 7 days
                  </div>
                </div>
              </div>

              {/* Trend & Momentum */}
              <div className="bg-surface border border-outline rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Trend Momentum
                  </span>
                  <div
                    className={`p-2 rounded-lg ${
                      forecast.trend === "UP"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : forecast.trend === "DOWN"
                        ? "bg-rose-500/10 text-rose-500"
                        : "bg-slate-500/10 text-slate-500"
                    }`}
                  >
                    {forecast.trend === "UP" && <TrendUp size={18} weight="bold" />}
                    {forecast.trend === "DOWN" && <TrendDown size={18} weight="bold" />}
                    {forecast.trend === "STABLE" && <Minus size={18} weight="bold" />}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-on-surface font-heading">
                    {forecast.trend}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">
                    Strength: {(forecast.trendStrength * 100).toFixed(1)}% | Seasonality:{" "}
                    {forecast.seasonalityIndex.toFixed(2)}x
                  </div>
                </div>
              </div>

              {/* Days Until Stockout */}
              <div className="bg-surface border border-outline rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Stockout Runway
                  </span>
                  <div
                    className={`p-2 rounded-lg ${
                      forecast.daysUntilStockout !== null && forecast.daysUntilStockout <= 7
                        ? "bg-rose-500/10 text-rose-500"
                        : forecast.daysUntilStockout !== null && forecast.daysUntilStockout <= 14
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-emerald-500/10 text-emerald-500"
                    }`}
                  >
                    {forecast.daysUntilStockout !== null && forecast.daysUntilStockout <= 14 ? (
                      <Warning size={18} weight="bold" />
                    ) : (
                      <CheckCircle size={18} weight="bold" />
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-on-surface font-heading">
                    {forecast.daysUntilStockout !== null
                      ? `${forecast.daysUntilStockout} Days`
                      : "Sufficient"}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">
                    Confidence: {(forecast.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Recommended Reorder */}
              <div className="bg-surface border border-outline rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Order Advice
                  </span>
                  <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                    <Calendar size={18} weight="bold" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-on-surface font-heading">
                    {forecast.recommendedReorderQty > 0
                      ? `+${forecast.recommendedReorderQty.toLocaleString()} units`
                      : "No Order Needed"}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">
                    {forecast.recommendedReorderBy
                      ? `Order by: ${formatDate(forecast.recommendedReorderBy)}`
                      : "Stock level optimal"}
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast Chart */}
            <ForecastChart
              dailyForecast={forecast.dailyForecast}
              method={forecast.method}
            />

            {/* Daily Predictions Breakdown Table */}
            <div className="bg-surface border border-outline rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-outline flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-on-surface font-heading">
                    Daily Forecast Points
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Expected daily demand with statistical confidence intervals.
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-surface-low border border-outline text-on-surface-variant">
                  {forecast.dailyForecast.length} days projected
                </span>
              </div>

              <div className="overflow-x-auto max-h-96 scrollbar-thin">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-surface-low/80 backdrop-blur border-b border-outline text-on-surface-variant font-semibold">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Predicted Demand</th>
                      <th className="px-5 py-3">Lower Bound (95% CI)</th>
                      <th className="px-5 py-3">Upper Bound (95% CI)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline font-medium">
                    {forecast.dailyForecast.map((point) => (
                      <tr
                        key={point.date}
                        className="hover:bg-surface-low/40 transition-colors"
                      >
                        <td className="px-5 py-2.5 font-mono text-on-surface">
                          {formatDate(point.date)}
                        </td>
                        <td className="px-5 py-2.5 text-secondary font-bold">
                          {point.predicted.toFixed(1)} units
                        </td>
                        <td className="px-5 py-2.5 text-on-surface-variant">
                          {point.lower.toFixed(1)} units
                        </td>
                        <td className="px-5 py-2.5 text-on-surface-variant">
                          {point.upper.toFixed(1)} units
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loadingForecast && !forecast && (
          <div className="py-20 text-center bg-surface border border-dashed border-outline rounded-2xl space-y-3">
            <Package size={36} className="mx-auto text-on-surface-variant/60" />
            <p className="text-sm font-semibold text-on-surface">No forecast data available</p>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Please ensure sales history exists for this SKU or click &ldquo;Recalculate&rdquo; to generate a fresh forecast.
            </p>
            {selectedProductId && (
              <Button onClick={handleRegenerateCurrent} className="mt-2">
                Generate Initial Forecast
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
