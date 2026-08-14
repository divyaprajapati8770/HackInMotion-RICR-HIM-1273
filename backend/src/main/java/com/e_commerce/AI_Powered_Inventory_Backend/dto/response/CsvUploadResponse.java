package com.hackinmotion.inventory.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record CsvUploadResponse(
        int rowsProcessed,
        int rowsSkipped,
        List<String> warnings
) {}
