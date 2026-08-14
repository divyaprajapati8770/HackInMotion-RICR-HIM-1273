package com.e_commerce.AI_Powered_Inventory_Backend.controller;

import com.e_commerce.AI_Powered_Inventory_Backend.entity.PurchaseOrder;
import com.e_commerce.AI_Powered_Inventory_Backend.security.CurrentUser;
import com.e_commerce.AI_Powered_Inventory_Backend.service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Supplier Simulation", description = "Stretch goal: simulate sending an automatic purchase order to a supplier")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @PostMapping
    @Operation(summary = "Simulate sending a purchase order for a product")
    public ResponseEntity<PurchaseOrder> create(@RequestParam Long productId, @RequestParam int quantity) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(purchaseOrderService.simulateOrder(CurrentUser.id(), productId, quantity));
    }

    @GetMapping
    @Operation(summary = "List simulated purchase orders")
    public ResponseEntity<List<PurchaseOrder>> list() {
        return ResponseEntity.ok(purchaseOrderService.listOrders(CurrentUser.id()));
    }
}
