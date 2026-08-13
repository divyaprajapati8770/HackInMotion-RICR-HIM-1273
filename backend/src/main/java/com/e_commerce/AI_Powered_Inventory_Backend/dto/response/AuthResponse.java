package com.e_commerce.AI_Powered_Inventory_Backend.dto.response;

import lombok.Builder;

@Builder
public record AuthResponse(
        String token,
        Long userId,
        String businessName,
        String email
) {}
