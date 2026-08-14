package com.e_commerce.AI_Powered_Inventory_Backend.dto.response;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record ProductResponse(
        Long id,
        String sku,
        String name,
        String category,
        String supplierName,
        Integer supplierLeadTimeDays,
        BigDecimal unitPrice,
        BigDecimal unitCost,
        Integer currentStock,
        Integer reorderPoint,
        Integer safetyStock,
        String stockStatus,       // HEALTHY | LOW | CRITICAL | OVERSTOCK
        Double stockLevelPercent, // for the "stock pulse" UI bar
        Long warehouseId
) {}