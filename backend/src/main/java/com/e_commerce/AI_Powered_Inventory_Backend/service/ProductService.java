package com.e_commerce.AI_Powered_Inventory_Backend.service;


import com.e_commerce.AI_Powered_Inventory_Backend.dto.request.ProductRequest;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.ProductResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.exception.ApiException;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Product;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ProductRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.util.StockStatusUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public List<ProductResponse> listProducts(Long userId) {
        return productRepository.findByUserIdAndIsActiveTrueOrderByNameAsc(userId)
                .stream().map(this::toResponse).toList();
    }

    public ProductResponse getProduct(Long userId, Long productId) {
        return toResponse(findOwned(userId, productId));
    }

    @Transactional
    public ProductResponse create(Long userId, ProductRequest req) {
        if (productRepository.existsByUserIdAndSku(userId, req.sku())) {
            throw new ApiException(HttpStatus.CONFLICT, "A product with SKU '" + req.sku() + "' already exists.");
        }

        Product product = Product.builder()
                .userId(userId)
                .warehouseId(req.warehouseId())
                .sku(req.sku().trim())
                .name(req.name().trim())
                .category(req.category().trim())
                .supplierName(req.supplierName())
                .supplierLeadTimeDays(req.supplierLeadTimeDays() != null ? req.supplierLeadTimeDays() : 7)
                .unitPrice(req.unitPrice())
                .unitCost(req.unitCost() != null ? req.unitCost() : BigDecimal.ZERO)
                .currentStock(req.currentStock())
                .reorderPoint(req.reorderPoint() != null ? req.reorderPoint() : 10)
                .safetyStock(req.safetyStock() != null ? req.safetyStock() : 5)
                .isActive(true)
                .build();

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long userId, Long productId, ProductRequest req) {
        Product product = findOwned(userId, productId);

        product.setSku(req.sku().trim());
        product.setName(req.name().trim());
        product.setCategory(req.category().trim());
        product.setSupplierName(req.supplierName());
        if (req.supplierLeadTimeDays() != null) product.setSupplierLeadTimeDays(req.supplierLeadTimeDays());
        product.setUnitPrice(req.unitPrice());
        if (req.unitCost() != null) product.setUnitCost(req.unitCost());
        product.setCurrentStock(req.currentStock());
        if (req.reorderPoint() != null) product.setReorderPoint(req.reorderPoint());
        if (req.safetyStock() != null) product.setSafetyStock(req.safetyStock());
        if (req.warehouseId() != null) product.setWarehouseId(req.warehouseId());

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(Long userId, Long productId) {
        Product product = findOwned(userId, productId);
        product.setIsActive(false);
        productRepository.save(product);
    }

    @Transactional
    public void adjustStock(Long userId, Long productId, int delta) {
        Product product = findOwned(userId, productId);
        product.setCurrentStock(Math.max(0, product.getCurrentStock() + delta));
        productRepository.save(product);
    }

    Product findOwned(Long userId, Long productId) {
        return productRepository.findByIdAndUserId(productId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found."));
    }

    private ProductResponse toResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId())
                .sku(p.getSku())
                .name(p.getName())
                .category(p.getCategory())
                .supplierName(p.getSupplierName())
                .supplierLeadTimeDays(p.getSupplierLeadTimeDays())
                .unitPrice(p.getUnitPrice())
                .unitCost(p.getUnitCost())
                .currentStock(p.getCurrentStock())
                .reorderPoint(p.getReorderPoint())
                .safetyStock(p.getSafetyStock())
                .stockStatus(StockStatusUtil.status(p))
                .stockLevelPercent(StockStatusUtil.levelPercent(p))
                .warehouseId(p.getWarehouseId())
                .build();
    }
}
