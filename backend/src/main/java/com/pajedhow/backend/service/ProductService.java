package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.ProductDtos.*;
import com.pajedhow.backend.entity.Product;
import com.pajedhow.backend.entity.Supplier;
import com.pajedhow.backend.entity.enums.Enums.ProductStatus;
import com.pajedhow.backend.exception.ResourceNotFoundException;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.mapper.Mappers;
import com.pajedhow.backend.repository.ProductRepository;
import com.pajedhow.backend.repository.ReviewRepository;
import com.pajedhow.backend.repository.SupplierRepository;
import com.pajedhow.backend.util.Slugs;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final ReviewRepository reviewRepository;

    // ---- Public storefront reads (published only) ----
    @Transactional(readOnly = true)
    public Page<ProductResponse> listPublished(String q, String category, int page, int size) {
        validatePagination(page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return productRepository.search(blankToNull(q), blankToNull(category), ProductStatus.PUBLISHED, pageable)
                .map(Mappers::toProduct);
    }

    @Transactional(readOnly = true)
    public ProductResponse getBySlug(String slug) {
        return productRepository.findBySlug(slug)
                .filter(product -> product.getStatus() == ProductStatus.PUBLISHED)
                .map(Mappers::toProduct)
                .orElseThrow(() -> ResourceNotFoundException.of("Product", slug));
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> featured(int limit) {
        Pageable pageable = PageRequest.of(0, Math.min(50, Math.max(1, limit)), Sort.by("createdAt").descending());
        return productRepository.findByStatus(ProductStatus.PUBLISHED, pageable)
                .stream().map(Mappers::toProduct).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getPublishedById(Long id) {
        Product product = findProduct(id);
        if (product.getStatus() != ProductStatus.PUBLISHED) {
            throw ResourceNotFoundException.of("Product", id);
        }
        return Mappers.toProduct(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        return Mappers.toProduct(findProduct(id));
    }

    // ---- Admin reads (all statuses) ----
    @Transactional(readOnly = true)
    public Page<ProductResponse> adminList(String q, String category, String status, int page, int size) {
        validatePagination(page, size);
        ProductStatus st = status == null || status.isBlank()
                ? null : Slugs.parseEnum(ProductStatus.class, status, null);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return productRepository.search(blankToNull(q), blankToNull(category), st, pageable)
                .map(Mappers::toProduct);
    }

    @Transactional
    public ProductResponse create(ProductRequest req) {
        Product product = new Product();
        apply(product, req);
        product.setColors(req.colors() != null ? new ArrayList<>(req.colors()) : new ArrayList<>());
        product.setImages(normalizeImages(req.image(), req.images()));
        product.setRating(0.0);
        product.setReviews(0);
        if (product.getSku() == null || product.getSku().isBlank()) {
            product.setSku(generateSku(product));
        }
        return Mappers.toProduct(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest req) {
        Product product = findProduct(id);
        apply(product, req);
        if (req.colors() != null) product.setColors(new ArrayList<>(req.colors()));
        if (req.images() != null) product.setImages(normalizeImages(product.getImage(), req.images()));
        return Mappers.toProduct(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        Product product = findProduct(id);
        reviewRepository.deleteByProductId(id);
        productRepository.delete(product);
    }

    private void apply(Product product, ProductRequest req) {
        if (req.oldPrice() != null && req.oldPrice().compareTo(req.price()) <= 0) {
            throw new BadRequestException("Compare price must be greater than the selling price.");
        }
        product.setName(req.name());
        String slug = req.slug() != null && !req.slug().isBlank()
                ? Slugs.slugify(req.slug()) : Slugs.slugify(req.name());
        product.setSlug(uniqueSlug(slug, product.getId()));
        product.setCategory(req.category().trim());
        product.setShortDescription(clean(req.shortDescription()));
        product.setDescription(clean(req.description()));
        product.setPrice(req.price());
        product.setOldPrice(req.oldPrice());
        product.setImage(req.image());
        product.setNew(Boolean.TRUE.equals(req.isNew()));
        product.setMaterial(clean(req.material()));
        product.setStatus(Slugs.parseEnum(ProductStatus.class, req.status(), ProductStatus.PUBLISHED));
        product.setStock(req.stock() != null ? req.stock() : 0);
        if (req.sku() != null) product.setSku(clean(req.sku()));
        product.setMoq(req.moq() != null ? req.moq() : 1);
        product.setWarrantyMonths(req.warrantyMonths() != null ? req.warrantyMonths() : 12);
        product.setDeliveryDays(req.deliveryDays() != null ? req.deliveryDays() : 5);
        if (req.supplierId() != null) {
            Supplier supplier = supplierRepository.findById(req.supplierId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Supplier", req.supplierId()));
            product.setSupplier(supplier);
        } else {
            product.setSupplier(null);
        }
    }

    private List<String> normalizeImages(String primaryImage, List<String> images) {
        List<String> normalized = new ArrayList<>();
        if (primaryImage != null && !primaryImage.isBlank()) {
            normalized.add(primaryImage);
        }
        if (images != null) {
            images.stream()
                    .filter(image -> image != null && !image.isBlank())
                    .map(String::trim)
                    .filter(image -> !normalized.contains(image))
                    .forEach(normalized::add);
        }
        return normalized;
    }

    private String uniqueSlug(String base, Long currentId) {
        String candidate = base.isBlank() ? "product" : base;
        int suffix = 1;
        while (productRepository.findBySlug(candidate)
                .filter(p -> !p.getId().equals(currentId)).isPresent()) {
            candidate = base + "-" + (++suffix);
        }
        return candidate;
    }

    private String generateSku(Product product) {
        String prefix = product.getSlug().length() >= 4
                ? product.getSlug().substring(0, 4).toUpperCase() : product.getSlug().toUpperCase();
        return "PJD-" + prefix + "-" + (100 + (Math.abs(product.getSlug().hashCode()) % 900));
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Product", id));
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void validatePagination(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new BadRequestException("Page must be 0 or greater and size must be between 1 and 100.");
        }
    }
}
