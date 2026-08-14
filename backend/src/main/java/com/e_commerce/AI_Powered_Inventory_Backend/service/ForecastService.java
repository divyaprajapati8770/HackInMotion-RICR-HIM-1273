package com.e_commerce.AI_Powered_Inventory_Backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.ForecastResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.MlForecastResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.exception.ApiException;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Forecast;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Product;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.SalesRecord;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ForecastRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ProductRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.SalesRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForecastService {

    private final ProductRepository productRepository;
    private final SalesRecordRepository salesRecordRepository;
    private final ForecastRepository forecastRepository;
    private final MlClientService mlClientService;
    private final AlertService alertService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int DEFAULT_HORIZON_DAYS = 30;

    @Autowired
    @Lazy
    private ForecastService self;

    public ForecastResponse generateForecast(Long userId, Long productId) {

        Product product = productRepository.findByIdAndUserId(productId, userId)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.NOT_FOUND, "Product not found."));

        List<SalesRecord> history =
                salesRecordRepository.findByProductIdOrderBySaleDateAsc(productId);

        MlForecastResponse ml = mlClientService.requestForecast(
                        history,
                        DEFAULT_HORIZON_DAYS,
                        product.getSupplierLeadTimeDays(),
                        product.getCurrentStock(),
                        product.getSafetyStock(),
                        0.0
                )
                .orElseGet(() ->
                        LocalForecastEngine.forecast(
                                history,
                                DEFAULT_HORIZON_DAYS,
                                product.getSupplierLeadTimeDays(),
                                product.getCurrentStock(),
                                product.getSafetyStock(),
                                0.0
                        ));

        return self.persistForecastAndAlerts(userId, product, ml);
    }

    @Transactional
    public ForecastResponse persistForecastAndAlerts(
            Long userId,
            Product product,
            MlForecastResponse ml) {

        Forecast saved = persist(userId, product, ml);

        alertService.evaluateAndCreateAlerts(product, saved);

        return toResponse(
                product,
                saved,
                convertDailyPoints(ml.dailyForecast())
        );
    }

    @Async("forecastExecutor")
    public CompletableFuture<ForecastResponse> generateForecastAsync(
            Long userId,
            Long productId) {

        return CompletableFuture.completedFuture(
                generateForecast(userId, productId)
        );
    }

    public List<ForecastResponse> generateForecastsForAllProducts(Long userId) {

        List<Product> products =
                productRepository.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);

        List<CompletableFuture<ForecastResponse>> futures =
                products.stream()
                        .map(p -> self.generateForecastAsync(userId, p.getId()))
                        .toList();

        return futures.stream()
                .map(CompletableFuture::join)
                .toList();
    }

    public ForecastResponse getLatestForecast(Long userId, Long productId) {

        Product product = productRepository.findByIdAndUserId(productId, userId)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.NOT_FOUND, "Product not found."));

        Optional<Forecast> existing =
                forecastRepository.findFirstByProductIdOrderByGeneratedAtDesc(productId);

        if (existing.isEmpty()) {
            return generateForecast(userId, productId);
        }

        return toResponse(
                product,
                existing.get(),
                parseDaily(existing.get().getDailyForecastJson())
        );
    }

    private Forecast persist(
            Long userId,
            Product product,
            MlForecastResponse ml) {

        String json;

        try {
            json = objectMapper.writeValueAsString(ml.dailyForecast());
        } catch (Exception e) {
            json = "[]";
        }

        Forecast forecast = Forecast.builder()
                .userId(userId)
                .productId(product.getId())
                .horizonDays(DEFAULT_HORIZON_DAYS)
                .method(ml.method())
                .predictedUnitsNext7(
                        BigDecimal.valueOf(ml.predictedUnitsNext7())
                )
                .predictedUnitsNext30(
                        BigDecimal.valueOf(ml.predictedUnitsNext30())
                )
                .trend(ml.trend())
                .trendStrength(
                        BigDecimal.valueOf(ml.trendStrength())
                )
                .seasonalityIndex(
                        BigDecimal.valueOf(ml.seasonalityIndex())
                )
                .confidence(
                        BigDecimal.valueOf(ml.confidence())
                )
                .dailyForecastJson(json)
                .daysUntilStockout(ml.daysUntilStockout())
                .recommendedReorderQty(ml.recommendedReorderQty())
                .recommendedReorderBy(
                        ml.recommendedReorderBy() != null
                                ? LocalDate.parse(ml.recommendedReorderBy())
                                : null
                )
                .build();

        return forecastRepository.save(forecast);
    }

    private List<ForecastResponse.DailyPoint> parseDaily(String json) {

        try {

            var mlPoints =
                    objectMapper.readValue(
                            json,
                            MlForecastResponse.DailyPoint[].class
                    );

            return List.of(mlPoints)
                    .stream()
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

        } catch (Exception e) {

            return List.of();
        }
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

    private ForecastResponse toResponse(
            Product product,
            Forecast f,
            List<ForecastResponse.DailyPoint> daily) {

        if (daily == null) {
            daily = List.of();
        }

        return ForecastResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .sku(product.getSku())
                .method(f.getMethod())
                .predictedUnitsNext7(f.getPredictedUnitsNext7())
                .predictedUnitsNext30(f.getPredictedUnitsNext30())
                .trend(f.getTrend())
                .trendStrength(f.getTrendStrength())
                .seasonalityIndex(f.getSeasonalityIndex())
                .confidence(f.getConfidence())
                .daysUntilStockout(f.getDaysUntilStockout())
                .recommendedReorderQty(f.getRecommendedReorderQty())
                .recommendedReorderBy(f.getRecommendedReorderBy())
                .dailyForecast(daily)
                .build();
    }
}