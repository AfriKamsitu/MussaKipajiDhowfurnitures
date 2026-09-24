package com.pajedhow.backend.repository;

import com.pajedhow.backend.entity.Review;
import com.pajedhow.backend.entity.enums.Enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByStatusOrderByCreatedAtDesc(ReviewStatus status);

    List<Review> findByProductIdAndStatusOrderByCreatedAtDesc(Long productId, ReviewStatus status);

    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    boolean existsByUserIdAndProductId(String userId, Long productId);

    boolean existsByUserId(String userId);

    void deleteByProductId(Long productId);
}
