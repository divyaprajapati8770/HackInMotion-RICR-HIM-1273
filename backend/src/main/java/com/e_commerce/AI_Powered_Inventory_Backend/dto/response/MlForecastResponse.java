package com.e_commerce.AI_Powered_Inventory_Backend.dto.response;

import java.util.List;

/** Parsed response from the Python ML microservice's /forecast endpoint. */
public record MlForecastResponse(
        String method,
        double predictedUnitsNext7,
        double predictedUnitsNext30,
        String trend,
        double trendStrength,
        double seasonalityIndex,
        double confidence,
        Integer daysUntilStockout,
        int recommendedReorderQty,
        String recommendedReorderBy, // ISO date, nullable
        List<DailyPoint> dailyForecast
) {
    public record DailyPoint(String date, double predicted, double lower, double upper, Double actual) {}
}