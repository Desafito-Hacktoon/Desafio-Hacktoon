package com.moredevs.mapblu.core.exception;

/**
 * Exceção lançada quando há erro de validação.
 */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }

    public ValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}

