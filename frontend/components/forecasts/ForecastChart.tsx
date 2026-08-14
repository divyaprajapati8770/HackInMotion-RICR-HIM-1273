"use client";

import { useTheme } from "next-themes";
import { Area, ComposedChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line } from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { theme, themeDark } from "@/lib/theme";
import type { ForecastDailyPoint } from "@/lib/types";

interface ForecastChartProps {
  dailyForecast: ForecastDailyPoint[];
  method: string;
}

export function ForecastChart({ dailyForecast, method }: ForecastChartProps) {
  // resolvedTheme, not theme, so "system" preference resolves to an actual
  // light/dark value — needed because the confidence-band "erase" area
  // below is a literal solid fill (a Recharts trick: stack an upper-bound
  // area, then a second area filled to match the card background to mask
  // everything below the lower bound), and that fill has to match
  // whichever surface color the card is actually rendering.
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const eraseColor = isDark ? themeDark.surface : theme.surface;
  const axisColor = isDark ? themeDark.onSurfaceVariant : theme.onSurfaceVariant;
  const gridColor = isDark ? themeDark.outline : theme.outline;

  return (
    <Card>
      <CardHeader>
        <CardTitle>30-day demand forecast</CardTitle>
        <span className="font-mono text-[11px] text-slate-400">{method}</span>
      </CardHeader>
      <CardBody>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyForecast} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.secondary} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={theme.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => formatDate(d).replace(/,.*/, "")}
                tick={{ fontSize: 11, fill: axisColor }}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
                interval={4}
              />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                labelFormatter={(d: string) => formatDate(d)}
                // Explicit background/color pinned to the theme surface
                // tokens — without these, Recharts falls back to its
                // default white tooltip box, which reads as a jarring
                // bright rectangle against a dark card in dark mode.
                contentStyle={{
                  borderRadius: 10,
                  border: `1px solid ${gridColor}`,
                  fontSize: 12,
                  background: "rgb(var(--color-surface))",
                  color: "rgb(var(--color-on-surface))",
                }}
                labelStyle={{ color: axisColor }}
                itemStyle={{ color: "rgb(var(--color-on-surface))" }}
              />
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandFill)" name="Upper bound" />
              <Area type="monotone" dataKey="lower" stroke="none" fill={eraseColor} name="Lower bound" />
              <Line type="monotone" dataKey="predicted" stroke={theme.secondary} strokeWidth={2.5} dot={false} name="Predicted units" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
