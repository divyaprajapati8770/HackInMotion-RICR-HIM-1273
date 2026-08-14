"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Warning } from "@phosphor-icons/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createProduct, updateProduct, type ProductInput } from "@/lib/endpoints";
import { apiErrorMessage } from "@/lib/api-client";
import type { Product } from "@/lib/types";

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: Product | null;
}

const EMPTY: ProductInput = {
  sku: "",
  name: "",
  category: "",
  supplierName: "",
  supplierLeadTimeDays: 7,
  unitPrice: 0,
  unitCost: 0,
  currentStock: 0,
  reorderPoint: 10,
  safetyStock: 5,
};

export function ProductModal({ open, onClose, onSaved, product }: ProductModalProps) {
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        sku: product.sku,
        name: product.name,
        category: product.category,
        supplierName: product.supplierName ?? "",
        supplierLeadTimeDays: product.supplierLeadTimeDays,
        unitPrice: product.unitPrice,
        unitCost: product.unitCost,
        currentStock: product.currentStock,
        reorderPoint: product.reorderPoint,
        safetyStock: product.safetyStock,
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [product, open]);

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (product) {
        await updateProduct(product.id, form);
      } else {
        await createProduct(form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save this product."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // bg-brand-primary (fixed dark), not bg-ink: a modal backdrop must
          // dim the page in both themes — with the theme-reactive `ink`
          // token this would render as a translucent white wash in dark
          // mode instead of a scrim.
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-primary/40 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[88vh] overflow-y-auto scrollbar-thin rounded-xl2 bg-surface p-6 shadow-popover"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-ink">
                {product ? "Edit product" : "Add product"}
              </h3>
              <button
                onClick={onClose}
                title="Close"
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-all duration-150 hover:scale-110 hover:bg-slate-100 hover:text-ink active:scale-95 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="SKU" required value={form.sku} onChange={(e) => set("sku", e.target.value)} />
                <Input label="Category" required value={form.category} onChange={(e) => set("category", e.target.value)} />
              </div>
              <Input label="Product name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Supplier name" value={form.supplierName} onChange={(e) => set("supplierName", e.target.value)} />
                <Input
                  label="Lead time (days)"
                  type="number"
                  min={0}
                  value={form.supplierLeadTimeDays}
                  onChange={(e) => set("supplierLeadTimeDays", Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Unit price (₹)"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={form.unitPrice}
                  onChange={(e) => set("unitPrice", Number(e.target.value))}
                />
                <Input
                  label="Unit cost (₹)"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.unitCost}
                  onChange={(e) => set("unitCost", Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Current stock"
                  type="number"
                  min={0}
                  required
                  value={form.currentStock}
                  onChange={(e) => set("currentStock", Number(e.target.value))}
                />
                <Input
                  label="Reorder point"
                  type="number"
                  min={0}
                  value={form.reorderPoint}
                  onChange={(e) => set("reorderPoint", Number(e.target.value))}
                />
                <Input
                  label="Safety stock"
                  type="number"
                  min={0}
                  value={form.safetyStock}
                  onChange={(e) => set("safetyStock", Number(e.target.value))}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-critical/10 px-3.5 py-2.5 text-xs text-critical">
                  <Warning size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {product ? "Save changes" : "Add product"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
