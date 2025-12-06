package com.moredevs.mapblu.infraestructure.controller;

import com.moredevs.mapblu.core.domain.RelatorioIA;
import com.moredevs.mapblu.core.dto.request.RelatorioRequest;
import com.moredevs.mapblu.core.dto.response.PagedResponse;
import com.moredevs.mapblu.core.dto.response.RelatorioResponse;
import com.moredevs.mapblu.core.service.RelatorioIAService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Controller para endpoints de relatórios gerados pela IA.
 */
@RestController
@RequestMapping("/api/relatorios-ia")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Relatórios IA", description = "APIs para geração e consulta de relatórios gerados por IA")
@CrossOrigin(origins = "*")
public class RelatorioIAController {

    private final RelatorioIAService relatorioIAService;

    /**
     * Lista relatórios com filtros e paginação.
     */
    @GetMapping
    @Operation(
        summary = "Listar relatórios",
        description = "Retorna lista paginada de relatórios gerados pela IA com filtros opcionais"
    )
    public ResponseEntity<PagedResponse<RelatorioResponse>> listarRelatorios(
        @Parameter(description = "Tipo de relatório")
        @RequestParam(required = false) RelatorioIA.TipoRelatorio tipoRelatorio,
        
        @Parameter(description = "Status do relatório")
        @RequestParam(required = false) RelatorioIA.StatusRelatorio status,
        
        @Parameter(description = "Data de início do período (formato: yyyy-MM-ddTHH:mm:ss)")
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
        
        @Parameter(description = "Data de fim do período (formato: yyyy-MM-ddTHH:mm:ss)")
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim,
        
        @Parameter(description = "Número da página (0-indexed)")
        @RequestParam(defaultValue = "0") int page,
        
        @Parameter(description = "Tamanho da página")
        @RequestParam(defaultValue = "20") int size
    ) {
        log.debug("Listando relatórios - tipo: {}, status: {}, página: {}, tamanho: {}",
                tipoRelatorio, status, page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<RelatorioResponse> relatorios = relatorioIAService.buscarRelatorios(
                tipoRelatorio, status, dataInicio, dataFim, pageable);

        PagedResponse<RelatorioResponse> response = PagedResponse.<RelatorioResponse>builder()
                .content(relatorios.getContent())
                .page(relatorios.getNumber())
                .size(relatorios.getSize())
                .totalElements(relatorios.getTotalElements())
                .totalPages(relatorios.getTotalPages())
                .first(relatorios.isFirst())
                .last(relatorios.isLast())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Busca relatório por ID.
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Obter relatório por ID",
        description = "Retorna um relatório específico pelo seu ID"
    )
    public ResponseEntity<RelatorioResponse> obterRelatorio(
        @Parameter(description = "ID do relatório")
        @PathVariable UUID id
    ) {
        log.debug("Buscando relatório: {}", id);
        RelatorioResponse relatorio = relatorioIAService.buscarPorId(id);
        return ResponseEntity.ok(relatorio);
    }

    /**
     * Gera relatório customizado (on-demand).
     */
    @PostMapping("/gerar")
    @Operation(
        summary = "Gerar relatório customizado",
        description = "Gera um relatório customizado para o período especificado"
    )
    public ResponseEntity<RelatorioResponse> gerarRelatorio(
        @Valid @RequestBody RelatorioRequest request
    ) {
        log.info("Solicitando geração de relatório customizado - tipo: {}, período: {} até {}",
                request.getTipoRelatorio(), request.getPeriodoInicio(), request.getPeriodoFim());

        if (!request.isPeriodoValido()) {
            return ResponseEntity.badRequest().build();
        }

        if (!request.isPeriodoDentroDoLimite()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        RelatorioResponse relatorio = relatorioIAService.gerarRelatorio(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(relatorio);
    }

    /**
     * Busca último relatório de um tipo específico.
     */
    @GetMapping("/ultimo/{tipo}")
    @Operation(
        summary = "Obter último relatório por tipo",
        description = "Retorna o último relatório concluído de um tipo específico"
    )
    public ResponseEntity<RelatorioResponse> obterUltimoRelatorio(
        @Parameter(description = "Tipo de relatório")
        @PathVariable RelatorioIA.TipoRelatorio tipo
    ) {
        log.debug("Buscando último relatório do tipo: {}", tipo);
        RelatorioResponse relatorio = relatorioIAService.buscarUltimoPorTipo(tipo);
        
        if (relatorio == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(relatorio);
    }
}

