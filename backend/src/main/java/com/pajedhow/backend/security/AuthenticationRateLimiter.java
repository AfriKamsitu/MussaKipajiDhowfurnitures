package com.pajedhow.backend.security;

import com.pajedhow.backend.exception.TooManyRequestsException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class AuthenticationRateLimiter {

    private static final int ACCOUNT_MAX_FAILURES = 8;
    private static final int IP_MAX_FAILURES = 30;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int CLEANUP_INTERVAL = 128;

    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();
    private final AtomicInteger operations = new AtomicInteger();

    public void checkAllowed(String remoteAddress, String email) {
        cleanupPeriodically();
        check(key("ip", remoteAddress), IP_MAX_FAILURES);
        check(key("account", normalizeEmail(email)), ACCOUNT_MAX_FAILURES);
    }

    public void recordFailure(String remoteAddress, String email) {
        cleanupPeriodically();
        fail(key("ip", remoteAddress));
        fail(key("account", normalizeEmail(email)));
    }

    public void recordSuccess(String remoteAddress, String email) {
        // A valid password clears the account bucket. It must not erase all
        // failed traffic from the same client address.
        attempts.remove(key("account", normalizeEmail(email)));
    }

    private void check(String key, int maximumFailures) {
        Attempt attempt = attempts.get(key);
        if (attempt == null) return;
        synchronized (attempt) {
            resetExpired(attempt);
            if (attempt.failures >= maximumFailures) {
                throw new TooManyRequestsException("Too many failed sign-in attempts. Try again in 15 minutes.");
            }
        }
    }

    private void fail(String key) {
        Attempt attempt = attempts.computeIfAbsent(key, ignored -> new Attempt());
        synchronized (attempt) {
            resetExpired(attempt);
            attempt.failures++;
        }
    }

    private void resetExpired(Attempt attempt) {
        if (isExpired(attempt, Instant.now())) {
            attempt.windowStarted = Instant.now();
            attempt.failures = 0;
        }
    }

    private void cleanupPeriodically() {
        if (operations.incrementAndGet() % CLEANUP_INTERVAL != 0) return;
        Instant now = Instant.now();
        attempts.entrySet().removeIf(entry -> {
            Attempt attempt = entry.getValue();
            synchronized (attempt) {
                return isExpired(attempt, now);
            }
        });
    }

    private boolean isExpired(Attempt attempt, Instant now) {
        return !attempt.windowStarted.plus(WINDOW).isAfter(now);
    }

    private String key(String type, String value) {
        return type + ":" + (value == null || value.isBlank() ? "unknown" : value);
    }

    private String normalizeEmail(String email) {
        return email == null ? "unknown" : email.trim().toLowerCase(Locale.ROOT);
    }

    private static final class Attempt {
        private Instant windowStarted = Instant.now();
        private int failures;
    }
}
