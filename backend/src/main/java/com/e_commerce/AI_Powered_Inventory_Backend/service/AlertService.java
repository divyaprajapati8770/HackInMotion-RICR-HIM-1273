package com.e_commerce.AI_Powered_Inventory_Backend.service;

import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.AlertResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.exception.ApiException;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Alert;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Forecast;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Product;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.AlertRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ProductRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.util.StockStatusUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Requirement #5 (Smart Stock Alerts): flags products predicted to run
 * low soon, or that are sitting overstocked based on forecasted demand.
 */
@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final ProductRepository productRepository;

    @Transactional
    public void evaluateAndCreateAlerts(Product product, Forecast forecast) {
        // Avoid piling up duplicate open alerts for the same product.
        List<Alert> openAlerts = alertRepository.findByProductIdAndIsResolvedFalse(product.getId());
        openAlerts.forEach(a -> { a.setIsResolved(true); a.setResolvedAt(java.time.LocalDateTime.now()); });
        alertRepository.saveAll(openAlerts);

        String stockStatus = StockStatusUtil.status(product);

        if (forecast.getDaysUntilStockout() != null && forecast.getDaysUntilStockout() <= product.getSupplierLeadTimeDays()) {
            create(product, forecast, "STOCKOUT_IMMINENT", "CRITICAL",
                    product.getName() + " is projected to run out in " + forecast.getDaysUntilStockout() +
                            " day(s) — inside its " + product.getSupplierLeadTimeDays() + "-day supplier lead time. Reorder now.");
        } else if ("LOW".equals(stockStatus) || "CRITICAL".equals(stockStatus)) {
            create(product, forecast, "LOW_STOCK", "CRITICAL".equals(stockStatus) ? "CRITICAL" : "HIGH",
                    product.getName() + " is at " + product.getCurrentStock() + " units, at or below its reorder point of " +
                            product.getReorderPoint() + ".");
        } else if ("OVERSTOCK".equals(stockStatus)) {
            create(product, forecast, "OVERSTOCK", "MEDIUM",
                    product.getName() + " is overstocked at " + product.getCurrentStock() +
                            " units relative to forecasted demand. Consider a discount push.");
        }
    }

    private void create(Product product, Forecast forecast, String type, String severity, String message) {
        alertRepository.save(Alert.builder()
                .userId(product.getUserId())
                .productId(product.getId())
                .forecastId(forecast.getId())
                .type(type)
                .severity(severity)
                .message(message)
                .isResolved(false)
                .build());
    }

    public List<AlertResponse> listActiveAlerts(Long userId) {
        Map<Long, Product> productMap = productRepository.findByUserId(userId).stream()
                .collect(java.util.stream.Collectors.toMap(Product::getId, p -> p));

        return alertRepository.findByUserIdAndIsResolvedFalseOrderByCreatedAtDesc(userId).stream()
                .filter(a -> productMap.containsKey(a.getProductId()))
                .map(a -> toResponse(a, productMap.get(a.getProductId())))
                .toList();
    }

    @Transactional
    public void resolveAlert(Long userId, Long alertId) {
        Alert alert = alertRepository.findById(alertId)
                .filter(a -> a.getUserId().equals(userId))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Alert not found."));
        alert.setIsResolved(true);
        alert.setResolvedAt(java.time.LocalDateTime.now());
        alertRepository.save(alert);
    }

    private AlertResponse toResponse(Alert a, Product p) {
        return AlertResponse.builder()
                .id(a.getId())
                .productId(a.getProductId())
                .productName(p != null ? p.getName() : "Unknown product")
                .sku(p != null ? p.getSku() : "-")
                .type(a.getType())
                .severity(a.getSeverity())
                .message(a.getMessage())
                .isResolved(a.getIsResolved())
                .createdAt(a.getCreatedAt())
                .build();
    }
}

