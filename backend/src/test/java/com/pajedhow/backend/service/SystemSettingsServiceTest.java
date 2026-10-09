package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.SettingsDtos.SettingsRequest;
import com.pajedhow.backend.entity.SystemSettings;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.exception.ConflictException;
import com.pajedhow.backend.repository.SystemSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemSettingsServiceTest {

    @Mock
    private SystemSettingsRepository repository;

    @Mock
    private ActivityLogService activityLogService;

    private SystemSettingsService service;

    @BeforeEach
    void setUp() {
        service = new SystemSettingsService(repository, activityLogService);
        when(repository.findFirstByOrderByIdAsc())
                .thenReturn(Optional.of(SystemSettings.builder().id(1L).version(4L).build()));
    }

    @Test
    void rejectsAnUpdateBasedOnAnOldVersion() {
        assertThatThrownBy(() -> service.update(validRequest(3L, true, false), "Admin"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("another session");

        verify(repository, never()).saveAndFlush(any());
        verifyNoInteractions(activityLogService);
    }

    @Test
    void requiresAtLeastOnePaymentMethod() {
        assertThatThrownBy(() -> service.update(validRequest(4L, false, false), "Admin"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("payment method");

        verify(repository, never()).saveAndFlush(any());
        verifyNoInteractions(activityLogService);
    }

    @Test
    void persistsAndAuditsAValidUpdate() {
        when(repository.saveAndFlush(any(SystemSettings.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.update(validRequest(4L, true, false), "Admin User");

        verify(repository).saveAndFlush(any(SystemSettings.class));
        verify(activityLogService).record(
                "Admin User",
                "Updated system settings",
                "Store configuration"
        );
    }

    private SettingsRequest validRequest(long version, boolean cash, boolean bank) {
        return new SettingsRequest(
                version,
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
                cash,
                bank,
                bank ? "Example Bank" : "",
                bank ? "Kipaji Dhow Furniture" : "",
                bank ? "123456789" : "",
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
                "We will be back soon."
        );
    }
}
