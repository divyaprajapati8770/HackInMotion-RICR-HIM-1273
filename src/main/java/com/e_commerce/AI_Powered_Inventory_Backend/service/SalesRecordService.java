package com.e_commerce.AI_Powered_Inventory_Backend.service;

import com.e_commerce.AI_Powered_Inventory_Backend.entity.SalesRecord;
import com.e_commerce.AI_Powered_Inventory_Backend.exception.ResourceNotFoundException;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ProductRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.SalesRecordRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SalesRecordService {

    private final SalesRecordRepository salesRecordRepository;
    private final ProductRepository productRepository;

    public SalesRecordService(
            SalesRecordRepository salesRecordRepository,
            ProductRepository productRepository) {

        this.salesRecordRepository = salesRecordRepository;
        this.productRepository = productRepository;
    }

    // Create Sales Record
    public SalesRecord createSalesRecord(SalesRecord salesRecord) {

        // Check whether product exists
        if (!productRepository.existsById(salesRecord.getProductId())) {
            throw new ResourceNotFoundException(
                    "Product not found with id: "
                            + salesRecord.getProductId()
            );
        }

        return salesRecordRepository.save(salesRecord);
    }

    // Get All Sales Records
    public List<SalesRecord> getAllSalesRecords() {
        return salesRecordRepository.findAll();
    }

    // Get Sales Record By ID
    public SalesRecord getSalesRecordById(Long id) {

        return salesRecordRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Sales record not found with id: " + id
                        )
                );
    }

    // Update Sales Record
    public SalesRecord updateSalesRecord(
            Long id,
            SalesRecord updatedSalesRecord) {

        // Check whether new product exists
        if (!productRepository.existsById(
                updatedSalesRecord.getProductId())) {

            throw new ResourceNotFoundException(
                    "Product not found with id: "
                            + updatedSalesRecord.getProductId()
            );
        }

        SalesRecord existingSalesRecord =
                getSalesRecordById(id);

        existingSalesRecord.setProductId(
                updatedSalesRecord.getProductId()
        );

        existingSalesRecord.setSaleDate(
                updatedSalesRecord.getSaleDate()
        );

        existingSalesRecord.setQuantity(
                updatedSalesRecord.getQuantity()
        );

        existingSalesRecord.setPrice(
                updatedSalesRecord.getPrice()
        );

        return salesRecordRepository.save(existingSalesRecord);
    }

    // Delete Sales Record
    public void deleteSalesRecord(Long id) {

        SalesRecord existingSalesRecord =
                getSalesRecordById(id);

        salesRecordRepository.delete(existingSalesRecord);
    }
}

