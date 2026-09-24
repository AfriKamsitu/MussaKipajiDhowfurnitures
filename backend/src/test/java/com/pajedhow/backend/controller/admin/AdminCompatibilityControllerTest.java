package com.pajedhow.backend.controller.admin;

import com.pajedhow.backend.dto.DashboardDtos.DashboardResponse;
import com.pajedhow.backend.dto.ProductDtos.ProductResponse;
import com.pajedhow.backend.service.ActivityLogService;
import com.pajedhow.backend.service.DashboardService;
import com.pajedhow.backend.service.ProductService;
import com.pajedhow.backend.security.CustomUserDetailsService;
import com.pajedhow.backend.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = {AdminDashboardController.class, AdminProductController.class},
        excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminCompatibilityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DashboardService dashboardService;

    @MockitoBean
    private ActivityLogService activityLogService;

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @Test
    void dashboardEndpointReturnsCompatibilityPayload() throws Exception {
        DashboardResponse dashboard = new DashboardResponse(
                BigDecimal.TEN, 2L, 3L, 4L,
                List.of(), List.of(), List.of(), List.of()
        );
        when(dashboardService.overview()).thenReturn(dashboard);

        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.stats").isArray());
    }

    @Test
    void productsEndpointReturnsWrappedPayload() throws Exception {
        ProductResponse product = new ProductResponse(
                1L, "oak-chair", "Oak Chair", "Furniture", BigDecimal.valueOf(250000), null,
                "https://example.com/chair.jpg", 4.8, 12, true, List.of("Brown"), "Oak",
                "PUBLISHED", 10, true, "SKU-1", 1, 12, 5, null
        );
        when(productService.adminList(null, null, null, 0, 20)).thenReturn(new PageImpl<>(List.of(product)));

        mockMvc.perform(get("/api/admin/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.products[0].slug").value("oak-chair"));
    }
}
