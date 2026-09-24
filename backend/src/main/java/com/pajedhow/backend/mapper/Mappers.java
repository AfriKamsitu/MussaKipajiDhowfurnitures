package com.pajedhow.backend.mapper;

import com.pajedhow.backend.dto.*;
import com.pajedhow.backend.entity.*;

import java.util.List;

/** Central entity -> DTO conversion helpers. */
public final class Mappers {

    private Mappers() {}

    public static UserDtos.UserResponse toUser(User u) {
        return new UserDtos.UserResponse(
                u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getAvatar(),
                u.getRole().name(), u.getStatus().name(), u.getCreatedAt(), u.getLastActiveAt(),
                u.isMarketingOptIn(), u.getMarketingOptInAt(),
                u.getAddresses().stream().map(Mappers::toAddress).toList()
        );
    }

    public static AddressDtos.AddressResponse toAddress(Address a) {
        return new AddressDtos.AddressResponse(
                a.getId(), a.getLabel(), a.getFullName(), a.getPhone(),
                a.getStreet(), a.getCity(), a.getRegion(), a.isDefault()
        );
    }

    public static SupplierDtos.SupplierResponse toSupplier(Supplier s) {
        if (s == null) return null;
        return new SupplierDtos.SupplierResponse(
                s.getId(), s.getName(), s.getLocation(), s.getCountry(),
                s.getRating(), s.getResponseTime(), s.isVerified()
        );
    }

    public static ProductDtos.ProductResponse toProduct(Product p) {
        return new ProductDtos.ProductResponse(
                p.getId(), p.getSlug(), p.getName(), p.getCategory(),
                p.getShortDescription(), p.getDescription(), p.getPrice(), p.getOldPrice(),
                p.getImage(),
                p.getImages() == null ? List.of() : List.copyOf(p.getImages()),
                p.getRating(), p.getReviews(), p.isNew(),
                p.getColors() == null ? List.of() : List.copyOf(p.getColors()),
                p.getMaterial(), p.getStatus().name(), p.getStock(), p.isInStock(), p.getSku(),
                p.getMoq(), p.getWarrantyMonths(), p.getDeliveryDays(), toSupplier(p.getSupplier())
        );
    }

    public static CategoryDtos.CategoryResponse toCategory(Category c, long productCount) {
        return new CategoryDtos.CategoryResponse(
                c.getId(), c.getSlug(), c.getName(), c.getDescription(),
                c.getImage(), c.getStatus().name(), productCount
        );
    }

    public static OrderDtos.OrderItemResponse toOrderItem(OrderItem i) {
        return new OrderDtos.OrderItemResponse(
                i.getId(), i.getProductId(), i.getName(), i.getImage(), i.getPrice(), i.getQuantity()
        );
    }

    public static OrderDtos.OrderEventResponse toOrderEvent(OrderEvent e) {
        return new OrderDtos.OrderEventResponse(e.getId(), e.getLabel(), e.isDone(), e.getCreatedAt());
    }

    public static OrderDtos.OrderResponse toOrder(Order o) {
        return new OrderDtos.OrderResponse(
                o.getId(), o.getOrderNumber(),
                o.getCustomer() != null ? o.getCustomer().getId() : null,
                o.getCustomerName(), o.getPhone(), o.getShippingAddress(),
                o.getStatus().name(), o.getPayment(), o.getPaymentStatus().name(),
                o.getSubtotal(), o.getDelivery(), o.getTotal(),
                o.getItems().stream().map(Mappers::toOrderItem).toList(),
                o.getTimeline().stream().map(Mappers::toOrderEvent).toList(),
                o.getCreatedAt(), o.getUpdatedAt()
        );
    }

    public static MarketingDtos.CouponResponse toCoupon(Coupon c) {
        return new MarketingDtos.CouponResponse(
                c.getId(), c.getCode(), c.getDiscountType().name(), c.getDiscountValue(),
                c.getUsageLimit(), c.getUsageCount(), c.getValidUntil(), c.getStatus().name()
        );
    }

    public static MarketingDtos.BannerResponse toBanner(Banner b) {
        return new MarketingDtos.BannerResponse(
                b.getId(), b.getTitle(), b.getLocation(), b.getImage(),
                b.getHeadline(), b.getDescription(), b.getCtaLabel(),
                b.getPrice(), b.getDiscountPercentage(),
                b.getSortOrder(), b.getStatus().name()
        );
    }

    public static MarketingDtos.ReviewResponse toReview(Review r) {
        return new MarketingDtos.ReviewResponse(
                r.getId(), r.getCustomerName(),
                r.getProduct() != null ? r.getProduct().getId() : null,
                r.getProductName(), r.getRating(), r.getComment(),
                r.getStatus().name(), r.getCreatedAt()
        );
    }
}
