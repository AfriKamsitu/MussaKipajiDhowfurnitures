package com.pajedhow.backend.controller;

import com.pajedhow.backend.config.AppProperties;
import com.pajedhow.backend.service.ProductService;
import com.pajedhow.backend.service.SystemSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/** Health check and public runtime config (e.g. WhatsApp contact number). */
@RestController
@RequiredArgsConstructor
public class PublicController {

    private final AppProperties appProperties;
    private final ProductService productService;
    private final SystemSettingsService systemSettingsService;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> health() {
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (result == null || result != 1) {
                throw new IllegalStateException("Database health query returned an unexpected result.");
            }
            return ResponseEntity.ok(Map.of(
                    "status", "UP",
                    "database", "UP",
                    "time", Instant.now().toString()));
        } catch (DataAccessException | IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "status", "DOWN",
                    "database", "DOWN",
                    "time", Instant.now().toString()));
        }
    }

    @GetMapping("/api/config/whatsapp")
    public Map<String, String> whatsapp() {
        return Map.of("phone", appProperties.getWhatsapp().getPhone());
    }

    @GetMapping("/api/config/store")
    public Object storeSettings() {
        return systemSettingsService.getPublicSettings();
    }

    @GetMapping("/api/featured")
    public Map<String, Object> featured(@RequestParam(defaultValue = "8") int limit) {
        return Map.of("products", productService.featured(limit));
    }

}
