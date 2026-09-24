package com.pajedhow.backend.security;

import com.pajedhow.backend.config.AppProperties;
import com.pajedhow.backend.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private static final String TOKEN_TYPE_CLAIM = "token_type";
    private static final String ACCESS_TOKEN = "access";
    private static final String REFRESH_TOKEN = "refresh";
    private static final String TOKEN_VERSION_CLAIM = "token_version";

    private final AppProperties props;
    private final SecretKey key;

    public JwtService(AppProperties props) {
        this.props = props;
        byte[] decodedSecret = Decoders.BASE64.decode(props.getJwt().getSecret());
        if (decodedSecret.length < 32) {
            throw new IllegalStateException("JWT_SECRET must contain at least 256 bits of random data.");
        }
        this.key = Keys.hmacShaKeyFor(decodedSecret);
    }

    public String generateAccessToken(User user) {
        return buildToken(user, props.getJwt().getAccessTokenExpirationMs(), ACCESS_TOKEN);
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, props.getJwt().getRefreshTokenExpirationMs(), REFRESH_TOKEN);
    }

    public long getAccessTokenExpirationMs() {
        return props.getJwt().getAccessTokenExpirationMs();
    }

    public TokenIdentity extractAccessTokenIdentity(String token) {
        return extractTypedIdentity(token, ACCESS_TOKEN);
    }

    public TokenIdentity extractRefreshTokenIdentity(String token) {
        return extractTypedIdentity(token, REFRESH_TOKEN);
    }

    private String buildToken(User user, long expirationMs, String tokenType) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getId())
                .issuer(props.getJwt().getIssuer())
                .claims(Map.of(
                        "email", user.getEmail(),
                        "name", user.getName(),
                        "role", user.getRole().name(),
                        TOKEN_VERSION_CLAIM, user.getTokenVersion(),
                        TOKEN_TYPE_CLAIM, tokenType
                ))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    private TokenIdentity extractTypedIdentity(String token, String expectedType) {
        Claims claims = parseClaims(token);
        String tokenType = claims.get(TOKEN_TYPE_CLAIM, String.class);
        if (!expectedType.equals(tokenType)) {
            return null;
        }
        Number version = claims.get(TOKEN_VERSION_CLAIM, Number.class);
        if (version == null) {
            return null;
        }
        return new TokenIdentity(claims.getSubject(), version.longValue());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(props.getJwt().getIssuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public record TokenIdentity(String userId, long tokenVersion) {}
}
