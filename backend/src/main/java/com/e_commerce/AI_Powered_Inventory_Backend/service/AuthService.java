package com.e_commerce.AI_Powered_Inventory_Backend.service;

import com.e_commerce.AI_Powered_Inventory_Backend.dto.request.LoginRequest;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.request.SignupRequest;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.AuthResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.exception.ApiException;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.EmailVerificationToken;
import com.e_commerce.AI_Powered_Inventory_Backend.entity.User;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.EmailVerificationTokenRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.repository.UserRepository;
import com.e_commerce.AI_Powered_Inventory_Backend.security.JwtService;
import com.e_commerce.AI_Powered_Inventory_Backend.service.EmailService;
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

    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final EmailService emailService;

    @Transactional
    public AuthResponse signup(SignupRequest req) {

        String email = req.email()
                .toLowerCase()
                .trim();

        // Check whether email already exists
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists."
            );
        }

        // Create new user
        User user = User.builder()
                .businessName(req.businessName())
                .email(email)
                .passwordHash(
                        passwordEncoder.encode(req.password())
                )
                .role("OWNER")
                .emailVerified(false)
                .build();

        // Save user first so that it gets an ID
        user = userRepository.save(user);

        // Generate secure verification token
        String token = generateVerificationToken();

        // Create verification token entity
        EmailVerificationToken verificationToken =
                EmailVerificationToken.builder()
                        .token(token)
                        .user(user)
                        .expiresAt(
                                LocalDateTime.now()
                                        .plusHours(24)
                        )
                        .used(false)
                        .build();

        // Save verification token
        emailVerificationTokenRepository.save(
                verificationToken
        );

        // Send verification email using Resend
        emailService.sendVerificationEmail(
                user.getEmail(),
                user.getBusinessName(),
                token
        );

        /*
         * We DO NOT generate a JWT here.
         *
         * User must verify their email first.
         */

        return AuthResponse.builder()
                .token(null)
                .userId(user.getId())
                .businessName(user.getBusinessName())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public void verifyEmail(String token) {

        EmailVerificationToken verificationToken =
                emailVerificationTokenRepository
                        .findByToken(token)
                        .orElseThrow(() ->
                                new ApiException(
                                        HttpStatus.BAD_REQUEST,
                                        "Invalid verification token."
                                )
                        );

        // Check if token was already used
        if (verificationToken.isUsed()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "This verification link has already been used."
            );
        }

        // Check token expiry
        if (verificationToken.getExpiresAt()
                .isBefore(LocalDateTime.now())) {

            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "This verification link has expired."
            );
        }

        User user = verificationToken.getUser();

        // Mark email as verified
        user.setEmailVerified(true);

        // Mark token as used
        verificationToken.setUsed(true);

        // Save changes
        userRepository.save(user);
        emailVerificationTokenRepository.save(
                verificationToken
        );
    }

    public AuthResponse login(LoginRequest req) {

        String email = req.email()
                .toLowerCase()
                .trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ApiException(
                                HttpStatus.UNAUTHORIZED,
                                "Invalid email or password."
                        )
                );

        // Check password
        if (!passwordEncoder.matches(
                req.password(),
                user.getPasswordHash()
        )) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password."
            );
        }

        // Check email verification
        if (!user.isEmailVerified()) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Please verify your email before logging in."
            );
        }

        // Generate JWT only after email verification
        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail()
        );

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .businessName(user.getBusinessName())
                .email(user.getEmail())
                .build();
    }


    /**
     * Generates a cryptographically secure verification token.
     */
    private String generateVerificationToken() {

        byte[] randomBytes = new byte[32];

        SecureRandom secureRandom =
                new SecureRandom();

        secureRandom.nextBytes(randomBytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
    }
}