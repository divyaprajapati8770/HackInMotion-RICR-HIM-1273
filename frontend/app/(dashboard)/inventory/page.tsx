"use client";

import { useEffect, useState } from "react";
import {
  PackageIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { listProducts, deleteProduct } from "@/lib/endpoints";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  async function load() {
    try {
      const data = await listProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Deactivate this product from inventory?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    await deleteProduct(id);
  }

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Topbar
        title="Inventory Catalog"
        subtitle="Manage stock levels, supplier lead times, and safety thresholds."
        actions={
          <Button className="bg-secondary text-white hover:bg-secondary/90 rounded-xl">
            <PlusIcon size={16} weight="bold" />
            <span>Add Product</span>
          </Button>
        }
      />

      <main className="px-4 py-6 lg:px-8 space-y-6 max-w-[1440px] mx-auto">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-outline shadow-sm">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Filter by SKU or Product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-surface-low border border-outline rounded-xl text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all font-body"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <FunnelIcon size={16} className="text-on-surface-variant shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-secondary text-white shadow-sm"
                    : "bg-surface-low text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Data Grid */}
        <div className="bg-surface border border-outline rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="h-6 w-6 rounded-full border-2 border-secondary/20 border-t-secondary animate-spin mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-outline text-xs uppercase text-on-surface-variant bg-surface-low/50 font-mono">
                    <th className="py-3.5 px-5 font-semibold">SKU</th>
                    <th className="py-3.5 px-5 font-semibold">Product Name</th>
                    <th className="py-3.5 px-5 font-semibold">Category</th>
                    <th className="py-3.5 px-5 font-semibold">Unit Price</th>
                    <th className="py-3.5 px-5 font-semibold">Stock Health Pulse</th>
                    <th className="py-3.5 px-5 font-semibold">Status</th>
                    <th className="py-3.5 px-5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-low/40 transition-colors">
                      <td className="py-4 px-5 font-mono text-xs font-semibold text-secondary">
                        {p.sku}
                      </td>
                      <td className="py-4 px-5 font-medium text-on-surface">{p.name}</td>
                      <td className="py-4 px-5 text-xs text-on-surface-variant">{p.category}</td>
                      <td className="py-4 px-5 font-mono text-xs font-semibold text-on-surface">
                        {formatCurrency(p.unitPrice)}
                      </td>

                      {/* Stock Pulse Progress Indicator */}
                      <td className="py-4 px-5 w-52">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono text-on-surface-variant">
                            <span>{p.currentStock} units</span>
                            <span>Min: {p.reorderPoint}</span>
                          </div>
                          <div className="h-2 w-full bg-surface-low rounded-full overflow-hidden border border-outline/40">
                            <div
                              className={`h-full rounded-full transition-all ${
                                p.stockStatus === "HEALTHY"
                                  ? "bg-emerald-500"
                                  : p.stockStatus === "LOW"
                                  ? "bg-amber-500"
                                  : p.stockStatus === "CRITICAL"
                                  ? "bg-red-500"
                                  : "bg-secondary"
                              }`}
                              style={{ width: `${Math.min(100, (p.currentStock / (p.reorderPoint * 3)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                            p.stockStatus === "HEALTHY"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : p.stockStatus === "LOW"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : p.stockStatus === "CRITICAL"
                              ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                          }`}
                        >
                          {p.stockStatus}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 hover:bg-surface-low rounded-lg text-on-surface-variant hover:text-on-surface transition-colors">
                            <PencilSimpleIcon size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 hover:bg-surface-low rounded-lg text-on-surface-variant hover:text-red-500 transition-colors"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}