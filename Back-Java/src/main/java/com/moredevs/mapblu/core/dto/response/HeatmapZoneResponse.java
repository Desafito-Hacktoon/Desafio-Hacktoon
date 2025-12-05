package com.moredevs.mapblu.core.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO que representa uma zona do heatmap para o frontend Flutter.
 * Contém polígonos com informações de severidade e problemas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeatmapZoneResponse {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("type")
    private String type;
    
    @JsonProperty("severity")
    private String severity; // critical, warning, moderate, low
    
    @JsonProperty("color")
    private String color; // Hex color (#FF0000, #FFA500, etc.)
    
    @JsonProperty("problemCount")
    private Integer problemCount;
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("responsavel")
    private String responsavel;
    
    @JsonProperty("responsibleEntityId")
    private String responsibleEntityId;
    
    @JsonProperty("lastUpdate")
    private LocalDateTime lastUpdate;
    
    @JsonProperty("recentProblems")
    private List<String> recentProblems;
    
    @JsonProperty("coordinates")
    private List<Coordinate> coordinates;
    
    /**
     * Classe interna para coordenadas.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Coordinate {
        @JsonProperty("lat")
        private Double lat;
        
        @JsonProperty("lng")
        private Double lng;
    }
}

