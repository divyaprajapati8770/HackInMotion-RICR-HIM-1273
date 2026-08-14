package com.e_commerce.AI_Powered_Inventory_Backend.repository;

import com.e_commerce.AI_Powered_Inventory_Backend.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByUserIdAndIsResolvedFalseOrderByCreatedAtDesc(Long userId);

    List<Alert> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Alert> findByProductIdAndIsResolvedFalse(Long productId);
}

