/// Modelo que representa uma ocorrência retornada pela API
class OcorrenciaResponse {
  final String id;
  final String tipoProblema;
  final String descricao;
  final String bairro;
  final String endereco;
  final double latitude;
  final double longitude;
  final int gravidade;
  final int? gravidadeIA;
  final String status;
  final String secretariaOrigem;
  final DateTime dataCriacao;
  final DateTime dataAtualizacao;
  final Map<String, dynamic>? metadata;

  OcorrenciaResponse({
    required this.id,
    required this.tipoProblema,
    required this.descricao,
    required this.bairro,
    required this.endereco,
    required this.latitude,
    required this.longitude,
    required this.gravidade,
    this.gravidadeIA,
    required this.status,
    required this.secretariaOrigem,
    required this.dataCriacao,
    required this.dataAtualizacao,
    this.metadata,
  });

  factory OcorrenciaResponse.fromJson(Map<String, dynamic> json) {
    return OcorrenciaResponse(
      id: json['id'] as String,
      tipoProblema: json['tipoProblema'] as String,
      descricao: json['descricao'] as String? ?? '',
      bairro: json['bairro'] as String? ?? '',
      endereco: json['endereco'] as String? ?? '',
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      gravidade: json['gravidade'] as int? ?? 1,
      gravidadeIA: json['gravidadeIA'] as int?,
      status: json['status'] as String? ?? 'ABERTO',
      secretariaOrigem: json['secretariaOrigem'] as String? ?? '',
      dataCriacao: json['dataCriacao'] != null
          ? DateTime.parse(json['dataCriacao'] as String)
          : DateTime.now(),
      dataAtualizacao: json['dataAtualizacao'] != null
          ? DateTime.parse(json['dataAtualizacao'] as String)
          : DateTime.now(),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tipoProblema': tipoProblema,
      'descricao': descricao,
      'bairro': bairro,
      'endereco': endereco,
      'latitude': latitude,
      'longitude': longitude,
      'gravidade': gravidade,
      'gravidadeIA': gravidadeIA,
      'status': status,
      'secretariaOrigem': secretariaOrigem,
      'dataCriacao': dataCriacao.toIso8601String(),
      'dataAtualizacao': dataAtualizacao.toIso8601String(),
      'metadata': metadata,
    };
  }

  /// Converte tipo de problema para tipo usado internamente
  String get typeInternal {
    switch (tipoProblema.toLowerCase()) {
      case 'buraco na via':
      case 'buracos':
        return 'buracos';
      case 'iluminação pública':
      case 'iluminacao':
        return 'iluminacao';
      case 'coleta de lixo':
      case 'limpeza':
        return 'limpeza';
      case 'alagamento':
        return 'alagamento';
      case 'saúde':
      case 'saude':
        return 'saude';
      case 'segurança':
      case 'seguranca':
        return 'seguranca';
      case 'trânsito':
      case 'transito':
        return 'transito';
      case 'água':
      case 'agua':
        return 'agua';
      case 'esgoto':
        return 'esgoto';
      default:
        return 'outros';
    }
  }

  /// Retorna severidade baseada na gravidade
  String get severity {
    final g = gravidadeIA ?? gravidade;
    if (g >= 8) return 'critical';
    if (g >= 5) return 'warning';
    if (g >= 3) return 'moderate';
    return 'low';
  }

  /// Retorna cor baseada na gravidade
  String get color {
    final g = gravidadeIA ?? gravidade;
    if (g >= 8) return '#FF0000';
    if (g >= 5) return '#FFA500';
    if (g >= 3) return '#FFFF00';
    return '#90EE90';
  }
}

/// Modelo para resposta paginada da API
class PagedResponse<T> {
  final List<T> content;
  final int page;
  final int size;
  final int totalElements;
  final int totalPages;
  final bool first;
  final bool last;

  PagedResponse({
    required this.content,
    required this.page,
    required this.size,
    required this.totalElements,
    required this.totalPages,
    required this.first,
    required this.last,
  });

  factory PagedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    return PagedResponse<T>(
      content: (json['content'] as List<dynamic>)
          .map((e) => fromJsonT(e as Map<String, dynamic>))
          .toList(),
      page: json['page'] as int? ?? 0,
      size: json['size'] as int? ?? 0,
      totalElements: json['totalElements'] as int? ?? 0,
      totalPages: json['totalPages'] as int? ?? 0,
      first: json['first'] as bool? ?? true,
      last: json['last'] as bool? ?? true,
    );
  }
}
