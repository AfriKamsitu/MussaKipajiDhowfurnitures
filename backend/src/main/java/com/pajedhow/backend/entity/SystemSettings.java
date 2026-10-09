package com.pajedhow.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * The singleton, database-backed configuration for the storefront.
 * Sensitive transport credentials are intentionally not stored here.
 */
@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @Column(nullable = false, length = 120)
    @Builder.Default
    private String storeName = "Kipaji Dhow Furniture";

    @Column(nullable = false, length = 160)
    @Builder.Default
    private String tagline = "Handcrafted furniture for beautiful spaces";

    @Column(nullable = false, length = 160)
    @Builder.Default
    private String storeEmail = "pajedhowfurniture@gmail.com";

    @Column(nullable = false, length = 40)
    @Builder.Default
    private String storePhone = "+255 762 082 422";

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "TZS";

    @Column(nullable = false, length = 64)
    @Builder.Default
    private String timezone = "Africa/Dar_es_Salaam";

    @Column(nullable = false, length = 1024)
    @Builder.Default
    private String logoUrl = "/kipaji-dhow-furniture-logo.jpg";

    @Column(nullable = false, length = 160)
    @Builder.Default
    private String addressLine1 = "";

    @Column(nullable = false, length = 160)
    @Builder.Default
    private String addressLine2 = "";

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String city = "Zanzibar";

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String country = "Tanzania";

    @Column(nullable = false, length = 80)
    @Builder.Default
    private String businessRegistrationNumber = "";

    @Column(nullable = false)
    @Builder.Default
    private boolean cashOnDeliveryEnabled = true;

    @Column(nullable = false)
    private boolean bankTransferEnabled;

    @Column(nullable = false, length = 120)
    @Builder.Default
    private String bankName = "";

    @Column(nullable = false, length = 120)
    @Builder.Default
    private String bankAccountName = "";

    @Column(nullable = false, length = 80)
    @Builder.Default
    private String bankAccountNumber = "";

    @Column(nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal flatShippingRate = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal freeShippingThreshold = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private int estimatedDeliveryDays = 5;

    @Column(nullable = false)
    @Builder.Default
    private boolean storePickupEnabled = true;

    @Column(nullable = false, length = 70)
    @Builder.Default
    private String metaTitle = "Kipaji Dhow Furniture";

    @Column(nullable = false, length = 170)
    @Builder.Default
    private String metaDescription = "Discover handcrafted furniture from Kipaji Dhow Furniture.";

    @Column(nullable = false)
    @Builder.Default
    private boolean searchIndexingEnabled = true;

    @Column(nullable = false, length = 120)
    @Builder.Default
    private String senderName = "Kipaji Dhow Furniture";

    @Column(nullable = false, length = 160)
    @Builder.Default
    private String senderEmail = "pajedhowfurniture@gmail.com";

    @Column(nullable = false, length = 160)
    @Builder.Default
    private String orderNotificationEmail = "pajedhowfurniture@gmail.com";

    @Column(nullable = false)
    @Builder.Default
    private boolean orderConfirmationEnabled = true;

    @Column(nullable = false, length = 300)
    @Builder.Default
    private String facebookUrl = "";

    @Column(nullable = false, length = 300)
    @Builder.Default
    private String instagramUrl = "";

    @Column(nullable = false, length = 300)
    @Builder.Default
    private String tiktokUrl = "";

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String whatsappNumber = "255762082422";

    @Column(nullable = false)
    @Builder.Default
    private boolean maintenanceMode = false;

    @Column(nullable = false, length = 300)
    @Builder.Default
    private String maintenanceMessage = "We are improving the store. Please check back shortly.";

    @Column(nullable = false, length = 160)
    @Builder.Default
    private String updatedBy = "System";

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
