package com.moredevs.mapblu.core.service;

import com.moredevs.mapblu.core.dto.request.HeatmapFilterRequest;
import com.moredevs.mapblu.core.dto.response.*;
import com.moredevs.mapblu.core.repository.OcorrenciaRepository;
import com.moredevs.mapblu.shared.constant.Constants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.moredevs.mapblu.shared.constant.Constants.Geo;

/**
 * Service responsável por gerar dados de heatmap para visualização no mapa.
 * Utiliza PostGIS para agregação espacial otimizada.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HeatmapService {

    private final OcorrenciaRepository ocorrenciaRepository;

    /**
     * Gera zonas do heatmap (polígonos) para o frontend Flutter.
     * Agrupa ocorrências em grid dinâmico e retorna polígonos com informações de severidade.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = Constants.Cache.CACHE_HEATMAP, 
               key = "#filter?.tipoProblema + '_' + #filter?.bairro + '_' + #filter?.dataInicio + '_' + #filter?.dataFim")
    public HeatmapResponse generateHeatmapZones(HeatmapFilterRequest filter) {
        log.debug("Gerando zonas do heatmap com filtros: {}", filter);

        // Define bounding box
        double minLat = filter != null && filter.getMinLat() != null ? filter.getMinLat() : Geo.BLUMENAU_MIN_LAT;
        double maxLat = filter != null && filter.getMaxLat() != null ? filter.getMaxLat() : Geo.BLUMENAU_MAX_LAT;
        double minLng = filter != null && filter.getMinLng() != null ? filter.getMinLng() : Geo.BLUMENAU_MIN_LNG;
        double maxLng = filter != null && filter.getMaxLng() != null ? filter.getMaxLng() : Geo.BLUMENAU_MAX_LNG;

        // Calcula tamanho do grid em graus (aproximação)
        double gridSizeMeters = filter != null && filter.getGridSize() != null 
            ? filter.getGridSize() 
            : Geo.DEFAULT_GRID_SIZE_METERS;
        double gridSizeDegrees = gridSizeMeters * Geo.METERS_TO_DEGREES;

        // Converte para Web Mercator (3857) para cálculos mais precisos
        double gridSizeMercator = gridSizeMeters;

        String tipoProblemaStr = filter != null && filter.getTipoProblema() != null 
            ? filter.getTipoProblema().name() 
            : null;

        LocalDateTime dataInicio = filter != null ? filter.getDataInicio() : null;
        LocalDateTime dataFim = filter != null ? filter.getDataFim() : null;

        // Busca ocorrências agrupadas por grid
        List<Object[]> gridData = ocorrenciaRepository.aggregateByGrid(
            minLat, maxLat, minLng, maxLng, gridSizeMercator, tipoProblemaStr, dataInicio, dataFim
        );

        // Converte para zonas
        List<HeatmapZoneResponse> zones = gridData.stream()
            .map(data -> createZoneFromGridData(data, gridSizeDegrees))
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        // Calcula estatísticas
        HeatmapResponse.Summary summary = calculateSummary(zones);

        // Cria resposta completa
        return HeatmapResponse.builder()
            .cityInfo(createCityInfo())
            .zones(zones)
            .summary(summary)
            .build();
    }

    /**
     * Gera heatmap em formato hexágonos (pontos) para o frontend Angular.
     * Retorna GeoJSON FeatureCollection com pontos hexagonais.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = Constants.Cache.CACHE_HEATMAP, 
               key = "'hexagons_' + #filter?.tipoProblema + '_' + #filter?.dataInicio + '_' + #filter?.dataFim + '_' + #filter?.minLat + '_' + #filter?.maxLat + '_' + #filter?.minLng + '_' + #filter?.maxLng")
    public GeoJsonFeatureCollection generateHexagonHeatmap(HeatmapFilterRequest filter) {
        log.debug("Gerando hexágonos do heatmap com filtros: {}", filter);

        // Define bounding box - expande bastante se não fornecido para garantir que capture todos os dados
        double minLat = filter != null && filter.getMinLat() != null ? filter.getMinLat() : Geo.BLUMENAU_MIN_LAT;
        double maxLat = filter != null && filter.getMaxLat() != null ? filter.getMaxLat() : Geo.BLUMENAU_MAX_LAT;
        double minLng = filter != null && filter.getMinLng() != null ? filter.getMinLng() : Geo.BLUMENAU_MIN_LNG;
        double maxLng = filter != null && filter.getMaxLng() != null ? filter.getMaxLng() : Geo.BLUMENAU_MAX_LNG;
        
        log.debug("Bounding box: minLat={}, maxLat={}, minLng={}, maxLng={}", minLat, maxLat, minLng, maxLng);

        // Calcula tamanho do hexágono
        double hexSizeMeters = Geo.DEFAULT_HEX_SIZE_METERS;
        double hexSizeMercator = hexSizeMeters;

        String tipoProblemaStr = filter != null && filter.getTipoProblema() != null 
            ? filter.getTipoProblema().name() 
            : null;

        LocalDateTime dataInicio = filter != null ? filter.getDataInicio() : null;
        LocalDateTime dataFim = filter != null ? filter.getDataFim() : null;

        // Busca ocorrências agrupadas por hexágono
        List<Object[]> hexData = ocorrenciaRepository.aggregateByHexagon(
            minLat, maxLat, minLng, maxLng, hexSizeMercator, tipoProblemaStr, dataInicio, dataFim
        );

        log.debug("Hexágonos encontrados: {}", hexData.size());
        if (!hexData.isEmpty()) {
            log.debug("Primeiro hexágono: lng={}, lat={}, count={}", 
                hexData.get(0)[0], hexData.get(0)[1], hexData.get(0)[2]);
        }

        // Calcula intensidade máxima para normalização
        int maxCount = hexData.stream()
            .mapToInt(data -> ((Number) data[2]).intValue())
            .max()
            .orElse(1);
        
        log.debug("Max count para normalização: {}", maxCount);

        // Converte para GeoJSON Features
        List<GeoJsonFeature> features = hexData.stream()
            .map(data -> createHexagonFeature(data, maxCount))
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return GeoJsonFeatureCollection.builder()
            .features(features)
            .build();
    }

    /**
     * Cria uma zona a partir dos dados do grid.
     */
    private HeatmapZoneResponse createZoneFromGridData(Object[] data, double gridSize) {
        try {
            // [center_lng, center_lat, count, avg_gravidade, max_gravidade]
            double centerLng = ((Number) data[0]).doubleValue();
            double centerLat = ((Number) data[1]).doubleValue();
            int count = ((Number) data[2]).intValue();
            double avgGravidade = data[3] != null ? ((Number) data[3]).doubleValue() : 0.0;
            int maxGravidade = data[4] != null ? ((Number) data[4]).intValue() : 0;

            // Cria polígono quadrado ao redor do centro
            List<HeatmapZoneResponse.Coordinate> coordinates = createSquarePolygon(
                centerLat, centerLng, gridSize
            );

            // Determina severidade baseada na gravidade máxima e contagem
            String severity = determineSeverity(maxGravidade, count);
            String color = getColorBySeverity(severity);

            // Gera ID único
            String id = String.format("zone_%d_%d", 
                (int) (centerLat * 10000), 
                (int) (centerLng * 10000));

            // Determina tipo baseado na gravidade (pode ser melhorado com análise de tipos)
            String type = determineTypeFromGravidade(maxGravidade);

            return HeatmapZoneResponse.builder()
                .id(id)
                .name(String.format("Zona %.4f,%.4f", centerLat, centerLng))
                .type(type)
                .severity(severity)
                .color(color)
                .problemCount(count)
                .description(String.format("Área com %d problema(s). Gravidade média: %.1f", 
                    count, avgGravidade))
                .responsavel("Sistema")
                .lastUpdate(LocalDateTime.now())
                .recentProblems(Collections.emptyList())
                .coordinates(coordinates)
                .build();

        } catch (Exception e) {
            log.error("Erro ao criar zona do grid: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Cria um polígono quadrado ao redor de um ponto.
     */
    private List<HeatmapZoneResponse.Coordinate> createSquarePolygon(
        double centerLat, double centerLng, double sizeDegrees
    ) {
        double halfSize = sizeDegrees / 2.0;
        
        return Arrays.asList(
            HeatmapZoneResponse.Coordinate.builder()
                .lat(centerLat - halfSize)
                .lng(centerLng - halfSize)
                .build(),
            HeatmapZoneResponse.Coordinate.builder()
                .lat(centerLat - halfSize)
                .lng(centerLng + halfSize)
                .build(),
            HeatmapZoneResponse.Coordinate.builder()
                .lat(centerLat + halfSize)
                .lng(centerLng + halfSize)
                .build(),
            HeatmapZoneResponse.Coordinate.builder()
                .lat(centerLat + halfSize)
                .lng(centerLng - halfSize)
                .build(),
            HeatmapZoneResponse.Coordinate.builder()
                .lat(centerLat - halfSize)
                .lng(centerLng - halfSize)
                .build() // Fecha o polígono
        );
    }

    /**
     * Cria uma feature hexágono a partir dos dados agregados.
     * Retorna Polygon geometry com coordenadas completas do hexágono.
     */
    private GeoJsonFeature createHexagonFeature(Object[] data, int maxCount) {
        try {
            // [lng, lat, count, avg_gravidade]
            double lng = ((Number) data[0]).doubleValue();
            double lat = ((Number) data[1]).doubleValue();
            int count = ((Number) data[2]).intValue();
            double avgGravidade = data[3] != null ? ((Number) data[3]).doubleValue() : 0.0;

            // Calcula intensidade normalizada (0.0 a 1.0)
            double intensity = maxCount > 0 ? (double) count / maxCount : 0.0;

            // Calcula o tamanho do hexágono em graus (aproximadamente 300m)
            double hexSizeMeters = Geo.DEFAULT_HEX_SIZE_METERS;
            double hexSizeDegrees = hexSizeMeters * Geo.METERS_TO_DEGREES;
            double hexRadiusDegrees = hexSizeDegrees;

            // Gera coordenadas do hexágono (6 vértices + fechamento)
            List<List<Double>> hexagonRing = createHexagonCoordinates(lat, lng, hexRadiusDegrees);

            // Cria geometria Polygon (GeoJSON Polygon: [[[lng, lat], ...]])
            GeoJsonGeometry geometry = GeoJsonGeometry.createPolygonFromRing(hexagonRing);

            // Cria propriedades
            Map<String, Object> properties = new HashMap<>();
            properties.put("id", String.format("hex_%d_%d", 
                (int) (lat * 10000), 
                (int) (lng * 10000)));
            properties.put("occurrenceCount", count);
            properties.put("intensity", Math.round(intensity * 100.0) / 100.0);
            properties.put("avgGravidade", Math.round(avgGravidade * 10.0) / 10.0);

            return GeoJsonFeature.builder()
                .geometry(geometry)
                .properties(properties)
                .build();

        } catch (Exception e) {
            log.error("Erro ao criar feature hexágono: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Gera as coordenadas de um hexágono (6 vértices + fechamento).
     * Hexágono orientado pointy-top (ponta para cima).
     */
    private List<List<Double>> createHexagonCoordinates(double centerLat, double centerLng, double radiusDegrees) {
        List<List<Double>> coordinates = new ArrayList<>();
        
        // Calcula o raio em lat/lng (aproximação)
        double radiusLat = radiusDegrees;
        double radiusLng = radiusDegrees / Math.cos(Math.toRadians(centerLat));
        
        // Gera 6 vértices do hexágono (orientação pointy-top)
        // Rotação de 30 graus para que a ponta fique para cima
        double rotationOffset = Math.PI / 6; // 30 graus
        
        for (int i = 0; i < 6; i++) {
            // Ângulo base: cada vértice está a 60° (π/3) do anterior
            // Começa em -90° e rotaciona 30° para ter ponta no topo
            double angle = (Math.PI / 3) * i - (Math.PI / 2) + rotationOffset;
            double lat = centerLat + radiusLat * Math.cos(angle);
            double lng = centerLng + radiusLng * Math.sin(angle);
            
            // GeoJSON Polygon coordinates: [lng, lat]
            coordinates.add(Arrays.asList(lng, lat));
        }
        
        // Fecha o polígono (último ponto = primeiro ponto)
        coordinates.add(coordinates.get(0));
        
        return coordinates;
    }

    /**
     * Determina a severidade baseada na gravidade máxima e contagem.
     */
    private String determineSeverity(int maxGravidade, int count) {
        if (maxGravidade >= 8 || count >= 20) {
            return "critical";
        } else if (maxGravidade >= 6 || count >= 10) {
            return "warning";
        } else if (maxGravidade >= 4 || count >= 5) {
            return "moderate";
        } else {
            return "low";
        }
    }

    /**
     * Retorna a cor hexadecimal baseada na severidade.
     */
    private String getColorBySeverity(String severity) {
        return switch (severity) {
            case "critical" -> "#FF0000"; // Vermelho
            case "warning" -> "#FFA500";  // Laranja
            case "moderate" -> "#FFFF00"; // Amarelo
            case "low" -> "#90EE90";      // Verde claro
            default -> "#CCCCCC";         // Cinza
        };
    }

    /**
     * Determina o tipo baseado na gravidade (simplificado).
     * Em produção, isso deveria analisar os tipos reais das ocorrências.
     */
    private String determineTypeFromGravidade(int gravidade) {
        // Por enquanto retorna um tipo genérico
        // Em produção, analisar os tipos reais das ocorrências no grid
        return "all";
    }

    /**
     * Calcula o resumo estatístico das zonas.
     */
    private HeatmapResponse.Summary calculateSummary(List<HeatmapZoneResponse> zones) {
        int totalProblems = zones.stream()
            .mapToInt(HeatmapZoneResponse::getProblemCount)
            .sum();

        long criticalZones = zones.stream()
            .filter(z -> "critical".equals(z.getSeverity()))
            .count();

        long warningZones = zones.stream()
            .filter(z -> "warning".equals(z.getSeverity()))
            .count();

        long moderateZones = zones.stream()
            .filter(z -> "moderate".equals(z.getSeverity()))
            .count();

        long stableZones = zones.stream()
            .filter(z -> "low".equals(z.getSeverity()))
            .count();

        return HeatmapResponse.Summary.builder()
            .totalProblems(totalProblems)
            .criticalZones((int) criticalZones)
            .warningZones((int) warningZones)
            .moderateZones((int) moderateZones)
            .stableZones((int) stableZones)
            .lastUpdated(LocalDateTime.now())
            .city("Blumenau")
            .state("Santa Catarina")
            .build();
    }

    /**
     * Cria informações da cidade.
     */
    private HeatmapResponse.CityInfo createCityInfo() {
        return HeatmapResponse.CityInfo.builder()
            .name("Blumenau")
            .state("Santa Catarina")
            .country("Brasil")
            .center(HeatmapResponse.Center.builder()
                .lat(Constants.Geo.BLUMENAU_LATITUDE)
                .lng(Constants.Geo.BLUMENAU_LONGITUDE)
                .build())
            .zoom(13)
            .population(309011)
            .area(519.8)
            .build();
    }
}

