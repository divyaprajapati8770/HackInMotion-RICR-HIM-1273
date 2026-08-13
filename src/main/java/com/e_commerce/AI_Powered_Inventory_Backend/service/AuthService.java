package com.hackinmotion.inventory.service;

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

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        User user = User.builder()
                .businessName(req.businessName())
                .email(req.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role("OWNER")
                .build();

        user = userRepository.save(user);

        // Seed demo data so the dashboard is never empty on first login.


        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .businessName(user.getBusinessName())
                .email(user.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email().toLowerCase().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .businessName(user.getBusinessName())
                .email(user.getEmail())
                .build();
    }
}
