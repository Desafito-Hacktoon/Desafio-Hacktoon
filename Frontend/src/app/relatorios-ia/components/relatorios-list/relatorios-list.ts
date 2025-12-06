import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RelatorioIAService } from '../../services/relatorio-ia.service';
import {
  RelatorioResponse,
  RelatorioFilterRequest,
  TipoRelatorio,
  StatusRelatorio,
  PagedResponse
} from '../../../models/relatorio-ia.models';
import {
  ZardTableComponent,
  ZardTableHeaderComponent,
  ZardTableBodyComponent,
  ZardTableRowComponent,
  ZardTableHeadComponent,
  ZardTableCellComponent,
} from '@shared/components/table/table.component';
import { ZardPaginationComponent } from '@shared/components/pagination/pagination.component';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardSegmentedComponent } from '@shared/components/segmented/segmented.component';
import { ZardDatePickerComponent } from '@shared/components/date-picker/date-picker.component';
import { PeriodoSelecionado } from '../../../models/dashboard.models';

@Component({
  selector: 'app-relatorios-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DatePipe,
    NgClass,
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
    ZardPaginationComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardButtonComponent,
    ZardCardComponent,
    ZardIconComponent,
    ZardSegmentedComponent,
    ZardDatePickerComponent
  ],
  templateUrl: './relatorios-list.html',
  styleUrl: './relatorios-list.css'
})
export class RelatoriosListComponent implements OnInit {
  relatorios = signal<RelatorioResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  currentPage = signal(1);
  itemsPerPage = signal(20);
  itemsPerPageOptions = [10, 20, 50, 100];
  totalElements = signal(0);
  totalPages = computed(() => Math.ceil(this.totalElements() / this.itemsPerPage()));
  
  filtros: RelatorioFilterRequest = {};
  tipoRelatorioSelecionado = signal<string>('');
  statusSelecionado = signal<string>('');
  
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
  
  TipoRelatorio = TipoRelatorio;
  StatusRelatorio = StatusRelatorio;
  tiposRelatorio = Object.values(TipoRelatorio);
  statusRelatorio = Object.values(StatusRelatorio);
  
  paginationInfo = computed(() => {
    const total = this.totalElements();
    const itemsPerPage = this.itemsPerPage();
    const currentPage = this.currentPage();
    const start = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, total);
    return { start, end, total, currentPage, totalPages: this.totalPages() };
  });
  
  paginatedRelatorios = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.relatorios().slice(start, end);
  });

  constructor(
    private relatorioIAService: RelatorioIAService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Aplicar filtros iniciais com período padrão
    this.aplicarFiltros();
  }

  carregarRelatorios(): void {
    this.loading.set(true);
    this.error.set(null);

    const page = this.currentPage() - 1; // Backend usa 0-based
    const size = this.itemsPerPage();

    this.relatorioIAService.listar(this.filtros, page, size).subscribe({
      next: (response: PagedResponse<RelatorioResponse>) => {
        this.relatorios.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erro ao carregar relatórios. Tente novamente.');
        this.loading.set(false);
        console.error('Erro ao carregar relatórios:', err);
      }
    });
  }

  /**
   * Calcula as datas de início e fim baseado no período selecionado
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
   * Formata uma data para o formato ISO 8601 esperado pelo backend
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

  aplicarFiltros(): void {
    this.filtros = {};
    const tipo = this.tipoRelatorioSelecionado();
    const status = this.statusSelecionado();
    
    if (tipo) {
      this.filtros.tipoRelatorio = tipo as TipoRelatorio;
    }
    if (status) {
      this.filtros.status = status as StatusRelatorio;
    }

    // Adicionar filtros de período
    const periodo = this.calcularPeriodo(this.periodoSelecionado());
    this.filtros.dataInicio = this.formatarDataParaAPI(periodo.inicio);
    this.filtros.dataFim = this.formatarDataParaAPI(periodo.fim);
    
    this.currentPage.set(1);
    this.carregarRelatorios();
  }

  limparFiltros(): void {
    this.tipoRelatorioSelecionado.set('');
    this.statusSelecionado.set('');
    this.periodoSelecionado.set('esse-mes');
    this.periodoDataSelecionado.set(null);
    this.filtros = {};
    this.currentPage.set(1);
    this.carregarRelatorios();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.carregarRelatorios();
  }

  onItemsPerPageChange(value: string | string[]): void {
    const newValue = Array.isArray(value) ? parseInt(value[0], 10) : parseInt(value as string, 10);
    if (!isNaN(newValue) && newValue > 0) {
      this.itemsPerPage.set(newValue);
      this.currentPage.set(1);
      this.carregarRelatorios();
    }
  }

  onTipoChange(value: string | string[]): void {
    const newValue = Array.isArray(value) ? value[0] : value;
    this.tipoRelatorioSelecionado.set(newValue);
  }

  onStatusChange(value: string | string[]): void {
    const newValue = Array.isArray(value) ? value[0] : value;
    this.statusSelecionado.set(newValue);
  }

  visualizarRelatorio(id: string): void {
    this.router.navigate(['/relatorios-ia', id]);
  }

  gerarRelatorioCustomizado(): void {
    this.router.navigate(['/relatorios-ia/gerar']);
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleString('pt-BR');
  }

  getStatusBadgeClass(status: StatusRelatorio): string {
    switch (status) {
      case StatusRelatorio.CONCLUIDO:
        return 'bg-green-100 text-green-800';
      case StatusRelatorio.GERANDO:
        return 'bg-yellow-100 text-yellow-800';
      case StatusRelatorio.ERRO:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTipoRelatorioLabel(tipo: TipoRelatorio): string {
    const labels: Record<TipoRelatorio, string> = {
      [TipoRelatorio.DIARIO]: 'Diário',
      [TipoRelatorio.SEMANAL]: 'Semanal',
      [TipoRelatorio.MENSAL]: 'Mensal',
      [TipoRelatorio.CUSTOMIZADO]: 'Customizado'
    };
    return labels[tipo] || tipo;
  }

  /**
   * Handler para mudança de período no segmented
   */
  onPeriodoChange(periodo: string): void {
    this.periodoSelecionado.set(periodo as PeriodoSelecionado);
    // Limpar período customizado quando selecionar período pré-definido
    this.periodoDataSelecionado.set(null);
    // Aplicar filtros com novo período
    this.aplicarFiltros();
  }

  /**
   * Handler para mudança de período de datas customizado
   */
  onDataChange(dates: Date | Date[] | null): void {
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
    
    // Quando um período completo é selecionado (duas datas), aplicar filtros
    if (datesArray.length === 2) {
      // Ordenar as datas para garantir que a primeira seja o início e a segunda o fim
      const sortedDates = [...datesArray].sort((a, b) => a.getTime() - b.getTime());
      this.periodoDataSelecionado.set(sortedDates);
      
      // Limpar seleção do segmented quando período customizado é selecionado
      this.periodoSelecionado.set('esse-mes');
      
      // Aplicar filtros com período customizado
      this.aplicarFiltros();
    }
  }
}

