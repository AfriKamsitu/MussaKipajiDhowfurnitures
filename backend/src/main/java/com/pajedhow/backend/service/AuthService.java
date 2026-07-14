package com.pajedhow.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pajedhow.backend.dto.AuthDtos.*;
import com.pajedhow.backend.entity.Role;
import com.pajedhow.backend.entity.User;
import com.pajedhow.backend.entity.enums.Enums.AccountStatus;
import com.pajedhow.backend.exception.BadRequestException;
import com.pajedhow.backend.mapper.Mappers;
import com.pajedhow.backend.repository.UserRepository;
import com.pajedhow.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=%s";
    private static final String FACEBOOK_ME_URL = "https://graph.facebook.com/me?fields=id,name,email,picture&access_token=%s";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new BadRequestException("An account with this email already exists.");
        }
        User user = User.builder()
                .name(req.name())
                .email(req.email().trim().toLowerCase())
                .password(passwordEncoder.encode(req.password()))
                .role(Role.BUYER)
                .status(AccountStatus.ACTIVE)
                .build();
        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email().trim().toLowerCase(), req.password()));
        User user = userRepository.findByEmailIgnoreCase(req.email())
                .orElseThrow(() -> new BadRequestException("Invalid email or password."));
        user.setLastActiveAt(Instant.now());
        userRepository.save(user);
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        String userId = jwtService.extractUserId(refreshToken);
        if (userId == null || !jwtService.isTokenValid(refreshToken, userId)) {
            throw new BadRequestException("Invalid or expired refresh token.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("Account no longer exists."));
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

        User user = userRepository.findByEmailIgnoreCase(info.email())
                .map(existing -> {
                    if (existing.getRole() == Role.ADMIN) {
                        throw new BadRequestException("Social login is not allowed for admin accounts.");
                    }
                    existing.setName(info.name() != null ? info.name() : existing.getName());
                    if (info.picture() != null) {
                        existing.setAvatar(info.picture());
                    }
                    existing.setLastActiveAt(Instant.now());
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .name(info.name() != null ? info.name() : info.email())
                        .email(info.email().toLowerCase())
                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .role(Role.BUYER)
                        .status(AccountStatus.ACTIVE)
                        .avatar(info.picture())
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
        JsonNode response = fetchJson(String.format(GOOGLE_TOKEN_INFO_URL, idToken));
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
        JsonNode response = fetchJson(String.format(FACEBOOK_ME_URL, accessToken));
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
                    .header("Authorization", "Bearer " + bearerToken)
                    .GET()
                    .build();
            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new BadRequestException("Social login failed: invalid token or provider response.");
            }
            return OBJECT_MAPPER.readTree(response.body());
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Social login failed: unable to verify token.");
        }
    }

    private JsonNode fetchJson(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();
            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new BadRequestException("Social login failed: invalid token or provider response.");
            }
            return OBJECT_MAPPER.readTree(response.body());
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Social login failed: unable to verify token.");
        }
    }

    private record SocialUserInfo(String email, String name, String picture) {}

    private enum SocialProvider {
        GOOGLE,
        FACEBOOK
    }
}
