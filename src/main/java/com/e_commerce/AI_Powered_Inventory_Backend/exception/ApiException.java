package com.e_commerce.AI_Powered_Inventory_Backend.exception;

import org.springframework.http.HttpStatus;

/** Generic application exception carrying the HTTP status it should map to. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
