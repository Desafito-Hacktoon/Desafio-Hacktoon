package com.moredevs.mapblu.core.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO que representa uma GeoJSON Feature.
 * Contém geometria e propriedades de uma feature geoespacial.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoJsonFeature {
    
    @JsonProperty("type")
    @Builder.Default
    private String type = "Feature";
    
    @JsonProperty("properties")
    private Map<String, Object> properties;
    
    @JsonProperty("geometry")
    private GeoJsonGeometry geometry;
}

