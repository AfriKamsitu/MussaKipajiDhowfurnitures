package com.pajedhow.backend.controller.admin;

import com.pajedhow.backend.dto.SettingsDtos.SettingsResponse;
import com.pajedhow.backend.security.CustomUserDetailsService;
import com.pajedhow.backend.security.JwtService;
import com.pajedhow.backend.service.ActivityLogService;
import com.pajedhow.backend.service.SystemSettingsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AdminSettingsController.class,
        excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminSettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SystemSettingsService settingsService;

    @MockitoBean
    private ActivityLogService activityLogService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @Test
    void settingsEndpointReturnsPersistedConfiguration() throws Exception {
        SettingsResponse response = new SettingsResponse(
                3L,
                "Kipaji Dhow Furniture",
                "Handcrafted furniture",
                "store@example.com",
                "+255 762 082 422",
                "TZS",
                "Africa/Dar_es_Salaam",
                "/logo.png",
                "Paje",
                "",
                "Zanzibar",
                "Tanzania",
                "",
                true,
                false,
                "",
                "",
                "",
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                5,
                true,
                "Kipaji Dhow Furniture",
                "Handcrafted furniture from Zanzibar.",
                true,
                "Kipaji Dhow Furniture",
                "store@example.com",
                "orders@example.com",
                true,
                "",
                "",
                "",
                "255762082422",
                false,
                "We will be back soon.",
                "Admin User",
                Instant.parse("2026-07-23T10:00:00Z")
        );
        when(settingsService.get()).thenReturn(response);

        mockMvc.perform(get("/api/admin/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(3))
                .andExpect(jsonPath("$.storeName").value("Kipaji Dhow Furniture"))
                .andExpect(jsonPath("$.maintenanceMode").value(false));
    }
}
