package com.e_commerce.AI_Powered_Inventory_Backend.repository;

import com.e_commerce.AI_Powered_Inventory_Backend.entity.Forecast;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ForecastRepository extends JpaRepository<Forecast, Long> {
    Optional<Forecast> findFirstByProductIdOrderByGeneratedAtDesc(Long productId);
    List<Forecast> findByUserIdOrderByGeneratedAtDesc(Long userId);
    List<Forecast> findByProductIdOrderByGeneratedAtDesc(Long productId);
}
