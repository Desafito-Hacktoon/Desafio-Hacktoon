import {AfterViewInit, Component, OnDestroy, signal} from '@angular/core';
import * as L from 'leaflet';
import {HeatmapService} from '../services/heatmap.service';
import {HexagonUtil} from '../utils/hexagon.util';
import {ZardIconComponent} from '@shared/components/icon/icon.component';
import {ZardSelectComponent} from '@shared/components/select/select.component';
import {ZardSelectItemComponent} from '@shared/components/select/select-item.component';
import {CommonModule} from '@angular/common';

type PeriodoSelecionado = 'hoje' | 'ontem' | 'essa-semana' | 'esse-mes' | 'ultimos-90-dias' | 'ultimo-ano';

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  imports: [
    ZardIconComponent, 
    CommonModule,
    ZardSelectComponent,
    ZardSelectItemComponent
  ],
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

  periodoSelecionado = signal<PeriodoSelecionado>('esse-mes');
  
  periodosOptions: { value: PeriodoSelecionado; label: string }[] = [
    { value: 'hoje', label: 'Hoje' },
    { value: 'ontem', label: 'Ontem' },
    { value: 'essa-semana', label: 'Essa Semana' },
    { value: 'esse-mes', label: 'Esse Mês' },
    { value: 'ultimos-90-dias', label: 'Últimos 90 Dias' },
    { value: 'ultimo-ano', label: 'Último Ano' }
  ];

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
   * Carrega dados de ocorrências do serviço com filtro de período
   */
  loadOccurrenceData() {
    const periodo = this.calcularPeriodo(this.periodoSelecionado());
    
    // Formatar datas no formato esperado pelo backend
    const periodoInicio = this.formatarDataParaAPI(periodo.inicio);
    const periodoFim = this.formatarDataParaAPI(periodo.fim);
    
    // Obtém os bounds visíveis do mapa se disponível
    let bounds = null;
    if (this.map) {
      const mapBounds = this.map.getBounds();
      bounds = {
        minLat: mapBounds.getSouth(),
        maxLat: mapBounds.getNorth(),
        minLng: mapBounds.getWest(),
        maxLng: mapBounds.getEast()
      };
    }
    
    this.heatmapService.getHexagonHeatmap({
      periodoInicio,
      periodoFim,
      ...bounds
    }).subscribe({
      next: (data) => {
        // Verifica se a resposta tem a estrutura esperada
        if (!data || !data.features) {
          this.occurrenceData.clear();
          this.updateHexagonGrid();
          return;
        }
        
        // Armazena os dados de ocorrências
        // Usa coordenadas como chave para matching geográfico
        this.occurrenceData.clear();
        
        data.features.forEach((feature: any) => {
          const geometry = feature.geometry;
          const geometryType = geometry?.type;
          const coords = geometry?.coordinates;
          
          let point: [number, number] | null = null;
          
          if (geometryType === 'Point' && coords && coords.length >= 2) {
            // Point geometry: [lng, lat]
            point = [coords[1], coords[0]]; // Converte para [lat, lng]
          } else if (geometryType === 'Polygon' && coords && coords.length > 0) {
            // Polygon geometry: [[[lng, lat], [lng, lat], ...]]
            // Extrai o primeiro ring (exterior ring)
            const ring = coords[0];
            if (ring && ring.length > 0) {
              // Calcula o centro do polígono (média das coordenadas)
              let sumLat = 0;
              let sumLng = 0;
              let validPoints = 0;
              
              // Itera pelos vértices (ignora o último se for igual ao primeiro - fechamento)
              const pointsToProcess = ring.length > 0 && 
                ring[0][0] === ring[ring.length - 1][0] && 
                ring[0][1] === ring[ring.length - 1][1]
                ? ring.slice(0, -1) // Remove fechamento
                : ring;
              
              pointsToProcess.forEach((vertex: number[]) => {
                if (vertex && vertex.length >= 2) {
                  sumLng += vertex[0]; // lng
                  sumLat += vertex[1]; // lat
                  validPoints++;
                }
              });
              
              if (validPoints > 0) {
                const centerLng = sumLng / validPoints;
                const centerLat = sumLat / validPoints;
                point = [centerLat, centerLng]; // [lat, lng] para Leaflet
              }
            }
          }
          
          if (point) {
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
      },
      error: (error) => {
        // Limpa dados em caso de erro
        this.occurrenceData.clear();
        this.updateHexagonGrid();
      }
    });
  }

  /**
   * Handler para mudança de período
   */
  onPeriodoChange(value: string | string[]) {
    const periodo = Array.isArray(value) ? value[0] : value;
    this.periodoSelecionado.set(periodo as PeriodoSelecionado);
    // Recarregar dados do mapa com o novo período
    this.loadOccurrenceData();
  }

  /**
   * Calcula as datas de início e fim baseado no período selecionado
   */
  private calcularPeriodo(periodo: PeriodoSelecionado): { inicio: Date; fim: Date } {
    const agora = new Date();
    const inicio = new Date();
    const fim = new Date();
    
    // Resetar horas para início do dia
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    
    switch (periodo) {
      case 'hoje':
        // Já está configurado acima
        break;
        
      case 'ontem':
        inicio.setDate(inicio.getDate() - 1);
        fim.setDate(fim.getDate() - 1);
        break;
        
      case 'essa-semana':
        // Segunda-feira da semana atual
        const diaSemana = inicio.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
        const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
        inicio.setDate(inicio.getDate() + diasParaSegunda);
        break;
        
      case 'esse-mes':
        inicio.setDate(1); // Primeiro dia do mês
        break;
        
      case 'ultimos-90-dias':
        inicio.setDate(inicio.getDate() - 90);
        break;
        
      case 'ultimo-ano':
        inicio.setFullYear(inicio.getFullYear() - 1);
        inicio.setMonth(0, 1); // Janeiro do ano passado
        inicio.setDate(1);
        break;
    }
    
    return { inicio, fim };
  }

  /**
   * Formata uma data para o formato esperado pela API (yyyy-MM-ddTHH:mm:ss)
   */
  private formatarDataParaAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
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
