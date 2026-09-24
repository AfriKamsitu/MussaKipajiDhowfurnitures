package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.OrderDtos.CreateOrderRequest;
import com.pajedhow.backend.dto.OrderDtos.UpdateStatusRequest;
import com.pajedhow.backend.entity.Order;
import com.pajedhow.backend.entity.OrderItem;
import com.pajedhow.backend.entity.Product;
import com.pajedhow.backend.entity.User;
import com.pajedhow.backend.entity.enums.Enums.OrderStatus;
import com.pajedhow.backend.entity.enums.Enums.PaymentStatus;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.repository.OrderRepository;
import com.pajedhow.backend.repository.ProductRepository;
import com.pajedhow.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UserRepository userRepository;
    @Mock private ActivityLogService activityLog;
    @Mock private SystemSettingsService settingsService;
    @Mock private OrderEmailService emailService;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                orderRepository,
                productRepository,
                userRepository,
                activityLog,
                settingsService,
                emailService);
    }

    @Test
    void cancellingAnOrderRestoresItsReservedStockOnce() {
        Product product = Product.builder()
                .id(3L)
                .name("Dining Table")
                .stock(2)
                .price(BigDecimal.valueOf(800_000))
                .build();
        Order order = pendingOrder();
        OrderItem item = OrderItem.builder()
                .productId(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .quantity(3)
                .build();
        order.addItem(item);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(productRepository.findByIdForUpdate(3L)).thenReturn(Optional.of(product));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.updateStatus(10L, new UpdateStatusRequest("CANCELLED"));

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(5, product.getStock());
        verify(productRepository).save(product);
    }

    @Test
    void rejectsStatusJumpsThatWouldBypassFulfilment() {
        Order order = pendingOrder();
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        assertThrows(
                BadRequestException.class,
                () -> orderService.updateStatus(10L, new UpdateStatusRequest("DELIVERED")));

        assertEquals(OrderStatus.PENDING, order.getStatus());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void duplicateAuthenticatedCheckoutReturnsTheOriginalOrder() {
        Order original = pendingOrder();
        original.setIdempotencyKey("checkout_1234567890");
        User customer = User.builder().id("buyer-1").build();
        original.setCustomer(customer);
        CreateOrderRequest request = new CreateOrderRequest(
                "Buyer",
                "+255700000000",
                "Zanzibar",
                "Cash on Delivery",
                null,
                "DELIVERY",
                List.of(),
                "checkout_1234567890");

        when(orderRepository.findByCustomerIdAndIdempotencyKey(
                "buyer-1", "checkout_1234567890")).thenReturn(Optional.of(original));

        var response = orderService.create(request, "buyer-1");

        assertEquals(original.getOrderNumber(), response.orderNumber());
        verify(productRepository, never()).findByIdForUpdate(any());
        verify(orderRepository, never()).save(any());
    }

    private Order pendingOrder() {
        return Order.builder()
                .id(10L)
                .orderNumber("#FHTEST0001")
                .customerName("Buyer")
                .status(OrderStatus.PENDING)
                .payment("Cash on Delivery")
                .paymentStatus(PaymentStatus.PENDING)
                .subtotal(BigDecimal.ZERO)
                .delivery(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .build();
    }
}
