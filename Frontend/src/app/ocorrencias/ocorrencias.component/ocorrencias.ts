import {Component, OnInit, computed, signal, inject} from '@angular/core';
import {OcorreciasService} from '../ocorrenciasService/ocorrecias-service';
import {RouterLink} from '@angular/router';
import {
  ZardTableComponent,
  ZardTableHeaderComponent,
  ZardTableBodyComponent,
  ZardTableRowComponent,
  ZardTableHeadComponent,
  ZardTableCellComponent,
} from '@shared/components/table/table.component';
import {CommonModule, DatePipe, NgClass} from '@angular/common';
import {ZardCardComponent} from '@shared/components/card/card.component';
import {ZardPaginationComponent} from '@shared/components/pagination/pagination.component';
import {ZardSelectComponent} from '@shared/components/select/select.component';
import {ZardSelectItemComponent} from '@shared/components/select/select-item.component';
import {OcorrenciaResponse, OcorrenciaFilterRequest} from '../../models/ocorrencia.models';
import {ZardInputDirective} from '@shared/components/input/input.directive';
import {ZardButtonComponent} from '@shared/components/button/button.component';
import {ZardIconComponent} from '@shared/components/icon/icon.component';
import type {ZardIcon} from '@shared/components/icon/icons';
import {ZardSegmentedComponent} from '@shared/components/segmented/segmented.component';
import {ZardDatePickerComponent} from '@shared/components/date-picker/date-picker.component';
import {PeriodoSelecionado} from '../../models/dashboard.models';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {OcorrenciaDetalheModalComponent} from '../components/ocorrencia-detalhe-modal.component';

@Component({
  selector: 'app-ocorrencias',
  imports: [
    RouterLink,
    CommonModule,
    NgClass,
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
    ZardCardComponent,
    ZardPaginationComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSegmentedComponent,
    ZardDatePickerComponent,
  ],
  templateUrl: './ocorrencias.html',
  styleUrl: './ocorrencias.css',
})
export class Ocorrencias implements OnInit {
  // dados base e filtrados
  ocorrenciasOriginais = signal<OcorrenciaResponse[]>([]);
  ocorrencias = signal<OcorrenciaResponse[]>([]);

  // paginação
  currentPage = signal(1);
  itemsPerPage = signal(20);
  itemsPerPageOptions = [5, 10, 20, 50];

  // filtros
  filtroBusca = signal('');
  filtroStatus = signal<string>('');
  filtroBairro = signal<string>('');
  filtroTipo = signal<string>('');

  // Período selecionado
  periodoSelecionado = signal<PeriodoSelecionado>('esse-mes');
  
  // Opções de período
  periodosOptions: { value: PeriodoSelecionado; label: string }[] = [
    { value: 'hoje', label: 'Hoje' },
    { value: 'ontem', label: 'Ontem' },
    { value: 'essa-semana', label: 'Essa Semana' },
    { value: 'esse-mes', label: 'Esse Mês' }
  ];
  
  // Período de datas selecionado para período customizado
  periodoDataSelecionado = signal<Date[] | null>(null);

  // Opções para os selects - todos os status disponíveis do enum StatusOcorrencia
  statusOptions = [
    'PENDENTE',
    'EM_AVALIACAO',
    'EM_ANDAMENTO',
    'PROBLEMA_IDENTIFICADO',
    'RESOLVIDO',
    'CANCELADO'
  ];

  bairrosOptions = computed(() => {
    const bairros = new Set(this.ocorrenciasOriginais().map(oc => oc.bairro));
    return Array.from(bairros).sort();
  });

  tiposOptions = computed(() => {
    const tipos = new Set(this.ocorrenciasOriginais().map(oc => oc.tipoProblema));
    return Array.from(tipos).sort();
  });


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

  private overlay = inject(Overlay);
  private modalOverlayRef?: OverlayRef;

  constructor(private ocorrenciasService: OcorreciasService) {}

  ngOnInit() {
    // Carregar ocorrências do período selecionado
    this.carregarOcorrencias();
  }

  /**
   * Calcula as datas de início e fim baseado no período selecionado
   * Se houver um período customizado selecionado, usa ele em vez do período pré-definido
   */
  private calcularPeriodo(periodo: PeriodoSelecionado): { inicio: Date; fim: Date } {
    // Se houver período customizado selecionado, usar ele
    const periodoCustom = this.periodoDataSelecionado();
    if (periodoCustom && periodoCustom.length === 2) {
      const inicio = new Date(periodoCustom[0]);
      const fim = new Date(periodoCustom[1]);
      inicio.setHours(0, 0, 0, 0);
      fim.setHours(23, 59, 59, 999);
      return { inicio, fim };
    }
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
    }
    
    return { inicio, fim };
  }

  /**
   * Formata uma data para o formato ISO 8601 esperado pelo Spring Boot
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
   * Carrega ocorrências do período selecionado usando o endpoint de ocorrências com filtros
   */
  carregarOcorrencias() {
    const periodo = this.calcularPeriodo(this.periodoSelecionado());
    
    // Formatar datas no formato esperado pelo backend
    const dataInicioFormatada = this.formatarDataParaAPI(periodo.inicio);
    const dataFimFormatada = this.formatarDataParaAPI(periodo.fim);
    
    // Usar o endpoint de ocorrências com filtros de data
    const filtros: OcorrenciaFilterRequest = {
      dataInicio: dataInicioFormatada,
      dataFim: dataFimFormatada
    };
    
    // Buscar todas as ocorrências do período
    this.ocorrenciasService.listar(filtros, 0, 1000, 'dataCriacao', 'DESC').subscribe({
      next: (response) => {
        this.ocorrenciasOriginais.set(response.content);
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('❌ Erro ao carregar ocorrências:', error);
        // Limpar ocorrências em caso de erro
        this.ocorrenciasOriginais.set([]);
        this.ocorrencias.set([]);
      }
    });
  }

  /**
   * Handler para mudança de período no segmented
   */
  onPeriodoChange(periodo: string) {
    this.periodoSelecionado.set(periodo as PeriodoSelecionado);
    // Limpar período customizado quando selecionar período pré-definido
    this.periodoDataSelecionado.set(null);
    // Recarregar ocorrências
    this.carregarOcorrencias();
  }

  /**
   * Handler para mudança de período de datas customizado
   */
  onDataChange(dates: Date | Date[] | null) {
    if (dates === null) {
      this.periodoDataSelecionado.set(null);
      return;
    }
    
    const datesArray = Array.isArray(dates) ? dates : [dates];
    
    // Quando apenas uma data é selecionada, armazenar temporariamente
    if (datesArray.length === 1) {
      this.periodoDataSelecionado.set(datesArray);
      // Limpar seleção do segmented quando começar a selecionar data
      this.periodoSelecionado.set('esse-mes');
      return;
    }
    
    // Quando um período completo é selecionado (duas datas), recarregar dados
    if (datesArray.length === 2) {
      // Ordenar as datas para garantir que a primeira seja o início e a segunda o fim
      const sortedDates = [...datesArray].sort((a, b) => a.getTime() - b.getTime());
      this.periodoDataSelecionado.set(sortedDates);
      
      // Limpar seleção do segmented quando período customizado é selecionado
      this.periodoSelecionado.set('esse-mes');
      
      // Recarregar ocorrências com o período customizado
      this.carregarOcorrencias();
    }
  }

  paginatedOcorrencias = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.ocorrencias().slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.ocorrencias().length / this.itemsPerPage());
  });

  paginationInfo = computed(() => {
    const total = this.ocorrencias().length;
    const start = total === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage(), total);
    return {
      start,
      end,
      total,
      currentPage: this.currentPage(),
      totalPages: this.totalPages(),
    };
  });

  aplicarFiltros() {
    let filtradas = [...this.ocorrenciasOriginais()];

    const busca = this.filtroBusca().toLowerCase().trim();
    if (busca) {
      filtradas = filtradas.filter(oc =>
        oc.tipoProblema.toLowerCase().includes(busca) ||
        (oc.descricao?.toLowerCase() || '').includes(busca) ||
        oc.bairro.toLowerCase().includes(busca) ||
        (oc.endereco?.toLowerCase() || '').includes(busca) ||
        (oc.secretariaOrigem?.toLowerCase() || '').includes(busca),
      );
    }

    if (this.filtroStatus()) {
      filtradas = filtradas.filter(oc => oc.status === this.filtroStatus());
    }

    if (this.filtroBairro()) {
      filtradas = filtradas.filter(oc => oc.bairro === this.filtroBairro());
    }

    if (this.filtroTipo()) {
      filtradas = filtradas.filter(oc => oc.tipoProblema === this.filtroTipo());
    }

    this.ocorrencias.set(filtradas);
    this.currentPage.set(1);
  }

  onStatusChange(value: string | string[]) {
    this.filtroStatus.set(Array.isArray(value) ? (value[0] ?? '') : (value ?? ''));
    this.aplicarFiltros();
  }

  onBairroChange(value: string | string[]) {
    this.filtroBairro.set(Array.isArray(value) ? (value[0] ?? '') : (value ?? ''));
    this.aplicarFiltros();
  }

  onTipoChange(value: string | string[]) {
    this.filtroTipo.set(Array.isArray(value) ? (value[0] ?? '') : (value ?? ''));
    this.aplicarFiltros();
  }

  limparFiltros() {
    this.filtroBusca.set('');
    this.filtroStatus.set('');
    this.filtroBairro.set('');
    this.filtroTipo.set('');
    this.aplicarFiltros();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  onItemsPerPageChange(value: string | string[]) {
    const newValue = Array.isArray(value) ? parseInt(value[0], 10) : parseInt(value as string, 10);
    if (!isNaN(newValue) && newValue > 0) {
      this.itemsPerPage.set(newValue);
      this.currentPage.set(1);
    }
  }

  /**
   * Retorna a classe CSS apropriada para o badge de status (estilo minimalista com bordas e texto coloridos)
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'EM_ANDAMENTO':
        return 'border border-blue-500 text-blue-600 bg-transparent';
      case 'CANCELADO':
        return 'border border-red-500 text-red-600 bg-transparent';
      case 'RESOLVIDO':
        return 'border border-green-500 text-green-600 bg-transparent';
      case 'PROBLEMA_IDENTIFICADO':
        return 'border border-orange-500 text-orange-600 bg-transparent';
      case 'PENDENTE':
        return 'border border-gray-500 text-gray-600 bg-transparent';
      case 'EM_AVALIACAO':
        return 'border border-yellow-500 text-yellow-600 bg-transparent';
      default:
        return 'border border-gray-500 text-gray-600 bg-transparent';
    }
  }

  /**
   * Retorna o ícone apropriado para cada status
   */
  getStatusIcon(status: string): ZardIcon {
    switch (status) {
      case 'PENDENTE':
      case 'EM_AVALIACAO':
      case 'EM_ANDAMENTO':
        return 'clock';
      case 'PROBLEMA_IDENTIFICADO':
        return 'circle-alert';
      case 'RESOLVIDO':
        return 'circle-check';
      case 'CANCELADO':
        return 'circle-x';
      default:
        return 'circle';
    }
  }

  /**
   * Formata o tipo de problema para exibição legível
   * Ex: BOCA_LOBO -> Boca de lobo
   */
  formatarTipoProblema(tipo: string): string {
    if (!tipo) return tipo;
    
    // Mapeamento de tipos específicos para textos mais legíveis
    const mapeamento: Record<string, string> = {
      'BOCA_LOBO': 'Boca de lobo',
      'GUIA_SARJETA': 'Guia ou sarjeta',
      'PONTE_VIADUTO': 'Ponte ou viaduto',
      'POSTE_CAIDO': 'Poste caído',
      'LAMPADA_QUEIMADA': 'Lâmpada queimada',
      'LIXO_ACUMULADO': 'Lixo acumulado',
      'COLETA_LIXO': 'Coleta de lixo',
      'PODA_ARVORE': 'Poda de árvore',
      'ARVORE_CAIDA': 'Árvore caída',
      'VAZAMENTO_AGUA': 'Vazamento de água',
      'ANIMAIS_ABANDONADOS': 'Animais abandonados',
      'ANIMAIS_SOLTOS': 'Animais soltos',
      'PARADA_ONIBUS': 'Parada de ônibus',
      'AREA_USO_DROGAS': 'Área de uso de drogas',
      'MOBILIARIO_URBANO': 'Mobiliário urbano',
      'ACADEMIA_AR_LIVRE': 'Academia ao ar livre',
    };

    // Se houver mapeamento específico, usar ele
    if (mapeamento[tipo]) {
      return mapeamento[tipo];
    }

    // Caso contrário, converter underscore para espaço e capitalizar
    return tipo
      .toLowerCase()
      .split('_')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  }

  /**
   * Abre o modal de detalhes da ocorrência
   */
  abrirModalDetalhes(ocorrencia: OcorrenciaResponse) {
    // Fechar modal anterior se existir
    this.fecharModal();

    // Criar novo overlay
    const positionStrategy = this.overlay.position()
      .global()
      .centerHorizontally()
      .centerVertically();

    this.modalOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      panelClass: 'modal-panel',
    });

    // Criar portal do componente modal
    const modalPortal = new ComponentPortal(OcorrenciaDetalheModalComponent);
    const modalInstance = this.modalOverlayRef.attach(modalPortal);

    // Configurar o componente modal
    const modalComponent = modalInstance.instance as OcorrenciaDetalheModalComponent;
    modalComponent.carregarDetalhes(ocorrencia.id);

    // Escutar eventos do modal
    modalComponent.close.subscribe(() => {
      this.fecharModal();
    });

    modalComponent.saved.subscribe((ocorrenciaAtualizada: OcorrenciaResponse) => {
      // Atualizar a ocorrência na lista
      const ocorrenciasAtuais = this.ocorrenciasOriginais();
      const index = ocorrenciasAtuais.findIndex(oc => oc.id === ocorrenciaAtualizada.id);
      if (index !== -1) {
        ocorrenciasAtuais[index] = ocorrenciaAtualizada;
        this.ocorrenciasOriginais.set([...ocorrenciasAtuais]);
        this.aplicarFiltros();
      }
      this.fecharModal();
    });
  }

  /**
   * Fecha o modal
   */
  fecharModal() {
    if (this.modalOverlayRef) {
      this.modalOverlayRef.detach();
      this.modalOverlayRef.dispose();
      this.modalOverlayRef = undefined;
    }
  }
}
