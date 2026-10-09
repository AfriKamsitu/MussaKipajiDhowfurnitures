package com.pajedhow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** Coupons, banners and reviews DTOs. */
public final class MarketingDtos {

    private MarketingDtos() {}

    // ---- Coupons ----
    public record CouponResponse(
            Long id,
            String code,
            String discountType,
            BigDecimal discountValue,
            Integer usageLimit,
            Integer usageCount,
            LocalDate validUntil,
            String status
    ) {}

    public record CouponRequest(
            @NotBlank @Size(max = 40) @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Use letters, numbers, dashes or underscores only") String code,
            @NotBlank String discountType,  // PERCENTAGE | FIXED | FREE_SHIPPING
            @PositiveOrZero BigDecimal discountValue,
            @PositiveOrZero Integer usageLimit,
            LocalDate validUntil,
            String status
    ) {}

    /** A buyer asking what a code would take off the current cart. */
    public record CouponQuoteRequest(
            @NotBlank @Size(max = 40) String code,
            @NotNull @PositiveOrZero BigDecimal subtotal
    ) {}

    public record CouponQuoteResponse(
            String code,
            String discountType,
            BigDecimal discount,
            boolean freeShipping
    ) {}

    // ---- Banners ----
    public record BannerResponse(
            Long id,
            String title,
            String location,
            String image,
            String headline,
            String description,
            String ctaLabel,
            BigDecimal price,
            Integer discountPercentage,
            Integer sortOrder,
            String status
    ) {}

    public record BannerRequest(
            @NotBlank @Size(max = 120) String title,
            @NotBlank @Size(max = 64) String location,
            @NotBlank @Size(max = 1024) String image,
            @Size(max = 180) String headline,
            @Size(max = 600) String description,
            @Size(max = 64) String ctaLabel,
            @PositiveOrZero BigDecimal price,
            @Min(0) @Max(100) Integer discountPercentage,
            @Min(0) @Max(10000) Integer sortOrder,
            @Pattern(regexp = "(?i)ACTIVE|INACTIVE") String status
    ) {}

    // ---- Reviews ----
    public record ReviewResponse(
            Long id,
            String customerName,
            Long productId,
            String productName,
            Integer rating,
            String comment,
            String status,
            Instant createdAt
    ) {}

    public record ReviewRequest(
            @NotNull Long productId,
            @NotNull Integer rating,
            @NotBlank @Size(max = 1000) String comment
    ) {}

    public record ReviewStatusRequest(
            @NotBlank String status  // PUBLISHED | PENDING
    ) {}
}
