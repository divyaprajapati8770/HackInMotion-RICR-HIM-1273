package com.e_commerce.AI_Powered_Inventory_Backend.service;

import com.e_commerce.AI_Powered_Inventory_Backend.dto.request.ManualSaleRequest;
import com.e_commerce.AI_Powered_Inventory_Backend.security.CurrentUser;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.CsvUploadResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.exception.ApiException;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.Product;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.SalesRecord;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.ProductRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.SalesRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Owns the sales data pipeline: CSV ingestion (requirement #3) and demo
 * data seeding so a brand-new account has realistic history to forecast
 * from on day one.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SalesService {

    private final SalesRecordRepository salesRecordRepository;
    private final ProductRepository productRepository;

    // ------------------------------------------------------------------
// Sales record CRUD
// ------------------------------------------------------------------

    @Transactional
    public SalesRecord createSalesRecord(SalesRecord salesRecord) {
        Long userId = CurrentUser.id();

        Product product = productRepository.findByIdAndUserId(
                salesRecord.getProductId(),
                userId
        ).orElseThrow(() ->
                new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Product not found."
                )
        );

        salesRecord.setId(null);
        salesRecord.setUserId(userId);

        if (salesRecord.getUnitPrice() == null) {
            salesRecord.setUnitPrice(product.getUnitPrice());
        }

        if (salesRecord.getChannel() == null ||
                salesRecord.getChannel().isBlank()) {
            salesRecord.setChannel("default");
        }

        if (salesRecord.getSource() == null ||
                salesRecord.getSource().isBlank()) {
            salesRecord.setSource("MANUAL");
        }

        return salesRecordRepository.save(salesRecord);
    }

    @Transactional(readOnly = true)
    public List<SalesRecord> getAllSalesRecords() {
        return salesRecordRepository.findByUserIdOrderBySaleDateDesc(
                CurrentUser.id()
        );
    }

    @Transactional(readOnly = true)
    public SalesRecord getSalesRecordById(Long id) {
        Long userId = CurrentUser.id();

        return salesRecordRepository.findById(id)
                .filter(record -> record.getUserId().equals(userId))
                .orElseThrow(() ->
                        new ApiException(
                                HttpStatus.NOT_FOUND,
                                "Sales record not found."
                        )
                );
    }

    @Transactional
    public SalesRecord updateSalesRecord(
            Long id,
            SalesRecord updatedRecord
    ) {
        Long userId = CurrentUser.id();

        SalesRecord existing = salesRecordRepository.findById(id)
                .filter(record -> record.getUserId().equals(userId))
                .orElseThrow(() ->
                        new ApiException(
                                HttpStatus.NOT_FOUND,
                                "Sales record not found."
                        )
                );

        Product product = productRepository.findByIdAndUserId(
                updatedRecord.getProductId(),
                userId
        ).orElseThrow(() ->
                new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Product not found."
                )
        );

        existing.setProductId(product.getId());
        existing.setSaleDate(updatedRecord.getSaleDate());
        existing.setUnitsSold(updatedRecord.getUnitsSold());

        if (updatedRecord.getUnitPrice() != null) {
            existing.setUnitPrice(updatedRecord.getUnitPrice());
        } else {
            existing.setUnitPrice(product.getUnitPrice());
        }

        if (updatedRecord.getChannel() != null &&
                !updatedRecord.getChannel().isBlank()) {
            existing.setChannel(updatedRecord.getChannel());
        }

        return salesRecordRepository.save(existing);
    }

    @Transactional
    public void deleteSalesRecord(Long id) {
        Long userId = CurrentUser.id();

        SalesRecord existing = salesRecordRepository.findById(id)
                .filter(record -> record.getUserId().equals(userId))
                .orElseThrow(() ->
                        new ApiException(
                                HttpStatus.NOT_FOUND,
                                "Sales record not found."
                        )
                );

        salesRecordRepository.delete(existing);
    }

    // ------------------------------------------------------------------
    // CSV upload
    // ------------------------------------------------------------------

    @Transactional
    public CsvUploadResponse uploadCsv(
            Long userId,
            MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Please attach a non-empty CSV file."
            );
        }

        String filename = file.getOriginalFilename();

        if (filename == null || filename.isBlank()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "CSV filename is required."
            );
        }

        String normalizedFilename =
                filename.toLowerCase(Locale.ROOT);

        if (!normalizedFilename.endsWith(".csv")) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Only CSV files are allowed."
            );
        }

        String contentType = file.getContentType();

        if (contentType != null
                && !contentType.equalsIgnoreCase("text/csv")
                && !contentType.equalsIgnoreCase("application/csv")
                && !contentType.equalsIgnoreCase("application/vnd.ms-excel")
        ) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid CSV content type."
            );
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "CSV file must be smaller than 10 MB."
            );
        }

        Map<String, Product> skuIndex = new HashMap<>();

        productRepository
                .findByUserId(userId)
                .forEach(product ->
                        skuIndex.put(
                                product.getSku().toLowerCase(Locale.ROOT),
                                product
                        )
                );

        // existing parsing logic continues here...
        productRepository.findByUserId(userId).forEach(p -> skuIndex.put(p.getSku().toLowerCase(), p));

        List<String> warnings = new ArrayList<>();
        int processed = 0;
        int skipped = 0;

        try (var reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader().setSkipHeaderRecord(true).setIgnoreSurroundingSpaces(true)
                     .setTrim(true).build().parse(reader)) {

            if (!parser.getHeaderMap().keySet().stream().map(String::toLowerCase).toList()
                    .containsAll(List.of("sku", "date", "units_sold"))) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "CSV must include at least these columns: sku, date, units_sold (optional: unit_price, channel).");
            }

            List<SalesRecord> batch = new ArrayList<>();

            for (CSVRecord record : parser) {
                try {
                    String sku = get(record, "sku").toLowerCase();
                    Product product = skuIndex.get(sku);
                    if (product == null) {
                        warnings.add("Row " + record.getRecordNumber() + ": unknown SKU '" + get(record, "sku") + "', skipped.");
                        skipped++;
                        continue;
                    }

                    LocalDate date = parseDate(get(record, "date"));
                    int units = Integer.parseInt(get(record, "units_sold").trim());
                    BigDecimal price = hasColumn(record, "unit_price") && !get(record, "unit_price").isBlank()
                            ? new BigDecimal(get(record, "unit_price").trim())
                            : product.getUnitPrice();
                    String channel = hasColumn(record, "channel") && !get(record, "channel").isBlank()
                            ? get(record, "channel").trim() : "default";

                    batch.add(SalesRecord.builder()
                            .userId(userId)
                            .productId(product.getId())
                            .saleDate(date)
                            .unitsSold(units)
                            .unitPrice(price)
                            .channel(channel)
                            .source("CSV")
                            .build());
                    processed++;
                } catch (Exception rowEx) {
                    warnings.add("Row " + record.getRecordNumber() + ": " + rowEx.getMessage() + ", skipped.");
                    skipped++;
                }
            }

            salesRecordRepository.saveAll(batch);

        } catch (ApiException ae) {
            throw ae;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Could not read the CSV file. Please check its format and try again.");
        } catch (Exception e) {
            log.error("Unexpected CSV parsing failure", e);
            throw new ApiException(HttpStatus.BAD_REQUEST, "The CSV file appears malformed. Expected columns: sku, date, units_sold.");
        }

        if (processed == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "No valid rows were found in the file. Check that SKUs match existing products and dates are formatted YYYY-MM-DD.");
        }

        return CsvUploadResponse.builder().rowsProcessed(processed).rowsSkipped(skipped).warnings(warnings).build();
    }

    @Transactional
    public void addManualSale(Long userId, ManualSaleRequest req) {
        Product product = productRepository.findByIdAndUserId(req.productId(), userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found."));

        salesRecordRepository.save(SalesRecord.builder()
                .userId(userId)
                .productId(product.getId())
                .saleDate(req.saleDate())
                .unitsSold(req.unitsSold())
                .unitPrice(product.getUnitPrice())
                .source("MANUAL")
                .build());
    }

    private static String get(CSVRecord r, String col) {
        for (String key : r.getParser().getHeaderNames()) {
            if (key.equalsIgnoreCase(col)) return r.get(key);
        }
        throw new IllegalArgumentException("Missing column " + col);
    }

    private static boolean hasColumn(CSVRecord r, String col) {
        return r.getParser().getHeaderNames().stream().anyMatch(h -> h.equalsIgnoreCase(col));
    }

    private static LocalDate parseDate(String raw) {
        raw = raw.trim();
        try {
            return LocalDate.parse(raw); // ISO yyyy-MM-dd
        } catch (Exception ignored) { /* try next */ }
        try {
            String[] parts = raw.split("[/-]");
            if (parts.length == 3 && parts[2].length() == 4) {
                return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
            }
        } catch (Exception ignored) { /* fall through */ }
        throw new IllegalArgumentException("Unrecognized date '" + raw + "', use YYYY-MM-DD");
    }

    // ------------------------------------------------------------------
    // Demo data seeding — gives every new account a working dashboard
    // immediately, with realistic trend + weekly + festival seasonality
    // baked into the synthetic history (never random noise alone).
    // ------------------------------------------------------------------

    private static final record SeedProduct(
            String sku, String name, String category, double basePrice, double baseCost,
            double dailyMeanUnits, double trendPerDay, int leadTimeDays, int startingStock) {}

    @Transactional
    public void seedDemoData(Long userId) {
        List<SeedProduct> seeds = List.of(
                new SeedProduct("APR-001", "Wireless Earbuds Pro", "Electronics", 2499, 1450, 6.5, 0.015, 9, 120),
                new SeedProduct("APR-002", "Smart Fitness Band", "Electronics", 1899, 1050, 4.2, 0.02, 12, 60),
                new SeedProduct("APR-003", "USB-C Fast Charger 65W", "Electronics", 899, 420, 8.0, -0.01, 6, 200),
                new SeedProduct("APP-010", "Men's Cotton T-Shirt", "Apparel", 599, 260, 10.5, 0.01, 10, 300),
                new SeedProduct("APP-011", "Women's Denim Jacket", "Apparel", 1799, 950, 3.1, 0.03, 14, 45),
                new SeedProduct("APP-012", "Running Shoes", "Apparel", 2999, 1650, 4.8, 0.018, 15, 70),
                new SeedProduct("HOM-020", "Ceramic Dinner Set (16pc)", "Home & Kitchen", 1499, 820, 2.6, 0.005, 11, 40),
                new SeedProduct("HOM-021", "Non-Stick Cookware Set", "Home & Kitchen", 2199, 1180, 3.4, 0.012, 13, 55),
                new SeedProduct("HOM-022", "LED Desk Lamp", "Home & Kitchen", 799, 380, 5.5, -0.005, 8, 90),
                new SeedProduct("BEA-030", "Vitamin C Serum", "Beauty", 549, 210, 9.2, 0.025, 7, 150),
                new SeedProduct("BEA-031", "Herbal Shampoo 400ml", "Beauty", 349, 140, 12.0, 0.008, 6, 220),
                new SeedProduct("GRO-040", "Organic Basmati Rice 5kg", "Grocery", 649, 480, 15.0, 0.003, 4, 400),
                new SeedProduct("GRO-041", "Cold-Pressed Coconut Oil 1L", "Grocery", 429, 300, 11.0, 0.006, 5, 260),
                new SeedProduct("TOY-050", "Building Blocks Set", "Toys", 999, 520, 3.8, 0.02, 12, 65)
        );

        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(179); // ~26 weeks of history

        List<Product> products = new ArrayList<>();
        for (SeedProduct s : seeds) {
            products.add(Product.builder()
                    .userId(userId)
                    .sku(s.sku())
                    .name(s.name())
                    .category(s.category())
                    .supplierName(s.category() + " Distributors Pvt Ltd")
                    .supplierLeadTimeDays(s.leadTimeDays())
                    .unitPrice(BigDecimal.valueOf(s.basePrice()))
                    .unitCost(BigDecimal.valueOf(s.baseCost()))
                    .currentStock(s.startingStock())
                    .reorderPoint((int) Math.round(s.dailyMeanUnits() * s.leadTimeDays() * 1.4))
                    .safetyStock((int) Math.round(s.dailyMeanUnits() * 3))
                    .isActive(true)
                    .build());
        }
        products = productRepository.saveAll(products);

        List<SalesRecord> allSales = new ArrayList<>();
        for (int i = 0; i < products.size(); i++) {
            Product product = products.get(i);
            SeedProduct s = seeds.get(i);

            for (LocalDate d = start; !d.isAfter(today); d = d.plusDays(1)) {
                int dayIndex = (int) java.time.temporal.ChronoUnit.DAYS.between(start, d);

                double weekday = d.getDayOfWeek().getValue(); // 1..7
                double weekendBoost = (weekday == 6 || weekday == 7) ? 1.25 : 1.0;

                // Festival / seasonal spikes: a broad "festive season" window
                // (roughly Oct-Nov) and a mid-year sale window (roughly Jun).
                int month = d.getMonthValue();
                double seasonalBoost = 1.0;
                if (month == 10 || month == 11) seasonalBoost = 1.6;
                else if (month == 6) seasonalBoost = 1.3;
                else if (month == 1) seasonalBoost = 0.85;

                double trend = 1.0 + (s.trendPerDay() * dayIndex / 10.0);
                double noise = 0.75 + rnd.nextDouble() * 0.5; // +/-25% daily noise

                double expected = s.dailyMeanUnits() * weekendBoost * seasonalBoost * trend * noise;
                int units = (int) Math.max(0, Math.round(expected));
                if (units == 0 && rnd.nextDouble() < 0.6) continue; // realistic zero-sale days

                allSales.add(SalesRecord.builder()
                        .userId(userId)
                        .productId(product.getId())
                        .saleDate(d)
                        .unitsSold(units)
                        .unitPrice(product.getUnitPrice())
                        .channel("seed")
                        .source("SEED")
                        .build());
            }
        }
        salesRecordRepository.saveAll(allSales);
        log.info("Seeded {} demo products and {} sales records for user {}", products.size(), allSales.size(), userId);
    }
}
