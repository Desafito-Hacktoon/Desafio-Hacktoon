package com.moredevs.mapblu.infraestructure.controller;

import com.moredevs.mapblu.core.dto.response.DashboardStatsResponse;
import com.moredevs.mapblu.core.dto.response.OcorrenciaResponse;
import com.moredevs.mapblu.core.dto.response.PagedResponse;
import com.moredevs.mapblu.core.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller REST para operações de dashboard.
 */
@Tag(name = "Dashboard", description = "API para estatísticas e dados do dashboard")
@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Parse manual de LocalDateTime para evitar problemas com @DateTimeFormat
     */
    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isEmpty()) {
            return null;
        }
        try {
            return LocalDateTime.parse(dateTimeStr);
        } catch (Exception e) {
            log.error("Erro ao parsear data '{}': {}", dateTimeStr, e.getMessage());
            return null;
        }
    }

    @Operation(summary = "Obter estatísticas do dashboard", description = "Retorna estatísticas gerais para o dashboard com filtro de período opcional")
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<DashboardStatsResponse> obterEstatisticas(
            @Parameter(description = "Data de início do período (formato: yyyy-MM-ddTHH:mm:ss)")
            @RequestParam(required = false) String periodoInicio,
            @Parameter(description = "Data de fim do período (formato: yyyy-MM-ddTHH:mm:ss)")
            @RequestParam(required = false) String periodoFim
    ) {
        LocalDateTime inicio = parseDateTime(periodoInicio);
        LocalDateTime fim = parseDateTime(periodoFim);
        
        DashboardStatsResponse stats = dashboardService.obterEstatisticas(inicio, fim);
        
        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "Obter ocorrências do período", description = "Retorna ocorrências do período especificado paginadas")
    @GetMapping("/ocorrencias-mes")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<PagedResponse<OcorrenciaResponse>> obterOcorrenciasDoMes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Data de início do período (formato: yyyy-MM-ddTHH:mm:ss)")
            @RequestParam(required = false) String periodoInicio,
            @Parameter(description = "Data de fim do período (formato: yyyy-MM-ddTHH:mm:ss)")
            @RequestParam(required = false) String periodoFim
    ) {
        LocalDateTime inicio = parseDateTime(periodoInicio);
        LocalDateTime fim = parseDateTime(periodoFim);
        
        PagedResponse<OcorrenciaResponse> response = dashboardService.obterOcorrenciasDoMes(page, size, inicio, fim);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Debug: Verificar datas das ocorrências", description = "Retorna informações de debug sobre as datas das ocorrências no banco")
    @GetMapping("/debug/datas")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> debugDatas() {
        java.util.Map<String, Object> debug = new java.util.HashMap<>();
        
        // Buscar todas as ocorrências sem filtro
        PagedResponse<OcorrenciaResponse> todasOcorrencias = dashboardService.obterOcorrenciasDoMes(0, 1000, null, null);
        
        debug.put("totalOcorrencias", todasOcorrencias.getTotalElements());
        
        if (!todasOcorrencias.getContent().isEmpty()) {
            // Encontrar a data mais antiga e mais recente
            LocalDateTime maisAntiga = todasOcorrencias.getContent().stream()
                    .map(OcorrenciaResponse::getDataCriacao)
                    .min(LocalDateTime::compareTo)
                    .orElse(null);
            
            LocalDateTime maisRecente = todasOcorrencias.getContent().stream()
                    .map(OcorrenciaResponse::getDataCriacao)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);
            
            debug.put("dataMaisAntiga", maisAntiga != null ? maisAntiga.toString() : null);
            debug.put("dataMaisRecente", maisRecente != null ? maisRecente.toString() : null);
            debug.put("dataAtualServidor", LocalDateTime.now().toString());
            
            // Listar as 10 primeiras datas para referência
            List<String> primeiras10Datas = todasOcorrencias.getContent().stream()
                    .limit(10)
                    .map(oc -> oc.getId().toString().substring(0, 8) + "... -> " + oc.getDataCriacao())
                    .collect(java.util.stream.Collectors.toList());
            
            debug.put("primeiras10Ocorrencias", primeiras10Datas);
        }
        
        return ResponseEntity.ok(debug);
    }
}


