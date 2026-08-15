"use client";

import { useState } from "react";
import { UploadSimpleIcon, FileCsvIcon, CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { uploadSalesCsv } from "@/lib/endpoints";

export default function SalesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    rowsProcessed: number;
    rowsSkipped: number;
    warnings: string[];
  } | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadSalesCsv(file);
      setResult(res);
      setFile(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse CSV file.";
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Topbar
        title="Sales Ingestion"
        subtitle="Upload historical order CSVs to feed the Obstocker Holt-Winters forecasting engine."
      />

      <main className="px-4 py-6 lg:px-8 max-w-[1000px] mx-auto space-y-6">
        {/* Upload Card */}
        <div className="bg-surface border border-outline rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-outline">
            <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
              <FileCsvIcon size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface font-heading">
                Import CSV File
              </h2>
              <p className="text-xs text-on-surface-variant">
                Columns required: <code className="font-mono text-secondary">sku, date, units_sold</code>
              </p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-outline hover:border-secondary/50 rounded-2xl p-8 text-center transition-all bg-surface-low/30">
              <UploadSimpleIcon size={36} weight="duotone" className="mx-auto text-secondary mb-2" />
              <p className="text-sm font-semibold text-on-surface">
                {file ? file.name : "Click or drag CSV file here to upload"}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">Accepts YYYY-MM-DD or MM/DD/YYYY dates</p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="csv-upload-input"
              />
              <label
                htmlFor="csv-upload-input"
                className="mt-4 inline-block px-4 py-2 text-xs font-semibold bg-surface border border-outline text-on-surface rounded-xl hover:bg-surface-low cursor-pointer transition-all shadow-sm"
              >
                Browse Files
              </label>
            </div>

            <Button
              type="submit"
              disabled={!file || uploading}
              loading={uploading}
              className="w-full bg-secondary text-white hover:bg-secondary/90 py-2.5 rounded-xl font-semibold text-sm"
            >
              Start Import & Re-evaluate
            </Button>
          </form>
        </div>

        {/* Upload Result / Warning Box */}
        {result && (
          <div className="bg-surface border border-outline rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon size={20} weight="fill" className="text-tertiary" />
              <h3 className="text-sm font-bold text-on-surface">
                Import Complete: {result.rowsProcessed} rows processed
              </h3>
            </div>

            {result.warnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <WarningCircleIcon size={16} />
                  <span>Skipped {result.rowsSkipped} bad or unrecognized rows:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-on-surface-variant font-mono">
                  {result.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}