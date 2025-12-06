package com.moredevs.mapblu.core.dto.response;

import com.moredevs.mapblu.core.domain.InsightCache;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO de resposta para insights gerados pela IA.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsightResponse {

    private UUID id;
    private InsightCache.TipoInsight tipo;
    private String insight;
    private BigDecimal confianca;
    private Integer relevancia;
    private Map<String, Object> dadosSuporte;
    private List<String> recomendacoes;
    private LocalDateTime dataGeracao;
    private String modeloIA;
    private boolean doCache;
}

