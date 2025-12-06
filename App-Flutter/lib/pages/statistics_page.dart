import 'package:flutter/material.dart';
import '../models/zone_model.dart';
import '../services/heatmap_service.dart';

class StatisticsPage extends StatefulWidget {
  const StatisticsPage({super.key});

  @override
  State<StatisticsPage> createState() => _StatisticsPageState();
}

class _StatisticsPageState extends State<StatisticsPage> {
  List<ZoneModel> _zones = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final service = HeatmapService();
      final zones = await service.fetchFromApi();
      setState(() {
        _zones = zones;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _zones = [];
        _isLoading = false;
      });
    }
  }

  int get _totalProblems => _zones.fold(0, (sum, z) => sum + z.problemCount);
  int get _criticalCount =>
      _zones.where((z) => z.severity == 'critical').length;
  int get _warningCount => _zones.where((z) => z.severity == 'warning').length;
  int get _moderateCount =>
      _zones.where((z) => z.severity == 'moderate').length;
  int get _stableCount => _zones.where((z) => z.severity == 'low').length;

  Map<String, int> get _problemsByType {
    final map = <String, int>{};
    for (final zone in _zones) {
      map[zone.type] = (map[zone.type] ?? 0) + zone.problemCount;
    }
    return map;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: const Color(0xFF135CE4),
        foregroundColor: Colors.white,
        title: const Text('Estatísticas'),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSummaryCard(),
                      const SizedBox(height: 20),
                      _buildSectionTitle('Status das Zonas'),
                      _buildStatusGrid(),
                      const SizedBox(height: 24),
                      _buildSectionTitle('Problemas por Categoria'),
                      _buildProblemsChart(),
                      const SizedBox(height: 24),
                      _buildSectionTitle('Zonas que Precisam de Atenção'),
                      _buildCriticalZonesList(),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildSummaryCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF135CE4), Color(0xFF3F7AEE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF135CE4).withValues(alpha: 0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Blumenau - Visão Geral',
            style: TextStyle(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$_totalProblems',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 48,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 8),
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text(
                  'problemas registrados',
                  style: TextStyle(color: Colors.white70, fontSize: 16),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _buildMiniStat('Zonas', '${_zones.length}', Icons.map),
              const SizedBox(width: 24),
              _buildMiniStat(
                'Críticas',
                '$_criticalCount',
                Icons.warning,
                color: Colors.red,
              ),
              const SizedBox(width: 24),
              _buildMiniStat(
                'Alertas',
                '$_warningCount',
                Icons.error_outline,
                color: Colors.orange,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(
    String label,
    String value,
    IconData icon, {
    Color? color,
  }) {
    return Row(
      children: [
        Icon(icon, color: color ?? Colors.white70, size: 18),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: TextStyle(
                color: color ?? Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              label,
              style: const TextStyle(color: Colors.white60, fontSize: 11),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Color(0xFF135CE4),
        ),
      ),
    );
  }

  Widget _buildStatusGrid() {
    return Row(
      children: [
        Expanded(
          child: _buildStatusCard('Crítico', _criticalCount, Colors.red),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatusCard('Alerta', _warningCount, Colors.orange),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatusCard('Moderado', _moderateCount, Colors.amber),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatusCard('Estável', _stableCount, Colors.green),
        ),
      ],
    );
  }

  Widget _buildStatusCard(String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(height: 8),
          Text(
            '$count',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(fontSize: 11, color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildProblemsChart() {
    final types = _problemsByType.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        children: types.map((entry) {
          final percent = _totalProblems > 0
              ? (entry.value / _totalProblems * 100).toInt()
              : 0;
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _getTypeLabel(entry.key),
                      style: const TextStyle(
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      '${entry.value} ($percent%)',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: percent / 100,
                    backgroundColor: Colors.grey[200],
                    valueColor: AlwaysStoppedAnimation(
                      _getTypeColor(entry.key),
                    ),
                    minHeight: 8,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildCriticalZonesList() {
    final criticalZones =
        _zones
            .where((z) => z.severity == 'critical' || z.severity == 'warning')
            .toList()
          ..sort((a, b) => b.problemCount.compareTo(a.problemCount));
    if (criticalZones.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.green[50],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green[700]),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Nenhuma zona crítica ou em alerta no momento!',
                style: TextStyle(color: Colors.green),
              ),
            ),
          ],
        ),
      );
    }
    return Column(
      children: criticalZones.take(5).map((zone) {
        final color = zone.severity == 'critical' ? Colors.red : Colors.orange;
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withValues(alpha: 0.3)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 10,
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  zone.severity == 'critical'
                      ? Icons.warning_amber
                      : Icons.error_outline,
                  color: color,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      zone.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${zone.problemCount} problemas • ${zone.typeLabel}',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  zone.severity == 'critical' ? 'CRÍTICO' : 'ALERTA',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  String _getTypeLabel(String type) {
    switch (type) {
      case 'alagamento':
        return '🌊 Alagamento';
      case 'buracos':
        return '🕳️ Buracos';
      case 'iluminacao':
        return '💡 Iluminação';
      case 'limpeza':
        return '🧹 Limpeza';
      case 'saude':
        return '🏥 Saúde';
      case 'seguranca':
        return '🚔 Segurança';
      case 'transito':
        return '🚗 Trânsito';
      default:
        return '📍 $type';
    }
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'alagamento':
        return Colors.blue;
      case 'buracos':
        return Colors.brown;
      case 'iluminacao':
        return Colors.amber;
      case 'limpeza':
        return Colors.green;
      case 'saude':
        return Colors.red;
      case 'seguranca':
        return Colors.purple;
      case 'transito':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }
}
