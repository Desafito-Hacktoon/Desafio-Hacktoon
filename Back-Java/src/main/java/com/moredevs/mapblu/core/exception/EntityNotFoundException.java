package com.moredevs.mapblu.core.exception;

/**
 * Exceção lançada quando uma entidade não é encontrada.
 */
public class EntityNotFoundException extends RuntimeException {

    public EntityNotFoundException(String message) {
        super(message);
    }

    public EntityNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}

