package com.moredevs.mapblu.shared.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.TreeMap;

/**
 * Utilitário para geração de hash de contexto para cache de insights.
 */
@Slf4j
public class HashUtil {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Gera hash SHA-256 de um contexto (Map).
     * Ordena as chaves para garantir consistência.
     */
    public static String gerarHashContexto(Map<String, Object> contexto) {
        try {
            // Ordena o mapa para garantir hash consistente
            Map<String, Object> contextoOrdenado = new TreeMap<>(contexto);
            
            // Serializa para JSON
            String json = objectMapper.writeValueAsString(contextoOrdenado);
            
            // Gera hash SHA-256
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(json.getBytes(StandardCharsets.UTF_8));
            
            // Converte para hexadecimal
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString();
            
        } catch (JsonProcessingException e) {
            log.error("Erro ao serializar contexto para hash: {}", e.getMessage());
            throw new RuntimeException("Erro ao gerar hash do contexto", e);
        } catch (NoSuchAlgorithmException e) {
            log.error("Algoritmo SHA-256 não disponível: {}", e.getMessage());
            throw new RuntimeException("Erro ao gerar hash do contexto", e);
        }
    }

    /**
     * Gera hash de uma string simples.
     */
    public static String gerarHash(String texto) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(texto.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString();
            
        } catch (NoSuchAlgorithmException e) {
            log.error("Algoritmo SHA-256 não disponível: {}", e.getMessage());
            throw new RuntimeException("Erro ao gerar hash", e);
        }
    }
}

