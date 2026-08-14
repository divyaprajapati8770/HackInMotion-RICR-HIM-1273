package com.e_commerce.AI_Powered_Inventory_Backend.service;

import com.e_commerce.AI_Powered_Inventory_Backend.dto.request.MlForecastRequest;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.MlForecastResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.SalesRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Thin client around the Python ML microservice. If the microservice is
 * unreachable (e.g. not started, or slow), calls fail fast and the caller
 * (ForecastService) falls back to a Java-native statistical method so the
 * dashboard never shows a blank/broken screen (requirement #9).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MlClientService {

    private final WebClient mlServiceWebClient;

    public Optional<MlForecastResponse> requestForecast(List<SalesRecord> history, int horizonDays,
                                                        int leadTimeDays, int currentStock,
                                                        int safetyStock, double demandChangePercent) {
        try {
            DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
            List<MlForecastRequest.SalesPoint> points = history.stream()
                    .map(r -> new MlForecastRequest.SalesPoint(r.getSaleDate().format(fmt), r.getUnitsSold()))
                    .toList();

            MlForecastRequest req = new MlForecastRequest(points, horizonDays, leadTimeDays,
                    currentStock, safetyStock, demandChangePercent);

            MlForecastResponse response = mlServiceWebClient.post()
                    .uri("/forecast")
                    .bodyValue(req)
                    .retrieve()
                    .bodyToMono(MlForecastResponse.class)
                    .timeout(Duration.ofSeconds(6))
                    .retryWhen(Retry.backoff(1, Duration.ofMillis(300)))
                    .onErrorResume(e -> {
                        log.warn("ML service call failed, will fall back to local forecasting: {}", e.getMessage());
                        return Mono.empty();
                    })
                    .block();

            return Optional.ofNullable(response);
        } catch (Exception e) {
            log.warn("ML service unreachable, falling back: {}", e.getMessage());
            return Optional.empty();
        }
    }
}