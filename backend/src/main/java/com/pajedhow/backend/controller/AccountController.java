package com.pajedhow.backend.controller;

import com.pajedhow.backend.dto.AddressDtos.AddressRequest;
import com.pajedhow.backend.dto.AddressDtos.AddressResponse;
import com.pajedhow.backend.dto.MarketingDtos.CouponQuoteRequest;
import com.pajedhow.backend.dto.MarketingDtos.CouponQuoteResponse;
import com.pajedhow.backend.dto.MarketingDtos.ReviewRequest;
import com.pajedhow.backend.dto.MarketingDtos.ReviewResponse;
import com.pajedhow.backend.dto.OrderDtos.CreateOrderRequest;
import com.pajedhow.backend.dto.OrderDtos.OrderResponse;
import com.pajedhow.backend.dto.UserDtos.UpdateProfileRequest;
import com.pajedhow.backend.dto.UserDtos.UserResponse;
import com.pajedhow.backend.service.CouponService;
import com.pajedhow.backend.service.OrderService;
import com.pajedhow.backend.service.ReviewService;
import com.pajedhow.backend.service.UserService;
import com.pajedhow.backend.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Authenticated buyer surface: profile, addresses, orders, reviews. */
@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final UserService userService;
    private final OrderService orderService;
    private final ReviewService reviewService;
    private final CouponService couponService;

    // ---- Profile ----
    @GetMapping("/profile")
    public UserResponse profile() {
        return userService.getProfile(SecurityUtils.currentUserId());
    }

    @PutMapping("/profile")
    public UserResponse updateProfile(@Valid @RequestBody UpdateProfileRequest req) {
        return userService.updateProfile(SecurityUtils.currentUserId(), req);
    }

    // ---- Addresses ----
    @GetMapping("/addresses")
    public List<AddressResponse> addresses() {
        return userService.listAddresses(SecurityUtils.currentUserId());
    }

    @PostMapping("/addresses")
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponse addAddress(@Valid @RequestBody AddressRequest req) {
        return userService.addAddress(SecurityUtils.currentUserId(), req);
    }

    @PutMapping("/addresses/{id}")
    public AddressResponse updateAddress(@PathVariable Long id, @Valid @RequestBody AddressRequest req) {
        return userService.updateAddress(SecurityUtils.currentUserId(), id, req);
    }

    @DeleteMapping("/addresses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAddress(@PathVariable Long id) {
        userService.deleteAddress(SecurityUtils.currentUserId(), id);
    }

    // ---- Orders (own) ----
    @GetMapping("/orders")
    public List<OrderResponse> myOrders() {
        return orderService.findByCustomer(SecurityUtils.currentUserId());
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse placeOrder(@Valid @RequestBody CreateOrderRequest req) {
        return orderService.create(req, SecurityUtils.currentUserId());
    }

    // ---- Coupons ----
    /** Checks a code against the cart subtotal; the discount is applied for real when the order is placed. */
    @PostMapping("/coupons/quote")
    public CouponQuoteResponse quoteCoupon(@Valid @RequestBody CouponQuoteRequest req) {
        return couponService.quote(req.code(), req.subtotal());
    }

    // ---- Reviews (own submissions) ----
    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse submitReview(@Valid @RequestBody ReviewRequest req) {
        return reviewService.create(req, SecurityUtils.currentUserId());
    }
}
