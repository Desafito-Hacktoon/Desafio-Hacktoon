package com.moredevs.mapblu.infraestructure.integration;

import com.moredevs.mapblu.ingestion.ia.OpenRouterClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Serviço wrapper para chamadas mais complexas ao OpenRouter.
 * Usa o OpenRouterClient existente mas com métodos adicionais para relatórios.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpenRouterAIService {

    private final OpenRouterClient openRouterClient;

    @Value("${openrouter.api.model}")
    private String modeloPadrao;

    @Value("${openrouter.api.max-tokens:4000}")
    private int maxTokens;

    @Value("${openrouter.api.temperature:0.7}")
    private double temperature;

    /**
     * Chama a IA com prompt de sistema e usuário separados.
     */
    public String chamarIA(String promptSistema, String promptUsuario) {
        if (!openRouterClient.isConfigurado()) {
            throw new IllegalStateException("OpenRouter API não está configurada");
        }
        
        try {
            // Usa o método genérico do OpenRouterClient que aceita system/user separados
            return openRouterClient.chamarAPIGenerico(promptSistema, promptUsuario, maxTokens, temperature);
        } catch (Exception e) {
            log.error("Erro ao chamar IA: {}", e.getMessage());
            throw new RuntimeException("Erro ao chamar IA: " + e.getMessage(), e);
        }
    }

    /**
     * Retorna o modelo usado.
     */
    public String getModeloUsado() {
        return modeloPadrao;
    }

    /**
     * Verifica se a IA está disponível.
     */
    public boolean isDisponivel() {
        return openRouterClient.isConfigurado();
    }
}

