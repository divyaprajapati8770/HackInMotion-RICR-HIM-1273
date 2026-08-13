package com.e_commerce.AI_Powered_Inventory_Backend.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Builder
public record DashboardSummaryResponse(
        long totalProducts,
        long totalActiveAlerts,
        long lowStockCount,
        long overstockCount,
        BigDecimal totalInventoryValue,
        BigDecimal predictedRevenueNext30,
        Map<String, Long> categoryDistribution,
        Map<String, BigDecimal> categoryValueDistribution,
        List<DemandTrendPoint> demandTrend
) {
    @Builder
    public record DemandTrendPoint(String label, BigDecimal actualUnits, BigDecimal forecastUnits) {}
}
