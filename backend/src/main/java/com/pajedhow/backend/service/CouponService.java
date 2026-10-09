package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.MarketingDtos.CouponQuoteResponse;
import com.pajedhow.backend.dto.MarketingDtos.CouponRequest;
import com.pajedhow.backend.dto.MarketingDtos.CouponResponse;
import com.pajedhow.backend.entity.Coupon;
import com.pajedhow.backend.entity.enums.Enums.CouponStatus;
import com.pajedhow.backend.entity.enums.Enums.DiscountType;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.exception.ResourceNotFoundException;
import com.pajedhow.backend.mapper.Mappers;
import com.pajedhow.backend.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public List<CouponResponse> findAll() {
        return couponRepository.findAll().stream().map(Mappers::toCoupon).toList();
    }

    /** Validate a coupon code for checkout. Throws when unusable. */
    @Transactional(readOnly = true)
    public CouponResponse validate(String code) {
        return Mappers.toCoupon(requireUsable(findByCode(code)));
    }

    /** What the code would take off a cart of this subtotal, without redeeming it. */
    @Transactional(readOnly = true)
    public CouponQuoteResponse quote(String code, BigDecimal subtotal) {
        Coupon coupon = requireUsable(findByCode(code));
        return new CouponQuoteResponse(
                coupon.getCode(),
                coupon.getDiscountType().name(),
                discountFor(coupon, subtotal),
                coupon.getDiscountType() == DiscountType.FREE_SHIPPING);
    }

    /**
     * Redeem a code while placing an order: checks it under a row lock and
     * counts the use. Must run inside the order's transaction so a failed
     * order does not consume a use.
     */
    @Transactional
    public Coupon redeem(String code) {
        Coupon coupon = requireUsable(couponRepository.findByCodeForUpdate(code.trim())
                .orElseThrow(() -> new BadRequestException("This coupon code is not valid.")));
        coupon.setUsageCount(coupon.getUsageCount() + 1);
        return couponRepository.save(coupon);
    }

    /** Give a use back when the order that redeemed it is cancelled. */
    @Transactional
    public void release(String code) {
        if (code == null || code.isBlank()) return;
        couponRepository.findByCodeForUpdate(code.trim()).ifPresent(coupon -> {
            if (coupon.getUsageCount() > 0) {
                coupon.setUsageCount(coupon.getUsageCount() - 1);
                couponRepository.save(coupon);
            }
        });
    }

    /** Money taken off the subtotal; never more than the subtotal itself. */
    public BigDecimal discountFor(Coupon coupon, BigDecimal subtotal) {
        BigDecimal value = coupon.getDiscountValue() == null ? BigDecimal.ZERO : coupon.getDiscountValue();
        BigDecimal discount = switch (coupon.getDiscountType()) {
            case PERCENTAGE -> subtotal.multiply(value).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case FIXED -> value;
            case FREE_SHIPPING -> BigDecimal.ZERO;
        };
        return discount.max(BigDecimal.ZERO).min(subtotal);
    }

    private Coupon findByCode(String code) {
        return couponRepository.findByCodeIgnoreCase(code == null ? "" : code.trim())
                .orElseThrow(() -> new BadRequestException("This coupon code is not valid."));
    }

    private Coupon requireUsable(Coupon c) {
        if (c.getStatus() != CouponStatus.ACTIVE) {
            throw new BadRequestException("This coupon is no longer active.");
        }
        if (c.getValidUntil() != null && c.getValidUntil().isBefore(LocalDate.now())) {
            throw new BadRequestException("This coupon has expired.");
        }
        if (c.getUsageLimit() > 0 && c.getUsageCount() >= c.getUsageLimit()) {
            throw new BadRequestException("This coupon has reached its usage limit.");
        }
        return c;
    }

    /** A percentage must be 1-100 and a fixed amount above zero; free shipping carries no value. */
    private BigDecimal validatedValue(DiscountType type, BigDecimal value) {
        BigDecimal amount = value == null ? BigDecimal.ZERO : value;
        if (type == DiscountType.PERCENTAGE
                && (amount.signum() <= 0 || amount.compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw new BadRequestException("A percentage discount must be between 1 and 100.");
        }
        if (type == DiscountType.FIXED && amount.signum() <= 0) {
            throw new BadRequestException("A fixed discount must be greater than zero.");
        }
        return type == DiscountType.FREE_SHIPPING ? BigDecimal.ZERO : amount;
    }

    @Transactional
    public CouponResponse create(CouponRequest req) {
        couponRepository.findByCodeIgnoreCase(req.code()).ifPresent(existing -> {
            throw new BadRequestException("Coupon code already exists");
        });
        DiscountType type = parseType(req.discountType());
        Coupon c = Coupon.builder()
                .code(req.code().toUpperCase())
                .discountType(type)
                .discountValue(validatedValue(type, req.discountValue()))
                .usageLimit(req.usageLimit() != null ? req.usageLimit() : 0)
                .usageCount(0)
                .validUntil(req.validUntil())
                .status(parseStatus(req.status()))
                .build();
        return Mappers.toCoupon(couponRepository.save(c));
    }

    @Transactional
    public CouponResponse update(Long id, CouponRequest req) {
        Coupon c = get(id);
        c.setCode(req.code().toUpperCase());
        DiscountType type = parseType(req.discountType());
        c.setDiscountType(type);
        c.setDiscountValue(validatedValue(type, req.discountValue() != null ? req.discountValue() : c.getDiscountValue()));
        if (req.usageLimit() != null) c.setUsageLimit(req.usageLimit());
        c.setValidUntil(req.validUntil());
        c.setStatus(parseStatus(req.status()));
        return Mappers.toCoupon(couponRepository.save(c));
    }

    @Transactional
    public void delete(Long id) {
        couponRepository.delete(get(id));
    }

    private Coupon get(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found: " + id));
    }

    private DiscountType parseType(String value) {
        try {
            return DiscountType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new BadRequestException("Invalid discount type: " + value);
        }
    }

    private CouponStatus parseStatus(String value) {
        if (value == null || value.isBlank()) return CouponStatus.ACTIVE;
        try {
            return CouponStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid coupon status: " + value);
        }
    }
}
