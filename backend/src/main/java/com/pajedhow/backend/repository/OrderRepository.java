package com.pajedhow.backend.repository;

import com.pajedhow.backend.entity.Order;
import com.pajedhow.backend.entity.enums.Enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByCustomerIdAndIdempotencyKey(String customerId, String idempotencyKey);

    List<Order> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    boolean existsByCustomerId(String customerId);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    long countByStatus(OrderStatus status);

    @Query("""
            select (count(o) > 0) from Order o join o.items i
            where o.customer.id = :customerId
              and i.productId = :productId
              and o.status = com.pajedhow.backend.entity.enums.Enums$OrderStatus.DELIVERED
            """)
    boolean hasDeliveredProduct(
            @Param("customerId") String customerId,
            @Param("productId") Long productId);

    @Query("select coalesce(sum(o.total), 0) from Order o where o.status <> com.pajedhow.backend.entity.enums.Enums$OrderStatus.CANCELLED")
    BigDecimal totalRevenue();

    @EntityGraph(attributePaths = {"items", "customer"})
    @Query("""
            select distinct o from Order o
            where o.createdAt >= :from and o.createdAt < :to
            order by o.createdAt desc
            """)
    List<Order> findForReport(@Param("from") Instant from, @Param("to") Instant to);
}
