package com.pajedhow.backend.entity;

import com.pajedhow.backend.entity.enums.Enums.ProductStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_products_slug", columnList = "slug", unique = true),
        @Index(name = "idx_products_category", columnList = "category_slug")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    /** Category slug, kept denormalized for fast filtering (mirrors the frontend). */
    @Column(name = "category_slug", nullable = false)
    private String category;

    @Column(length = 500)
    private String shortDescription;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal price;

    @Column(precision = 14, scale = 2)
    private BigDecimal oldPrice;

    @Column(length = 1024)
    private String image;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image", length = 1024)
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private Double rating = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Integer reviews = 0;

    @Column(name = "is_new")
    @Builder.Default
    private boolean isNew = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_colors", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "color", length = 32)
    @Builder.Default
    private List<String> colors = new ArrayList<>();

    private String material;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    @Builder.Default
    private ProductStatus status = ProductStatus.PUBLISHED;

    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    private String sku;

    @Builder.Default
    private Integer moq = 1;

    @Builder.Default
    private Integer warrantyMonths = 12;

    @Builder.Default
    private Integer deliveryDays = 5;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public boolean isInStock() {
        return stock != null && stock > 0;
    }
}
