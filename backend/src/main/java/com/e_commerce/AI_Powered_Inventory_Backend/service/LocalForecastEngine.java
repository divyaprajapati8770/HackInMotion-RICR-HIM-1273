package com.e_commerce.AI_Powered_Inventory_Backend.service;


import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.MlForecastResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.SalesRecord;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

public final class LocalForecastEngine {

    private LocalForecastEngine() {}

    public static MlForecastResponse forecast(
            List<SalesRecord> history,
            int horizonDays,
            int leadTimeDays,
            int currentStock,
            int safetyStock,
            double demandChangePercent) {

        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;

        if (history.isEmpty()) {
            return new MlForecastResponse(
                    "MOVING_AVERAGE_FALLBACK",
                    0,
                    0,
                    "STABLE",
                    0,
                    1,
                    20,
                    null,
                    safetyStock,
                    null,
                    List.of()
            );
        }

        history = new ArrayList<>(history);
        history.sort(Comparator.comparing(SalesRecord::getSaleDate));

        LocalDate lastDate =
                history.get(history.size() - 1).getSaleDate();

        // Aggregate sales into a dense daily series.
        // Missing days are filled with 0.
        LocalDate firstDate =
                history.get(0).getSaleDate();

        Map<LocalDate, Integer> byDate = new TreeMap<>();

        for (LocalDate d = firstDate;
             !d.isAfter(lastDate);
             d = d.plusDays(1)) {

            byDate.put(d, 0);
        }

        for (SalesRecord r : history) {
            byDate.merge(
                    r.getSaleDate(),
                    r.getUnitsSold(),
                    Integer::sum
            );
        }

        List<LocalDate> dates =
                new ArrayList<>(byDate.keySet());

        List<Integer> series =
                dates.stream()
                        .map(byDate::get)
                        .toList();

        int n = series.size();

        // Weighted moving average over the last 28 days.
        int window = Math.min(28, n);

        double weightedSum = 0;
        double weightTotal = 0;

        for (int i = 0; i < window; i++) {
            int idx = n - window + i;

            double weight = i + 1;

            weightedSum += series.get(idx) * weight;
            weightTotal += weight;
        }

        double baseline =
                weightTotal > 0
                        ? weightedSum / weightTotal
                        : average(series);

        // Linear trend.
        double trendPerDay =
                linearSlope(series, window);

        String trendLabel = "STABLE";

        if (trendPerDay > 0.02 * Math.max(baseline, 1)) {
            trendLabel = "UP";
        } else if (trendPerDay < -0.02 * Math.max(baseline, 1)) {
            trendLabel = "DOWN";
        }

        // Day-of-week seasonality.
        Map<DayOfWeek, List<Integer>> byDow =
                new EnumMap<>(DayOfWeek.class);

        for (int i = 0; i < n; i++) {
            byDow
                    .computeIfAbsent(
                            dates.get(i).getDayOfWeek(),
                            k -> new ArrayList<>()
                    )
                    .add(series.get(i));
        }

        double overallMean =
                Math.max(average(series), 0.0001);

        Map<DayOfWeek, Double> dowIndex =
                new EnumMap<>(DayOfWeek.class);

        for (DayOfWeek dow : DayOfWeek.values()) {

            List<Integer> vals =
                    byDow.getOrDefault(dow, List.of());

            double mean =
                    vals.isEmpty()
                            ? overallMean
                            : average(vals);

            dowIndex.put(
                    dow,
                    mean / overallMean
            );
        }

        double demandMultiplier =
                1.0 + (demandChangePercent / 100.0);

        List<MlForecastResponse.DailyPoint> daily =
                new ArrayList<>();

        double cumulative7 = 0;
        double cumulative30 = 0;

        double runningStock = currentStock;

        Integer daysUntilStockout = null;

        for (int day = 1;
             day <= horizonDays;
             day++) {

            LocalDate futureDate =
                    lastDate.plusDays(day);

            double trended =
                    baseline + trendPerDay * day;

            double seasonal =
                    trended *
                            dowIndex.getOrDefault(
                                    futureDate.getDayOfWeek(),
                                    1.0
                            );

            double predicted =
                    Math.max(
                            0,
                            seasonal * demandMultiplier
                    );

            double band =
                    predicted * 0.25;

            daily.add(
                    new MlForecastResponse.DailyPoint(
                            futureDate.format(fmt),
                            round2(predicted),
                            round2(
                                    Math.max(
                                            0,
                                            predicted - band
                                    )
                            ),
                            round2(predicted + band),
                            null
                    )
            );

            if (day <= 7) {
                cumulative7 += predicted;
            }

            cumulative30 += predicted;

            runningStock -= predicted;

            if (daysUntilStockout == null &&
                    runningStock <= 0) {

                daysUntilStockout = day;
            }
        }

        double confidence =
                Math.min(
                        92,
                        Math.max(
                                35,
                                40 + Math.min(n, 90) * 0.5
                        )
                );

        int reorderQty =
                (int) Math.round(
                        Math.max(
                                0,
                                (
                                        baseline * demandMultiplier *
                                                (leadTimeDays + 7)
                                )
                                        - currentStock
                                        + safetyStock
                        )
                );

        String reorderBy = null;

        if (daysUntilStockout != null) {

            int reorderInDays =
                    Math.max(
                            0,
                            daysUntilStockout - leadTimeDays
                    );

            reorderBy =
                    lastDate
                            .plusDays(reorderInDays)
                            .format(fmt);
        }

        return new MlForecastResponse(
                "WEIGHTED_MOVING_AVERAGE_TREND_SEASONALITY",
                round2(cumulative7),
                round2(cumulative30),
                trendLabel,
                round2(trendPerDay),
                round2(
                        overallMean > 0
                                ? average(
                                new ArrayList<>(
                                        dowIndex.values()
                                )
                        )
                                : 1
                ),
                round2(confidence),
                daysUntilStockout,
                reorderQty,
                reorderBy,
                daily
        );
    }

    /*
     * FIX:
     *
     * Previously:
     *     average(List<Integer> vals)
     *
     * But dowIndex.values() contains Double values.
     *
     * Using Number allows both Integer and Double.
     */
    private static double average(List<? extends Number> vals) {

        return vals.isEmpty()
                ? 0
                : vals.stream()
                .mapToDouble(Number::doubleValue)
                .average()
                .orElse(0);
    }

    private static double linearSlope(
            List<Integer> series,
            int window) {

        int n = series.size();

        int from =
                Math.max(
                        0,
                        n - window
                );

        int count =
                n - from;

        if (count < 2) {
            return 0;
        }

        double sumX = 0;
        double sumY = 0;
        double sumXY = 0;
        double sumXX = 0;

        for (int i = 0; i < count; i++) {

            double x = i;

            double y =
                    series.get(from + i);

            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }

        double denom =
                count * sumXX -
                        sumX * sumX;

        if (denom == 0) {
            return 0;
        }

        return (
                count * sumXY -
                        sumX * sumY
        ) / denom;
    }

    private static double round2(double v) {

        return Math.round(v * 100.0) / 100.0;
    }
}