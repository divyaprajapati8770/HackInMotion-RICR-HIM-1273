package com.e_commerce.AI_Powered_Inventory_Backend.dto.request;

import java.util.List;

public record ForecastRequest(
        List<SalesPoint> history,
        int horizonDays,
        int leadTimeDays,
        int currentStock,
        int safetyStock,
        double demandChangePercent // used by the what-if simulator; 0 for normal forecasts
) {
    public record SalesPoint(String date, int units) {}
}

