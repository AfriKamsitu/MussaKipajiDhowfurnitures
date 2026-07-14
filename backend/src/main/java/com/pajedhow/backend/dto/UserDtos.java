package com.pajedhow.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.List;

public final class UserDtos {

    private UserDtos() {}

    public record UserResponse(
            String id,
            String name,
            String email,
            String phone,
            String avatar,
            String role,
            String status,
            Instant createdAt,
            Instant lastActiveAt,
            List<AddressDtos.AddressResponse> addresses
    ) {}

    public record UpdateProfileRequest(
            String name,
            @Email String email,
            String phone,
            String avatar
    ) {}

    /** Admin create/update for staff users. */
    public record StaffRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            String password,
            @NotBlank String role,   // ADMIN
            String status            // ACTIVE | INACTIVE
    ) {}

    /** Admin summary of a customer, mirroring the frontend customer table. */
    public record CustomerSummary(
            String id,
            String name,
            String email,
            String phone,
            long orders,
            java.math.BigDecimal spent,
            String status,
            Instant createdAt
    ) {}
}
