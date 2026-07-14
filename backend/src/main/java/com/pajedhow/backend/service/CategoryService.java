package com.pajedhow.backend.service;

import com.pajedhow.backend.dto.CategoryDtos.*;
import com.pajedhow.backend.entity.Category;
import com.pajedhow.backend.entity.enums.Enums.AccountStatus;
import com.pajedhow.backend.exception.ResourceNotFoundException;
import com.pajedhow.backend.mapper.Mappers;
import com.pajedhow.backend.repository.CategoryRepository;
import com.pajedhow.backend.repository.ProductRepository;
import com.pajedhow.backend.util.Slugs;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> list() {
        return categoryRepository.findAll().stream()
                .map(c -> Mappers.toCategory(c, countProducts(c.getSlug())))
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getBySlug(String slug) {
        Category c = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> ResourceNotFoundException.of("Category", slug));
        return Mappers.toCategory(c, countProducts(slug));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        Category category = new Category();
        apply(category, req);
        return Mappers.toCategory(categoryRepository.save(category), 0);
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Category", id));
        apply(category, req);
        return Mappers.toCategory(categoryRepository.save(category), countProducts(category.getSlug()));
    }

    @Transactional
    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Category", id));
        categoryRepository.delete(category);
    }

    private void apply(Category category, CategoryRequest req) {
        category.setName(req.name());
        String slug = req.slug() != null && !req.slug().isBlank()
                ? Slugs.slugify(req.slug()) : Slugs.slugify(req.name());
        category.setSlug(uniqueSlug(slug, category.getId()));
        category.setDescription(req.description());
        category.setImage(req.image());
        category.setStatus(Slugs.parseEnum(AccountStatus.class, req.status(), AccountStatus.ACTIVE));
    }

    private String uniqueSlug(String base, Long currentId) {
        String candidate = base.isBlank() ? "category" : base;
        int suffix = 1;
        while (categoryRepository.findBySlug(candidate)
                .filter(c -> !c.getId().equals(currentId)).isPresent()) {
            candidate = base + "-" + (++suffix);
        }
        return candidate;
    }

    private long countProducts(String slug) {
        return productRepository.count() == 0 ? 0
                : productRepository.search(null, slug, null, PageRequest.of(0, 1)).getTotalElements();
    }

    public CategoryResponse findBySlug(String slug) {
        categoryRepository.findBySlug(slug);

        return findBySlug(slug);
    }
}
