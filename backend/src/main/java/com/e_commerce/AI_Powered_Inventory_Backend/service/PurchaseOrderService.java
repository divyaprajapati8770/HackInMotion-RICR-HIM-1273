package com.e_commerce.AI_Powered_Inventory_Backend.service;


import com.e_commerce.AI_Powered_Inventory_Backend.exception.ApiException;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Product;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.PurchaseOrder;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ProductRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Stretch goal: Supplier Integration Simulation — "sends" (simulates) an
 * automatic purchase order to the supplier when stock is predicted to run
 * low, without any real supplier integration.
 */
@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProductRepository productRepository;

    @Transactional
    public PurchaseOrder simulateOrder(Long userId, Long productId, int quantity) {
        Product product = productRepository.findByIdAndUserId(productId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found."));

        PurchaseOrder po = PurchaseOrder.builder()
                .userId(userId)
                .productId(productId)
                .quantity(quantity)
                .status("SIMULATED")
                .supplierName(product.getSupplierName())
                .expectedArrival(LocalDate.now().plusDays(product.getSupplierLeadTimeDays()))
                .build();

        return purchaseOrderRepository.save(po);
    }

    public List<PurchaseOrder> listOrders(Long userId) {
        return purchaseOrderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}

