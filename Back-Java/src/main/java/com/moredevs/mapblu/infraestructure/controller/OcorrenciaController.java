package com.moredevs.mapblu.infraestructure.controller;

import com.moredevs.mapblu.core.domain.StatusOcorrencia;
import com.moredevs.mapblu.core.domain.TipoProblema;
import com.moredevs.mapblu.core.dto.request.OcorrenciaFilterRequest;
import com.moredevs.mapblu.core.dto.request.OcorrenciaRequest;
import com.moredevs.mapblu.core.dto.response.OcorrenciaResponse;
import com.moredevs.mapblu.core.dto.response.PagedResponse;
import com.moredevs.mapblu.core.service.OcorrenciaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

import static com.moredevs.mapblu.shared.constant.Constants.Pagination;


/**
 * Controller REST para operações de ocorrências.
 */
@Tag(name = "Ocorrências", description = "API para gerenciamento de ocorrências municipais")
@Slf4j
@RestController
@RequestMapping("/api/ocorrencias")
@RequiredArgsConstructor
public class OcorrenciaController {

    private final OcorrenciaService service;

    @Operation(summary = "Criar ocorrência", description = "Cria uma nova ocorrência municipal")
    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<OcorrenciaResponse> criar(@Valid @RequestBody OcorrenciaRequest request) {
        OcorrenciaResponse response = service.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Buscar ocorrência por ID", description = "Retorna uma ocorrência específica pelo ID")
    @GetMapping("/{id}")
    public ResponseEntity<OcorrenciaResponse> buscarPorId(@Parameter(description = "ID da ocorrência") @PathVariable UUID id) {
        OcorrenciaResponse response = service.buscarPorId(id);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Listar ocorrências", description = "Lista ocorrências com filtros e paginação")
    @GetMapping
    public ResponseEntity<PagedResponse<OcorrenciaResponse>> listar(
            @RequestParam(required = false) TipoProblema tipoProblema,
            @RequestParam(required = false) String bairro,
            @RequestParam(required = false) StatusOcorrencia status,
            @RequestParam(required = false) Integer gravidadeMin,
            @RequestParam(required = false) Integer gravidadeMax,
            @Parameter(description = "Data de início do período (formato: yyyy-MM-ddTHH:mm:ss)")
            @RequestParam(required = false) String dataInicio,
            @Parameter(description = "Data de fim do período (formato: yyyy-MM-ddTHH:mm:ss)")
            @RequestParam(required = false) String dataFim,
            @RequestParam(defaultValue = "" + Pagination.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = "" + Pagination.DEFAULT_SIZE) int size,
            @RequestParam(defaultValue = Pagination.DEFAULT_SORT) String sortBy,
            @RequestParam(defaultValue = Pagination.DEFAULT_DIRECTION) String sortDir
    ) {
        // Parse manual das datas para garantir formato correto
        LocalDateTime dataInicioParsed = null;
        LocalDateTime dataFimParsed = null;
        
        if (dataInicio != null && !dataInicio.isEmpty()) {
            try {
                dataInicioParsed = LocalDateTime.parse(dataInicio);
            } catch (Exception e) {
                log.error("Erro ao parsear dataInicio '{}': {}", dataInicio, e.getMessage());
            }
        }
        
        if (dataFim != null && !dataFim.isEmpty()) {
            try {
                dataFimParsed = LocalDateTime.parse(dataFim);
            } catch (Exception e) {
                log.error("Erro ao parsear dataFim '{}': {}", dataFim, e.getMessage());
            }
        }
        
        OcorrenciaFilterRequest filtros = OcorrenciaFilterRequest.builder()
                .tipoProblema(tipoProblema)
                .bairro(bairro)
                .status(status)
                .gravidadeMin(gravidadeMin)
                .gravidadeMax(gravidadeMax)
                .dataInicio(dataInicioParsed)
                .dataFim(dataFimParsed)
                .build();

        Sort sort = sortDir.equalsIgnoreCase("ASC") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PagedResponse<OcorrenciaResponse> response = service.listar(filtros, pageable);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Buscar ocorrências próximas", description = "Busca ocorrências dentro de um raio de uma localização")
    @GetMapping("/proximas")
    public ResponseEntity<PagedResponse<OcorrenciaResponse>> buscarProximas(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) Double raioMetros,
            @RequestParam(required = false) TipoProblema tipoProblema,
            @RequestParam(defaultValue = "" + Pagination.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = "" + Pagination.DEFAULT_SIZE) int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        
        PagedResponse<OcorrenciaResponse> response = service.buscarProximas(
                latitude, longitude, raioMetros, tipoProblema, pageable
        );
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Buscar ocorrências críticas", description = "Retorna ocorrências com gravidade >= 8")
    @GetMapping("/criticas")
    public ResponseEntity<PagedResponse<OcorrenciaResponse>> buscarCriticas(
            @RequestParam(defaultValue = "" + Pagination.DEFAULT_PAGE) int page,
            @RequestParam(defaultValue = "" + Pagination.DEFAULT_SIZE) int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PagedResponse<OcorrenciaResponse> response = service.buscarCriticas(pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Atualizar ocorrência", description = "Atualiza uma ocorrência existente")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<OcorrenciaResponse> atualizar(
            @Parameter(description = "ID da ocorrência") @PathVariable UUID id,
            @Valid @RequestBody OcorrenciaRequest request
    ) {
        OcorrenciaResponse response = service.atualizar(id, request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Atualizar status", description = "Atualiza apenas o status de uma ocorrência")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<OcorrenciaResponse> atualizarStatus(
            @Parameter(description = "ID da ocorrência") @PathVariable UUID id,
            @RequestParam StatusOcorrencia status
    ) {
        OcorrenciaResponse response = service.atualizarStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Remover ocorrência", description = "Remove uma ocorrência do sistema")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> remover(
            @Parameter(description = "ID da ocorrência") @PathVariable UUID id
    ) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }
}
