"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import { CaretDown } from "@phosphor-icons/react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StockPulse } from "@/components/ui/StockPulse";
import { formatCurrency, cx } from "@/lib/format";
import type { Product } from "@/lib/types";

const PALETTE = ["#3D4FD1", "#1F9D6C", "#F2A93B", "#E14F5A", "#7A8194", "#9FA8ED", "#2CB37E", "#C67D14"];

interface CategoryDistributionProps {
  categoryDistribution: Record<string, number>;
  products: Product[];
}

/**
 * Requirement: "category distribution and expansion in UI". Renders a
 * donut of products-per-category; clicking a slice (or its legend row)
 * expands an inline product breakdown for that category — the same
 * "shelf" visual language (stock pulse bars) carried down into the
 * drill-down list.
 */
export function CategoryDistribution({ categoryDistribution, products }: CategoryDistributionProps) {
  const data = useMemo(
    () =>
      Object.entries(categoryDistribution)
        .map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }))
        .sort((a, b) => b.value - a.value),
    [categoryDistribution]
  );

  const [expanded, setExpanded] = useState<string | null>(data[0]?.name ?? null);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category distribution</CardTitle>
        <span className="text-xs text-slate-400">{total} products</span>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="h-44 w-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  onClick={(entry) => setExpanded(entry.name === expanded ? null : entry.name)}
                  cursor="pointer"
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      opacity={expanded && expanded !== entry.name ? 0.35 : 1}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} products`, name]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #E9EAF0", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full flex-1 space-y-1.5">
            {data.map((entry) => {
              const isOpen = expanded === entry.name;
              const categoryProducts = products.filter((p) => p.category === entry.name);
              const categoryValue = categoryProducts.reduce((s, p) => s + p.unitCost * p.currentStock, 0);

              return (
                <div key={entry.name} className="rounded-lg border border-transparent hover:border-slate-100">
                  <button
                    onClick={() => setExpanded(isOpen ? null : entry.name)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="flex-1 truncate text-sm text-ink">{entry.name}</span>
                    <span className="text-xs tabular text-slate-400">{entry.value}</span>
                    <CaretDown
                      size={13}
                      className={cx("text-slate-400 transition-transform", isOpen && "rotate-180")}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="ml-5 mr-2 mb-2 mt-1 space-y-2.5 border-l border-slate-100 pl-4">
                          <p className="text-xs text-slate-400">
                            {formatCurrency(categoryValue)} in stock across {categoryProducts.length} SKUs
                          </p>
                          {categoryProducts.slice(0, 5).map((p) => (
                            <div key={p.id} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="truncate text-slate-600">{p.name}</span>
                                <span className="shrink-0 font-mono text-[11px] text-slate-400">{p.currentStock}u</span>
                              </div>
                              <StockPulse percent={p.stockLevelPercent} status={p.stockStatus} size="sm" />
                            </div>
                          ))}
                          {categoryProducts.length > 5 && (
                            <p className="text-xs text-slate-400">+{categoryProducts.length - 5} more</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
