package com.moredevs.mapblu.core.dto.request;

import com.moredevs.mapblu.core.domain.TipoProblema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para filtros do heatmap.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeatmapFilterRequest {
    
    private TipoProblema tipoProblema;
    
    private String bairro;
    
    private Double minLat;
    
    private Double maxLat;
    
    private Double minLng;
    
    private Double maxLng;
    
    private Integer gridSize; // padrão: 500m
    
    private Integer minZoom;
    
    private Integer maxZoom;
    
    private LocalDateTime dataInicio;
    
    private LocalDateTime dataFim;
}

