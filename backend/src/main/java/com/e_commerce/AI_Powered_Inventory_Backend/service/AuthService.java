package com.e_commerce.AI_Powered_Inventory_Backend.service;

import com.e_commerce.AI_Powered_Inventory_Backend.dto.request.LoginRequest;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.request.SignupRequest;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.AuthResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.exception.ApiException;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.User;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.UserRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SalesService salesService;
    private final EmailService emailService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /** URL-safe, 256-bit random token — not a UUID, which is only 122 bits of entropy and partly structural. */
    private static String newVerificationToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        String token = newVerificationToken();

        User user = User.builder()
                .businessName(req.businessName())
                .email(req.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role("OWNER")
                .enabled(false)
                .verificationToken(token)
                .verificationTokenExpiresAt(LocalDateTime.now().plusHours(24))
                .build();

        user = userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getBusinessName(), token);

        // Seed demo data so the dashboard is never empty on first login.
        salesService.seedDemoData(user.getId());

        return AuthResponse.builder()
                .token(null)
                .userId(user.getId())
                .businessName(user.getBusinessName())
                .email(user.getEmail())
                .emailVerified(user.getEnabled())
                .build();
    }

    /**
     * Activates an account from an emailed token. Fully idempotent on a
     * still-matching token: many corporate mail gateways and some webmail
     * clients (Gmail's "link checking" included, in some configurations)
     * pre-fetch links in an email before the human ever clicks — if the
     * first hit had nulled the token, that prefetch would silently consume
     * it and the user's real click would land on "verification failed" for
     * an account that's actually fine. Instead, the token is left in place
     * after a successful verify (it's a high-entropy secret that only ever
     * reaches the user's inbox, so leaving it valid carries no real risk)
     * and a repeat hit on an already-enabled account is a no-op success
     * rather than an error — since the dashboard redirect on the frontend
     * now depends on this call succeeding, a false failure here would wrongly
     * lock the user out of their own account. An unmatched token (never
     * issued, or superseded by a fresh one from resendVerification) still
     * fails clearly.
     */
    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "This verification link is invalid or has already been used."));

        if (Boolean.TRUE.equals(user.getEnabled())) {
            return;
        }

        if (user.getVerificationTokenExpiresAt() != null
                && user.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.GONE,
                    "This verification link has expired. Request a new one from your account settings.");
        }

        user.setEnabled(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);

        userRepository.save(user);
    }

    /** Re-issues a token and re-sends the email. No-op (silently OK) if already verified. */
    @Transactional
    public void resendVerification(String email) {

        if (email == null || email.isBlank()) {
            return;
        }

        userRepository.findByEmail(
                email.toLowerCase().trim()
        ).ifPresent(user -> {

            if (Boolean.TRUE.equals(user.getEnabled())) {
                return;
            }

            String token = newVerificationToken();

            user.setVerificationToken(token);
            user.setVerificationTokenExpiresAt(
                    LocalDateTime.now().plusHours(24)
            );

            userRepository.save(user);

            emailService.sendVerificationEmail(
                    user.getEmail(),
                    user.getBusinessName(),
                    token
            );
        });
    }

    public AuthResponse login(LoginRequest req) {

        User user = userRepository.findByEmail(
                req.email().toLowerCase().trim()
        ).orElseThrow(() ->
                new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password."
                )
        );

        if (!passwordEncoder.matches(
                req.password(),
                user.getPasswordHash()
        )) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password."
            );
        }

        // Do not issue JWT to an unverified account.
        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Please verify your email before logging in."
            );
        }

        String jwt = jwtService.generateToken(
                user.getId(),
                user.getEmail()
        );

        return AuthResponse.builder()
                .token(jwt)
                .userId(user.getId())
                .businessName(user.getBusinessName())
                .email(user.getEmail())
                .emailVerified(true)
                .build();
    }
}

