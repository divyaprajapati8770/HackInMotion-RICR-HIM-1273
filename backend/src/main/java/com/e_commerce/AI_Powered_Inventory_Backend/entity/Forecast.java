package com.e_commerce.AI_Powered_Inventory_Backend.entity;



import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "forecasts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Forecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Builder.Default
    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "horizon_days", nullable = false)
    private Integer horizonDays = 30;

    @Column(nullable = false, length = 60)
    private String method;

    @Builder.Default
    @Column(name = "predicted_units_next_7", nullable = false, precision = 10, scale = 2)
    private BigDecimal predictedUnitsNext7 = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "predicted_units_next_30", nullable = false, precision = 10, scale = 2)
    private BigDecimal predictedUnitsNext30 = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String trend = "STABLE";

    @Builder.Default
    @Column(name = "trend_strength", nullable = false, precision = 6, scale = 3)
    private BigDecimal trendStrength = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "seasonality_index", nullable = false, precision = 6, scale = 3)
    private BigDecimal seasonalityIndex = BigDecimal.ONE;

    @Builder.Default
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal confidence = BigDecimal.ZERO;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "daily_forecast_json", columnDefinition = "json")
    private String dailyForecastJson;

    @Column(name = "days_until_stockout")
    private Integer daysUntilStockout;

    @Builder.Default
    @Column(name = "recommended_reorder_qty", nullable = false)
    private Integer recommendedReorderQty = 0;

    @Column(name = "recommended_reorder_by")
    private LocalDate recommendedReorderBy;
}
