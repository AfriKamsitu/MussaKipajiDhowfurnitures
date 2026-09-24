package com.pajedhow.backend.controller;

import com.pajedhow.backend.dto.AuthDtos.*;
import com.pajedhow.backend.dto.UserDtos.UserResponse;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.security.AuthenticationRateLimiter;
import com.pajedhow.backend.service.AuthService;
import com.pajedhow.backend.service.PasswordResetService;
import com.pajedhow.backend.service.UserService;
import com.pajedhow.backend.util.SecurityUtils;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthenticationRateLimiter rateLimiter;
    private final UserService userService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletRequest servletRequest) {
        String remoteAddress = resolveClientAddress(servletRequest);
        rateLimiter.checkAllowed(remoteAddress, request.email());
        try {
            AuthResponse response = authService.login(request);
            rateLimiter.recordSuccess(remoteAddress, request.email());
            return ResponseEntity.ok(response);
        } catch (BadRequestException ex) {
            rateLimiter.recordFailure(remoteAddress, request.email());
            throw ex;
        }
    }

    @PostMapping("/social")
    public ResponseEntity<AuthResponse> socialLogin(@Valid @RequestBody SocialLoginRequest request) {
        return ResponseEntity.ok(authService.socialLogin(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request.refreshToken()));
    }

    /** Current authenticated user (used by the frontend auth provider on load). */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(userService.getProfile(SecurityUtils.currentUserId()));
    }

    @PostMapping("/password-reset/request")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, String> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.request(request.email());
        return Map.of("message", "If an active account exists for that email, a reset link has been sent.");
    }

    @PostMapping("/password-reset/confirm")
    public Map<String, String> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        passwordResetService.confirm(request.token(), request.password());
        return Map.of("message", "Your password has been reset. You can now sign in.");
    }

    private String resolveClientAddress(HttpServletRequest request) {
        String peer = request.getRemoteAddr();
        if (!isTrustedProxy(peer)) return peer;

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded == null || forwarded.isBlank()) {
            forwarded = request.getHeader("X-Real-IP");
        }
        if (forwarded == null || forwarded.isBlank()) return peer;

        String first = forwarded.split(",", 2)[0].trim();
        return first.isBlank() || first.length() > 64 ? peer : first;
    }

    private boolean isTrustedProxy(String address) {
        if (address == null) return false;
        return address.equals("127.0.0.1")
                || address.equals("0:0:0:0:0:0:0:1")
                || address.equals("::1")
                || address.startsWith("10.")
                || address.startsWith("192.168.")
                || address.matches("^172\\.(1[6-9]|2\\d|3[01])\\..*");
    }
}
