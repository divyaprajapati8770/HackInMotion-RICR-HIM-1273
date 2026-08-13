package com.e_commerce.AI_Powered_Inventory_Backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank String sku,
        @NotBlank String name,
        @NotBlank String category,
        String supplierName,
        Integer supplierLeadTimeDays,
        @NotNull @PositiveOrZero BigDecimal unitPrice,
        BigDecimal unitCost,
        @NotNull @PositiveOrZero Integer currentStock,
        Integer reorderPoint,
        Integer safetyStock,
        Long warehouseId
) {}
