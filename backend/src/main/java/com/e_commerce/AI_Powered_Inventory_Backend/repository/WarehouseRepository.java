package com.e_commerce.AI_Powered_Inventory_Backend.repository;


import com.e_commerce.AI_Powered_Inventory_Backend.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    List<Warehouse> findByUserId(Long userId);
}
