package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.MarketingDtos.ReviewRequest;
import com.pajedhow.backend.dto.MarketingDtos.ReviewResponse;
import com.pajedhow.backend.dto.MarketingDtos.ReviewStatusRequest;
import com.pajedhow.backend.entity.Product;
import com.pajedhow.backend.entity.Review;
import com.pajedhow.backend.entity.User;
import com.pajedhow.backend.entity.enums.Enums.ReviewStatus;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.exception.ResourceNotFoundException;
import com.pajedhow.backend.mapper.Mappers;
import com.pajedhow.backend.repository.ProductRepository;
import com.pajedhow.backend.repository.OrderRepository;
import com.pajedhow.backend.repository.ReviewRepository;
import com.pajedhow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<ReviewResponse> findAll() {
        return reviewRepository.findAll().stream().map(Mappers::toReview).toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> findPending() {
        return reviewRepository.findByStatusOrderByCreatedAtDesc(ReviewStatus.PENDING)
                .stream().map(Mappers::toReview).toList();
    }

    /** Public: only published reviews for a product. */
    @Transactional(readOnly = true)
    public List<ReviewResponse> findPublishedForProduct(Long productId) {
        return reviewRepository.findByProductIdAndStatusOrderByCreatedAtDesc(productId, ReviewStatus.PUBLISHED)
                .stream().map(Mappers::toReview).toList();
    }

    /** A customer submits a review (starts as PENDING for moderation). */
    @Transactional
    public ReviewResponse create(ReviewRequest req, String userId) {
        if (req.rating() < 1 || req.rating() > 5) {
            throw new BadRequestException("Rating must be between 1 and 5");
        }
        Product product = productRepository.findById(req.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + req.productId()));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (user.isAdmin()) {
            throw new BadRequestException("Admin accounts cannot submit product reviews");
        }
        if (reviewRepository.existsByUserIdAndProductId(userId, product.getId())) {
            throw new BadRequestException("You have already reviewed this product");
        }
        if (!orderRepository.hasDeliveredProduct(userId, product.getId())) {
            throw new BadRequestException("Only customers with a delivered order can review this product");
        }

        Review review = Review.builder()
                .user(user)
                .customerName(user.getName())
                .product(product)
                .productName(product.getName())
                .rating(req.rating())
                .comment(req.comment())
                .status(ReviewStatus.PENDING)
                .build();
        return Mappers.toReview(reviewRepository.save(review));
    }

    /** Admin moderation: publish or unpublish, then refresh product aggregates. */
    @Transactional
    public ReviewResponse updateStatus(Long id, ReviewStatusRequest req) {
        Review review = get(id);
        review.setStatus(parseStatus(req.status()));
        Review saved = reviewRepository.save(review);
        if (review.getProduct() != null) {
            recalculateProductRating(review.getProduct().getId());
        }
        return Mappers.toReview(saved);
    }

    @Transactional
    public void delete(Long id) {
        Review review = get(id);
        Long productId = review.getProduct() != null ? review.getProduct().getId() : null;
        reviewRepository.delete(review);
        if (productId != null) recalculateProductRating(productId);
    }

    private void recalculateProductRating(Long productId) {
        productRepository.findById(productId).ifPresent(p -> {
            List<Review> published =
                    reviewRepository.findByProductIdAndStatusOrderByCreatedAtDesc(productId, ReviewStatus.PUBLISHED);
            if (published.isEmpty()) {
                p.setRating(0.0);
                p.setReviews(0);
            } else {
                double avg = published.stream().mapToInt(Review::getRating).average().orElse(0.0);
                p.setRating(Math.round(avg * 10.0) / 10.0);
                p.setReviews(published.size());
            }
            productRepository.save(p);
        });
    }

    private Review get(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found: " + id));
    }

    private ReviewStatus parseStatus(String value) {
        try {
            return ReviewStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new BadRequestException("Invalid review status: " + value);
        }
    }
}
