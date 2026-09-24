package com.pajedhow.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class ReportDtos {

    private ReportDtos() {}

    public record ReportPeriod(LocalDate from, LocalDate to, String label) {}

    public record ReportSummary(
            BigDecimal totalRevenue,
            long totalOrders,
            BigDecimal averageOrderValue,
            long unitsSold,
            long totalCustomers,
            long newCustomers,
            long repeatCustomers,
            long totalProducts,
            long totalStock,
            long lowStockProducts,
            long outOfStockProducts,
            BigDecimal inventoryValue
    ) {}

    public record SalesPoint(
            LocalDate date,
            String label,
            BigDecimal revenue,
            long orders,
            long units
    ) {}

    public record OrderStatusRow(String status, long orders, BigDecimal revenue) {}

    public record TopProductRow(
            Long productId,
            String name,
            String category,
            long unitsSold,
            BigDecimal revenue,
            int stock
    ) {}

    public record InventoryRow(
            Long id,
            String name,
            String sku,
            String category,
            int stock,
            String status,
            BigDecimal price,
            BigDecimal stockValue
    ) {}

    public record CustomerRow(
            String id,
            String name,
            String email,
            String phone,
            Instant joinedAt,
            long orders,
            BigDecimal totalSpent,
            Instant lastOrderAt
    ) {}

    public record OrderRow(
            Long id,
            String orderNumber,
            String customerName,
            String customerEmail,
            String status,
            String paymentStatus,
            long units,
            BigDecimal total,
            Instant createdAt
    ) {}

    public record ReportResponse(
            ReportPeriod period,
            String currency,
            String timezone,
            ReportSummary summary,
            List<SalesPoint> sales,
            List<OrderStatusRow> orderStatuses,
            List<TopProductRow> topProducts,
            List<InventoryRow> inventory,
            List<CustomerRow> customers,
            List<OrderRow> orders,
            Instant generatedAt
    ) {}
}
