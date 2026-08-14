package com.e_commerce.AI_Powered_Inventory_Backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "what_if_simulations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhatIfSimulation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "demand_change_pct", nullable = false, precision = 6, scale = 2)
    private BigDecimal demandChangePct;

    @Column(name = "lead_time_override")
    private Integer leadTimeOverride;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result_json", columnDefinition = "json")
    private String resultJson;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

