package com.pajedhow.backend.service;

import com.pajedhow.backend.config.AppProperties;
import com.pajedhow.backend.dto.SettingsDtos.SettingsResponse;
import com.pajedhow.backend.entity.PasswordResetToken;
import com.pajedhow.backend.entity.User;
import com.pajedhow.backend.entity.enums.Enums.AccountStatus;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.exception.ServiceUnavailableException;
import com.pajedhow.backend.repository.PasswordResetTokenRepository;
import com.pajedhow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final Duration TOKEN_LIFETIME = Duration.ofMinutes(30);
    private static final Duration REQUEST_COOLDOWN = Duration.ofMinutes(1);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final SystemSettingsService settingsService;
    private final AppProperties appProperties;
    private final ConcurrentHashMap<String, Instant> lastRequest = new ConcurrentHashMap<>();

    @Transactional
    public void request(String suppliedEmail) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            throw new ServiceUnavailableException(
                    "Password reset email is not configured. Please contact the store for account support.");
        }

        String email = suppliedEmail.trim().toLowerCase(Locale.ROOT);
        Instant now = Instant.now();
        Instant previous = lastRequest.put(email, now);
        if (previous != null && previous.plus(REQUEST_COOLDOWN).isAfter(now)) {
            return;
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .filter(candidate -> candidate.getStatus() == AccountStatus.ACTIVE)
                .orElse(null);
        if (user == null) return;

        tokenRepository.deleteByUserId(user.getId());
        String rawToken = newToken();
        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .tokenHash(hash(rawToken))
                .expiresAt(now.plus(TOKEN_LIFETIME))
                .build();
        tokenRepository.save(token);

        SettingsResponse settings = settingsService.get();
        String origin = appProperties.getPublicUrl().replaceAll("/+$", "");
        String link = origin + "/reset-password?token=" + rawToken;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(settings.senderEmail());
        message.setTo(user.getEmail());
        message.setSubject("Reset your " + settings.storeName() + " password");
        message.setText("""
                Hello %s,

                Use the secure link below to reset your password. It expires in 30 minutes and can be used once:

                %s

                If you did not request this change, you can ignore this email.
                """.formatted(user.getName(), link));
        try {
            sender.send(message);
        } catch (MailException ex) {
            tokenRepository.delete(token);
            throw new ServiceUnavailableException(
                    "Password reset email could not be sent right now. Please try again shortly.");
        }
    }

    @Transactional
    public void confirm(String rawToken, String newPassword) {
        PasswordResetToken token = tokenRepository.findByTokenHash(hash(rawToken.trim()))
                .orElseThrow(() -> new BadRequestException("This password reset link is invalid or has expired."));
        Instant now = Instant.now();
        if (token.getUsedAt() != null || !token.getExpiresAt().isAfter(now)) {
            throw new BadRequestException("This password reset link is invalid or has expired.");
        }
        User user = token.getUser();
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("This account is not active.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        token.setUsedAt(now);
        tokenRepository.save(token);
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }
}
