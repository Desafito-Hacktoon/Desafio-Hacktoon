import 'package:latlong2/latlong.dart';
import 'responsible_entity.dart';

/// Modelo que representa uma zona do mapa de calor
class ZoneModel {
  final String id;
  final String name;
  final String type;
  final String severity;
  final String color;
  final int problemCount;
  final List<LatLng> coordinates;
  final String description;
  final String responsavel;
  final String? responsibleEntityId;
  final DateTime lastUpdate;
  final List<String> recentProblems;

  ZoneModel({
    required this.id,
    required this.name,
    required this.type,
    required this.severity,
    required this.color,
    required this.problemCount,
    required this.coordinates,
    this.description = '',
    this.responsavel = '',
    this.responsibleEntityId,
    DateTime? lastUpdate,
    this.recentProblems = const [],
  }) : lastUpdate = lastUpdate ?? DateTime.now();

  factory ZoneModel.fromJson(Map<String, dynamic> json) {
    final coords = (json['coordinates'] as List)
        .map((c) => LatLng(c['lat'] as double, c['lng'] as double))
        .toList();

    return ZoneModel(
      id: json['id'] as String,
      name: json['name'] as String,
      type: json['type'] as String,
      severity: json['severity'] as String,
      color: json['color'] as String,
      problemCount: json['problemCount'] as int,
      coordinates: coords,
      description: json['description'] as String? ?? '',
      responsavel: json['responsavel'] as String? ?? 'Não atribuído',
      responsibleEntityId: json['responsibleEntityId'] as String?,
      lastUpdate: json['lastUpdate'] != null
          ? DateTime.parse(json['lastUpdate'] as String)
          : DateTime.now(),
      recentProblems:
          (json['recentProblems'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  /// Obtém a entidade responsável com base no ID
  ResponsibleEntity? get responsibleEntity {
    if (responsibleEntityId == null) return null;
    return ResponsibleEntity.getById(responsibleEntityId!);
  }

  /// Verifica se a zona é crítica (vermelha)
  bool get isCritical => severity == 'critical' || color == '#FF0000';

  /// Verifica se a zona é de alerta
  bool get isWarning => severity == 'warning' || color == '#FFA500';

  /// Retorna o título formatado baseado na severidade
  String get severityTitle {
    switch (severity) {
      case 'critical':
        return 'Zona Crítica';
      case 'warning':
        return 'Zona de Alerta';
      case 'moderate':
        return 'Zona Moderada';
      case 'low':
        return 'Zona Estável';
      default:
        return 'Zona';
    }
  }

  /// Retorna a descrição baseada na severidade
  String get severityDescription {
    switch (severity) {
      case 'critical':
        return 'Alta concentração de problemas neste setor. Ação imediata necessária.';
      case 'warning':
        return 'Atenção necessária neste setor. Monitoramento ativo.';
      case 'moderate':
        return 'Situação sob controle, monitoramento ativo.';
      case 'low':
        return 'Poucos problemas registrados. Setor estável.';
      default:
        return 'Informações do setor.';
    }
  }

  /// Retorna o nome do tipo de problema formatado
  String get typeLabel {
    switch (type) {
      case 'alagamento':
        return 'Alagamento';
      case 'buracos':
        return 'Buracos';
      case 'iluminacao':
        return 'Iluminação';
      case 'limpeza':
        return 'Limpeza';
      case 'saude':
        return 'Saúde';
      case 'seguranca':
        return 'Segurança';
      case 'transito':
        return 'Trânsito';
      case 'all':
        return 'Diversos';
      default:
        return type;
    }
  }

  /// Retorna o ícone do tipo
  String get typeIcon {
    switch (type) {
      case 'alagamento':
        return '🌊';
      case 'buracos':
        return '🕳️';
      case 'iluminacao':
        return '💡';
      case 'limpeza':
        return '🧹';
      case 'saude':
        return '🏥';
      case 'seguranca':
        return '🚔';
      case 'transito':
        return '🚗';
      case 'all':
        return '📋';
      default:
        return '📍';
    }
  }
}
