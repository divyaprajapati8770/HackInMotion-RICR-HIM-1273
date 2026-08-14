package com.e_commerce.AI_Powered_Inventory_Backend.controller;

import com.e_commerce.AI_Powered_Inventory_Backend.entity.SalesRecord;
import com.e_commerce.AI_Powered_Inventory_Backend.service.SalesService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = "*")
public class SalesRecordController {

    private final SalesService salesRecordService;

    public SalesRecordController(SalesService salesRecordService) {
        this.salesRecordService = salesRecordService;
    }

    // Create Sales Record
    @PostMapping
    public ResponseEntity<SalesRecord> createSalesRecord(
            @Valid @RequestBody SalesRecord salesRecord) {

        SalesRecord savedSalesRecord =
                salesRecordService.createSalesRecord(salesRecord);

        return new ResponseEntity<>(
                savedSalesRecord,
                HttpStatus.CREATED
        );
    }

    // Get All Sales Records
    @GetMapping
    public ResponseEntity<List<SalesRecord>> getAllSalesRecords() {
        return ResponseEntity.ok(
                salesRecordService.getAllSalesRecords()
        );
    }

    // Get Sales Record By ID
    @GetMapping("/{id}")
    public ResponseEntity<SalesRecord> getSalesRecordById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                salesRecordService.getSalesRecordById(id)
        );
    }

    // Update Sales Record
    @PutMapping("/{id}")
    public ResponseEntity<SalesRecord> updateSalesRecord(
            @PathVariable Long id,
            @Valid @RequestBody SalesRecord salesRecord) {

        return ResponseEntity.ok(
                salesRecordService.updateSalesRecord(
                        id,
                        salesRecord
                )
        );
    }

    // Delete Sales Record
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSalesRecord(
            @PathVariable Long id) {

        salesRecordService.deleteSalesRecord(id);

        return ResponseEntity.noContent().build();
    }
}
