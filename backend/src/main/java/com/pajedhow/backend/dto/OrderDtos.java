package com.pajedhow.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class OrderDtos {

    private OrderDtos() {}

    public record OrderItemResponse(
            Long id,
            Long productId,
            String name,
            String image,
            BigDecimal price,
            Integer quantity
    ) {}

    public record OrderEventResponse(
            Long id,
            String label,
            boolean done,
            Instant at
    ) {}

    public record OrderResponse(
            Long id,
            String orderNumber,
            String customerId,
            String customerName,
            String phone,
            String shippingAddress,
            String status,
            String payment,
            String paymentStatus,
            BigDecimal subtotal,
            BigDecimal delivery,
            BigDecimal total,
            List<OrderItemResponse> items,
            List<OrderEventResponse> timeline,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record OrderItemRequest(
            @NotNull @Positive Long productId,
            @Size(max = 200) String name,
            @Size(max = 1024) String image,
            @PositiveOrZero BigDecimal price,
            @NotNull @Positive @Max(100) Integer quantity
    ) {}

    /** Checkout payload sent by a customer or created by an admin. */
    public record CreateOrderRequest(
            @Size(max = 100) String customerName,
            @NotBlank @Pattern(regexp = "^[+0-9 ()-]{7,30}$", message = "Phone number format is invalid") String phone,
            @NotBlank @Size(max = 500) String shippingAddress,
            @Size(max = 50) String payment,
            @PositiveOrZero BigDecimal delivery,
            @Pattern(
                    regexp = "(?i)^$|DELIVERY|PICKUP",
                    message = "Fulfillment method must be DELIVERY or PICKUP"
            ) String fulfillmentMethod,
            @NotEmpty @Size(max = 100) @Valid List<OrderItemRequest> items,
            @Pattern(
                    regexp = "^$|[A-Za-z0-9_-]{16,64}$",
                    message = "Idempotency key format is invalid"
            ) String idempotencyKey
    ) {}

    public record UpdateStatusRequest(
            @NotBlank String status  // PENDING | PROCESSING | SHIPPED | DELIVERED | CANCELLED
    ) {}
}
