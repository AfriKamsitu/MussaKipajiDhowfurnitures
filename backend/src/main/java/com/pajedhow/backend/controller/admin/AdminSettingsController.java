package com.pajedhow.backend.controller.admin;

import com.pajedhow.backend.dto.SettingsDtos.SettingsRequest;
import com.pajedhow.backend.dto.SettingsDtos.SettingsResponse;
import com.pajedhow.backend.entity.User;
import com.pajedhow.backend.service.SystemSettingsService;
import com.pajedhow.backend.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettingsController {

    private final SystemSettingsService settingsService;

    @GetMapping
    public SettingsResponse get() {
        return settingsService.get();
    }

    @PutMapping
    public SettingsResponse update(@Valid @RequestBody SettingsRequest request) {
        User admin = SecurityUtils.currentUser();
        return settingsService.update(request, admin.getName());
    }
}
