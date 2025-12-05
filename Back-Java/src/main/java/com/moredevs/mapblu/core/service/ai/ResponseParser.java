package com.moredevs.mapblu.core.service.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Serviço responsável por parsear e validar respostas da IA.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ResponseParser {

    private final ObjectMapper objectMapper;

    /**
     * Parseia a resposta da IA e extrai o JSON estruturado.
     */
    public Map<String, Object> parsearRespostaRelatorio(String respostaIA) {
        try {
            String jsonStr = extrairJSON(respostaIA);
            
            JsonNode jsonNode = objectMapper.readTree(jsonStr);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> resultado = objectMapper.convertValue(jsonNode, Map.class);
            
            validarEstruturaBasica(resultado);
            
            return resultado;
            
        } catch (JsonProcessingException e) {
            log.error("Erro ao parsear resposta da IA: {}", e.getMessage());
            throw new IllegalArgumentException("Resposta da IA não é um JSON válido: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Erro inesperado ao parsear resposta: {}", e.getMessage());
            throw new RuntimeException("Erro ao processar resposta da IA", e);
        }
    }

    /**
     * Extrai JSON de uma string que pode conter markdown ou texto adicional.
     */
    private String extrairJSON(String resposta) {
        String limpa = resposta.trim();
        
        if (limpa.startsWith("```json")) {
            limpa = limpa.substring(7);
        } else if (limpa.startsWith("```")) {
            limpa = limpa.substring(3);
        }
        
        if (limpa.endsWith("```")) {
            limpa = limpa.substring(0, limpa.length() - 3);
        }
        
        limpa = limpa.trim();
        
        int primeiroBrace = limpa.indexOf('{');
        int ultimoBrace = limpa.lastIndexOf('}');
        
        if (primeiroBrace >= 0 && ultimoBrace > primeiroBrace) {
            return limpa.substring(primeiroBrace, ultimoBrace + 1);
        }
        
        return limpa;
    }

    /**
     * Valida estrutura básica do JSON parseado.
     */
    private void validarEstruturaBasica(Map<String, Object> resultado) {
        if (!resultado.containsKey("resumoExecutivo")) {
            log.warn("Resposta da IA não contém 'resumoExecutivo'");
        }
        
        if (!resultado.containsKey("recomendacoes")) {
            log.warn("Resposta da IA não contém 'recomendacoes'");
        }
        
        // Garante que arrays existam mesmo se vazios
        if (!resultado.containsKey("principaisAchados")) {
            resultado.put("principaisAchados", new ArrayList<>());
        }
        if (!resultado.containsKey("areasCriticas")) {
            resultado.put("areasCriticas", new ArrayList<>());
        }
        if (!resultado.containsKey("recomendacoes")) {
            resultado.put("recomendacoes", new ArrayList<>());
        }
        if (!resultado.containsKey("insights")) {
            resultado.put("insights", new ArrayList<>());
        }
    }

    /**
     * Sanitiza texto removendo caracteres problemáticos.
     */
    public String sanitizarTexto(String texto) {
        if (texto == null) {
            return "";
        }
        
        return texto.replaceAll("[\\x00-\\x1F\\x7F]", "")
                .replaceAll("\\r\\n", "\n")
                .replaceAll("\\r", "\n")
                .trim();
    }

    /**
     * Trunca texto se exceder limite.
     */
    public String truncarTexto(String texto, int limite) {
        if (texto == null) {
            return "";
        }
        if (texto.length() <= limite) {
            return texto;
        }
        return texto.substring(0, limite - 3) + "...";
    }
}

