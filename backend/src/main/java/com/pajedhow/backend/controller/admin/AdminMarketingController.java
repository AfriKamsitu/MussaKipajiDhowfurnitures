package com.pajedhow.backend.controller.admin;

import com.pajedhow.backend.dto.MarketingDtos.*;
import com.pajedhow.backend.service.BannerService;
import com.pajedhow.backend.service.CouponService;
import com.pajedhow.backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin management of coupons, banners and review moderation. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminMarketingController {

    private final CouponService couponService;
    private final BannerService bannerService;
    private final ReviewService reviewService;

    // ---- Coupons ----
    @GetMapping("/coupons")
    public List<CouponResponse> coupons() {
        return couponService.findAll();
    }

    @PostMapping("/coupons")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public CouponResponse createCoupon(@Valid @RequestBody CouponRequest req) {
        return couponService.create(req);
    }

    @PutMapping("/coupons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CouponResponse updateCoupon(@PathVariable Long id, @Valid @RequestBody CouponRequest req) {
        return couponService.update(id, req);
    }

    @DeleteMapping("/coupons/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCoupon(@PathVariable Long id) {
        couponService.delete(id);
    }

    // ---- Banners ----
    @GetMapping("/banners")
    public List<BannerResponse> banners() {
        return bannerService.findAll();
    }

    @PostMapping("/banners")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public BannerResponse createBanner(@Valid @RequestBody BannerRequest req) {
        return bannerService.create(req);
    }

    @PutMapping("/banners/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BannerResponse updateBanner(@PathVariable Long id, @Valid @RequestBody BannerRequest req) {
        return bannerService.update(id, req);
    }

    @DeleteMapping("/banners/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteBanner(@PathVariable Long id) {
        bannerService.delete(id);
    }

    // ---- Reviews moderation ----
    @GetMapping("/reviews")
    public List<ReviewResponse> reviews() {
        return reviewService.findAll();
    }

    @GetMapping("/reviews/pending")
    public List<ReviewResponse> pendingReviews() {
        return reviewService.findPending();
    }

    @PatchMapping("/reviews/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ReviewResponse moderate(@PathVariable Long id, @Valid @RequestBody ReviewStatusRequest req) {
        return reviewService.updateStatus(id, req);
    }

    @DeleteMapping("/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteReview(@PathVariable Long id) {
        reviewService.delete(id);
    }
}
