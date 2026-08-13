package com.e_commerce.AI_Powered_Inventory_Backend.controller;

import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.ForecastResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.security.CurrentUser;
import com.e_commerce.AI_Powered_Inventory_Backend.service.ForecastService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forecasts")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Forecasting", description = "Demand forecasting engine — the technical core (requirement #4)")
public class ForecastController {

    private final ForecastService forecastService;

    @GetMapping("/{productId}")
    @Operation(summary = "Get the latest forecast for a product", description = "Auto-generates one on first call if none exists yet.")
    public ResponseEntity<ForecastResponse> getLatest(@PathVariable Long productId) {
        return ResponseEntity.ok(forecastService.getLatestForecast(CurrentUser.id(), productId));
    }

    @PostMapping("/{productId}/generate")
    @Operation(summary = "Force-regenerate the forecast for a single product from its current sales history")
    public ResponseEntity<ForecastResponse> generate(@PathVariable Long productId) {
        return ResponseEntity.ok(forecastService.generateForecast(CurrentUser.id(), productId));
    }

    @PostMapping("/generate-all")
    @Operation(summary = "Regenerate forecasts for every active product in the account")
    public ResponseEntity<List<ForecastResponse>> generateAll() {
        return ResponseEntity.ok(forecastService.generateForecastsForAllProducts(CurrentUser.id()));
    }
}