package com.moredevs.mapblu.core.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO com métricas agregadas de ocorrências para análise pela IA.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricasAgregadasResponse {

    private Long totalOcorrencias;
    private Long totalOcorrenciasPeriodoAnterior;
    private Double variacaoPercentual;
    private Double gravidadeMedia;
    private Integer gravidadeMaxima;
    private Integer gravidadeMinima;
    
    /**
     * Lista de top bairros críticos.
     * Cada item contém: bairro, total, gravidadeMedia, gravidadeMaxima
     */
    private List<Map<String, Object>> topBairrosCriticos;
    
    /**
     * Distribuição por tipo de problema.
     * Cada item contém: tipoProblema, total, percentual
     */
    private List<Map<String, Object>> distribuicaoPorTipo;
    
    /**
     * Distribuição por bairro.
     * Cada item contém: bairro, total, percentual
     */
    private List<Map<String, Object>> distribuicaoPorBairro;
    
    /**
     * Distribuição de gravidade (histograma).
     * Chave: nível de gravidade (1-10), Valor: quantidade
     */
    private Map<Integer, Long> distribuicaoGravidade;
    
    /**
     * Padrões temporais.
     * Contém: distribuicaoPorDiaSemana, distribuicaoPorHora
     */
    private Map<String, Object> padroesTemporais;
    
    /**
     * Correlações entre variáveis.
     * Ex: tipo de problema mais comum por bairro
     */
    private Map<String, Object> correlacoes;
    
    /**
     * Áreas críticas identificadas (clusters espaciais).
     */
    private List<Map<String, Object>> areasCriticas;
}

