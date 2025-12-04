package com.moredevs.mapblu.core.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO para resposta de estatísticas do dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {

    private Long totalOcorrencias;
    private Long ocorrenciasCriticas;
    private Long ocorrenciasEmAndamento;
    private Long ocorrenciasPendentes;
    private Long ocorrenciasResolvidas;
    
    private Map<String, Long> ocorrenciasPorTipo;
    private Map<String, Long> ocorrenciasPorBairro;
    private Map<String, Long> ocorrenciasPorStatus;
    
    private Double gravidadeMedia;
    private Long ocorrenciasDoMes;
    
    private LocalDateTime periodoInicio;
    private LocalDateTime periodoFim;
}


