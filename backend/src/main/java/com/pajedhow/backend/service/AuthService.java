package com.pajedhow.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pajedhow.backend.config.AppProperties;
import com.pajedhow.backend.dto.AuthDtos.*;
import com.pajedhow.backend.entity.Role;
import com.pajedhow.backend.entity.User;
import com.pajedhow.backend.entity.enums.Enums.AccountStatus;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.mapper.Mappers;
import com.pajedhow.backend.repository.UserRepository;
import com.pajedhow.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.Duration;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String GOOGLE_ID_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=%s";
    private static final String GOOGLE_ACCESS_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?access_token=%s";
    private static final String FACEBOOK_ME_URL = "https://graph.facebook.com/me?fields=id,name,email,picture";
    private static final String FACEBOOK_DEBUG_URL = "https://graph.facebook.com/debug_token?input_token=%s&access_token=%s";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AppProperties appProperties;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = normalizeEmail(req.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("An account with this email already exists.");
        }
        User user = User.builder()
                .name(req.name().trim())
                .email(email)
                .password(passwordEncoder.encode(req.password()))
                .role(Role.BUYER)
                .status(AccountStatus.ACTIVE)
                .marketingOptIn(Boolean.TRUE.equals(req.marketingOptIn()))
                .marketingOptInAt(Boolean.TRUE.equals(req.marketingOptIn()) ? Instant.now() : null)
                .build();
        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        String email = normalizeEmail(req.email());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Invalid email or password."));
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Invalid email or password.");
        }
        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password.");
        }
        if (passwordEncoder.upgradeEncoding(user.getPassword())) {
            user.setPassword(passwordEncoder.encode(req.password()));
        }
        updateMarketingPreference(user, req.marketingOptIn());
        user.setLastActiveAt(Instant.now());
        userRepository.save(user);
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        final JwtService.TokenIdentity identity;
        try {
            identity = jwtService.extractRefreshTokenIdentity(refreshToken);
        } catch (RuntimeException ex) {
            throw new BadRequestException("Invalid or expired refresh token.");
        }
        if (identity == null) throw new BadRequestException("Invalid or expired refresh token.");
        User user = userRepository.findById(identity.userId())
                .orElseThrow(() -> new BadRequestException("Account no longer exists."));
        if (user.getStatus() != AccountStatus.ACTIVE
                || user.getTokenVersion() != identity.tokenVersion()) {
            throw new BadRequestException("Invalid or expired refresh token.");
        }
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String access = jwtService.generateAccessToken(user);
        String refresh = jwtService.generateRefreshToken(user);
        return new AuthResponse(access, refresh, "Bearer",
                jwtService.getAccessTokenExpirationMs(), Mappers.toUser(user));
    }

    @Transactional
    public AuthResponse socialLogin(SocialLoginRequest req) {
        SocialUserInfo info = verifySocialLogin(req.provider(), req.token());
        if (info.email() == null || info.email().isBlank()) {
            throw new BadRequestException("Social login requires an email address.");
        }

        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(info.email()))
                .map(existing -> {
                    if (existing.getRole() == Role.ADMIN) {
                        throw new BadRequestException("Social login is not allowed for admin accounts.");
                    }
                    if (existing.getStatus() != AccountStatus.ACTIVE) {
                        throw new BadRequestException("This account is not active.");
                    }
                    existing.setName(info.name() != null ? info.name() : existing.getName());
                    if (info.picture() != null) {
                        existing.setAvatar(info.picture());
                    }
                    updateMarketingPreference(existing, req.marketingOptIn());
                    existing.setLastActiveAt(Instant.now());
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .name(info.name() != null ? info.name() : info.email())
                        .email(normalizeEmail(info.email()))
                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .role(Role.BUYER)
                        .status(AccountStatus.ACTIVE)
                        .avatar(info.picture())
                        .marketingOptIn(Boolean.TRUE.equals(req.marketingOptIn()))
                        .marketingOptInAt(Boolean.TRUE.equals(req.marketingOptIn()) ? Instant.now() : null)
                        .build()));

        return buildAuthResponse(user);
    }

    private SocialUserInfo verifySocialLogin(String provider, String token) {
        try {
            SocialProvider socialProvider = SocialProvider.valueOf(provider.trim().toUpperCase());
            return switch (socialProvider) {
                case GOOGLE -> verifyGoogleToken(token);
                case FACEBOOK -> verifyFacebookToken(token);
            };
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported social provider: " + provider);
        }
    }

    private SocialUserInfo verifyGoogleToken(String token) {
        // GIS custom-button flow usually yields an OAuth access token; Sign-In With Google yields a JWT id_token.
        if (isJwt(token)) {
            return verifyGoogleIdToken(token);
        }
        return verifyGoogleAccessToken(token);
    }

    private boolean isJwt(String token) {
        return token != null && token.chars().filter(ch -> ch == '.').count() == 2;
    }

    private SocialUserInfo verifyGoogleIdToken(String idToken) {
        JsonNode response = fetchJson(String.format(GOOGLE_ID_TOKEN_INFO_URL, encode(idToken)));
        verifyGoogleAudience(response);
        if (!response.hasNonNull("email")) {
            throw new BadRequestException("Google login failed: email not available.");
        }
        if (!response.path("email_verified").asText("false").equalsIgnoreCase("true")
                && !response.path("email_verified").asBoolean(false)) {
            throw new BadRequestException("Google login requires a verified email.");
        }
        return new SocialUserInfo(
                response.path("email").asText(),
                response.path("name").asText(null),
                response.path("picture").asText(null)
        );
    }

    private SocialUserInfo verifyGoogleAccessToken(String accessToken) {
        JsonNode tokenInfo = fetchJson(String.format(GOOGLE_ACCESS_TOKEN_INFO_URL, encode(accessToken)));
        verifyGoogleAudience(tokenInfo);
        JsonNode response = fetchAuthorizedJson(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                accessToken
        );
        if (!response.hasNonNull("email")) {
            throw new BadRequestException("Google login failed: email not available.");
        }
        boolean verified = response.path("email_verified").asBoolean(true)
                || response.path("email_verified").asText("true").equalsIgnoreCase("true");
        if (!verified) {
            throw new BadRequestException("Google login requires a verified email.");
        }
        return new SocialUserInfo(
                response.path("email").asText(),
                response.path("name").asText(null),
                response.path("picture").asText(null)
        );
    }

    private SocialUserInfo verifyFacebookToken(String accessToken) {
        String appId = appProperties.getOauth().getFacebookAppId();
        String appSecret = appProperties.getOauth().getFacebookAppSecret();
        if (appId == null || appId.isBlank() || appSecret == null || appSecret.isBlank()) {
            throw new BadRequestException("Facebook login is not configured on the server.");
        }
        JsonNode debug = fetchJson(String.format(
                FACEBOOK_DEBUG_URL,
                encode(accessToken),
                encode(appId + "|" + appSecret)));
        JsonNode data = debug.path("data");
        if (!data.path("is_valid").asBoolean(false) || !appId.equals(data.path("app_id").asText())) {
            throw new BadRequestException("Facebook login failed: invalid token.");
        }

        JsonNode response = fetchAuthorizedJson(FACEBOOK_ME_URL, accessToken);
        if (!response.hasNonNull("email")) {
            throw new BadRequestException("Facebook login failed: email not available. Grant email permission and try again.");
        }
        String picture = null;
        if (response.has("picture") && response.path("picture").has("data")) {
            picture = response.path("picture").path("data").path("url").asText(null);
        }
        return new SocialUserInfo(
                response.path("email").asText(),
                response.path("name").asText(null),
                picture
        );
    }

    private JsonNode fetchAuthorizedJson(String url, String bearerToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .header("Authorization", "Bearer " + bearerToken)
                    .GET()
                    .build();
            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new BadRequestException("Social login failed: invalid token or provider response.");
            }
            return OBJECT_MAPPER.readTree(response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Social login failed: unable to verify token.");
        } catch (IOException e) {
            throw new BadRequestException("Social login failed: unable to verify token.");
        }
    }

    private JsonNode fetchJson(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new BadRequestException("Social login failed: invalid token or provider response.");
            }
            return OBJECT_MAPPER.readTree(response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Social login failed: unable to verify token.");
        } catch (IOException e) {
            throw new BadRequestException("Social login failed: unable to verify token.");
        }
    }

    private void verifyGoogleAudience(JsonNode tokenInfo) {
        String expectedClientId = appProperties.getOauth().getGoogleClientId();
        if (expectedClientId == null || expectedClientId.isBlank()) {
            throw new BadRequestException("Google login is not configured on the server.");
        }
        String audience = tokenInfo.path("aud").asText(tokenInfo.path("issued_to").asText(""));
        if (!expectedClientId.equals(audience)) {
            throw new BadRequestException("Google login failed: token was issued for another application.");
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private record SocialUserInfo(String email, String name, String picture) {}

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private void updateMarketingPreference(User user, Boolean marketingOptIn) {
        if (marketingOptIn == null) return;
        user.setMarketingOptIn(marketingOptIn);
        user.setMarketingOptInAt(marketingOptIn ? Instant.now() : null);
    }

    private enum SocialProvider {
        GOOGLE,
        FACEBOOK
    }
}
