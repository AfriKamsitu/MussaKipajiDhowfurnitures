package com.pajedhow.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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
            boolean marketingOptIn,
            Instant marketingOptInAt,
            List<AddressDtos.AddressResponse> addresses
    ) {}

    public record UpdateProfileRequest(
            @Size(max = 100) String name,
            @Email @Size(max = 254) String email,
            @Size(max = 40) String phone,
            @Size(max = 1024) String avatar,
            Boolean marketingOptIn
    ) {}

    /** Admin create/update for staff users. */
    public record StaffRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @Size(max = 128) String password,
            @NotBlank String role,   // ADMIN
            String status            // ACTIVE | INACTIVE
    ) {}

    /** Admin create/update for buyer customer users. */
    public record CustomerRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @Size(max = 40) String phone,
            @Size(max = 128) String password,
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
            Instant createdAt,
            boolean marketingOptIn,
            Instant marketingOptInAt
    ) {}
}
