import {AfterViewInit, Component, OnDestroy, signal} from '@angular/core';
import * as L from 'leaflet';
import {HeatmapService} from '../services/heatmap.service';
import {HexagonUtil} from '../utils/hexagon.util';
import {ZardIconComponent} from '@shared/components/icon/icon.component';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  imports: [ZardIconComponent, CommonModule],
  templateUrl: './leaflet.map.html',
  styleUrls: ['./leaflet.map.css',]
})
export class LeafletMapComponent implements AfterViewInit, OnDestroy {
  map: any;
  hexagonLayers!: L.LayerGroup;
  private mapMoveEndHandler?: () => void;
  private mapZoomEndHandler?: () => void;
  private occurrenceData: Map<string, { count: number; intensity: number; point: [number, number] }> = new Map();
  showInfoTooltip = signal(true);

  constructor(private heatmapService: HeatmapService) {}

  ngAfterViewInit() {
    this.configureMap();
    this.loadOccurrenceData();
  }

  ngOnDestroy() {
    if (this.mapMoveEndHandler) {
      this.map.off('moveend', this.mapMoveEndHandler);
    }
    if (this.mapZoomEndHandler) {
      this.map.off('zoomend', this.mapZoomEndHandler);
    }
  }

  configureMap() {
    this.map = L.map('map', {
      center: [-26.9180776, -49.0745391],
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Inicializa o grupo de camadas de hexágonos
    this.hexagonLayers = L.layerGroup().addTo(this.map);

    // Atualiza hexágonos quando o mapa é movido ou dar zoom
    this.mapMoveEndHandler = () => this.updateHexagonGrid();
    this.mapZoomEndHandler = () => this.updateHexagonGrid();
    
    this.map.on('moveend', this.mapMoveEndHandler);
    this.map.on('zoomend', this.mapZoomEndHandler);
  }

  /**
   * Carrega dados de ocorrências do serviço
   */
  loadOccurrenceData() {
    this.heatmapService.getHexagonHeatmap().subscribe(data => {
      // Armazena os dados de ocorrências
      // Usa coordenadas como chave para matching geográfico
      this.occurrenceData.clear();
      
      data.features.forEach((feature: any) => {
        const coords = feature.geometry.coordinates;
        if (coords && coords.length >= 2) {
          // Verifica o formato: GeoJSON padrão é [lng, lat], mas nosso mock pode estar [lat, lng]
          // Se a primeira coordenada está entre -90 e 90, provavelmente é latitude
          let point: [number, number];
          if (Math.abs(coords[0]) <= 90 && Math.abs(coords[1]) <= 180) {
            // Formato [lat, lng] - já está correto
            point = [coords[0], coords[1]];
          } else {
            // Formato GeoJSON padrão [lng, lat] - precisa converter
            point = [coords[1], coords[0]];
          }
          
          const key = `${point[0].toFixed(4)}_${point[1].toFixed(4)}`;
          
          this.occurrenceData.set(key, {
            count: feature.properties?.occurrenceCount || 0,
            intensity: feature.properties?.intensity || 0,
            point: point
          });
        }
      });

      // Gera a grade hexagonal após carregar os dados
      this.updateHexagonGrid();
    });
  }

  /**
   * Atualiza a grade hexagonal baseada na área visível do mapa
   */
  updateHexagonGrid() {
    // Limpa hexágonos existentes
    this.hexagonLayers.clearLayers();

    // Obtém os bounds visíveis do mapa
    const bounds = this.map.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    // Gera a grade hexagonal com posições fixas
    // Os hexágonos sempre têm as mesmas posições no mundo real
    // Expande os bounds significativamente para garantir cobertura completa em todos os zooms
    const zoom = this.map.getZoom();
    // Margem maior em zooms distantes
    const margin = zoom < 10 ? 0.1 : zoom < 13 ? 0.05 : 0.02;
    
    const hexagons = HexagonUtil.generateHexagonGrid({
      bounds: { 
        north: north + margin, 
        south: south - margin, 
        east: east + margin, 
        west: west - margin 
      },
      hexSize: 200 // Não usado diretamente, mas mantido para compatibilidade
    });

    // Encontra ocorrências para cada hexágono baseado na localização geográfica
    // Usa coordenadas fixas para garantir que cada ocorrência sempre pertence ao mesmo hexágono
    const hexagonOccurrences = new Map<string, number>();
    
    this.occurrenceData.forEach((data, key) => {
      // Tenta encontrar o hexágono que contém este ponto usando a lista de hexágonos gerados
      let containingHex = HexagonUtil.findHexagonContainingPoint(data.point, hexagons);
      
      // Se não encontrou na lista, calcula diretamente usando coordenadas hexagonais
      if (!containingHex) {
        containingHex = HexagonUtil.findHexagonContainingPoint(data.point);
      }
      
      if (containingHex) {
        const current = hexagonOccurrences.get(containingHex.id) || 0;
        hexagonOccurrences.set(containingHex.id, current + data.count);
      }
    });

    // Encontra o máximo de ocorrências para normalizar cores
    const maxOccurrences = Math.max(
      ...Array.from(hexagonOccurrences.values()),
      1
    );
    
    // Renderiza cada hexágono
    hexagons.forEach(hex => {
      const count = hexagonOccurrences.get(hex.id) || 0;
      const intensity = count > 0 
        ? HexagonUtil.calculateIntensity(count, maxOccurrences)
        : 0;
      
      const color = HexagonUtil.getColorByIntensity(intensity);
      
      // Cria o polígono do hexágono
      // Bordas brancas finas para separação visual, mas hexágonos estão perfeitamente colados
      const hexagonPolygon = L.polygon(hex.coordinates, {
        color: count > 0 ? '#FFFFFF' : '#CCCCCC',
        weight: count > 0 ? 0.5 : 0.3,
        fillColor: color,
        fillOpacity: count > 0 ? 0.65 : 0.05, // Mostra levemente mesmo sem ocorrências
        opacity: 1.0
      });

      // Adiciona popup com informações
      if (count > 0) {
        const popupContent = `
          <div style="padding: 8px;">
            <strong>Hexágono ${hex.id}</strong><br>
            <span style="color: ${color}; font-weight: bold;">
              Ocorrências: ${count}
            </span><br>
            <span style="font-size: 0.9em; color: #666;">
              Intensidade: ${(intensity * 100).toFixed(0)}%
            </span>
          </div>
        `;
        hexagonPolygon.bindPopup(popupContent);
      }

      // Adiciona tooltip ao passar o mouse
      if (count > 0) {
        hexagonPolygon.bindTooltip(
          `${count} ocorrência${count !== 1 ? 's' : ''}`,
          {
            permanent: false,
            direction: 'top',
            offset: [0, -10]
          }
        );
      }

      // Adiciona ao grupo de camadas
      this.hexagonLayers.addLayer(hexagonPolygon);
    });
  }

  toggleInfoTooltip() {
    this.showInfoTooltip.set(!this.showInfoTooltip());
  }
}
