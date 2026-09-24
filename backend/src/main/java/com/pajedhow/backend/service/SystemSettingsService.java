package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.SettingsDtos.SettingsRequest;
import com.pajedhow.backend.dto.SettingsDtos.SettingsResponse;
import com.pajedhow.backend.dto.SettingsDtos.PublicSettingsResponse;
import com.pajedhow.backend.entity.SystemSettings;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.exception.ConflictException;
import com.pajedhow.backend.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private static final String LEGACY_STORE_EMAIL = "info@pajedhowfurniture.com";
    private static final String STORE_EMAIL = "pajedhowfurniture@gmail.com";

    private final SystemSettingsRepository repository;
    private final ActivityLogService activityLogService;

    @Transactional
    public SettingsResponse get() {
        return toResponse(getOrCreate());
    }

    @Transactional
    public PublicSettingsResponse getPublicSettings() {
        SystemSettings s = getOrCreate();
        return new PublicSettingsResponse(
                s.getStoreName(),
                s.getTagline(),
                s.getStoreEmail(),
                s.getStorePhone(),
                s.getCurrency(),
                s.getTimezone(),
                s.getLogoUrl(),
                s.getAddressLine1(),
                s.getAddressLine2(),
                s.getCity(),
                s.getCountry(),
                s.isCashOnDeliveryEnabled(),
                s.isBankTransferEnabled(),
                s.getFlatShippingRate(),
                s.getFreeShippingThreshold(),
                s.getEstimatedDeliveryDays(),
                s.isStorePickupEnabled(),
                s.getMetaTitle(),
                s.getMetaDescription(),
                s.isSearchIndexingEnabled(),
                s.getFacebookUrl(),
                s.getInstagramUrl(),
                s.getTiktokUrl(),
                s.getWhatsappNumber(),
                s.isMaintenanceMode(),
                s.getMaintenanceMessage()
        );
    }

    @Transactional
    public SettingsResponse update(SettingsRequest request, String actor) {
        SystemSettings settings = getOrCreate();
        if (!Objects.equals(request.version(), settings.getVersion())) {
            throw new ConflictException(
                    "These settings were updated in another session. Reload the latest version and try again.");
        }
        validateBusinessRules(request);

        settings.setStoreName(clean(request.storeName()));
        settings.setTagline(clean(request.tagline()));
        settings.setStoreEmail(clean(request.storeEmail()).toLowerCase());
        settings.setStorePhone(clean(request.storePhone()));
        settings.setCurrency(request.currency());
        settings.setTimezone(request.timezone());
        settings.setLogoUrl(clean(request.logoUrl()));
        settings.setAddressLine1(clean(request.addressLine1()));
        settings.setAddressLine2(clean(request.addressLine2()));
        settings.setCity(clean(request.city()));
        settings.setCountry(clean(request.country()));
        settings.setBusinessRegistrationNumber(clean(request.businessRegistrationNumber()));
        settings.setCashOnDeliveryEnabled(request.cashOnDeliveryEnabled());
        settings.setBankTransferEnabled(request.bankTransferEnabled());
        settings.setBankName(clean(request.bankName()));
        settings.setBankAccountName(clean(request.bankAccountName()));
        settings.setBankAccountNumber(clean(request.bankAccountNumber()));
        settings.setFlatShippingRate(request.flatShippingRate());
        settings.setFreeShippingThreshold(request.freeShippingThreshold());
        settings.setEstimatedDeliveryDays(request.estimatedDeliveryDays());
        settings.setStorePickupEnabled(request.storePickupEnabled());
        settings.setMetaTitle(clean(request.metaTitle()));
        settings.setMetaDescription(clean(request.metaDescription()));
        settings.setSearchIndexingEnabled(request.searchIndexingEnabled());
        settings.setSenderName(clean(request.senderName()));
        settings.setSenderEmail(clean(request.senderEmail()).toLowerCase());
        settings.setOrderNotificationEmail(clean(request.orderNotificationEmail()).toLowerCase());
        settings.setOrderConfirmationEnabled(request.orderConfirmationEnabled());
        settings.setFacebookUrl(clean(request.facebookUrl()));
        settings.setInstagramUrl(clean(request.instagramUrl()));
        settings.setTiktokUrl(clean(request.tiktokUrl()));
        settings.setWhatsappNumber(clean(request.whatsappNumber()).replace(" ", ""));
        settings.setMaintenanceMode(request.maintenanceMode());
        settings.setMaintenanceMessage(clean(request.maintenanceMessage()));
        settings.setUpdatedBy(actor == null || actor.isBlank() ? "Administrator" : actor.trim());

        SystemSettings saved = repository.saveAndFlush(settings);
        activityLogService.record(settings.getUpdatedBy(), "Updated system settings", "Store configuration");
        return toResponse(saved);
    }

    private SystemSettings getOrCreate() {
        SystemSettings settings = repository.findFirstByOrderByIdAsc()
                .orElseGet(() -> repository.saveAndFlush(SystemSettings.builder().build()));
        boolean updated = false;
        if (LEGACY_STORE_EMAIL.equalsIgnoreCase(settings.getStoreEmail())) {
            settings.setStoreEmail(STORE_EMAIL);
            updated = true;
        }
        if (LEGACY_STORE_EMAIL.equalsIgnoreCase(settings.getSenderEmail())) {
            settings.setSenderEmail(STORE_EMAIL);
            updated = true;
        }
        if (LEGACY_STORE_EMAIL.equalsIgnoreCase(settings.getOrderNotificationEmail())) {
            settings.setOrderNotificationEmail(STORE_EMAIL);
            updated = true;
        }
        return updated ? repository.saveAndFlush(settings) : settings;
    }

    private void validateBusinessRules(SettingsRequest request) {
        try {
            ZoneId.of(request.timezone());
        } catch (DateTimeException ex) {
            throw new BadRequestException("The selected time zone is invalid.");
        }
        if (!request.cashOnDeliveryEnabled() && !request.bankTransferEnabled()) {
            throw new BadRequestException("At least one payment method must remain enabled.");
        }
        if (request.bankTransferEnabled()
                && (clean(request.bankName()).isBlank()
                || clean(request.bankAccountName()).isBlank()
                || clean(request.bankAccountNumber()).isBlank())) {
            throw new BadRequestException("Bank details are required when bank transfer is enabled.");
        }
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private SettingsResponse toResponse(SystemSettings s) {
        return new SettingsResponse(
                s.getVersion(),
                s.getStoreName(),
                s.getTagline(),
                s.getStoreEmail(),
                s.getStorePhone(),
                s.getCurrency(),
                s.getTimezone(),
                s.getLogoUrl(),
                s.getAddressLine1(),
                s.getAddressLine2(),
                s.getCity(),
                s.getCountry(),
                s.getBusinessRegistrationNumber(),
                s.isCashOnDeliveryEnabled(),
                s.isBankTransferEnabled(),
                s.getBankName(),
                s.getBankAccountName(),
                s.getBankAccountNumber(),
                s.getFlatShippingRate(),
                s.getFreeShippingThreshold(),
                s.getEstimatedDeliveryDays(),
                s.isStorePickupEnabled(),
                s.getMetaTitle(),
                s.getMetaDescription(),
                s.isSearchIndexingEnabled(),
                s.getSenderName(),
                s.getSenderEmail(),
                s.getOrderNotificationEmail(),
                s.isOrderConfirmationEnabled(),
                s.getFacebookUrl(),
                s.getInstagramUrl(),
                s.getTiktokUrl(),
                s.getWhatsappNumber(),
                s.isMaintenanceMode(),
                s.getMaintenanceMessage(),
                s.getUpdatedBy(),
                s.getUpdatedAt()
        );
    }
}
