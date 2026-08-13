package com.e_commerce.AI_Powered_Inventory_Backend.security;



import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Reads the "Authorization: Bearer <token>" header, validates the JWT and,
 * if valid, populates the SecurityContext so downstream controllers can
 * resolve the current authenticated user (and scope all data queries to
 * their user_id).
 *
 * Performance note: this previously called userRepository.findByEmail(...)
 * on every single authenticated request, purely to look up the user's id.
 * That id is already embedded in the token as the "uid" claim (see
 * JwtService#generateToken), so the DB round-trip was unnecessary — it ran
 * on the hot path of literally every API call (dashboard, products,
 * forecasts, everything). The principal is now built entirely from the
 * token's own claims, with zero database access in this filter.
 *
 * Trade-off, stated plainly: this means a deleted/deactivated user's
 * existing token stays valid until it expires (24h by default,
 * app.jwt.expiration-ms), rather than being revoked the instant their row
 * changes. That's the standard trade-off of stateless JWT auth, and it's
 * bounded by the token's own expiry — if tighter revocation is ever
 * needed, that's a deliberate feature (e.g. a short-lived token + refresh
 * flow, or a denylist), not something to reintroduce as a per-request DB
 * check.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                String email = jwtService.extractEmail(token);
                Long userId = jwtService.extractUserId(token);

                if (email != null && userId != null && jwtService.isTokenValid(token, email)) {
                    var principal = new AuthenticatedUser(userId, email);
                    var authToken = new UsernamePasswordAuthenticationToken(
                            principal, null, Collections.emptyList());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception ex) {
            // Invalid/expired token -> leave context unauthenticated; entry point handles the 401.
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
