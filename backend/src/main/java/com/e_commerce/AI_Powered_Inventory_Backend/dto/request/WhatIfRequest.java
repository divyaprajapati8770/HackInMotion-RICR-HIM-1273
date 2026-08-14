package com.e_commerce.AI_Powered_Inventory_Backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record WhatIfRequest(

        @NotNull
        Long productId,

        @NotNull
        @DecimalMin("-90.0")
        @DecimalMax("500.0")
        BigDecimal demandChangePercent,

        @PositiveOrZero
        Integer leadTimeOverrideDays
) {}