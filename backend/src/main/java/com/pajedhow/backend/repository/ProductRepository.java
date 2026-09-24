package com.pajedhow.backend.repository;

import com.pajedhow.backend.entity.Product;
import com.pajedhow.backend.entity.enums.Enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import jakarta.persistence.LockModeType;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySlug(String slug);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    boolean existsBySlug(String slug);

    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    Page<Product> findByCategoryAndStatus(String category, ProductStatus status, Pageable pageable);

    long countByStatus(ProductStatus status);

    @Query("""
            select p from Product p
            where (:category is null or p.category = :category)
              and (:status is null or p.status = :status)
              and (
                :q is null
                or lower(p.name) like lower(concat('%', :q, '%'))
                or lower(coalesce(p.material, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(p.shortDescription, '')) like lower(concat('%', :q, '%'))
              )
            """)
    Page<Product> search(@Param("q") String q,
                         @Param("category") String category,
                         @Param("status") ProductStatus status,
                         Pageable pageable);
}
