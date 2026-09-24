package com.pajedhow.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters") String password,
            Boolean marketingOptIn
    ) {
        public RegisterRequest(String name, String email, String password) {
            this(name, email, password, null);
        }
    }

    public record LoginRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 128) String password,
            Boolean marketingOptIn
    ) {
        public LoginRequest(String email, String password) {
            this(email, password, null);
        }
    }

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            long expiresInMs,
            UserDtos.UserResponse user
    ) {}

    public record RefreshRequest(
            @NotBlank @Size(max = 8192) String refreshToken
    ) {}

    public record PasswordResetRequest(
            @NotBlank @Email @Size(max = 254) String email
    ) {}

    public record PasswordResetConfirmRequest(
            @NotBlank @Size(max = 256) String token,
            @NotBlank @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
            String password
    ) {}

    public record SocialLoginRequest(
            @NotBlank @Pattern(regexp = "(?i)GOOGLE|FACEBOOK") String provider,
            @NotBlank @Size(max = 8192) String token,
            Boolean marketingOptIn
    ) {
        public SocialLoginRequest(String provider, String token) {
            this(provider, token, null);
        }
    }
}
