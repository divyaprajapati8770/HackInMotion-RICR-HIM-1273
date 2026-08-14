package com.e_commerce.AI_Powered_Inventory_Backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {

        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least 32 characters long."
            );
        }

        this.signingKey =
                Keys.hmacShaKeyFor(
                        secret.getBytes(StandardCharsets.UTF_8)
                );

        this.expirationMs = expirationMs;
    }

    public String generateToken(Long userId, String email) {

        Date now = new Date();
        Date expiry =
                new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claims(Map.of(
                        "uid", userId
                ))
                .subject(email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(
                token,
                Claims::getSubject
        );
    }

    public Long extractUserId(String token) {

        Claims claims =
                extractAllClaims(token);

        return claims.get(
                "uid",
                Long.class
        );
    }

    public boolean isTokenValid(
            String token,
            String email) {

        String tokenEmail =
                extractEmail(token);

        return tokenEmail != null
                && tokenEmail.equals(email)
                && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {

        return extractClaim(
                token,
                Claims::getExpiration
        ).before(new Date());
    }

    private <T> T extractClaim(
            String token,
            Function<Claims, T> resolver) {

        return resolver.apply(
                extractAllClaims(token)
        );
    }

    private Claims extractAllClaims(String token) {

        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}