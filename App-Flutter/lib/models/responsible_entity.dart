/// Modelo que representa uma entidade responsável por resolver problemas
class ResponsibleEntity {
  final String id;
  final String name;
  final String acronym;
  final String description;
  final String phone;
  final String email;
  final String? whatsapp;
  final String address;
  final List<String> categories; // Tipos de problemas que resolve
  final String workingHours;
  final String? website;

  const ResponsibleEntity({
    required this.id,
    required this.name,
    required this.acronym,
    required this.description,
    required this.phone,
    required this.email,
    this.whatsapp,
    required this.address,
    required this.categories,
    required this.workingHours,
    this.website,
  });

  /// Lista de todas as entidades responsáveis de Blumenau
  static List<ResponsibleEntity> getAllEntities() {
    return [
      const ResponsibleEntity(
        id: 'samae',
        name: 'Serviço Autônomo Municipal de Água e Esgoto',
        acronym: 'SAMAE',
        description:
            'Responsável pelo abastecimento de água, tratamento de esgoto, coleta de resíduos sólidos e reciclagem em Blumenau.',
        phone: '(47) 3331-8400',
        email: 'ouvidoria@samae.com.br',
        whatsapp: '(47) 99997-6102',
        address: 'Rua Bahia, 1530 - CEP 89031-001 - Blumenau/SC',
        categories: ['agua', 'esgoto', 'limpeza', 'reciclagem', 'saneamento'],
        workingHours: 'Segunda a Sexta: 8h às 17h | Emergência 24h: 115',
        website: 'https://www.samae.com.br',
      ),
      const ResponsibleEntity(
        id: 'semob',
        name: 'Secretaria de Obras',
        acronym: 'SEMOB',
        description:
            'Responsável por obras públicas, pavimentação, manutenção de vias, construção de infraestrutura urbana.',
        phone: '(47) 3381-6000',
        email: 'semob@blumenau.sc.gov.br',
        address: 'Praça Victor Konder, 2 - Centro - Blumenau/SC',
        categories: [
          'buracos',
          'pavimentacao',
          'obras',
          'infraestrutura',
          'pontes',
          'viadutos',
        ],
        workingHours: 'Segunda a Sexta: 8h às 12h e 13h30 às 17h30',
        website: 'https://www.blumenau.sc.gov.br/secretarias/semob',
      ),
      const ResponsibleEntity(
        id: 'seurb',
        name: 'Secretaria de Serviços Urbanos',
        acronym: 'SEURB',
        description:
            'Conservação e manutenção urbana, incluindo limpeza de vias, roçada, poda de árvores e manutenção de praças.',
        phone: '(47) 3381-6148',
        email: 'seurb@blumenau.sc.gov.br',
        address:
            'Rua Norberto Seara Heusi, 892 - Escola Agrícola - Blumenau/SC',
        categories: [
          'limpeza',
          'poda',
          'rocada',
          'pracas',
          'calcadas',
          'manutencao',
        ],
        workingHours: 'Segunda a Sexta: 8h às 12h e 13h30 às 17h30',
      ),
      const ResponsibleEntity(
        id: 'semus',
        name: 'Secretaria de Promoção da Saúde',
        acronym: 'SEMUS',
        description:
            'Gestão da saúde pública municipal, UBS, pronto-socorros, campanhas de vacinação e vigilância sanitária.',
        phone: '(47) 3381-6087',
        email: 'semus@blumenau.sc.gov.br',
        address: 'Rua 2 de Setembro, 2624 - Itoupava Norte - Blumenau/SC',
        categories: [
          'saude',
          'ubs',
          'hospital',
          'vacinacao',
          'dengue',
          'epidemia',
        ],
        workingHours: 'Segunda a Sexta: 8h às 17h | UBS: Verificar horários',
        website: 'https://www.blumenau.sc.gov.br/secretarias/semus',
      ),
      const ResponsibleEntity(
        id: 'sedeci',
        name: 'Secretaria de Proteção e Defesa Civil',
        acronym: 'SEDECI',
        description:
            'Prevenção e resposta a desastres naturais, alagamentos, deslizamentos e situações de emergência.',
        phone: '199',
        email: 'defesacivil@blumenau.sc.gov.br',
        whatsapp: '(47) 99144-0199',
        address: 'Praça Victor Konder, 2 - Centro - Blumenau/SC',
        categories: [
          'alagamento',
          'deslizamento',
          'emergencia',
          'desastre',
          'enchente',
          'risco',
        ],
        workingHours: '24 horas',
        website: 'https://alertablu.blumenau.sc.gov.br',
      ),
      const ResponsibleEntity(
        id: 'celesc',
        name: 'Centrais Elétricas de Santa Catarina',
        acronym: 'CELESC',
        description:
            'Distribuição de energia elétrica, manutenção de postes, iluminação pública e redes elétricas.',
        phone: '0800 48 0196',
        email: 'faleconosco@celesc.com.br',
        address: 'Atendimento online e telefônico',
        categories: [
          'iluminacao',
          'energia',
          'postes',
          'fiacao',
          'queda_energia',
        ],
        workingHours: 'Emergência 24h | Atendimento: 8h às 18h',
        website: 'https://www.celesc.com.br',
      ),
      const ResponsibleEntity(
        id: 'smtt',
        name: 'Secretaria Municipal de Trânsito e Transportes',
        acronym: 'SMTT',
        description:
            'Gestão do trânsito, sinalização, semáforos, transporte público e fiscalização.',
        phone: '(47) 3381-6900',
        email: 'smtt@blumenau.sc.gov.br',
        address: 'Rua 7 de Setembro, 1135 - Centro - Blumenau/SC',
        categories: [
          'transito',
          'semaforos',
          'sinalizacao',
          'transporte',
          'onibus',
          'estacionamento',
        ],
        workingHours: 'Segunda a Sexta: 8h às 17h',
        website: 'https://www.blumenau.sc.gov.br/secretarias/smtt',
      ),
      const ResponsibleEntity(
        id: 'pm',
        name: 'Polícia Militar de Santa Catarina',
        acronym: 'PMSC',
        description:
            'Segurança pública, policiamento ostensivo, atendimento a ocorrências e emergências.',
        phone: '190',
        email: 'pm@sc.gov.br',
        address: 'Diversos batalhões em Blumenau',
        categories: [
          'seguranca',
          'furto',
          'roubo',
          'violencia',
          'vandalismo',
          'emergencia_policial',
        ],
        workingHours: '24 horas',
      ),
      const ResponsibleEntity(
        id: 'guarda',
        name: 'Guarda Municipal de Blumenau',
        acronym: 'GMB',
        description:
            'Proteção do patrimônio público, apoio à fiscalização e segurança comunitária.',
        phone: '153',
        email: 'guardamunicipal@blumenau.sc.gov.br',
        address:
            'Rua Ver. Maurício José Pacheco, 1000 - Itoupava Norte - Blumenau/SC',
        categories: [
          'seguranca',
          'patrimonio',
          'fiscalizacao',
          'ordem_publica',
        ],
        workingHours: '24 horas',
      ),
      const ResponsibleEntity(
        id: 'semmas',
        name: 'Secretaria do Meio Ambiente e Sustentabilidade',
        acronym: 'SEMMAS',
        description:
            'Fiscalização ambiental, licenciamento, preservação de áreas verdes e educação ambiental.',
        phone: '(47) 3381-6000',
        email: 'meioambiente@blumenau.sc.gov.br',
        address: 'Praça Victor Konder, 2 - Centro - Blumenau/SC',
        categories: [
          'meio_ambiente',
          'desmatamento',
          'poluicao',
          'animais',
          'areas_verdes',
          'licenciamento',
        ],
        workingHours: 'Segunda a Sexta: 8h às 12h e 13h30 às 17h30',
      ),
      const ResponsibleEntity(
        id: 'prefeitura',
        name: 'Prefeitura Municipal de Blumenau',
        acronym: 'PMB',
        description:
            'Órgão central da administração municipal. Encaminha demandas para secretarias específicas.',
        phone: '(47) 3381-6000',
        email: 'gabinete@blumenau.sc.gov.br',
        address:
            'Praça Victor Konder, 2 - Centro - CEP 89010-904 - Blumenau/SC',
        categories: ['geral', 'outros', 'informacoes', 'ouvidoria'],
        workingHours: 'Segunda a Sexta: 8h às 12h e 13h30 às 17h30',
        website: 'https://www.blumenau.sc.gov.br',
      ),
    ];
  }

  /// Retorna a entidade responsável pelo tipo de problema
  static ResponsibleEntity getByProblemType(String type) {
    final entities = getAllEntities();

    // Mapeamento de tipos de problemas para entidades
    switch (type.toLowerCase()) {
      case 'agua':
      case 'esgoto':
      case 'saneamento':
      case 'reciclagem':
        return entities.firstWhere((e) => e.id == 'samae');

      case 'buracos':
      case 'pavimentacao':
      case 'obras':
      case 'infraestrutura':
        return entities.firstWhere((e) => e.id == 'semob');

      case 'limpeza':
      case 'poda':
      case 'rocada':
      case 'pracas':
        return entities.firstWhere((e) => e.id == 'sesur');

      case 'saude':
      case 'ubs':
      case 'hospital':
      case 'dengue':
        return entities.firstWhere((e) => e.id == 'semus');

      case 'alagamento':
      case 'deslizamento':
      case 'enchente':
      case 'emergencia':
        return entities.firstWhere((e) => e.id == 'sedeci');

      case 'iluminacao':
      case 'energia':
      case 'postes':
        return entities.firstWhere((e) => e.id == 'celesc');

      case 'transito':
      case 'semaforos':
      case 'sinalizacao':
        return entities.firstWhere((e) => e.id == 'smtt');

      case 'seguranca':
      case 'furto':
      case 'roubo':
        return entities.firstWhere((e) => e.id == 'pm');

      case 'meio_ambiente':
      case 'poluicao':
      case 'desmatamento':
        return entities.firstWhere((e) => e.id == 'semmas');

      default:
        return entities.firstWhere((e) => e.id == 'prefeitura');
    }
  }

  /// Retorna a entidade por ID
  static ResponsibleEntity? getById(String id) {
    try {
      return getAllEntities().firstWhere((e) => e.id == id);
    } catch (e) {
      return null;
    }
  }
}
