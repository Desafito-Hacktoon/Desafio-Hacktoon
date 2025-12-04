import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import '../models/zone_model.dart';
import '../models/ocorrencia_response.dart';
import '../config/api_config.dart';

class HeatmapService {
  static const String _assetPath = 'assets/mock/heatmap.json';

  /// Determina a URL base correta baseada na plataforma
  String get _baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8080/api';
    }
    if (Platform.isAndroid) {
      return ApiConfig.baseUrl; // 10.0.2.2 para emulador Android
    }
    if (Platform.isIOS) {
      return ApiConfig.baseUrlIOS;
    }
    return ApiConfig.baseUrl;
  }

  /// Busca ocorrências da API e transforma em zonas
  Future<List<ZoneModel>> fetchFromApi({String? filter}) async {
    final ocorrencias = await _fetchOcorrencias(tipoProblema: filter);

    if (ocorrencias.isEmpty) {
      debugPrint('API retornou vazio');
      return [];
    }

    // Agrupa ocorrências por bairro e converte para ZoneModel
    final zones = _groupOcorrenciasByBairro(ocorrencias);

    if (filter != null && filter != 'todos') {
      return zones.where((zone) => zone.type == filter).toList();
    }

    return zones;
  }

  /// Busca todas as ocorrências da API
  Future<List<OcorrenciaResponse>> _fetchOcorrencias({
    String? tipoProblema,
    String? bairro,
    String? status,
    int page = 0,
    int size = 1000,
  }) async {
    try {
      final queryParams = {'page': page.toString(), 'size': size.toString()};

      if (tipoProblema != null && tipoProblema != 'todos') {
        queryParams['tipoProblema'] = _mapFilterToTipoProblema(tipoProblema);
      }
      if (bairro != null) queryParams['bairro'] = bairro;
      if (status != null) queryParams['status'] = status;

      final uri = Uri.parse(
        '$_baseUrl${ApiConfig.ocorrenciasEndpoint}',
      ).replace(queryParameters: queryParams);

      debugPrint('Buscando ocorrências: $uri');

      final response = await http
          .get(uri, headers: {'Content-Type': 'application/json'})
          .timeout(Duration(seconds: ApiConfig.connectionTimeout));

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        final pagedResponse = PagedResponse.fromJson(
          jsonData,
          OcorrenciaResponse.fromJson,
        );
        debugPrint('Recebidas ${pagedResponse.content.length} ocorrências');
        return pagedResponse.content;
      } else {
        debugPrint('Erro na API: ${response.statusCode}');
        throw Exception('Erro na API: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Exceção ao buscar ocorrências: $e');
      rethrow;
    }
  }

  /// Busca ocorrências próximas a uma localização
  Future<List<OcorrenciaResponse>> fetchOcorrenciasProximas({
    required double latitude,
    required double longitude,
    double? raioMetros,
    String? tipoProblema,
  }) async {
    try {
      final queryParams = {
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        'page': '0',
        'size': '100',
      };

      if (raioMetros != null) {
        queryParams['raioMetros'] = raioMetros.toString();
      }
      if (tipoProblema != null) {
        queryParams['tipoProblema'] = tipoProblema;
      }

      final uri = Uri.parse(
        '$_baseUrl${ApiConfig.ocorrenciasProximasEndpoint}',
      ).replace(queryParameters: queryParams);

      final response = await http
          .get(uri, headers: {'Content-Type': 'application/json'})
          .timeout(Duration(seconds: ApiConfig.connectionTimeout));

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        final pagedResponse = PagedResponse.fromJson(
          jsonData,
          OcorrenciaResponse.fromJson,
        );
        return pagedResponse.content;
      }
      return [];
    } catch (e) {
      debugPrint('Erro ao buscar ocorrências próximas: $e');
      return [];
    }
  }

  /// Busca ocorrências críticas
  Future<List<OcorrenciaResponse>> fetchOcorrenciasCriticas() async {
    try {
      final uri = Uri.parse(
        '$_baseUrl${ApiConfig.ocorrenciasCriticasEndpoint}',
      ).replace(queryParameters: {'page': '0', 'size': '100'});

      final response = await http
          .get(uri, headers: {'Content-Type': 'application/json'})
          .timeout(Duration(seconds: ApiConfig.connectionTimeout));

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        final pagedResponse = PagedResponse.fromJson(
          jsonData,
          OcorrenciaResponse.fromJson,
        );
        return pagedResponse.content;
      }
      return [];
    } catch (e) {
      debugPrint('Erro ao buscar ocorrências críticas: $e');
      return [];
    }
  }

  /// Agrupa ocorrências por bairro e cria ZoneModels
  List<ZoneModel> _groupOcorrenciasByBairro(
    List<OcorrenciaResponse> ocorrencias,
  ) {
    // Mapa de bairros com suas coordenadas reais de Blumenau
    final bairrosCoords = _getBairrosCoordinates();

    // Agrupa ocorrências por bairro
    final Map<String, List<OcorrenciaResponse>> grouped = {};
    for (final occ in ocorrencias) {
      final bairro = occ.bairro.isNotEmpty ? occ.bairro : 'Centro';
      grouped.putIfAbsent(bairro, () => []).add(occ);
    }

    // Converte cada grupo em ZoneModel
    final List<ZoneModel> zones = [];
    grouped.forEach((bairro, occList) {
      // Determina o tipo predominante
      final typeCount = <String, int>{};
      for (final occ in occList) {
        typeCount[occ.typeInternal] = (typeCount[occ.typeInternal] ?? 0) + 1;
      }
      final predominantType = typeCount.entries
          .reduce((a, b) => a.value > b.value ? a : b)
          .key;

      // Calcula gravidade média
      final avgGravidade =
          occList
              .map((o) => o.gravidadeIA ?? o.gravidade)
              .reduce((a, b) => a + b) /
          occList.length;

      // Determina severidade e cor
      String severity;
      String color;
      if (avgGravidade >= 8) {
        severity = 'critical';
        color = '#FF0000';
      } else if (avgGravidade >= 5) {
        severity = 'warning';
        color = '#FFA500';
      } else if (avgGravidade >= 3) {
        severity = 'moderate';
        color = '#FFFF00';
      } else {
        severity = 'low';
        color = '#90EE90';
      }

      // Obtém coordenadas do bairro
      final coords =
          bairrosCoords[bairro.toLowerCase()] ??
          _generatePolygonAroundPoint(
            occList.first.latitude,
            occList.first.longitude,
          );

      // Coleta problemas recentes
      final recentProblems = occList
          .take(5)
          .map((o) => o.descricao)
          .where((d) => d.isNotEmpty)
          .toList();

      // Encontra última atualização
      final lastUpdate = occList
          .map((o) => o.dataAtualizacao)
          .reduce((a, b) => a.isAfter(b) ? a : b);

      zones.add(
        ZoneModel(
          id: 'zone_${bairro.toLowerCase().replaceAll(' ', '_')}',
          name: bairro,
          type: predominantType,
          severity: severity,
          color: color,
          problemCount: occList.length,
          coordinates: coords,
          description:
              'Bairro $bairro - ${occList.length} ocorrências registradas',
          responsavel: occList.first.secretariaOrigem,
          lastUpdate: lastUpdate,
          recentProblems: recentProblems,
        ),
      );
    });

    return zones;
  }

  /// Mapeia filtro interno para tipo de problema da API
  String _mapFilterToTipoProblema(String filter) {
    switch (filter) {
      case 'buracos':
        return 'BURACO_NA_VIA';
      case 'iluminacao':
        return 'ILUMINACAO_PUBLICA';
      case 'limpeza':
        return 'COLETA_DE_LIXO';
      case 'alagamento':
        return 'ALAGAMENTO';
      case 'saude':
        return 'SAUDE';
      case 'seguranca':
        return 'SEGURANCA';
      case 'transito':
        return 'TRANSITO';
      default:
        return filter.toUpperCase();
    }
  }

  /// Coordenadas reais dos bairros de Blumenau
  Map<String, List<LatLng>> _getBairrosCoordinates() {
    return {
      'centro': _generatePolygonAroundPoint(-26.9199015, -49.0659336),
      'ponta aguda': _generatePolygonAroundPoint(-26.9158716, -49.0642816),
      'velha': _generatePolygonAroundPoint(-26.9184933, -49.0925069),
      'garcia': _generatePolygonAroundPoint(-26.9345765, -49.0594673),
      'vila nova': _generatePolygonAroundPoint(-26.9034321, -49.0882365),
      'itoupava seca': _generatePolygonAroundPoint(-26.8951377, -49.0817181),
      'itoupava norte': _generatePolygonAroundPoint(-26.8795529, -49.0782404),
      'fortaleza': _generatePolygonAroundPoint(-26.8790565, -49.0652593),
      'itoupavazinha': _generatePolygonAroundPoint(-26.8488784, -49.1138734),
      'água verde': _generatePolygonAroundPoint(-26.9107433, -49.1073687),
      'agua verde': _generatePolygonAroundPoint(-26.9107433, -49.1073687),
      'progresso': _generatePolygonAroundPoint(-26.9722528, -49.0751711),
      'salto weissbach': _generatePolygonAroundPoint(-26.8966938, -49.1299364),
      'badenfurt': _generatePolygonAroundPoint(-26.8830601, -49.1357528),
      'escola agrícola': _generatePolygonAroundPoint(-26.8950782, -49.0990262),
      'escola agricola': _generatePolygonAroundPoint(-26.8950782, -49.0990262),
      'victor konder': _generatePolygonAroundPoint(-26.9089357, -49.0750949),
      'jardim blumenau': _generatePolygonAroundPoint(-26.9262538, -49.0618058),
      'boa vista': _generatePolygonAroundPoint(-26.9013572, -49.0668423),
      'vorstadt': _generatePolygonAroundPoint(-26.9120, -49.0780),
      'itoupava central': _generatePolygonAroundPoint(-26.8700, -49.0700),
      'salto do norte': _generatePolygonAroundPoint(-26.8500, -49.0900),
      'tribess': _generatePolygonAroundPoint(-26.9300, -49.0500),
      'valparaíso': _generatePolygonAroundPoint(-26.9310, -49.0660),
      'valparaiso': _generatePolygonAroundPoint(-26.9310, -49.0660),
      'glória': _generatePolygonAroundPoint(-26.9250, -49.0800),
      'gloria': _generatePolygonAroundPoint(-26.9250, -49.0800),
    };
  }

  /// Gera polígono hexagonal ao redor de um ponto central
  List<LatLng> _generatePolygonAroundPoint(double lat, double lng) {
    const double radius = 0.008; // ~800m de raio
    final List<LatLng> coords = [];

    // Gera 6 vértices para criar um hexágono
    for (int i = 0; i < 6; i++) {
      final angle = (i * 60 - 30) * 3.14159265359 / 180;
      coords.add(
        LatLng(
          lat + radius * 0.9 * cos(angle),
          lng +
              radius *
                  1.1 *
                  sin(angle), // Ajuste para compensar a diferença lat/lng
        ),
      );
    }
    // Fecha o polígono
    coords.add(coords.first);

    return coords;
  }

  /// Função cosseno
  double cos(double radians) => (radians == 0) ? 1.0 : _cos(radians);

  double _cos(double x) {
    x = x % (2 * 3.14159265359);
    double result = 1.0;
    double term = 1.0;
    for (int i = 1; i <= 10; i++) {
      term *= -x * x / ((2 * i - 1) * (2 * i));
      result += term;
    }
    return result;
  }

  /// Função seno
  double sin(double radians) => (radians == 0) ? 0.0 : _sin(radians);

  double _sin(double x) {
    x = x % (2 * 3.14159265359);
    double result = x;
    double term = x;
    for (int i = 1; i <= 10; i++) {
      term *= -x * x / ((2 * i) * (2 * i + 1));
      result += term;
    }
    return result;
  }
}
