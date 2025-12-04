import {Component, OnInit, computed, signal, inject} from '@angular/core';
import {DatePipe, NgClass, CommonModule} from '@angular/common';
import {DashboardService} from '../dashboardService/dashboard-service';
import {DashboardStatsResponse, PeriodoSelecionado} from '../../models/dashboard.models';
import {OcorrenciaFilterRequest, OcorrenciaResponse} from '../../models/ocorrencia.models';
import {OcorreciasService} from '../../ocorrencias/ocorrenciasService/ocorrecias-service';
import colors = require('tailwindcss/colors');
import {Piechart} from '../../models/piechart';
import {
  ZardTableComponent,
  ZardTableHeaderComponent,
  ZardTableBodyComponent,
  ZardTableRowComponent,
  ZardTableHeadComponent,
  ZardTableCellComponent,
} from '@shared/components/table/table.component';
import {ZardPaginationComponent} from '@shared/components/pagination/pagination.component';
import {ZardInputDirective} from '@shared/components/input/input.directive';
import {ZardSelectComponent} from '@shared/components/select/select.component';
import {ZardSelectItemComponent} from '@shared/components/select/select-item.component';
import {ZardButtonComponent} from '@shared/components/button/button.component';
import {ZardCardComponent} from '@shared/components/card/card.component';
import {ZardPieChartComponent} from '@shared/components/chart/pie-chart.component';
import {ZardLineChartComponent, LineChartData} from '@shared/components/chart/line-chart.component';
import {ZardDatePickerComponent} from '@shared/components/date-picker/date-picker.component';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    CommonModule,
    FormsModule,
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
    ZardPaginationComponent,
    ZardInputDirective,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardButtonComponent,
    ZardCardComponent,
    ZardPieChartComponent,
    ZardLineChartComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  ocorrenciasOriginais = signal<OcorrenciaResponse[]>([]);
  ocorrencias = signal<OcorrenciaResponse[]>([]);
  currentPage = signal(1);
  itemsPerPage = signal(5);
  itemsPerPageOptions = [5, 10, 20, 50];
  
  // Filtros
  filtroBusca = signal('');
  filtroStatus = signal<string>('');
  filtroBairro = signal<string>('');
  filtroTipo = signal<string>('');
  
  pieData!: Piechart;
  pieOptions: any;

  pieData2!: Piechart;
  pieOptions2: any;

  pieData3!: Piechart;
  pieOptions3: any;
  
  // Gráfico de linha - Ocorrências por dia
  lineChartData!: LineChartData;
  lineChartOptions: any;
  
  // Período selecionado para os cards e gráficos
  periodoSelecionado = signal<PeriodoSelecionado>('esse-mes');
  
  // Opções de período
  periodosOptions: { value: PeriodoSelecionado; label: string }[] = [
    { value: 'hoje', label: 'Hoje' },
    { value: 'ontem', label: 'Ontem' },
    { value: 'essa-semana', label: 'Essa Semana' },
    { value: 'esse-mes', label: 'Esse Mês' },
    { value: 'ultimos-90-dias', label: 'Últimos 90 Dias' },
    { value: 'ultimo-ano', label: 'Último Ano' }
  ];
  
  // Label do período selecionado
  periodoSelecionadoLabel = computed(() => {
    const periodo = this.periodoSelecionado();
    const option = this.periodosOptions.find(p => p.value === periodo);
    return option?.label || 'Período';
  });
  
  // Opções para os selects
  statusOptions = ['ABERTO', 'EM_ANDAMENTO', 'FECHADO'];
  bairrosOptions = computed(() => {
    const bairros = new Set(this.ocorrenciasOriginais().map(oc => oc.bairro));
    return Array.from(bairros).sort();
  });
  tiposOptions = computed(() => {
    const tipos = new Set(this.ocorrenciasOriginais().map(oc => oc.tipoProblema));
    return Array.from(tipos).sort();
  });

  // Estatísticas do backend
  dashboardStats = signal<DashboardStatsResponse | null>(null);
  isLoadingStats = signal(false);

  // Métricas para os cards (usando dados do backend quando disponível)
  totalOcorrencias = computed(() => {
    return this.dashboardStats()?.totalOcorrencias ?? this.ocorrenciasOriginais().length;
  });

  ocorrenciasCriticas = computed(() => {
    return this.dashboardStats()?.ocorrenciasCriticas ?? this.ocorrenciasOriginais().filter(oc => oc.gravidade >= 8).length;
  });

  ocorrenciasEmAndamento = computed(() => {
    return this.dashboardStats()?.ocorrenciasEmAndamento ?? this.ocorrenciasOriginais().filter(oc => 
      oc.status === 'EM_ANDAMENTO'
    ).length;
  });

  constructor(
    private dashboardService: DashboardService,
    private ocorrenciasService: OcorreciasService,
    private router: Router
  ) {}

  ngOnInit() {
    // Carregar estatísticas do dashboard com período padrão (esse mês)
    this.carregarEstatisticas();

    // Carregar ocorrências do período selecionado
    this.carregarOcorrencias();
  }

  get ocorrenciasDoMes(): OcorrenciaResponse[] {
    return this.ocorrencias();
  }

  aplicarFiltros() {
    let ocorrenciasFiltradas = [...this.ocorrenciasOriginais()];
    
    const busca = this.filtroBusca().toLowerCase().trim();
    if (busca) {
      ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => 
        oc.tipoProblema.toLowerCase().includes(busca) ||
        (oc.descricao?.toLowerCase() || '').includes(busca) ||
        oc.bairro.toLowerCase().includes(busca) ||
        (oc.endereco?.toLowerCase() || '').includes(busca) ||
        (oc.secretariaOrigem?.toLowerCase() || '').includes(busca)
      );
    }
    
    if (this.filtroStatus()) {
      ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => oc.status === this.filtroStatus());
    }
    
    if (this.filtroBairro()) {
      ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => oc.bairro === this.filtroBairro());
    }
    
    if (this.filtroTipo()) {
      ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => oc.tipoProblema === this.filtroTipo());
    }
    
    this.ocorrencias.set(ocorrenciasFiltradas);
    this.currentPage.set(1);
    this.atualizarGraficos();
  }

  onStatusChange(value: string | string[]) {
    this.filtroStatus.set(Array.isArray(value) ? value[0] || '' : value || '');
    this.aplicarFiltros();
  }

  onBairroChange(value: string | string[]) {
    this.filtroBairro.set(Array.isArray(value) ? value[0] || '' : value || '');
    this.aplicarFiltros();
  }

  onTipoChange(value: string | string[]) {
    this.filtroTipo.set(Array.isArray(value) ? value[0] || '' : value || '');
    this.aplicarFiltros();
  }

  limparFiltros() {
    this.filtroBusca.set('');
    this.filtroStatus.set('');
    this.filtroBairro.set('');
    this.filtroTipo.set('');
    this.aplicarFiltros();
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

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  onItemsPerPageChange(value: string | string[]) {
    const newValue = Array.isArray(value) ? parseInt(value[0]) : parseInt(value as string);
    if (!isNaN(newValue) && newValue > 0) {
      this.itemsPerPage.set(newValue);
      this.currentPage.set(1);
    }
  }

  navigateToDetail(id: string) {
    this.router.navigate(['/ocorrencias', id]);
  }

  atualizarGraficos() {
    const ocorrencias = this.ocorrencias();
    const stats = this.dashboardStats();
    
    // Se temos estatísticas do backend, usar elas (mais eficiente)
    if (stats) {
      this.atualizarGraficosComStats(stats);
      // Ainda atualizar gráfico de linha com ocorrências filtradas
      this.atualizarGraficoLinha();
      return;
    }
    
    // Fallback: calcular a partir das ocorrências locais
    // Gráfico por tipo de problema
    const tipos = ocorrencias.reduce((acc, oc) => {
      acc[oc.tipoProblema] = (acc[oc.tipoProblema] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieData = this.gerarPieData(tipos, ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9966FF']);
    this.pieOptions = this.gerarPieOptions();

    // Gráfico por bairro
    const bairros = ocorrencias.reduce((acc, oc) => {
      acc[oc.bairro] = (acc[oc.bairro] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieData2 = this.gerarPieData(bairros, ['#9C27B0', '#FF9800', '#03A9F4', '#8BC34A']);
    this.pieOptions2 = this.gerarPieOptions();

    // Gráfico por status
    const status = ocorrencias.reduce((acc, oc) => {
      acc[oc.status] = (acc[oc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    this.pieData3 = this.gerarPieData(status, ['#009688', '#f44335', '#ffc107']);
    this.pieOptions3 = this.gerarPieOptions();
    
    this.atualizarGraficoLinha();
  }

  private atualizarGraficosComStats(stats: DashboardStatsResponse) {
    this.pieData = this.gerarPieData(stats.ocorrenciasPorTipo, ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9966FF']);
    this.pieOptions = this.gerarPieOptions();

    this.pieData2 = this.gerarPieData(stats.ocorrenciasPorBairro, ['#9C27B0', '#FF9800', '#03A9F4', '#8BC34A']);
    this.pieOptions2 = this.gerarPieOptions();

    this.pieData3 = this.gerarPieData(stats.ocorrenciasPorStatus, ['#009688', '#f44335', '#ffc107', '#2196F3', '#FF9800', '#4CAF50']);
    this.pieOptions3 = this.gerarPieOptions();
  }
  
  atualizarGraficoLinha() {
    const periodo = this.calcularPeriodo(this.periodoSelecionado());
    const dataInicio = periodo.inicio;
    const dataFim = periodo.fim;
    
    let ocorrenciasFiltradas = [...this.ocorrenciasOriginais()];
    
    ocorrenciasFiltradas = ocorrenciasFiltradas.filter(oc => {
      const dataCriacao = new Date(oc.dataCriacao);
      return dataCriacao >= dataInicio && dataCriacao <= dataFim;
    });
    
    const ocorrenciasPorDia = ocorrenciasFiltradas.reduce((acc, oc) => {
      const dataCriacao = new Date(oc.dataCriacao);
      const dataFormatada = this.formatarData(dataCriacao);
      acc[dataFormatada] = (acc[dataFormatada] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Gerar todas as datas do período
    const todasAsDatas: string[] = [];
    const dataAtual = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    while (dataAtual <= fim) {
      todasAsDatas.push(this.formatarData(new Date(dataAtual)));
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    const labels = todasAsDatas.map(data => {
      const [dia, mes, ano] = data.split('/');
      return `${dia}/${mes}`;
    });
    
    const dados = todasAsDatas.map(data => ocorrenciasPorDia[data] || 0);
    
    this.lineChartData = {
      labels,
      datasets: [
        {
          label: 'Ocorrências',
          data: dados,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
    
    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (context: any) => {
              const index = context[0].dataIndex;
              return todasAsDatas[index];
            },
            label: (context: any) => {
              return `${context.dataset.label}: ${context.parsed.y} ocorrência(s)`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Data',
          },
          grid: {
            display: false,
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Quantidade de Ocorrências',
          },
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0,
          },
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
    };
  }
  
  formatarData(data: Date): string {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

    private gerarPieData(obj: Record<string, number>, color:string[]):Piechart{
      return {
        labels: Object.keys(obj),
        datasets: [
          {
            data: Object.values(obj),
            backgroundColor: color
          }
        ]
      };
    }

  private gerarPieOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Remove a legenda
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          boxPadding: 6
        }
      }
    };
  }

  /**
   * Calcula as datas de início e fim baseado no período selecionado
   * Retorna datas no timezone local, mas formatadas para UTC para evitar problemas
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
   * Formata uma data para o formato ISO 8601 esperado pelo Spring Boot
   * Formato: yyyy-MM-ddTHH:mm:ss
   * IMPORTANTE: Usa a HORA LOCAL do navegador.
   * Isso garante que se o usuário pede "Hoje a partir das 00:00", enviamos "00:00",
   * alinhando com o banco de dados que provavelmente armazena a data/hora local de criação.
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
    
    // Formatar datas no formato esperado pelo backend (sem timezone, usando horário local)
    const dataInicioFormatada = this.formatarDataParaAPI(periodo.inicio);
    const dataFimFormatada = this.formatarDataParaAPI(periodo.fim);
    
    // Usar o endpoint de ocorrências com filtros de data
    const filtros: OcorrenciaFilterRequest = {
      dataInicio: dataInicioFormatada,
      dataFim: dataFimFormatada
    };
    
    // Buscar todas as ocorrências do período (usando tamanho grande para pegar todas)
    this.ocorrenciasService.listar(filtros, 0, 1000, 'dataCriacao', 'DESC').subscribe({
      next: (response) => {
        this.ocorrenciasOriginais.set(response.content);
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('❌ Erro ao carregar ocorrências:', error);
        console.error('Detalhes do erro:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          url: error.url
        });
        // Limpar ocorrências em caso de erro
        this.ocorrenciasOriginais.set([]);
        this.ocorrencias.set([]);
      }
    });
  }

  /**
   * Carrega estatísticas do dashboard com o período selecionado
   */
  carregarEstatisticas() {
    this.isLoadingStats.set(true);
    const periodo = this.calcularPeriodo(this.periodoSelecionado());
    
    // Usar as datas formatadas para UTC (mesmo formato usado em carregarOcorrencias)
    const dataInicioFormatada = this.formatarDataParaAPI(periodo.inicio);
    const dataFimFormatada = this.formatarDataParaAPI(periodo.fim);

    this.dashboardService.getDashboardStats(dataInicioFormatada, dataFimFormatada).subscribe({
      next: (stats) => {
        this.dashboardStats.set(stats);
        this.isLoadingStats.set(false);
        // Atualizar gráficos com dados do backend
        this.atualizarGraficosComStats(stats);
      },
      error: (error) => {
        console.error('Erro ao carregar estatísticas:', error);
        console.error('Detalhes do erro:', {
          message: error.message,
          status: error.status,
          error: error.error
        });
        this.isLoadingStats.set(false);
      }
    });
  }

  /**
   * Handler para mudança de período
   */
  onPeriodoChange(value: string | string[]) {
    const periodo = Array.isArray(value) ? value[0] : value;
    this.periodoSelecionado.set(periodo as PeriodoSelecionado);
    // Recarregar tanto estatísticas quanto ocorrências
    this.carregarEstatisticas();
    this.carregarOcorrencias();
    // Atualizar gráfico de linha com o novo período
    this.atualizarGraficoLinha();
  }
}


