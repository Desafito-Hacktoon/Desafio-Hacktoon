package com.moredevs.mapblu.core.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO que representa a resposta completa do heatmap para Flutter.
 * Inclui zonas e resumo estatístico.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeatmapResponse {
    
    @JsonProperty("cityInfo")
    private CityInfo cityInfo;
    
    @JsonProperty("zones")
    private List<HeatmapZoneResponse> zones;
    
    @JsonProperty("summary")
    private Summary summary;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CityInfo {
        @JsonProperty("name")
        private String name;
        
        @JsonProperty("state")
        private String state;
        
        @JsonProperty("country")
        private String country;
        
        @JsonProperty("center")
        private Center center;
        
        @JsonProperty("zoom")
        private Integer zoom;
        
        @JsonProperty("population")
        private Integer population;
        
        @JsonProperty("area")
        private Double area;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Center {
        @JsonProperty("lat")
        private Double lat;
        
        @JsonProperty("lng")
        private Double lng;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        @JsonProperty("totalProblems")
        private Integer totalProblems;
        
        @JsonProperty("criticalZones")
        private Integer criticalZones;
        
        @JsonProperty("warningZones")
        private Integer warningZones;
        
        @JsonProperty("moderateZones")
        private Integer moderateZones;
        
        @JsonProperty("stableZones")
        private Integer stableZones;
        
        @JsonProperty("lastUpdated")
        private LocalDateTime lastUpdated;
        
        @JsonProperty("city")
        private String city;
        
        @JsonProperty("state")
        private String state;
    }
}

