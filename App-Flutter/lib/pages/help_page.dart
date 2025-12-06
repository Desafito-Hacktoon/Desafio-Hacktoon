import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class HelpPage extends StatelessWidget {
  const HelpPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: const Color(0xFF135CE4),
        foregroundColor: Colors.white,
        title: const Text('Ajuda'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeaderCard(),
              const SizedBox(height: 24),
              _buildSectionTitle('Legenda do Mapa'),
              _buildLegendCard(),
              const SizedBox(height: 24),
              _buildSectionTitle('Categorias de Problemas'),
              _buildCategoriesCard(),
              const SizedBox(height: 24),
              _buildSectionTitle('Telefones de Emergência'),
              _buildEmergencyPhones(context),
              const SizedBox(height: 24),
              _buildSectionTitle('Como Usar'),
              _buildInstructionsCard(),
              const SizedBox(height: 24),
              _buildSectionTitle('Sobre o Sistema'),
              _buildAboutCard(),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderCard() {
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.help_outline,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Central de Ajuda',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Blumenau Heatmap',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'Sistema de monitoramento urbano para gestão de problemas em tempo real na cidade de Blumenau.',
            style: TextStyle(color: Colors.white70, fontSize: 14),
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
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Color(0xFF135CE4),
        ),
      ),
    );
  }

  Widget _buildLegendCard() {
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
        children: [
          _buildLegendItem(
            Colors.red,
            'Crítico',
            'Situação grave, requer ação imediata',
          ),
          const Divider(height: 24),
          _buildLegendItem(
            Colors.orange,
            'Alerta',
            'Situação preocupante, requer atenção',
          ),
          const Divider(height: 24),
          _buildLegendItem(
            Colors.amber,
            'Moderado',
            'Situação controlada, monitoramento',
          ),
          const Divider(height: 24),
          _buildLegendItem(Colors.green, 'Estável', 'Situação normal'),
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color color, String title, String description) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: color, width: 2),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: color,
                  fontSize: 15,
                ),
              ),
              Text(
                description,
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCategoriesCard() {
    final categories = [
      {
        'icon': '🕳️',
        'name': 'Buracos',
        'entity': 'SESUR',
        'desc': 'Infraestrutura viária',
      },
      {
        'icon': '💡',
        'name': 'Iluminação',
        'entity': 'CELESC',
        'desc': 'Postes e lâmpadas',
      },
      {
        'icon': '🧹',
        'name': 'Limpeza',
        'entity': 'SAMAE',
        'desc': 'Coleta e limpeza urbana',
      },
      {
        'icon': '🏥',
        'name': 'Saúde',
        'entity': 'SEMUS',
        'desc': 'Postos e atendimento',
      },
      {
        'icon': '🚔',
        'name': 'Segurança',
        'entity': 'PM/GMB',
        'desc': 'Policiamento e rondas',
      },
      {
        'icon': '🌊',
        'name': 'Alagamento',
        'entity': 'SEDECI',
        'desc': 'Defesa civil',
      },
      {
        'icon': '🚗',
        'name': 'Trânsito',
        'entity': 'SEMOB',
        'desc': 'Mobilidade e sinais',
      },
    ];

    return Container(
      padding: const EdgeInsets.all(16),
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
        children: categories.map((cat) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Text(cat['icon']!, style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        cat['name']!,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      Text(
                        cat['desc']!,
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF135CE4).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    cat['entity']!,
                    style: const TextStyle(
                      color: Color(0xFF135CE4),
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildEmergencyPhones(BuildContext context) {
    final phones = [
      {
        'name': 'SAMU',
        'number': '192',
        'icon': Icons.local_hospital,
        'color': Colors.red,
      },
      {
        'name': 'Bombeiros',
        'number': '193',
        'icon': Icons.local_fire_department,
        'color': Colors.orange,
      },
      {
        'name': 'Polícia Militar',
        'number': '190',
        'icon': Icons.local_police,
        'color': Colors.blue,
      },
      {
        'name': 'Defesa Civil',
        'number': '199',
        'icon': Icons.shield,
        'color': Colors.green,
      },
      {
        'name': 'Guarda Municipal',
        'number': '153',
        'icon': Icons.security,
        'color': Colors.purple,
      },
      {
        'name': 'Polícia Civil',
        'number': '197',
        'icon': Icons.policy,
        'color': Colors.indigo,
      },
    ];

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: phones.map((phone) {
        return GestureDetector(
          onTap: () => _makePhoneCall(phone['number'] as String),
          child: Container(
            width: (MediaQuery.of(context).size.width - 52) / 2,
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
                    color: (phone['color'] as Color).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    phone['icon'] as IconData,
                    color: phone['color'] as Color,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        phone['name'] as String,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        phone['number'] as String,
                        style: TextStyle(
                          color: phone['color'] as Color,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Future<void> _makePhoneCall(String number) async {
    final uri = Uri.parse('tel:$number');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Widget _buildInstructionsCard() {
    final instructions = [
      {
        'icon': Icons.map,
        'title': 'Navegue pelo mapa',
        'desc': 'Use gestos para mover e ampliar o mapa de Blumenau',
      },
      {
        'icon': Icons.touch_app,
        'title': 'Toque nas zonas',
        'desc': 'Clique em uma área colorida para ver detalhes do problema',
      },
      {
        'icon': Icons.filter_list,
        'title': 'Use os filtros',
        'desc': 'Filtre por categoria para ver problemas específicos',
      },
      {
        'icon': Icons.contact_mail,
        'title': 'Contate os responsáveis',
        'desc': 'Envie mensagens diretamente para os órgãos responsáveis',
      },
      {
        'icon': Icons.bar_chart,
        'title': 'Veja estatísticas',
        'desc': 'Acompanhe o panorama geral da cidade',
      },
    ];

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
        children: instructions.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFF135CE4),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Icon(
                  item['icon'] as IconData,
                  color: const Color(0xFF135CE4),
                  size: 22,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['title'] as String,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item['desc'] as String,
                        style: TextStyle(color: Colors.grey[600], fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildAboutCard() {
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF135CE4), Color(0xFF3F7AEE)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.location_city,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Blumenau Heatmap',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  Text(
                    'Versão 1.0.0',
                    style: TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            'Sistema desenvolvido para auxiliar os gestores públicos da cidade de Blumenau no monitoramento e gestão de problemas urbanos em tempo real.',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF135CE4).withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: Color(0xFF135CE4)),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Para suporte técnico ou dúvidas, entre em contato com a equipe de TI da Prefeitura.',
                    style: TextStyle(color: Colors.grey[700], fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
