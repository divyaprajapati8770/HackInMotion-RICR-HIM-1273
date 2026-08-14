
package com.e_commerce.AI_Powered_Inventory_Backend.repository;

import com.e_commerce.AI_Powered_Inventory_Backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByUserIdAndIsActiveTrueOrderByNameAsc(Long userId);
    List<Product> findByUserId(Long userId);
    Optional<Product> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserIdAndSku(Long userId, String sku);
    List<Product> findByUserIdAndCategory(Long userId, String category);
}
