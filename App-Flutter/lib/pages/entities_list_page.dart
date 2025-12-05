import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/responsible_entity.dart';

class EntitiesListPage extends StatefulWidget {
  const EntitiesListPage({super.key});

  @override
  State<EntitiesListPage> createState() => _EntitiesListPageState();
}

class _EntitiesListPageState extends State<EntitiesListPage> {
  String _searchQuery = '';
  String _selectedCategory = 'todos';

  final List<Map<String, dynamic>> _categories = [
    {'value': 'todos', 'label': 'Todos', 'icon': Icons.apps},
    {'value': 'agua', 'label': 'Água/Esgoto', 'icon': Icons.water_drop},
    {'value': 'obras', 'label': 'Obras', 'icon': Icons.construction},
    {'value': 'saude', 'label': 'Saúde', 'icon': Icons.local_hospital},
    {'value': 'seguranca', 'label': 'Segurança', 'icon': Icons.security},
    {'value': 'iluminacao', 'label': 'Iluminação', 'icon': Icons.lightbulb},
  ];

  List<ResponsibleEntity> get _filteredEntities {
    var entities = ResponsibleEntity.getAllEntities();
    if (_selectedCategory != 'todos') {
      entities = entities
          .where((e) => e.categories.any((c) => c.contains(_selectedCategory)))
          .toList();
    }
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      entities = entities
          .where(
            (e) =>
                e.name.toLowerCase().contains(query) ||
                e.acronym.toLowerCase().contains(query) ||
                e.description.toLowerCase().contains(query),
          )
          .toList();
    }
    return entities;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: const Color(0xFF135CE4),
        foregroundColor: Colors.white,
        title: const Text('Órgãos Responsáveis'),
        elevation: 0,
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Color(0xFF135CE4),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
            ),
            child: Column(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: TextField(
                    onChanged: (value) => setState(() => _searchQuery = value),
                    decoration: InputDecoration(
                      hintText: 'Buscar órgão ou serviço...',
                      prefixIcon: const Icon(Icons.search),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () =>
                                  setState(() => _searchQuery = ''),
                            )
                          : null,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final category = _categories[index];
                      final isSelected = _selectedCategory == category['value'];
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(category['label']),
                          selected: isSelected,
                          onSelected: (selected) => setState(
                            () => _selectedCategory = category['value'],
                          ),
                          backgroundColor: Colors.white.withOpacity(0.1),
                          selectedColor: Colors.white,
                          labelStyle: TextStyle(
                            color: isSelected
                                ? const Color(0xFF135CE4)
                                : const Color.fromARGB(255, 0, 0, 0),
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                          checkmarkColor: const Color(0xFF135CE4),
                          side: BorderSide(
                            color: isSelected ? Colors.white : Colors.white30,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _filteredEntities.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search_off,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Nenhum órgão encontrado',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _filteredEntities.length,
                    itemBuilder: (context, index) =>
                        _buildEntityCard(_filteredEntities[index]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEntityCard(ResponsibleEntity entity) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF135CE4).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getEntityIcon(entity.id),
                    color: const Color(0xFF135CE4),
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entity.acronym,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF135CE4),
                        ),
                      ),
                      Text(
                        entity.name,
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              entity.description,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[700],
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(16),
              ),
            ),
            child: Column(
              children: [
                _buildContactRow(
                  icon: Icons.phone,
                  text: entity.phone,
                  onTap: () => _launchPhone(entity.phone),
                ),
                const SizedBox(height: 8),
                _buildContactRow(
                  icon: Icons.email,
                  text: entity.email,
                  onTap: () => _launchEmail(entity.email),
                ),
                if (entity.whatsapp != null) ...[
                  const SizedBox(height: 8),
                  _buildContactRow(
                    icon: Icons.chat,
                    text: entity.whatsapp!,
                    onTap: () => _launchWhatsApp(entity.whatsapp!),
                    color: Colors.green,
                  ),
                ],
                const SizedBox(height: 8),
                _buildContactRow(
                  icon: Icons.access_time,
                  text: entity.workingHours,
                  color: Colors.grey,
                ),
                const SizedBox(height: 8),
                _buildContactRow(
                  icon: Icons.location_on,
                  text: entity.address,
                  color: Colors.grey,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactRow({
    required IconData icon,
    required String text,
    Color? color,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Icon(icon, size: 18, color: color ?? const Color(0xFF135CE4)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 13,
                  color: onTap != null
                      ? const Color(0xFF135CE4)
                      : Colors.grey[700],
                  decoration: onTap != null ? TextDecoration.underline : null,
                ),
              ),
            ),
            if (onTap != null)
              Icon(Icons.open_in_new, size: 14, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  IconData _getEntityIcon(String id) {
    switch (id) {
      case 'samae':
        return Icons.water_drop;
      case 'semob':
        return Icons.construction;
      case 'sesur':
        return Icons.cleaning_services;
      case 'semus':
        return Icons.local_hospital;
      case 'sedeci':
        return Icons.warning_amber;
      case 'celesc':
        return Icons.lightbulb;
      case 'smtt':
        return Icons.traffic;
      case 'pm':
        return Icons.local_police;
      case 'guarda':
        return Icons.security;
      case 'semmas':
        return Icons.eco;
      default:
        return Icons.business;
    }
  }

  Future<void> _launchPhone(String phone) async {
    final phoneNumber = phone.replaceAll(RegExp(r'[^\d]'), '');
    final uri = Uri.parse('tel:$phoneNumber');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _launchEmail(String email) async {
    final uri = Uri.parse('mailto:$email');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  Future<void> _launchWhatsApp(String whatsapp) async {
    final phone = whatsapp.replaceAll(RegExp(r'[^\d]'), '');
    final uri = Uri.parse('https://wa.me/55$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
