package com.e_commerce.AI_Powered_Inventory_Backend.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record AlertResponse(
        Long id,
        Long productId,
        String productName,
        String sku,
        String type,
        String severity,
        String message,
        Boolean isResolved,
        LocalDateTime createdAt
) {}