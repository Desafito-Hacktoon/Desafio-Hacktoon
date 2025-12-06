package com.moredevs.mapblu.core.dto.request;

import com.moredevs.mapblu.core.domain.InsightCache;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO para solicitação de insight.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsightRequest {

    private InsightCache.TipoInsight tipoInsight;
    private String bairro;
    private String tipoProblema;
    private LocalDateTime periodoInicio;
    private LocalDateTime periodoFim;
    private Integer horizonte; // Para predições (dias)
    private String pergunta; // Para perguntas livres
    private Map<String, Object> contexto;
    private Map<String, Object> filtros;
}

