package com.moredevs.mapblu.core.dto.response;

import com.moredevs.mapblu.core.domain.RelatorioIA;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * DTO de resposta para relatórios gerados pela IA.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RelatorioResponse {

    private UUID id;
    private RelatorioIA.TipoRelatorio tipoRelatorio;
    private LocalDateTime periodoInicio;
    private LocalDateTime periodoFim;
    private String titulo;
    private String resumoExecutivo;
    private Map<String, Object> conteudoCompleto;
    private Map<String, Object> metricasCalculadas;
    private Map<String, Object> areasCriticas;
    private Map<String, Object> recomendacoes;
    private Map<String, Object> filtrosAplicados;
    private String modeloIAUsado;
    private RelatorioIA.StatusRelatorio status;
    private LocalDateTime dataGeracao;
    private LocalDateTime dataConclusao;
    private Integer tempoProcessamentoMs;
    private String usuarioSolicitante;
}

