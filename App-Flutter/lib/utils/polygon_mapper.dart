import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/zone_model.dart';

/// Utilitário para converter dados GeoJSON em polígonos do Flutter Map
/// Estilo visual: Favo de Mel (Honeycomb)
class PolygonMapper {
  // Cores do tema Favo de Mel
  static const Color honeycombBorder = Color(0xFF8B4513); // Marrom mel
  static const Color honeycombBorderLight = Color(0xFFD2691E); // Chocolate

  /// Converte uma cor hexadecimal em Color do Flutter
  static Color hexToColor(String hexColor) {
    hexColor = hexColor.replaceAll('#', '');

    if (hexColor.length == 6) {
      hexColor = 'FF$hexColor'; // Adiciona opacidade total
    }

    return Color(int.parse(hexColor, radix: 16));
  }

  /// Retorna cor estilo favo de mel baseada na severidade
  static Color getHoneycombColor(String severity) {
    switch (severity) {
      case 'critical':
        return const Color(0xFFDC143C); // Crimson - vermelho intenso
      case 'warning':
        return const Color(0xFFFF8C00); // Laranja escuro
      case 'moderate':
        return const Color(0xFFFFD700); // Dourado
      case 'low':
        return const Color(0xFFADFF2F); // Verde amarelado
      default:
        return const Color(0xFFFFF8DC); // Creme claro
    }
  }

  /// Retorna a opacidade baseada na severidade (mais intenso = mais opaco)
  static double getHoneycombOpacity(String severity, bool isSelected) {
    if (isSelected) return 0.85;

    switch (severity) {
      case 'critical':
        return 0.75;
      case 'warning':
        return 0.65;
      case 'moderate':
        return 0.55;
      case 'low':
        return 0.45;
      default:
        return 0.35;
    }
  }

  /// Converte uma ZoneModel em um Polygon estilo Favo de Mel
  static Polygon zoneToPolygon({
    required ZoneModel zone,
    bool isSelected = false,
  }) {
    final Color fillColor = getHoneycombColor(zone.severity);
    final double opacity = getHoneycombOpacity(zone.severity, isSelected);

    return Polygon(
      points: zone.coordinates,
      color: fillColor.withValues(alpha: opacity),
      borderColor: isSelected ? Colors.white : honeycombBorder,
      borderStrokeWidth: isSelected ? 3.5 : 2.0,
      label: isSelected ? '${zone.problemCount} ocorrências' : null,
      labelStyle: const TextStyle(
        color: Colors.black87,
        fontWeight: FontWeight.bold,
        fontSize: 12,
        shadows: [Shadow(color: Colors.white, blurRadius: 4)],
      ),
    );
  }

  /// Converte uma lista de ZoneModel em uma List de Polygons
  static List<Polygon> zonesToPolygons({
    required List<ZoneModel> zones,
    String? selectedZoneId,
  }) {
    return zones
        .map(
          (zone) =>
              zoneToPolygon(zone: zone, isSelected: zone.id == selectedZoneId),
        )
        .toList();
  }

  /// Calcula o centro de uma lista de coordenadas
  static LatLng calculateCenter(List<LatLng> coordinates) {
    if (coordinates.isEmpty) {
      return const LatLng(0, 0);
    }

    double totalLat = 0;
    double totalLng = 0;

    for (final coord in coordinates) {
      totalLat += coord.latitude;
      totalLng += coord.longitude;
    }

    return LatLng(totalLat / coordinates.length, totalLng / coordinates.length);
  }

  /// Calcula o centro de todas as zonas para posicionar a câmera inicial
  static LatLng calculateZonesCenter(List<ZoneModel> zones) {
    if (zones.isEmpty) {
      return const LatLng(-23.5505, -46.6333); // São Paulo como padrão
    }

    final allCoords = zones.expand((zone) => zone.coordinates).toList();
    return calculateCenter(allCoords);
  }

  /// Retorna os bounds para ajustar a câmera a todas as zonas
  static LatLngBounds? calculateBounds(List<ZoneModel> zones) {
    if (zones.isEmpty) return null;

    final allCoords = zones.expand((zone) => zone.coordinates).toList();

    if (allCoords.isEmpty) return null;

    double minLat = allCoords.first.latitude;
    double maxLat = allCoords.first.latitude;
    double minLng = allCoords.first.longitude;
    double maxLng = allCoords.first.longitude;

    for (final coord in allCoords) {
      if (coord.latitude < minLat) minLat = coord.latitude;
      if (coord.latitude > maxLat) maxLat = coord.latitude;
      if (coord.longitude < minLng) minLng = coord.longitude;
      if (coord.longitude > maxLng) maxLng = coord.longitude;
    }

    return LatLngBounds(LatLng(minLat, minLng), LatLng(maxLat, maxLng));
  }

  /// Verifica se um ponto está dentro de um polígono usando Ray Casting
  static bool isPointInPolygon(LatLng point, List<LatLng> polygon) {
    if (polygon.isEmpty) return false;

    bool inside = false;
    int n = polygon.length;

    double px = point.longitude;
    double py = point.latitude;

    for (int i = 0, j = n - 1; i < n; j = i++) {
      double xi = polygon[i].longitude;
      double yi = polygon[i].latitude;
      double xj = polygon[j].longitude;
      double yj = polygon[j].latitude;

      bool intersect =
          ((yi > py) != (yj > py)) &&
          (px < (xj - xi) * (py - yi) / (yj - yi) + xi);

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  /// Encontra qual zona contém o ponto clicado
  static ZoneModel? findZoneAtPoint(LatLng point, List<ZoneModel> zones) {
    for (final zone in zones) {
      if (isPointInPolygon(point, zone.coordinates)) {
        return zone;
      }
    }
    return null;
  }

  /// Retorna a cor baseada na severidade
  static Color getSeverityColor(String severity) {
    switch (severity) {
      case 'critical':
        return Colors.red;
      case 'warning':
        return Colors.orange;
      case 'moderate':
        return Colors.yellow[700]!;
      case 'low':
        return Colors.green[400]!;
      default:
        return Colors.grey;
    }
  }

  /// Retorna o ícone baseado na severidade
  static IconData getSeverityIcon(String severity) {
    switch (severity) {
      case 'critical':
        return Icons.error;
      case 'warning':
        return Icons.warning;
      case 'moderate':
        return Icons.info;
      case 'low':
        return Icons.check_circle;
      default:
        return Icons.help;
    }
  }
}
