package com.e_commerce.AI_Powered_Inventory_Backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank(message = "Business name is required") String businessName,
        @NotBlank @Email(message = "A valid email is required") String email,
        @NotBlank @Size(min = 12, max = 72, message = "Password must be between 12 and 72 characters") String password
) {}
