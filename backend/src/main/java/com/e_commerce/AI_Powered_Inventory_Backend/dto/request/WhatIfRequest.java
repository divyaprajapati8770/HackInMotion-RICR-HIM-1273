package com.e_commerce.AI_Powered_Inventory_Backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record WhatIfRequest(
        @NotNull Long productId,
        @NotNull BigDecimal demandChangePercent, // e.g. 20 for "+20% sales spike"
        Integer leadTimeOverrideDays
) {}
