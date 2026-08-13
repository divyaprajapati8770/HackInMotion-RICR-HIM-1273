package com.e_commerce.AI_Powered_Inventory_Backend.dto.response;



import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Builder
public record ForecastResponse(
        Long productId,
        String productName,
        String sku,
        String method,
        BigDecimal predictedUnitsNext7,
        BigDecimal predictedUnitsNext30,
        String trend,
        BigDecimal trendStrength,
        BigDecimal seasonalityIndex,
        BigDecimal confidence,
        Integer daysUntilStockout,
        Integer recommendedReorderQty,
        LocalDate recommendedReorderBy,
        List<DailyPoint> dailyForecast
) {
    @Builder
    public record DailyPoint(LocalDate date, BigDecimal predicted, BigDecimal lower, BigDecimal upper, BigDecimal actual) {}
}

