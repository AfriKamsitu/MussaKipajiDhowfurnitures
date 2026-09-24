package com.pajedhow.backend.entity;

import com.pajedhow.backend.entity.enums.Enums.BannerStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "banners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    /** Placement, e.g. "Homepage" or "Shop Page". */
    private String location;

    @Column(length = 1024)
    private String image;

    private String headline;

    @Column(length = 1024)
    private String description;

    private String ctaLabel;

    @Column(precision = 14, scale = 2)
    private BigDecimal price;

    private Integer discountPercentage;

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    @Builder.Default
    private BannerStatus status = BannerStatus.ACTIVE;
}
