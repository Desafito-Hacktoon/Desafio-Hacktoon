package com.moredevs.mapblu.infraestructure.controller;

import com.moredevs.mapblu.core.dto.response.InsightResponse;
import com.moredevs.mapblu.core.service.InsightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Controller para endpoints de insights inteligentes gerados pela IA.
 */
@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Insights IA", description = "APIs para geração de insights inteligentes sobre ocorrências")
@CrossOrigin(origins = "*")
public class InsightController {

    private final InsightService insightService;

    /**
     * Gera insight sobre área crítica.
     */
    @GetMapping("/area-critica")
    @Operation(
        summary = "Insight de área crítica",
        description = "Gera insight explicando por que uma área/bairro é crítica"
    )
    public ResponseEntity<InsightResponse> insightAreaCritica(
        @Parameter(description = "Nome do bairro", required = true)
        @RequestParam String bairro,
        
        @Parameter(description = "Tipo de problema (opcional)")
        @RequestParam(required = false) String tipoProblema,
        
        @Parameter(description = "Data de início do período (formato: yyyy-MM-ddTHH:mm:ss)")
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime periodo,
        
        @Parameter(description = "Data de fim do período (formato: yyyy-MM-ddTHH:mm:ss)")
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime periodoFim
    ) {
        log.debug("Solicitando insight de área crítica para bairro: {}", bairro);
        
        LocalDateTime periodoInicio = periodo != null ? periodo : LocalDateTime.now().minusMonths(1);
        LocalDateTime fim = periodoFim != null ? periodoFim : LocalDateTime.now();
        
        InsightResponse insight = insightService.gerarInsightAreaCritica(
                bairro, tipoProblema, periodoInicio, fim);
        
        return ResponseEntity.ok(insight);
    }

    /**
     * Gera insight de tendência.
     */
    @GetMapping("/tendencia")
    @Operation(
        summary = "Insight de tendência",
        description = "Gera insight sobre tendências de crescimento/decrescimento de ocorrências"
    )
    public ResponseEntity<InsightResponse> insightTendencia(
        @Parameter(description = "Tipo de problema", required = true)
        @RequestParam String tipoProblema,
        
        @Parameter(description = "Data de início do período (formato: yyyy-MM-ddTHH:mm:ss)")
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime periodo,
        
        @Parameter(description = "Data de fim do período (formato: yyyy-MM-ddTHH:mm:ss)")
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime periodoFim,
        
        @Parameter(description = "Bairro (opcional)")
        @RequestParam(required = false) String bairro
    ) {
        log.debug("Solicitando insight de tendência para tipo: {}", tipoProblema);
        
        LocalDateTime periodoInicio = periodo != null ? periodo : LocalDateTime.now().minusMonths(1);
        LocalDateTime fim = periodoFim != null ? periodoFim : LocalDateTime.now();
        
        InsightResponse insight = insightService.gerarInsightTendencia(
                tipoProblema, periodoInicio, fim, bairro);
        
        return ResponseEntity.ok(insight);
    }

    /**
     * Gera insight de padrão.
     */
    @GetMapping("/padrao")
    @Operation(
        summary = "Insight de padrão",
        description = "Identifica padrões interessantes nos dados de ocorrências"
    )
    public ResponseEntity<InsightResponse> insightPadrao(
        @Parameter(description = "Filtros opcionais (JSON)")
        @RequestParam(required = false) Map<String, Object> filtros
    ) {
        log.debug("Solicitando insight de padrão");
        
        InsightResponse insight = insightService.gerarInsightPadrao(filtros);
        
        return ResponseEntity.ok(insight);
    }

    /**
     * Gera insight preditivo.
     */
    @GetMapping("/predicao")
    @Operation(
        summary = "Insight preditivo",
        description = "Preveja possíveis problemas futuros baseado em dados históricos"
    )
    public ResponseEntity<InsightResponse> insightPredicao(
        @Parameter(description = "Horizonte de predição em dias", required = true)
        @RequestParam Integer horizonte,
        
        @Parameter(description = "Área específica (opcional)")
        @RequestParam(required = false) String area
    ) {
        log.debug("Solicitando insight preditivo - horizonte: {} dias", horizonte);
        
        if (horizonte == null || horizonte <= 0 || horizonte > 365) {
            return ResponseEntity.badRequest().build();
        }
        
        InsightResponse insight = insightService.gerarInsightPredicao(horizonte, area);
        
        return ResponseEntity.ok(insight);
    }

    /**
     * Gera insight explicativo.
     */
    @GetMapping("/explicar")
    @Operation(
        summary = "Insight explicativo",
        description = "Explica por que um fenômeno está acontecendo"
    )
    public ResponseEntity<InsightResponse> insightExplicacao(
        @Parameter(description = "Contexto do fenômeno (JSON)")
        @RequestParam(required = false) Map<String, Object> contexto,
        
        @Parameter(description = "Pergunta específica (opcional)")
        @RequestParam(required = false) String pergunta
    ) {
        log.debug("Solicitando insight explicativo");
        
        InsightResponse insight = insightService.gerarInsightExplicacao(contexto, pergunta);
        
        return ResponseEntity.ok(insight);
    }

    /**
     * Responde pergunta livre sobre ocorrências.
     */
    @PostMapping("/pergunta")
    @Operation(
        summary = "Responder pergunta livre",
        description = "Responde perguntas livres sobre padrões de ocorrências"
    )
    public ResponseEntity<InsightResponse> responderPergunta(
        @Parameter(description = "Corpo da requisição com pergunta e contexto")
        @RequestBody Map<String, Object> requestBody
    ) {
        String pergunta = (String) requestBody.get("pergunta");
        @SuppressWarnings("unchecked")
        Map<String, Object> contexto = (Map<String, Object>) requestBody.get("contexto");
        
        if (pergunta == null || pergunta.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        
        log.debug("Respondendo pergunta livre: {}", pergunta);
        
        InsightResponse insight = insightService.responderPergunta(pergunta, contexto);
        
        return ResponseEntity.ok(insight);
    }
}

