package com.moredevs.mapblu.core.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO que representa uma GeoJSON Geometry.
 * Suporta Point, Polygon, MultiPolygon e outras geometrias.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoJsonGeometry {
    
    @JsonProperty("type")
    private String type; // Point, Polygon, MultiPolygon, etc.
    
    @JsonProperty("coordinates")
    private Object coordinates;
    
    /**
     * Cria uma geometria Point.
     */
    public static GeoJsonGeometry createPoint(double longitude, double latitude) {
        return GeoJsonGeometry.builder()
                .type("Point")
                .coordinates(List.of(longitude, latitude))
                .build();
    }
    
    /**
     * Cria uma geometria Polygon.
     * GeoJSON Polygon coordinates: [[[lng, lat], [lng, lat], ...]]
     * Primeiro array: rings (exterior + holes)
     * Segundo array: pontos do ring
     * Terceiro array: [lng, lat]
     */
    public static GeoJsonGeometry createPolygon(List<List<List<Double>>> coordinates) {
        return GeoJsonGeometry.builder()
                .type("Polygon")
                .coordinates(coordinates)
                .build();
    }
    
    /**
     * Cria uma geometria Polygon a partir de um único ring (sem buracos).
     * Converte List<List<Double>> para List<List<List<Double>>>.
     */
    public static GeoJsonGeometry createPolygonFromRing(List<List<Double>> ring) {
        return GeoJsonGeometry.builder()
                .type("Polygon")
                .coordinates(List.of(ring))
                .build();
    }
}

