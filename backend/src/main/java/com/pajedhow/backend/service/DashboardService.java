package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.DashboardDtos.*;
import com.pajedhow.backend.entity.Product;
import com.pajedhow.backend.entity.Role;
import com.pajedhow.backend.entity.enums.Enums.OrderStatus;
import com.pajedhow.backend.entity.enums.Enums.ProductStatus;
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
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public DashboardResponse overview() {
        BigDecimal revenue = orderRepository.totalRevenue();
        long totalOrders = orderRepository.count();
        long totalCustomers = userRepository.countByRole(Role.BUYER);
        long totalProducts = productRepository.countByStatus(ProductStatus.PUBLISHED);

        List<StatCard> stats = List.of(
                new StatCard("Total Revenue", "TZS " + formatAmount(revenue), "dollar-sign"),
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
