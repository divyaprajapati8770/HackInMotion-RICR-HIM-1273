package com.e_commerce.AI_Powered_Inventory_Backend.entity;



import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "sku"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "warehouse_id")
    private Long warehouseId;

    @Column(nullable = false, length = 80)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(name = "supplier_name", length = 150)
    private String supplierName;

    @Builder.Default
    @Column(name = "supplier_lead_time_days", nullable = false)
    private Integer supplierLeadTimeDays = 7;

    @Builder.Default
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "unit_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "current_stock", nullable = false)
    private Integer currentStock = 0;

    @Builder.Default
    @Column(name = "reorder_point", nullable = false)
    private Integer reorderPoint = 10;

    @Builder.Default
    @Column(name = "safety_stock", nullable = false)
    private Integer safetyStock = 5;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
