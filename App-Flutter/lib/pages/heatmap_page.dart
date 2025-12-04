import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/zone_model.dart';
import '../services/heatmap_service.dart';
import '../utils/polygon_mapper.dart';
import '../widgets/zone_details_sheet.dart';
import '../widgets/dashboard_panel.dart';
import '../widgets/filter_chip_bar.dart';
import 'entities_list_page.dart';
import 'contact_entity_page.dart';
import 'statistics_page.dart';
import 'help_page.dart';

class HeatmapPage extends StatefulWidget {
  const HeatmapPage({super.key});

  @override
  State<HeatmapPage> createState() => _HeatmapPageState();
}

class _HeatmapPageState extends State<HeatmapPage>
    with TickerProviderStateMixin {
  final HeatmapService _heatmapService = HeatmapService();
  final MapController _mapController = MapController();

  List<ZoneModel> _zones = [];
  List<ZoneModel> _filteredZones = [];
  bool _isLoading = true;
  String _selectedFilter = 'todos';
  String? _selectedZoneId;
  bool _showDashboard = true;

  int _totalProblems = 0;
  int _criticalCount = 0;
  int _warningCount = 0;

  final List<Map<String, dynamic>> _filterOptions = [
    {'value': 'todos', 'label': 'Todos', 'icon': Icons.apps},
    {'value': 'alagamento', 'label': 'Alagamento', 'icon': Icons.water_damage},
    {'value': 'buracos', 'label': 'Buracos', 'icon': Icons.warning_amber},
    {
      'value': 'iluminacao',
      'label': 'Iluminação',
      'icon': Icons.lightbulb_outline,
    },
    {'value': 'limpeza', 'label': 'Limpeza', 'icon': Icons.cleaning_services},
    {'value': 'saude', 'label': 'Saúde', 'icon': Icons.local_hospital},
    {'value': 'seguranca', 'label': 'Segurança', 'icon': Icons.security},
    {'value': 'transito', 'label': 'Trânsito', 'icon': Icons.traffic},
  ];

  static const LatLng _initialPosition = LatLng(-26.9194, -49.0661);
  static const double _initialZoom = 13.0;

  @override
  void initState() {
    super.initState();
    _loadHeatmapData();
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  Future<void> _loadHeatmapData() async {
    setState(() => _isLoading = true);
    try {
      final zones = await _heatmapService.fetchFromApi(filter: _selectedFilter);
      _calculateStatistics(zones);
      setState(() {
        _zones = zones;
        _applyFilter();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      _showSnackBar('Erro ao carregar dados: $e', isError: true);
    }
  }

  void _calculateStatistics(List<ZoneModel> zones) {
    _totalProblems = zones.fold(0, (sum, zone) => sum + zone.problemCount);
    _criticalCount = zones.where((z) => z.severity == 'critical').length;
    _warningCount = zones.where((z) => z.severity == 'warning').length;
  }

  void _applyFilter() {
    if (_selectedFilter == 'todos') {
      _filteredZones = List.from(_zones);
    } else {
      _filteredZones = _zones
          .where((zone) => zone.type == _selectedFilter)
          .toList();
    }
  }

  void _onFilterChanged(String value) {
    setState(() {
      _selectedFilter = value;
      _selectedZoneId = null;
      _applyFilter();
    });
  }

  void _onMapTap(TapPosition tapPosition, LatLng point) {
    final zone = PolygonMapper.findZoneAtPoint(point, _filteredZones);
    if (zone != null) {
      setState(() => _selectedZoneId = zone.id);
      _showZoneDetails(zone);
    } else {
      setState(() => _selectedZoneId = null);
    }
  }

  void _showZoneDetails(ZoneModel zone) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => ZoneDetailsSheet(
        zone: zone,
        onClose: () {
          Navigator.pop(context);
          setState(() => _selectedZoneId = null);
        },
        onViewDetails: () {
          Navigator.pop(context);
          _showFullZoneDetails(zone);
        },
      ),
    );
  }

  void _showFullZoneDetails(ZoneModel zone) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => ZoneDetailPage(zone: zone)),
    );
  }

  void _centerOnZone(ZoneModel zone) {
    final center = PolygonMapper.calculateCenter(zone.coordinates);
    _mapController.move(center, 15.0);
    setState(() => _selectedZoneId = zone.id);
  }

  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red[700] : Colors.green[700],
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: Stack(
        children: [
          _buildMap(),
          _buildCustomAppBar(),
          _buildFilterBar(),
          if (_showDashboard) _buildDashboard(),
          if (_isLoading) _buildLoadingOverlay(),
          _buildLegend(),
          _buildCriticalZonesList(),
        ],
      ),
      floatingActionButton: _buildFloatingActions(),
    );
  }

  Widget _buildCustomAppBar() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.white,
              Colors.white.withValues(alpha: 0.9),
              Colors.white.withValues(alpha: 0),
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E3A5F),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.map, color: Colors.white, size: 24),
                      SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'BLUMENAU',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1,
                            ),
                          ),
                          Text(
                            'Mapa de Calor',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                _buildIconButton(
                  icon: _showDashboard
                      ? Icons.dashboard
                      : Icons.dashboard_outlined,
                  onTap: () => setState(() => _showDashboard = !_showDashboard),
                  tooltip: 'Dashboard',
                  isActive: _showDashboard,
                ),
                const SizedBox(width: 8),
                PopupMenuButton<String>(
                  icon: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.menu,
                      color: Color(0xFF1E3A5F),
                      size: 22,
                    ),
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  onSelected: (value) {
                    if (value == 'entities') {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const EntitiesListPage(),
                        ),
                      );
                    } else if (value == 'statistics') {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const StatisticsPage(),
                        ),
                      );
                    } else if (value == 'help') {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const HelpPage(),
                        ),
                      );
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'entities',
                      child: Row(
                        children: [
                          Icon(Icons.business, color: Color(0xFF1E3A5F)),
                          SizedBox(width: 12),
                          Text('Órgãos Responsáveis'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'statistics',
                      child: Row(
                        children: [
                          Icon(Icons.bar_chart, color: Color(0xFF1E3A5F)),
                          SizedBox(width: 12),
                          Text('Estatísticas'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'help',
                      child: Row(
                        children: [
                          Icon(Icons.help_outline, color: Color(0xFF1E3A5F)),
                          SizedBox(width: 12),
                          Text('Ajuda'),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIconButton({
    required IconData icon,
    required VoidCallback onTap,
    required String tooltip,
    bool isActive = false,
  }) {
    return Tooltip(
      message: tooltip,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: isActive ? const Color(0xFF1E3A5F) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Icon(
            icon,
            color: isActive ? Colors.white : const Color(0xFF1E3A5F),
            size: 22,
          ),
        ),
      ),
    );
  }

  Widget _buildFilterBar() {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 70,
      left: 0,
      right: 0,
      child: FilterChipBar(
        filters: _filterOptions,
        selectedFilter: _selectedFilter,
        onFilterChanged: _onFilterChanged,
      ),
    );
  }

  Widget _buildDashboard() {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 130,
      left: 16,
      right: 16,
      child: DashboardPanel(
        totalProblems: _totalProblems,
        criticalCount: _criticalCount,
        warningCount: _warningCount,
        zonesCount: _zones.length,
      ),
    );
  }

  Widget _buildMap() {
    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _initialPosition,
        initialZoom: _initialZoom,
        minZoom: 10,
        maxZoom: 18,
        onTap: _onMapTap,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.blumenau.heatmap',
        ),
        PolygonLayer(
          polygons: _filteredZones.map((zone) {
            final isSelected = zone.id == _selectedZoneId;
            return Polygon(
              points: zone.coordinates,
              color: PolygonMapper.hexToColor(
                zone.color,
              ).withValues(alpha: isSelected ? 0.7 : 0.5),
              borderColor: isSelected
                  ? Colors.white
                  : PolygonMapper.hexToColor(zone.color),
              borderStrokeWidth: isSelected ? 4 : 2,
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildLoadingOverlay() {
    return Container(
      color: Colors.black26,
      child: const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Carregando dados...'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLegend() {
    return Positioned(
      bottom: 100,
      left: 16,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Legenda',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
            ),
            const SizedBox(height: 8),
            _buildLegendItem(Colors.red, 'Crítico'),
            _buildLegendItem(Colors.orange, 'Alerta'),
            _buildLegendItem(Colors.yellow, 'Moderado'),
            _buildLegendItem(Colors.green, 'Estável'),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildCriticalZonesList() {
    final criticalZones = _filteredZones
        .where((z) => z.severity == 'critical')
        .toList();
    if (criticalZones.isEmpty) return const SizedBox.shrink();

    return Positioned(
      bottom: 100,
      right: 16,
      child: Container(
        width: 180,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Row(
              children: [
                Icon(Icons.warning_amber, color: Colors.red, size: 16),
                SizedBox(width: 4),
                Text(
                  'Zonas Críticas',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: Colors.red,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...criticalZones
                .take(3)
                .map(
                  (zone) => InkWell(
                    onTap: () => _centerOnZone(zone),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              zone.name,
                              style: const TextStyle(fontSize: 11),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }

  Widget _buildFloatingActions() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        FloatingActionButton.small(
          heroTag: 'refresh',
          backgroundColor: Colors.white,
          onPressed: _loadHeatmapData,
          child: const Icon(Icons.refresh, color: Color(0xFF1E3A5F)),
        ),
        const SizedBox(height: 8),
        FloatingActionButton.small(
          heroTag: 'center',
          backgroundColor: Colors.white,
          onPressed: () => _mapController.move(_initialPosition, _initialZoom),
          child: const Icon(Icons.my_location, color: Color(0xFF1E3A5F)),
        ),
      ],
    );
  }
}

class ZoneDetailPage extends StatelessWidget {
  final ZoneModel zone;

  const ZoneDetailPage({super.key, required this.zone});

  @override
  Widget build(BuildContext context) {
    final Color zoneColor = PolygonMapper.hexToColor(zone.color);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: zoneColor,
        foregroundColor: Colors.white,
        title: Text(zone.name),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: zoneColor,
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(24),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        PolygonMapper.getSeverityIcon(zone.severity),
                        color: Colors.white,
                        size: 28,
                      ),
                      const SizedBox(width: 12),
                      Text(
                        zone.severityTitle,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    zone.severityDescription,
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      _buildStatBadge(
                        icon: Icons.report_problem,
                        value: '${zone.problemCount}',
                        label: 'Problemas',
                      ),
                      const SizedBox(width: 16),
                      _buildStatBadge(
                        icon: Icons.category,
                        value: zone.typeLabel,
                        label: 'Categoria',
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionTitle('Responsável'),
                  _buildInfoCard(
                    icon: Icons.person,
                    title: zone.responsavel,
                    subtitle:
                        'Última atualização: ${_formatDate(zone.lastUpdate)}',
                  ),
                  if (zone.responsibleEntity != null) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ContactEntityPage(
                                entity: zone.responsibleEntity!,
                                zone: zone,
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.phone_in_talk),
                        label: Text(
                          'Contatar ${zone.responsibleEntity!.acronym}',
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E3A5F),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  _buildSectionTitle('Descrição'),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
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
                    child: Text(
                      zone.description.isNotEmpty
                          ? zone.description
                          : 'Sem descrição disponível.',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[700],
                        height: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildSectionTitle('Problemas Recentes'),
                  ...zone.recentProblems.map(
                    (problem) => _buildProblemItem(problem),
                  ),
                  if (zone.recentProblems.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Nenhum problema recente registrado.',
                        style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                        textAlign: TextAlign.center,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBadge({
    required IconData icon,
    required String value,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                label,
                style: const TextStyle(color: Colors.white70, fontSize: 10),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Color(0xFF1E3A5F),
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
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
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF1E3A5F).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: const Color(0xFF1E3A5F)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProblemItem(String problem) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: PolygonMapper.hexToColor(zone.color),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(problem, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}
