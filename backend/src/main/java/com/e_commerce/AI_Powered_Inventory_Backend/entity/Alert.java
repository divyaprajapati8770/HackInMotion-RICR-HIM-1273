package com.e_commerce.AI_Powered_Inventory_Backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "forecast_id")
    private Long forecastId;

    @Column(nullable = false, length = 30)
    private String type; // LOW_STOCK | OVERSTOCK | STOCKOUT_IMMINENT

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String severity = "MEDIUM";

    @Column(nullable = false, length = 500)
    private String message;

    @Builder.Default
    @Column(name = "is_resolved", nullable = false)
    private Boolean isResolved = false;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
