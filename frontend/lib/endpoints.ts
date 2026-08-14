import { api } from "./api-client";
import type {
  Alert,
  AuthResponse,
  CsvUploadResult,
  DashboardSummary,
  Forecast,
  Product,
  WhatIfResult,
} from "./types";

// ---- Auth ----
export async function signup(payload: {
  businessName: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post<AuthResponse>("/api/auth/signup", payload);

  return data;
}

export async function login(payload: {
  email: string;
  password: string;
}) {
  const { data } = await api.post<AuthResponse>("/api/auth/login", payload);

  return data;
}

export async function verifyEmail(token: string) {
  const { data } = await api.get("/api/auth/verify", {
    params: { token },
  });

  return data;
}

// ---- Products ----
export async function listProducts() {
  const { data } = await api.get<Product[]>("/api/products");
  return data;
}

export async function getProduct(id: number) {
  const { data } = await api.get<Product>(`/api/products/${id}`);
  return data;
}

export interface ProductInput {
  sku: string;
  name: string;
  category: string;
  supplierName?: string;
  supplierLeadTimeDays?: number;
  unitPrice: number;
  unitCost?: number;
  currentStock: number;
  reorderPoint?: number;
  safetyStock?: number;
  warehouseId?: number;
}

export async function createProduct(payload: ProductInput) {
  const { data } = await api.post<Product>("/api/products", payload);
  return data;
}

export async function updateProduct(id: number, payload: ProductInput) {
  const { data } = await api.put<Product>(`/api/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id: number) {
  await api.delete(`/api/products/${id}`);
}

export async function adjustStock(id: number, delta: number) {
  await api.patch(`/api/products/${id}/stock`, null, { params: { delta } });
}

// ---- Sales ----
export async function uploadSalesCsv(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<CsvUploadResult>("/api/sales/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function addManualSale(payload: { productId: number; saleDate: string; unitsSold: number }) {
  await api.post("/api/sales/manual", payload);
}

// ---- Forecasts ----
export async function getForecast(productId: number) {
  const { data } = await api.get<Forecast>(`/api/forecasts/${productId}`);
  return data;
}

export async function regenerateForecast(productId: number) {
  const { data } = await api.post<Forecast>(`/api/forecasts/${productId}/generate`);
  return data;
}

export async function regenerateAllForecasts() {
  const { data } = await api.post<Forecast[]>("/api/forecasts/generate-all");
  return data;
}

// ---- Alerts ----
export async function listAlerts() {
  const { data } = await api.get<Alert[]>("/api/alerts");
  return data;
}

export async function resolveAlert(id: number) {
  await api.patch(`/api/alerts/${id}/resolve`);
}

export async function verifyEmail(token: string) {
  const { data } = await api.get("/api/auth/verify", {
    params: { token },
  });

  return data;
}

// ---- Dashboard ----
export async function getDashboardSummary() {
  const { data } = await api.get<DashboardSummary>("/api/dashboard/summary");
  return data;
}

// ---- What-if ----
export async function simulateWhatIf(payload: {
  productId: number;
  demandChangePercent: number;
  leadTimeOverrideDays?: number;
}) {
  const { data } = await api.post<WhatIfResult>("/api/what-if/simulate", payload);
  return data;
}

// ---- Purchase orders (supplier simulation) ----
export async function simulatePurchaseOrder(productId: number, quantity: number) {
  const { data } = await api.post(`/api/purchase-orders`, null, { params: { productId, quantity } });
  return data;
}
