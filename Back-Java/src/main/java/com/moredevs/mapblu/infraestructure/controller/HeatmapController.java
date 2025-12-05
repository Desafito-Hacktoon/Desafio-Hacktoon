package com.moredevs.mapblu.infraestructure.controller;

import com.moredevs.mapblu.core.domain.TipoProblema;
import com.moredevs.mapblu.core.dto.request.HeatmapFilterRequest;
import com.moredevs.mapblu.core.dto.response.GeoJsonFeatureCollection;
import com.moredevs.mapblu.core.dto.response.HeatmapResponse;
import com.moredevs.mapblu.core.service.HeatmapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * Controller para endpoints de heatmap.
 * Fornece dados geoespaciais para visualização em mapas.
 */
@RestController
@RequestMapping("/api/heatmap")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Heatmap", description = "APIs para geração de dados de heatmap")
@CrossOrigin(origins = "*")
public class HeatmapController {

    private final HeatmapService heatmapService;

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

    /**
     * Gera zonas do heatmap (polígonos) para o frontend Flutter.
     * Retorna polígonos com informações de severidade e problemas.
     * 
     * @param tipoProblema filtro por tipo de problema (opcional)
     * @param bairro filtro por bairro (opcional)
     * @param minLat latitude mínima da bounding box (opcional)
     * @param maxLat latitude máxima da bounding box (opcional)
     * @param minLng longitude mínima da bounding box (opcional)
     * @param maxLng longitude máxima da bounding box (opcional)
     * @param gridSize tamanho do grid em metros (padrão: 500m)
     * @param periodoInicio data de início do período (formato: yyyy-MM-ddTHH:mm:ss)
     * @param periodoFim data de fim do período (formato: yyyy-MM-ddTHH:mm:ss)
     * @return resposta com zonas do heatmap
     */
    @GetMapping
    @Operation(
        summary = "Obter zonas do heatmap",
        description = "Retorna polígonos agrupados por grid com informações de severidade. " +
                     "Usado pelo frontend Flutter para renderização de zonas coloridas no mapa. " +
                     "Suporta filtro de período de datas."
    )
    public ResponseEntity<HeatmapResponse> getHeatmapZones(
        @Parameter(description = "Tipo de problema para filtrar")
        @RequestParam(required = false) TipoProblema tipoProblema,
        
        @Parameter(description = "Bairro para filtrar")
        @RequestParam(required = false) String bairro,
        
        @Parameter(description = "Latitude mínima da bounding box")
        @RequestParam(required = false) Double minLat,
        
        @Parameter(description = "Latitude máxima da bounding box")
        @RequestParam(required = false) Double maxLat,
        
        @Parameter(description = "Longitude mínima da bounding box")
        @RequestParam(required = false) Double minLng,
        
        @Parameter(description = "Longitude máxima da bounding box")
        @RequestParam(required = false) Double maxLng,
        
        @Parameter(description = "Tamanho do grid em metros (padrão: 500)")
        @RequestParam(required = false, defaultValue = "500") Integer gridSize,
        
        @Parameter(description = "Data de início do período (formato: yyyy-MM-ddTHH:mm:ss)")
        @RequestParam(required = false) String periodoInicio,
        
        @Parameter(description = "Data de fim do período (formato: yyyy-MM-ddTHH:mm:ss)")
        @RequestParam(required = false) String periodoFim
    ) {
        log.debug("Requisição de zonas do heatmap - tipoProblema: {}, bairro: {}, gridSize: {}, periodoInicio: {}, periodoFim: {}", 
            tipoProblema, bairro, gridSize, periodoInicio, periodoFim);

        LocalDateTime dataInicio = parseDateTime(periodoInicio);
        LocalDateTime dataFim = parseDateTime(periodoFim);

        HeatmapFilterRequest filter = HeatmapFilterRequest.builder()
            .tipoProblema(tipoProblema)
            .bairro(bairro)
            .minLat(minLat)
            .maxLat(maxLat)
            .minLng(minLng)
            .maxLng(maxLng)
            .gridSize(gridSize)
            .dataInicio(dataInicio)
            .dataFim(dataFim)
            .build();

        HeatmapResponse response = heatmapService.generateHeatmapZones(filter);
        return ResponseEntity.ok(response);
    }

    /**
     * Gera heatmap em formato hexágonos (pontos) para o frontend Angular.
     * Retorna GeoJSON FeatureCollection com pontos hexagonais.
     * 
     * @param tipoProblema filtro por tipo de problema (opcional)
     * @param bairro filtro por bairro (opcional)
     * @param minLat latitude mínima da bounding box (opcional)
     * @param maxLat latitude máxima da bounding box (opcional)
     * @param minLng longitude mínima da bounding box (opcional)
     * @param maxLng longitude máxima da bounding box (opcional)
     * @param periodoInicio data de início do período (formato: yyyy-MM-ddTHH:mm:ss)
     * @param periodoFim data de fim do período (formato: yyyy-MM-ddTHH:mm:ss)
     * @return GeoJSON FeatureCollection com hexágonos
     */
    @GetMapping("/hexagons")
    @Operation(
        summary = "Obter hexágonos do heatmap",
        description = "Retorna pontos hexagonais agrupados com contagem de ocorrências. " +
                     "Usado pelo frontend Angular para renderização de hexágonos no mapa Leaflet. " +
                     "Suporta filtro de período de datas."
    )
    public ResponseEntity<GeoJsonFeatureCollection> getHexagonHeatmap(
        @Parameter(description = "Tipo de problema para filtrar")
        @RequestParam(required = false) TipoProblema tipoProblema,
        
        @Parameter(description = "Bairro para filtrar")
        @RequestParam(required = false) String bairro,
        
        @Parameter(description = "Latitude mínima da bounding box")
        @RequestParam(required = false) Double minLat,
        
        @Parameter(description = "Latitude máxima da bounding box")
        @RequestParam(required = false) Double maxLat,
        
        @Parameter(description = "Longitude mínima da bounding box")
        @RequestParam(required = false) Double minLng,
        
        @Parameter(description = "Longitude máxima da bounding box")
        @RequestParam(required = false) Double maxLng,
        
        @Parameter(description = "Data de início do período (formato: yyyy-MM-ddTHH:mm:ss)")
        @RequestParam(required = false) String periodoInicio,
        
        @Parameter(description = "Data de fim do período (formato: yyyy-MM-ddTHH:mm:ss)")
        @RequestParam(required = false) String periodoFim
    ) {
        log.debug("Requisição de hexágonos do heatmap - tipoProblema: {}, bairro: {}, periodoInicio: {}, periodoFim: {}", 
            tipoProblema, bairro, periodoInicio, periodoFim);

        LocalDateTime dataInicio = parseDateTime(periodoInicio);
        LocalDateTime dataFim = parseDateTime(periodoFim);

        HeatmapFilterRequest filter = HeatmapFilterRequest.builder()
            .tipoProblema(tipoProblema)
            .bairro(bairro)
            .minLat(minLat)
            .maxLat(maxLat)
            .minLng(minLng)
            .maxLng(maxLng)
            .dataInicio(dataInicio)
            .dataFim(dataFim)
            .build();

        GeoJsonFeatureCollection response = heatmapService.generateHexagonHeatmap(filter);
        return ResponseEntity.ok(response);
    }
}

