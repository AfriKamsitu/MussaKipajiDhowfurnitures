package com.pajedhow.backend.controller;

import com.pajedhow.backend.config.AppProperties;
import com.pajedhow.backend.dto.OrderDtos.CreateOrderRequest;
import com.pajedhow.backend.dto.OrderDtos.OrderResponse;
import com.pajedhow.backend.service.OrderService;
import com.pajedhow.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/** Health check and public runtime config (e.g. WhatsApp contact number). */
@RestController
@RequiredArgsConstructor
public class PublicController {

    private final AppProperties appProperties;
    private final ProductService productService;
    private final OrderService orderService;

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of("status", "UP", "time", Instant.now().toString());
    }

    @GetMapping("/api/config/whatsapp")
    public Map<String, String> whatsapp() {
        return Map.of("phone", appProperties.getWhatsapp().getPhone());
    }

    @GetMapping("/api/featured")
    public Map<String, Object> featured(@RequestParam(defaultValue = "8") int limit) {
        return Map.of("products", productService.featured(limit));
    }

    @GetMapping("/api/cart")
    public Map<String, Object> cart() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("items", java.util.List.of());
        payload.put("subtotal", 0);
        payload.put("shipping", 0);
        payload.put("total", 0);
        payload.put("currency", "TZS");
        return payload;
    }

    @PostMapping("/api/cart")
    public Map<String, Object> cartUpdate(@RequestBody Map<String, Object> body) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Cart update received");
        payload.put("item", body);
        payload.put("subtotal", 0);
        payload.put("shipping", 0);
        payload.put("total", 0);
        payload.put("currency", "TZS");
        return payload;
    }

    @PostMapping("/api/checkout")
    public ResponseEntity<Map<String, Object>> checkout(@RequestBody CreateOrderRequest request) {
        OrderResponse order = orderService.create(request, null);
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Checkout request created");
        payload.put("orderId", order.id());
        payload.put("orderNumber", order.orderNumber());
        payload.put("status", order.status());
        payload.put("total", order.total());
        payload.put("paymentMethod", order.payment());
        payload.put("customer", null);
        payload.put("items", request.items());
        return ResponseEntity.status(HttpStatus.CREATED).body(payload);
    }
}
