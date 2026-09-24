package com.pajedhow.backend.controller;

import com.pajedhow.backend.dto.MarketingDtos.ReviewResponse;
import com.pajedhow.backend.dto.ProductDtos.ProductResponse;
import com.pajedhow.backend.service.ProductService;
import com.pajedhow.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public storefront product endpoints (published catalog only). */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ReviewService reviewService;

    @GetMapping
    public Page<ProductResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return productService.listPublished(q, category, page, size);
    }

    @GetMapping("/slug/{slug}")
    public ProductResponse getBySlug(@PathVariable String slug) {
        return productService.getBySlug(slug);
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable Long id) {
        return productService.getPublishedById(id);
    }

    @GetMapping("/{id}/reviews")
    public List<ReviewResponse> reviews(@PathVariable Long id) {
        return reviewService.findPublishedForProduct(id);
    }
}
