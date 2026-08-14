package com.e_commerce.AI_Powered_Inventory_Backend.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
public record WhatIfResponse(
        Long productId,
        String productName,
        BigDecimal demandChangePercent,
        Integer currentStock,
        BigDecimal baselinePredictedUnits30,
        BigDecimal adjustedPredictedUnits30,
        Integer baselineDaysUntilStockout,
        Integer adjustedDaysUntilStockout,
        Integer recommendedReorderQty,
        LocalDate recommendedReorderBy
) {}
