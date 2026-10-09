package com.pajedhow.backend.controller.admin;

import com.pajedhow.backend.dto.DashboardDtos.ActivityEntry;
import com.pajedhow.backend.dto.DashboardDtos.DashboardInsights;
import com.pajedhow.backend.dto.DashboardDtos.DashboardResponse;
import com.pajedhow.backend.service.ActivityLogService;
import com.pajedhow.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;
    private final ActivityLogService activityLogService;

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        DashboardResponse data = dashboardService.overview();
        DashboardInsights computed = dashboardService.insights();
        DashboardInsights insights = computed != null
                ? computed
                : new DashboardInsights(List.of(), List.of(), List.of(), List.of());
        return Map.of(
                "success", true,
                "message", "Admin dashboard ready",
                "data", Map.of(
                        "stats", data.stats(),
                        "salesOverview", insights.salesOverview(),
                        // Best sellers by units sold; a store with no sales yet shows its catalogue instead.
                        "topSelling", insights.topSelling().isEmpty() ? data.topSelling() : insights.topSelling(),
                        "orderStatusBreakdown", data.orderStatusBreakdown(),
                        "salesByCategory", insights.salesByCategory(),
                        "productTabs", List.of(),
                        "orderTabs", List.of(),
                        "recentOrders", insights.recentOrders(),
                        "recentProducts", List.of(),
                        "recentActivity", data.recentActivity()
                )
        );
    }

    @GetMapping("/activity")
    public List<ActivityEntry> activity(@RequestParam(defaultValue = "20") int limit) {
        return activityLogService.recent(limit).stream()
                .map(a -> new ActivityEntry(a.getId(), a.getActor(), a.getAction(),
                        a.getTarget(), relativeTime(a.getCreatedAt())))
                .toList();
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
