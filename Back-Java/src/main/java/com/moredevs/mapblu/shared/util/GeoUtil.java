package com.moredevs.mapblu.shared.util;

import com.moredevs.mapblu.core.exception.ValidationException;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

import static com.moredevs.mapblu.shared.constant.Constants.Geo;

/**
 * Utilitário para operações geoespaciais.
 * Facilita a criação e manipulação de pontos geográficos.
 */
public class GeoUtil {

    private static final GeometryFactory geometryFactory = new GeometryFactory(
        new PrecisionModel(PrecisionModel.FLOATING), 
        Geo.SRID_WGS84
    );

    /**
     * Cria um ponto geográfico a partir de latitude e longitude.
     * 
     * @param latitude latitude em graus decimais (ex: -26.9194)
     * @param longitude longitude em graus decimais (ex: -49.0661)
     * @return Point com SRID 4326 (WGS84)
     * @throws IllegalArgumentException se coordenadas forem inválidas
     */
    public static Point createPoint(double latitude, double longitude) {
        validateCoordinates(latitude, longitude);
        return geometryFactory.createPoint(new Coordinate(longitude, latitude));
    }

    /**
     * Valida se as coordenadas estão dentro dos limites válidos.
     * 
     * @param latitude latitude (-90 a 90)
     * @param longitude longitude (-180 a 180)
     * @throws IllegalArgumentException se coordenadas forem inválidas
     */
    public static void validateCoordinates(double latitude, double longitude) {
        if (latitude < -90 || latitude > 90) {
            throw new ValidationException(
                String.format("Latitude inválida: %.6f. Deve estar entre -90 e 90", latitude)
            );
        }
        if (longitude < -180 || longitude > 180) {
            throw new ValidationException(
                String.format("Longitude inválida: %.6f. Deve estar entre -180 e 180", longitude)
            );
        }
    }

    /**
     * Extrai a latitude de um Point.
     * 
     * @param point ponto geográfico
     * @return latitude em graus decimais
     */
    public static double getLatitude(Point point) {
        if (point == null || point.isEmpty()) {
            throw new IllegalArgumentException("Point não pode ser null ou vazio");
        }
        return point.getY();
    }

    /**
     * Extrai a longitude de um Point.
     * 
     * @param point ponto geográfico
     * @return longitude em graus decimais
     */
    public static double getLongitude(Point point) {
        if (point == null || point.isEmpty()) {
            throw new IllegalArgumentException("Point não pode ser null ou vazio");
        }
        return point.getX();
    }

    /**
     * Calcula a distância aproximada entre dois pontos em metros.
     * Usa a fórmula de Haversine para cálculo de distância em esfera.
     * 
     * @param lat1 latitude do primeiro ponto
     * @param lon1 longitude do primeiro ponto
     * @param lat2 latitude do segundo ponto
     * @param lon2 longitude do segundo ponto
     * @return distância em metros
     */
    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double lat1Rad = Math.toRadians(lat1);
        double lat2Rad = Math.toRadians(lat2);
        double deltaLat = Math.toRadians(lat2 - lat1);
        double deltaLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                   Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                   Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return Geo.EARTH_RADIUS_METERS * c;
    }

    /**
     * Verifica se um ponto está dentro de um raio (em metros) de outro ponto.
     * 
     * @param centerLat latitude do centro
     * @param centerLon longitude do centro
     * @param pointLat latitude do ponto a verificar
     * @param pointLon longitude do ponto a verificar
     * @param radiusInMeters raio em metros
     * @return true se o ponto está dentro do raio
     */
    public static boolean isWithinRadius(
        double centerLat, 
        double centerLon, 
        double pointLat, 
        double pointLon, 
        double radiusInMeters
    ) {
        double distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
        return distance <= radiusInMeters;
    }

    /**
     * Coordenadas aproximadas do centro de Blumenau, SC.
     */
    public static class Blumenau {
        public static Point getCenterPoint() {
            return createPoint(Geo.BLUMENAU_LATITUDE, Geo.BLUMENAU_LONGITUDE);
        }
    }
}

