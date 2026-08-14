package com.e_commerce.AI_Powered_Inventory_Backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record ManualSaleRequest(
        @NotNull Long productId,
        @NotNull LocalDate saleDate,
        @NotNull @Positive Integer unitsSold
) {}
