package com.pajedhow.backend.config;

import com.pajedhow.backend.entity.*;
import com.pajedhow.backend.entity.enums.Enums.*;
import com.pajedhow.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Seeds baseline catalog data and ensures the store ADMIN account exists.
 * Buyers register themselves via the public signup / social login flows.
 * Controlled by app.seed.enabled.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    /** Canonical admin credentials for this store. */
    public static final String ADMIN_EMAIL = "pajedhowfurniture@gmail.com";
    public static final String ADMIN_PASSWORD = "Mussa@paje2026";

    private final AppProperties appProperties;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final BannerRepository bannerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (!appProperties.getSeed().isEnabled()) {
            log.info("Data seeding disabled (app.seed.enabled=false)");
            return;
        }

        ensureAdminUser();

        if (categoryRepository.count() > 0) {
            log.info("Catalog data already present, skipping catalog seed");
            return;
        }

        log.info("Seeding baseline catalog data...");
        seedCategories();
        Supplier supplier = seedSuppliers();
        seedProducts(supplier);
        seedCoupons();
        seedBanners();
        log.info("Seeding complete");
    }

    /** Create or update the single ADMIN account with the required credentials. */
    private void ensureAdminUser() {
        userRepository.findByEmailIgnoreCase(ADMIN_EMAIL).ifPresentOrElse(admin -> {
            boolean changed = false;
            if (admin.getRole() != Role.ADMIN) {
                admin.setRole(Role.ADMIN);
                changed = true;
            }
            if (admin.getStatus() != AccountStatus.ACTIVE) {
                admin.setStatus(AccountStatus.ACTIVE);
                changed = true;
            }
            if (!passwordEncoder.matches(ADMIN_PASSWORD, admin.getPassword())) {
                admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
                changed = true;
            }
            if (changed) {
                userRepository.save(admin);
                log.info("Updated ADMIN credentials for {}", ADMIN_EMAIL);
            } else {
                log.info("ADMIN account already up to date: {}", ADMIN_EMAIL);
            }
        }, () -> {
            userRepository.save(User.builder()
                    .name("Paje Dhow Admin")
                    .email(ADMIN_EMAIL)
                    .password(passwordEncoder.encode(ADMIN_PASSWORD))
                    .role(Role.ADMIN)
                    .status(AccountStatus.ACTIVE)
                    .build());
            log.info("Created ADMIN account: {}", ADMIN_EMAIL);
        });
    }

    private void seedCategories() {
        record Cat(String slug, String name, String image) {}
        List<Cat> cats = List.of(
                new Cat("sofas", "Sofas & Seating", "/sofa-modern-fabric.png"),
                new Cat("beds", "Beds", "/bed-king.png"),
                new Cat("dining-sets", "Dining Sets", "/dining-set.png"),
                new Cat("chairs", "Chairs & Stools", "/chair.png"),
                new Cat("tv-stands", "Sideboards", "/tv-stand.png"),
                new Cat("wardrobes", "Cabinets", "/wardrobe.png"),
                new Cat("office-furniture", "Desks", "/office-furniture.png"),
                new Cat("outdoor", "Outdoor", "/outdoor.png")
        );
        cats.forEach(c -> categoryRepository.save(Category.builder()
                .slug(c.slug()).name(c.name()).image(c.image())
                .description(c.name() + " crafted by Zanzibar artisans")
                .status(AccountStatus.ACTIVE)
                .build()));
    }

    private Supplier seedSuppliers() {
        Supplier main = supplierRepository.save(Supplier.builder()
                .name("Paje Dhow Workshop")
                .location("Paje, Zanzibar")
                .country("Tanzania")
                .rating(4.8)
                .responseTime("within 2 hours")
                .verified(true)
                .build());
        supplierRepository.save(Supplier.builder()
                .name("Stone Town Carvers")
                .location("Stone Town, Zanzibar")
                .country("Tanzania")
                .rating(4.6)
                .responseTime("within a day")
                .verified(true)
                .build());
        return main;
    }

    private void seedProducts(Supplier supplier) {
        record P(String slug, String name, String category, long price, Long oldPrice, String image,
                 boolean isNew, String material, int stock, List<String> colors) {}
        List<P> items = List.of(
                new P("modern-fabric-sofa", "Reclaimed Wood Cushion Sofa", "sofas", 750000L, 950000L,
                        "/sofa-modern-fabric.png", false, "Reclaimed Wood", 12,
                        List.of("#9ca3af", "#c8902f", "#1e3a5f", "#3b2f2a")),
                new P("luxury-chesterfield-sofa", "Kanga Cushion Armchair", "sofas", 1450000L, null,
                        "/sofa-chesterfield.png", false, "Teak", 8, List.of("#2f5233", "#3b2f2a")),
                new P("minimalist-3-seater-sofa", "Reclaimed Wood Bench Seat", "sofas", 680000L, null,
                        "/sofa-minimalist.png", false, "Reclaimed Wood", 15, List.of("#9ca3af", "#c8902f")),
                new P("l-shaped-sectional-sofa", "Dhow Lounge Seating Set", "sofas", 1350000L, null,
                        "/sofa-lshaped.png", false, "Reclaimed Wood", 6, List.of("#9ca3af", "#3b2f2a")),
                new P("king-size-upholstered-bed", "Reclaimed Wood King Bed", "beds", 1250000L, null,
                        "/bed-king.png", true, "Reclaimed Wood", 10, List.of("#9ca3af", "#c8902f")),
                new P("solid-wood-dining-set", "Six Seater Dining Set", "dining-sets", 1650000L, 1900000L,
                        "/dining-set.png", true, "Mahogany", 5, List.of("#3b2f2a", "#c8902f")),
                new P("carved-accent-chair", "Carved Accent Chair", "chairs", 320000L, null,
                        "/chair.png", false, "Hardwood", 20, List.of("#c8902f", "#3b2f2a")),
                new P("teak-sideboard", "Teak Sideboard Cabinet", "tv-stands", 890000L, null,
                        "/tv-stand.png", false, "Teak", 9, List.of("#c8902f")),
                new P("carved-wardrobe", "Carved Wardrobe Cabinet", "wardrobes", 1750000L, null,
                        "/wardrobe.png", false, "Mahogany", 4, List.of("#3b2f2a")),
                new P("writing-desk", "Artisan Writing Desk", "office-furniture", 540000L, null,
                        "/office-furniture.png", true, "Hardwood", 11, List.of("#c8902f", "#9ca3af")),
                new P("outdoor-lounge", "Outdoor Dhow Lounge", "outdoor", 980000L, null,
                        "/outdoor.png", false, "Teak", 7, List.of("#9ca3af"))
        );
        items.forEach(p -> productRepository.save(Product.builder()
                .slug(p.slug())
                .name(p.name())
                .category(p.category())
                .price(BigDecimal.valueOf(p.price()))
                .oldPrice(p.oldPrice() != null ? BigDecimal.valueOf(p.oldPrice()) : null)
                .image(p.image())
                .isNew(p.isNew())
                .material(p.material())
                .status(ProductStatus.PUBLISHED)
                .stock(p.stock())
                .sku("PJD-" + p.slug().substring(0, Math.min(4, p.slug().length())).toUpperCase())
                .moq(1)
                .warrantyMonths(24)
                .deliveryDays(7)
                .rating(0.0)
                .reviews(0)
                .colors(p.colors())
                .supplier(supplier)
                .build()));
    }

    private void seedCoupons() {
        couponRepository.save(Coupon.builder()
                .code("WELCOME10")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .usageLimit(100)
                .usageCount(0)
                .validUntil(LocalDate.now().plusMonths(3))
                .status(CouponStatus.ACTIVE)
                .build());
        couponRepository.save(Coupon.builder()
                .code("FREESHIP")
                .discountType(DiscountType.FREE_SHIPPING)
                .discountValue(BigDecimal.ZERO)
                .usageLimit(0)
                .usageCount(0)
                .validUntil(LocalDate.now().plusMonths(1))
                .status(CouponStatus.ACTIVE)
                .build());
    }

    private void seedBanners() {
        bannerRepository.save(Banner.builder()
                .title("Handcrafted in Zanzibar")
                .location("Homepage")
                .image("/hero-living-room.png")
                .status(BannerStatus.ACTIVE)
                .build());
        bannerRepository.save(Banner.builder()
                .title("Summer Sale")
                .location("Shop Page")
                .image("/summer-sale.png")
                .status(BannerStatus.ACTIVE)
                .build());
    }
}
