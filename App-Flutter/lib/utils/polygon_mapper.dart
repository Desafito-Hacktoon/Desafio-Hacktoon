import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/zone_model.dart';

/// Utilitário para converter dados GeoJSON em polígonos do Flutter Map
class PolygonMapper {
  /// Converte uma cor hexadecimal em Color do Flutter
  static Color hexToColor(String hexColor) {
    hexColor = hexColor.replaceAll('#', '');

    if (hexColor.length == 6) {
      hexColor = 'FF$hexColor'; // Adiciona opacidade total
    }

    return Color(int.parse(hexColor, radix: 16));
  }

  /// Converte uma ZoneModel em um Polygon do Flutter Map
  static Polygon zoneToPolygon({
    required ZoneModel zone,
    bool isSelected = false,
  }) {
    final Color baseColor = hexToColor(zone.color);
    final Color fillColor = baseColor.withValues(alpha: isSelected ? 0.7 : 0.4);
    final Color borderColor = isSelected ? Colors.white : baseColor;

    return Polygon(
      points: zone.coordinates,
      color: fillColor,
      borderColor: borderColor,
      borderStrokeWidth: isSelected ? 4.0 : 2.0,
      label: isSelected ? zone.name : null,
      labelStyle: const TextStyle(
        color: Colors.white,
        fontWeight: FontWeight.bold,
        fontSize: 12,
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
