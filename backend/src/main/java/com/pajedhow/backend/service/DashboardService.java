package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.DashboardDtos.*;
import com.pajedhow.backend.entity.Category;
import com.pajedhow.backend.entity.Order;
import com.pajedhow.backend.entity.OrderItem;
import com.pajedhow.backend.entity.Product;
import com.pajedhow.backend.entity.Role;
import com.pajedhow.backend.entity.enums.Enums.OrderStatus;
import com.pajedhow.backend.entity.enums.Enums.ProductStatus;
import com.pajedhow.backend.repository.CategoryRepository;
import com.pajedhow.backend.repository.OrderRepository;
import com.pajedhow.backend.repository.ProductRepository;
import com.pajedhow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final SystemSettingsService settingsService;
    private final CategoryRepository categoryRepository;

    private static final int SALES_DAYS = 7;
    private static final int INSIGHT_WINDOW_DAYS = 90;

    @Transactional(readOnly = true)
    public DashboardResponse overview() {
        BigDecimal revenue = orderRepository.totalRevenue();
        String currency = settingsService.getPublicSettings().currency();
        long totalOrders = orderRepository.count();
        long totalCustomers = userRepository.countByRole(Role.BUYER);
        long totalProducts = productRepository.countByStatus(ProductStatus.PUBLISHED);

        List<StatCard> stats = List.of(
                new StatCard("Total Revenue", currency + " " + formatAmount(revenue), "dollar-sign"),
                new StatCard("Orders", String.valueOf(totalOrders), "shopping-bag"),
                new StatCard("Customers", String.valueOf(totalCustomers), "users"),
                new StatCard("Products", String.valueOf(totalProducts), "package")
        );

        List<NameValue> breakdown = Arrays.stream(OrderStatus.values())
                .map(s -> new NameValue(prettify(s.name()), orderRepository.countByStatus(s)))
                .toList();

        List<TopProduct> topSelling = productRepository
                .findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "reviews")))
                .map(this::toTopProduct)
                .getContent();

        List<ActivityEntry> recent = activityLogService.recent(8).stream()
                .map(a -> new ActivityEntry(a.getId(), a.getActor(), a.getAction(),
                        a.getTarget(), relativeTime(a.getCreatedAt())))
                .toList();

        return new DashboardResponse(revenue, totalOrders, totalCustomers, totalProducts,
                stats, breakdown, topSelling, recent);
    }

    /**
     * Chart data computed from orders: revenue per day for the last week, and
     * revenue by category plus best sellers over the last 90 days. Cancelled
     * orders are left out of every figure.
     */
    @Transactional(readOnly = true)
    public DashboardInsights insights() {
        ZoneId zone = storeZone();
        Instant now = Instant.now();
        LocalDate today = LocalDate.ofInstant(now, zone);

        List<Order> window = orderRepository
                .findForReport(now.minus(INSIGHT_WINDOW_DAYS, ChronoUnit.DAYS), now.plus(1, ChronoUnit.DAYS))
                .stream()
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .toList();

        // Revenue per day, oldest first, with empty days kept so the chart has a steady axis.
        Map<LocalDate, BigDecimal> perDay = new LinkedHashMap<>();
        for (int offset = SALES_DAYS - 1; offset >= 0; offset--) {
            perDay.put(today.minusDays(offset), BigDecimal.ZERO);
        }
        for (Order order : window) {
            LocalDate day = LocalDate.ofInstant(order.getCreatedAt(), zone);
            if (perDay.containsKey(day)) {
                perDay.merge(day, order.getTotal(), BigDecimal::add);
            }
        }
        List<SalesPoint> salesOverview = perDay.entrySet().stream()
                .map(entry -> new SalesPoint(
                        entry.getKey().getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                        entry.getValue()))
                .toList();

        // Line items joined to the catalogue for their category.
        Set<Long> productIds = window.stream()
                .flatMap(order -> order.getItems().stream())
                .map(OrderItem::getProductId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> categoryByProduct = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Product::getCategory));
        Map<String, String> categoryNames = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getSlug, Category::getName, (first, second) -> first));

        Map<String, BigDecimal> revenueByCategory = new LinkedHashMap<>();
        Map<String, Integer> unitsByProduct = new LinkedHashMap<>();
        Map<String, OrderItem> latestItem = new LinkedHashMap<>();
        for (Order order : window) {
            for (OrderItem item : order.getItems()) {
                int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
                BigDecimal price = item.getPrice() == null ? BigDecimal.ZERO : item.getPrice();
                String slug = item.getProductId() == null ? null : categoryByProduct.get(item.getProductId());
                String category = slug == null ? "Other" : categoryNames.getOrDefault(slug, slug);
                revenueByCategory.merge(category, price.multiply(BigDecimal.valueOf(quantity)), BigDecimal::add);

                String key = item.getProductId() != null ? "id:" + item.getProductId() : "name:" + item.getName();
                unitsByProduct.merge(key, quantity, Integer::sum);
                // Orders arrive newest first, so the first line seen carries the latest name, price and image.
                latestItem.putIfAbsent(key, item);
            }
        }

        List<CategorySales> salesByCategory = revenueByCategory.entrySet().stream()
                .filter(entry -> entry.getValue().signum() > 0)
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .map(entry -> new CategorySales(entry.getKey(), entry.getValue()))
                .toList();

        // Only products that still exist: a deleted product must not resurface here.
        List<TopProduct> topSelling = unitsByProduct.entrySet().stream()
                .filter(entry -> {
                    Long productId = latestItem.get(entry.getKey()).getProductId();
                    return productId != null && categoryByProduct.containsKey(productId);
                })
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(entry -> latestItem.get(entry.getKey()))
                .map(item -> new TopProduct(item.getName(), item.getPrice(), item.getImage()))
                .toList();

        List<RecentOrder> recentOrders = orderRepository
                .findAll(PageRequest.of(0, 6, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(order -> new RecentOrder(
                        order.getOrderNumber(),
                        order.getCustomerName(),
                        order.getTotal(),
                        prettify(order.getStatus().name())))
                .getContent();

        return new DashboardInsights(salesOverview, salesByCategory, topSelling, recentOrders);
    }

    /** The store's configured timezone decides where one sales day ends and the next begins. */
    private ZoneId storeZone() {
        try {
            return ZoneId.of(settingsService.getPublicSettings().timezone());
        } catch (DateTimeException | NullPointerException ex) {
            return ZoneId.of("UTC");
        }
    }

    private TopProduct toTopProduct(Product p) {
        return new TopProduct(p.getName(), p.getPrice(), p.getImage());
    }

    private String formatAmount(BigDecimal value) {
        return String.format("%,.0f", value != null ? value : BigDecimal.ZERO);
    }

    private String prettify(String enumName) {
        String lower = enumName.toLowerCase();
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }

    private String relativeTime(Instant then) {
        if (then == null) return "";
        Duration d = Duration.between(then, Instant.now());
        long mins = d.toMinutes();
        if (mins < 1) return "just now";
        if (mins < 60) return mins + "m ago";
        long hours = d.toHours();
        if (hours < 24) return hours + "h ago";
        return d.toDays() + "d ago";
    }
}
