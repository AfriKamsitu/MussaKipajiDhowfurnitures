package com.pajedhow.backend.security;

import com.pajedhow.backend.exception.TooManyRequestsException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthenticationRateLimiterTest {

    @Test
    void blocksAnAccountAfterEightFailuresRegardlessOfEmailCase() {
        AuthenticationRateLimiter limiter = new AuthenticationRateLimiter();

        for (int i = 0; i < 8; i++) {
            limiter.recordFailure("203.0.113." + i, "Buyer@Example.com");
        }

        assertThrows(
                TooManyRequestsException.class,
                () -> limiter.checkAllowed("203.0.113.200", " buyer@example.COM "));
    }

    @Test
    void successfulLoginClearsOnlyTheAccountBucket() {
        AuthenticationRateLimiter limiter = new AuthenticationRateLimiter();
        for (int i = 0; i < 8; i++) {
            limiter.recordFailure("203.0.113.10", "buyer@example.com");
        }

        limiter.recordSuccess("203.0.113.10", "buyer@example.com");

        assertDoesNotThrow(() -> limiter.checkAllowed("203.0.113.11", "buyer@example.com"));
    }
}
