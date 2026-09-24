package com.pajedhow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public final class ProductDtos {

    private ProductDtos() {}

    public record ProductResponse(
            Long id,
            String slug,
            String name,
            String category,
            String shortDescription,
            String description,
            BigDecimal price,
            BigDecimal oldPrice,
            String image,
            List<String> images,
            Double rating,
            Integer reviews,
            boolean isNew,
            List<String> colors,
            String material,
            String status,
            Integer stock,
            boolean inStock,
            String sku,
            Integer moq,
            Integer warrantyMonths,
            Integer deliveryDays,
            SupplierDtos.SupplierResponse supplier
    ) {
        /** Keeps older API callers compatible while the gallery field defaults to the primary image. */
        public ProductResponse(
                Long id,
                String slug,
                String name,
                String category,
                BigDecimal price,
                BigDecimal oldPrice,
                String image,
                Double rating,
                Integer reviews,
                boolean isNew,
                List<String> colors,
                String material,
                String status,
                Integer stock,
                boolean inStock,
                String sku,
                Integer moq,
                Integer warrantyMonths,
                Integer deliveryDays,
                SupplierDtos.SupplierResponse supplier
        ) {
            this(id, slug, name, category, null, null, price, oldPrice, image,
                    image == null || image.isBlank() ? List.of() : List.of(image),
                    rating, reviews, isNew, colors, material, status, stock, inStock,
                    sku, moq, warrantyMonths, deliveryDays, supplier);
        }
    }

    public record ProductRequest(
            @NotBlank @Size(max = 180) String name,
            @Size(max = 180) String slug,
            @NotBlank @Size(max = 120) String category,
            @Size(max = 500) String shortDescription,
            @Size(max = 10000) String description,
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal price,
            @PositiveOrZero @Digits(integer = 12, fraction = 2) BigDecimal oldPrice,
            @Size(max = 1024) String image,
            @Size(max = 12) List<@Size(max = 1024) String> images,
            Boolean isNew,
            @Size(max = 20) List<@Size(max = 32) String> colors,
            @Size(max = 120) String material,
            String status,          // PUBLISHED | DRAFT | ARCHIVED
            @PositiveOrZero @Max(1000000) Integer stock,
            @Size(max = 80) String sku,
            @Positive @Max(100) Integer moq,
            @PositiveOrZero @Max(240) Integer warrantyMonths,
            @PositiveOrZero @Max(365) Integer deliveryDays,
            Long supplierId
    ) {}
}
