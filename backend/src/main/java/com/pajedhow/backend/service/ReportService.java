package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.ReportDtos.*;
import com.pajedhow.backend.entity.Order;
import com.pajedhow.backend.entity.OrderItem;
import com.pajedhow.backend.entity.Product;
import com.pajedhow.backend.entity.User;
import com.pajedhow.backend.entity.enums.Enums.OrderStatus;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.repository.OrderRepository;
import com.pajedhow.backend.repository.ProductRepository;
import com.pajedhow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final int LOW_STOCK_THRESHOLD = 5;
    private static final int MAX_RANGE_DAYS = 366;
    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH);

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SystemSettingsService settingsService;

    @Transactional(readOnly = true)
    public ReportResponse generate(LocalDate requestedFrom, LocalDate requestedTo) {
        var settings = settingsService.getPublicSettings();
        ZoneId storeZone = ZoneId.of(settings.timezone());
        DateRange range = normalizeRange(requestedFrom, requestedTo, storeZone);
        List<Order> orders = orderRepository.findForReport(range.start(), range.endExclusive());
        List<Product> products = productRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
        List<User> customers = userRepository.findAllCustomers();
        Map<Long, Product> productsById = products.stream()
                .collect(Collectors.toMap(Product::getId, product -> product));

        Map<LocalDate, SalesAccumulator> salesByDay = new LinkedHashMap<>();
        for (LocalDate day = range.from(); !day.isAfter(range.to()); day = day.plusDays(1)) {
            salesByDay.put(day, new SalesAccumulator());
        }

        Map<OrderStatus, StatusAccumulator> statusTotals = new EnumMap<>(OrderStatus.class);
        Arrays.stream(OrderStatus.values()).forEach(status -> statusTotals.put(status, new StatusAccumulator()));
        Map<Long, ProductAccumulator> productTotals = new LinkedHashMap<>();
        Map<String, CustomerAccumulator> customerTotals = new LinkedHashMap<>();

        BigDecimal revenue = BigDecimal.ZERO;
        long validOrderCount = 0;
        long unitsSold = 0;

        for (Order order : orders) {
            BigDecimal orderTotal = amount(order.getTotal());
            long orderUnits = order.getItems().stream().mapToLong(this::quantity).sum();
            StatusAccumulator status = statusTotals.get(order.getStatus());
            status.orders++;
            status.revenue = status.revenue.add(orderTotal);

            boolean countsAsSale = order.getStatus() != OrderStatus.CANCELLED;
            if (countsAsSale) {
                revenue = revenue.add(orderTotal);
                validOrderCount++;
                unitsSold += orderUnits;

                LocalDate orderDay = order.getCreatedAt().atZone(storeZone).toLocalDate();
                SalesAccumulator day = salesByDay.get(orderDay);
                if (day != null) {
                    day.orders++;
                    day.units += orderUnits;
                    day.revenue = day.revenue.add(orderTotal);
                }

                for (OrderItem item : order.getItems()) {
                    if (item.getProductId() == null) continue;
                    Product product = productsById.get(item.getProductId());
                    ProductAccumulator aggregate = productTotals.computeIfAbsent(
                            item.getProductId(),
                            ignored -> new ProductAccumulator(
                                    item.getProductId(),
                                    item.getName(),
                                    product != null ? product.getCategory() : "Archived product",
                                    product != null ? stock(product) : 0));
                    long itemUnits = quantity(item);
                    aggregate.units += itemUnits;
                    aggregate.revenue = aggregate.revenue.add(amount(item.getPrice())
                            .multiply(BigDecimal.valueOf(itemUnits)));
                }

                if (order.getCustomer() != null) {
                    CustomerAccumulator aggregate = customerTotals.computeIfAbsent(
                            order.getCustomer().getId(), ignored -> new CustomerAccumulator());
                    aggregate.orders++;
                    aggregate.spent = aggregate.spent.add(orderTotal);
                    if (aggregate.lastOrderAt == null || order.getCreatedAt().isAfter(aggregate.lastOrderAt)) {
                        aggregate.lastOrderAt = order.getCreatedAt();
                    }
                }
            }
        }

        List<SalesPoint> sales = salesByDay.entrySet().stream()
                .map(entry -> new SalesPoint(
                        entry.getKey(),
                        entry.getKey().format(DAY_LABEL),
                        entry.getValue().revenue,
                        entry.getValue().orders,
                        entry.getValue().units))
                .toList();

        List<OrderStatusRow> orderStatuses = Arrays.stream(OrderStatus.values())
                .map(status -> new OrderStatusRow(
                        prettify(status.name()),
                        statusTotals.get(status).orders,
                        statusTotals.get(status).revenue))
                .toList();

        List<TopProductRow> topProducts = productTotals.values().stream()
                .sorted(Comparator.comparing((ProductAccumulator value) -> value.revenue).reversed()
                        .thenComparing(value -> value.name))
                .limit(10)
                .map(value -> new TopProductRow(
                        value.productId,
                        value.name,
                        value.category,
                        value.units,
                        value.revenue,
                        value.stock))
                .toList();

        List<InventoryRow> inventory = products.stream()
                .map(product -> new InventoryRow(
                        product.getId(),
                        product.getName(),
                        product.getSku(),
                        product.getCategory(),
                        stock(product),
                        prettify(product.getStatus().name()),
                        amount(product.getPrice()),
                        amount(product.getPrice()).multiply(BigDecimal.valueOf(stock(product)))))
                .sorted(Comparator.comparingInt(InventoryRow::stock).thenComparing(InventoryRow::name))
                .toList();

        List<CustomerRow> customerRows = customers.stream()
                .map(customer -> {
                    CustomerAccumulator aggregate = customerTotals.getOrDefault(customer.getId(), new CustomerAccumulator());
                    return new CustomerRow(
                            customer.getId(),
                            customer.getName(),
                            customer.getEmail(),
                            customer.getPhone(),
                            customer.getCreatedAt(),
                            aggregate.orders,
                            aggregate.spent,
                            aggregate.lastOrderAt);
                })
                .sorted(Comparator.comparing(CustomerRow::totalSpent).reversed()
                        .thenComparing(CustomerRow::orders, Comparator.reverseOrder())
                        .thenComparing(CustomerRow::name))
                .toList();

        List<OrderRow> orderRows = orders.stream()
                .map(order -> new OrderRow(
                        order.getId(),
                        order.getOrderNumber(),
                        order.getCustomerName(),
                        order.getCustomer() != null ? order.getCustomer().getEmail() : null,
                        prettify(order.getStatus().name()),
                        prettify(order.getPaymentStatus().name()),
                        order.getItems().stream().mapToLong(this::quantity).sum(),
                        amount(order.getTotal()),
                        order.getCreatedAt()))
                .toList();

        long totalStock = inventory.stream().mapToLong(InventoryRow::stock).sum();
        long lowStock = inventory.stream().filter(row -> row.stock() > 0 && row.stock() <= LOW_STOCK_THRESHOLD).count();
        long outOfStock = inventory.stream().filter(row -> row.stock() == 0).count();
        BigDecimal inventoryValue = inventory.stream()
                .map(InventoryRow::stockValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long newCustomers = customers.stream()
                .filter(customer -> isWithin(customer.getCreatedAt(), range))
                .count();
        long repeatCustomers = customerTotals.values().stream()
                .filter(customer -> customer.orders > 1)
                .count();
        BigDecimal averageOrderValue = validOrderCount == 0
                ? BigDecimal.ZERO
                : revenue.divide(BigDecimal.valueOf(validOrderCount), 2, RoundingMode.HALF_UP);

        ReportSummary summary = new ReportSummary(
                revenue,
                orders.size(),
                averageOrderValue,
                unitsSold,
                customers.size(),
                newCustomers,
                repeatCustomers,
                products.size(),
                totalStock,
                lowStock,
                outOfStock,
                inventoryValue);

        return new ReportResponse(
                new ReportPeriod(range.from(), range.to(), range.from() + " to " + range.to()),
                settings.currency(),
                settings.timezone(),
                summary,
                sales,
                orderStatuses,
                topProducts,
                inventory,
                customerRows,
                orderRows,
                Instant.now());
    }

    @Transactional(readOnly = true)
    public byte[] exportCsv(String type, LocalDate from, LocalDate to) {
        ReportResponse report = generate(from, to);
        String normalized = type == null ? "" : type.trim().toLowerCase(Locale.ROOT);
        StringBuilder csv = new StringBuilder("\uFEFF");

        switch (normalized) {
            case "sales" -> {
                appendRow(csv, "Date", "Orders", "Units", "Revenue (" + report.currency() + ")");
                report.sales().forEach(row -> appendRow(csv, row.date(), row.orders(), row.units(), row.revenue()));
            }
            case "inventory" -> {
                appendRow(csv, "Product ID", "Product", "SKU", "Category", "Stock", "Status",
                        "Price (" + report.currency() + ")", "Stock Value (" + report.currency() + ")");
                report.inventory().forEach(row -> appendRow(csv, row.id(), row.name(), row.sku(), row.category(),
                        row.stock(), row.status(), row.price(), row.stockValue()));
            }
            case "customers" -> {
                appendRow(csv, "Customer", "Email", "Phone", "Joined", "Orders",
                        "Total Spent (" + report.currency() + ")", "Last Order");
                report.customers().forEach(row -> appendRow(csv, row.name(), row.email(), row.phone(), row.joinedAt(),
                        row.orders(), row.totalSpent(), row.lastOrderAt()));
            }
            case "orders" -> {
                appendRow(csv, "Order", "Customer", "Email", "Status", "Payment Status", "Units",
                        "Total (" + report.currency() + ")", "Created");
                report.orders().forEach(row -> appendRow(csv, row.orderNumber(), row.customerName(), row.customerEmail(),
                        row.status(), row.paymentStatus(), row.units(), row.total(), row.createdAt()));
            }
            default -> throw new BadRequestException("Report type must be sales, inventory, customers, or orders.");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private DateRange normalizeRange(LocalDate requestedFrom, LocalDate requestedTo, ZoneId storeZone) {
        LocalDate today = LocalDate.now(storeZone);
        LocalDate to = requestedTo != null ? requestedTo : today;
        LocalDate from = requestedFrom != null ? requestedFrom : to.minusDays(29);
        if (from.isAfter(to)) {
            throw new BadRequestException("The report start date must be on or before the end date.");
        }
        long days = ChronoUnit.DAYS.between(from, to) + 1;
        if (days > MAX_RANGE_DAYS) {
            throw new BadRequestException("Report date range cannot exceed " + MAX_RANGE_DAYS + " days.");
        }
        return new DateRange(
                from,
                to,
                from.atStartOfDay(storeZone).toInstant(),
                to.plusDays(1).atStartOfDay(storeZone).toInstant());
    }

    private boolean isWithin(Instant value, DateRange range) {
        return value != null && !value.isBefore(range.start()) && value.isBefore(range.endExclusive());
    }

    private BigDecimal amount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private int stock(Product product) {
        return product.getStock() != null ? Math.max(product.getStock(), 0) : 0;
    }

    private int quantity(OrderItem item) {
        return item.getQuantity() != null ? Math.max(item.getQuantity(), 0) : 0;
    }

    private String prettify(String enumName) {
        String lower = enumName.toLowerCase(Locale.ROOT).replace('_', ' ');
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }

    private void appendRow(StringBuilder csv, Object... values) {
        for (int index = 0; index < values.length; index++) {
            if (index > 0) csv.append(',');
            csv.append(escapeCsv(values[index]));
        }
        csv.append("\r\n");
    }

    private String escapeCsv(Object raw) {
        String value = Objects.toString(raw, "");
        if (!value.isEmpty() && "=+-@".indexOf(value.charAt(0)) >= 0) {
            value = "'" + value;
        }
        return '"' + value.replace("\"", "\"\"") + '"';
    }

    private record DateRange(LocalDate from, LocalDate to, Instant start, Instant endExclusive) {}

    private static final class SalesAccumulator {
        private BigDecimal revenue = BigDecimal.ZERO;
        private long orders;
        private long units;
    }

    private static final class StatusAccumulator {
        private BigDecimal revenue = BigDecimal.ZERO;
        private long orders;
    }

    private static final class ProductAccumulator {
        private final Long productId;
        private final String name;
        private final String category;
        private final int stock;
        private BigDecimal revenue = BigDecimal.ZERO;
        private long units;

        private ProductAccumulator(Long productId, String name, String category, int stock) {
            this.productId = productId;
            this.name = name;
            this.category = category;
            this.stock = stock;
        }
    }

    private static final class CustomerAccumulator {
        private BigDecimal spent = BigDecimal.ZERO;
        private long orders;
        private Instant lastOrderAt;
    }
}
