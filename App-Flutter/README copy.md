# 🗺️ Blumenau - Mapa de Calor Executivo

Sistema de visualização e monitoramento de problemas urbanos desenvolvido para a Prefeitura Municipal de Blumenau.

## 📱 Visão Geral

O **Mapa de Calor Executivo** é uma ferramenta de gestão pública que permite aos executivos municipais (Prefeito, Secretários) visualizar em tempo real a situação das diferentes regiões da cidade, identificar zonas críticas e facilitar a comunicação com os órgãos responsáveis pela resolução dos problemas.

### 🎯 Principais Funcionalidades

- **Visualização em Mapa de Calor**: Polígonos coloridos indicando a gravidade da situação em cada bairro
- **Filtros por Categoria**: Filtre por alagamento, buracos, iluminação, limpeza, saúde, segurança e trânsito
- **Dashboard Executivo**: Estatísticas em tempo real sobre problemas e zonas críticas
- **Detalhes por Zona**: Informações completas sobre cada bairro ao tocar no mapa
- **Sistema de Contato**: Comunicação direta com órgãos responsáveis (SAMAE, SEMOB, CELESC, etc.)
- **Lista de Entidades**: Diretório completo de órgãos públicos com contatos

## 🏛️ Órgãos Responsáveis Integrados

| Órgão | Sigla | Responsabilidade |
|-------|-------|------------------|
| SAMAE | Água e Saneamento | Água, esgoto, resíduos |
| SEMOB | Secretaria de Obras | Pavimentação, drenagem |
| CELESC | Distribuição de Energia | Iluminação pública |
| SEMUS | Secretaria de Saúde | Postos de saúde, epidemias |
| SEDECI | Defesa Civil | Alagamentos, deslizamentos |
| SMTT | Mobilidade Urbana | Trânsito, sinalização |
| PM/GM | Segurança | Policiamento, segurança |
| SEMMAS | Meio Ambiente | Podas, áreas verdes |

## 🎨 Legenda de Cores

| Cor | Status | Significado |
|-----|--------|-------------|
| 🔴 Vermelho | **CRÍTICO** | Requer ação imediata |
| 🟠 Laranja | **ALERTA** | Atenção necessária |
| 🟡 Amarelo | **MODERADO** | Monitoramento ativo |
| 🟢 Verde | **ESTÁVEL** | Situação controlada |

## 🗂️ Estrutura do Projeto

```
lib/
├── main.dart                      # Entrada do app + Splash Screen
├── models/
│   ├── zone_model.dart            # Modelo de zona/bairro
│   └── responsible_entity.dart    # Modelo de órgão responsável
├── pages/
│   ├── heatmap_page.dart          # Página principal do mapa
│   ├── contact_entity_page.dart   # Página de contato com órgão
│   ├── entities_list_page.dart    # Lista de órgãos responsáveis
│   ├── statistics_page.dart       # Estatísticas detalhadas
│   └── help_page.dart             # Página de ajuda
├── services/
│   └── heatmap_service.dart       # Serviço de dados
├── utils/
│   └── polygon_mapper.dart        # Utilitário de polígonos
└── widgets/
    ├── zone_details_sheet.dart    # Modal de detalhes da zona
    ├── dashboard_panel.dart       # Painel de estatísticas
    └── filter_chip_bar.dart       # Barra de filtros
```

## 📍 Bairros de Blumenau Incluídos

O sistema inclui dados dos principais bairros de Blumenau com coordenadas reais:

- Centro
- Ponta Aguda
- Velha
- Garcia
- Itoupava Norte
- Itoupava Central
- Victor Konder
- Fortaleza
- Água Verde
- Vila Nova
- Progresso
- Vorstadt

## 🚀 Como Executar

### Pré-requisitos

- Flutter SDK 3.8.1+
- Dart SDK
- Chrome (para desenvolvimento web)

### Instalação

```bash
# Clone o repositório
git clone <repo-url>

# Entre na pasta do projeto
cd flutter_application_1

# Instale as dependências
flutter pub get

# Execute no Chrome
flutter run -d chrome

# OU execute em um emulador Android
flutter run -d android

# OU execute em um dispositivo iOS
flutter run -d ios
```

## 📦 Dependências

```yaml
dependencies:
  flutter_map: ^8.2.2      # Mapa OpenStreetMap
  latlong2: ^0.9.1         # Coordenadas geográficas
  url_launcher: ^6.2.1     # Abrir links, telefone, email
  http: ^1.6.0             # Requisições HTTP
```

## 🔒 Permissões Necessárias

### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

### iOS (ios/Runner/Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Necessário para mostrar sua localização no mapa</string>
```

## 📞 Contatos de Emergência

- **Prefeitura de Blumenau**: (47) 3381-6000
- **SAMAE**: (47) 3331-8400
- **Defesa Civil**: 199
- **Polícia Militar**: 190
- **SAMU**: 192
- **Bombeiros**: 193

## 🛠️ Tecnologias Utilizadas

- **Flutter** - Framework de desenvolvimento
- **OpenStreetMap** - Tiles do mapa
- **flutter_map** - Biblioteca de mapas
- **Material Design 3** - Interface do usuário

## 📄 Licença

Este projeto foi desenvolvido para uso interno da Prefeitura Municipal de Blumenau.

---

Desenvolvido com ❤️ para a cidade de Blumenau, SC - Brasil
