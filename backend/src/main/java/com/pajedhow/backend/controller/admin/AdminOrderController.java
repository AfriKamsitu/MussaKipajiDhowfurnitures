package com.pajedhow.backend.controller.admin;

import com.pajedhow.backend.dto.OrderDtos.CreateOrderRequest;
import com.pajedhow.backend.dto.OrderDtos.OrderResponse;
import com.pajedhow.backend.dto.OrderDtos.UpdateStatusRequest;
import com.pajedhow.backend.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public Page<OrderResponse> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return orderService.findAll(status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable Long id) {
        return orderService.findById(id);
    }

    /** Admin can create an order on behalf of a walk-in / phone customer. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest req) {
        return orderService.create(req, null);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public OrderResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest req) {
        return orderService.updateStatus(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        orderService.delete(id);
    }
}
