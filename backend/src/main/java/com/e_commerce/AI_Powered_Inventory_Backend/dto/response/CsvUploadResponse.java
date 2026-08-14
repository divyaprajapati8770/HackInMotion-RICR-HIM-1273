package com.e_commerce.AI_Powered_Inventory_Backend.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record CsvUploadResponse(
        int rowsProcessed,
        int rowsSkipped,
        List<String> warnings
) {}
