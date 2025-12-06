package com.moredevs.mapblu.ingestion.ia.exception;

/**
 * Exceção lançada quando há erro na classificação de gravidade via IA.
 */
public class IAClassificationException extends RuntimeException {
    
    public IAClassificationException(String message) {
        super(message);
    }
    
    public IAClassificationException(String message, Throwable cause) {
        super(message, cause);
    }
}


