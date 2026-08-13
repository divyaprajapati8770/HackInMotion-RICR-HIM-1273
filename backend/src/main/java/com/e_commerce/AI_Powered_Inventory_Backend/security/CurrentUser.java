package com.e_commerce.AI_Powered_Inventory_Backend.security;

import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {

    private CurrentUser() {}

    public static AuthenticatedUser get() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof AuthenticatedUser au) {
            return au;
        }
        throw new IllegalStateException("No authenticated user in security context");
    }

    public static Long id() {
        return get().id();
    }
}
