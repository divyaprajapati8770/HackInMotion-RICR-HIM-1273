package com.e_commerce.AI_Powered_Inventory_Backend.service;



import com.fasterxml.jackson.databind.ObjectMapper;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.MlForecastResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.ForecastResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.exception.ApiException;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Forecast;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Product;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.SalesRecord;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ForecastRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ProductRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.SalesRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForecastService {

    private final ProductRepository productRepository;
    private final SalesRecordRepository salesRecordRepository;
    private final ForecastRepository forecastRepository;
    private final MlClientService mlClientService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int DEFAULT_HORIZON_DAYS = 30;

    @Transactional
    public ForecastResponse generateForecast(Long userId, Long productId) {

        Product product = productRepository
                .findByIdAndUserId(productId, userId)
                .orElseThrow(() ->
                        new ApiException(
                                HttpStatus.NOT_FOUND,
                                "Product not found."
                        )
                );

        List<SalesRecord> history =
                salesRecordRepository
                        .findByProductIdOrderBySaleDateAsc(productId);

        ForecastResponse ml =
                mlClientService.requestForecast(
                        history,
                        DEFAULT_HORIZON_DAYS,
                        product.getSupplierLeadTimeDays(),
                        product.getCurrentStock(),
                        product.getSafetyStock(),
                        0.0
                ).orElseGet(() ->
                        LocalForecastEngine.forecast(
                                history,
                                DEFAULT_HORIZON_DAYS,
                                product.getSupplierLeadTimeDays(),
                                product.getCurrentStock(),
                                product.getSafetyStock(),
                                0.0
                        )
                );

        Forecast saved = persist(userId, product, ml);

        alertService.evaluateAndCreateAlerts(product, saved);

        return toResponse(
                product,
                saved,
                convertDailyPoints(ml.dailyForecast())
        );
    }

    @Transactional
    public List<ForecastResponse> generateForecastsForAllProducts(
            Long userId) {

        return productRepository
                .findByUserIdAndIsActiveTrueOrderByNameAsc(userId)
                .stream()
                .map(p -> generateForecast(userId, p.getId()))
                .toList();
    }

    public ForecastResponse getLatestForecast(
            Long userId,
            Long productId) {

        Product product =
                productRepository
                        .findByIdAndUserId(productId, userId)
                        .orElseThrow(() ->
                                new ApiException(
                                        HttpStatus.NOT_FOUND,
                                        "Product not found."
                                )
                        );

        Optional<Forecast> existing =
                forecastRepository
                        .findFirstByProductIdOrderByGeneratedAtDesc(
                                productId
                        );

        if (existing.isEmpty()) {
            return generateForecast(userId, productId);
        }

        return toResponse(
                product,
                existing.get(),
                parseDaily(
                        existing.get().getDailyForecastJson()
                )
        );
    }

    private Forecast persist(
            Long userId,
            Product product,
            MlForecastResponse ml) {

        String json;

        try {
            json = objectMapper.writeValueAsString(
                    ml.dailyForecast()
            );
        } catch (Exception e) {
            log.warn(
                    "Could not serialize daily forecast: {}",
                    e.getMessage()
            );
            json = "[]";
        }

        Forecast forecast = Forecast.builder()
                .userId(userId)
                .productId(product.getId())
                .horizonDays(DEFAULT_HORIZON_DAYS)
                .method(ml.method())
                .predictedUnitsNext7(
                        BigDecimal.valueOf(
                                ml.predictedUnitsNext7()
                        )
                )
                .predictedUnitsNext30(
                        BigDecimal.valueOf(
                                ml.predictedUnitsNext30()
                        )
                )
                .trend(ml.trend())
                .trendStrength(
                        BigDecimal.valueOf(
                                ml.trendStrength()
                        )
                )
                .seasonalityIndex(
                        BigDecimal.valueOf(
                                ml.seasonalityIndex()
                        )
                )
                .confidence(
                        BigDecimal.valueOf(
                                ml.confidence()
                        )
                )
                .dailyForecastJson(json)
                .daysUntilStockout(
                        ml.daysUntilStockout()
                )
                .recommendedReorderQty(
                        ml.recommendedReorderQty()
                )
                .recommendedReorderBy(
                        ml.recommendedReorderBy() != null
                                ? LocalDate.parse(
                                ml.recommendedReorderBy()
                        )
                                : null
                )
                .build();

        return forecastRepository.save(forecast);
    }

    private List<ForecastResponse.DailyPoint> convertDailyPoints(
            List<MlForecastResponse.DailyPoint> mlPoints) {

        if (mlPoints == null || mlPoints.isEmpty()) {
            return List.of();
        }

        return mlPoints.stream()
                .map(p -> ForecastResponse.DailyPoint.builder()
                        .date(LocalDate.parse(p.date()))
                        .predicted(
                                BigDecimal.valueOf(p.predicted())
                        )
                        .lower(
                                BigDecimal.valueOf(p.lower())
                        )
                        .upper(
                                BigDecimal.valueOf(p.upper())
                        )
                        .actual(
                                p.actual() != null
                                        ? BigDecimal.valueOf(p.actual())
                                        : null
                        )
                        .build()
                )
                .toList();
    }

    private List<ForecastResponse.DailyPoint> parseDaily(
            String json) {

        try {
            MlForecastResponse.DailyPoint[] mlPoints =
                    objectMapper.readValue(
                            json,
                            MlForecastResponse.DailyPoint[].class
                    );

            return convertDailyPoints(
                    List.of(mlPoints)
            );

        } catch (Exception e) {
            log.warn(
                    "Could not parse stored daily forecast: {}",
                    e.getMessage()
            );
            return List.of();
        }
    }

    private ForecastResponse toResponse(
            Product product,
            Forecast f,
            List<ForecastResponse.DailyPoint> daily) {

        return ForecastResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .sku(product.getSku())
                .method(f.getMethod())
                .predictedUnitsNext7(
                        f.getPredictedUnitsNext7()
                )
                .predictedUnitsNext30(
                        f.getPredictedUnitsNext30()
                )
                .trend(f.getTrend())
                .trendStrength(
                        f.getTrendStrength()
                )
                .seasonalityIndex(
                        f.getSeasonalityIndex()
                )
                .confidence(
                        f.getConfidence()
                )
                .daysUntilStockout(
                        f.getDaysUntilStockout()
                )
                .recommendedReorderQty(
                        f.getRecommendedReorderQty()
                )
                .recommendedReorderBy(
                        f.getRecommendedReorderBy()
                )
                .dailyForecast(daily)
                .build();
    }
}
