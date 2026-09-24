package com.pajedhow.backend.controller;

import com.pajedhow.backend.config.AppProperties;
import com.pajedhow.backend.dto.ProductDtos.ProductResponse;
import com.pajedhow.backend.security.CustomUserDetailsService;
import com.pajedhow.backend.security.JwtService;
import com.pajedhow.backend.service.ProductService;
import com.pajedhow.backend.service.SystemSettingsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = PublicController.class,
        excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@AutoConfigureMockMvc(addFilters = false)
class PublicControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private SystemSettingsService systemSettingsService;

    @MockitoBean
    private AppProperties appProperties;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @MockitoBean
    private JdbcTemplate jdbcTemplate;

    @Test
    void featuredProductsEndpointReturnsPublishedHighlights() throws Exception {
        ProductResponse product = new ProductResponse(
                1L, "oak-chair", "Oak Chair", "Furniture", BigDecimal.valueOf(250000), null,
                "https://example.com/chair.jpg", 4.8, 12, true, List.of("Brown"), "Oak",
                "PUBLISHED", 10, true, "SKU-1", 1, 12, 5, null
        );
        when(productService.featured(8)).thenReturn(List.of(product));

        mockMvc.perform(get("/api/featured"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products[0].slug").value("oak-chair"));
    }

    @Test
    void healthEndpointReportsServiceAvailability() throws Exception {
        when(jdbcTemplate.queryForObject("SELECT 1", Integer.class)).thenReturn(1);

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.database").value("UP"))
                .andExpect(jsonPath("$.time").isNotEmpty());
    }

    @Test
    void healthEndpointReturnsUnavailableWhenDatabaseIsDown() throws Exception {
        when(jdbcTemplate.queryForObject("SELECT 1", Integer.class))
                .thenThrow(new DataAccessResourceFailureException("unavailable"));

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value("DOWN"))
                .andExpect(jsonPath("$.database").value("DOWN"));
    }
}
