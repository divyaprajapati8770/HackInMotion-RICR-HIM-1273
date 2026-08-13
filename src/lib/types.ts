export type StockStatus = "HEALTHY" | "LOW" | "CRITICAL" | "OVERSTOCK";
export type TrendDirection = "UP" | "DOWN" | "STABLE";
export type AlertType = "LOW_STOCK" | "OVERSTOCK" | "STOCKOUT_IMMINENT";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AuthResponse {
  token: string;
  userId: number;
  businessName: string;
  email: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  supplierName: string | null;
  supplierLeadTimeDays: number;
  unitPrice: number;
  unitCost: number;
  currentStock: number;
  reorderPoint: number;
  safetyStock: number;
  stockStatus: StockStatus;
  stockLevelPercent: number;
  warehouseId: number | null;
}

export interface ForecastDailyPoint {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
  actual: number | null;
}

export interface Forecast {
  productId: number;
  productName: string;
  sku: string;
  method: string;
  predictedUnitsNext7: number;
  predictedUnitsNext30: number;
  trend: TrendDirection;
  trendStrength: number;
  seasonalityIndex: number;
  confidence: number;
  daysUntilStockout: number | null;
  recommendedReorderQty: number;
  recommendedReorderBy: string | null;
  dailyForecast: ForecastDailyPoint[];
}

export interface Alert {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

export interface DemandTrendPoint {
  label: string;
  actualUnits: number | null;
  forecastUnits: number | null;
}

export interface DashboardSummary {
  totalProducts: number;
  totalActiveAlerts: number;
  lowStockCount: number;
  overstockCount: number;
  totalInventoryValue: number;
  predictedRevenueNext30: number;
  categoryDistribution: Record<string, number>;
  categoryValueDistribution: Record<string, number>;
  recentAlerts: Alert[];
  demandTrend: DemandTrendPoint[];
}

export interface WhatIfResult {
  productId: number;
  productName: string;
  demandChangePercent: number;
  currentStock: number;
  baselinePredictedUnits30: number;
  adjustedPredictedUnits30: number;
  baselineDaysUntilStockout: number | null;
  adjustedDaysUntilStockout: number | null;
  recommendedReorderQty: number;
  recommendedReorderBy: string | null;
}

export interface CsvUploadResult {
  rowsProcessed: number;
  rowsSkipped: number;
  warnings: string[];
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  details: string[];
}
