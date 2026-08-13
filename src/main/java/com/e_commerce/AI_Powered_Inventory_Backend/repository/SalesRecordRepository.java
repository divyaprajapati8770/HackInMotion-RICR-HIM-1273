package com.e_commerce.AI_Powered_Inventory_Backend.repository;

import com.e_commerce.AI_Powered_Inventory_Backend.entity.SalesRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface SalesRecordRepository extends JpaRepository<SalesRecord, Long> {
    List<SalesRecord> findByProductIdOrderBySaleDateAsc(Long productId);
    List<SalesRecord> findByUserIdOrderBySaleDateDesc(Long userId);
    List<SalesRecord> findByProductIdAndSaleDateBetweenOrderBySaleDateAsc(Long productId, LocalDate from, LocalDate to);
    long countByUserId(Long userId);
    void deleteByUserId(Long userId);
}