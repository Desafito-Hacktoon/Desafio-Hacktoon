import 'package:flutter/material.dart';
import '../models/zone_model.dart';
import '../pages/contact_entity_page.dart';
import '../utils/polygon_mapper.dart';

/// BottomSheet com detalhes da zona
class ZoneDetailsSheet extends StatelessWidget {
  final ZoneModel zone;
  final VoidCallback onClose;
  final VoidCallback onViewDetails;

  const ZoneDetailsSheet({
    super.key,
    required this.zone,
    required this.onClose,
    required this.onViewDetails,
  });

  /// Retorna o texto do status baseado na severidade
  String get _statusText {
    switch (zone.severity) {
      case 'critical':
        return 'CRÍTICO';
      case 'warning':
        return 'ALERTA';
      case 'moderate':
        return 'MODERADO';
      case 'low':
        return 'ESTÁVEL';
      default:
        return 'DESCONHECIDO';
    }
  }

  /// Retorna a cor do badge de status
  Color get _statusColor {
    switch (zone.severity) {
      case 'critical':
        return Colors.red;
      case 'warning':
        return Colors.orange;
      case 'moderate':
        return Colors.amber;
      case 'low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  void _openContactPage(BuildContext context) {
    final entity = zone.responsibleEntity;
    if (entity != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ContactEntityPage(entity: entity, zone: zone),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final Color zoneColor = PolygonMapper.hexToColor(zone.color);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(top: 12),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header com nome do bairro e badge de status
                Row(
                  children: [
                    // Indicador de status
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: zoneColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        PolygonMapper.getSeverityIcon(zone.severity),
                        color: zoneColor,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            zone.name,
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[800],
                            ),
                          ),
                          const SizedBox(height: 6),
                          // Badge de Status
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: _statusColor,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              _statusText,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 1,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: onClose,
                      icon: Icon(Icons.close, color: Colors.grey[400]),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Descrição REAL do JSON
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _statusColor.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _statusColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.description_outlined,
                            color: _statusColor,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Descrição da Situação',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: _statusColor,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        zone.description.isNotEmpty
                            ? zone.description
                            : zone.severityDescription,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[800],
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Responsável
                if (zone.responsavel.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Row(
                      children: [
                        Icon(
                          Icons.person_outline,
                          size: 18,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Responsável: ',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
                        ),
                        Expanded(
                          child: Text(
                            zone.responsavel,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[800],
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Estatísticas
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.report_problem_outlined,
                        label: 'Problemas',
                        value: zone.problemCount.toString(),
                        color: zoneColor,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.category_outlined,
                        label: 'Categoria',
                        value: zone.typeLabel,
                        color: const Color(0xFF135CE4),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Problemas recentes (preview)
                if (zone.recentProblems.isNotEmpty) ...[
                  Text(
                    'Últimos Registros',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...zone.recentProblems
                      .take(2)
                      .map(
                        (problem) => Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: zoneColor,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  problem,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.grey[700],
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  const SizedBox(height: 8),
                ],

                const SizedBox(height: 8),

                // Botões de ação
                Column(
                  children: [
                    // Botão de contatar órgão responsável
                    if (zone.responsibleEntity != null)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ElevatedButton.icon(
                          onPressed: () => _openContactPage(context),
                          icon: const Icon(Icons.phone_in_talk, size: 20),
                          label: Text(
                            'Contatar ${zone.responsibleEntity!.acronym}',
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF135CE4),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                        ),
                      ),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: onClose,
                            icon: const Icon(Icons.close, size: 18),
                            label: const Text('Fechar'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.grey[700],
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              side: BorderSide(color: Colors.grey[300]!),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton.icon(
                            onPressed: onViewDetails,
                            icon: const Icon(Icons.visibility, size: 18),
                            label: const Text('Ver Detalhes'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: zoneColor,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 0,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          SizedBox(height: MediaQuery.of(context).padding.bottom),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  label,
                  style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
