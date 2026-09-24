package com.pajedhow.backend.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

/** DTOs for the singleton administrator-managed storefront configuration. */
public final class SettingsDtos {

    private SettingsDtos() {}

    public record SettingsResponse(
            Long version,
            String storeName,
            String tagline,
            String storeEmail,
            String storePhone,
            String currency,
            String timezone,
            String logoUrl,
            String addressLine1,
            String addressLine2,
            String city,
            String country,
            String businessRegistrationNumber,
            boolean cashOnDeliveryEnabled,
            boolean bankTransferEnabled,
            String bankName,
            String bankAccountName,
            String bankAccountNumber,
            BigDecimal flatShippingRate,
            BigDecimal freeShippingThreshold,
            int estimatedDeliveryDays,
            boolean storePickupEnabled,
            String metaTitle,
            String metaDescription,
            boolean searchIndexingEnabled,
            String senderName,
            String senderEmail,
            String orderNotificationEmail,
            boolean orderConfirmationEnabled,
            String facebookUrl,
            String instagramUrl,
            String tiktokUrl,
            String whatsappNumber,
            boolean maintenanceMode,
            String maintenanceMessage,
            String updatedBy,
            Instant updatedAt
    ) {}

    /** Non-sensitive settings that the customer storefront may consume. */
    public record PublicSettingsResponse(
            String storeName,
            String tagline,
            String storeEmail,
            String storePhone,
            String currency,
            String timezone,
            String logoUrl,
            String addressLine1,
            String addressLine2,
            String city,
            String country,
            boolean cashOnDeliveryEnabled,
            boolean bankTransferEnabled,
            BigDecimal flatShippingRate,
            BigDecimal freeShippingThreshold,
            int estimatedDeliveryDays,
            boolean storePickupEnabled,
            String metaTitle,
            String metaDescription,
            boolean searchIndexingEnabled,
            String facebookUrl,
            String instagramUrl,
            String tiktokUrl,
            String whatsappNumber,
            boolean maintenanceMode,
            String maintenanceMessage
    ) {}

    public record SettingsRequest(
            @NotNull Long version,
            @NotBlank @Size(max = 120) String storeName,
            @NotBlank @Size(max = 160) String tagline,
            @NotBlank @Email @Size(max = 160) String storeEmail,
            @NotBlank @Size(max = 40) String storePhone,
            @NotBlank @Pattern(regexp = "TZS|USD|KES", message = "must be TZS, USD, or KES") String currency,
            @NotBlank @Size(max = 64) String timezone,
            @NotBlank @Size(max = 1024) String logoUrl,
            @Size(max = 160) String addressLine1,
            @Size(max = 160) String addressLine2,
            @NotBlank @Size(max = 100) String city,
            @NotBlank @Size(max = 100) String country,
            @Size(max = 80) String businessRegistrationNumber,
            @NotNull Boolean cashOnDeliveryEnabled,
            @NotNull Boolean bankTransferEnabled,
            @Size(max = 120) String bankName,
            @Size(max = 120) String bankAccountName,
            @Size(max = 80) String bankAccountNumber,
            @NotNull @DecimalMin("0.00") @Digits(integer = 12, fraction = 2) BigDecimal flatShippingRate,
            @NotNull @DecimalMin("0.00") @Digits(integer = 12, fraction = 2) BigDecimal freeShippingThreshold,
            @NotNull @Min(1) @Max(60) Integer estimatedDeliveryDays,
            @NotNull Boolean storePickupEnabled,
            @NotBlank @Size(max = 70) String metaTitle,
            @NotBlank @Size(max = 170) String metaDescription,
            @NotNull Boolean searchIndexingEnabled,
            @NotBlank @Size(max = 120) String senderName,
            @NotBlank @Email @Size(max = 160) String senderEmail,
            @NotBlank @Email @Size(max = 160) String orderNotificationEmail,
            @NotNull Boolean orderConfirmationEnabled,
            @Pattern(regexp = "^$|https?://.+", message = "must be blank or start with http:// or https://")
            @Size(max = 300) String facebookUrl,
            @Pattern(regexp = "^$|https?://.+", message = "must be blank or start with http:// or https://")
            @Size(max = 300) String instagramUrl,
            @Pattern(regexp = "^$|https?://.+", message = "must be blank or start with http:// or https://")
            @Size(max = 300) String tiktokUrl,
            @NotBlank @Pattern(regexp = "\\+?[0-9 ]{8,30}", message = "must contain a valid international phone number")
            String whatsappNumber,
            @NotNull Boolean maintenanceMode,
            @NotBlank @Size(max = 300) String maintenanceMessage
    ) {}
}
