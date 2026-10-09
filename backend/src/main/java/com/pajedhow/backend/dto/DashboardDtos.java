package com.pajedhow.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public final class DashboardDtos {

    private DashboardDtos() {}

    public record StatCard(String label, String value, String icon) {}

    public record NameValue(String name, long value) {}

    public record TopProduct(String name, BigDecimal price, String image) {}

    public record ActivityEntry(Long id, String actor, String action, String target, String time) {}

    /** One day of the sales chart: short weekday label and revenue for that day. */
    public record SalesPoint(String day, BigDecimal value) {}

    public record CategorySales(String name, BigDecimal value) {}

    public record RecentOrder(String id, String customer, BigDecimal total, String status) {}

    /** Sales figures derived from real orders for the admin dashboard charts. */
    public record DashboardInsights(
            List<SalesPoint> salesOverview,
            List<CategorySales> salesByCategory,
            List<TopProduct> topSelling,
            List<RecentOrder> recentOrders
    ) {}

    public record DashboardResponse(
            BigDecimal totalRevenue,
            long totalOrders,
            long totalCustomers,
            long totalProducts,
            List<StatCard> stats,
            List<NameValue> orderStatusBreakdown,
            List<TopProduct> topSelling,
            List<ActivityEntry> recentActivity
    ) {}
}
