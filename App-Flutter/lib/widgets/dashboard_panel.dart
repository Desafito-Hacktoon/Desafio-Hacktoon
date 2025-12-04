import 'package:flutter/material.dart';

/// Painel de dashboard com estatísticas
class DashboardPanel extends StatelessWidget {
  final int totalProblems;
  final int criticalCount;
  final int warningCount;
  final int zonesCount;

  const DashboardPanel({
    super.key,
    required this.totalProblems,
    required this.criticalCount,
    required this.warningCount,
    required this.zonesCount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.analytics, size: 18, color: Colors.grey[600]),
              const SizedBox(width: 8),
              Text(
                'Resumo Executivo',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[700],
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.circle, size: 8, color: Colors.green[400]),
                    const SizedBox(width: 4),
                    Text(
                      'Ao vivo',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.green[700],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  icon: Icons.warning_amber_rounded,
                  value: totalProblems.toString(),
                  label: 'Total',
                  color: const Color(0xFF1E3A5F),
                ),
              ),
              Container(width: 1, height: 40, color: Colors.grey[200]),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.error,
                  value: criticalCount.toString(),
                  label: 'Críticas',
                  color: Colors.red,
                ),
              ),
              Container(width: 1, height: 40, color: Colors.grey[200]),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.warning,
                  value: warningCount.toString(),
                  label: 'Alertas',
                  color: Colors.orange,
                ),
              ),
              Container(width: 1, height: 40, color: Colors.grey[200]),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.location_on,
                  value: zonesCount.toString(),
                  label: 'Zonas',
                  color: Colors.blue,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[600])),
      ],
    );
  }
}
