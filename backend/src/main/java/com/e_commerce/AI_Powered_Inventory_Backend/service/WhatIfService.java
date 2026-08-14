package com.e_commerce.AI_Powered_Inventory_Backend.service;


import com.e_commerce.AI_Powered_Inventory_Backend.dto.request.WhatIfRequest;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.MlForecastResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.WhatIfResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.SalesRecord;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.WhatIfSimulation;
import com.e_commerce.AI_Powered_Inventory_Backend.exception.ApiException;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Product;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ForecastRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ProductRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.SalesRecordRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.WhatIfSimulationRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.service.LocalForecastEngine;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Requirement / stretch goal: "What if there's a 20% sales spike next
 * month?" — re-runs the forecast with an adjusted demand multiplier
 * without touching the stored baseline forecast.
 */
@Service
@RequiredArgsConstructor
public class WhatIfService {

    private final ProductRepository productRepository;
    private final SalesRecordRepository salesRecordRepository;
    private final ForecastRepository forecastRepository;
    private final WhatIfSimulationRepository whatIfSimulationRepository;
    private final MlClientService mlClientService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public WhatIfResponse simulate(Long userId, WhatIfRequest req) {
        Product product = productRepository.findByIdAndUserId(req.productId(), userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found."));

        List<SalesRecord> history = salesRecordRepository.findByProductIdOrderBySaleDateAsc(product.getId());
        int leadTime = req.leadTimeOverrideDays() != null ? req.leadTimeOverrideDays() : product.getSupplierLeadTimeDays();

        MlForecastResponse baseline = mlClientService.requestForecast(
                        history, 30, leadTime, product.getCurrentStock(), product.getSafetyStock(), 0.0)
                .orElseGet(() -> LocalForecastEngine.forecast(
                        history, 30, leadTime, product.getCurrentStock(), product.getSafetyStock(), 0.0));

        double changePct = req.demandChangePercent().doubleValue();
        MlForecastResponse adjusted = mlClientService.requestForecast(
                        history, 30, leadTime, product.getCurrentStock(), product.getSafetyStock(), changePct)
                .orElseGet(() -> LocalForecastEngine.forecast(
                        history, 30, leadTime, product.getCurrentStock(), product.getSafetyStock(), changePct));

        try {
            whatIfSimulationRepository.save(WhatIfSimulation.builder()
                    .userId(userId)
                    .productId(product.getId())
                    .demandChangePct(req.demandChangePercent())
                    .leadTimeOverride(req.leadTimeOverrideDays())
                    .resultJson(objectMapper.writeValueAsString(adjusted))
                    .build());
        } catch (Exception ignored) { /* non-critical persistence, safe to skip on serialization issues */ }

        return WhatIfResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .demandChangePercent(req.demandChangePercent())
                .currentStock(product.getCurrentStock())
                .baselinePredictedUnits30(java.math.BigDecimal.valueOf(baseline.predictedUnitsNext30()))
                .adjustedPredictedUnits30(java.math.BigDecimal.valueOf(adjusted.predictedUnitsNext30()))
                .baselineDaysUntilStockout(baseline.daysUntilStockout())
                .adjustedDaysUntilStockout(adjusted.daysUntilStockout())
                .recommendedReorderQty(adjusted.recommendedReorderQty())
                .recommendedReorderBy(adjusted.recommendedReorderBy() != null ? LocalDate.parse(adjusted.recommendedReorderBy()) : null)
                .build();
    }
}

