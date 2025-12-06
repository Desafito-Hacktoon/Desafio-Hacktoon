# Mapa de Calor - Visão Executiva

App Flutter para visualização de mapa de calor da cidade, destinado a Prefeitos e Secretários.

## 📁 Estrutura do Projeto

```
lib/
├── main.dart                    # Ponto de entrada do app
├── models/
│   └── zone_model.dart          # Modelo de dados das zonas
├── pages/
│   └── heatmap_page.dart        # Página principal do mapa
├── services/
│   └── heatmap_service.dart     # Serviço para carregar dados
└── utils/
    └── polygon_mapper.dart      # Conversão GeoJSON → Polygon

assets/
└── mock/
    └── heatmap.json             # Dados mockados do mapa de calor
```

## 🚀 Configuração

### 1. Obter API Key do Google Maps

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Maps SDK for Android** e **Maps SDK for iOS**
4. Crie uma chave de API em **Credenciais**

### 2. Configurar Android

Edite o arquivo `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="SUA_API_KEY_AQUI"/>
```

### 3. Configurar iOS

Edite o arquivo `ios/Runner/AppDelegate.swift`:

```swift
GMSServices.provideAPIKey("SUA_API_KEY_AQUI")
```

### 4. Executar

```bash
flutter pub get
flutter run
```

## 🎨 Funcionalidades

- ✅ Mapa full-screen com Google Maps
- ✅ Polígonos coloridos por severidade
- ✅ Filtro por tipo de problema
- ✅ Modal de detalhes ao tocar em zona crítica
- ✅ Legenda do mapa
- ✅ UI minimalista e executiva

## 🎯 Filtros Disponíveis

| Filtro | Descrição |
|--------|-----------|
| Todos | Exibe todas as zonas |
| Buracos | Problemas de pavimentação |
| Iluminação | Problemas de iluminação pública |
| Limpeza | Problemas de limpeza urbana |
| Saúde | Problemas de saúde pública |

## 🔴 Níveis de Severidade

| Cor | Severidade | Descrição |
|-----|------------|-----------|
| 🔴 Vermelho | Crítico | Alta concentração de problemas |
| 🟠 Laranja | Alerta | Atenção necessária |
| 🟡 Amarelo | Moderado | Situação sob controle |
| 🟢 Verde | Estável | Poucos problemas |

## 📱 Screenshots

O app exibe:
- Mapa com polígonos coloridos representando zonas
- AppBar com título e filtro dropdown
- Legenda no canto inferior esquerdo
- Modal com detalhes ao tocar em uma zona

## 🔧 Tecnologias

- Flutter 3.x
- google_maps_flutter
- Material Design 3
