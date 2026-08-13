package com.e_commerce.AI_Powered_Inventory_Backend.service;

import com.e_commerce.AI_Powered_Inventory_Backend.entity.Product;

public final class StockService {

    private StockService() {}

    public static String status(Product p) {
        int stock = p.getCurrentStock();
        int reorderPoint = p.getReorderPoint();
        int overstockCeiling = Math.max(reorderPoint * 4, p.getSafetyStock() * 6 + 1);

        if (stock <= 0) return "CRITICAL";
        if (stock <= reorderPoint) return "LOW";
        if (stock >= overstockCeiling) return "OVERSTOCK";
        return "HEALTHY";
    }

    /** 0-100 fill percentage for the "stock pulse" bar in the UI. */
    public static double levelPercent(Product p) {
        int overstockCeiling = Math.max(p.getReorderPoint() * 4, p.getSafetyStock() * 6 + 1);
        if (overstockCeiling <= 0) return 0;
        double pct = (p.getCurrentStock() / (double) overstockCeiling) * 100.0;
        return Math.max(0, Math.min(100, pct));
    }
}

