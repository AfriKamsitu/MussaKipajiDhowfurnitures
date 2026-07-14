package com.pajedhow.backend.controller.admin;

import com.pajedhow.backend.dto.UserDtos.CustomerSummary;
import com.pajedhow.backend.dto.UserDtos.StaffRequest;
import com.pajedhow.backend.dto.UserDtos.UserResponse;
import com.pajedhow.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    // ---- Staff (only ADMIN manages team) ----
    @GetMapping("/staff")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> staff() {
        return userService.listStaff();
    }

    @PostMapping("/staff")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse createStaff(@Valid @RequestBody StaffRequest req) {
        return userService.createStaff(req);
    }

    @PutMapping("/staff/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateStaff(@PathVariable String id, @Valid @RequestBody StaffRequest req) {
        return userService.updateStaff(id, req);
    }

    @DeleteMapping("/staff/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteStaff(@PathVariable String id) {
        userService.deleteUser(id);
    }

    // ---- Customers ----
    @GetMapping("/customers")
    public List<CustomerSummary> customers() {
        return userService.listCustomers();
    }

    @PatchMapping("/customers/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse setCustomerStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return userService.setStatus(id, body.getOrDefault("status", "ACTIVE"));
    }
}
