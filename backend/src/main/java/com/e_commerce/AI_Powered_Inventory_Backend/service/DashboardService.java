package com.e_commerce.AI_Powered_Inventory_Backend.service;


import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.AlertResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.DashboardSummaryResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Forecast;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Product;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.SalesRecord;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ForecastRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ProductRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.SalesRecordRepository;

import com.e_commerce.AI_Powered_Inventory_Backend.util.StockStatusUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Requirement #6 (Analytics Dashboard): a single aggregated payload that
 * lets a business owner understand inventory health, category mix, and
 * demand trend in one glance — no digging through raw tables.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final SalesRecordRepository salesRecordRepository;
    private final ForecastRepository forecastRepository;
    private final AlertService alertService;

    public DashboardSummaryResponse getSummary(Long userId) {
        List<Product> products = productRepository.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);

        long lowStock = products.stream().filter(p -> {
            String s = StockStatusUtil.status(p);
            return s.equals("LOW") || s.equals("CRITICAL");
        }).count();
        long overstock = products.stream().filter(p -> StockStatusUtil.status(p).equals("OVERSTOCK")).count();

        BigDecimal totalValue = products.stream()
                .map(p -> p.getUnitCost().multiply(BigDecimal.valueOf(p.getCurrentStock())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> categoryCount = products.stream()
                .collect(Collectors.groupingBy(Product::getCategory, LinkedHashMap::new, Collectors.counting()));

        Map<String, BigDecimal> categoryValue = new LinkedHashMap<>();
        for (Product p : products) {
            BigDecimal value = p.getUnitCost().multiply(BigDecimal.valueOf(p.getCurrentStock()));
            categoryValue.merge(p.getCategory(), value, BigDecimal::add);
        }

        List<Forecast> latestForecasts = products.stream()
                .map(p -> forecastRepository.findFirstByProductIdOrderByGeneratedAtDesc(p.getId()).orElse(null))
                .filter(Objects::nonNull)
                .toList();

        BigDecimal predictedRevenue30 = BigDecimal.ZERO;
        for (int i = 0; i < products.size(); i++) {
            Product p = products.get(i);
            Optional<Forecast> f = forecastRepository.findFirstByProductIdOrderByGeneratedAtDesc(p.getId());
            if (f.isPresent()) {
                predictedRevenue30 = predictedRevenue30.add(
                        f.get().getPredictedUnitsNext30().multiply(p.getUnitPrice()));
            }
        }

        List<AlertResponse> recentAlerts = alertService.listActiveAlerts(userId).stream().limit(8).toList();

        List<DashboardSummaryResponse.DemandTrendPoint> trend = buildDemandTrend(userId, products);

        return DashboardSummaryResponse.builder()
                .totalProducts(products.size())
                .totalActiveAlerts(alertService.listActiveAlerts(userId).size())
                .lowStockCount(lowStock)
                .overstockCount(overstock)
                .totalInventoryValue(totalValue)
                .predictedRevenueNext30(predictedRevenue30)
                .categoryDistribution(categoryCount)
                .categoryValueDistribution(categoryValue)
                .recentAlerts(recentAlerts)
                .demandTrend(trend)
                .build();
    }

    /** Last 14 days of actual units sold (all products) vs. the last 14 days of forecasted units, stitched together. */
    private List<DashboardSummaryResponse.DemandTrendPoint> buildDemandTrend(Long userId, List<Product> products) {
        DateTimeFormatter label = DateTimeFormatter.ofPattern("MMM d");
        LocalDate today = LocalDate.now();

        Map<LocalDate, BigDecimal> actualByDate = new TreeMap<>();
        for (Product p : products) {
            List<SalesRecord> recent = salesRecordRepository.findByProductIdAndSaleDateBetweenOrderBySaleDateAsc(
                    p.getId(), today.minusDays(13), today);
            for (SalesRecord r : recent) {
                actualByDate.merge(r.getSaleDate(), BigDecimal.valueOf(r.getUnitsSold()), BigDecimal::add);
            }
        }

        Map<LocalDate, BigDecimal> forecastByDate = new TreeMap<>();
        for (Product p : products) {
            forecastRepository.findFirstByProductIdOrderByGeneratedAtDesc(p.getId()).ifPresent(f -> {
                // distribute predicted 7-day units evenly across the next 7 days as a light-weight trend line
                BigDecimal perDay = f.getPredictedUnitsNext7().divide(BigDecimal.valueOf(7), 2, java.math.RoundingMode.HALF_UP);
                for (int i = 1; i <= 7; i++) {
                    forecastByDate.merge(today.plusDays(i), perDay, BigDecimal::add);
                }
            });
        }

        List<DashboardSummaryResponse.DemandTrendPoint> points = new ArrayList<>();
        for (LocalDate d = today.minusDays(13); !d.isAfter(today.plusDays(7)); d = d.plusDays(1)) {
            points.add(DashboardSummaryResponse.DemandTrendPoint.builder()
                    .label(d.format(label))
                    .actualUnits(actualByDate.getOrDefault(d, null))
                    .forecastUnits(forecastByDate.getOrDefault(d, null))
                    .build());
        }
        return points;
    }
}

