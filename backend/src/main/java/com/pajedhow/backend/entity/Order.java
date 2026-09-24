package com.pajedhow.backend.entity;

import com.pajedhow.backend.entity.enums.Enums.OrderStatus;
import com.pajedhow.backend.entity.enums.Enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_orders_number", columnList = "orderNumber", unique = true),
        @Index(name = "idx_orders_customer_idempotency", columnList = "customer_id,idempotencyKey", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-facing order code, e.g. "#FH12548". */
    @Column(nullable = false, unique = true, length = 20)
    private String orderNumber;

    /**
     * Client-generated checkout key. Retrying the same checkout returns the
     * original order instead of decrementing stock twice.
     */
    @Column(length = 64)
    private String idempotencyKey;

    /** Buyer account (nullable for guest / seller-created orders). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;

    /** Snapshot of the customer name at order time. */
    @Column(nullable = false)
    private String customerName;

    private String phone;

    @Column(length = 512)
    private String shippingAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Column(nullable = false)
    @Builder.Default
    private String payment = "Cash on Delivery";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal delivery = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal total = BigDecimal.ZERO;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<OrderEvent> timeline = new ArrayList<>();

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

    public void addItem(OrderItem item) {
        item.setOrder(this);
        this.items.add(item);
    }

    public void addEvent(OrderEvent event) {
        event.setOrder(this);
        this.timeline.add(event);
    }
}
