package com.pajedhow.backend.repository;

import com.pajedhow.backend.entity.Coupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    /** Locks the coupon row so two checkouts cannot both take the last remaining use. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Coupon c where lower(c.code) = lower(:code)")
    Optional<Coupon> findByCodeForUpdate(@Param("code") String code);
}
