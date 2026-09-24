package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.OrderDtos.*;
import com.pajedhow.backend.dto.SettingsDtos.PublicSettingsResponse;
import com.pajedhow.backend.entity.*;
import com.pajedhow.backend.entity.enums.Enums.OrderStatus;
import com.pajedhow.backend.entity.enums.Enums.PaymentStatus;
import com.pajedhow.backend.entity.enums.Enums.ProductStatus;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.exception.ResourceNotFoundException;
import com.pajedhow.backend.mapper.Mappers;
import com.pajedhow.backend.repository.OrderRepository;
import com.pajedhow.backend.repository.ProductRepository;
import com.pajedhow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = Map.of(
            OrderStatus.PENDING, EnumSet.of(OrderStatus.PROCESSING, OrderStatus.CANCELLED),
            OrderStatus.PROCESSING, EnumSet.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED, EnumSet.of(OrderStatus.DELIVERED),
            OrderStatus.DELIVERED, EnumSet.noneOf(OrderStatus.class),
            OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class)
    );

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLog;
    private final SystemSettingsService systemSettingsService;
    private final OrderEmailService orderEmailService;

    @Transactional(readOnly = true)
    public Page<OrderResponse> findAll(String status, Pageable pageable) {
        Page<Order> page = (status == null || status.isBlank())
                ? orderRepository.findAll(pageable)
                : orderRepository.findByStatus(parseStatus(status), pageable);
        return page.map(Mappers::toOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return Mappers.toOrder(get(id));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findByCustomer(String customerId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream().map(Mappers::toOrder).toList();
    }

    /** Create an order for an authenticated buyer or on behalf of a customer by an admin. */
    @Transactional
    public OrderResponse create(CreateOrderRequest req, String customerId) {
        String idempotencyKey = normalizeIdempotencyKey(req.idempotencyKey());
        if (customerId != null && idempotencyKey != null) {
            var existing = orderRepository.findByCustomerIdAndIdempotencyKey(customerId, idempotencyKey);
            if (existing.isPresent()) {
                return Mappers.toOrder(existing.get());
            }
        }

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .idempotencyKey(customerId == null ? null : idempotencyKey)
                .payment(req.payment() != null ? req.payment() : "Cash on Delivery")
                .phone(req.phone())
                .shippingAddress(req.shippingAddress())
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .build();

        if (customerId != null) {
            User customer = userRepository.findById(customerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
            order.setCustomer(customer);
            order.setCustomerName(req.customerName() != null ? req.customerName() : customer.getName());
            if (order.getPhone() == null) order.setPhone(customer.getPhone());
        } else {
            if (req.customerName() == null || req.customerName().isBlank()) {
                throw new BadRequestException("customerName is required for guest orders");
            }
            order.setCustomerName(req.customerName());
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItemRequest itemReq : req.items()) {
            Product product = productRepository.findByIdForUpdate(itemReq.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.productId()));
            if (product.getStatus() != ProductStatus.PUBLISHED) {
                throw new BadRequestException("Product is not available for ordering: " + product.getName());
            }
            if (product.getStock() == null || product.getStock() < itemReq.quantity()) {
                throw new BadRequestException("Insufficient stock for " + product.getName());
            }

            OrderItem item = OrderItem.builder()
                    .productId(product.getId())
                    .name(product.getName())
                    .image(product.getImage())
                    .price(product.getPrice())
                    .quantity(itemReq.quantity())
                    .build();
            order.addItem(item);
            subtotal = subtotal.add(product.getPrice().multiply(BigDecimal.valueOf(itemReq.quantity())));
            product.setStock(product.getStock() - itemReq.quantity());
            productRepository.save(product);
        }

        BigDecimal delivery;
        if (customerId == null) {
            delivery = req.delivery() != null ? req.delivery() : BigDecimal.ZERO;
        } else {
            PublicSettingsResponse settings = systemSettingsService.getPublicSettings();
            order.setPayment(resolveCustomerPayment(req.payment(), settings));
            boolean pickup = "PICKUP".equalsIgnoreCase(req.fulfillmentMethod());
            if (pickup && !settings.storePickupEnabled()) {
                throw new BadRequestException("Store pickup is not currently available.");
            }
            if (pickup) {
                delivery = BigDecimal.ZERO;
            } else if (settings.freeShippingThreshold().compareTo(BigDecimal.ZERO) > 0
                    && subtotal.compareTo(settings.freeShippingThreshold()) >= 0) {
                delivery = BigDecimal.ZERO;
            } else {
                delivery = settings.flatShippingRate();
            }
        }
        order.setSubtotal(subtotal);
        order.setDelivery(delivery);
        order.setTotal(subtotal.add(delivery));
        order.addEvent(OrderEvent.builder().label("Order placed").done(true).build());

        Order saved = orderRepository.save(order);
        activityLog.record(order.getCustomerName(), "placed order", saved.getOrderNumber());
        orderEmailService.sendOrderCreated(saved);
        return Mappers.toOrder(saved);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, UpdateStatusRequest req) {
        Order order = get(id);
        OrderStatus next = parseStatus(req.status());
        OrderStatus current = order.getStatus();
        if (current == next) {
            return Mappers.toOrder(order);
        }
        if (!ALLOWED_TRANSITIONS.getOrDefault(current, Set.of()).contains(next)) {
            throw new BadRequestException(
                    "Order cannot move from " + current + " to " + next + ".");
        }
        if (next == OrderStatus.CANCELLED) {
            restoreStock(order);
        }
        order.setStatus(next);

        // reflect the transition on the timeline + payment
        String label = switch (next) {
            case PENDING -> "Order placed";
            case PROCESSING -> "Processing";
            case SHIPPED -> "Shipped";
            case DELIVERED -> "Delivered";
            case CANCELLED -> "Cancelled";
        };
        boolean exists = order.getTimeline().stream().anyMatch(e -> e.getLabel().equals(label));
        if (!exists) {
            order.addEvent(OrderEvent.builder().label(label).done(true).build());
        }
        if (next == OrderStatus.DELIVERED) {
            order.setPaymentStatus(PaymentStatus.PAID);
        }

        Order saved = orderRepository.save(order);
        activityLog.record("Admin", "updated order status to " + next, saved.getOrderNumber());
        return Mappers.toOrder(saved);
    }

    @Transactional
    public void delete(Long id) {
        Order order = get(id);
        if (order.getStatus() != OrderStatus.CANCELLED) {
            throw new BadRequestException("Cancel the order before deleting it.");
        }
        orderRepository.delete(order);
        activityLog.record("Admin", "deleted order", order.getOrderNumber());
    }

    private void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            if (item.getProductId() == null || item.getQuantity() == null) continue;
            productRepository.findByIdForUpdate(item.getProductId()).ifPresent(product -> {
                int currentStock = product.getStock() == null ? 0 : product.getStock();
                product.setStock(currentStock + item.getQuantity());
                productRepository.save(product);
            });
        }
    }

    private Order get(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
    }

    private OrderStatus parseStatus(String value) {
        try {
            return OrderStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid order status: " + value);
        }
    }

    private String generateOrderNumber() {
        return "#FH" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 10)
                .toUpperCase();
    }

    private String normalizeIdempotencyKey(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String resolveCustomerPayment(String requested, PublicSettingsResponse settings) {
        String payment = requested == null || requested.isBlank() ? null : requested.trim();
        if (payment == null) {
            if (settings.cashOnDeliveryEnabled()) return "Cash on Delivery";
            if (settings.bankTransferEnabled()) return "Bank Transfer";
            return "WhatsApp confirmation";
        }
        if (payment.equalsIgnoreCase("Cash on Delivery") && !settings.cashOnDeliveryEnabled()) {
            throw new BadRequestException("Cash on delivery is not currently available.");
        }
        if (payment.equalsIgnoreCase("Bank Transfer") && !settings.bankTransferEnabled()) {
            throw new BadRequestException("Bank transfer is not currently available.");
        }
        if (!payment.equalsIgnoreCase("Cash on Delivery")
                && !payment.equalsIgnoreCase("Bank Transfer")
                && !payment.equalsIgnoreCase("WhatsApp confirmation")) {
            throw new BadRequestException("Unsupported payment method.");
        }
        return payment;
    }
}
