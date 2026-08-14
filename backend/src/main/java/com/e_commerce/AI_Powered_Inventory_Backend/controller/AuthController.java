package com.e_commerce.AI_Powered_Inventory_Backend.controller;

import com.e_commerce.AI_Powered_Inventory_Backend.dto.request.LoginRequest;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.request.SignupRequest;
import com.e_commerce.AI_Powered_Inventory_Backend.dto.response.AuthResponse;
import com.e_commerce.AI_Powered_Inventory_Backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Sign-up and login for business accounts")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    @Operation(summary = "Create a business account", description = "Registers a new business user and seeds demo inventory/sales data so the dashboard is populated immediately.")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(request));
    }

    @GetMapping("/verify")
    @Operation(summary = "Verify an email address",
            description = "Activates the account associated with an emailed verification token.")
    public ResponseEntity<Map<String, String>> verify(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Your email has been verified."));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Re-send the verification email",
            description = "Issues a fresh token and re-sends the verification email. No-op if already verified.")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestParam String email) {
        authService.resendVerification(email);
        return ResponseEntity.ok(Map.of("message", "If that account needs verifying, a new link is on its way."));
    }

    @PostMapping("/login")
    @Operation(summary = "Log in", description = "Authenticates a business user and returns a JWT bearer token.")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
