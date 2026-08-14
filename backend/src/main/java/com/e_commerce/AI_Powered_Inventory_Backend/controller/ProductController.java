package com.e_commerce.AI_Powered_Inventory_Backend.controller;

import com.e_commerce.AI_Powered_Inventory_Backend.dto.request.ProductRequest;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.ProductResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.security.CurrentUser;
import com.e_commerce.AI_Powered_Inventory_Backend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {

        return ResponseEntity.ok(
                productService.listProducts(CurrentUser.id())
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                productService.getProduct(
                        CurrentUser.id(),
                        id
                )
        );
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        productService.create(
                                CurrentUser.id(),
                                request
                        )
                );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {

        return ResponseEntity.ok(
                productService.update(
                        CurrentUser.id(),
                        id,
                        request
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id) {

        productService.delete(
                CurrentUser.id(),
                id
        );

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<Void> adjustStock(
            @PathVariable Long id,
            @RequestParam int delta) {

        productService.adjustStock(
                CurrentUser.id(),
                id,
                delta
        );

        return ResponseEntity.noContent().build();
    }
}