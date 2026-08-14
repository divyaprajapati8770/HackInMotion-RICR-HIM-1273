package com.e_commerce.AI_Powered_Inventory_Backend.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductRequest(

        @NotBlank
        @Size(max = 80)
        String sku,

        @NotBlank
        @Size(max = 200)
        String name,

        @NotBlank
        @Size(max = 100)
        String category,

        @Size(max = 150)
        String supplierName,

        @PositiveOrZero
        @Max(3650)
        Integer supplierLeadTimeDays,

        @NotNull
        @PositiveOrZero
        @Digits(integer = 10, fraction = 2)
        BigDecimal unitPrice,

        @PositiveOrZero
        @Digits(integer = 10, fraction = 2)
        BigDecimal unitCost,

        @NotNull
        @PositiveOrZero
        @Max(100_000_000)
        Integer currentStock,

        @PositiveOrZero
        @Max(100_000_000)
        Integer reorderPoint,

        @PositiveOrZero
        @Max(100_000_000)
        Integer safetyStock,

        Long warehouseId
) {}