package com.moredevs.mapblu.core.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO que representa uma GeoJSON FeatureCollection.
 * Usado para retornar dados geoespaciais no formato GeoJSON padrão.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoJsonFeatureCollection {
    
    @JsonProperty("type")
    @Builder.Default
    private String type = "FeatureCollection";
    
    @JsonProperty("features")
    private List<GeoJsonFeature> features;
}

