import {AfterViewInit, Component, OnDestroy, signal, computed, inject} from '@angular/core';
import * as L from 'leaflet';
import {HeatmapService} from '../services/heatmap.service';
import {HexagonUtil, Hexagon} from '../utils/hexagon.util';
import {ZardIconComponent} from '@shared/components/icon/icon.component';
import {ZardSegmentedComponent} from '@shared/components/segmented/segmented.component';
import {ZardDatePickerComponent} from '@shared/components/date-picker/date-picker.component';
import {CommonModule} from '@angular/common';
import {Overlay} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {HexagonOccurrencesModalComponent} from '../components/hexagon-occurrences-modal.component';
import {OcorreciasService} from '../../ocorrencias/ocorrenciasService/ocorrecias-service';

type PeriodoSelecionado = 'hoje' | 'ontem' | 'essa-semana' | 'esse-mes' | '';

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  imports: [
    ZardIconComponent, 
    CommonModule,
    ZardSegmentedComponent,
    ZardDatePickerComponent
  ],
  templateUrl: './leaflet.map.html',
  styleUrls: ['./leaflet.map.css',]
})
export class LeafletMapComponent implements AfterViewInit, OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly ocorrenciasService = inject(OcorreciasService);
  private modalOverlayRef?: any;

  map: any;
  hexagonLayers!: L.LayerGroup;
  private mapMoveEndHandler?: () => void;
  private mapZoomEndHandler?: () => void;
  private occurrenceData: Map<string, { count: number; intensity: number; point: [number, number] }> = new Map();
  showInfoTooltip = signal(true);
  
  // Armazena os hexágonos renderizados para poder buscar ocorrências depois
  private renderedHexagons = new Map<string, Hexagon>();

  periodoSelecionado = signal<PeriodoSelecionado>('esse-mes');
  
  // Período de datas selecionado para período customizado
  periodoDataSelecionado = signal<Date[] | null>(null);
  
  periodosOptions: { value: PeriodoSelecionado; label: string }[] = [
    { value: 'hoje', label: 'Hoje' },
    { value: 'ontem', label: 'Ontem' },
    { value: 'essa-semana', label: 'Essa Semana' },
    { value: 'esse-mes', label: 'Esse Mês' }
  ];

  /**
   * Computed para o valor do segmented - retorna vazio se houver período customizado
   */
  periodoSegmentedValue = computed(() => {
    const periodoCustom = this.periodoDataSelecionado();
    // Se houver período customizado selecionado, não mostrar nenhum segmented selecionado
    if (periodoCustom && periodoCustom.length === 2) {
      return '';
    }
    return this.periodoSelecionado();
  });

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
    const periodo = this.calcularPeriodo();
    
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
   * Handler para mudança de período no segmented
   */
  onPeriodoChange(value: string | string[]) {
    const periodo = Array.isArray(value) ? value[0] : value;
    this.periodoSelecionado.set(periodo as PeriodoSelecionado);
    // Limpar período customizado quando um período pré-definido é selecionado
    this.periodoDataSelecionado.set(null);
    // Recarregar dados do mapa com o novo período
    this.loadOccurrenceData();
  }

  /**
   * Handler para mudança de período de datas customizado
   */
  onDataChange(dates: Date | Date[] | null) {
    if (dates === null) {
      this.periodoDataSelecionado.set(null);
      // Se o date picker for limpo, resetar o segmented para o valor padrão
      this.periodoSelecionado.set('esse-mes');
      this.loadOccurrenceData();
      return;
    }

    const datesArray = Array.isArray(dates) ? dates : [dates];

    // Limpar a seleção do segmented quando uma data é selecionada no date picker
    this.periodoSelecionado.set('' as PeriodoSelecionado);

    // Quando apenas uma data é selecionada, armazenar temporariamente
    if (datesArray.length === 1) {
      this.periodoDataSelecionado.set(datesArray);
      return;
    }

    // Quando um período completo é selecionado (duas datas), recarregar dados
    if (datesArray.length === 2) {
      // Ordenar as datas para garantir que a primeira seja o início e a segunda o fim
      const sortedDates = [...datesArray].sort((a, b) => a.getTime() - b.getTime());
      this.periodoDataSelecionado.set(sortedDates);

      // Recarregar dados do mapa com o período customizado
      this.loadOccurrenceData();
    }
  }

  /**
   * Calcula as datas de início e fim baseado no período selecionado ou período customizado
   */
  private calcularPeriodo(): { inicio: Date; fim: Date } {
    // Priorizar período customizado se disponível
    const periodoCustom = this.periodoDataSelecionado();
    if (periodoCustom && periodoCustom.length === 2) {
      const inicio = new Date(periodoCustom[0]);
      const fim = new Date(periodoCustom[1]);
      inicio.setHours(0, 0, 0, 0);
      fim.setHours(23, 59, 59, 999);
      return { inicio, fim };
    }

    // Caso contrário, usar período pré-definido
    const periodo = this.periodoSelecionado();
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
        
      default:
        // Valor padrão: esse mês
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
      
      const color = HexagonUtil.getColorByOccurrenceCount(count);
      const fillOpacity = HexagonUtil.getOpacityByOccurrenceCount(count);
      
      // Cria o polígono do hexágono
      // Bordas brancas finas para separação visual, mas hexágonos estão perfeitamente colados
      const hexagonPolygon = L.polygon(hex.coordinates, {
        color: count > 0 ? '#FFFFFF' : '#CCCCCC',
        weight: count > 0 ? 0.5 : 0.3,
        fillColor: color,
        fillOpacity: fillOpacity,
        opacity: 1.0
      });

      // Adiciona evento de clique para abrir modal com ocorrências
      if (count > 0) {
        hexagonPolygon.on('click', () => {
          this.abrirModalOcorrencias(hex);
        });
      }

      // Adiciona tooltip ao passar o mouse
      if (count > 0) {
        hexagonPolygon.bindTooltip(
          `${count} ocorrência${count !== 1 ? 's' : ''} - Clique para ver detalhes`,
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

  /**
   * Abre modal com ocorrências do hexágono selecionado
   */
  private abrirModalOcorrencias(hex: Hexagon) {
    // Fecha modal anterior se existir
    if (this.modalOverlayRef) {
      this.modalOverlayRef.detach();
    }

    // Cria overlay para o modal
    const overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    // Calcula bounding box do hexágono
    const coordinates = hex.coordinates;
    const lats = coordinates.map(coord => coord[0]);
    const lngs = coordinates.map(coord => coord[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Calcula período atual
    const periodo = this.calcularPeriodo();
    const periodoInicio = this.formatarDataParaAPI(periodo.inicio);
    const periodoFim = this.formatarDataParaAPI(periodo.fim);

    // Cria componente do modal
    const modalComponent = new ComponentPortal(HexagonOccurrencesModalComponent);
    const modalInstance = overlayRef.attach(modalComponent);
    const modalComponentInstance = modalInstance.instance as HexagonOccurrencesModalComponent;
    
    // Define loading inicial
    modalComponentInstance.isLoading.set(true);
    modalComponentInstance.ocorrencias.set([]);

    // Busca ocorrências dentro do hexágono
    this.ocorrenciasService.listar({
      dataInicio: periodoInicio,
      dataFim: periodoFim
    }, 0, 1000).subscribe({
      next: (response) => {
        // Filtra ocorrências que estão dentro do hexágono
        const ocorrenciasNoHexagono = response.content.filter(oc => {
          const lat = oc.latitude;
          const lng = oc.longitude;
          
          // Verifica se está dentro do bounding box primeiro (otimização)
          if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
            return false;
          }
          
          // Verifica se está dentro do hexágono usando o utilitário
          const point: [number, number] = [lat, lng];
          const hexContainingPoint = HexagonUtil.findHexagonContainingPoint(point);
          
          return hexContainingPoint?.id === hex.id;
        });

        modalComponentInstance.isLoading.set(false);
        modalComponentInstance.ocorrencias.set(ocorrenciasNoHexagono);
      },
      error: (error) => {
        console.error('Erro ao buscar ocorrências:', error);
        modalComponentInstance.isLoading.set(false);
        modalComponentInstance.ocorrencias.set([]);
      }
    });

    // Fecha modal quando o componente emitir close
    modalComponentInstance.close.subscribe(() => {
      overlayRef.detach();
      this.modalOverlayRef = undefined;
    });

    this.modalOverlayRef = overlayRef;
  }
}
